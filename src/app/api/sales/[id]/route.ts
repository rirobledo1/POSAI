import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getCompanyIdFromSession } from '@/lib/session-helpers'

// GET para obtener detalles completos de una venta específica
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id: saleId } = await params

    console.log(`🔍 Obteniendo detalles de venta: ${saleId} para company: ${companyId}`)

    // 🆕 CRITICAL: Consulta con filtro de companyId
    const saleQuery = `
      SELECT 
        s.id, s.folio, s.total, s.subtotal, s.tax, s.payment_method as "paymentMethod",
        s.delivery_type as "deliveryType", s.status, s.notes, s.created_at as "createdAt",
        s.paid_amount as "paidAmount", s.change_amount as "changeAmount",
        s.delivery_fee as "deliveryFee",
        COALESCE(c.name, 'Cliente General') as "customerName",
        c.email as "customerEmail",
        c.phone as "customerPhone", 
        c.rfc as "customerRfc",
        COALESCE(u.name, 'Usuario') as "userName",
        da.address_line_1 as "deliveryAddress1",
        da.address_line_2 as "deliveryAddress2", 
        da.city as "deliveryCity",
        da.state as "deliveryState",
        da.postal_code as "deliveryPostalCode",
        da.delivery_notes as "deliveryNotes"
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id AND c.company_id = $2
      LEFT JOIN users u ON s.user_id = u.id AND u.company_id = $2
      LEFT JOIN delivery_addresses da ON c.id = da.customer_id AND da.company_id = $2
        AND da.id = (SELECT id FROM delivery_addresses WHERE customer_id = c.id AND company_id = $2 ORDER BY is_default DESC, created_at DESC LIMIT 1)
      WHERE s.id = $1 AND s.company_id = $2
    `

    const saleResult = await prisma.$queryRawUnsafe(saleQuery, saleId, companyId) as any[]

    if (!saleResult || saleResult.length === 0) {
      return NextResponse.json(
        { error: 'Venta no encontrada o no pertenece a tu empresa' },
        { status: 404 }
      )
    }

    const sale = saleResult[0]

    // 🆕 CRITICAL: Obtener items solo de productos de la compañía
    const itemsQuery = `
      SELECT 
        si.quantity, si.unit_price as "unitPrice", si.total,
        p.name as "productName", p.description as "productDescription"
      FROM sale_items si
      JOIN products p ON si.product_id = p.id AND p.company_id = $2
      WHERE si.sale_id = $1
      ORDER BY si.created_at
    `

    const saleItems = await prisma.$queryRawUnsafe(itemsQuery, saleId, companyId) as any[]

    // Estructurar datos para el ticket
    const ticketData = {
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
      paidAmount: sale.paidAmount ? parseFloat(sale.paidAmount.toString()) : null,
      changeAmount: sale.changeAmount ? parseFloat(sale.changeAmount.toString()) : null,
      customer: sale.customerName !== 'Cliente General' ? {
        name: sale.customerName,
        email: sale.customerEmail,
        phone: sale.customerPhone,
        rfc: sale.customerRfc
      } : null,
      user: {
        name: sale.userName
      },
      delivery: sale.deliveryType !== 'PICKUP'
        ? {
            type: sale.deliveryType,
            fee: sale.deliveryFee ? parseFloat(sale.deliveryFee.toString()) : 0,
            address1: sale.deliveryAddress1,
            address2: sale.deliveryAddress2,
            city: sale.deliveryCity,
            state: sale.deliveryState,
            postalCode: sale.deliveryPostalCode,
            notes: sale.deliveryNotes,
            status: 'PENDING'
          }
        : { fee: 0 },
      saleItems: saleItems.map(item => ({
        quantity: item.quantity,
        unitPrice: parseFloat(item.unitPrice?.toString() || '0'),
        total: parseFloat(item.total?.toString() || '0'),
        product: {
          name: item.productName,
          description: item.productDescription
        }
      }))
    }

    console.log(`✅ Detalles de venta obtenidos: ${sale.folio} con ${saleItems.length} items para company ${companyId}`)

    return NextResponse.json({
      sale: ticketData
    })

  } catch (error) {
    console.error('❌ Error obteniendo detalles de venta:', error)
    return NextResponse.json(
      { error: 'Error obteniendo detalles de venta' },
      { status: 500 }
    )
  }
}
