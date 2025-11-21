// src/app/api/tienda/[slug]/orders/[id]/pdf/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateOnlineOrderPDF } from '@/lib/pdf/onlineOrder'

/**
 * GET /api/tienda/[slug]/orders/[id]/pdf
 * Generar y descargar PDF de orden online
 * Endpoint público - no requiere autenticación
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await params

    // Buscar la orden
    const order = await prisma.onlineOrder.findUnique({
      where: { id },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
            address: true,
            phone: true,
            email: true,
            rfc: true,
            taxRate: true
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Orden no encontrada' },
        { status: 404 }
      )
    }

    // Verificar que la orden pertenece a la tienda correcta
    if (order.company.slug !== slug) {
      return NextResponse.json(
        { error: 'Orden no encontrada' },
        { status: 404 }
      )
    }

    // Preparar datos para el PDF
    const taxRate = Number(order.company.taxRate) || 16

    const pdfData = {
      orderNumber: order.orderNumber,
      type: order.type as 'QUOTE' | 'SALE',
      createdAt: order.createdAt,
      taxRate,
      company: {
        name: order.company.name,
        address: order.company.address || undefined,
        phone: order.company.phone || undefined,
        email: order.company.email || undefined,
        rfc: order.company.rfc || undefined
      },
      customer: {
        name: order.customerName,
        email: order.customerEmail,
        phone: order.customerPhone,
        address: order.customerAddress || undefined
      },
      items: (order.items as any[]).map(item => ({
        productName: item.productName,
        description: item.description || undefined,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal
      })),
      subtotal: Number(order.subtotal),
      tax: Number(order.tax),
      total: Number(order.total),
      notes: order.notes || undefined
    }

    // Generar PDF
    const pdfBuffer = await generateOnlineOrderPDF(pdfData)

    // Retornar PDF
    const filename = order.type === 'QUOTE' 
      ? `Cotizacion-${order.orderNumber}.pdf`
      : `Orden-${order.orderNumber}.pdf`

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString()
      }
    })

  } catch (error) {
    console.error('Error generating online order PDF:', error)
    return NextResponse.json(
      { error: 'Error al generar PDF' },
      { status: 500 }
    )
  }
}
