// Servicio de email con Nodemailer - Multi-tenant
import nodemailer from 'nodemailer'
import { decrypt } from '@/lib/encryption'
import { prisma } from '@/lib/prisma'

export interface EmailConfig {
  provider: 'GMAIL' | 'OUTLOOK' | 'SMTP' | 'NONE'
  host: string
  port: number
  secure: boolean
  user: string
  password: string
  fromName: string
}

// Presets para proveedores comunes
export const EMAIL_PRESETS = {
  GMAIL: {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    instructions: 'Usa una "Contraseña de aplicación" de Google. Ve a: https://myaccount.google.com/apppasswords'
  },
  OUTLOOK: {
    host: 'smtp-mail.outlook.com',
    port: 587,
    secure: false,
    instructions: 'Usa tu contraseña normal de Outlook/Hotmail'
  },
  SMTP: {
    host: '',
    port: 587,
    secure: false,
    instructions: 'Configura tu servidor SMTP personalizado'
  }
}

/**
 * Obtiene la configuración de email de una empresa
 */
export async function getCompanyEmailConfig(companyId: string): Promise<EmailConfig | null> {
  try {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        emailProvider: true,
        emailHost: true,
        emailPort: true,
        emailUser: true,
        emailPassword: true,
        emailFromName: true,
        emailSecure: true,
        emailConfigured: true,
        name: true
      }
    })

    if (!company || !company.emailConfigured || !company.emailPassword) {
      return null
    }

    // Desencriptar contraseña
    const password = decrypt(company.emailPassword)

    return {
      provider: company.emailProvider as any,
      host: company.emailHost || '',
      port: company.emailPort || 587,
      secure: company.emailSecure || false,
      user: company.emailUser || '',
      password,
      fromName: company.emailFromName || company.name
    }
  } catch (error) {
    console.error('Error obteniendo configuración de email:', error)
    return null
  }
}

/**
 * Crea un transportador de Nodemailer para una empresa
 */
export async function createEmailTransporter(companyId: string) {
  const config = await getCompanyEmailConfig(companyId)
  
  if (!config) {
    throw new Error('Configuración de email no encontrada o incompleta')
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.password
    }
  })

  return {
    transporter,
    from: `${config.fromName} <${config.user}>`
  }
}

/**
 * Verifica la conexión de email
 */
export async function verifyEmailConnection(companyId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { transporter } = await createEmailTransporter(companyId)
    await transporter.verify()
    return { success: true }
  } catch (error) {
    console.error('Error verificando conexión de email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error de conexión'
    }
  }
}

/**
 * Envía un email genérico
 */
interface SendEmailParams {
  companyId: string
  to: string | string[]
  subject: string
  html: string
  text?: string
  attachments?: Array<{
    filename: string
    content: Buffer | string
    contentType?: string
  }>
}

export async function sendEmail(params: SendEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const { transporter, from } = await createEmailTransporter(params.companyId)

    const result = await transporter.sendMail({
      from,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text || params.subject,
      attachments: params.attachments
    })

    console.log('✅ Email enviado:', result.messageId)
    
    return {
      success: true,
      messageId: result.messageId
    }
  } catch (error) {
    console.error('❌ Error enviando email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error enviando email'
    }
  }
}
