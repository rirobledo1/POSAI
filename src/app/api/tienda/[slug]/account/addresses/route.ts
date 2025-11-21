// src/app/api/tienda/[slug]/account/addresses/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateStoreCustomerToken } from '@/lib/store-auth'

/**
 * GET /api/tienda/[slug]/account/addresses
 * Listar direcciones del cliente
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

    // Obtener direcciones
    const addresses = await prisma.storeCustomerAddress.findMany({
      where: { storeCustomerId: auth.customer.id },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json({
      addresses: addresses.map(addr => ({
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
      }))
    })

  } catch (error) {
    console.error('Error obteniendo direcciones:', error)
    return NextResponse.json(
      { error: 'Error al obtener direcciones' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/tienda/[slug]/account/addresses
 * Agregar nueva dirección
 */
export async function POST(
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

    const {
      label,
      name,
      phone,
      street,
      colony,
      city,
      state,
      postalCode,
      country,
      references,
      isDefault
    } = body

    // Validaciones
    if (!name || !phone || !street || !city || !state) {
      return NextResponse.json(
        { error: 'Nombre, teléfono, calle, ciudad y estado son requeridos' },
        { status: 400 }
      )
    }

    // Si es default, quitar el default de las demás
    if (isDefault) {
      await prisma.storeCustomerAddress.updateMany({
        where: { storeCustomerId: auth.customer.id },
        data: { isDefault: false }
      })
    }

    // Verificar si es la primera dirección (hacerla default automáticamente)
    const addressCount = await prisma.storeCustomerAddress.count({
      where: { storeCustomerId: auth.customer.id }
    })

    const shouldBeDefault = isDefault || addressCount === 0

    // Crear dirección
    const address = await prisma.storeCustomerAddress.create({
      data: {
        storeCustomerId: auth.customer.id,
        label: label || null,
        name,
        phone,
        street,
        colony: colony || null,
        city,
        state,
        postalCode: postalCode || null,
        country: country || 'México',
        references: references || null,
        isDefault: shouldBeDefault
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Dirección agregada',
      address: {
        id: address.id,
        label: address.label,
        name: address.name,
        phone: address.phone,
        street: address.street,
        colony: address.colony,
        city: address.city,
        state: address.state,
        postalCode: address.postalCode,
        country: address.country,
        references: address.references,
        isDefault: address.isDefault
      }
    })

  } catch (error) {
    console.error('Error creando dirección:', error)
    return NextResponse.json(
      { error: 'Error al crear dirección' },
      { status: 500 }
    )
  }
}
