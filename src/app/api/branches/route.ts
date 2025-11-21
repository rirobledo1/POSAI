import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const branchSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  code: z.string().min(2, 'El código debe tener al menos 2 caracteres').max(20),
  phone: z.string().optional(),
  email: z.string().email('Email inválido').optional(),
  address: z.string().min(5, 'La dirección debe tener al menos 5 caracteres'),
  city: z.string().min(2, 'La ciudad es requerida'),
  state: z.string().min(2, 'El estado es requerido'),
  country: z.string().default('México'),
  postalCode: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  timezone: z.string().default('America/Mexico_City'),
  settings: z.any().optional()
})

// GET /api/branches - Listar sucursales de la compañía
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { companyId } = session.user
    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'

    // Construir filtros
    const where: any = {
      companyId // 🔥 FILTRO CRÍTICO
    }

    if (!includeInactive) {
      where.isActive = true
    }

    const branches = await prisma.branch.findMany({
      where,
      include: {
        _count: {
          select: {
            users: true,
            sales: true,
            branchProducts: true
          }
        }
      },
      orderBy: [
        { isMain: 'desc' }, // Principal primero
        { name: 'asc' }
      ]
    })

    // Obtener límites desde subscriptions (prioridad) o company (fallback)
    let subscription = null
    let maxBranches = 1
    let planType = 'FREE'
    let currentBranches = 0

    try {
      // Intentar leer de subscriptions
      subscription = await prisma.subscription.findUnique({
        where: { companyId }
      })
    } catch (subscriptionError) {
      console.log('⚠️ No se pudo leer subscriptions, usando fallback:', subscriptionError)
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        maxBranches: true,
        plan: true,
        _count: { select: { branches: true } }
      }
    })

    // Usar límites de subscription si existe, sino usar company
    maxBranches = subscription?.maxBranches ?? company?.maxBranches ?? 1
    planType = subscription?.planType ?? company?.plan ?? 'FREE'
    currentBranches = company?._count.branches || 0

    console.log('📊 Límites calculados:', {
      subscriptionExists: !!subscription,
      subscriptionMaxBranches: subscription?.maxBranches,
      companyMaxBranches: company?.maxBranches,
      finalMaxBranches: maxBranches,
      finalPlan: planType,
      currentBranches
    })

    return NextResponse.json({
      branches: branches.map(b => ({
        id: b.id,
        name: b.name,
        code: b.code,
        phone: b.phone,
        email: b.email,
        address: b.address,
        city: b.city,
        state: b.state,
        country: b.country,
        postalCode: b.postalCode,
        latitude: b.latitude,
        longitude: b.longitude,
        isActive: b.isActive,
        isMain: b.isMain,
        timezone: b.timezone,
        settings: b.settings,
        createdAt: b.createdAt.toISOString(),
        updatedAt: b.updatedAt.toISOString(),
        stats: {
          users: b._count.users,
          sales: b._count.sales,
          products: b._count.branchProducts
        }
      })),
      limits: {
        current: currentBranches,
        max: maxBranches,
        canAddMore: currentBranches < maxBranches,
        plan: planType
      }
    })

  } catch (error) {
    console.error('❌ Error fetching branches:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor', details: String(error) },
      { status: 500 }
    )
  }
}

// POST /api/branches - Crear nueva sucursal
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { companyId, role } = session.user

    // Solo ADMIN puede crear sucursales
    if (role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado. Solo administradores pueden crear sucursales.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = branchSchema.parse(body)

    // 1. Verificar límite del plan desde subscriptions
    let subscription = null
    try {
      subscription = await prisma.subscription.findUnique({
        where: { companyId }
      })
    } catch (subscriptionError) {
      console.log('⚠️ No se pudo leer subscriptions en POST:', subscriptionError)
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        _count: { select: { branches: true } }
      }
    })

    if (!company) {
      return NextResponse.json(
        { error: 'Compañía no encontrada' },
        { status: 404 }
      )
    }

    // Usar límites de subscription si existe, sino usar company
    const maxBranches = subscription?.maxBranches ?? company.maxBranches
    const planType = subscription?.planType ?? company.plan

    if (company._count.branches >= maxBranches) {
      return NextResponse.json(
        { 
          error: 'Límite de sucursales alcanzado',
          details: {
            current: company._count.branches,
            max: maxBranches,
            plan: planType,
            message: `Tu plan ${planType} permite hasta ${maxBranches} sucursal(es). Actualiza tu plan para agregar más.`
          }
        },
        { status: 403 }
      )
    }

    // 2. Verificar que el código sea único en esta compañía
    const existingBranch = await prisma.branch.findFirst({
      where: {
        companyId,
        code: validatedData.code
      }
    })

    if (existingBranch) {
      return NextResponse.json(
        { error: 'Ya existe una sucursal con ese código en tu compañía' },
        { status: 400 }
      )
    }

    // 3. Crear sucursal
    const branch = await prisma.branch.create({
      data: {
        name: validatedData.name,
        code: validatedData.code,
        phone: validatedData.phone,
        email: validatedData.email,
        address: validatedData.address,
        city: validatedData.city,
        state: validatedData.state,
        country: validatedData.country,
        postalCode: validatedData.postalCode,
        latitude: validatedData.latitude,
        longitude: validatedData.longitude,
        timezone: validatedData.timezone,
        settings: validatedData.settings,
        isActive: true,
        isMain: false, // Las nuevas nunca son principales
        companyId
      },
      include: {
        _count: {
          select: {
            users: true,
            sales: true,
            branchProducts: true
          }
        }
      }
    })

    // 4. Copiar productos de sucursal principal con stock 0 (opcional)
    const mainBranch = await prisma.branch.findFirst({
      where: {
        companyId,
        isMain: true
      },
      include: {
        branchProducts: {
          include: {
            product: true
          }
        }
      }
    })

    if (mainBranch && mainBranch.branchProducts.length > 0) {
      // Crear productos en la nueva sucursal con stock 0
      await prisma.branchProduct.createMany({
        data: mainBranch.branchProducts.map(bp => ({
          branchId: branch.id,
          productId: bp.productId,
          stock: 0, // Iniciar en 0
          minStock: bp.minStock,
          maxStock: bp.maxStock,
          isActive: bp.isActive
        })),
        skipDuplicates: true
      })
    }

    // 5. Log de auditoría
    try {
      await prisma.auditLog.create({
        data: {
          action: 'CREATE_BRANCH',
          entityType: 'BRANCH',
          entityId: branch.id,
          userId: session.user.id!,
          details: {
            companyId,
            branchData: {
              name: branch.name,
              code: branch.code,
              city: branch.city
            }
          }
        }
      })
    } catch (auditError) {
      console.error('Error creating audit log:', auditError)
    }

    return NextResponse.json({
      id: branch.id,
      name: branch.name,
      code: branch.code,
      phone: branch.phone,
      email: branch.email,
      address: branch.address,
      city: branch.city,
      state: branch.state,
      country: branch.country,
      postalCode: branch.postalCode,
      latitude: branch.latitude,
      longitude: branch.longitude,
      isActive: branch.isActive,
      isMain: branch.isMain,
      timezone: branch.timezone,
      createdAt: branch.createdAt.toISOString(),
      stats: {
        users: branch._count.users,
        sales: branch._count.sales,
        products: branch._count.branchProducts
      }
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error creating branch:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
