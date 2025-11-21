// src/app/api/tienda/[slug]/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

/**
 * POST /api/tienda/[slug]/auth/register
 * Registrar un nuevo cliente en la tienda
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const body = await req.json()

    const { email, password, name, phone } = body

    // Validaciones
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, contraseña y nombre son requeridos' },
        { status: 400 }
      )
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Formato de email inválido' },
        { status: 400 }
      )
    }

    // Validar contraseña
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
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

    // Verificar si el email ya existe para esta tienda
    const existingCustomer = await prisma.storeCustomer.findUnique({
      where: {
        email_companyId: {
          email: email.toLowerCase(),
          companyId: company.id
        }
      }
    })

    if (existingCustomer) {
      return NextResponse.json(
        { error: 'Ya existe una cuenta con este email' },
        { status: 409 }
      )
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10)

    // Crear el cliente
    const customer = await prisma.storeCustomer.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name,
        phone: phone || null,
        companyId: company.id,
        isVerified: true // Por ahora sin verificación por email
      }
    })

    // Generar token de sesión simple (en producción usar JWT)
    const sessionToken = Buffer.from(
      JSON.stringify({
        customerId: customer.id,
        email: customer.email,
        companyId: company.id,
        exp: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 días
      })
    ).toString('base64')

    return NextResponse.json({
      success: true,
      message: 'Cuenta creada exitosamente',
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        phone: customer.phone
      },
      token: sessionToken
    })

  } catch (error) {
    console.error('Error en registro:', error)
    return NextResponse.json(
      { error: 'Error al crear la cuenta' },
      { status: 500 }
    )
  }
}
