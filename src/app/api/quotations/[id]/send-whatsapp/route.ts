// src/app/api/quotations/[id]/send-whatsapp/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { 
  sendWhatsAppMessage, 
  generateWhatsAppWebUrl,
  formatPhoneNumber 
} from '@/lib/whatsapp/sender'
import { generateQuotationPDF } from '@/lib/pdf/quotation'
import { uploadToCloudStorage } from '@/lib/storage'

// POST: Enviar cotización por WhatsApp
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
            plan: true
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
    
    // Verificar que el plan permita WhatsApp
    // FREE y BASIC no tienen WhatsApp, PRO y ENTERPRISE sí
    const allowedPlans = ['PRO', 'ENTERPRISE']
    if (!allowedPlans.includes(companyPlan)) {
      return NextResponse.json(
        { 
          error: 'Tu plan no incluye envío de cotizaciones por WhatsApp',
          upgrade: true,
          requiredPlan: 'PRO',
          currentPlan: companyPlan
        },
        { status: 403 }
      )
    }

    const data = await req.json()
    const phoneNumber = data.phone || quotation.customer.phone

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'No se especificó número de teléfono' },
        { status: 400 }
      )
    }

    // Formatear número de teléfono (agregar código de país si falta)
    const formattedPhone = formatPhoneNumber(phoneNumber, '52') // México por defecto

    // Determinar modo de envío según el plan
    const sendMode = data.mode || (companyPlan === 'PRO' ? 'manual' : 'auto')

    // Preparar mensaje
    const message = data.message || formatQuotationMessage(quotation)

    // PLAN PRO: Modo manual (solo devuelve URL de WhatsApp Web)
    if (companyPlan === 'PRO' || sendMode === 'manual') {
      const whatsappUrl = generateWhatsAppWebUrl(formattedPhone, message)

      // Actualizar registro (aunque sea manual)
      await prisma.quotation.update({
        where: { id },
        data: {
          whatsappSentAt: new Date(),
          sentAt: quotation.sentAt || new Date(),
          sentVia: {
            set: Array.from(new Set([...(quotation.sentVia || []), 'whatsapp']))
          },
          status: quotation.status === 'DRAFT' ? 'SENT' : quotation.status
        }
      })

      return NextResponse.json({
        success: true,
        mode: 'manual',
        whatsappUrl,
        message: 'Abre WhatsApp para enviar la cotización',
        instruction: 'Se abrirá WhatsApp Web/App con el mensaje prellenado'
      })
    }

    // PLAN ENTERPRISE: Envío automático via WhatsApp Business API
    if (companyPlan === 'ENTERPRISE') {
      // Obtener configuración de WhatsApp desde variables de entorno
      const businessPhone = process.env.WHATSAPP_BUSINESS_PHONE_ID
      const accessToken = process.env.WHATSAPP_ACCESS_TOKEN

      if (!businessPhone || !accessToken) {
        return NextResponse.json(
          { 
            error: 'WhatsApp Business API no está configurado',
            details: 'Configure WHATSAPP_BUSINESS_PHONE_ID y WHATSAPP_ACCESS_TOKEN en las variables de entorno',
            fallback: 'Puede usar el modo manual por ahora'
          },
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

      // Subir PDF a almacenamiento en la nube (para WhatsApp)
      const pdfUrl = await uploadToCloudStorage(
        pdfBuffer,
        `quotations/${quotation.companyId}/${quotation.id}/${quotation.quotationNumber}.pdf`,
        'application/pdf'
      )

      // Enviar mensaje con PDF adjunto via WhatsApp Business API
      const whatsappResult = await sendWhatsAppMessage({
        to: formattedPhone,
        message: message,
        mediaUrl: pdfUrl,
        mediaType: 'document',
        mediaCaption: `Cotización ${quotation.quotationNumber}`,
        businessPhone: businessPhone,
        accessToken: accessToken
      })

      if (!whatsappResult.success) {
        throw new Error(whatsappResult.error || 'Error al enviar por WhatsApp')
      }

      // Registrar envío
      await prisma.quotation.update({
        where: { id },
        data: {
          whatsappSentAt: new Date(),
          sentAt: quotation.sentAt || new Date(),
          sentVia: {
            set: Array.from(new Set([...(quotation.sentVia || []), 'whatsapp']))
          },
          status: quotation.status === 'DRAFT' ? 'SENT' : quotation.status
        }
      })

      return NextResponse.json({
        success: true,
        mode: 'auto',
        messageId: whatsappResult.messageId,
        message: 'Cotización enviada por WhatsApp exitosamente',
        sentTo: phoneNumber
      })
    }

    // Fallback (no debería llegar aquí)
    return NextResponse.json(
      { error: 'Plan no soportado' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error sending quotation via WhatsApp:', error)
    return NextResponse.json(
      { 
        error: 'Error al enviar cotización por WhatsApp',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}

// Función auxiliar para formatear mensaje de WhatsApp
function formatQuotationMessage(quotation: any): string {
  const validUntil = new Date(quotation.validUntil).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  
  let message = `🏢 *${quotation.company.name}*\n\n`
  message += `📋 *Cotización ${quotation.quotationNumber}*\n\n`
  message += `Estimado/a *${quotation.customer.name}*,\n\n`
  message += `Le enviamos la cotización solicitada:\n\n`
  
  // Listar productos (máximo 5 para no hacer mensaje muy largo)
  message += `*Productos cotizados:*\n`
  const itemsToShow = quotation.items.slice(0, 5)
  itemsToShow.forEach((item: any, index: number) => {
    message += `${index + 1}. ${item.product.name}\n`
    message += `   Cantidad: ${item.quantity} | Precio: $${Number(item.unitPrice).toLocaleString('es-MX', { minimumFractionDigits: 2 })}\n`
  })
  
  if (quotation.items.length > 5) {
    message += `... y ${quotation.items.length - 5} productos más\n`
  }
  
  message += `\n*Resumen:*\n`
  message += `• Subtotal: $${Number(quotation.subtotal).toLocaleString('es-MX', { minimumFractionDigits: 2 })}\n`
  
  if (quotation.discount > 0) {
    message += `• Descuento: -$${Number(quotation.discount).toLocaleString('es-MX', { minimumFractionDigits: 2 })}\n`
  }
  
  message += `• IVA: $${Number(quotation.tax).toLocaleString('es-MX', { minimumFractionDigits: 2 })}\n`
  message += `• *TOTAL: $${Number(quotation.total).toLocaleString('es-MX', { minimumFractionDigits: 2 })}*\n\n`
  
  message += `📅 Válida hasta: *${validUntil}*\n\n`
  
  if (quotation.notes) {
    message += `📝 *Notas:*\n${quotation.notes}\n\n`
  }
  
  message += `Para cualquier duda o aclaración, estamos a sus órdenes.\n\n`
  message += `Saludos cordiales 👋`
  
  return message
}
