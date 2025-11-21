import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

// POST /api/inventory/movements - Create a stock movement
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { companyId } = session.user

    const body = await request.json()
    const { productId, type, quantity, reason, notes, unitCost } = body

    // Validate required fields
    if (!productId || !type || !quantity || !reason) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    if (!['entrada', 'salida'].includes(type)) {
      return NextResponse.json(
        { error: 'Tipo de movimiento inválido' },
        { status: 400 }
      )
    }

    if (quantity <= 0) {
      return NextResponse.json(
        { error: 'La cantidad debe ser mayor a cero' },
        { status: 400 }
      )
    }

    // Get current product - VERIFY it belongs to this company
    const product = await prisma.product.findFirst({
      where: { 
        id: productId,
        companyId // 🔥 VERIFICAR OWNERSHIP
      },
      select: { 
        id: true, 
        name: true, 
        stock: true,
        price: true,
        cost: true
      }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Producto no encontrado o no pertenece a esta compañía' },
        { status: 404 }
      )
    }

    // Check if there's enough stock for "salida"
    if (type === 'salida' && quantity > (product.stock || 0)) {
      return NextResponse.json(
        { error: 'Stock insuficiente para realizar la salida' },
        { status: 400 }
      )
    }

    // Calculate new stock
    const currentStock = product.stock || 0
    const newStock = type === 'entrada' 
      ? currentStock + quantity 
      : currentStock - quantity

    // Create movement record and update product stock in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create movement record with companyId
      const movement = await tx.inventoryMovement.create({
        data: {
          product_id: productId,
          companyId, // 🔥 ASOCIAR A COMPAÑÍA
          type,
          quantity,
          previous_stock: currentStock,
          new_stock: newStock,
          reason,
          created_at: new Date()
        }
      })
      
      // 2. Update product stock
      const updatedProduct = await tx.product.update({
        where: { 
          id: productId
        },
        data: {
          stock: newStock,
          updatedAt: new Date()
        },
        select: {
          id: true,
          name: true,
          stock: true,
          price: true,
          cost: true
        }
      })

      return {
        movement,
        product: updatedProduct
      }
    })

    return NextResponse.json({
      success: true,
      movement: {
        id: result.movement.id,
        productId,
        type,
        quantity,
        reason,
        notes,
        unitCost,
        previousStock: currentStock,
        newStock,
        createdAt: result.movement.created_at
      },
      product: {
        id: result.product.id,
        name: result.product.name,
        currentStock: result.product.stock || 0,
        unitPrice: result.product.price.toNumber(),
        unitCost: result.product.cost.toNumber()
      }
    })

  } catch (error) {
    console.error('Error creating stock movement:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// GET /api/inventory/movements - Get movement history
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { companyId, name: userName } = session.user

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const page = parseInt(searchParams.get('page') || '1')

    // Build where clause - ALWAYS filter by companyId
    const where: any = {
      companyId // 🔥 FILTRO CRÍTICO
    }

    if (productId) {
      // Verify product belongs to company
      const product = await prisma.product.findFirst({
        where: {
          id: productId,
          companyId
        }
      })

      if (!product) {
        return NextResponse.json(
          { error: 'Producto no encontrado' },
          { status: 404 }
        )
      }

      where.product_id = productId
    }

    // Get movements with pagination
    const skip = (page - 1) * limit

    const [movements, totalCount] = await Promise.all([
      prisma.inventoryMovement.findMany({
        where,
        include: {
          product: {
            select: {
              name: true
            }
          },
          sale: {
            select: {
              folio: true
            }
          }
        },
        orderBy: {
          created_at: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.inventoryMovement.count({ where })
    ])

    // Format response
    const formattedMovements = movements.map(m => ({
      id: m.id,
      productId: m.product_id,
      productName: m.product.name,
      type: m.type,
      quantity: m.quantity,
      reason: m.reason || 'Sin especificar',
      previousStock: m.previous_stock,
      newStock: m.new_stock,
      saleId: m.sale_id,
      saleFolio: m.sale?.folio,
      createdAt: m.created_at.toISOString(),
      createdBy: userName || 'Usuario'
    }))

    return NextResponse.json({
      movements: formattedMovements,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1
      }
    })

  } catch (error) {
    console.error('Error fetching movements:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
