import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'
import { getCompanyIdFromSession } from '@/lib/session-helpers'

const prisma = new PrismaClient()

export interface DashboardStats {
  totalSales: number
  totalProducts: number
  totalCustomers: number
  lowStockAlerts: number
  todaySales: number
  weekSales: number
  monthSales: number
  salesGrowth: number
  totalCreditSales: number
  totalCustomerDebt: number
  customersWithDebt: number
  averageDebt: number
  topProducts: Array<{
    name: string
    sales: number
    revenue: number
  }>
  recentSales: Array<{
    id: string
    folio: string
    customer: string
    amount: number
    paymentMethod: string
    date: string
    status: 'completed' | 'pending' | 'cancelled'
  }>
  stockAlerts: Array<{
    product: string
    currentStock: number
    minStock: number
    category: string
  }>
  customersWithDebtList: Array<{
    id: string
    name: string
    currentDebt: number
    creditLimit: number
    utilizationPercentage: number
  }>
}

export async function GET() {
  try {
    console.log('🔍 Dashboard API: Iniciando consulta...')
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    // 🆕 MULTI-TENANT: Obtener companyId
    const companyId = await getCompanyIdFromSession()
    console.log('🏢 Dashboard para company:', companyId)

    const userEmail = session.user.email
    console.log('👤 Dashboard API: Usuario logueado:', userEmail)
    
    // 🆕 CRITICAL: Verificar usuario pertenece a la compañía
    const user = await prisma.user.findFirst({
      where: { 
        email: userEmail,
        companyId  // ← Verificar ownership
      },
      select: { id: true, role: true, name: true }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado en esta compañía' },
        { status: 404 }
      )
    }

    console.log('🎯 Dashboard API: Usuario encontrado:', user.name, 'Rol:', user.role)

    // 🆕 CRITICAL: Filtro base SIEMPRE incluye companyId
    const salesFilter = user.role === 'VENDEDOR' 
      ? { userId: user.id, companyId }
      : { companyId }

    console.log('📊 Dashboard API: Filtro aplicado:', JSON.stringify(salesFilter))

    // 🆕 CRITICAL: Consultas básicas filtradas por companyId
    const totalSalesCount = await prisma.sale.count({ where: salesFilter })
    const totalProductsCount = await prisma.product.count({ where: { companyId } })
    const totalCustomersCount = await prisma.customer.count({ where: { companyId } })
    const lowStockCount = await prisma.product.count({
      where: { stock: { lte: 10 }, companyId }
    })

    console.log('📈 Dashboard API: Conteos básicos:', {
      totalSales: totalSalesCount,
      totalProducts: totalProductsCount,
      customers: totalCustomersCount,
      lowStock: lowStockCount
    })

    // 🆕 CRITICAL: Ventas recientes filtradas por companyId
    const recentSalesQuery = user.role === 'VENDEDOR' 
      ? `SELECT s.*, c.name as customer_name FROM sales s 
         LEFT JOIN customers c ON s.customer_id = c.id AND c.company_id = $1
         WHERE s.user_id = $2 AND s.company_id = $1
         ORDER BY s.created_at DESC LIMIT 10`
      : `SELECT s.*, c.name as customer_name FROM sales s 
         LEFT JOIN customers c ON s.customer_id = c.id AND c.company_id = $1
         WHERE s.company_id = $1
         ORDER BY s.created_at DESC LIMIT 10`
    
    const recentSalesParams = user.role === 'VENDEDOR' 
      ? [companyId, user.id]
      : [companyId]

    const recentSalesRaw = await prisma.$queryRawUnsafe(recentSalesQuery, ...recentSalesParams) as any[]

    console.log('📋 Dashboard API: Ventas recientes encontradas:', recentSalesRaw.length)

    // 🆕 CRITICAL: Sumas por periodo filtradas por companyId
    const todayFilter = user.role === 'VENDEDOR' 
      ? `AND user_id = $2 AND company_id = $1`
      : `AND company_id = $1`

    const todayParams = user.role === 'VENDEDOR' ? [companyId, user.id] : [companyId]

    const todaySalesRaw = await prisma.$queryRawUnsafe(`
      SELECT COALESCE(SUM(total), 0)::numeric as total_today 
      FROM sales 
      WHERE DATE(created_at) = CURRENT_DATE ${todayFilter}
    `, ...todayParams) as any[]

    const weekSalesRaw = await prisma.$queryRawUnsafe(`
      SELECT COALESCE(SUM(total), 0)::numeric as total_week 
      FROM sales 
      WHERE created_at >= NOW() - INTERVAL '7 days' ${todayFilter}
    `, ...todayParams) as any[]

    const monthSalesRaw = await prisma.$queryRawUnsafe(`
      SELECT COALESCE(SUM(total), 0)::numeric as total_month 
      FROM sales 
      WHERE created_at >= NOW() - INTERVAL '30 days' ${todayFilter}
    `, ...todayParams) as any[]

    // 🆕 CRITICAL: Estadísticas de crédito filtradas por companyId
    const creditSalesRaw = await prisma.$queryRawUnsafe(`
      SELECT 
        COALESCE(SUM(total), 0)::numeric as total_credit,
        COUNT(*)::int as count_credit
      FROM sales 
      WHERE payment_method = 'CREDITO' ${todayFilter}
    `, ...todayParams) as any[]

    const customerDebtRaw = await prisma.$queryRawUnsafe(`
      SELECT 
        COALESCE(SUM(current_debt), 0)::numeric as total_debt,
        COUNT(*)::int as customers_with_debt,
        COALESCE(AVG(current_debt), 0)::numeric as average_debt
      FROM customers 
      WHERE active = true AND current_debt > 0 AND company_id = $1
    `, companyId) as any[]

    const customersWithDebtRaw = await prisma.$queryRawUnsafe(`
      SELECT id, name, current_debt, credit_limit
      FROM customers 
      WHERE active = true AND current_debt > 0 AND company_id = $1
      ORDER BY current_debt DESC 
      LIMIT 10
    `, companyId) as any[]

    console.log('💰 Dashboard API: Sumas por periodo:', {
      hoy: parseFloat(todaySalesRaw[0]?.total_today || '0'),
      semana: parseFloat(weekSalesRaw[0]?.total_week || '0'),
      mes: parseFloat(monthSalesRaw[0]?.total_month || '0')
    })

    console.log('💳 Dashboard API: Estadísticas de crédito:', {
      totalCreditSales: parseFloat(creditSalesRaw[0]?.total_credit || '0'),
      totalDebt: parseFloat(customerDebtRaw[0]?.total_debt || '0'),
      customersWithDebt: customerDebtRaw[0]?.customers_with_debt || 0
    })

    const stats: DashboardStats = {
      totalSales: totalSalesCount,
      totalProducts: totalProductsCount,
      totalCustomers: totalCustomersCount,
      lowStockAlerts: lowStockCount,
      todaySales: parseFloat(todaySalesRaw[0]?.total_today || '0'),
      weekSales: parseFloat(weekSalesRaw[0]?.total_week || '0'),
      monthSales: parseFloat(monthSalesRaw[0]?.total_month || '0'),
      salesGrowth: 8.2,
      totalCreditSales: parseFloat(creditSalesRaw[0]?.total_credit || '0'),
      totalCustomerDebt: parseFloat(customerDebtRaw[0]?.total_debt || '0'),
      customersWithDebt: customerDebtRaw[0]?.customers_with_debt || 0,
      averageDebt: parseFloat(customerDebtRaw[0]?.average_debt || '0'),
      topProducts: [
        { name: 'Producto Ejemplo', sales: 10, revenue: 100 }
      ],
      recentSales: recentSalesRaw.map(sale => ({
        id: sale.id,
        folio: sale.folio,
        customer: sale.customer_name || 'Cliente desconocido',
        amount: parseFloat(sale.total || '0'),
        paymentMethod: sale.payment_method || 'EFECTIVO',
        date: sale.created_at,
        status: 'completed' as 'completed' | 'pending' | 'cancelled'
      })),
      stockAlerts: [
        { product: 'Producto con bajo stock', currentStock: 5, minStock: 10, category: 'General' }
      ],
      customersWithDebtList: customersWithDebtRaw.map(customer => ({
        id: customer.id,
        name: customer.name,
        currentDebt: parseFloat(customer.current_debt || '0'),
        creditLimit: parseFloat(customer.credit_limit || '0'),
        utilizationPercentage: parseFloat(customer.credit_limit || '0') > 0 
          ? Math.round((parseFloat(customer.current_debt || '0') / parseFloat(customer.credit_limit || '0')) * 100)
          : 0
      }))
    }

    console.log('✅ Dashboard API: Estadísticas preparadas correctamente para company:', companyId)

    return NextResponse.json({
      success: true,
      data: stats
    })
  } catch (error) {
    console.error('❌ Dashboard API Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch dashboard statistics' 
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
