// Servicio principal para envío de emails con plantillas
import { sendEmail } from './nodemailer'
import { 
  getAccountStatementTemplate, 
  getPaymentReminderTemplate,
  getPaymentConfirmationTemplate 
} from './templates'

interface SendEmailResult {
  success: boolean
  messageId?: string
  error?: string
}

// ===== ESTADO DE CUENTA =====
interface SendAccountStatementParams {
  companyId: string
  to: string
  customerName: string
  creditLimit: number
  currentDebt: number
  availableCredit: number
  pendingSales: number
  overdueAmount: number
  pdfBuffer: Buffer
  pdfFilename: string
  companyName?: string
}

export async function sendAccountStatement(params: SendAccountStatementParams): Promise<SendEmailResult> {
  try {
    const html = getAccountStatementTemplate({
      customerName: params.customerName,
      subject: 'Estado de Cuenta',
      creditLimit: params.creditLimit,
      currentDebt: params.currentDebt,
      availableCredit: params.availableCredit,
      pendingSales: params.pendingSales,
      overdueAmount: params.overdueAmount,
      companyName: params.companyName
    })

    const result = await sendEmail({
      companyId: params.companyId,
      to: params.to,
      subject: `Estado de Cuenta - ${params.companyName || 'Su cuenta'}`,
      html,
      attachments: [
        {
          filename: params.pdfFilename,
          content: params.pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    })

    return result
  } catch (error) {
    console.error('❌ Error enviando estado de cuenta:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    }
  }
}

// ===== RECORDATORIO DE PAGO =====
interface SendPaymentReminderParams {
  companyId: string
  to: string
  customerName: string
  dueDate: string
  amount: number
  daysUntilDue?: number
  daysOverdue?: number
  invoiceNumber: string
  companyName?: string
}

export async function sendPaymentReminder(params: SendPaymentReminderParams): Promise<SendEmailResult> {
  try {
    const isOverdue = params.daysOverdue && params.daysOverdue > 0
    const subject = isOverdue 
      ? `🔴 Pago Vencido - Factura ${params.invoiceNumber}`
      : `⚠️ Recordatorio de Pago - Factura ${params.invoiceNumber}`

    const html = getPaymentReminderTemplate({
      customerName: params.customerName,
      subject,
      dueDate: params.dueDate,
      amount: params.amount,
      daysUntilDue: params.daysUntilDue,
      daysOverdue: params.daysOverdue,
      invoiceNumber: params.invoiceNumber,
      companyName: params.companyName
    })

    const result = await sendEmail({
      companyId: params.companyId,
      to: params.to,
      subject,
      html
    })

    return result
  } catch (error) {
    console.error('❌ Error enviando recordatorio:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    }
  }
}

// ===== CONFIRMACIÓN DE PAGO =====
interface SendPaymentConfirmationParams {
  companyId: string
  to: string
  customerName: string
  amount: number
  paymentDate: string
  paymentMethod: string
  reference?: string
  remainingBalance: number
  invoiceNumber?: string
  companyName?: string
}

export async function sendPaymentConfirmation(params: SendPaymentConfirmationParams): Promise<SendEmailResult> {
  try {
    const html = getPaymentConfirmationTemplate({
      customerName: params.customerName,
      subject: 'Confirmación de Pago',
      amount: params.amount,
      paymentDate: params.paymentDate,
      paymentMethod: params.paymentMethod,
      reference: params.reference,
      remainingBalance: params.remainingBalance,
      invoiceNumber: params.invoiceNumber,
      companyName: params.companyName
    })

    const result = await sendEmail({
      companyId: params.companyId,
      to: params.to,
      subject: `✅ Pago Recibido - ${params.companyName || 'Gracias'}`,
      html
    })

    return result
  } catch (error) {
    console.error('❌ Error enviando confirmación:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    }
  }
}

// ===== COTIZACIÓN (FUTURO) =====
interface SendQuotationParams {
  companyId: string
  to: string
  customerName: string
  quotationNumber: string
  validUntil: string
  total: number
  pdfBuffer?: Buffer
  pdfFilename?: string
  companyName?: string
}

export async function sendQuotation(params: SendQuotationParams): Promise<SendEmailResult> {
  try {
    // Esta plantilla la crearemos cuando implementes el módulo de cotizaciones
    const html = `
      <h2>Cotización ${params.quotationNumber}</h2>
      <p>Estimado/a ${params.customerName},</p>
      <p>Adjunto encontrarás la cotización solicitada.</p>
      <p>Total: $${params.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
      <p>Válida hasta: ${params.validUntil}</p>
    `

    const attachments = params.pdfBuffer ? [
      {
        filename: params.pdfFilename || 'cotizacion.pdf',
        content: params.pdfBuffer,
        contentType: 'application/pdf'
      }
    ] : undefined

    const result = await sendEmail({
      companyId: params.companyId,
      to: params.to,
      subject: `Cotización ${params.quotationNumber} - ${params.companyName}`,
      html,
      attachments
    })

    return result
  } catch (error) {
    console.error('❌ Error enviando cotización:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    }
  }
}
