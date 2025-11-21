// API para configuración de recordatorios
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Obtener configuración
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
        remindersEnabled: true,
        reminderDaysBefore: true,
        reminderDaysAfter: true,
        reminderTime: true
      }
    })

    if (!company) {
      return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 })
    }

    return NextResponse.json({
      enabled: company.remindersEnabled,
      daysBefore: company.reminderDaysBefore,
      daysAfter: company.reminderDaysAfter,
      time: company.reminderTime
    })

  } catch (error) {
    console.error('Error obteniendo configuración de recordatorios:', error)
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
      enabled,
      daysBefore,
      daysAfter,
      time
    } = body

    // Validaciones
    if (enabled) {
      if (!daysBefore || daysBefore < 1 || daysBefore > 30) {
        return NextResponse.json(
          { error: 'Días antes debe estar entre 1 y 30' },
          { status: 400 }
        )
      }

      if (!daysAfter || daysAfter.length === 0) {
        return NextResponse.json(
          { error: 'Debes seleccionar al menos un día después' },
          { status: 400 }
        )
      }

      if (!time) {
        return NextResponse.json(
          { error: 'Hora de envío es requerida' },
          { status: 400 }
        )
      }

      // Verificar que tiene email configurado
      const company = await prisma.company.findUnique({
        where: { id: companyId },
        select: { emailConfigured: true }
      })

      if (!company?.emailConfigured) {
        return NextResponse.json(
          { error: 'Primero debes configurar el email en Configuración > Email (SMTP)' },
          { status: 400 }
        )
      }
    }

    // Actualizar configuración
    await prisma.company.update({
      where: { id: companyId },
      data: {
        remindersEnabled: enabled,
        reminderDaysBefore: daysBefore,
        reminderDaysAfter: daysAfter,
        reminderTime: time
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Configuración guardada exitosamente'
    })

  } catch (error) {
    console.error('Error guardando configuración de recordatorios:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
