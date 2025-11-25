import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getCompanyIdFromSession } from '@/lib/session-helpers'

// GET - Obtener cliente específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // 🆕 MULTI-TENANT: Obtener companyId
    const companyId = await getCompanyIdFromSession()

    const { id } = await params

    // 🆕 CRITICAL: Verificar ownership
    const customer = await prisma.customer.findFirst({
      where: {
        id,
        companyId  // ← Verificar que pertenece a la compañía
      },
      include: {
        sales: {
          select: {
            id: true,
            total: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 10 // Últimas 10 ventas
        }
      }
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Cliente no encontrado o no pertenece a tu empresa' },
        { status: 404 }
      )
    }

    // Convertir Decimal a number para el frontend
    const customerWithNumbers = {
      ...customer,
      creditLimit: customer.creditLimit.toNumber(),
      currentDebt: customer.currentDebt.toNumber(),
      sales: customer.sales.map(sale => ({
        ...sale,
        total: sale.total.toNumber()
      }))
    }

    return NextResponse.json(customerWithNumbers)
  } catch (error) {
    console.error('Error fetching customer:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar cliente
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // 🆕 MULTI-TENANT: Obtener companyId
    const companyId = await getCompanyIdFromSession()

    const { id } = await params
    const body = await request.json()
    const {
      name,
      email,
      phone,
      address,
      creditLimit,
      currentDebt,
      active
    } = body

    // Validaciones básicas
    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'El nombre es obligatorio' },
        { status: 400 }
      )
    }

    // 🆕 CRITICAL: Verificar que el cliente existe y pertenece a la compañía
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        id,
        companyId  // ← Verificar ownership
      }
    })

    if (!existingCustomer) {
      return NextResponse.json(
        { error: 'Cliente no encontrado o no pertenece a tu empresa' },
        { status: 404 }
      )
    }

    // 🆕 CRITICAL: Verificar email duplicado DENTRO de la compañía
    if (email && email !== existingCustomer.email) {
      const duplicateEmail = await prisma.customer.findFirst({
        where: {
          email,
          companyId,  // ← Solo en la misma compañía
          id: { not: id }
        }
      })
      if (duplicateEmail) {
        return NextResponse.json(
          { error: 'Ya existe un cliente con ese email en tu empresa' },
          { status: 400 }
        )
      }
    }

    // 🆕 CRITICAL: Actualizar solo si pertenece a la compañía
    const updatedCustomer = await prisma.customer.update({
      where: {
        id,
        companyId  // ← Verificar ownership
      },
      data: {
        name: name.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        address: address?.trim() || null,
        creditLimit: creditLimit || 0,
        currentDebt: currentDebt || 0,
        isActive: active !== undefined ? active : true
      }
    })

    // Convertir Decimal a number para el frontend
    const customerWithNumbers = {
      ...updatedCustomer,
      creditLimit: updatedCustomer.creditLimit.toNumber(),
      currentDebt: updatedCustomer.currentDebt.toNumber()
    }

    return NextResponse.json(customerWithNumbers)
  } catch (error) {
    console.error('Error updating customer:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar cliente (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // 🆕 MULTI-TENANT: Obtener companyId
    const companyId = await getCompanyIdFromSession()

    const { id } = await params

    // 🆕 CRITICAL: Verificar que el cliente existe y pertenece a la compañía
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        id,
        companyId  // ← Verificar ownership
      }
    })

    if (!existingCustomer) {
      return NextResponse.json(
        { error: 'Cliente no encontrado o no pertenece a tu empresa' },
        { status: 404 }
      )
    }

    // 🆕 CRITICAL: Verificar ventas solo de la misma compañía
    const salesCount = await prisma.sale.count({
      where: {
        customerId: id,
        companyId  // ← Contar solo ventas de la compañía
      }
    })

    if (salesCount > 0) {
      // Si tiene ventas, hacer soft delete
      const updatedCustomer = await prisma.customer.update({
        where: {
          id,
          companyId  // ← Verificar ownership
        },
        data: { isActive: false }
      })

      const customerWithNumbers = {
        ...updatedCustomer,
        creditLimit: updatedCustomer.creditLimit.toNumber(),
        currentDebt: updatedCustomer.currentDebt.toNumber()
      }

      return NextResponse.json({
        message: 'Cliente desactivado exitosamente (tiene ventas asociadas)',
        customer: customerWithNumbers
      })
    } else {
      // Si no tiene ventas, eliminar físicamente
      await prisma.customer.delete({
        where: {
          id,
          companyId  // ← Verificar ownership
        }
      })
      return NextResponse.json({
        message: 'Cliente eliminado exitosamente'
      })
    }
  } catch (error) {
    console.error('Error deleting customer:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
