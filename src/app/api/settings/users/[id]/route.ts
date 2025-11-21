import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const updateUserSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
  email: z.string().email('Email inválido').optional(),
  phone: z.string().optional(),
  role: z.enum(['ADMIN', 'VENDEDOR', 'ALMACEN', 'SOLO_LECTURA']).optional(),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').optional(),
  isActive: z.boolean().optional()
})

// GET - Obtener usuario por ID (verificando compañía)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { companyId, role, id: currentUserId } = session.user

    // Los usuarios solo pueden ver su propio perfil o los admins pueden ver cualquiera
    if (role !== 'ADMIN' && currentUserId !== params.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }

    // Buscar usuario verificando que pertenece a la misma compañía
    const user = await prisma.user.findFirst({
      where: {
        id: params.id,
        companyId // 🔥 VERIFICAR OWNERSHIP
      },
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
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado o no pertenece a tu compañía' },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar usuario (verificando compañía)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { companyId, role, id: currentUserId } = session.user

    // Solo admins pueden editar otros usuarios, o el usuario puede editar su propio perfil
    const canEdit = role === 'ADMIN' || currentUserId === params.id
    
    if (!canEdit) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = updateUserSchema.parse(body)

    // Verificar que el usuario existe Y pertenece a la misma compañía
    const existingUser = await prisma.user.findFirst({
      where: {
        id: params.id,
        companyId // 🔥 VERIFICAR OWNERSHIP
      }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Usuario no encontrado o no pertenece a tu compañía' },
        { status: 404 }
      )
    }

    // Si se está cambiando el email, verificar que no esté en uso GLOBALMENTE
    if (validatedData.email && validatedData.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: validatedData.email }
      })

      if (emailExists) {
        return NextResponse.json(
          { error: 'El email ya está registrado' },
          { status: 400 }
        )
      }
    }

    // Si se está cambiando el teléfono, verificar que no esté en uso en esta compañía
    if (validatedData.phone && validatedData.phone !== existingUser.phone) {
      const phoneExists = await prisma.user.findFirst({
        where: {
          phone: validatedData.phone,
          companyId, // 🔥 Verificar solo en esta compañía
          id: { not: params.id } // Excluir el usuario actual
        }
      })

      if (phoneExists) {
        return NextResponse.json(
          { error: 'El teléfono ya está registrado en tu compañía' },
          { status: 400 }
        )
      }
    }

    // Solo admins pueden cambiar roles
    if (validatedData.role && role !== 'ADMIN') {
      delete validatedData.role
    }

    // Preparar datos para actualizar
    const updateData: any = { ...validatedData }
    
    if (validatedData.password) {
      updateData.password = await bcrypt.hash(validatedData.password, 12)
    }

    // Actualizar usuario (Prisma verificará automáticamente el ID)
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
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
    })

    // Log de auditoría
    try {
      await prisma.auditLog.create({
        data: {
          action: 'UPDATE_USER',
          entityType: 'USER',
          entityId: params.id,
          userId: session.user.id!,
          details: {
            companyId,
            oldData: {
              name: existingUser.name,
              email: existingUser.email,
              phone: existingUser.phone,
              role: existingUser.role,
              isActive: existingUser.isActive
            },
            newData: {
              name: updatedUser.name,
              email: updatedUser.email,
              phone: updatedUser.phone,
              role: updatedUser.role,
              isActive: updatedUser.isActive
            }
          }
        }
      })
    } catch (auditError) {
      console.error('Error creating audit log:', auditError)
    }

    return NextResponse.json(updatedUser)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar/Desactivar usuario (verificando compañía)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { companyId, role, id: currentUserId } = session.user

    // Solo ADMIN puede eliminar usuarios
    if (role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado. Solo administradores pueden eliminar usuarios.' },
        { status: 403 }
      )
    }

    // No permitir que un admin se elimine a sí mismo
    if (currentUserId === params.id) {
      return NextResponse.json(
        { error: 'No puedes eliminar tu propia cuenta' },
        { status: 400 }
      )
    }

    // Verificar que el usuario existe Y pertenece a la misma compañía
    const user = await prisma.user.findFirst({
      where: {
        id: params.id,
        companyId // 🔥 VERIFICAR OWNERSHIP
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado o no pertenece a tu compañía' },
        { status: 404 }
      )
    }

    // En lugar de eliminar, desactivar el usuario para mantener integridad referencial
    const deactivatedUser = await prisma.user.update({
      where: { id: params.id },
      data: { 
        isActive: false,
        updatedAt: new Date()
      },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true
      }
    })

    // Log de auditoría
    try {
      await prisma.auditLog.create({
        data: {
          action: 'DEACTIVATE_USER',
          entityType: 'USER',
          entityId: params.id,
          userId: session.user.id!,
          details: {
            companyId,
            deactivatedUser: {
              name: user.name,
              email: user.email
            }
          }
        }
      })
    } catch (auditError) {
      console.error('Error creating audit log:', auditError)
    }

    return NextResponse.json({ 
      message: 'Usuario desactivado correctamente',
      user: deactivatedUser 
    })
  } catch (error) {
    console.error('Error deactivating user:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
