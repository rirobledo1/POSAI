import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function getDateRange(type: 'day' | 'month') {
  const now = new Date()
  if (type === 'day') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const end = new Date(start)
    end.setDate(start.getDate() + 1)
    return { start, end }
  } else {
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    return { start, end }
  }
}

// GET para estadísticas de ventas, productos y envíos
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Helper para sumar campos
    async function getStats(start: Date, end: Date) {
      const sales = await prisma.sale.findMany({
        where: {
          createdAt: {
            gte: start,
            lt: end,
          },
        },
        select: {
          total: true,
          deliveryFee: true,
        },
      })
      let totalVentas = 0
      let totalEnvio = 0
      let totalProductos = 0
      for (const s of sales) {
        const total = Number(s.total || 0)
        const envio = Number(s.deliveryFee || 0)
        totalVentas += total
        totalEnvio += envio
        totalProductos += (total - envio)
      }
      return { totalVentas, totalEnvio, totalProductos }
    }

    // Rango del día
    const { start: dayStart, end: dayEnd } = getDateRange('day')
    // Rango del mes
    const { start: monthStart, end: monthEnd } = getDateRange('month')

    const dayStats = await getStats(dayStart, dayEnd)
    const monthStats = await getStats(monthStart, monthEnd)

    return NextResponse.json({
      day: dayStats,
      month: monthStats,
    })
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error)
    return NextResponse.json(
      { error: 'Error obteniendo estadísticas' },
      { status: 500 }
    )
  }
}