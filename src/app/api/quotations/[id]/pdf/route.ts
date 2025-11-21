// src/app/api/quotations/[id]/pdf/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateQuotationPDF } from '@/lib/pdf/quotation'

// GET: Generar y descargar PDF de cotización
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params

    // Obtener cotización completa
    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        customer: true,
        company: {
          select: {
            name: true,
            address: true,
            phone: true,
            email: true,
            rfc: true,
            taxRate: true,  // Obtener la tasa de IVA configurada
          }
        },
        branch: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        items: {
          include: {
            product: true
          },
          orderBy: {
            sortOrder: 'asc'
          }
        }
      }
    })

    if (!quotation) {
      return NextResponse.json(
        { error: 'Cotización no encontrada' },
        { status: 404 }
      )
    }

    // Preparar datos para el PDF
    const taxRate = Number(quotation.company.taxRate) || 16 // Por defecto 16% si no está configurado
    
    const pdfData = {
      quotationNumber: quotation.quotationNumber,
      createdAt: quotation.createdAt,
      validUntil: quotation.validUntil,
      taxRate, // Pasar la tasa de IVA al PDF
      company: {
        name: quotation.company.name,
        address: quotation.company.address || undefined,
        phone: quotation.company.phone || undefined,
        email: quotation.company.email || undefined,
        rfc: quotation.company.rfc || undefined,
      },
      branch: quotation.branch ? {
        name: quotation.branch.name,
        address: quotation.branch.address || undefined,
        phone: quotation.branch.phone || undefined,
      } : {
        name: 'Oficina Principal',
        address: quotation.company.address || undefined,
        phone: quotation.company.phone || undefined,
      },
      customer: {
        name: quotation.customer.name,
        email: quotation.customer.email || undefined,
        phone: quotation.customer.phone || undefined,
        rfc: quotation.customer.rfc || undefined,
        address: quotation.customer.address || undefined,
      },
      items: quotation.items.map(item => ({
        product: {
          name: item.product.name,
          barcode: item.product.barcode || undefined,
        },
        description: item.description || undefined,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        discount: Number(item.discount),
        subtotal: Number(item.subtotal),
      })),
      subtotal: Number(quotation.subtotal),
      discount: Number(quotation.discount),
      discountPercent: Number(quotation.discountPercent) || undefined,
      tax: Number(quotation.tax),
      total: Number(quotation.total),
      notes: quotation.notes || undefined,
      termsConditions: quotation.termsConditions || undefined,
      createdBy: {
        name: quotation.createdBy.name,
      }
    }

    // Generar PDF
    const pdfBuffer = await generateQuotationPDF(pdfData)

    // Retornar PDF como respuesta
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Cotizacion-${quotation.quotationNumber}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    })

  } catch (error) {
    console.error('Error generating PDF:', error)
    return NextResponse.json(
      { error: 'Error al generar PDF' },
      { status: 500 }
    )
  }
}
