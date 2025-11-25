// src/app/api/auth/validate-reset-token/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { valid: false, error: 'Token no proporcionado' },
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
      LIMIT 1
    `

    if (!resetToken || resetToken.length === 0) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Token no encontrado' 
      })
    }

    const tokenData = resetToken[0]

    // Verificar si ya fue usado
    if (tokenData.used) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Este enlace ya fue utilizado' 
      })
    }

    // Verificar si expiró
    const now = new Date()
    const expiresAt = new Date(tokenData.expires_at)
    
    if (expiresAt < now) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Este enlace ha expirado' 
      })
    }

    // Token válido
    return NextResponse.json({ 
      valid: true,
      expiresAt: tokenData.expires_at
    })

  } catch (error) {
    console.error('❌ Error en validate-reset-token:', error)
    return NextResponse.json(
      { valid: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
