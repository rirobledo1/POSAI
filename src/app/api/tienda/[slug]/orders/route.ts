// src/app/api/tienda/[slug]/orders/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/tienda/[slug]/orders
 * Crear una orden online (cotización o compra)
 * No requiere autenticación - endpoint público
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const body = await req.json()

    // Validar datos requeridos
    const {
      type,          // 'QUOTE' | 'SALE'
      customer,      // { name, email, phone, address? }
      items,         // [{ productId, quantity, price }]
      notes,
      paymentMethod  // 'CASH_ON_DELIVERY' | 'STRIPE' (solo para SALE)
    } = body

    if (!type || !customer || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      )
    }

    // Validar tipo de orden
    if (!['QUOTE', 'SALE'].includes(type)) {
      return NextResponse.json(
        { error: 'Tipo de orden inválido' },
        { status: 400 }
      )
    }

    // Validar datos del cliente
    if (!customer.name || !customer.email || !customer.phone) {
      return NextResponse.json(
        { error: 'Datos del cliente incompletos' },
        { status: 400 }
      )
    }

    // Buscar empresa
    const company = await prisma.company.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        taxRate: true,
        onlineStoreEnabled: true,
        allowOnlineQuotes: true,
        allowOnlineSales: true,
        onlinePaymentEnabled: true,
        status: true
      }
    })

    if (!company) {
      return NextResponse.json(
        { error: 'Tienda no encontrada' },
        { status: 404 }
      )
    }

    // Verificar que la tienda esté habilitada
    if (!company.onlineStoreEnabled) {
      return NextResponse.json(
        { error: 'Tienda no disponible' },
        { status: 403 }
      )
    }

    // Verificar permisos según tipo de orden
    if (type === 'QUOTE' && !company.allowOnlineQuotes) {
      return NextResponse.json(
        { error: 'Las cotizaciones no están habilitadas para esta tienda' },
        { status: 403 }
      )
    }

    if (type === 'SALE' && !company.allowOnlineSales) {
      return NextResponse.json(
        { error: 'Las compras en línea no están habilitadas para esta tienda' },
        { status: 403 }
      )
    }

    // Validar y obtener productos
    const productIds = items.map((item: any) => item.productId)
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        companyId: company.id,
        active: true
      },
      select: {
        id: true,
        name: true,
        price: true,
        stock: true,
        description: true
      }
    })

    if (products.length !== productIds.length) {
      return NextResponse.json(
        { error: 'Algunos productos no están disponibles' },
        { status: 400 }
      )
    }

    // Validar stock y calcular totales
    const orderItems = []
    let itemsTotal = 0

    for (const item of items) {
      const product = products.find(p => p.id === item.productId)
      if (!product) continue

      // Verificar stock
      if (product.stock < item.quantity) {
        return NextResponse.json(
          { 
            error: `Stock insuficiente para ${product.name}. Disponible: ${product.stock}`,
            productId: product.id,
            available: product.stock
          },
          { status: 400 }
        )
      }

      const quantity = parseInt(item.quantity)
      const price = Number(product.price) // Usar precio actual del producto
      const subtotal = quantity * price

      orderItems.push({
        productId: product.id,
        productName: product.name,
        description: product.description || '',
        quantity,
        price,
        subtotal
      })

      itemsTotal += subtotal
    }

    // Calcular impuestos (los precios ya incluyen IVA)
    const taxRate = Number(company.taxRate) || 16
    const taxMultiplier = 1 + (taxRate / 100) // 1.16
    const subtotal = itemsTotal / taxMultiplier  // Sin IVA
    const tax = itemsTotal - subtotal  // IVA desglosado
    const total = itemsTotal  // Con IVA

    // Generar número de orden
    const timestamp = Date.now()
    const orderNumber = `WEB-${company.id.substring(0, 8).toUpperCase()}-${timestamp}`

    // Crear la orden online
    const order = await prisma.onlineOrder.create({
      data: {
        orderNumber,
        companyId: company.id,
        type,
        status: 'PENDING',
        
        // Datos del cliente
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        customerAddress: customer.address || null,
        
        // Items y totales
        items: orderItems,
        subtotal,
        tax,
        total,
        
        // Notas
        notes: notes || null,
        
        // Método de pago (solo para SALE)
        paymentMethod: type === 'SALE' ? (paymentMethod || 'CASH_ON_DELIVERY') : null,
        paymentStatus: type === 'SALE' ? 'pending' : null
      }
    })

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        type: order.type,
        status: order.status,
        customer: {
          name: order.customerName,
          email: order.customerEmail,
          phone: order.customerPhone
        },
        items: orderItems,
        totals: {
          subtotal: Number(subtotal.toFixed(2)),
          tax: Number(tax.toFixed(2)),
          total: Number(total.toFixed(2))
        },
        createdAt: order.createdAt
      },
      message: type === 'QUOTE' 
        ? 'Solicitud de cotización recibida. Nos pondremos en contacto pronto.'
        : 'Orden creada. Procede con el pago para completar tu compra.',
      nextStep: type === 'SALE' ? 'payment' : 'wait'
    })

  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { error: 'Error al crear la orden' },
      { status: 500 }
    )
  }
}
