import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/branches/stats - Estadísticas comparativas de sucursales
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { companyId, role } = session.user

    // Solo ADMIN puede ver estadísticas comparativas
    if (role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado. Solo administradores pueden ver estadísticas.' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30' // días

    // Obtener todas las sucursales activas
    const branches = await prisma.branch.findMany({
      where: {
        companyId,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        code: true,
        isMain: true
      }
    })

    // Fecha de inicio según el período
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(period))

    // Estadísticas por sucursal
    const branchStats = await Promise.all(
      branches.map(async (branch) => {
        const [salesStats, productStats, userCount] = await Promise.all([
          // Ventas
          prisma.sale.aggregate({
            where: {
              branchId: branch.id,
              createdAt: { gte: startDate }
            },
            _sum: { total: true },
            _count: true
          }),
          
          // Productos
          prisma.branchProduct.aggregate({
            where: {
              branchId: branch.id,
              isActive: true
            },
            _sum: { stock: true },
            _count: true
          }),
          
          // Usuarios
          prisma.user.count({
            where: {
              branchId: branch.id,
              isActive: true
            }
          })
        ])

        // Productos con stock bajo
        const lowStockCount = await prisma.branchProduct.count({
          where: {
            branchId: branch.id,
            stock: {
              lte: prisma.branchProduct.fields.minStock
            },
            isActive: true
          }
        })

        return {
          branchId: branch.id,
          branchName: branch.name,
          branchCode: branch.code,
          isMain: branch.isMain,
          sales: {
            count: salesStats._count,
            total: salesStats._sum.total?.toNumber() || 0
          },
          products: {
            count: productStats._count,
            totalStock: productStats._sum.stock || 0,
            lowStock: lowStockCount
          },
          users: userCount
        }
      })
    )

    // Totales consolidados
    const totals = branchStats.reduce((acc, branch) => ({
      sales: {
        count: acc.sales.count + branch.sales.count,
        total: acc.sales.total + branch.sales.total
      },
      products: {
        count: acc.products.count + branch.products.count,
        totalStock: acc.products.totalStock + branch.products.totalStock,
        lowStock: acc.products.lowStock + branch.products.lowStock
      },
      users: acc.users + branch.users
    }), {
      sales: { count: 0, total: 0 },
      products: { count: 0, totalStock: 0, lowStock: 0 },
      users: 0
    })

    // Top sucursales por ventas
    const topBranches = [...branchStats]
      .sort((a, b) => b.sales.total - a.sales.total)
      .slice(0, 5)
      .map(b => ({
        name: b.branchName,
        code: b.branchCode,
        sales: b.sales.total
      }))

    return NextResponse.json({
      period: parseInt(period),
      branches: branchStats,
      totals,
      topBranches,
      summary: {
        totalBranches: branches.length,
        activeBranches: branches.filter(b => !b.isMain).length + 1,
        avgSalesPerBranch: branches.length > 0 ? totals.sales.total / branches.length : 0,
        avgProductsPerBranch: branches.length > 0 ? totals.products.count / branches.length : 0
      }
    })

  } catch (error) {
    console.error('Error fetching branch stats:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
