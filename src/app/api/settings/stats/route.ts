import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Dashboard de estadísticas del sistema (por compañía)
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { companyId } = session.user

    // Obtener estadísticas básicas del sistema para esta compañía
    const [
      totalUsers,
      activeUsers,
      totalCategories,
      totalProducts,
      totalCustomers,
      totalSales
    ] = await Promise.all([
      // Total de usuarios de esta compañía
      prisma.user.count({
        where: { companyId } // 🔥 FILTRO CRÍTICO
      }),
      
      // Usuarios activos de esta compañía
      prisma.user.count({
        where: { 
          companyId, // 🔥 FILTRO CRÍTICO
          isActive: true 
        }
      }),
      
      // Total de categorías de esta compañía
      prisma.categories.count({
        where: { 
          companyId, // 🔥 FILTRO CRÍTICO
          active: true 
        }
      }),
      
      // Total de productos de esta compañía
      prisma.product.count({
        where: { 
          companyId, // 🔥 FILTRO CRÍTICO
          active: true 
        }
      }),

      // Total de clientes de esta compañía
      prisma.customer.count({
        where: { 
          companyId, // 🔥 FILTRO CRÍTICO
          active: true 
        }
      }),

      // Total de ventas de esta compañía
      prisma.sale.count({
        where: { companyId } // 🔥 FILTRO CRÍTICO
      })
    ])

    // Estadísticas de inventario
    const products = await prisma.product.findMany({
      where: {
        companyId, // 🔥 FILTRO CRÍTICO
        active: true
      },
      select: {
        stock: true,
        minStock: true,
        price: true,
        cost: true
      }
    })

    const lowStockCount = products.filter(p => 
      p.stock > 0 && p.stock <= p.minStock
    ).length

    const outOfStockCount = products.filter(p => p.stock === 0).length

    const totalInventoryValue = products.reduce((sum, p) => 
      sum + (p.price.toNumber() * p.stock), 0
    )

    const totalInventoryCost = products.reduce((sum, p) => 
      sum + (p.cost.toNumber() * p.stock), 0
    )

    // Ventas del mes actual
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    
    const salesThisMonth = await prisma.sale.aggregate({
      where: {
        companyId, // 🔥 FILTRO CRÍTICO
        createdAt: {
          gte: firstDayOfMonth
        }
      },
      _sum: {
        total: true
      },
      _count: true
    })

    // Información de la compañía
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        name: true,
        plan: true,
        status: true,
        createdAt: true
      }
    })

    return NextResponse.json({
      // Estadísticas de usuarios
      activeUsers,
      totalUsers,
      inactiveUsers: totalUsers - activeUsers,

      // Estadísticas de productos
      totalProducts,
      totalCategories,
      lowStockCount,
      outOfStockCount,

      // Estadísticas de clientes
      totalCustomers,

      // Estadísticas de ventas
      totalSales,
      salesThisMonth: {
        count: salesThisMonth._count,
        total: salesThisMonth._sum.total?.toNumber() || 0
      },

      // Estadísticas de inventario
      inventory: {
        totalValue: totalInventoryValue,
        totalCost: totalInventoryCost,
        potentialProfit: totalInventoryValue - totalInventoryCost
      },

      // Información de la compañía
      company: {
        name: company?.name,
        plan: company?.plan,
        status: company?.status,
        memberSince: company?.createdAt.toISOString()
      },

      // Resumen completo
      statistics: {
        users: {
          total: totalUsers,
          active: activeUsers,
          inactive: totalUsers - activeUsers
        },
        categories: {
          total: totalCategories
        },
        products: {
          total: totalProducts,
          lowStock: lowStockCount,
          outOfStock: outOfStockCount
        },
        customers: {
          total: totalCustomers
        },
        sales: {
          total: totalSales,
          thisMonth: salesThisMonth._count
        }
      }
    })
  } catch (error) {
    console.error('Error fetching system stats:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
