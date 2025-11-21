import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface DashboardStats {
  totalSales: number
  totalProducts: number
  totalCustomers: number
  lowStockAlerts: number
  todaySales: number
  weekSales: number
  monthSales: number
  salesGrowth: number
  topProducts: Array<{
    name: string
    sales: number
    revenue: number
  }>
  recentSales: Array<{
    id: string
    customer: string
    amount: number
    date: string
    status: 'completed' | 'pending' | 'cancelled'
  }>
  stockAlerts: Array<{
    product: string
    currentStock: number
    minStock: number
    category: string
  }>
}

// Datos mock realistas para ferretería
const generateMockStats = (): DashboardStats => {
  return {
    totalSales: 156789,
    totalProducts: 2847,
    totalCustomers: 423,
    lowStockAlerts: 12,
    todaySales: 5640,
    weekSales: 32100,
    monthSales: 156789,
    salesGrowth: 8.2,
    topProducts: [
      { name: 'Tornillo Phillips 1/4"', sales: 145, revenue: 2890 },
      { name: 'Pintura Vinílica Blanca 4L', sales: 89, revenue: 5340 },
      { name: 'Tubo PVC 1/2" x 6m', sales: 76, revenue: 3800 },
      { name: 'Cemento Gris 50kg', sales: 45, revenue: 4500 },
      { name: 'Cable THW Cal 12 AWG', sales: 67, revenue: 3350 }
    ],
    recentSales: [
      { 
        id: 'V-001', 
        customer: 'Juan Pérez', 
        amount: 1250, 
        date: new Date().toISOString(), 
        status: 'completed' 
      },
      { 
        id: 'V-002', 
        customer: 'María González', 
        amount: 890, 
        date: new Date(Date.now() - 1000 * 60 * 30).toISOString(), 
        status: 'completed' 
      },
      { 
        id: 'V-003', 
        customer: 'Carlos Rodríguez', 
        amount: 2150, 
        date: new Date(Date.now() - 1000 * 60 * 60).toISOString(), 
        status: 'pending' 
      },
      { 
        id: 'V-004', 
        customer: 'Ana López', 
        amount: 675, 
        date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), 
        status: 'completed' 
      },
      { 
        id: 'V-005', 
        customer: 'Pedro Martínez', 
        amount: 1830, 
        date: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), 
        status: 'completed' 
      }
    ],
    stockAlerts: [
      { product: 'Tornillo Hexagonal 3/8"', currentStock: 8, minStock: 50, category: 'Ferretería' },
      { product: 'Pintura Esmalte Azul 1L', currentStock: 3, minStock: 15, category: 'Pinturas' },
      { product: 'Codo PVC 90° 1/2"', currentStock: 12, minStock: 30, category: 'Plomería' },
      { product: 'Interruptor Simple Voltech', currentStock: 5, minStock: 25, category: 'Eléctrico' },
      { product: 'Lija para Madera #120', currentStock: 7, minStock: 40, category: 'Herramientas' }
    ]
  }
}

export async function GET() {
  try {
    // Obtener sesión del usuario
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const userEmail = session.user.email
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true, role: true }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Filtro base para las consultas según el rol
    const salesFilter = user.role === 'VENDEDOR' 
      ? { userId: user.id }  // Vendedores solo ven sus ventas
      : {}  // Otros roles ven todas las ventas

    // Obtener estadísticas reales
    const [
      totalSales,
      totalProducts,
      totalCustomers,
      todayStart,
      weekStart,
      monthStart
    ] = await Promise.all([
      // Total de ventas
      prisma.sale.count({ where: salesFilter }),
      
      // Total de productos
      prisma.product.count(),
      
      // Total de clientes
      prisma.customer.count(),
      
      // Fechas para calcular rangos
      Promise.resolve(new Date(new Date().setHours(0, 0, 0, 0))),
      Promise.resolve(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
      Promise.resolve(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
    ])

    // Ventas de hoy, semana y mes
    const [todaySalesSum, weekSalesSum, monthSalesSum] = await Promise.all([
      prisma.sale.aggregate({
        where: {
          ...salesFilter,
          createdAt: { gte: todayStart }
        },
        _sum: { total: true }
      }),
      
      prisma.sale.aggregate({
        where: {
          ...salesFilter,
          createdAt: { gte: weekStart }
        },
        _sum: { total: true }
      }),
      
      prisma.sale.aggregate({
        where: {
          ...salesFilter,
          createdAt: { gte: monthStart }
        },
        _sum: { total: true }
      })
    ])

    // Productos con bajo stock
    const lowStockProducts = await prisma.product.count({
      where: {
        stock: {
          lte: 10  // Productos con 10 o menos unidades
        }
      }
    })

    // Ventas recientes
    const recentSales = await prisma.sale.findMany({
      where: salesFilter,
      select: {
        folio: true,
        total: true,
        createdAt: true,
        status: true,
        customer: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    // Productos más vendidos
    const topProductsRaw = await prisma.saleItem.groupBy({
      by: ['productId'],
      _sum: {
        quantity: true,
        total: true
      },
      orderBy: {
        _sum: {
          quantity: 'desc'
        }
      },
      take: 5
    })

    // Obtener nombres de productos más vendidos
    const topProductsWithNames = await Promise.all(
      topProductsRaw.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { name: true }
        })
        return {
          name: product?.name || 'Producto desconocido',
          sales: item._sum?.quantity || 0,
          revenue: Number(item._sum?.total || 0)
        }
      })
    )

    // Alertas de stock
    const stockAlerts = await prisma.product.findMany({
      where: {
        stock: {
          lte: 10  // Productos con 10 o menos unidades
        }
      },
      select: {
        name: true,
        stock: true,
        minStock: true,
        category: {
          select: { name: true }
        }
      },
      take: 10
    })

    const stats: DashboardStats = {
      totalSales,
      totalProducts,
      totalCustomers,
      lowStockAlerts: lowStockProducts,
      todaySales: todaySalesSum._sum.total || 0,
      weekSales: weekSalesSum._sum.total || 0,
      monthSales: monthSalesSum._sum.total || 0,
      salesGrowth: 8.2, // Esto se puede calcular comparando con el mes anterior
      topProducts: topProductsWithNames,
      recentSales: recentSales.map(sale => ({
        id: sale.folio,
        customer: sale.customer?.name || 'Cliente desconocido',
        amount: sale.total,
        date: sale.createdAt.toISOString(),
        status: sale.status.toLowerCase() as 'completed' | 'pending' | 'cancelled'
      })),
      stockAlerts: stockAlerts.map(product => ({
        product: product.name,
        currentStock: product.stock,
        minStock: product.minStock,
        category: product.category?.name || 'Sin categoría'
      }))
    }

    return NextResponse.json({
      success: true,
      data: stats
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch dashboard statistics' 
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}