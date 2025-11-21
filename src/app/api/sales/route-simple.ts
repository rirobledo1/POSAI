import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Decimal } from '@prisma/client/runtime/library'

interface SaleItem {
  productId: string
  quantity: number
  unitPrice: number
}

interface SaleData {
  customerId?: string | null
  subtotal: number
  tax: number
  total: number
  paymentMethod: string
  notes?: string
  items: SaleItem[]
}

function generateSaleFolio(): string {
  const timestamp = Date.now().toString().slice(-8)
  return `V-${timestamp}`
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const saleData: SaleData = await request.json()
    console.log('📦 Procesando venta:', saleData)

    // Validación básica
    if (!saleData.items || saleData.items.length === 0) {
      return NextResponse.json(
        { error: 'No hay productos en la venta' },
        { status: 400 }
      )
    }

    // Verificar usuario
    const user = await prisma.user.findUnique({
      where: { id: String(session.user.id) },
      select: { id: true, name: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 400 }
      )
    }

    console.log('✅ Usuario válido:', user.name)

    // Procesar venta en transacción
    const result = await prisma.$transaction(async (tx) => {
      // 1. Crear la venta
      const folio = generateSaleFolio()
      
      const sale = await tx.sale.create({
        data: {
          folio,
          customerId: saleData.customerId || null,
          userId: user.id,
          subtotal: new Decimal(saleData.subtotal),
          tax: new Decimal(saleData.tax),
          total: new Decimal(saleData.total),
          paymentMethod: saleData.paymentMethod,
          notes: saleData.notes || null
        }
      })

      console.log('✅ Venta creada:', sale.id)

      // 2. Crear items y actualizar stock
      const saleItems = []
      for (const item of saleData.items) {
        // Crear item
        const saleItem = await tx.saleItem.create({
          data: {
            saleId: sale.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: new Decimal(item.unitPrice),
            total: new Decimal(item.quantity * item.unitPrice)
          }
        })

        // Actualizar stock
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity
            }
          }
        })

        saleItems.push(saleItem)
        console.log('✅ Item procesado:', item.productId)
      }

      return { sale, saleItems }
    })

    console.log('🎉 Venta procesada exitosamente:', result.sale.folio)

    return NextResponse.json({
      success: true,
      sale: {
        id: result.sale.id,
        folio: result.sale.folio,
        total: result.sale.total
      }
    })

  } catch (error) {
    console.error('❌ Error procesando venta:', error)
    
    return NextResponse.json(
      { 
        error: 'Error procesando venta',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}
