// Plantillas HTML para emails

// Configuración por defecto
const defaultConfig = {
  companyEmail: 'info@tuempresa.com',
  companyName: 'Mi Ferretería'
}

interface EmailTemplateData {
  companyName?: string
  customerName: string
  subject: string
}

// Plantilla base para todos los emails
export function getBaseTemplate(content: string, data: EmailTemplateData): string {
  const companyName = data.companyName || defaultConfig.companyName
  const companyEmail = defaultConfig.companyEmail

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.subject}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f4f4f4;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      padding: 30px;
    }
    .greeting {
      font-size: 18px;
      margin-bottom: 20px;
      color: #1f2937;
    }
    .footer {
      background: #f9fafb;
      padding: 20px 30px;
      text-align: center;
      font-size: 12px;
      color: #6b7280;
      border-top: 1px solid #e5e7eb;
    }
    .button {
      display: inline-block;
      padding: 12px 30px;
      background: #3b82f6;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
    }
    .button:hover {
      background: #2563eb;
    }
    .divider {
      height: 1px;
      background: #e5e7eb;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${companyName}</h1>
    </div>
    <div class="content">
      <div class="greeting">Hola ${data.customerName},</div>
      ${content}
    </div>
    <div class="footer">
      <p>Este es un correo automático de ${companyName}.</p>
      <p>Si tienes alguna pregunta, por favor contacta a ${companyEmail}</p>
      <p style="margin-top: 15px; color: #9ca3af;">© ${new Date().getFullYear()} ${companyName}. Todos los derechos reservados.</p>
    </div>
  </div>
</body>
</html>
  `
}

// Plantilla para Estado de Cuenta
interface AccountStatementData extends EmailTemplateData {
  creditLimit: number
  currentDebt: number
  availableCredit: number
  pendingSales: number
  overdueAmount: number
}

export function getAccountStatementTemplate(data: AccountStatementData): string {
  const content = `
    <p>Te enviamos tu estado de cuenta actualizado.</p>
    
    <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #1f2937;">Resumen de Crédito</h3>
      
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 10px 0; color: #6b7280;">Límite de Crédito:</td>
          <td style="padding: 10px 0; text-align: right; font-weight: 600; color: #3b82f6;">
            $${data.creditLimit.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #6b7280;">Deuda Actual:</td>
          <td style="padding: 10px 0; text-align: right; font-weight: 600; color: #ef4444;">
            $${data.currentDebt.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </td>
        </tr>
        <tr style="border-top: 2px solid #e5e7eb;">
          <td style="padding: 10px 0; color: #6b7280; font-weight: 600;">Crédito Disponible:</td>
          <td style="padding: 10px 0; text-align: right; font-weight: 700; color: #10b981; font-size: 18px;">
            $${data.availableCredit.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </td>
        </tr>
      </table>
    </div>

    ${data.pendingSales > 0 ? `
      <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px; margin: 20px 0;">
        <strong style="color: #92400e;">⚠️ Tienes ${data.pendingSales} venta${data.pendingSales > 1 ? 's' : ''} pendiente${data.pendingSales > 1 ? 's' : ''} de pago</strong>
      </div>
    ` : ''}

    ${data.overdueAmount > 0 ? `
      <div style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; border-radius: 4px; margin: 20px 0;">
        <strong style="color: #991b1b;">🔴 Saldo vencido: $${data.overdueAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong>
        <p style="margin: 5px 0 0 0; color: #7f1d1d; font-size: 14px;">
          Te pedimos tu pronta regularización para mantener tu crédito activo.
        </p>
      </div>
    ` : ''}

    <p>Adjunto encontrarás el estado de cuenta detallado en formato PDF con todas tus ventas pendientes e historial de pagos.</p>

    <div class="divider"></div>

    <p style="color: #6b7280; font-size: 14px;">
      Para cualquier aclaración sobre tu estado de cuenta, no dudes en contactarnos.
    </p>
  `

  return getBaseTemplate(content, data)
}

// Plantilla para Recordatorio de Pago
interface PaymentReminderData extends EmailTemplateData {
  dueDate: string
  amount: number
  daysUntilDue?: number
  daysOverdue?: number
  invoiceNumber: string
}

export function getPaymentReminderTemplate(data: PaymentReminderData): string {
  const isOverdue = data.daysOverdue && data.daysOverdue > 0
  
  const content = `
    <p>Te recordamos que tienes un pago pendiente:</p>
    
    <div style="background: ${isOverdue ? '#fee2e2' : '#fef3c7'}; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid ${isOverdue ? '#ef4444' : '#f59e0b'};">
      <h3 style="margin-top: 0; color: ${isOverdue ? '#991b1b' : '#92400e'};">
        ${isOverdue ? '🔴 Pago Vencido' : '⚠️ Pago Próximo a Vencer'}
      </h3>
      
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #374151;">Factura:</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600;">${data.invoiceNumber}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #374151;">Monto:</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 700; font-size: 20px; color: ${isOverdue ? '#ef4444' : '#f59e0b'};">
            $${data.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #374151;">Fecha de vencimiento:</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600;">${data.dueDate}</td>
        </tr>
        ${isOverdue ? `
          <tr>
            <td colspan="2" style="padding: 8px 0; color: #991b1b; font-weight: 600;">
              ⏰ Vencido hace ${data.daysOverdue} día${data.daysOverdue > 1 ? 's' : ''}
            </td>
          </tr>
        ` : data.daysUntilDue ? `
          <tr>
            <td colspan="2" style="padding: 8px 0; color: #92400e; font-weight: 600;">
              ⏰ Vence en ${data.daysUntilDue} día${data.daysUntilDue > 1 ? 's' : ''}
            </td>
          </tr>
        ` : ''}
      </table>
    </div>

    ${isOverdue ? `
      <p style="color: #991b1b; font-weight: 600;">
        Tu pago está vencido. Te pedimos que regularices tu cuenta lo antes posible para evitar inconvenientes con futuras compras.
      </p>
    ` : `
      <p>
        Te pedimos realizar tu pago antes de la fecha de vencimiento para mantener tu crédito activo y evitar cargos adicionales.
      </p>
    `}

    <div class="divider"></div>

    <p style="color: #6b7280; font-size: 14px;">
      Si ya realizaste el pago, por favor ignora este recordatorio.
    </p>
  `

  return getBaseTemplate(content, data)
}

// Plantilla de confirmación de pago
interface PaymentConfirmationData extends EmailTemplateData {
  amount: number
  paymentDate: string
  paymentMethod: string
  reference?: string
  remainingBalance: number
  invoiceNumber?: string
}

export function getPaymentConfirmationTemplate(data: PaymentConfirmationData): string {
  const content = `
    <p>¡Hemos recibido tu pago exitosamente!</p>
    
    <div style="background: #d1fae5; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #10b981;">
      <h3 style="margin-top: 0; color: #065f46;">✅ Pago Confirmado</h3>
      
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #374151;">Monto pagado:</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 700; font-size: 20px; color: #10b981;">
            $${data.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #374151;">Fecha:</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600;">${data.paymentDate}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #374151;">Método de pago:</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600;">${data.paymentMethod}</td>
        </tr>
        ${data.reference ? `
          <tr>
            <td style="padding: 8px 0; color: #374151;">Referencia:</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 600;">${data.reference}</td>
          </tr>
        ` : ''}
        ${data.invoiceNumber ? `
          <tr>
            <td style="padding: 8px 0; color: #374151;">Factura:</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 600;">${data.invoiceNumber}</td>
          </tr>
        ` : ''}
        ${data.remainingBalance > 0 ? `
          <tr style="border-top: 2px solid #a7f3d0;">
            <td style="padding: 8px 0; color: #374151; font-weight: 600;">Saldo pendiente:</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #f59e0b;">
              $${data.remainingBalance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </td>
          </tr>
        ` : `
          <tr style="border-top: 2px solid #a7f3d0;">
            <td colspan="2" style="padding: 8px 0; text-align: center; font-weight: 600; color: #10b981;">
              ✅ Cuenta liquidada
            </td>
          </tr>
        `}
      </table>
    </div>

    <p>Gracias por tu pago. Tu cuenta ha sido actualizada.</p>

    <div class="divider"></div>

    <p style="color: #6b7280; font-size: 14px;">
      Este comprobante es válido como constancia de pago.
    </p>
  `

  return getBaseTemplate(content, data)
}
