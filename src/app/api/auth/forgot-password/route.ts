// src/app/api/auth/forgot-password/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email es requerido' },
        { status: 400 }
      )
    }

    // Buscar usuario por email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true
      }
    })

    // Por seguridad, siempre retornar éxito (no revelar si email existe)
    // Pero solo enviar email si el usuario existe
    if (user && user.isActive) {
      // Generar token único
      const token = crypto.randomBytes(32).toString('hex')
      
      // Calcular expiración (1 hora)
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 1)

      // Guardar token en base de datos
      await prisma.$executeRaw`
        INSERT INTO password_reset_tokens (id, user_id, token, expires_at, used, created_at)
        VALUES (
          ${crypto.randomBytes(15).toString('hex')},
          ${user.id},
          ${token},
          ${expiresAt},
          false,
          NOW()
        )
      `

      // Construir URL de reset
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
      const resetUrl = `${baseUrl}/reset-password/${token}`

      // Obtener configuración de email de la compañía
      const userWithCompany = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          company: {
            select: {
              emailConfigured: true,
              emailProvider: true,
              emailHost: true,
              emailPort: true,
              emailUser: true,
              emailPassword: true,
              emailFromName: true
            }
          }
        }
      })

      // Enviar email solo si está configurado
      if (userWithCompany?.company?.emailConfigured) {
        try {
          const nodemailer = await import('nodemailer')
          
          const transporter = nodemailer.createTransport({
            host: userWithCompany.company.emailHost!,
            port: userWithCompany.company.emailPort!,
            secure: userWithCompany.company.emailPort === 465,
            auth: {
              user: userWithCompany.company.emailUser!,
              pass: userWithCompany.company.emailPassword!
            }
          })

          const mailOptions = {
            from: `"${userWithCompany.company.emailFromName || 'FerreAI'}" <${userWithCompany.company.emailUser}>`,
            to: user.email,
            subject: 'Restablecer contraseña - FerreAI',
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                  .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                  .button { display: inline-block; padding: 15px 30px; background: #2563eb; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
                  .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #6b7280; }
                  .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1 style="margin: 0;">Restablecer Contraseña</h1>
                  </div>
                  <div class="content">
                    <p>Hola <strong>${user.name}</strong>,</p>
                    <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en FerreAI.</p>
                    <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
                    <div style="text-align: center;">
                      <a href="${resetUrl}" class="button">Restablecer Contraseña</a>
                    </div>
                    <p>O copia y pega este enlace en tu navegador:</p>
                    <p style="background: white; padding: 10px; border-radius: 4px; word-break: break-all; font-size: 14px;">
                      ${resetUrl}
                    </p>
                    <div class="warning">
                      <p style="margin: 0;"><strong>⚠️ Importante:</strong></p>
                      <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                        <li>Este enlace expirará en <strong>1 hora</strong></li>
                        <li>Si no solicitaste este cambio, ignora este email</li>
                        <li>Tu contraseña actual permanecerá sin cambios</li>
                      </ul>
                    </div>
                    <p style="margin-top: 30px;">Saludos,<br><strong>Equipo de FerreAI</strong></p>
                  </div>
                  <div class="footer">
                    <p>© ${new Date().getFullYear()} POS Solutions SA de CV. Todos los derechos reservados.</p>
                    <p>Este es un email automático, por favor no respondas a este mensaje.</p>
                  </div>
                </div>
              </body>
              </html>
            `
          }

          await transporter.sendMail(mailOptions)
          
          console.log(`✅ Email de reset enviado a: ${user.email}`)
        } catch (emailError) {
          console.error('❌ Error al enviar email:', emailError)
          // No fallar la request si el email falla
        }
      } else {
        // Email no configurado, registrar para que admin lo maneje manualmente
        console.log(`⚠️ Email no configurado para compañía del usuario: ${user.email}`)
        console.log(`📋 Token de reset (para uso manual): ${resetUrl}`)
      }
    }

    // Siempre retornar éxito (seguridad)
    return NextResponse.json({ 
      success: true,
      message: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña'
    })

  } catch (error) {
    console.error('❌ Error en forgot-password:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
