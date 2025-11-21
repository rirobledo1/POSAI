// API para obtener resumen de ventas del turno actual
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const companyId = session.user.companyId
    const userId = session.user.id

    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from') // Fecha de inicio (opcional)

    // Si no hay fecha, usar desde las 00:00 de hoy
    const startDate = from ? new Date(from) : new Date()
    if (!from) {
      startDate.setHours(0, 0, 0, 0)
    }

    // Obtener resumen de ventas del usuario en el período
    const salesSummary = await pool.query(
      `SELECT 
        COUNT(*) as total_sales,
        COALESCE(SUM(total), 0) as total_amount,
        COALESCE(SUM(CASE WHEN payment_method = 'EFECTIVO' THEN total ELSE 0 END), 0) as cash_amount,
        COALESCE(SUM(CASE WHEN payment_method = 'TARJETA' THEN total ELSE 0 END), 0) as card_amount,
        COALESCE(SUM(CASE WHEN payment_method = 'TRANSFERENCIA' THEN total ELSE 0 END), 0) as transfer_amount,
        COALESCE(SUM(CASE WHEN payment_method = 'CREDITO' THEN total ELSE 0 END), 0) as credit_amount,
        COUNT(CASE WHEN payment_method = 'EFECTIVO' THEN 1 END) as cash_count,
        COUNT(CASE WHEN payment_method = 'TARJETA' THEN 1 END) as card_count,
        COUNT(CASE WHEN payment_method = 'TRANSFERENCIA' THEN 1 END) as transfer_count,
        COUNT(CASE WHEN payment_method = 'CREDITO' THEN 1 END) as credit_count
       FROM sales
       WHERE user_id = $1 
         AND company_id = $2
         AND created_at >= $3
         AND status = 'COMPLETED'`,
      [userId, companyId, startDate]
    )

    const summary = salesSummary.rows[0]

    return NextResponse.json({
      success: true,
      period: {
        from: startDate.toISOString(),
        to: new Date().toISOString()
      },
      summary: {
        totalSales: parseInt(summary.total_sales) || 0,
        totalAmount: parseFloat(summary.total_amount) || 0,
        
        cash: {
          count: parseInt(summary.cash_count) || 0,
          amount: parseFloat(summary.cash_amount) || 0
        },
        card: {
          count: parseInt(summary.card_count) || 0,
          amount: parseFloat(summary.card_amount) || 0
        },
        transfer: {
          count: parseInt(summary.transfer_count) || 0,
          amount: parseFloat(summary.transfer_amount) || 0
        },
        credit: {
          count: parseInt(summary.credit_count) || 0,
          amount: parseFloat(summary.credit_amount) || 0
        }
      }
    })

  } catch (error) {
    console.error('Error en GET /api/cash-register/summary:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
