import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// Helper para generar slug único
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .replace(/[^a-z0-9]+/g, '-') // Reemplazar espacios y caracteres especiales con guión
    .replace(/^-+|-+$/g, '') // Remover guiones al inicio y final
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      companyName,
      businessType = 'GENERAL',
      userName,
      email,
      phone,
      password,
    } = body

    // Validaciones
    if (!companyName || !userName || !email || !password) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 8 caracteres' },
        { status: 400 }
      )
    }

    // Verificar que el email no exista
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'El email ya está registrado' },
        { status: 400 }
      )
    }

    // Verificar que el teléfono no exista (si se proporcionó)
    if (phone) {
      const existingPhone = await prisma.user.findUnique({
        where: { phone }
      })

      if (existingPhone) {
        return NextResponse.json(
          { error: 'El teléfono ya está registrado' },
          { status: 400 }
        )
      }
    }

    // Generar slug único para la compañía
    let slug = generateSlug(companyName)
    let slugExists = await prisma.company.findUnique({ where: { slug } })
    let counter = 1

    // Si el slug existe, agregar número al final
    while (slugExists) {
      slug = `${generateSlug(companyName)}-${counter}`
      slugExists = await prisma.company.findUnique({ where: { slug } })
      counter++
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10)

    // Transacción: Crear Company + Branch + User en una sola operación
    const result = await prisma.$transaction(async (tx) => {
      // 1. Crear la compañía
      const company = await tx.company.create({
        data: {
          name: companyName,
          slug,
          businessType,
          plan: 'FREE', // Plan gratuito por defecto
          status: 'TRIAL', // Estado de prueba
        }
      })

      // 2. Crear sucursal principal
      const branch = await tx.branch.create({
        data: {
          name: 'Sucursal Principal',
          code: 'SUC-001',
          address: 'Por definir',
          city: 'Por definir',
          state: 'Por definir',
          country: 'México',
          companyId: company.id,
          isMain: true,
          isActive: true,
        }
      })

      // 3. Crear categoría por defecto
      await tx.categories.create({
        data: {
          id: `cat_${company.id}_general`,
          name: 'General',
          description: 'Categoría general para productos',
          companyId: company.id,
          active: true,
          created_at: new Date(),
          updated_at: new Date(),
        }
      })

      // 4. Crear el usuario ADMIN
      const user = await tx.user.create({
        data: {
          name: userName,
          email: email.toLowerCase(),
          phone: phone || null,
          password: hashedPassword,
          role: 'ADMIN', // El primer usuario siempre es ADMIN
          isActive: true,
          companyId: company.id,
          branchId: branch.id, // ✅ Asignar a la sucursal principal
        }
      })

      return { company, branch, user }
    })

    // Retornar respuesta exitosa (sin contraseña)
    return NextResponse.json({
      success: true,
      message: 'Cuenta creada exitosamente',
      data: {
        company: {
          id: result.company.id,
          name: result.company.name,
          slug: result.company.slug,
          plan: result.company.plan,
        },
        branch: {
          id: result.branch.id,
          name: result.branch.name,
          code: result.branch.code,
        },
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          role: result.user.role,
        }
      }
    }, { status: 201 })

  } catch (error: any) {
    console.error('Error en registro:', error)
    
    // Errores de Prisma
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Ya existe una cuenta con estos datos' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error al crear la cuenta. Inténtalo de nuevo.' },
      { status: 500 }
    )
  }
}
