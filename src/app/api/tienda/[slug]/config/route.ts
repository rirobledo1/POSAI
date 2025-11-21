// src/app/api/tienda/[slug]/config/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/tienda/[slug]/config
 * Obtiene la configuración pública de la tienda online de una empresa
 * No requiere autenticación - endpoint público
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    // Buscar empresa por slug
    const company = await prisma.company.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        businessType: true,
        phone: true,
        email: true,
        address: true,
        logo: true,
        currency: true,
        taxRate: true,
        
        // Configuración de tienda online
        onlineStoreEnabled: true,
        onlineStoreUrl: true,
        allowOnlineQuotes: true,
        allowOnlineSales: true,
        onlinePaymentEnabled: true,
        paymentMode: true,
        
        // Solo la publishable key (pública)
        stripePublishableKey: true,
        
        status: true
      }
    })

    if (!company) {
      return NextResponse.json(
        { error: 'Tienda no encontrada' },
        { status: 404 }
      )
    }

    // Verificar que la tienda esté activa
    if (company.status !== 'ACTIVE' && company.status !== 'TRIAL') {
      return NextResponse.json(
        { error: 'Esta tienda no está disponible actualmente' },
        { status: 403 }
      )
    }

    // Verificar que la tienda online esté habilitada
    if (!company.onlineStoreEnabled) {
      return NextResponse.json(
        { 
          error: 'La tienda online no está habilitada',
          message: 'Esta empresa no tiene habilitada su tienda en línea'
        },
        { status: 403 }
      )
    }

    // Determinar qué funcionalidades están disponibles
    const features = {
      canQuote: company.allowOnlineQuotes,
      canBuy: company.allowOnlineSales,
      hasPayment: company.onlinePaymentEnabled && company.allowOnlineSales,
      paymentMode: company.paymentMode || 'mock'
    }

    return NextResponse.json({
      company: {
        id: company.id,
        name: company.name,
        slug: company.slug,
        businessType: company.businessType,
        phone: company.phone,
        email: company.email,
        address: company.address,
        logo: company.logo,
        currency: company.currency,
        taxRate: Number(company.taxRate)
      },
      store: {
        enabled: company.onlineStoreEnabled,
        url: company.onlineStoreUrl || `/tienda/${company.slug}`,
        features
      },
      payment: company.onlinePaymentEnabled && company.allowOnlineSales ? {
        enabled: true,
        mode: company.paymentMode,
        publishableKey: company.stripePublishableKey
      } : {
        enabled: false
      }
    })

  } catch (error) {
    console.error('Error fetching store config:', error)
    return NextResponse.json(
      { error: 'Error al cargar la configuración de la tienda' },
      { status: 500 }
    )
  }
}
