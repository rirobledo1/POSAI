import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Endpoint temporal para probar si existen ventas
export async function GET() {
  try {
    console.log('🔍 Verificando ventas en la base de datos...')
    
    const salesCount = await prisma.$queryRaw`
      SELECT COUNT(*)::int as total FROM sales
    ` as any[]

    const detailedSales = await prisma.$queryRaw`
      SELECT 
        s.id, s.folio, s.total, s.status, s.created_at, s.user_id, s.customer_id,
        COALESCE(c.name, 'Cliente General') as customer_name,
        COALESCE(u.name, 'Usuario') as user_name
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN users u ON s.user_id = u.id
      ORDER BY s.created_at DESC 
      LIMIT 5
    ` as any[]

    console.log(`📊 Total de ventas encontradas: ${salesCount[0]?.total || 0}`)
    console.log('📋 Ventas detalladas:', JSON.stringify(detailedSales, null, 2))

    return NextResponse.json({
      totalSales: salesCount[0]?.total || 0,
      detailedSales: detailedSales.map(sale => ({
        ...sale,
        total: parseFloat(sale.total?.toString() || '0')
      }))
    })

  } catch (error) {
    console.error('❌ Error verificando ventas:', error)
    return NextResponse.json(
      { error: 'Error verificando ventas', details: error },
      { status: 500 }
    )
  }
}