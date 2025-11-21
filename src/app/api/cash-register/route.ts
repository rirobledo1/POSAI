// API para Cortes de Caja
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

// GET - Obtener corte actual o historial
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const companyId = session.user.companyId
    const userId = session.user.id
    const userRole = session.user.role

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') // 'current' o 'history'

    if (action === 'current') {
      // Obtener corte actual abierto del usuario
      const result = await pool.query(
        `SELECT * FROM cash_register_closures 
         WHERE user_id = $1 AND company_id = $2 AND status = 'ABIERTO'
         ORDER BY opened_at DESC LIMIT 1`,
        [userId, companyId]
      )

      if (result.rows.length === 0) {
        return NextResponse.json({ 
          hasOpenClosure: false,
          message: 'No hay corte abierto'
        })
      }

      return NextResponse.json({
        hasOpenClosure: true,
        closure: result.rows[0]
      })
    }

    // Historial de cortes (con filtros) - por defecto si no hay action
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')
    const status = searchParams.get('status') || 'all'
    
    let query = `
      SELECT 
        c.*,
        u.name as user_name,
        b.name as branch_name
      FROM cash_register_closures c
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN branches b ON c.branch_id = b.id
      WHERE c.company_id = $1
    `
    
    const params: any[] = [companyId]
    let paramIndex = 2

    // Filtrar por usuario si no es ADMIN
    if (userRole !== 'ADMIN') {
      query += ` AND c.user_id = $${paramIndex}`
      params.push(userId)
      paramIndex++
    }

    // Filtrar por estado
    if (status !== 'all') {
      query += ` AND c.status = $${paramIndex}`
      params.push(status.toUpperCase())
      paramIndex++
    }

    query += ` ORDER BY c.opened_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
    params.push(limit, offset)

    console.log('🔍 Query de cortes:', query)
    console.log('📊 Params:', params)

    const result = await pool.query(query, params)

    console.log('✅ Cortes encontrados:', result.rows.length)

    // Contar total
    let countQuery = `SELECT COUNT(*) as total FROM cash_register_closures WHERE company_id = $1`
    const countParams: any[] = [companyId]
    
    if (userRole !== 'ADMIN') {
      countQuery += ` AND user_id = $2`
      countParams.push(userId)
    }

    const countResult = await pool.query(countQuery, countParams)
    const total = parseInt(countResult.rows[0].total)

    return NextResponse.json({
      success: true, // ✅ Agregado campo success
      closures: result.rows,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    })

  } catch (error) {
    console.error('❌ Error en GET /api/cash-register:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST - Crear nuevo corte o cerrar existente
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const companyId = session.user.companyId
    const userId = session.user.id
    const userName = session.user.name

    const body = await request.json()
    const { action, closureData } = body

    if (action === 'close') {
      // CERRAR CORTE EXISTENTE
      const { 
        closureId,
        cashReal,
        notes 
      } = closureData

      // Verificar que el corte existe y pertenece al usuario
      const checkResult = await pool.query(
        `SELECT * FROM cash_register_closures 
         WHERE id = $1 AND user_id = $2 AND company_id = $3 AND status = 'ABIERTO'`,
        [closureId, userId, companyId]
      )

      if (checkResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'Corte no encontrado o ya cerrado' },
          { status: 404 }
        )
      }

      const closure = checkResult.rows[0]
      const cashExpected = parseFloat(closure.cash_expected) || 0
      const cashDifference = parseFloat(cashReal) - cashExpected

      // Actualizar corte
      const updateResult = await pool.query(
        `UPDATE cash_register_closures 
         SET status = 'CERRADO',
             closed_at = NOW(),
             cash_real = $1,
             cash_difference = $2,
             notes = $3,
             updated_at = NOW()
         WHERE id = $4
         RETURNING *`,
        [cashReal, cashDifference, notes, closureId]
      )

      console.log(`✅ Corte cerrado: ${closure.folio} por ${userName}`)

      return NextResponse.json({
        success: true,
        message: 'Corte de caja cerrado exitosamente',
        closure: updateResult.rows[0]
      })
    }

    // CREAR NUEVO CORTE (Abrir caja)
    if (action === 'open') {
      // Verificar que no hay un corte abierto
      const openCheck = await pool.query(
        `SELECT id FROM cash_register_closures 
         WHERE user_id = $1 AND company_id = $2 AND status = 'ABIERTO'`,
        [userId, companyId]
      )

      if (openCheck.rows.length > 0) {
        return NextResponse.json(
          { error: 'Ya tienes un corte abierto. Ciérralo antes de abrir uno nuevo.' },
          { status: 400 }
        )
      }

      const { initialFund, shift, branchId } = closureData

      // Generar folio único
      const date = new Date()
      const dateStr = date.toISOString().split('T')[0].replace(/-/g, '')
      const countResult = await pool.query(
        `SELECT COUNT(*) as count FROM cash_register_closures 
         WHERE company_id = $1 AND opened_at::date = CURRENT_DATE`,
        [companyId]
      )
      const count = parseInt(countResult.rows[0].count) + 1
      const folio = `CORTE-${count.toString().padStart(3, '0')}-${dateStr}`

      // Crear corte
      const id = `closure_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      const insertResult = await pool.query(
        `INSERT INTO cash_register_closures (
          id, folio, user_id, company_id, branch_id,
          opened_at, shift, initial_fund, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, NOW(), $6, $7, 'ABIERTO', NOW(), NOW())
        RETURNING *`,
        [id, folio, userId, companyId, branchId, shift, initialFund]
      )

      console.log(`✅ Nuevo corte abierto: ${folio} por ${userName}`)

      return NextResponse.json({
        success: true,
        message: 'Corte de caja abierto exitosamente',
        closure: insertResult.rows[0]
      })
    }

    return NextResponse.json(
      { error: 'Acción no válida' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error en POST /api/cash-register:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
