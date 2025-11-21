// API para configuración de email
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { encrypt, decrypt } from '@/lib/encryption'

// GET - Obtener configuración actual
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const companyId = session.user.companyId

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

    if (!company) {
      return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 })
    }

    // No enviar la contraseña al cliente (solo un placeholder si existe)
    const config = {
      provider: company.emailProvider || 'NONE',
      host: company.emailHost || '',
      port: company.emailPort || 587,
      secure: company.emailSecure || false,
      user: company.emailUser || '',
      password: company.emailPassword ? '••••••••' : '',
      fromName: company.emailFromName || company.name,
      configured: company.emailConfigured
    }

    return NextResponse.json(config)

  } catch (error) {
    console.error('❌ Error obteniendo configuración de email:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST - Guardar configuración
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const companyId = session.user.companyId
    const body = await request.json()

    const {
      provider,
      host,
      port,
      secure,
      user,
      password,
      fromName
    } = body

    // Validaciones
    if (!provider || provider === 'NONE') {
      return NextResponse.json(
        { error: 'Debes seleccionar un proveedor' },
        { status: 400 }
      )
    }

    if (!user || !password || !fromName) {
      return NextResponse.json(
        { error: 'Email, contraseña y nombre del remitente son requeridos' },
        { status: 400 }
      )
    }

    // Si la contraseña no cambió (es el placeholder), no la actualizamos
    let encryptedPassword: string | undefined
    if (password !== '••••••••') {
      encryptedPassword = encrypt(password)
    }

    // Actualizar configuración
    const updateData: any = {
      emailProvider: provider,
      emailHost: host,
      emailPort: parseInt(port),
      emailSecure: secure,
      emailUser: user,
      emailFromName: fromName,
      emailConfigured: true
    }

    // Solo actualizar contraseña si cambió
    if (encryptedPassword) {
      updateData.emailPassword = encryptedPassword
    }

    await prisma.company.update({
      where: { id: companyId },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      message: 'Configuración guardada exitosamente'
    })

  } catch (error) {
    console.error('❌ Error guardando configuración de email:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
