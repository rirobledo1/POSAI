// src/app/api/tienda/[slug]/orders/[id]/send-email/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateOnlineOrderPDF } from '@/lib/pdf/onlineOrder'
import { sendEmail } from '@/lib/email/nodemailer'

/**
 * POST /api/tienda/[slug]/orders/[id]/send-email
 * Enviar orden online por email
 * Endpoint público - no requiere autenticación
 */
export async function POST(
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

    // Preparar email
    const isQuote = order.type === 'QUOTE'
    const subject = isQuote
      ? `Solicitud de Cotización ${order.orderNumber} - ${order.company.name}`
      : `Orden de Compra ${order.orderNumber} - ${order.company.name}`

    const html = generateOrderEmailTemplate({
      orderNumber: order.orderNumber,
      type: order.type as 'QUOTE' | 'SALE',
      customerName: order.customerName,
      total: Number(order.total),
      companyName: order.company.name,
      companyPhone: order.company.phone || '',
      companyEmail: order.company.email || '',
      itemsCount: (order.items as any[]).length
    })

    const filename = isQuote
      ? `Cotizacion-${order.orderNumber}.pdf`
      : `Orden-${order.orderNumber}.pdf`

    // Enviar email
    const result = await sendEmail({
      companyId: order.companyId,
      to: order.customerEmail,
      subject,
      html,
      attachments: [
        {
          filename,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    })

    if (!result.success) {
      throw new Error(result.error || 'Error al enviar email')
    }

    // Actualizar orden con fecha de envío
    await prisma.onlineOrder.update({
      where: { id },
      data: {
        emailSentAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Email enviado exitosamente',
      sentTo: order.customerEmail
    })

  } catch (error) {
    console.error('Error sending online order email:', error)
    return NextResponse.json(
      { error: 'Error al enviar email' },
      { status: 500 }
    )
  }
}

// Plantilla de email para órdenes online
function generateOrderEmailTemplate(data: {
  orderNumber: string
  type: 'QUOTE' | 'SALE'
  customerName: string
  total: number
  companyName: string
  companyPhone: string
  companyEmail: string
  itemsCount: number
}): string {
  const isQuote = data.type === 'QUOTE'
  const title = isQuote ? 'Solicitud de Cotización' : 'Orden de Compra'
  const icon = isQuote ? '📝' : '🛒'
  const message = isQuote
    ? 'Hemos recibido tu solicitud de cotización. Nos pondremos en contacto contigo pronto con los precios y disponibilidad.'
    : 'Hemos recibido tu orden de compra. Nos comunicaremos contigo para coordinar el pago y la entrega.'

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">${icon} ${title}</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">
                ${data.companyName}
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 30px;">
              <p style="font-size: 16px; color: #333; margin: 0 0 20px 0;">
                Hola <strong>${data.customerName}</strong>,
              </p>
              
              <p style="font-size: 14px; color: #666; line-height: 1.6; margin: 0 0 20px 0;">
                ${message}
              </p>
              
              <!-- Order Info Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 8px; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 5px 0;">
                          <span style="color: #666; font-size: 12px;">Número de orden:</span><br>
                          <strong style="color: #3b82f6; font-size: 16px;">${data.orderNumber}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 5px 0;">
                          <span style="color: #666; font-size: 12px;">Productos:</span><br>
                          <strong style="color: #333; font-size: 14px;">${data.itemsCount} artículo(s)</strong>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0 0 0; border-top: 1px solid #e5e7eb; margin-top: 10px;">
                          <span style="color: #666; font-size: 12px;">Total:</span><br>
                          <strong style="color: #10b981; font-size: 24px;">$${data.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <p style="font-size: 14px; color: #666; margin: 0 0 10px 0;">
                📎 <strong>Adjuntamos el PDF</strong> con el detalle completo de tu ${isQuote ? 'solicitud' : 'orden'}.
              </p>
              
              <!-- Contact -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #eff6ff; border-radius: 8px; margin-top: 20px;">
                <tr>
                  <td style="padding: 15px;">
                    <p style="margin: 0 0 10px 0; font-size: 14px; color: #1e40af; font-weight: bold;">
                      ¿Tienes preguntas?
                    </p>
                    ${data.companyPhone ? `
                    <p style="margin: 0 0 5px 0; font-size: 13px; color: #666;">
                      📞 ${data.companyPhone}
                    </p>
                    ` : ''}
                    ${data.companyEmail ? `
                    <p style="margin: 0; font-size: 13px; color: #666;">
                      ✉️ ${data.companyEmail}
                    </p>
                    ` : ''}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 5px 0; font-size: 14px; color: #666;">
                ¡Gracias por tu preferencia!
              </p>
              <p style="margin: 0; font-size: 12px; color: #999;">
                ${data.companyName}
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}
