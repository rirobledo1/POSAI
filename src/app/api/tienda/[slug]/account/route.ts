// src/app/api/tienda/[slug]/account/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateStoreCustomerToken } from '@/lib/store-auth'

/**
 * GET /api/tienda/[slug]/account
 * Obtener datos del cliente autenticado
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    // Buscar la empresa
    const company = await prisma.company.findUnique({
      where: { slug },
      select: { id: true }
    })

    if (!company) {
      return NextResponse.json(
        { error: 'Tienda no encontrada' },
        { status: 404 }
      )
    }

    // Validar autenticación
    const auth = await validateStoreCustomerToken(req, company.id)

    if (!auth.success || !auth.customer) {
      return NextResponse.json(
        { error: auth.error || 'No autorizado' },
        { status: 401 }
      )
    }

    // Obtener datos completos del cliente
    const customer = await prisma.storeCustomer.findUnique({
      where: { id: auth.customer.id },
      include: {
        addresses: {
          orderBy: [
            { isDefault: 'desc' },
            { createdAt: 'desc' }
          ]
        },
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            orderNumber: true,
            type: true,
            status: true,
            total: true,
            createdAt: true,
            items: true
          }
        }
      }
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        phone: customer.phone,
        createdAt: customer.createdAt
      },
      addresses: customer.addresses.map(addr => ({
        id: addr.id,
        label: addr.label,
        name: addr.name,
        phone: addr.phone,
        street: addr.street,
        colony: addr.colony,
        city: addr.city,
        state: addr.state,
        postalCode: addr.postalCode,
        country: addr.country,
        references: addr.references,
        isDefault: addr.isDefault
      })),
      recentOrders: customer.orders.map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        type: order.type,
        status: order.status,
        total: Number(order.total),
        itemsCount: (order.items as any[]).length,
        createdAt: order.createdAt
      }))
    })

  } catch (error) {
    console.error('Error obteniendo cuenta:', error)
    return NextResponse.json(
      { error: 'Error al obtener datos de la cuenta' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/tienda/[slug]/account
 * Actualizar datos del cliente
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const body = await req.json()

    // Buscar la empresa
    const company = await prisma.company.findUnique({
      where: { slug },
      select: { id: true }
    })

    if (!company) {
      return NextResponse.json(
        { error: 'Tienda no encontrada' },
        { status: 404 }
      )
    }

    // Validar autenticación
    const auth = await validateStoreCustomerToken(req, company.id)

    if (!auth.success || !auth.customer) {
      return NextResponse.json(
        { error: auth.error || 'No autorizado' },
        { status: 401 }
      )
    }

    const { name, phone } = body

    // Validar datos
    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { error: 'El nombre debe tener al menos 2 caracteres' },
        { status: 400 }
      )
    }

    // Actualizar cliente
    const updatedCustomer = await prisma.storeCustomer.update({
      where: { id: auth.customer.id },
      data: {
        name: name.trim(),
        phone: phone?.trim() || null
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Datos actualizados',
      customer: {
        id: updatedCustomer.id,
        email: updatedCustomer.email,
        name: updatedCustomer.name,
        phone: updatedCustomer.phone
      }
    })

  } catch (error) {
    console.error('Error actualizando cuenta:', error)
    return NextResponse.json(
      { error: 'Error al actualizar datos' },
      { status: 500 }
    )
  }
}
