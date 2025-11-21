// Este archivo ya no se usa - Ahora usamos Nodemailer
// Ver: src/lib/email/nodemailer.ts

export const emailConfig = {
  from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
  companyEmail: process.env.COMPANY_EMAIL || 'info@tuempresa.com',
  companyName: process.env.COMPANY_NAME || 'Mi Ferretería'
}
