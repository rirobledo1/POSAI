import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/reports/sales-by-product?year=2025&monthStart=1&monthEnd=12
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { companyId, role } = session.user

    // Solo ADMIN puede ver reportes
    if (role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado. Solo administradores pueden ver reportes.' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const year = Number(searchParams.get('year')) || new Date().getFullYear()
    const monthStart = Number(searchParams.get('monthStart')) || 1
    const monthEnd = Number(searchParams.get('monthEnd')) || 12

    // Query: productos más vendidos, cantidades e ingresos
    // 🔥 FILTRO CRÍTICO: company_id en múltiples tablas
    const results = await prisma.$queryRaw`
      SELECT 
        p.id as product_id,
        p.name as product_name,
        SUM(si.quantity) as total_quantity,
        SUM(si.quantity * si.unit_price) as total_revenue,
        AVG(si.unit_price) as avg_price
      FROM sale_items si
      JOIN products p ON p.id = si.product_id
      JOIN sales s ON s.id = si.sale_id
      WHERE s.company_id = ${companyId}
        AND p.company_id = ${companyId}
        AND EXTRACT(YEAR FROM s.created_at) = ${year}
        AND EXTRACT(MONTH FROM s.created_at) BETWEEN ${monthStart} AND ${monthEnd}
      GROUP BY p.id, p.name
      ORDER BY total_quantity DESC
      LIMIT 100
    ` as any[]

    // Formatear resultados
    const products = results.map(r => ({
      productId: r.product_id,
      productName: r.product_name,
      totalQuantity: Number(r.total_quantity) || 0,
      totalRevenue: parseFloat(r.total_revenue) || 0,
      avgPrice: parseFloat(r.avg_price) || 0
    }))

    return NextResponse.json({ 
      year, 
      monthStart, 
      monthEnd, 
      products,
      total: products.length
    })
  } catch (error) {
    console.error('❌ Error en reporte ventas por producto:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
