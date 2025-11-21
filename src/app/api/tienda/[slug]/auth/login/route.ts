// src/app/api/tienda/[slug]/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

/**
 * POST /api/tienda/[slug]/auth/login
 * Iniciar sesión como cliente de la tienda
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const body = await req.json()

    const { email, password } = body

    // Validaciones
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      )
    }

    // Buscar la empresa
    const company = await prisma.company.findUnique({
      where: { slug },
      select: { id: true, name: true, onlineStoreEnabled: true }
    })

    if (!company) {
      return NextResponse.json(
        { error: 'Tienda no encontrada' },
        { status: 404 }
      )
    }

    if (!company.onlineStoreEnabled) {
      return NextResponse.json(
        { error: 'Tienda no disponible' },
        { status: 403 }
      )
    }

    // Buscar el cliente
    const customer = await prisma.storeCustomer.findUnique({
      where: {
        email_companyId: {
          email: email.toLowerCase(),
          companyId: company.id
        }
      },
      include: {
        addresses: {
          where: { isDefault: true },
          take: 1
        }
      }
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Email o contraseña incorrectos' },
        { status: 401 }
      )
    }

    // Verificar que tiene contraseña (no es solo invitado)
    if (!customer.password) {
      return NextResponse.json(
        { error: 'Esta cuenta no tiene contraseña. Por favor, regístrate.' },
        { status: 401 }
      )
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, customer.password)

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Email o contraseña incorrectos' },
        { status: 401 }
      )
    }

    // Actualizar último login
    await prisma.storeCustomer.update({
      where: { id: customer.id },
      data: { lastLoginAt: new Date() }
    })

    // Generar token de sesión
    const sessionToken = Buffer.from(
      JSON.stringify({
        customerId: customer.id,
        email: customer.email,
        companyId: company.id,
        exp: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 días
      })
    ).toString('base64')

    // Preparar dirección por defecto si existe
    const defaultAddress = customer.addresses[0] || null

    return NextResponse.json({
      success: true,
      message: 'Sesión iniciada',
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        phone: customer.phone,
        defaultAddress: defaultAddress ? {
          id: defaultAddress.id,
          label: defaultAddress.label,
          name: defaultAddress.name,
          phone: defaultAddress.phone,
          street: defaultAddress.street,
          colony: defaultAddress.colony,
          city: defaultAddress.city,
          state: defaultAddress.state,
          postalCode: defaultAddress.postalCode
        } : null
      },
      token: sessionToken
    })

  } catch (error) {
    console.error('Error en login:', error)
    return NextResponse.json(
      { error: 'Error al iniciar sesión' },
      { status: 500 }
    )
  }
}
