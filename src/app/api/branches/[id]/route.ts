import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateBranchSchema = z.object({
  name: z.string().min(2).optional(),
  code: z.string().min(2).max(20).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().min(5).optional(),
  city: z.string().min(2).optional(),
  state: z.string().min(2).optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  timezone: z.string().optional(),
  isActive: z.boolean().optional(),
  settings: z.any().optional()
})

// GET /api/branches/[id] - Obtener sucursal específica
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { companyId } = session.user

    // Buscar sucursal verificando ownership
    const branch = await prisma.branch.findFirst({
      where: {
        id: id,
        companyId // 🔥 VERIFICAR OWNERSHIP
      },
      include: {
        _count: {
          select: {
            users: true,
            sales: true,
            branchProducts: true,
            inventoryMovements: true,
            transfersFrom: true,
            transfersTo: true
          }
        }
      }
    })

    if (!branch) {
      return NextResponse.json(
        { error: 'Sucursal no encontrada o no pertenece a tu compañía' },
        { status: 404 }
      )
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
      settings: branch.settings,
      createdAt: branch.createdAt.toISOString(),
      updatedAt: branch.updatedAt.toISOString(),
      stats: {
        users: branch._count.users,
        sales: branch._count.sales,
        products: branch._count.branchProducts,
        inventoryMovements: branch._count.inventoryMovements,
        transfersSent: branch._count.transfersFrom,
        transfersReceived: branch._count.transfersTo
      }
    })

  } catch (error) {
    console.error('Error fetching branch:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PUT /api/branches/[id] - Actualizar sucursal
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { companyId, role } = session.user

    // Solo ADMIN puede actualizar sucursales
    if (role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado. Solo administradores pueden actualizar sucursales.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = updateBranchSchema.parse(body)

    // Verificar que la sucursal existe y pertenece a la compañía
    const existingBranch = await prisma.branch.findFirst({
      where: {
        id: id,
        companyId // 🔥 VERIFICAR OWNERSHIP
      }
    })

    if (!existingBranch) {
      return NextResponse.json(
        { error: 'Sucursal no encontrada o no pertenece a tu compañía' },
        { status: 404 }
      )
    }

    // Si se está cambiando el código, verificar que sea único
    if (validatedData.code && validatedData.code !== existingBranch.code) {
      const codeExists = await prisma.branch.findFirst({
        where: {
          companyId,
          code: validatedData.code,
          id: { not: id }
        }
      })

      if (codeExists) {
        return NextResponse.json(
          { error: 'Ya existe una sucursal con ese código en tu compañía' },
          { status: 400 }
        )
      }
    }

    // Actualizar sucursal
    const updatedBranch = await prisma.branch.update({
      where: { id: id },
      data: {
        ...validatedData,
        updatedAt: new Date()
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

    // Log de auditoría
    try {
      await prisma.auditLog.create({
        data: {
          action: 'UPDATE_BRANCH',
          entityType: 'BRANCH',
          entityId: id,
          userId: session.user.id!,
          details: {
            companyId,
            changes: validatedData,
            oldData: {
              name: existingBranch.name,
              code: existingBranch.code,
              isActive: existingBranch.isActive
            }
          }
        }
      })
    } catch (auditError) {
      console.error('Error creating audit log:', auditError)
    }

    return NextResponse.json({
      id: updatedBranch.id,
      name: updatedBranch.name,
      code: updatedBranch.code,
      phone: updatedBranch.phone,
      email: updatedBranch.email,
      address: updatedBranch.address,
      city: updatedBranch.city,
      state: updatedBranch.state,
      country: updatedBranch.country,
      postalCode: updatedBranch.postalCode,
      latitude: updatedBranch.latitude,
      longitude: updatedBranch.longitude,
      isActive: updatedBranch.isActive,
      isMain: updatedBranch.isMain,
      timezone: updatedBranch.timezone,
      settings: updatedBranch.settings,
      updatedAt: updatedBranch.updatedAt.toISOString(),
      stats: {
        users: updatedBranch._count.users,
        sales: updatedBranch._count.sales,
        products: updatedBranch._count.branchProducts
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error updating branch:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/branches/[id] - Desactivar sucursal
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { companyId, role } = session.user

    // Solo ADMIN puede eliminar sucursales
    if (role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado. Solo administradores pueden eliminar sucursales.' },
        { status: 403 }
      )
    }

    // Verificar que la sucursal existe y pertenece a la compañía
    const branch = await prisma.branch.findFirst({
      where: {
        id: id,
        companyId // 🔥 VERIFICAR OWNERSHIP
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

    if (!branch) {
      return NextResponse.json(
        { error: 'Sucursal no encontrada o no pertenece a tu compañía' },
        { status: 404 }
      )
    }

    // No permitir eliminar la sucursal principal
    if (branch.isMain) {
      return NextResponse.json(
        { error: 'No se puede eliminar la sucursal principal' },
        { status: 400 }
      )
    }

    // Verificar si tiene datos asociados
    if (branch._count.sales > 0) {
      return NextResponse.json(
        {
          error: 'No se puede eliminar una sucursal con ventas registradas',
          details: {
            sales: branch._count.sales,
            message: 'Esta sucursal tiene historial de ventas. Puedes desactivarla en su lugar.'
          }
        },
        { status: 400 }
      )
    }

    // Desactivar en lugar de eliminar (soft delete)
    const deactivatedBranch = await prisma.branch.update({
      where: { id: id },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    })

    // Log de auditoría
    try {
      await prisma.auditLog.create({
        data: {
          action: 'DEACTIVATE_BRANCH',
          entityType: 'BRANCH',
          entityId: id,
          userId: session.user.id!,
          details: {
            companyId,
            branchData: {
              name: branch.name,
              code: branch.code
            }
          }
        }
      })
    } catch (auditError) {
      console.error('Error creating audit log:', auditError)
    }

    return NextResponse.json({
      message: 'Sucursal desactivada correctamente',
      branch: {
        id: deactivatedBranch.id,
        name: deactivatedBranch.name,
        isActive: deactivatedBranch.isActive
      }
    })

  } catch (error) {
    console.error('Error deleting branch:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
