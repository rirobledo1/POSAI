import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

// GET /api/inventory/reports - Get inventory reports and analytics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { companyId } = session.user

    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get('type') || 'overview'

    switch (reportType) {
      case 'overview':
        return await getOverviewReport(companyId)
      case 'low-stock':
        return await getLowStockReport(companyId)
      case 'movements':
        return await getMovementsReport(companyId)
      case 'categories':
        return await getCategoriesReport(companyId)
      default:
        return await getOverviewReport(companyId)
    }

  } catch (error) {
    console.error('Error fetching inventory reports:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

async function getOverviewReport(companyId: string) {
  // Get all products for this company
  const products = await prisma.product.findMany({
    where: {
      companyId // 🔥 FILTRO CRÍTICO
    },
    select: {
      id: true,
      name: true,
      categoryId: true,
      price: true,
      cost: true,
      stock: true,
      minStock: true,
      category: {
        select: {
          name: true
        }
      }
    }
  })

  const totalProducts = products.length
  const totalValue = products.reduce((sum, p) => 
    sum + (p.price.toNumber() * (p.stock || 0)), 0
  )
  
  const totalCostValue = products.reduce((sum, p) => 
    sum + (p.cost.toNumber() * (p.stock || 0)), 0
  )
  
  const lowStockProducts = products.filter(p => 
    (p.stock || 0) <= (p.minStock || 10) && (p.stock || 0) > 0
  )
  
  const outOfStockProducts = products.filter(p => (p.stock || 0) === 0)

  // Get recent movements for this company
  const recentMovements = await prisma.inventoryMovement.findMany({
    where: {
      companyId, // 🔥 FILTRO CRÍTICO
      created_at: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
      }
    },
    select: {
      type: true,
      quantity: true,
      created_at: true
    }
  })

  // Group movements by day
  const movementsByDay = new Map<string, { entradas: number; salidas: number }>()
  
  recentMovements.forEach(m => {
    const date = m.created_at.toISOString().split('T')[0]
    if (!movementsByDay.has(date)) {
      movementsByDay.set(date, { entradas: 0, salidas: 0 })
    }
    const dayData = movementsByDay.get(date)!
    if (m.type === 'entrada') {
      dayData.entradas += m.quantity
    } else {
      dayData.salidas += m.quantity
    }
  })

  // Convert to array and fill missing days
  const movementHistory = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const dayData = movementsByDay.get(date) || { entradas: 0, salidas: 0 }
    movementHistory.push({
      date,
      entradas: dayData.entradas,
      salidas: dayData.salidas,
      balance: dayData.entradas - dayData.salidas
    })
  }

  // Get today's movements count
  const today = new Date().toISOString().split('T')[0]
  const movementsToday = await prisma.inventoryMovement.count({
    where: {
      companyId, // 🔥 FILTRO CRÍTICO
      created_at: {
        gte: new Date(today)
      }
    }
  })

  return NextResponse.json({
    stats: {
      totalProducts,
      lowStockCount: lowStockProducts.length,
      outOfStockCount: outOfStockProducts.length,
      totalValue,
      totalCostValue,
      movementsToday
    },
    movementHistory
  })
}

async function getLowStockReport(companyId: string) {
  const lowStockProducts = await prisma.product.findMany({
    where: {
      companyId, // 🔥 FILTRO CRÍTICO
      OR: [
        {
          stock: {
            lte: prisma.product.fields.minStock
          }
        },
        { stock: 0 }
      ]
    },
    select: {
      id: true,
      name: true,
      categoryId: true,
      stock: true,
      minStock: true,
      price: true,
      cost: true,
      category: {
        select: {
          name: true
        }
      }
    },
    orderBy: { stock: 'asc' }
  })

  const processedProducts = lowStockProducts.map(product => ({
    id: product.id,
    name: product.name,
    category: product.category?.name || 'Sin categoría',
    current: product.stock || 0,
    min: product.minStock || 10,
    max: 100,
    unitPrice: product.price.toNumber(),
    unitCost: product.cost.toNumber(),
    status: (product.stock || 0) === 0 ? 'out' : 'low'
  }))

  return NextResponse.json({
    products: processedProducts,
    count: processedProducts.length
  })
}

async function getMovementsReport(companyId: string) {
  // Get movements for the last 7 days
  const movements = await prisma.inventoryMovement.findMany({
    where: {
      companyId, // 🔥 FILTRO CRÍTICO
      created_at: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      }
    },
    include: {
      product: {
        select: {
          price: true,
          cost: true
        }
      }
    }
  })

  // Group by day
  const movementsByDay = new Map<string, { entradas: number; salidas: number; value: number }>()
  
  movements.forEach(m => {
    const date = m.created_at.toISOString().split('T')[0]
    if (!movementsByDay.has(date)) {
      movementsByDay.set(date, { entradas: 0, salidas: 0, value: 0 })
    }
    const dayData = movementsByDay.get(date)!
    const productValue = m.product.price.toNumber() * m.quantity
    
    if (m.type === 'entrada') {
      dayData.entradas += m.quantity
      dayData.value += productValue
    } else {
      dayData.salidas += m.quantity
      dayData.value -= productValue
    }
  })

  // Convert to array
  const movementHistory = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const dayData = movementsByDay.get(date) || { entradas: 0, salidas: 0, value: 0 }
    movementHistory.push({
      date,
      entradas: dayData.entradas,
      salidas: dayData.salidas,
      balance: dayData.entradas - dayData.salidas,
      value: Math.round(dayData.value)
    })
  }

  const totalEntradas = movementHistory.reduce((sum, m) => sum + m.entradas, 0)
  const totalSalidas = movementHistory.reduce((sum, m) => sum + m.salidas, 0)
  const totalValue = movementHistory.reduce((sum, m) => sum + m.value, 0)

  return NextResponse.json({
    movements: movementHistory,
    summary: {
      totalEntradas,
      totalSalidas,
      balance: totalEntradas - totalSalidas,
      totalValue
    }
  })
}

async function getCategoriesReport(companyId: string) {
  // Group products by category - only for this company
  const products = await prisma.product.findMany({
    where: {
      companyId // 🔥 FILTRO CRÍTICO
    },
    select: {
      categoryId: true,
      stock: true,
      price: true,
      cost: true,
      category: {
        select: {
          name: true
        }
      }
    }
  })

  const categoryMap = new Map()
  
  products.forEach(product => {
    const category = product.category?.name || 'Sin categoría'
    if (!categoryMap.has(category)) {
      categoryMap.set(category, {
        name: category,
        products: 0,
        totalStock: 0,
        totalValue: 0,
        totalCostValue: 0
      })
    }
    
    const categoryData = categoryMap.get(category)
    categoryData.products += 1
    categoryData.totalStock += product.stock || 0
    categoryData.totalValue += (product.stock || 0) * product.price.toNumber()
    categoryData.totalCostValue += (product.stock || 0) * product.cost.toNumber()
  })

  const categories = Array.from(categoryMap.values()).sort((a, b) => 
    b.totalValue - a.totalValue
  )

  return NextResponse.json({
    categories,
    total: categories.length
  })
}
