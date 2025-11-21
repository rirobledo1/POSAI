import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Endpoint de test para debuggear la consulta de ventas sin autenticación
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status') || ''
    const startDate = searchParams.get('startDate') || ''
    const endDate = searchParams.get('endDate') || ''
    const offset = (page - 1) * limit

    console.log(`📊 TEST - Consultando ventas - Página: ${page}, Límite: ${limit}, Desde: ${startDate}`)

    // Construir consulta con filtros
    let whereConditions = []
    let params: any[] = []
    let paramIndex = 1

    if (status) {
      whereConditions.push(`status = $${paramIndex}`)
      params.push(status)
      paramIndex++
    }

    if (startDate) {
      whereConditions.push(`created_at >= $${paramIndex}`)
      params.push(new Date(startDate))
      paramIndex++
    }

    if (endDate) {
      whereConditions.push(`created_at <= $${paramIndex}`)
      params.push(new Date(endDate))
      paramIndex++
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

    // Consultar ventas con paginación
    const salesQuery = `
      SELECT 
        s.id, s.folio, s.total, s.subtotal, s.tax, s.payment_method as "paymentMethod",
        s.delivery_type as "deliveryType", s.status, s.notes, s.created_at as "createdAt",
        COALESCE(c.name, 'Cliente General') as "customerName", 
        COALESCE(u.name, 'Usuario') as "userName",
        COUNT(si.id)::int as "itemCount"
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN sale_items si ON s.id = si.sale_id
      ${whereClause}
      GROUP BY s.id, s.folio, s.total, s.subtotal, s.tax, s.payment_method,
               s.delivery_type, s.status, s.notes, s.created_at, c.name, u.name
      ORDER BY s.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `

    params.push(limit, offset)

    console.log('🔍 Ejecutando consulta:', salesQuery)
    console.log('📝 Parámetros:', params)

    const sales = await prisma.$queryRawUnsafe(salesQuery, ...params) as any[]

    // Consultar total de registros para paginación
    const countQuery = `
      SELECT COUNT(*)::int as total
      FROM sales s
      ${whereClause}
    `

    const countResult = await prisma.$queryRawUnsafe(countQuery, ...params.slice(0, params.length - 2)) as any[]
    const total = countResult[0]?.total || 0

    console.log(`✅ TEST - Encontradas ${sales.length} ventas de ${total} totales`)
    console.log('🎯 Ventas encontradas:', JSON.stringify(sales, null, 2))

    return NextResponse.json({
      data: sales.map(sale => ({
        id: sale.id,
        folio: sale.folio,
        total: parseFloat(sale.total?.toString() || '0'),
        subtotal: parseFloat(sale.subtotal?.toString() || '0'),
        tax: parseFloat(sale.tax?.toString() || '0'),
        paymentMethod: sale.paymentMethod,
        deliveryType: sale.deliveryType,
        status: sale.status,
        notes: sale.notes,
        createdAt: sale.createdAt,
        customer: sale.customerName ? {
          name: sale.customerName
        } : undefined,
        user: {
          name: sale.userName || 'Usuario'
        },
        saleItems: [] // Se llenarían en una consulta separada si se necesitan
      })),
      total,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('❌ TEST - Error obteniendo ventas:', error)
    return NextResponse.json(
      { error: 'Error obteniendo ventas', details: error },
      { status: 500 }
    )
  }
}