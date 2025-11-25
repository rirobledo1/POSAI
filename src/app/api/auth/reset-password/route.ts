// src/app/api/auth/reset-password/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token y contraseña son requeridos' },
        { status: 400 }
      )
    }

    // Validar longitud de contraseña
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 8 caracteres' },
        { status: 400 }
      )
    }

    // Buscar token válido
    const resetToken = await prisma.$queryRaw<Array<{
      id: string
      user_id: string
      token: string
      expires_at: Date
      used: boolean
    }>>`
      SELECT id, user_id, token, expires_at, used
      FROM password_reset_tokens
      WHERE token = ${token}
        AND used = false
        AND expires_at > NOW()
      LIMIT 1
    `

    if (!resetToken || resetToken.length === 0) {
      return NextResponse.json(
        { error: 'Token inválido o expirado' },
        { status: 400 }
      )
    }

    const tokenData = resetToken[0]

    // Hash de la nueva contraseña
    const hashedPassword = await bcrypt.hash(password, 10)

    // Actualizar contraseña del usuario
    await prisma.user.update({
      where: { id: tokenData.user_id },
      data: { password: hashedPassword }
    })

    // Marcar token como usado
    await prisma.$executeRaw`
      UPDATE password_reset_tokens
      SET used = true
      WHERE id = ${tokenData.id}
    `

    // Invalidar todos los demás tokens del usuario (seguridad)
    await prisma.$executeRaw`
      UPDATE password_reset_tokens
      SET used = true
      WHERE user_id = ${tokenData.user_id}
        AND id != ${tokenData.id}
        AND used = false
    `

    console.log(`✅ Contraseña restablecida para usuario: ${tokenData.user_id}`)

    return NextResponse.json({ 
      success: true,
      message: 'Contraseña restablecida exitosamente'
    })

  } catch (error) {
    console.error('❌ Error en reset-password:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
