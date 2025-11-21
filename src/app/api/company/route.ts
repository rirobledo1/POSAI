import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getCompanyIdFromSession } from '@/lib/session-helpers'

// GET - Obtener configuración de empresa
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // 🆕 MULTI-TENANT: Obtener companyId desde la sesión
    const companyId = session.user.companyId

    if (!companyId) {
      return NextResponse.json(
        { error: 'Usuario sin compañía asignada' },
        { status: 400 }
      )
    }

    // 🆕 CRITICAL: Buscar LA compañía del usuario autenticado
    const company = await prisma.company.findUnique({
      where: { id: companyId }
    })

    if (!company) {
      return NextResponse.json(
        { error: 'Configuración de empresa no encontrada' },
        { status: 404 }
      )
    }

    console.log(`✅ Company data fetched: ${company.name}`)

    return NextResponse.json(company)

  } catch (error: any) {
    console.error('Error fetching company:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar configuración de empresa
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Solo ADMIN puede modificar configuración de empresa
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Solo los administradores pueden modificar la configuración de empresa' },
        { status: 403 }
      )
    }

    // 🆕 MULTI-TENANT: Obtener companyId
    const companyId = await getCompanyIdFromSession()

    const body = await request.json()

    // Validar datos requeridos
    if (!body.name || !body.businessType) {
      return NextResponse.json(
        { error: 'Nombre y tipo de negocio son requeridos' },
        { status: 400 }
      )
    }

    // 🆕 CRITICAL: Actualizar SOLO la compañía del usuario
    const company = await prisma.company.update({
      where: { id: companyId },
      data: {
        name: body.name.trim(),
        businessType: body.businessType,
        phone: body.phone?.trim() || null,
        email: body.email?.trim() || null,
        address: body.address?.trim() || null,
        taxId: body.taxId?.trim() || null,
        taxRate: parseFloat(body.taxRate) || 16.00,
        currency: body.currency || 'MXN',
        updatedAt: new Date()
      }
    })

    console.log(`✅ Company updated: ${company.name}`)

    return NextResponse.json(company)

  } catch (error: any) {
    console.error('Error updating company:', error)
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Compañía no encontrada' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
