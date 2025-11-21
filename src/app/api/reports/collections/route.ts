// API para Reportes de Cobranza
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const companyId = session.user.companyId
    const { searchParams } = new URL(request.url)
    
    // Filtros opcionales
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const months = parseInt(searchParams.get('months') || '6') // Últimos 6 meses por defecto

    // Calcular rango de fechas
    const now = new Date()
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - months)

    const dateFilter = startDate && endDate 
      ? {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      : {
          gte: sixMonthsAgo
        }

    // 1. Obtener todos los pagos del período
    const payments = await prisma.customerPayment.findMany({
      where: {
        companyId,
        paymentDate: dateFilter
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true
          }
        },
        sale: {
          select: {
            folio: true
          }
        }
      },
      orderBy: {
        paymentDate: 'asc'
      }
    })

    // 2. Obtener todas las ventas a crédito
    const creditSales = await prisma.sale.findMany({
      where: {
        companyId,
        paymentMethod: 'CREDITO',
        createdAt: dateFilter
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    // 3. Obtener clientes con deuda actual
    const customersWithDebt = await prisma.customer.findMany({
      where: {
        companyId,
        currentDebt: {
          gt: 0
        }
      },
      select: {
        id: true,
        name: true,
        currentDebt: true,
        creditLimit: true
      },
      orderBy: {
        currentDebt: 'desc'
      }
    })

    // 4. Calcular métricas por mes
    const paymentsByMonth = payments.reduce((acc: any, payment) => {
      const monthKey = new Date(payment.paymentDate).toISOString().slice(0, 7) // YYYY-MM
      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: monthKey,
          total: 0,
          count: 0,
          byMethod: {} as any
        }
      }
      acc[monthKey].total += parseFloat(payment.amount.toString())
      acc[monthKey].count += 1
      
      // Por método de pago
      if (!acc[monthKey].byMethod[payment.paymentMethod]) {
        acc[monthKey].byMethod[payment.paymentMethod] = 0
      }
      acc[monthKey].byMethod[payment.paymentMethod] += parseFloat(payment.amount.toString())
      
      return acc
    }, {})

    const salesByMonth = creditSales.reduce((acc: any, sale) => {
      const monthKey = new Date(sale.createdAt).toISOString().slice(0, 7)
      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: monthKey,
          total: 0,
          count: 0
        }
      }
      acc[monthKey].total += parseFloat(sale.total.toString())
      acc[monthKey].count += 1
      return acc
    }, {})

    // 5. Distribución por método de pago
    const paymentsByMethod = payments.reduce((acc: any, payment) => {
      if (!acc[payment.paymentMethod]) {
        acc[payment.paymentMethod] = {
          method: payment.paymentMethod,
          total: 0,
          count: 0
        }
      }
      acc[payment.paymentMethod].total += parseFloat(payment.amount.toString())
      acc[payment.paymentMethod].count += 1
      return acc
    }, {})

    // 6. Top clientes por deuda
    const topDebtors = customersWithDebt.slice(0, 10).map(c => ({
      id: c.id,
      name: c.name,
      debt: parseFloat(c.currentDebt.toString()),
      limit: parseFloat(c.creditLimit.toString()),
      usagePercent: (parseFloat(c.currentDebt.toString()) / parseFloat(c.creditLimit.toString())) * 100
    }))

    // 7. Análisis de antigüedad de saldos
    const salesWithAge = await prisma.sale.findMany({
      where: {
        companyId,
        paymentStatus: {
          in: ['PENDING', 'PARTIAL']
        }
      },
      select: {
        id: true,
        folio: true,
        total: true,
        remainingBalance: true,
        createdAt: true,
        dueDate: true,
        customer: {
          select: {
            name: true
          }
        }
      }
    })

    const agingAnalysis = {
      current: { count: 0, amount: 0 },      // 0-30 días
      days30: { count: 0, amount: 0 },       // 31-60 días
      days60: { count: 0, amount: 0 },       // 61-90 días
      days90: { count: 0, amount: 0 },       // 91-120 días
      overdue: { count: 0, amount: 0 }       // Más de 120 días
    }

    salesWithAge.forEach(sale => {
      const daysOld = Math.floor((now.getTime() - new Date(sale.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      const balance = parseFloat(sale.remainingBalance.toString())

      if (daysOld <= 30) {
        agingAnalysis.current.count++
        agingAnalysis.current.amount += balance
      } else if (daysOld <= 60) {
        agingAnalysis.days30.count++
        agingAnalysis.days30.amount += balance
      } else if (daysOld <= 90) {
        agingAnalysis.days60.count++
        agingAnalysis.days60.amount += balance
      } else if (daysOld <= 120) {
        agingAnalysis.days90.count++
        agingAnalysis.days90.amount += balance
      } else {
        agingAnalysis.overdue.count++
        agingAnalysis.overdue.amount += balance
      }
    })

    // 8. Métricas generales
    const totalCollected = payments.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0)
    const totalSales = creditSales.reduce((sum, s) => sum + parseFloat(s.total.toString()), 0)
    const totalDebt = customersWithDebt.reduce((sum, c) => sum + parseFloat(c.currentDebt.toString()), 0)
    
    const collectionRate = totalSales > 0 ? (totalCollected / totalSales) * 100 : 0
    const averagePayment = payments.length > 0 ? totalCollected / payments.length : 0

    // 9. Top clientes por pagos
    const paymentsByCustomer = payments.reduce((acc: any, payment) => {
      if (!payment.customer) return acc
      
      if (!acc[payment.customer.id]) {
        acc[payment.customer.id] = {
          id: payment.customer.id,
          name: payment.customer.name,
          total: 0,
          count: 0
        }
      }
      acc[payment.customer.id].total += parseFloat(payment.amount.toString())
      acc[payment.customer.id].count += 1
      return acc
    }, {})

    const topPayers = Object.values(paymentsByCustomer)
      .sort((a: any, b: any) => b.total - a.total)
      .slice(0, 10)

    return NextResponse.json({
      success: true,
      period: {
        start: startDate || sixMonthsAgo.toISOString(),
        end: endDate || now.toISOString(),
        months
      },
      summary: {
        totalCollected,
        totalSales,
        totalDebt,
        collectionRate,
        averagePayment,
        totalPayments: payments.length,
        totalCreditSales: creditSales.length,
        customersWithDebt: customersWithDebt.length
      },
      charts: {
        paymentsByMonth: Object.values(paymentsByMonth),
        salesByMonth: Object.values(salesByMonth),
        paymentsByMethod: Object.values(paymentsByMethod)
      },
      rankings: {
        topDebtors,
        topPayers
      },
      agingAnalysis
    })

  } catch (error) {
    console.error('❌ Error obteniendo reportes:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
