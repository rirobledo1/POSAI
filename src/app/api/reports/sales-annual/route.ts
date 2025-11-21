import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/reports/sales-annual
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

    // Obtener año actual y anterior
    const now = new Date()
    const currentYear = now.getFullYear()
    const lastYear = currentYear - 1

    // Query: ventas agrupadas por mes, año actual y anterior
    // 🔥 FILTRO CRÍTICO: company_id
    const results = await prisma.$queryRaw`
      SELECT 
        EXTRACT(YEAR FROM created_at)::int as year,
        EXTRACT(MONTH FROM created_at)::int as month,
        COALESCE(SUM(total),0)::numeric as total_ventas,
        COALESCE(SUM(delivery_fee),0)::numeric as total_envio,
        COALESCE(SUM(total - COALESCE(delivery_fee,0)),0)::numeric as total_productos
      FROM sales
      WHERE company_id = ${companyId}
        AND EXTRACT(YEAR FROM created_at) IN (${currentYear}, ${lastYear})
      GROUP BY year, month
      ORDER BY year DESC, month ASC
    ` as any[]

    // Formatear respuesta: { year: { month: { totalVentas, totalEnvio, totalProductos } } }
    const data: Record<string, Record<string, any>> = {}
    for (const row of results) {
      const y = row.year
      const m = row.month
      if (!data[y]) data[y] = {}
      data[y][m] = {
        totalVentas: parseFloat(row.total_ventas),
        totalEnvio: parseFloat(row.total_envio),
        totalProductos: parseFloat(row.total_productos),
      }
    }

    return NextResponse.json({ data, currentYear, lastYear })
  } catch (error) {
    console.error('❌ Error en reporte anual:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
