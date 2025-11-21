import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const posSettingsSchema = z.object({
  posTitle: z.string().min(1, 'El título del POS es requerido').max(100),
  receiptFooter: z.string().max(500).optional(),
  enableSounds: z.boolean().optional().default(true),
  enableNotifications: z.boolean().optional().default(true),
  autoCompleteEnabled: z.boolean().optional().default(true),
  requireCustomer: z.boolean().optional().default(false),
  defaultPaymentMethod: z.enum(['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'CREDITO']).optional(),
  showProductImages: z.boolean().optional().default(true),
  itemsPerPage: z.number().min(5).max(100).optional().default(20),
  quickAccessCategories: z.array(z.string()).optional().default([]),
  printerEnabled: z.boolean().optional().default(false),
  printerName: z.string().optional(),
  autoPrint: z.boolean().optional().default(false)
})

// GET - Obtener configuración del POS de la compañía
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { companyId } = session.user

    console.log('🔍 Obteniendo configuración POS para compañía:', companyId)

    // Obtener configuración de la compañía
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        name: true,
        settings: true
      }
    })

    if (!company) {
      return NextResponse.json(
        { error: 'Compañía no encontrada' },
        { status: 404 }
      )
    }

    // Extraer configuración POS del campo settings (JSON)
    const settings = company.settings as any || {}
    const posSettings = settings.pos || {}

    // Configuración por defecto si no existe
    const defaultSettings = {
      posTitle: company.name || 'Punto de Venta',
      receiptFooter: '¡Gracias por su compra!',
      enableSounds: true,
      enableNotifications: true,
      autoCompleteEnabled: true,
      requireCustomer: false,
      defaultPaymentMethod: 'EFECTIVO',
      showProductImages: true,
      itemsPerPage: 20,
      quickAccessCategories: [],
      printerEnabled: false,
      printerName: '',
      autoPrint: false
    }

    const response = {
      ...defaultSettings,
      ...posSettings,
      companyId,
      companyName: company.name
    }

    console.log('✅ Configuración POS obtenida:', { posTitle: response.posTitle })

    return NextResponse.json(response)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    console.error('❌ Error obteniendo configuración POS:', errorMessage)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar configuración del POS
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { companyId, role } = session.user

    // Solo ADMIN puede actualizar configuración POS
    if (role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado. Solo administradores pueden actualizar la configuración del POS.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    console.log('📝 Actualizando configuración POS:', { companyId, posTitle: body.posTitle })
    
    // Validar datos
    const validatedData = posSettingsSchema.parse(body)

    // Obtener configuración actual
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { settings: true }
    })

    // Actualizar solo la sección POS del JSON settings
    const currentSettings = (company?.settings as any) || {}
    const updatedSettings = {
      ...currentSettings,
      pos: {
        ...validatedData,
        updatedAt: new Date().toISOString()
      }
    }

    // Actualizar compañía
    const updatedCompany = await prisma.company.update({
      where: { id: companyId },
      data: {
        settings: updatedSettings,
        updatedAt: new Date()
      },
      select: {
        id: true,
        name: true,
        settings: true,
        updatedAt: true
      }
    })

    // Log de auditoría
    try {
      await prisma.auditLog.create({
        data: {
          action: 'UPDATE_POS_SETTINGS',
          entityType: 'COMPANY',
          entityId: companyId,
          userId: session.user.id!,
          details: {
            companyId,
            changes: validatedData
          }
        }
      })
    } catch (auditError) {
      console.error('Error creating audit log:', auditError)
    }

    console.log('✅ Configuración POS actualizada exitosamente')

    const posSettings = (updatedCompany.settings as any)?.pos || {}

    return NextResponse.json({
      ...posSettings,
      companyId: updatedCompany.id,
      companyName: updatedCompany.name,
      updatedAt: updatedCompany.updatedAt.toISOString()
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      )
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    console.error('❌ Error actualizando configuración POS:', errorMessage)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST - Reiniciar configuración POS a valores por defecto
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { companyId, role } = session.user

    // Solo ADMIN puede reiniciar configuración
    if (role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado. Solo administradores pueden reiniciar la configuración.' },
        { status: 403 }
      )
    }

    console.log('🔄 Reiniciando configuración POS a valores por defecto:', companyId)

    // Obtener nombre de la compañía
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { name: true, settings: true }
    })

    if (!company) {
      return NextResponse.json(
        { error: 'Compañía no encontrada' },
        { status: 404 }
      )
    }

    // Configuración por defecto
    const defaultPOSSettings = {
      posTitle: company.name || 'Punto de Venta',
      receiptFooter: '¡Gracias por su compra!',
      enableSounds: true,
      enableNotifications: true,
      autoCompleteEnabled: true,
      requireCustomer: false,
      defaultPaymentMethod: 'EFECTIVO',
      showProductImages: true,
      itemsPerPage: 20,
      quickAccessCategories: [],
      printerEnabled: false,
      printerName: '',
      autoPrint: false,
      updatedAt: new Date().toISOString()
    }

    // Actualizar solo la sección POS manteniendo otras configuraciones
    const currentSettings = (company.settings as any) || {}
    const updatedSettings = {
      ...currentSettings,
      pos: defaultPOSSettings
    }

    await prisma.company.update({
      where: { id: companyId },
      data: {
        settings: updatedSettings,
        updatedAt: new Date()
      }
    })

    // Log de auditoría
    try {
      await prisma.auditLog.create({
        data: {
          action: 'RESET_POS_SETTINGS',
          entityType: 'COMPANY',
          entityId: companyId,
          userId: session.user.id!,
          details: {
            companyId,
            message: 'Configuración POS reiniciada a valores por defecto'
          }
        }
      })
    } catch (auditError) {
      console.error('Error creating audit log:', auditError)
    }

    console.log('✅ Configuración POS reiniciada')

    return NextResponse.json({
      ...defaultPOSSettings,
      companyId,
      companyName: company.name
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    console.error('❌ Error reiniciando configuración POS:', errorMessage)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
