// src/app/api/quotations/test/route.ts
// ⚠️ RUTA TEMPORAL SOLO PARA PRUEBAS - ELIMINAR EN PRODUCCIÓN

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    console.log('🧪 TEST: Creando cotización sin autenticación')
    
    const data = await req.json()

    // Validaciones básicas
    if (!data.customerId || !data.companyId) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos (customerId, companyId)' },
        { status: 400 }
      )
    }

    if (!data.items || data.items.length === 0) {
      return NextResponse.json(
        { error: 'La cotización debe tener al menos un producto' },
        { status: 400 }
      )
    }

    // Obtener el primer usuario activo de la empresa para asignarlo
    const user = await prisma.user.findFirst({
      where: {
        companyId: data.companyId,
        active: true,
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'No se encontró un usuario activo en la empresa' },
        { status: 400 }
      )
    }

    // Obtener información de los productos
    const productIds = data.items.map((item: any) => item.productId)
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds }
      },
      select: {
        id: true,
        name: true,
        description: true,
      }
    })

    const productMap = new Map(products.map(p => [p.id, p]))

    // Generar número de cotización
    const lastQuotation = await prisma.quotation.findFirst({
      where: { companyId: data.companyId },
      orderBy: { createdAt: 'desc' },
    })
    
    const quotationNumber = generateQuotationNumber(lastQuotation?.quotationNumber)

    // Calcular totales
    let subtotal = 0
    const itemsWithCalculations = data.items.map((item: any, index: number) => {
      const product = productMap.get(item.productId)
      const itemSubtotal = item.quantity * item.price
      const itemDiscount = item.discount || 0
      const itemTotal = itemSubtotal - itemDiscount
      
      subtotal += itemSubtotal

      return {
        productId: item.productId,
        productName: product?.name || 'Producto desconocido',
        description: item.description || product?.description || '',
        quantity: item.quantity,
        unitPrice: item.price,
        discount: itemDiscount,
        subtotal: itemTotal,
        sortOrder: index,
      }
    })
    
    const discountAmount = data.discountPercent 
      ? subtotal * (data.discountPercent / 100) 
      : (data.discount || 0)
    
    const taxableAmount = subtotal - discountAmount
    const tax = taxableAmount * 0.16
    const total = taxableAmount + tax

    // Calcular fecha de validez
    const validDays = data.validDays || 15
    const validUntil = new Date()
    validUntil.setDate(validUntil.getDate() + validDays)

    console.log('📝 Creando cotización TEST:', {
      quotationNumber,
      userId: user.id,
      itemsCount: itemsWithCalculations.length,
      total,
    })

    // Crear cotización
    const quotation = await prisma.quotation.create({
      data: {
        quotationNumber,
        customerId: data.customerId,
        companyId: data.companyId,
        branchId: data.branchId || null,
        userId: user.id,
        subtotal,
        discount: discountAmount,
        discountPercent: data.discountPercent || 0,
        tax,
        total,
        validUntil,
        status: 'DRAFT',
        notes: data.notes || null,
        termsConditions: data.termsConditions || getDefaultTermsConditions(),
        items: {
          create: itemsWithCalculations
        }
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        items: {
          include: {
            product: true,
          },
          orderBy: {
            sortOrder: 'asc',
          },
        },
      },
    })

    console.log('✅ Cotización TEST creada:', quotationNumber)

    return NextResponse.json({
      success: true,
      quotation,
      message: `Cotización ${quotationNumber} creada exitosamente (TEST)`,
    }, { status: 201 })

  } catch (error) {
    console.error('❌ Error creando cotización TEST:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

function generateQuotationNumber(lastNumber?: string): string {
  const today = new Date()
  const year = today.getFullYear().toString().slice(-2)
  const month = (today.getMonth() + 1).toString().padStart(2, '0')
  
  if (!lastNumber) {
    return `COT-${year}${month}-0001`
  }
  
  const parts = lastNumber.split('-')
  if (parts.length === 3) {
    const lastNumberPart = parseInt(parts[2])
    const newNumber = (lastNumberPart + 1).toString().padStart(4, '0')
    return `COT-${year}${month}-${newNumber}`
  }
  
  return `COT-${year}${month}-0001`
}

function getDefaultTermsConditions(): string {
  return `TÉRMINOS Y CONDICIONES:

1. Esta cotización es válida por el período indicado.
2. Los precios están sujetos a cambios sin previo aviso.
3. Los precios incluyen IVA.
4. El tiempo de entrega puede variar según disponibilidad.
5. Se requiere el 50% de anticipo para pedidos especiales.

Para aceptar esta cotización, por favor confirme por email o WhatsApp.`
}
