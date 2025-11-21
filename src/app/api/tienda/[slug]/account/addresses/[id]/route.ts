// src/app/api/tienda/[slug]/account/addresses/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateStoreCustomerToken } from '@/lib/store-auth'

/**
 * PUT /api/tienda/[slug]/account/addresses/[id]
 * Actualizar una dirección
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await params
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

    // Verificar que la dirección existe y pertenece al cliente
    const existingAddress = await prisma.storeCustomerAddress.findFirst({
      where: {
        id,
        storeCustomerId: auth.customer.id
      }
    })

    if (!existingAddress) {
      return NextResponse.json(
        { error: 'Dirección no encontrada' },
        { status: 404 }
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

    // Si se marca como default, quitar el default de las demás
    if (isDefault && !existingAddress.isDefault) {
      await prisma.storeCustomerAddress.updateMany({
        where: { 
          storeCustomerId: auth.customer.id,
          id: { not: id }
        },
        data: { isDefault: false }
      })
    }

    // Actualizar dirección
    const address = await prisma.storeCustomerAddress.update({
      where: { id },
      data: {
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
        isDefault: isDefault ?? existingAddress.isDefault
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Dirección actualizada',
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
    console.error('Error actualizando dirección:', error)
    return NextResponse.json(
      { error: 'Error al actualizar dirección' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/tienda/[slug]/account/addresses/[id]
 * Eliminar una dirección
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await params

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

    // Verificar que la dirección existe y pertenece al cliente
    const existingAddress = await prisma.storeCustomerAddress.findFirst({
      where: {
        id,
        storeCustomerId: auth.customer.id
      }
    })

    if (!existingAddress) {
      return NextResponse.json(
        { error: 'Dirección no encontrada' },
        { status: 404 }
      )
    }

    // Eliminar dirección
    await prisma.storeCustomerAddress.delete({
      where: { id }
    })

    // Si era la dirección por defecto, asignar otra como default
    if (existingAddress.isDefault) {
      const anotherAddress = await prisma.storeCustomerAddress.findFirst({
        where: { storeCustomerId: auth.customer.id },
        orderBy: { createdAt: 'desc' }
      })

      if (anotherAddress) {
        await prisma.storeCustomerAddress.update({
          where: { id: anotherAddress.id },
          data: { isDefault: true }
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Dirección eliminada'
    })

  } catch (error) {
    console.error('Error eliminando dirección:', error)
    return NextResponse.json(
      { error: 'Error al eliminar dirección' },
      { status: 500 }
    )
  }
}
