// src/app/api/quotations/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET: Listar cotizaciones
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const companyId = searchParams.get('companyId')
    const branchId = searchParams.get('branchId')
    const status = searchParams.get('status')
    const customerId = searchParams.get('customerId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Construir filtros
    const where: any = {}
    
    if (companyId) where.companyId = companyId
    if (branchId) where.branchId = branchId
    if (status) where.status = status
    if (customerId) where.customerId = customerId

    // Obtener cotizaciones
    const [quotations, total] = await Promise.all([
      prisma.quotation.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            }
          },
          company: {
            select: {
              id: true,
              name: true,
            }
          },
          branch: {
            select: {
              id: true,
              name: true,
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
              product: {
                select: {
                  id: true,
                  name: true,
                  barcode: true,
                }
              }
            },
            orderBy: {
              sortOrder: 'asc'
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.quotation.count({ where })
    ])

    return NextResponse.json({
      quotations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    })

  } catch (error) {
    console.error('Error fetching quotations:', error)
    return NextResponse.json(
      { error: 'Error al obtener cotizaciones' },
      { status: 500 }
    )
  }
}

// POST: Crear nueva cotización
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

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

    // Obtener la tasa de IVA de la empresa
    const company = await prisma.company.findUnique({
      where: { id: data.companyId },
      select: { taxRate: true }
    })

    if (!company) {
      return NextResponse.json(
        { error: 'Empresa no encontrada' },
        { status: 404 }
      )
    }

    const taxRate = Number(company.taxRate) // Ej: 16 o 8
    const taxMultiplier = 1 + (taxRate / 100) // Ej: 1.16 o 1.08

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

    // Crear mapa de productos para acceso rápido
    const productMap = new Map(products.map(p => [p.id, p]))

    // Generar número de cotización
    const lastQuotation = await prisma.quotation.findFirst({
      where: { companyId: data.companyId },
      orderBy: { createdAt: 'desc' },
    })
    
    const quotationNumber = generateQuotationNumber(lastQuotation?.quotationNumber)

    // Calcular totales (Los precios YA incluyen IVA - hay que desglosarlo)
    // En México los precios de venta incluyen IVA según la ley
    let totalItemsWithIVA = 0
    const itemsWithCalculations = data.items.map((item: any, index: number) => {
      const product = productMap.get(item.productId)
      const itemTotalWithIVA = item.quantity * item.price  // Precio con IVA incluido
      const itemDiscount = item.discount || 0
      const itemTotalAfterDiscount = itemTotalWithIVA - itemDiscount
      
      totalItemsWithIVA += itemTotalWithIVA

      return {
        productId: item.productId,
        productName: product?.name || 'Producto desconocido',
        description: item.description || product?.description || '',
        quantity: item.quantity,
        unitPrice: item.price,  // Precio unitario con IVA incluido
        discount: itemDiscount,
        subtotal: itemTotalAfterDiscount,  // Total del item con IVA incluido
        sortOrder: index,
      }
    })
    
    // Aplicar descuento al total
    const discountAmount = data.discountPercent 
      ? totalItemsWithIVA * (data.discountPercent / 100) 
      : (data.discount || 0)
    
    const totalAfterDiscount = totalItemsWithIVA - discountAmount
    
    // Desglosar el IVA que ya está incluido en los precios
    // Fórmula: Subtotal = Total ÷ (1 + taxRate/100)
    // Ejemplo con IVA 16%: $116 ÷ 1.16 = $100
    // Ejemplo con IVA 8%: $108 ÷ 1.08 = $100
    const subtotal = totalAfterDiscount / taxMultiplier  // Subtotal sin IVA
    const tax = totalAfterDiscount - subtotal             // IVA desglosado
    const total = totalAfterDiscount                      // Total con IVA incluido

    // Calcular fecha de validez (15 días por defecto)
    const validDays = data.validDays || 15
    const validUntil = new Date()
    validUntil.setDate(validUntil.getDate() + validDays)

    console.log('📝 Creando cotización:', {
      quotationNumber,
      customerId: data.customerId,
      itemsCount: itemsWithCalculations.length,
      taxRate: `${taxRate}%`,
      totalWithIVA: totalAfterDiscount,
      subtotal,
      discount: discountAmount,
      tax,
      total,
    })

    // Crear cotización con items
    const quotation = await prisma.quotation.create({
      data: {
        quotationNumber,
        customerId: data.customerId,
        companyId: data.companyId,
        branchId: data.branchId || null,
        userId: session.user.id,
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
            rfc: true,
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

    console.log('✅ Cotización creada:', quotationNumber)

    return NextResponse.json({
      success: true,
      quotation,
      message: `Cotización ${quotationNumber} creada exitosamente`,
    }, { status: 201 })

  } catch (error) {
    console.error('❌ Error creando cotización:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// Función para generar número de cotización
function generateQuotationNumber(lastNumber?: string): string {
  const today = new Date()
  const year = today.getFullYear().toString().slice(-2)
  const month = (today.getMonth() + 1).toString().padStart(2, '0')
  
  if (!lastNumber) {
    return `COT-${year}${month}-0001`
  }
  
  // Extraer el número del último folio
  const parts = lastNumber.split('-')
  if (parts.length === 3) {
    const lastNumberPart = parseInt(parts[2])
    const newNumber = (lastNumberPart + 1).toString().padStart(4, '0')
    return `COT-${year}${month}-${newNumber}`
  }
  
  return `COT-${year}${month}-0001`
}

// Términos y condiciones por defecto
function getDefaultTermsConditions(): string {
  return `TÉRMINOS Y CONDICIONES:

1. Esta cotización es válida por el período indicado.
2. Los precios están sujetos a cambios sin previo aviso.
3. Los precios incluyen IVA.
4. El tiempo de entrega puede variar según disponibilidad.
5. Se requiere el 50% de anticipo para pedidos especiales.
6. Las devoluciones se aceptan dentro de los 7 días posteriores a la compra, con el producto en perfecto estado y con el comprobante original.
7. La garantía de los productos está sujeta a los términos del fabricante.

Para aceptar esta cotización, por favor confirme por email o WhatsApp.`
}
