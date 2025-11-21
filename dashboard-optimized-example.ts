// Optimización 1: Endpoint con consultas SQL optimizadas
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Caché en memoria simple (en producción usar Redis)
let statsCache: any = null
let cacheTimestamp = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar caché
    const now = Date.now()
    if (statsCache && (now - cacheTimestamp) < CACHE_DURATION) {
      console.log('📈 Dashboard stats served from cache')
      return NextResponse.json({ ...statsCache, cached: true })
    }

    console.log('📊 Computing dashboard stats from database...')
    const startTime = performance.now()

    // UNA SOLA consulta SQL optimizada para obtener todo
    const statsQuery = await prisma.$queryRaw`
      WITH sales_stats AS (
        SELECT 
          COUNT(*)::int as total_sales_count,
          COALESCE(SUM(total), 0)::numeric as total_amount,
          COALESCE(SUM(CASE WHEN DATE(created_at) = CURRENT_DATE THEN total ELSE 0 END), 0)::numeric as today_amount,
          COALESCE(SUM(CASE WHEN created_at >= date_trunc('week', CURRENT_DATE) THEN total ELSE 0 END), 0)::numeric as week_amount,
          COALESCE(SUM(CASE WHEN created_at >= date_trunc('month', CURRENT_DATE) THEN total ELSE 0 END), 0)::numeric as month_amount
        FROM sales
      ),
      inventory_stats AS (
        SELECT 
          COUNT(*)::int as total_products,
          COUNT(CASE WHEN stock <= min_stock THEN 1 END)::int as low_stock_count
        FROM products 
        WHERE active = true
      ),
      customer_stats AS (
        SELECT COUNT(*)::int as total_customers
        FROM customers 
        WHERE active = true
      )
      SELECT 
        ss.*,
        inv.total_products,
        inv.low_stock_count,
        cs.total_customers
      FROM sales_stats ss, inventory_stats inv, customer_stats cs
    ` as Array<{
      total_sales_count: number
      total_amount: number
      today_amount: number
      week_amount: number
      month_amount: number
      total_products: number
      low_stock_count: number
      total_customers: number
    }>

    // Obtener ventas recientes (solo las últimas 5 para performance)
    const recentSales = await prisma.$queryRaw`
      SELECT s.id, s.folio, s.total, s.created_at,
             COALESCE(c.name, 'Cliente General') as customer_name
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      ORDER BY s.created_at DESC
      LIMIT 5
    ` as Array<{
      id: string
      folio: string
      total: number
      created_at: Date
      customer_name: string
    }>

    // Obtener productos top (solo los 3 principales)
    const topProducts = await prisma.$queryRaw`
      SELECT p.name, 
             COUNT(si.id)::int as sales_count,
             SUM(si.total)::numeric as total_revenue
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
      JOIN sales s ON si.sale_id = s.id
      WHERE s.created_at >= date_trunc('month', CURRENT_DATE)
      GROUP BY p.id, p.name
      ORDER BY sales_count DESC
      LIMIT 3
    ` as Array<{
      name: string
      sales_count: number
      total_revenue: number
    }>

    const stats = statsQuery[0]
    const endTime = performance.now()

    const response = {
      // Estadísticas principales
      totalSales: parseFloat(stats.total_amount.toString()),
      totalProducts: stats.total_products,
      totalCustomers: stats.total_customers,
      lowStockAlerts: stats.low_stock_count,
      
      // Ventas por período
      todaySales: parseFloat(stats.today_amount.toString()),
      weekSales: parseFloat(stats.week_amount.toString()),
      monthSales: parseFloat(stats.month_amount.toString()),
      salesGrowth: 0, // Calcular si es necesario
      
      // Datos detallados (limitados para performance)
      topProducts: topProducts.map(p => ({
        name: p.name,
        sales: p.sales_count,
        revenue: parseFloat(p.total_revenue.toString())
      })),
      
      recentSales: recentSales.map(sale => ({
        id: sale.id,
        customer: sale.customer_name,
        amount: parseFloat(sale.total.toString()),
        date: sale.created_at.toISOString(),
        status: 'completed' as const
      })),
      
      // Alertas de stock (simplificado)
      stockAlerts: [], // Solo cargar cuando se necesite
      
      // Metadata de performance
      performanceMs: Math.round(endTime - startTime),
      queryCount: 3, // Reduced from 7+
      cached: false
    }

    // Actualizar caché
    statsCache = response
    cacheTimestamp = now

    console.log(`✅ Dashboard stats computed in ${response.performanceMs}ms`)
    
    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ Error obteniendo estadísticas del dashboard:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
