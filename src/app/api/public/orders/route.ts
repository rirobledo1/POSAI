// src/app/api/public/orders/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface CartItem {
  productId: string
  productName: string
  price: number
  quantity: number
}

interface OrderRequest {
  companySlug: string
  type: 'QUOTE' | 'SALE'
  paymentMethod?: 'STRIPE' | 'CASH_ON_DELIVERY'
  customer: {
    name: string
    email: string
    phone: string
    address?: string
  }
  items: CartItem[]
  notes?: string
}

/**
 * POST /api/public/orders
 * API pública para crear órdenes desde la tienda online
 * No requiere autenticación
 */
export async function POST(req: NextRequest) {
  try {
    const body: OrderRequest = await req.json()
    
    // Validar campos requeridos
    if (!body.companySlug || !body.type || !body.customer || !body.items?.length) {
      return NextResponse.json(
        { error: 'Datos incompletos' },
        { status: 400 }
      )
    }

    // Obtener la empresa
    const company = await prisma.company.findUnique({
      where: { slug: body.companySlug },
      select: {
        id: true,
        name: true,
        onlineStoreEnabled: true,
        allowOnlineQuotes: true,
        allowOnlineSales: true,
        taxRate: true
      }
    })

    if (!company) {
      return NextResponse.json(
        { error: 'Empresa no encontrada' },
        { status: 404 }
      )
    }

    // Validar que la tienda esté habilitada
    if (!company.onlineStoreEnabled) {
      return NextResponse.json(
        { error: 'Tienda en línea no disponible' },
        { status: 403 }
      )
    }

    // Validar tipo de orden
    if (body.type === 'QUOTE' && !company.allowOnlineQuotes) {
      return NextResponse.json(
        { error: 'Cotizaciones en línea no habilitadas' },
        { status: 403 }
      )
    }

    if (body.type === 'SALE' && !company.allowOnlineSales) {
      return NextResponse.json(
        { error: 'Ventas en línea no habilitadas' },
        { status: 403 }
      )
    }

    // Validar datos del cliente
    if (!body.customer.name || !body.customer.email || !body.customer.phone) {
      return NextResponse.json(
        { error: 'Datos del cliente incompletos' },
        { status: 400 }
      )
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.customer.email)) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      )
    }

    // Validar productos
    const productIds = body.items.map(item => item.productId)
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
        stock: true
      }
    })

    if (products.length !== body.items.length) {
      return NextResponse.json(
        { error: 'Algunos productos no están disponibles' },
        { status: 400 }
      )
    }

    // Verificar stock para ventas
    if (body.type === 'SALE') {
      for (const item of body.items) {
        const product = products.find(p => p.id === item.productId)
        if (product && product.stock < item.quantity) {
          return NextResponse.json(
            { error: `Stock insuficiente para ${product.name}` },
            { status: 400 }
          )
        }
      }
    }

    // Calcular totales
    const subtotal = body.items.reduce((sum, item) => {
      const product = products.find(p => p.id === item.productId)
      return sum + (Number(product?.price || item.price) * item.quantity)
    }, 0)

    const taxRate = Number(company.taxRate) / 100
    const tax = subtotal * taxRate
    const total = subtotal + tax

    // Generar número de orden único
    const orderCount = await prisma.onlineOrder.count({
      where: { companyId: company.id }
    })
    
    const orderNumber = `ON-${Date.now().toString(36).toUpperCase()}-${(orderCount + 1).toString().padStart(4, '0')}`

    // Preparar items con datos actualizados del producto
    const orderItems = body.items.map(item => {
      const product = products.find(p => p.id === item.productId)
      return {
        productId: item.productId,
        productName: product?.name || item.productName,
        price: Number(product?.price || item.price),
        quantity: item.quantity,
        subtotal: Number(product?.price || item.price) * item.quantity
      }
    })

    // Determinar estado inicial según tipo y método de pago
    let initialStatus: 'PENDING' | 'PROCESSING' = 'PENDING'
    let paymentStatus: string | null = null

    if (body.type === 'SALE') {
      if (body.paymentMethod === 'STRIPE') {
        // Stripe: La orden queda en PROCESSING hasta que el webhook confirme
        initialStatus = 'PROCESSING'
        paymentStatus = 'pending'
      } else {
        // Contra entrega: La orden queda PENDING hasta que el admin la procese
        initialStatus = 'PENDING'
        paymentStatus = 'pending'
      }
    }

    // Crear la orden
    const order = await prisma.onlineOrder.create({
      data: {
        orderNumber,
        companyId: company.id,
        type: body.type,
        status: initialStatus,
        customerName: body.customer.name,
        customerEmail: body.customer.email,
        customerPhone: body.customer.phone,
        customerAddress: body.customer.address,
        items: orderItems,
        subtotal,
        tax,
        total,
        paymentMethod: body.type === 'SALE' ? (body.paymentMethod || 'CASH_ON_DELIVERY') : null,
        paymentStatus,
        notes: body.notes
      }
    })

    // Si es venta con Stripe, devolver la info para crear PaymentIntent
    if (body.type === 'SALE' && body.paymentMethod === 'STRIPE') {
      return NextResponse.json({
        success: true,
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          total: Number(order.total),
          status: order.status
        },
        // Datos para crear PaymentIntent en el cliente
        requiresPayment: true,
        paymentData: {
          orderId: order.id,
          amount: Math.round(total * 100), // En centavos para Stripe
          currency: 'mxn'
        }
      })
    }

    // Para cotizaciones o contra entrega, la orden está lista
    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        type: order.type,
        total: Number(order.total),
        status: order.status,
        paymentMethod: order.paymentMethod
      },
      requiresPayment: false,
      message: body.type === 'QUOTE' 
        ? 'Cotización recibida. Te contactaremos pronto.'
        : 'Pedido recibido. Pago contra entrega.'
    })

  } catch (error) {
    console.error('Error creating online order:', error)
    return NextResponse.json(
      { error: 'Error al crear la orden' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/public/orders?orderNumber=XXX&email=XXX
 * Consultar estado de una orden (público)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const orderNumber = searchParams.get('orderNumber')
    const email = searchParams.get('email')

    if (!orderNumber || !email) {
      return NextResponse.json(
        { error: 'Se requiere número de orden y email' },
        { status: 400 }
      )
    }

    const order = await prisma.onlineOrder.findFirst({
      where: {
        orderNumber,
        customerEmail: email.toLowerCase()
      },
      include: {
        company: {
          select: {
            name: true,
            phone: true,
            email: true
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Orden no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      orderNumber: order.orderNumber,
      type: order.type,
      status: order.status,
      customerName: order.customerName,
      items: order.items,
      subtotal: Number(order.subtotal),
      tax: Number(order.tax),
      total: Number(order.total),
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt.toISOString(),
      company: order.company
    })

  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json(
      { error: 'Error al consultar orden' },
      { status: 500 }
    )
  }
}
