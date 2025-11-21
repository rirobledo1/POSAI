import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { Decimal } from '@prisma/client/runtime/library'

// POST /api/online-orders/[id]/process
// Convierte un pedido web en una venta real
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const user = session.user as any

    // Buscar la orden
    const order = await prisma.onlineOrder.findUnique({
      where: { id },
      include: {
        company: true
      }
    })

    if (!order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
    }

    // Verificar que la orden pertenece a la empresa del usuario
    if (order.companyId !== user.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    // Verificar que la orden está pendiente
    if (order.status !== 'PENDING') {
      return NextResponse.json({ 
        error: `Este pedido ya fue procesado (estado: ${order.status})` 
      }, { status: 400 })
    }

    // Verificar que es tipo SALE (compra)
    if (order.type !== 'SALE') {
      return NextResponse.json({ 
        error: 'Solo se pueden procesar pedidos de tipo Compra, no Cotizaciones' 
      }, { status: 400 })
    }

    // Parsear los items
    const orderItems = order.items as Array<{
      productId: string
      productName: string
      quantity: number
      price: number
      subtotal: number
    }>

    // Verificar stock disponible para todos los productos
    const productIds = orderItems.map(item => item.productId)
    const products = await prisma.product.findMany({
      where: { 
        id: { in: productIds },
        companyId: order.companyId
      }
    })

    const stockErrors: string[] = []
    for (const item of orderItems) {
      const product = products.find(p => p.id === item.productId)
      if (!product) {
        stockErrors.push(`Producto "${item.productName}" no encontrado`)
      } else if (product.stock < item.quantity) {
        stockErrors.push(
          `Stock insuficiente para "${item.productName}": disponible ${product.stock}, solicitado ${item.quantity}`
        )
      }
    }

    if (stockErrors.length > 0) {
      return NextResponse.json({ 
        error: 'Error de stock',
        details: stockErrors
      }, { status: 400 })
    }

    // Crear todo en una transacción
    const result = await prisma.$transaction(async (tx) => {
      // 1. Buscar cliente existente por email Y teléfono (coincidencia exacta)
      let customer = await tx.customer.findFirst({
        where: {
          companyId: order.companyId,
          email: order.customerEmail,
          phone: order.customerPhone
        }
      })

      if (customer) {
        // Actualizar datos del cliente existente
        customer = await tx.customer.update({
          where: { id: customer.id },
          data: {
            name: order.customerName,
            address: order.customerAddress || customer.address
          }
        })
      } else {
        // Buscar solo por email
        customer = await tx.customer.findFirst({
          where: {
            companyId: order.companyId,
            email: order.customerEmail
          }
        })

        if (customer) {
          // Actualizar datos del cliente existente
          customer = await tx.customer.update({
            where: { id: customer.id },
            data: {
              name: order.customerName,
              phone: order.customerPhone,
              address: order.customerAddress || customer.address
            }
          })
        } else {
          // Crear nuevo cliente
          customer = await tx.customer.create({
            data: {
              name: order.customerName,
              email: order.customerEmail,
              phone: order.customerPhone,
              address: order.customerAddress || undefined,
              companyId: order.companyId
            }
          })
        }
      }

      // 2. Generar folio de venta
      const lastSale = await tx.sale.findFirst({
        where: { companyId: order.companyId },
        orderBy: { createdAt: 'desc' },
        select: { folio: true }
      })

      let nextNumber = 1
      if (lastSale?.folio) {
        const match = lastSale.folio.match(/\d+$/)
        if (match) {
          nextNumber = parseInt(match[0]) + 1
        }
      }

      const folio = `VTA-${nextNumber.toString().padStart(6, '0')}`

      // 3. Crear la venta
      const sale = await tx.sale.create({
        data: {
          folio,
          customerId: customer.id,
          userId: user.id,
          paymentMethod: order.paymentMethod === 'CASH_ON_DELIVERY' ? 'EFECTIVO' : 'TARJETA',
          subtotal: order.subtotal,
          tax: order.tax,
          total: order.total,
          paidAmount: order.total,
          changeAmount: new Decimal(0),
          deliveryType: order.customerAddress ? 'LOCAL' : 'PICKUP',
          status: 'COMPLETED',
          notes: `Pedido web ${order.orderNumber}${order.notes ? ` - ${order.notes}` : ''}`,
          amountPaid: order.total,
          remainingBalance: new Decimal(0),
          paymentStatus: order.paymentMethod === 'CASH_ON_DELIVERY' ? 'PENDING' : 'PAID',
          companyId: order.companyId,
          branchId: user.branchId || null
        }
      })

      // 4. Crear items de venta y actualizar inventario
      for (const item of orderItems) {
        const product = products.find(p => p.id === item.productId)!
        
        // Crear item de venta
        await tx.saleItem.create({
          data: {
            saleId: sale.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: new Decimal(item.price),
            total: new Decimal(item.subtotal)
          }
        })

        // Actualizar stock del producto
        const newStock = product.stock - item.quantity
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: newStock }
        })

        // Registrar movimiento de inventario
        await tx.inventoryMovement.create({
          data: {
            product_id: item.productId,
            sale_id: sale.id,
            type: 'SALIDA',
            quantity: item.quantity,
            previous_stock: product.stock,
            new_stock: newStock,
            reason: `Venta ${folio} - Pedido web ${order.orderNumber}`,
            companyId: order.companyId,
            branchId: user.branchId || null
          }
        })
      }

      // 5. Actualizar la orden online
      const updatedOrder = await tx.onlineOrder.update({
        where: { id: order.id },
        data: {
          status: 'COMPLETED',
          saleId: sale.id,
          customerId: customer.id,
          processedAt: new Date()
        }
      })

      return {
        order: updatedOrder,
        sale,
        customer
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Pedido procesado exitosamente',
      data: {
        orderId: result.order.id,
        orderNumber: result.order.orderNumber,
        saleId: result.sale.id,
        saleFolio: result.sale.folio,
        customerId: result.customer.id,
        customerName: result.customer.name
      }
    })

  } catch (error) {
    console.error('Error al procesar pedido:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
