import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const companySchema = z.object({
  name: z.string().min(2, 'El nombre de la empresa debe tener al menos 2 caracteres'),
  businessType: z.string().optional(),
  phone: z.string().min(8, 'El teléfono debe tener al menos 8 caracteres').optional(),
  email: z.string().email('Email inválido').optional(),
  address: z.string().min(5, 'La dirección debe tener al menos 5 caracteres').optional(),
  taxId: z.string().min(5, 'El RUT/RFC debe tener al menos 5 caracteres').optional(),
  logo: z.string().optional(),
  taxRate: z.number().min(0).max(100, 'El porcentaje de impuesto debe estar entre 0 y 100').optional(),
  currency: z.string().length(3, 'La moneda debe ser un código de 3 letras').optional(),
  timezone: z.string().min(3, 'La zona horaria es requerida').optional()
})

// GET - Obtener configuración de la compañía del usuario
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { companyId } = session.user

    console.log('🔍 Buscando configuración de compañía:', companyId)

    // Obtener datos de la compañía
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        name: true,
        slug: true,
        businessType: true,
        phone: true,
        email: true,
        address: true,
        taxId: true,
        logo: true,
        taxRate: true,
        currency: true,
        timezone: true,
        plan: true,
        status: true,
        settings: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!company) {
      return NextResponse.json(
        { error: 'Compañía no encontrada' },
        { status: 404 }
      )
    }

    console.log('✅ Configuración encontrada:', { 
      name: company.name,
      taxRate: company.taxRate,
      currency: company.currency 
    })

    // Formatear respuesta con campos compatibles con frontend legacy
    const response = {
      id: company.id,
      name: company.name,
      businessName: company.name, // Alias para compatibilidad
      slug: company.slug,
      businessType: company.businessType,
      taxId: company.taxId || '',
      email: company.email || '',
      phone: company.phone || '',
      address: company.address || '',
      city: 'Ciudad', // TODO: Agregar al schema
      state: 'Estado', // TODO: Agregar al schema
      country: 'México', // TODO: Agregar al schema
      postalCode: '00000', // TODO: Agregar al schema
      currency: company.currency,
      timezone: company.timezone,
      fiscalYear: 'enero', // TODO: Agregar al schema si es necesario
      taxPercentage: company.taxRate.toNumber(),
      taxRate: company.taxRate.toNumber(), // Alias
      invoicePrefix: 'FAC-', // TODO: Mover de company_settings a companies
      quotePrefix: 'COT-', // TODO: Agregar al schema
      receiptPrefix: 'REC-', // TODO: Agregar al schema
      logo: company.logo || '',
      plan: company.plan,
      status: company.status,
      settings: company.settings,
      createdAt: company.createdAt.toISOString(),
      updatedAt: company.updatedAt.toISOString()
    }

    return NextResponse.json(response)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    console.error('❌ Error obteniendo configuración de compañía:', errorMessage)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar configuración de la compañía
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { companyId, role } = session.user

    // Solo ADMIN puede actualizar configuración de compañía
    if (role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado. Solo administradores pueden actualizar la configuración de la compañía.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    console.log('📝 Actualizando configuración de compañía:', { 
      companyId,
      taxRate: body.taxRate || body.taxPercentage, 
      currency: body.currency 
    })
    
    // Validar datos
    const validatedData = companySchema.parse({
      name: body.name,
      businessType: body.businessType,
      phone: body.phone,
      email: body.email,
      address: body.address,
      taxId: body.taxId,
      logo: body.logo,
      taxRate: body.taxRate || body.taxPercentage, // Aceptar ambos nombres
      currency: body.currency,
      timezone: body.timezone
    })

    // Actualizar compañía
    const updatedCompany = await prisma.company.update({
      where: { id: companyId },
      data: {
        name: validatedData.name,
        businessType: validatedData.businessType,
        phone: validatedData.phone,
        email: validatedData.email,
        address: validatedData.address,
        taxId: validatedData.taxId,
        logo: validatedData.logo,
        taxRate: validatedData.taxRate,
        currency: validatedData.currency,
        timezone: validatedData.timezone,
        updatedAt: new Date()
      },
      select: {
        id: true,
        name: true,
        slug: true,
        businessType: true,
        phone: true,
        email: true,
        address: true,
        taxId: true,
        logo: true,
        taxRate: true,
        currency: true,
        timezone: true,
        plan: true,
        status: true,
        updatedAt: true
      }
    })

    // Log de auditoría
    try {
      await prisma.auditLog.create({
        data: {
          action: 'UPDATE_COMPANY',
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

    console.log('✅ Configuración de compañía actualizada exitosamente')

    // Formatear respuesta
    const response = {
      id: updatedCompany.id,
      name: updatedCompany.name,
      businessName: updatedCompany.name,
      slug: updatedCompany.slug,
      businessType: updatedCompany.businessType,
      taxId: updatedCompany.taxId || '',
      email: updatedCompany.email || '',
      phone: updatedCompany.phone || '',
      address: updatedCompany.address || '',
      currency: updatedCompany.currency,
      timezone: updatedCompany.timezone,
      taxPercentage: updatedCompany.taxRate.toNumber(),
      taxRate: updatedCompany.taxRate.toNumber(),
      logo: updatedCompany.logo || '',
      plan: updatedCompany.plan,
      status: updatedCompany.status,
      updatedAt: updatedCompany.updatedAt.toISOString()
    }

    return NextResponse.json(response)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      )
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    console.error('❌ Error actualizando configuración de compañía:', errorMessage)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
