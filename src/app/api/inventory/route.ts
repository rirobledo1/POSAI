import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

// GET /api/inventory - Get inventory overview with optimization
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { companyId } = session.user

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const stockFilter = searchParams.get('stockFilter') || 'all'
    const sortBy = searchParams.get('sortBy') || 'name'
    const sortOrder = searchParams.get('sortOrder') || 'asc'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Build where clause - ALWAYS filter by companyId
    const where: any = {
      companyId // 🔥 FILTRO CRÍTICO
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
        { category: { name: { contains: search, mode: 'insensitive' } } }
      ]
    }
    
    if (category) {
      where.category = { 
        name: category,
        companyId // 🔥 También en relaciones
      }
    }

    // Get total count for pagination
    const totalCount = await prisma.product.count({ where })

    // Calculate pagination
    const totalPages = Math.ceil(totalCount / limit)
    const skip = (page - 1) * limit

    // Build orderBy
    const orderBy: any = {}
    switch (sortBy) {
      case 'stock':
        orderBy.stock = sortOrder
        break
      case 'value':
        orderBy.price = sortOrder
        break
      case 'lastMovement':
        orderBy.updatedAt = sortOrder
        break
      default:
        orderBy.name = sortOrder
    }

    // Get products with optimized query
    const products = await prisma.product.findMany({
      where,
      include: {
        category: {
          select: {
            name: true
          }
        }
      },
      orderBy,
      skip,
      take: limit
    })

    // Get categories for filters - only from this company
    const categoryData = await prisma.categories.findMany({
      where: {
        companyId, // 🔥 FILTRO CRÍTICO
        active: true
      },
      select: {
        name: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Get all products for stats calculation - filtered by company
    const allProducts = await prisma.product.findMany({
      where: { companyId }, // 🔥 FILTRO CRÍTICO
      select: { 
        stock: true, 
        minStock: true,
        price: true,
        cost: true
      }
    })
    
    const lowStockCount = allProducts.filter(p => 
      p.stock > 0 && p.stock <= p.minStock
    ).length

    const outOfStockCount = allProducts.filter(p => p.stock === 0).length

    // Convert and enhance products data
    const productsWithStock = products.map(product => ({
      id: product.id,
      name: product.name,
      category: product.category?.name || 'Sin categoría',
      currentStock: product.stock || 0,
      minStock: product.minStock || 10,
      maxStock: 100,
      unitPrice: product.price.toNumber(),
      unitCost: product.cost.toNumber(),
      totalSellValue: (product.price.toNumber()) * (product.stock || 0),
      totalCostValue: (product.cost.toNumber()) * (product.stock || 0),
      potentialProfit: ((product.price.toNumber()) - (product.cost.toNumber())) * (product.stock || 0),
      lastMovement: product.updatedAt.toISOString().split('T')[0],
      barcode: product.barcode,
      active: product.active
    }))

    // Apply stock filters after data fetch if needed
    let filteredProducts = productsWithStock
    
    if (stockFilter === 'low') {
      filteredProducts = productsWithStock.filter(p => 
        p.currentStock <= p.minStock && p.currentStock > 0
      )
    } else if (stockFilter === 'out') {
      filteredProducts = productsWithStock.filter(p => p.currentStock === 0)
    } else if (stockFilter === 'normal') {
      filteredProducts = productsWithStock.filter(p => 
        p.currentStock > p.minStock
      )
    }

    // Calculate totals for all inventory values
    const totalSellValue = productsWithStock.reduce((sum, p) => sum + p.totalSellValue, 0)
    const totalCostValue = productsWithStock.reduce((sum, p) => sum + p.totalCostValue, 0)
    const totalPotentialProfit = productsWithStock.reduce((sum, p) => sum + p.potentialProfit, 0)

    return NextResponse.json({
      products: filteredProducts,
      stats: {
        totalProducts: totalCount,
        lowStockCount,
        outOfStockCount,
        totalSellValue,
        totalCostValue,
        totalPotentialProfit,
        categories: categoryData.map(c => c.name)
      },
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    })

  } catch (error) {
    console.error('Error fetching inventory:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
