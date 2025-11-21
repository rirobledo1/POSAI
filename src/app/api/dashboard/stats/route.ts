import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getCompanyIdFromSession } from '@/lib/session-helpers'

// 🗓️ Tipos de período disponibles
type PeriodType = 'current_month' | 'current_year' | 'last_12_months' | 'last_30_days' | 'all_time'

// 🗓️ Función para generar filtros de fecha según el período
function getDateFilter(period: PeriodType) {
  const now = new Date()
  
  switch (period) {
    case 'current_month':
      return {
        gte: new Date(now.getFullYear(), now.getMonth(), 1),
        lt: new Date(now.getFullYear(), now.getMonth() + 1, 1)
      }
    
    case 'current_year':
      return {
        gte: new Date(now.getFullYear(), 0, 1),
        lt: new Date(now.getFullYear() + 1, 0, 1)
      }
    
    case 'last_12_months':
      return {
        gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
        lt: now
      }
    
    case 'last_30_days':
      return {
        gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        lt: now
      }
    
    case 'all_time':
    default:
      return undefined // Sin filtro de fecha
  }
}

// 🗓️ Función para obtener el período anterior para comparación
function getPreviousPeriodFilter(period: PeriodType) {
  const now = new Date()
  
  switch (period) {
    case 'current_month':
      const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      return {
        gte: prevMonth,
        lt: new Date(now.getFullYear(), now.getMonth(), 1)
      }
    
    case 'current_year':
      return {
        gte: new Date(now.getFullYear() - 1, 0, 1),
        lt: new Date(now.getFullYear(), 0, 1)
      }
    
    case 'last_12_months':
      return {
        gte: new Date(now.getTime() - 2 * 365 * 24 * 60 * 60 * 1000),
        lt: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
      }
    
    case 'last_30_days':
      return {
        gte: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
        lt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      }
    
    default:
      return undefined
  }
}

// Caché en memoria simple (en producción usar Redis)
let statsCache: any = null
let cacheTimestamp = 0
const CACHE_DURATION = 3 * 60 * 1000 // 3 minutos

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // 🆕 MULTI-TENANT: Obtener companyId
    const companyId = await getCompanyIdFromSession()

    const { searchParams } = new URL(request.url)
    const refresh = searchParams.get('refresh') === 'true'
    const period = (searchParams.get('period') as PeriodType) || 'current_month'

    const userRole = session.user.role
    const userId = session.user.id
    
    console.log(`👤 Dashboard stats for user: ${session.user.email} (${userRole}) - Company: ${companyId}${refresh ? ' (REFRESH)' : ''} - Period: ${period}`)

    // Verificar caché (incluir companyId y período en la key)
    const cacheKey = `${companyId}-${userRole}-${userId}-${period}`
    const shouldUseCache = (userRole === 'ADMIN' || userRole === 'SOLO_LECTURA') && !refresh
    const now = Date.now()
    
    if (shouldUseCache && statsCache?.[cacheKey] && (now - cacheTimestamp) < CACHE_DURATION) {
      console.log('📈 Dashboard stats served from cache')
      return NextResponse.json({ ...statsCache[cacheKey], cached: true })
    }

    console.log('📊 Computing dashboard stats from database...')
    const startTime = performance.now()

    // Variables para las consultas
    let recentSales: any[]
    let topProducts: any[]
    
    // 🆕 CRITICAL: Estadísticas con filtro de companyId
    const dateFilter = getDateFilter(period)
    
    const salesWhere = {
      companyId,  // ← CRÍTICO: Siempre filtrar por compañía
      ...(dateFilter && { createdAt: dateFilter }),
      ...(userRole === 'VENDEDOR' && { userId: userId })
    }

    // Estadísticas de ventas
    const totalSalesCount = await prisma.sale.count({ where: salesWhere })
    const salesSum = await prisma.sale.aggregate({
      where: salesWhere,
      _sum: { total: true }
    })

    // Ventas de hoy
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)
    
    const todaySalesSum = await prisma.sale.aggregate({
      where: {
        ...salesWhere,
        createdAt: { gte: todayStart, lte: todayEnd }
      },
      _sum: { total: true }
    })

    // Ventas de la semana
    const weekStart = new Date()
    const day = weekStart.getDay()
    const diff = weekStart.getDate() - day
    weekStart.setDate(diff)
    weekStart.setHours(0, 0, 0, 0)
    
    const weekSalesSum = await prisma.sale.aggregate({
      where: {
        ...salesWhere,
        createdAt: { gte: weekStart }
      },
      _sum: { total: true }
    })

    // Ventas del mes
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)
    
    const monthSalesSum = await prisma.sale.aggregate({
      where: {
        ...salesWhere,
        createdAt: { gte: monthStart }
      },
      _sum: { total: true }
    })

    // 🆕 CRITICAL: Estadísticas de inventario filtradas por companyId
    const totalProducts = await prisma.product.count({ 
      where: { 
        active: true,
        companyId  // ← Filtrar por compañía
      } 
    })
    
    const lowStockResult = await prisma.$queryRaw`
      SELECT COUNT(*)::int as low_stock_count
      FROM products 
      WHERE active = true AND stock <= min_stock AND company_id = ${companyId}
    ` as Array<{ low_stock_count: number }>
    
    const lowStockCount = lowStockResult[0]?.low_stock_count || 0

    // 🆕 CRITICAL: Estadísticas de clientes filtradas por companyId
    const totalCustomers = await prisma.customer.count({ 
      where: { 
        active: true,
        companyId  // ← Filtrar por compañía
      } 
    })

    const stats = {
      total_sales_count: totalSalesCount,
      total_amount: salesSum._sum.total || 0,
      today_amount: todaySalesSum._sum.total || 0,
      week_amount: weekSalesSum._sum.total || 0,
      month_amount: monthSalesSum._sum.total || 0,
      total_products: totalProducts,
      low_stock_count: lowStockCount,
      total_customers: totalCustomers
    }

    // Ventas recientes del período
    recentSales = await prisma.sale.findMany({
      where: salesWhere,
      include: {
        customer: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    // Top productos del período
    const salesInPeriod = await prisma.sale.findMany({
      where: salesWhere,
      select: { id: true }
    })
    
    const saleIdsInPeriod = salesInPeriod.map(s => s.id)
    
    topProducts = saleIdsInPeriod.length > 0 ? await prisma.saleItem.groupBy({
      by: ['productId'],
      _count: { id: true },
      _sum: { total: true },
      where: {
        saleId: { in: saleIdsInPeriod }
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 5
    }) : []

    // Obtener nombres de productos
    const topProductIds = topProducts.map(p => p.productId)
    const productNames = await prisma.product.findMany({
      where: { 
        id: { in: topProductIds },
        companyId  // ← Filtrar por compañía
      },
      select: { id: true, name: true }
    })
    
    const productNamesMap = Object.fromEntries(
      productNames.map(p => [p.id, p.name])
    )

    const formattedTopProducts = topProducts.map((p: any) => ({
      name: productNamesMap[p.productId] || 'Producto desconocido',
      sales_count: p._count.id,
      total_revenue: p._sum.total || 0
    }))

    const endTime = performance.now()

    // Estadísticas de comparación con período anterior
    let comparison = null
    if (period !== 'all_time') {
      try {
        const prevDateFilterSQL = getPreviousPeriodFilter(period)
        if (prevDateFilterSQL) {
          const prevSalesSum = await prisma.sale.aggregate({
            where: {
              companyId,  // ← Filtrar por compañía
              createdAt: prevDateFilterSQL,
              ...(userRole === 'VENDEDOR' && { userId: userId })
            },
            _sum: { total: true }
          })
          
          const currentAmount = parseFloat(stats.total_amount.toString())
          const previousAmount = parseFloat(prevSalesSum._sum.total?.toString() || '0')
          
          comparison = {
            currentAmount,
            previousAmount,
            change: currentAmount - previousAmount,
            changePercent: previousAmount > 0 ? ((currentAmount - previousAmount) / previousAmount) * 100 : 0
          }
        }
      } catch (error) {
        console.log('⚠️ Could not calculate comparison:', error)
      }
    }

    // Consultas de crédito (solo para ADMIN)
    let creditStats = {
      totalCreditSales: 0,
      totalCustomerDebt: 0,
      customersWithDebt: 0,
      averageDebt: 0,
      customersWithDebtList: [] as any[],
      paymentMethodBreakdown: {
        efectivo: { count: 0, amount: 0 },
        tarjeta: { count: 0, amount: 0 },
        transferencia: { count: 0, amount: 0 },
        credito: { count: 0, amount: 0 },
        total: { count: 0, amount: 0 }
      }
    }

    if (userRole === 'ADMIN') {
      // 🆕 CRITICAL: Desglose por método de pago filtrado por companyId
      const paymentMethodQuery = await prisma.sale.groupBy({
        by: ['paymentMethod'],
        _count: { id: true },
        _sum: { total: true },
        where: { 
          companyId,  // ← Filtrar por compañía
          ...(dateFilter && { createdAt: dateFilter })
        },
        orderBy: { _sum: { total: 'desc' } }
      })

      const paymentBreakdown = paymentMethodQuery.reduce((acc: any, method: any) => {
        const methodName = (method.paymentMethod || 'EFECTIVO').toLowerCase()
        acc[methodName] = {
          count: method._count.id,
          amount: parseFloat(method._sum.total?.toString() || '0')
        }
        return acc
      }, {})

      // 🆕 CRITICAL: Consultas de crédito filtradas por companyId
      const debtCustomersCount = await prisma.customer.count({
        where: { 
          active: true, 
          currentDebt: { gt: 0 },
          companyId  // ← Filtrar por compañía
        }
      })
      
      const debtSum = await prisma.customer.aggregate({
        where: { 
          active: true, 
          currentDebt: { gt: 0 },
          companyId  // ← Filtrar por compañía
        },
        _sum: { currentDebt: true },
        _avg: { currentDebt: true }
      })

      const customersWithDebt = await prisma.customer.findMany({
        where: { 
          active: true, 
          currentDebt: { gt: 0 },
          companyId  // ← Filtrar por compañía
        },
        select: { id: true, name: true, currentDebt: true, creditLimit: true },
        orderBy: { currentDebt: 'desc' },
        take: 10
      })

      creditStats.totalCreditSales = parseFloat(paymentBreakdown.credito?.amount || '0')
      creditStats.totalCustomerDebt = parseFloat(debtSum._sum.currentDebt?.toString() || '0')
      creditStats.customersWithDebt = debtCustomersCount
      creditStats.averageDebt = parseFloat(debtSum._avg.currentDebt?.toString() || '0')
      creditStats.customersWithDebtList = customersWithDebt.map((customer: any) => ({
        id: customer.id,
        name: customer.name,
        currentDebt: parseFloat(customer.currentDebt || '0'),
        creditLimit: parseFloat(customer.creditLimit || '0'),
        utilizationPercentage: parseFloat(customer.creditLimit || '0') > 0 
          ? Math.round((parseFloat(customer.currentDebt || '0') / parseFloat(customer.creditLimit || '0')) * 100)
          : 0
      }))

      creditStats.paymentMethodBreakdown = {
        efectivo: paymentBreakdown.efectivo || { count: 0, amount: 0 },
        tarjeta: paymentBreakdown.tarjeta || { count: 0, amount: 0 },
        transferencia: paymentBreakdown.transferencia || { count: 0, amount: 0 },
        credito: paymentBreakdown.credito || { count: 0, amount: 0 },
        total: {
          count: paymentMethodQuery.reduce((sum: number, method: any) => sum + method._count.id, 0),
          amount: paymentMethodQuery.reduce((sum: number, method: any) => sum + parseFloat(method._sum.total?.toString() || '0'), 0)
        }
      }
    }

    const response = {
      period,
      periodLabel: getPeriodLabel(period),
      
      totalSales: parseFloat(stats.total_amount.toString()),
      totalProducts: stats.total_products,
      totalCustomers: stats.total_customers,
      lowStockAlerts: stats.low_stock_count,
      
      todaySales: parseFloat(stats.today_amount.toString()),
      weekSales: parseFloat(stats.week_amount.toString()),
      monthSales: parseFloat(stats.month_amount.toString()),
      salesGrowth: 0,

      comparison,
      
      ...creditStats,
      
      topProducts: formattedTopProducts.map((p: any) => ({
        name: p.name,
        sales: p.sales_count,
        revenue: parseFloat(p.total_revenue.toString())
      })),
      
      recentSales: recentSales.map((sale: any) => ({
        id: sale.id,
        folio: sale.folio || 'N/A',
        customer: sale.customer?.name || 'Cliente General',
        amount: parseFloat(sale.total.toString()),
        paymentMethod: sale.paymentMethod || 'EFECTIVO',
        date: sale.createdAt.toISOString(),
        status: 'completed' as const
      })),
      
      stockAlerts: [],
      
      performanceMs: Math.round(endTime - startTime),
      queryCount: 4,
      cached: false,
      filteredByUser: userRole === 'VENDEDOR',
      userRole: userRole,
      companyId  // ← Para debug
    }

    // Actualizar caché
    if (shouldUseCache && !refresh) {
      if (!statsCache) statsCache = {}
      statsCache[cacheKey] = response
      cacheTimestamp = now
    }

    console.log(`✅ Dashboard stats computed in ${response.performanceMs}ms for company ${companyId} - period: ${period}`)
    console.log(`📊 Results: ${stats.total_sales_count} sales, ${response.totalSales.toFixed(2)} total, ${response.totalCustomers} customers`)
    
    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ Error obteniendo estadísticas del dashboard:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

function getPeriodLabel(period: PeriodType): string {
  switch (period) {
    case 'current_month': return 'Este Mes'
    case 'current_year': return 'Este Año'
    case 'last_12_months': return 'Últimos 12 Meses'
    case 'last_30_days': return 'Últimos 30 Días'
    case 'all_time': return 'Todo el Tiempo'
    default: return 'Período Desconocido'
  }
}
