// API para estadísticas de recordatorios
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const companyId = session.user.companyId

    // Últimos 30 días
    const since = new Date()
    since.setDate(since.getDate() - 30)

    const logs = await prisma.emailLog.findMany({
      where: {
        companyId,
        type: {
          in: ['PAYMENT_REMINDER', 'OVERDUE_NOTICE']
        },
        createdAt: {
          gte: since
        }
      },
      select: {
        type: true,
        status: true
      }
    })

    const stats = {
      last30Days: {
        totalSent: logs.filter(l => l.status === 'SENT').length,
        remindersSent: logs.filter(l => l.type === 'PAYMENT_REMINDER' && l.status === 'SENT').length,
        overdueNoticesSent: logs.filter(l => l.type === 'OVERDUE_NOTICE' && l.status === 'SENT').length,
        failedCount: logs.filter(l => l.status === 'FAILED').length
      }
    }

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
