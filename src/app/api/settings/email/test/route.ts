// API para probar conexión de email
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import nodemailer from 'nodemailer'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { host, port, secure, user, password } = body

    // Validaciones
    if (!host || !user || !password) {
      return NextResponse.json(
        { error: 'Faltan datos de configuración' },
        { status: 400 }
      )
    }

    // Crear transportador de prueba
    const transporter = nodemailer.createTransport({
      host,
      port: parseInt(port),
      secure,
      auth: {
        user,
        pass: password
      }
    })

    // Verificar conexión
    await transporter.verify()

    return NextResponse.json({
      success: true,
      message: 'Conexión exitosa'
    })

  } catch (error) {
    console.error('❌ Error probando conexión:', error)
    
    let errorMessage = 'Error de conexión'
    
    if (error instanceof Error) {
      if (error.message.includes('Invalid login')) {
        errorMessage = 'Usuario o contraseña incorrectos'
      } else if (error.message.includes('ECONNREFUSED')) {
        errorMessage = 'No se pudo conectar al servidor SMTP'
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Tiempo de espera agotado'
      } else {
        errorMessage = error.message
      }
    }

    return NextResponse.json(
      { 
        success: false,
        error: errorMessage 
      },
      { status: 400 }
    )
  }
}
