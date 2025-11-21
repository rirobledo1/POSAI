// src/app/api/quotations/[id]/send-email/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendQuotation } from '@/lib/email/emailService'
import { generateQuotationPDF } from '@/lib/pdf/quotation'

// POST: Enviar cotización por email
export async function POST(
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
            id: true,
            name: true,
            address: true,
            phone: true,
            email: true,
            rfc: true,
            taxRate: true,
            plan: true // Agregar plan aquí
          }
        },
        branch: true,
        createdBy: {
          select: {
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

    // Verificar permisos del plan
    const companyPlan = quotation.company.plan || 'FREE'
    
    // Plan FREE no puede enviar emails
    if (companyPlan === 'FREE') {
      return NextResponse.json(
        { 
          error: 'Tu plan no incluye envío de cotizaciones por email',
          upgrade: true,
          requiredPlan: 'PRO'
        },
        { status: 403 }
      )
    }

    const data = await req.json()
    const recipientEmail = data.email || quotation.customer.email

    if (!recipientEmail) {
      return NextResponse.json(
        { error: 'No se especificó email de destinatario' },
        { status: 400 }
      )
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(recipientEmail)) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      )
    }

    // Preparar datos para el PDF
    const taxRate = Number(quotation.company.taxRate) || 16
    
    const pdfData = {
      quotationNumber: quotation.quotationNumber,
      createdAt: quotation.createdAt,
      validUntil: quotation.validUntil,
      taxRate,
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

    // Generar PDF de la cotización
    const pdfBuffer = await generateQuotationPDF(pdfData)

    // Enviar email usando el servicio existente
    const result = await sendQuotation({
      companyId: quotation.companyId,
      to: recipientEmail,
      customerName: quotation.customer.name,
      quotationNumber: quotation.quotationNumber,
      validUntil: new Date(quotation.validUntil).toLocaleDateString('es-MX'),
      total: Number(quotation.total),
      pdfBuffer,
      pdfFilename: `Cotizacion-${quotation.quotationNumber}.pdf`,
      companyName: quotation.company.name
    })

    if (!result.success) {
      throw new Error(result.error || 'Error al enviar email')
    }

    // Actualizar cotización y marcar sentVia
    const currentSentVia = quotation.sentVia || []
    await prisma.quotation.update({
      where: { id },
      data: {
        emailSentAt: new Date(),
        sentAt: quotation.sentAt || new Date(),
        sentVia: {
          set: Array.from(new Set([...currentSentVia, 'email']))
        },
        status: quotation.status === 'DRAFT' ? 'SENT' : quotation.status
      }
    })

    // Registrar en logs de email
    await prisma.emailLog.create({
      data: {
        companyId: quotation.companyId,
        customerId: quotation.customerId,
        type: 'OTHER',
        recipient: recipientEmail,
        subject: `Cotización ${quotation.quotationNumber}`,
        status: 'SENT',
        sentAt: new Date(),
        metadata: {
          quotationId: quotation.id,
          quotationNumber: quotation.quotationNumber
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Cotización enviada por email exitosamente',
      sentTo: recipientEmail
    })

  } catch (error) {
    console.error('Error sending quotation email:', error)
    return NextResponse.json(
      { error: 'Error al enviar cotización por email' },
      { status: 500 }
    )
  }
}
