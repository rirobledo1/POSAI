import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { DeliveryType } from '@prisma/client'
import { getCompanyIdFromSession } from '@/lib/session-helpers'

interface SaleItem {
  productId: string
  quantity: number
  unitPrice: number
}

interface SaleData {
  customerId?: string | null
  subtotal: number
  tax: number
  total: number
  paymentMethod: string
  deliveryType?: string
  deliveryAddressId?: string
  deliveryFee?: number
  notes?: string
  items: SaleItem[]
}

function generateSaleFolio(): string {
  const timestamp = Date.now().toString().slice(-8)
  return `V-${timestamp}`
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // 🆕 MULTI-TENANT: Obtener companyId
    const companyId = await getCompanyIdFromSession()

    const saleData: SaleData = await request.json()
    console.log('📦 Procesando venta para company:', companyId)
    console.log('👤 Session user ID:', session.user.id)

    // Validación básica
    if (!saleData.items || saleData.items.length === 0) {
      return NextResponse.json(
        { error: 'No hay productos en la venta' },
        { status: 400 }
      )
    }

    // 🆕 CRITICAL: Verificar usuario pertenece a la compañía
    const users = await prisma.$queryRaw`
      SELECT id, name FROM users 
      WHERE id = ${String(session.user.id)} 
      AND company_id = ${companyId}
      AND active = true 
      LIMIT 1
    ` as any[]
    
    if (!Array.isArray(users) || users.length === 0) {
      return NextResponse.json(
        { error: 'Usuario no encontrado en esta compañía.' },
        { status: 400 }
      )
    }

    const user = users[0] as any
    console.log('✅ Usuario válido:', user.name)

    // Procesar venta en transacción
    const result = await prisma.$transaction(async (tx) => {
      const folio = generateSaleFolio()
      const saleId = `sale-${Date.now()}`
      
      const subtotal = parseFloat(saleData.subtotal.toString());
      const tax = parseFloat(saleData.tax.toString());
      const total = parseFloat(saleData.total.toString());
      
      const validDeliveryTypes: DeliveryType[] = ['PICKUP', 'LOCAL', 'FORANEO'];
      const deliveryType: DeliveryType = validDeliveryTypes.includes(saleData.deliveryType as DeliveryType) 
        ? (saleData.deliveryType as DeliveryType)
        : 'PICKUP';
      
      // 🆕 CRITICAL: Si hay cliente, verificar que pertenece a la compañía
      if (saleData.customerId) {
        const customer = await tx.customer.findFirst({
          where: { 
            id: saleData.customerId,
            companyId  // ← Verificar ownership
          }
        })
        
        if (!customer) {
          throw new Error('Cliente no encontrado o no pertenece a tu empresa')
        }
      }

      // 💰 Calcular fecha de vencimiento para crédito (30 días por defecto)
      const dueDate = saleData.paymentMethod === 'CREDITO' 
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) 
        : null

      // 🆕 CRITICAL: Crear venta con companyId
      const sale = await tx.sale.create({
        data: {
          id: saleId,
          folio,
          customerId: saleData.customerId || null,
          userId: user.id,
          companyId,  // ← CRÍTICO: Asignar compañía
          paymentMethod: saleData.paymentMethod,
          subtotal,
          tax,
          total,
          deliveryType,
          deliveryFee: saleData.deliveryFee || 0,
          status: 'COMPLETED',
          notes: saleData.notes || null,
          // 💰 NUEVO: Campos de control de pagos
          amountPaid: saleData.paymentMethod === 'CREDITO' ? 0 : total,
          remainingBalance: saleData.paymentMethod === 'CREDITO' ? total : 0,
          paymentStatus: saleData.paymentMethod === 'CREDITO' ? 'PENDING' : 'PAID',
          dueDate: dueDate
        }
      })

      console.log('✅ Venta creada:', saleId)

      // Crear items y actualizar stock
      for (const item of saleData.items) {
        const itemId = `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        
        const unitPrice = parseFloat(item.unitPrice.toString());
        const quantity = parseInt(item.quantity.toString());
        const itemTotal = unitPrice * quantity;
        
        // 🆕 CRITICAL: Verificar que el producto pertenece a la compañía
        const product = await tx.product.findFirst({
          where: { 
            id: item.productId,
            companyId  // ← Verificar ownership
          }
        })
        
        if (!product) {
          throw new Error(`Producto ${item.productId} no encontrado o no pertenece a tu empresa`)
        }

        // Crear item
        await tx.saleItem.create({
          data: {
            id: itemId,
            saleId,
            productId: item.productId,
            quantity,
            unitPrice,
            total: itemTotal,
          }
        })

        // 🆕 CRITICAL: Actualizar stock solo de productos de la compañía
        await tx.product.update({
          where: { 
            id: item.productId,
            companyId  // ← Verificar ownership
          },
          data: {
            stock: {
              decrement: item.quantity
            }
          }
        })

        console.log('✅ Item procesado:', item.productId)
      }

      // Si es venta a crédito, actualizar adeudo
      if (saleData.paymentMethod === 'CREDITO' && saleData.customerId) {
        console.log('💳 Actualizando adeudo del cliente...')
        
        // 🆕 CRITICAL: Actualizar solo clientes de la compañía
        await tx.customer.update({
          where: { 
            id: saleData.customerId,
            companyId  // ← Verificar ownership
          },
          data: {
            currentDebt: {
              increment: total
            }
          }
        })
        
        console.log(`✅ Adeudo actualizado: +$${total}`)
      }

      // Log de entrega
      if ((saleData.deliveryType === 'LOCAL' || saleData.deliveryType === 'FORANEO') && saleData.deliveryAddressId) {
        console.log('🚚 Venta con entrega:', deliveryType)
        console.log('📍 Dirección:', saleData.deliveryAddressId)
      }

      return { saleId, folio }
    })

    console.log('🎉 Venta procesada exitosamente:', result.folio)

    return NextResponse.json({
      success: true,
      sale: {
        id: result.saleId,
        folio: result.folio,
        total: saleData.total
      }
    })

  } catch (error) {
    console.error('❌ Error procesando venta:', error)
    
    return NextResponse.json(
      { 
        error: 'Error procesando venta',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}

// GET con paginación y filtros
export async function GET(request: NextRequest) {
  console.log('🔍 API Sales GET - Starting request')
  
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      console.log('❌ Unauthorized access attempt')
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // 🆕 MULTI-TENANT: Obtener companyId
    const companyId = await getCompanyIdFromSession()
    console.log('🏢 Fetching sales for company:', companyId)

    const { searchParams } = new URL(request.url)
    
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status') || ''
    const startDate = searchParams.get('startDate') || ''
    const endDate = searchParams.get('endDate') || ''
    const offset = (page - 1) * limit

    // 🆕 CRITICAL: Construir WHERE con companyId
    let whereConditions = [`s.company_id = $1`]  // ← SIEMPRE filtrar por compañía
    let params: any[] = [companyId]
    let paramIndex = 2

    if (status) {
      whereConditions.push(`s.status = $${paramIndex}`)
      params.push(status)
      paramIndex++
    }

    if (startDate) {
      whereConditions.push(`s.created_at >= $${paramIndex}`)
      params.push(new Date(startDate))
      paramIndex++
    }

    if (endDate) {
      whereConditions.push(`s.created_at <= $${paramIndex}`)
      params.push(new Date(endDate))
      paramIndex++
    }

    const whereClause = `WHERE ${whereConditions.join(' AND ')}`

    // 🆕 CRITICAL: Consultar ventas SOLO de la compañía
    const salesQuery = `
      SELECT 
        s.id, s.folio, s.total, s.subtotal, s.tax, s.payment_method as "paymentMethod",
        s.status, s.notes, s.created_at as "createdAt",
        COALESCE(c.name, 'Cliente General') as "customerName", 
        c.email as "customerEmail",
        c.phone as "customerPhone",
        COALESCE(u.name, 'Usuario') as "userName",
        COUNT(si.id)::int as "itemCount"
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id AND c.company_id = $1
      LEFT JOIN users u ON s.user_id = u.id AND u.company_id = $1
      LEFT JOIN sale_items si ON s.id = si.sale_id
      ${whereClause}
      GROUP BY s.id, s.folio, s.total, s.subtotal, s.tax, s.payment_method,
               s.status, s.notes, s.created_at, c.name, c.email, c.phone, u.name
      ORDER BY s.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `

    params.push(limit, offset)

    console.log(`🔍 Ejecutando consulta con ${params.length} parámetros`)

    let sales;
    try {
      sales = await prisma.$queryRawUnsafe(salesQuery, ...params) as any[]
    } catch (sqlError) {
      console.error('❌ Error en consulta SQL:', sqlError)
      return NextResponse.json(
        { 
          error: 'Error en consulta de ventas',
          details: sqlError instanceof Error ? sqlError.message : 'Error SQL'
        },
        { status: 500 }
      )
    }

    // Consultar total
    const countQuery = `
      SELECT COUNT(*)::int as total
      FROM sales s
      ${whereClause}
    `

    let total = 0;
    try {
      const countResult = await prisma.$queryRawUnsafe(countQuery, ...params.slice(0, params.length - 2)) as any[]
      total = countResult[0]?.total || 0
    } catch (countError) {
      console.error('❌ Error en conteo:', countError)
      total = sales.length
    }

    console.log(`✅ Encontradas ${sales.length} ventas de ${total} totales para company ${companyId}`)

    return NextResponse.json({
      data: sales.map(sale => ({
        id: sale.id,
        folio: sale.folio,
        total: parseFloat(sale.total?.toString() || '0'),
        subtotal: parseFloat(sale.subtotal?.toString() || '0'),
        tax: parseFloat(sale.tax?.toString() || '0'),
        paymentMethod: sale.paymentMethod,
        status: sale.status,
        notes: sale.notes,
        createdAt: sale.createdAt,
        customer: sale.customerName ? {
          name: sale.customerName
        } : undefined,
        user: {
          name: sale.userName || 'Usuario'
        },
        saleItems: []
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
    console.error('❌ Error obteniendo ventas:', error)
    return NextResponse.json(
      { error: 'Error obteniendo ventas' },
      { status: 500 }
    )
  }
}
