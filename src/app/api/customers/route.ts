import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getCompanyIdFromSession } from '@/lib/session-helpers'

// GET - Obtener clientes con paginación y filtros optimizados
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // 🆕 MULTI-TENANT: Obtener companyId
    const companyId = await getCompanyIdFromSession()

    const { searchParams } = new URL(request.url)
    
    // Parámetros de paginación
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit
    
    // Parámetros de filtrado
    const search = searchParams.get('search') || ''
    const activeParam = searchParams.get('active')
    const hasDebt = searchParams.get('hasDebt')
    const sortBy = searchParams.get('sortBy') || 'name'
    const sortOrder = searchParams.get('sortOrder') || 'asc'

    // 🆕 CRITICAL: Construir condiciones WHERE con companyId
    const whereClause: any = {
      companyId  // ← SIEMPRE filtrar por compañía
    }

    // Filtro por búsqueda
    if (search.trim()) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } }
      ]
    }

    // Filtro por estado activo
    if (activeParam !== null && activeParam !== '') {
      whereClause.active = activeParam === 'true'
    }

    // Filtro por deuda
    if (hasDebt !== null && hasDebt !== '') {
      if (hasDebt === 'true') {
        whereClause.currentDebt = { gt: 0 }
      } else {
        whereClause.currentDebt = 0
      }
    }

    // Ejecutar consultas en paralelo para mejor performance
    const [customers, totalCount] = await Promise.all([
      prisma.customer.findMany({
        where: whereClause,
        orderBy: { [sortBy]: sortOrder },
        skip: offset,
        take: limit,
        include: {
          sales: {
            select: {
              total: true,
              createdAt: true
            },
            orderBy: {
              createdAt: 'desc'
            },
            take: 1
          }
        }
      }),
      prisma.customer.count({ where: whereClause })
    ])

    // Calcular información de paginación
    const totalPages = Math.ceil(totalCount / limit)
    const hasNext = page < totalPages
    const hasPrev = page > 1

    // Convertir Decimal a number y agregar estadísticas
    const customersWithStats = customers.map(customer => {
      const lastSale = customer.sales[0]
      return {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        creditLimit: customer.creditLimit.toNumber(),
        currentDebt: customer.currentDebt.toNumber(),
        active: (customer as any).active || customer.isActive,
        createdAt: customer.createdAt.toISOString(),
        updatedAt: customer.updatedAt.toISOString(),
        lastPurchase: lastSale ? lastSale.createdAt.toISOString() : null,
        totalPurchases: lastSale ? lastSale.total.toNumber() : 0
      }
    })

    console.log(`✅ Customers fetched for company ${companyId}: ${customers.length}`)

    return NextResponse.json({
      success: true,
      customers: customersWithStats,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasNext,
        hasPrev
      }
    })
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST - Crear nuevo cliente
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // 🆕 MULTI-TENANT: Obtener companyId
    const companyId = await getCompanyIdFromSession()

    const body = await request.json()
    console.log('📨 POST Request body:', body)
    
    // Mapear isActive a active si existe
    if ('isActive' in body) {
      body.active = body.isActive;
      delete body.isActive;
    }
    
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

    // 🆕 CRITICAL: Verificar email único DENTRO de la compañía
    if (email) {
      const existingCustomer = await prisma.customer.findFirst({
        where: { 
          email,
          companyId  // ← Verificar solo en la misma compañía
        }
      })
      if (existingCustomer) {
        return NextResponse.json(
          { error: 'Ya existe un cliente con ese email en tu empresa' },
          { status: 400 }
        )
      }
    }

    // 🆕 CRITICAL: Crear cliente con companyId
    const newCustomer = await prisma.customer.create({
      data: {
        name: name.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        address: address?.trim() || null,
        creditLimit: creditLimit || 0,
        currentDebt: currentDebt || 0,
        active: active !== undefined ? active : true,
        companyId  // ← CRÍTICO: Asignar compañía
      }
    })

    console.log(`✅ Customer created for company ${companyId}`)

    // Convertir Decimal a number para el frontend
    const customerWithNumbers = {
      ...newCustomer,
      creditLimit: newCustomer.creditLimit.toNumber(),
      currentDebt: newCustomer.currentDebt.toNumber(),
      createdAt: newCustomer.createdAt.toISOString(),
      updatedAt: newCustomer.updatedAt.toISOString()
    }

    return NextResponse.json({
      success: true,
      customer: customerWithNumbers
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating customer:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar cliente
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // 🆕 MULTI-TENANT: Obtener companyId
    const companyId = await getCompanyIdFromSession()

    const body = await request.json()
    console.log('📨 PUT Request body:', body)
    
    // Mapear isActive a active si existe
    if ('isActive' in body) {
      body.active = body.isActive;
      delete body.isActive;
    }
    
    const {
      id,
      name,
      email,
      phone,
      address,
      creditLimit,
      currentDebt,
      active
    } = body

    // Validaciones básicas
    if (!id) {
      return NextResponse.json(
        { error: 'ID del cliente es obligatorio' },
        { status: 400 }
      )
    }

    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'El nombre es obligatorio' },
        { status: 400 }
      )
    }

    // 🆕 CRITICAL: Verificar que el cliente pertenece a la compañía
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

    // 🆕 CRITICAL: Verificar email único DENTRO de la compañía
    if (email && email !== existingCustomer.email) {
      const emailExists = await prisma.customer.findFirst({
        where: { 
          email,
          companyId,  // ← Verificar solo en la misma compañía
          id: { not: id }  // Excluir el cliente actual
        }
      })
      if (emailExists) {
        return NextResponse.json(
          { error: 'Ya existe otro cliente con ese email en tu empresa' },
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
        active: active !== undefined ? active : true
      }
    })

    console.log(`✅ Customer updated for company ${companyId}`)

    // Convertir Decimal a number para el frontend
    const customerWithNumbers = {
      ...updatedCustomer,
      creditLimit: updatedCustomer.creditLimit.toNumber(),
      currentDebt: updatedCustomer.currentDebt.toNumber(),
      createdAt: updatedCustomer.createdAt.toISOString(),
      updatedAt: updatedCustomer.updatedAt.toISOString()
    }

    return NextResponse.json({
      success: true,
      customer: customerWithNumbers
    })
  } catch (error) {
    console.error('Error updating customer:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar cliente
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // 🆕 MULTI-TENANT: Obtener companyId
    const companyId = await getCompanyIdFromSession()

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID del cliente es obligatorio' },
        { status: 400 }
      )
    }

    // 🆕 CRITICAL: Verificar que el cliente pertenece a la compañía
    const existingCustomer = await prisma.customer.findFirst({
      where: { 
        id,
        companyId  // ← Verificar ownership
      },
      include: {
        sales: true
      }
    })

    if (!existingCustomer) {
      return NextResponse.json(
        { error: 'Cliente no encontrado o no pertenece a tu empresa' },
        { status: 404 }
      )
    }

    // Verificar si el cliente tiene ventas asociadas
    if (existingCustomer.sales.length > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar un cliente con ventas asociadas' },
        { status: 400 }
      )
    }

    // 🆕 CRITICAL: Eliminar solo si pertenece a la compañía
    await prisma.customer.delete({
      where: { 
        id,
        companyId  // ← Verificar ownership
      }
    })

    console.log(`✅ Customer deleted for company ${companyId}`)

    return NextResponse.json({
      success: true,
      message: 'Cliente eliminado correctamente'
    })
  } catch (error) {
    console.error('Error deleting customer:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
