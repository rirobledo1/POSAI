// src/app/api/quotations/[id]/convert-to-sale/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST: Convertir cotización a venta
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params

    // Obtener cotización completa
    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        customer: true,
        company: true,
        branch: true,
        items: {
          include: {
            product: true
          },
          orderBy: {
            sortOrder: 'asc'
          }
        }
      }
    })

    if (!quotation) {
      return NextResponse.json(
        { error: 'Cotización no encontrada' },
        { status: 404 }
      )
    }

    // Validar que no esté ya convertida
    if (quotation.convertedToSaleId) {
      return NextResponse.json(
        { 
          error: 'Esta cotización ya fue convertida a venta',
          saleId: quotation.convertedToSaleId
        },
        { status: 400 }
      )
    }

    // Validar que no esté cancelada
    if (quotation.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'No se puede convertir una cotización cancelada' },
        { status: 400 }
      )
    }

    // Validar que no esté expirada
    if (quotation.status === 'EXPIRED' || new Date() > new Date(quotation.validUntil)) {
      return NextResponse.json(
        { 
          error: 'La cotización ha expirado',
          validUntil: quotation.validUntil,
          suggestion: 'Puede crear una nueva cotización basada en esta'
        },
        { status: 400 }
      )
    }

    const data = await req.json()
    const paymentMethod = data.paymentMethod || 'EFECTIVO'

    // Verificar inventario disponible (si tiene sucursal)
    if (quotation.branchId) {
      for (const item of quotation.items) {
        const branchProduct = await prisma.branchProduct.findFirst({
          where: {
            productId: item.productId,
            branchId: quotation.branchId
          }
        })

        if (!branchProduct || branchProduct.stock < item.quantity) {
          return NextResponse.json(
            { 
              error: `Stock insuficiente para ${item.product.name}`,
              product: item.product.name,
              requested: item.quantity,
              available: branchProduct?.stock || 0
            },
            { status: 400 }
          )
        }
      }
    }

    // Generar número de venta (folio)
    const lastSale = await prisma.sale.findFirst({
      where: { companyId: quotation.companyId },
      orderBy: { createdAt: 'desc' },
      select: { folio: true }
    })
    
    const folio = generateSaleFolio(lastSale?.folio)

    // Crear la venta usando una transacción
    const sale = await prisma.$transaction(async (tx) => {
      // 1. Crear la venta
      const newSale = await tx.sale.create({
        data: {
          folio,
          customerId: quotation.customerId,
          userId: session.user.id,
          companyId: quotation.companyId,
          branchId: quotation.branchId,
          paymentMethod,
          subtotal: quotation.subtotal,
          tax: quotation.tax,
          total: quotation.total,
          status: 'COMPLETED',
          paymentStatus: data.paymentStatus || (paymentMethod === 'CREDITO' ? 'PENDING' : 'PAID'),
          notes: quotation.notes || 'Convertida desde cotización ' + quotation.quotationNumber,
          amountPaid: data.paymentStatus === 'PAID' ? quotation.total : 0,
          remainingBalance: data.paymentStatus === 'PAID' ? 0 : quotation.total,
          paidAmount: data.paidAmount || (data.paymentStatus === 'PAID' ? quotation.total : 0),
          changeAmount: data.changeAmount || 0,
          deliveryType: data.deliveryType || 'PICKUP'
        }
      })

      // 2. Crear items de la venta
      for (const item of quotation.items) {
        await tx.saleItem.create({
          data: {
            saleId: newSale.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.subtotal
          }
        })
      }

      // 3. Actualizar inventario si hay sucursal
      if (quotation.branchId) {
        for (const item of quotation.items) {
          // Actualizar stock en BranchProduct
          await tx.branchProduct.updateMany({
            where: {
              productId: item.productId,
              branchId: quotation.branchId
            },
            data: {
              stock: { decrement: item.quantity }
            }
          })

          // Crear movimiento de inventario
          const branchProduct = await tx.branchProduct.findFirst({
            where: {
              productId: item.productId,
              branchId: quotation.branchId
            }
          })

          const previousStock = (branchProduct?.stock || 0) + item.quantity
          const newStock = branchProduct?.stock || 0

          await tx.inventoryMovement.create({
            data: {
              product_id: item.productId,
              sale_id: newSale.id,
              type: 'SALIDA',
              quantity: item.quantity,
              previous_stock: previousStock,
              new_stock: newStock,
              reason: `Venta ${folio} - Conversión de cotización ${quotation.quotationNumber}`,
              companyId: quotation.companyId,
              branchId: quotation.branchId
            }
          })
        }
      }

      // 4. Actualizar cotización
      await tx.quotation.update({
        where: { id },
        data: {
          status: 'CONVERTED',
          convertedToSaleId: newSale.id,
          convertedAt: new Date()
        }
      })

      // 5. Actualizar deuda del cliente si es a crédito
      if (paymentMethod === 'CREDITO') {
        await tx.customer.update({
          where: { id: quotation.customerId },
          data: {
            currentDebt: { increment: quotation.total }
          }
        })
      }

      return newSale
    })

    // Obtener venta completa con relaciones
    const completeSale = await prisma.sale.findUnique({
      where: { id: sale.id },
      include: {
        customer: true,
        saleItems: {
          include: {
            product: true
          }
        },
        branch: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Cotización convertida a venta exitosamente',
      sale: completeSale,
      quotationId: quotation.id,
      quotationNumber: quotation.quotationNumber
    })

  } catch (error) {
    console.error('Error converting quotation to sale:', error)
    return NextResponse.json(
      { 
        error: 'Error al convertir cotización a venta',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}

// Función auxiliar para generar folio de venta
function generateSaleFolio(lastFolio?: string): string {
  const today = new Date()
  const year = today.getFullYear().toString().slice(-2)
  const month = (today.getMonth() + 1).toString().padStart(2, '0')
  const day = today.getDate().toString().padStart(2, '0')
  
  if (!lastFolio) {
    return `VTA-${year}${month}${day}-0001`
  }
  
  // Extraer número del último folio
  const lastNumber = parseInt(lastFolio.split('-').pop() || '0')
  const newNumber = (lastNumber + 1).toString().padStart(4, '0')
  
  return `VTA-${year}${month}${day}-${newNumber}`
}
