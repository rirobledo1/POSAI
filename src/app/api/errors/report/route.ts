// 🎯 API ENDPOINT PARA REPORTE DE ERRORES
// src/app/api/errors/report/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ErrorDetails } from '@/components/error/ErrorBoundarySystem'

// 🎯 Máximo de errores por usuario por hora
const MAX_ERRORS_PER_HOUR = 50
const errorCounts = new Map<string, { count: number, resetTime: number }>()

// 🎯 Función para verificar rate limiting
function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const userCount = errorCounts.get(userId)
  
  if (!userCount || now > userCount.resetTime) {
    errorCounts.set(userId, { count: 1, resetTime: now + 3600000 }) // 1 hora
    return true
  }
  
  if (userCount.count >= MAX_ERRORS_PER_HOUR) {
    return false
  }
  
  userCount.count++
  return true
}

// 🎯 Función para clasificar la severidad automáticamente
function validateAndProcessError(errorDetails: any): ErrorDetails {
  // Validar campos requeridos
  if (!errorDetails.message || !errorDetails.timestamp) {
    throw new Error('Campos requeridos faltantes: message, timestamp')
  }

  // Sanitizar y procesar el error
  return {
    id: errorDetails.id || `api-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    message: String(errorDetails.message).substring(0, 1000), // Limitar longitud
    stack: errorDetails.stack ? String(errorDetails.stack).substring(0, 5000) : undefined,
    severity: errorDetails.severity || 'medium',
    category: errorDetails.category || 'unknown',
    timestamp: Number(errorDetails.timestamp),
    userAgent: String(errorDetails.userAgent || 'unknown').substring(0, 500),
    url: String(errorDetails.url || 'unknown').substring(0, 1000),
    userId: errorDetails.userId,
    recoverable: Boolean(errorDetails.recoverable)
  }
}

// 🎯 POST - Reportar un error
export async function POST(request: NextRequest) {
  try {
    // Obtener sesión del usuario
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id || 'anonymous'

    // Verificar rate limiting
    if (!checkRateLimit(userId)) {
      return NextResponse.json(
        { error: 'Demasiados reportes de errores. Intenta más tarde.' },
        { status: 429 }
      )
    }

    // Parsear el cuerpo de la petición
    const body = await request.json()
    
    // Validar y procesar el error
    const errorDetails = validateAndProcessError(body)
    
    // Obtener información adicional del request
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     '127.0.0.1'

    // Log en consola para desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 Error Report [${errorDetails.severity.toUpperCase()}]`)
      console.log('ID:', errorDetails.id)
      console.log('Message:', errorDetails.message)
      console.log('Category:', errorDetails.category)
      console.log('URL:', errorDetails.url)
      console.log('User ID:', userId)
      console.log('Recoverable:', errorDetails.recoverable)
      if (errorDetails.stack) {
        console.log('Stack:', errorDetails.stack)
      }
      console.groupEnd()
    }

    return NextResponse.json({
      success: true,
      errorId: errorDetails.id,
      message: 'Error reportado correctamente'
    })

  } catch (error) {
    console.error('Error in error reporting endpoint:', error)
    
    return NextResponse.json(
      { 
        error: 'Error interno del servidor al procesar el reporte',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}