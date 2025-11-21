import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

// Esquema de validación para usuarios
const userSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional().refine((val) => {
    if (!val) return true
    return /^\+?[\d\s\-\(\)]{7,15}$/.test(val)
  }, 'Formato de teléfono inválido'),
  role: z.enum(['ADMIN', 'VENDEDOR', 'ALMACEN', 'SOLO_LECTURA']),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').optional(),
  isActive: z.boolean().optional().default(true)
})

// GET - Obtener todos los usuarios de la compañía
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { companyId, role } = session.user

    // Solo ADMIN puede ver la lista de usuarios
    if (role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado. Solo administradores pueden ver usuarios.' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const roleFilter = searchParams.get('role') || ''
    const isActive = searchParams.get('isActive')

    const skip = (page - 1) * limit

    // Construir filtros - SIEMPRE con companyId
    const where: any = {
      companyId // 🔥 FILTRO CRÍTICO
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    if (roleFilter) {
      where.role = roleFilter
    }
    
    if (isActive !== null && isActive !== '') {
      where.isActive = isActive === 'true'
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      prisma.user.count({ where })
    ])

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST - Crear nuevo usuario en la compañía
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { companyId, role } = session.user

    // Solo ADMIN puede crear usuarios
    if (role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado. Solo administradores pueden crear usuarios.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = userSchema.parse(body)

    // Verificar si el email ya existe GLOBALMENTE (no solo en esta compañía)
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'El email ya está registrado' },
        { status: 400 }
      )
    }

    // Verificar si el teléfono ya existe en esta compañía (si se proporciona)
    if (validatedData.phone) {
      const existingPhone = await prisma.user.findFirst({
        where: {
          phone: validatedData.phone,
          companyId // 🔥 Verificar solo en esta compañía
        }
      })

      if (existingPhone) {
        return NextResponse.json(
          { error: 'El teléfono ya está registrado en tu compañía' },
          { status: 400 }
        )
      }
    }

    // Hash de la contraseña
    const hashedPassword = validatedData.password 
      ? await bcrypt.hash(validatedData.password, 12)
      : await bcrypt.hash('123456', 12) // Contraseña por defecto si no se proporciona

    // Crear usuario asociado a la compañía
    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        phone: validatedData.phone,
        password: hashedPassword,
        role: validatedData.role,
        isActive: validatedData.isActive,
        companyId // 🔥 ASOCIAR A COMPAÑÍA
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    })

    // Log de auditoría
    try {
      await prisma.auditLog.create({
        data: {
          action: 'CREATE_USER',
          entityType: 'USER',
          entityId: user.id,
          userId: session.user.id!,
          details: {
            companyId,
            newData: {
              name: user.name,
              email: user.email,
              role: user.role
            }
          }
        }
      })
    } catch (auditError) {
      console.error('Error creating audit log:', auditError)
    }

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
