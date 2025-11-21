// src/app/api/public/orders/pay/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface PaymentRequest {
  orderId: string
  cardData: {
    cardNumber: string
    cardName: string
    expiry: string
    cvv: string
    last4: string
    cardBrand: string
  }
}

/**
 * POST /api/public/orders/pay
 * Procesar pago con tarjeta para una orden online
 * CONVERSIÓN AUTOMÁTICA: Si el pago es exitoso, se crea una Sale automáticamente
 */
export async function POST(req: NextRequest) {
  try {
    const body: PaymentRequest = await req.json()
    
    if (!body.orderId || !body.cardData) {
      return NextResponse.json(
        { error: 'Datos de pago incompletos' },
        { status: 400 }
      )
    }

    // Obtener la orden
    const order = await prisma.onlineOrder.findUnique({
      where: { id: body.orderId },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            paymentMode: true,
            stripeSecretKey: true
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

    // Validar que sea una orden de venta con Stripe
    if (order.type !== 'SALE' || order.paymentMethod !== 'STRIPE') {
      return NextResponse.json(
        { error: 'Esta orden no requiere pago con tarjeta' },
        { status: 400 }
      )
    }

    // Validar que no esté ya pagada
    if (order.paymentStatus === 'paid') {
      return NextResponse.json(
        { error: 'Esta orden ya fue pagada' },
        { status: 400 }
      )
    }

    // Procesar pago (modo mock o Stripe real)
    const paymentMode = order.company.paymentMode || 'mock'
    let paymentResult: {
      success: boolean
      transactionId: string
      error?: string
    }

    if (paymentMode === 'mock') {
      // === MODO MOCK ===
      // Simular un pequeño delay para UX realista
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Generar transactionId mock
      paymentResult = {
        success: true,
        transactionId: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }
      
      console.log('💳 Pago MOCK procesado:', {
        orderId: order.id,
        amount: Number(order.total),
        last4: body.cardData.last4,
        brand: body.cardData.cardBrand,
        transactionId: paymentResult.transactionId
      })
    } else {
      // === MODO STRIPE REAL ===
      // TODO: Implementar con Stripe SDK
      // const stripe = new Stripe(order.company.stripeSecretKey!)
      // const paymentIntent = await stripe.paymentIntents.create({...})
      
      // Por ahora, devolver error si intentan usar Stripe real sin configurar
      if (!order.company.stripeSecretKey) {
        return NextResponse.json(
          { error: 'Stripe no está configurado para esta empresa' },
          { status: 500 }
        )
      }

      // Placeholder para Stripe real
      paymentResult = {
        success: false,
        transactionId: '',
        error: 'Stripe real aún no implementado. Use modo mock.'
      }
    }

    if (!paymentResult.success) {
      // Pago fallido
      await prisma.onlineOrder.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'failed',
          paymentError: paymentResult.error
        }
      })

      return NextResponse.json(
        { error: paymentResult.error || 'Error al procesar el pago' },
        { status: 400 }
      )
    }

    // === PAGO EXITOSO ===
    // CONVERSIÓN AUTOMÁTICA: Crear Sale
    
    // Obtener items con datos completos
    const orderItems = order.items as Array<{
      productId: string
      productName: string
      price: number
      quantity: number
      subtotal: number
    }>

    // Buscar o crear cliente
    let customer = await prisma.customer.findFirst({
      where: {
        companyId: order.companyId,
        OR: [
          { email: order.customerEmail },
          { phone: order.customerPhone }
        ]
      }
    })

    if (!customer) {
      // Crear cliente nuevo
      customer = await prisma.customer.create({
        data: {
          companyId: order.companyId,
          name: order.customerName,
          email: order.customerEmail,
          phone: order.customerPhone
        }
      })
    }

    // Generar número de venta
    const saleCount = await prisma.sale.count({
      where: { companyId: order.companyId }
    })
    const saleNumber = `V-${Date.now().toString(36).toUpperCase()}-${(saleCount + 1).toString().padStart(5, '0')}`

    // Crear la venta
    const sale = await prisma.sale.create({
      data: {
        saleNumber,
        companyId: order.companyId,
        branchId: null, // Las ventas online no tienen sucursal
        customerId: customer.id,
        userId: null, // Sin vendedor
        subtotal: order.subtotal,
        taxAmount: order.tax,
        total: order.total,
        paymentMethod: 'TARJETA',
        status: 'COMPLETADA',
        notes: `Venta online - Orden ${order.orderNumber} - Pago con ${body.cardData.cardBrand} ****${body.cardData.last4}`,
        items: {
          create: orderItems.map(item => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.price,
            totalPrice: item.subtotal
          }))
        }
      }
    })

    // Actualizar stock
    for (const item of orderItems) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity
          }
        }
      })
    }

    // Actualizar la orden online
    await prisma.onlineOrder.update({
      where: { id: order.id },
      data: {
        status: 'COMPLETED',
        paymentStatus: 'paid',
        paymentId: paymentResult.transactionId,
        convertedToSaleId: sale.id,
        convertedAt: new Date()
      }
    })

    console.log('✅ Venta creada automáticamente:', {
      orderNumber: order.orderNumber,
      saleNumber: sale.saleNumber,
      total: Number(sale.total)
    })

    // Respuesta exitosa
    return NextResponse.json({
      success: true,
      message: '¡Pago procesado exitosamente!',
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: 'COMPLETED',
        paymentStatus: 'paid'
      },
      sale: {
        id: sale.id,
        saleNumber: sale.saleNumber,
        total: Number(sale.total)
      },
      payment: {
        transactionId: paymentResult.transactionId,
        brand: body.cardData.cardBrand,
        last4: body.cardData.last4
      }
    })

  } catch (error) {
    console.error('Error processing payment:', error)
    return NextResponse.json(
      { error: 'Error al procesar el pago' },
      { status: 500 }
    )
  }
}
