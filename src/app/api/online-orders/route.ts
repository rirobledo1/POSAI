// src/app/api/online-orders/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/online-orders
 * Obtener todas las órdenes online de la empresa del usuario
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener parámetros de búsqueda
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') // 'QUOTE' | 'SALE' | null
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Obtener el companyId del usuario
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { companyId: true }
    })

    if (!user?.companyId) {
      return NextResponse.json({ error: 'Usuario sin empresa' }, { status: 400 })
    }

    // Construir filtros
    const where: any = {
      companyId: user.companyId
    }

    if (type && (type === 'QUOTE' || type === 'SALE')) {
      where.type = type
    }

    if (status) {
      where.status = status
    }

    // Obtener órdenes
    const [orders, total] = await Promise.all([
      prisma.onlineOrder.findMany({
        where,
        include: {
          company: {
            select: {
              slug: true,
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit,
        skip: offset
      }),
      prisma.onlineOrder.count({ where })
    ])

    // Formatear respuesta
    const formattedOrders = orders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      type: order.type,
      status: order.status,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      customerAddress: order.customerAddress,
      items: order.items,
      subtotal: Number(order.subtotal),
      tax: Number(order.tax),
      total: Number(order.total),
      notes: order.notes,
      createdAt: order.createdAt.toISOString(),
      emailSentAt: order.emailSentAt?.toISOString() || null,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      saleId: order.saleId,
      company: {
        slug: order.company.slug,
        name: order.company.name
      }
    }))

    return NextResponse.json({
      orders: formattedOrders,
      total,
      limit,
      offset
    })

  } catch (error) {
    console.error('Error fetching online orders:', error)
    return NextResponse.json(
      { error: 'Error al obtener órdenes' },
      { status: 500 }
    )
  }
}
