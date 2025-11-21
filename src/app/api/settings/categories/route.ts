import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const categorySchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  description: z.string().optional(),
  active: z.boolean().optional().default(true)
})

// GET - Obtener todas las categorías de la compañía
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { companyId } = session.user

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const includeInactive = searchParams.get('includeInactive') === 'true'

    // Construir filtros - SIEMPRE con companyId
    const where: any = {
      companyId // 🔥 FILTRO CRÍTICO
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    if (!includeInactive) {
      where.active = true
    }

    const categories = await prisma.categories.findMany({
      where,
      include: {
        _count: {
          select: {
            products: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Calcular estadísticas
    const stats = {
      total: categories.length,
      active: categories.filter(c => c.active).length,
      totalProducts: categories.reduce((sum, c) => sum + c._count.products, 0)
    }

    // Formatear respuesta
    const formattedCategories = categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      description: cat.description,
      active: cat.active,
      productCount: cat._count.products,
      createdAt: cat.created_at.toISOString(),
      updatedAt: cat.updated_at.toISOString()
    }))

    return NextResponse.json({
      categories: formattedCategories,
      stats
    })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST - Crear nueva categoría
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { companyId, role } = session.user

    // Verificar permisos
    if (!['ADMIN', 'ALMACEN'].includes(role || '')) {
      return NextResponse.json(
        { error: 'No autorizado. Solo administradores y personal de almacén pueden crear categorías.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = categorySchema.parse(body)

    // Verificar que el nombre no esté duplicado en esta compañía
    const existingCategory = await prisma.categories.findFirst({
      where: {
        companyId, // 🔥 Buscar solo en esta compañía
        name: validatedData.name
      }
    })

    if (existingCategory) {
      return NextResponse.json(
        { error: 'Ya existe una categoría con ese nombre en tu compañía' },
        { status: 400 }
      )
    }

    // Crear categoría asociada a la compañía
    const category = await prisma.categories.create({
      data: {
        id: `cat_${Date.now()}`,
        name: validatedData.name,
        description: validatedData.description,
        companyId, // 🔥 ASOCIAR A COMPAÑÍA
        active: validatedData.active ?? true,
        created_at: new Date(),
        updated_at: new Date()
      },
      include: {
        _count: {
          select: {
            products: true
          }
        }
      }
    })

    // Log de auditoría
    try {
      await prisma.auditLog.create({
        data: {
          action: 'CREATE_CATEGORY',
          entityType: 'CATEGORY',
          entityId: category.id,
          userId: session.user.id!,
          details: {
            companyId,
            newData: {
              name: category.name,
              description: category.description
            }
          }
        }
      })
    } catch (auditError) {
      console.error('Error creating audit log:', auditError)
      // No fallar la operación por error de auditoría
    }

    return NextResponse.json({
      id: category.id,
      name: category.name,
      description: category.description,
      active: category.active,
      productCount: category._count.products,
      createdAt: category.created_at.toISOString(),
      updatedAt: category.updated_at.toISOString()
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error creating category:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
