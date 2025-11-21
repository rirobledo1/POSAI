import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateCategorySchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
  description: z.string().optional(),
  parentId: z.string().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().optional()
})

// Función para recalcular paths de subcategorías
async function updateChildrenPaths(categoryId: string, newPath: string) {
  const children = await prisma.productCategory.findMany({
    where: { parentId: categoryId },
    select: { id: true }
  })

  for (const child of children) {
    const childPath = `${newPath}/${categoryId}`
    await prisma.productCategory.update({
      where: { id: child.id },
      data: { path: childPath }
    })
    
    // Recursivamente actualizar subcategorías
    await updateChildrenPaths(child.id, childPath)
  }
}

// GET - Obtener categoría por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const category = await prisma.productCategory.findUnique({
      where: { id: params.id },
      include: {
        parent: {
          select: { id: true, name: true }
        },
        children: {
          select: { id: true, name: true, isActive: true },
          orderBy: { sortOrder: 'asc' }
        },
        products: {
          select: { id: true, name: true, active: true },
          where: { active: true }
        },
        _count: {
          select: {
            products: true,
            children: true
          }
        }
      }
    })

    if (!category) {
      return NextResponse.json({ error: 'Categoría no encontrada' }, { status: 404 })
    }

    return NextResponse.json(category)
  } catch (error) {
    console.error('Error fetching category:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar categoría
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !['ADMIN', 'ALMACEN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'No autorizado. Solo administradores y personal de almacén pueden modificar categorías.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = updateCategorySchema.parse(body)

    // Verificar que la categoría existe
    const existingCategory = await prisma.productCategory.findUnique({
      where: { id: params.id }
    })

    if (!existingCategory) {
      return NextResponse.json({ error: 'Categoría no encontrada' }, { status: 404 })
    }

    // Verificar que no se está intentando mover a una subcategoría propia
    if (validatedData.parentId) {
      const parentCategory = await prisma.productCategory.findUnique({
        where: { id: validatedData.parentId },
        select: { path: true, level: true }
      })

      if (parentCategory && parentCategory.path && parentCategory.path.includes(params.id)) {
        return NextResponse.json(
          { error: 'No se puede mover una categoría a una de sus subcategorías' },
          { status: 400 }
        )
      }
    }

    // Si se cambia el nombre, verificar que no esté duplicado
    if (validatedData.name && validatedData.name !== existingCategory.name) {
      const duplicateCategory = await prisma.productCategory.findFirst({
        where: {
          name: validatedData.name,
          parentId: validatedData.parentId ?? existingCategory.parentId,
          id: { not: params.id }
        }
      })

      if (duplicateCategory) {
        return NextResponse.json(
          { error: 'Ya existe una categoría con ese nombre en este nivel' },
          { status: 400 }
        )
      }
    }

    // Calcular nuevo path y nivel si cambia el padre
    let updateData = { ...validatedData }
    
    if (validatedData.parentId !== undefined && validatedData.parentId !== existingCategory.parentId) {
      const newPath = validatedData.parentId 
        ? await calculatePath(validatedData.parentId)
        : ''
      const newLevel = validatedData.parentId 
        ? await calculateLevel(validatedData.parentId)
        : 0

      updateData = {
        ...updateData,
        path: newPath,
        level: newLevel
      }
    }

    const updatedCategory = await prisma.productCategory.update({
      where: { id: params.id },
      data: updateData,
      include: {
        parent: {
          select: { id: true, name: true }
        },
        children: {
          select: { id: true, name: true, isActive: true }
        },
        _count: {
          select: {
            products: true,
            children: true
          }
        }
      }
    })

    // Si cambió el path, actualizar subcategorías
    if (updateData.path !== undefined) {
      await updateChildrenPaths(params.id, updateData.path)
    }

    // Log de auditoría
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE_CATEGORY',
        entityType: 'PRODUCT_CATEGORY',
        entityId: params.id,
        userId: session.user.id,
        details: {
          oldData: {
            name: existingCategory.name,
            description: existingCategory.description,
            parentId: existingCategory.parentId,
            isActive: existingCategory.isActive
          },
          newData: {
            name: updatedCategory.name,
            description: updatedCategory.description,
            parentId: updatedCategory.parentId,
            isActive: updatedCategory.isActive
          }
        }
      }
    })

    return NextResponse.json(updatedCategory)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error updating category:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar categoría
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado. Solo administradores pueden eliminar categorías.' },
        { status: 401 }
      )
    }

    const category = await prisma.productCategory.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            products: true,
            children: true
          }
        }
      }
    })

    if (!category) {
      return NextResponse.json({ error: 'Categoría no encontrada' }, { status: 404 })
    }

    // Verificar que no tenga productos asociados
    if (category._count.products > 0) {
      return NextResponse.json(
        { error: `No se puede eliminar la categoría porque tiene ${category._count.products} productos asociados` },
        { status: 400 }
      )
    }

    // Verificar que no tenga subcategorías
    if (category._count.children > 0) {
      return NextResponse.json(
        { error: `No se puede eliminar la categoría porque tiene ${category._count.children} subcategorías` },
        { status: 400 }
      )
    }

    // Eliminar la categoría
    await prisma.productCategory.delete({
      where: { id: params.id }
    })

    // Log de auditoría
    await prisma.auditLog.create({
      data: {
        action: 'DELETE_CATEGORY',
        entityType: 'PRODUCT_CATEGORY',
        entityId: params.id,
        userId: session.user.id,
        details: {
          deletedData: {
            name: category.name,
            description: category.description,
            parentId: category.parentId
          }
        }
      }
    })

    return NextResponse.json({ 
      message: 'Categoría eliminada correctamente',
      category: {
        id: category.id,
        name: category.name
      }
    })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// Funciones auxiliares (las mismas que en route.ts)
async function calculatePath(parentId?: string): Promise<string> {
  if (!parentId) return ''
  
  const parent = await prisma.productCategory.findUnique({
    where: { id: parentId },
    select: { path: true, id: true }
  })
  
  if (!parent) return ''
  
  return parent.path ? `${parent.path}/${parent.id}` : parent.id
}

async function calculateLevel(parentId?: string): Promise<number> {
  if (!parentId) return 0
  
  const parent = await prisma.productCategory.findUnique({
    where: { id: parentId },
    select: { level: true }
  })
  
  return parent ? parent.level + 1 : 0
}
