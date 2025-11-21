import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface CancellationData {
  saleId: string
  cancellationType: 'FULL' | 'PARTIAL'
  reason: string
  refundAmount: number
  notes?: string
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Verificar permisos (solo ADMIN puede cancelar ventas)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No tienes permisos para cancelar ventas' },
        { status: 403 }
      )
    }

    const data: CancellationData = await request.json()

    // Validaciones
    if (!data.saleId || !data.reason || data.refundAmount < 0) {
      return NextResponse.json(
        { error: 'Datos de cancelación inválidos' },
        { status: 400 }
      )
    }

    // Verificar que la venta existe y no está ya cancelada
    const existingSale = await prisma.sale.findUnique({
      where: { id: data.saleId },
      include: {
        saleItems: {
          include: {
            product: true
          }
        }
      }
    })

    if (!existingSale) {
      return NextResponse.json(
        { error: 'Venta no encontrada' },
        { status: 404 }
      )
    }

    if (existingSale.status === 'CANCELLED' || existingSale.status === 'REFUNDED') {
      return NextResponse.json(
        { error: 'Esta venta ya está cancelada' },
        { status: 400 }
      )
    }

    // Validar monto de reembolso
    const maxRefund = parseFloat(existingSale.total.toString())
    if (data.refundAmount > maxRefund) {
      return NextResponse.json(
        { error: 'El monto de reembolso no puede exceder el total de la venta' },
        { status: 400 }
      )
    }

    // Usar transacción para asegurar consistencia
    const result = await prisma.$transaction(async (tx) => {
      // 1. Crear registro de cancelación
      const cancellation = await tx.saleCancellation.create({
        data: {
          saleId: data.saleId,
          cancellationType: data.cancellationType,
          reason: data.reason,
          refundAmount: data.refundAmount,
          cancelledBy: session.user.id,
          notes: data.notes
        }
      })

      // 2. Actualizar estado de la venta
      let newStatus: string
      if (data.cancellationType === 'FULL') {
        newStatus = data.refundAmount > 0 ? 'REFUNDED' : 'CANCELLED'
      } else {
        newStatus = 'PARTIAL_REFUND'
      }

      const updatedSale = await tx.sale.update({
        where: { id: data.saleId },
        data: { status: newStatus }
      })

      // 3. Restaurar inventario si es cancelación completa
      if (data.cancellationType === 'FULL') {
        for (const item of existingSale.saleItems) {
          // Actualizar stock del producto
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                increment: item.quantity
              }
            }
          })

          // Crear movimiento de inventario para la reversión
          await tx.inventoryMovement.create({
            data: {
              product_id: item.productId,
              sale_id: data.saleId,
              type: 'CANCEL_SALE',
              quantity: item.quantity,
              previous_stock: item.product.stock,
              new_stock: item.product.stock + item.quantity,
              reason: `Cancelación de venta ${existingSale.folio}: ${data.reason}`
            }
          })
        }
      }

      return { cancellation, updatedSale }
    })

    return NextResponse.json({
      success: true,
      message: 'Venta cancelada exitosamente',
      data: {
        cancellation: result.cancellation,
        sale: result.updatedSale
      }
    })

  } catch (error) {
    console.error('Error cancelando venta:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// GET: Obtener cancelaciones con filtros
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const saleId = searchParams.get('saleId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where = saleId ? { saleId } : {}

    const cancellations = await prisma.saleCancellation.findMany({
      where,
      include: {
        sale: {
          select: {
            folio: true,
            total: true,
            createdAt: true
          }
        },
        cancelledByUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        cancelledAt: 'desc'
      },
      take: limit,
      skip: offset
    })

    const total = await prisma.saleCancellation.count({ where })

    return NextResponse.json({
      success: true,
      data: {
        cancellations,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        }
      }
    })

  } catch (error) {
    console.error('Error obteniendo cancelaciones:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}