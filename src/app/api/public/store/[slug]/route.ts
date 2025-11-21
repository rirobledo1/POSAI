// src/app/api/public/store/[slug]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/public/store/[slug]
 * Obtener información pública de la tienda
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params

    const company = await prisma.company.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        phone: true,
        email: true,
        address: true,
        taxRate: true,
        onlineStoreEnabled: true,
        allowOnlineQuotes: true,
        allowOnlineSales: true,
        onlinePaymentEnabled: true
      }
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

    return NextResponse.json({
      id: company.id,
      name: company.name,
      slug: company.slug,
      logo: company.logo,
      phone: company.phone,
      email: company.email,
      address: company.address,
      taxRate: Number(company.taxRate),
      allowOnlineQuotes: company.allowOnlineQuotes,
      allowOnlineSales: company.allowOnlineSales,
      onlinePaymentEnabled: company.onlinePaymentEnabled
    })

  } catch (error) {
    console.error('Error fetching store:', error)
    return NextResponse.json(
      { error: 'Error al obtener tienda' },
      { status: 500 }
    )
  }
}
