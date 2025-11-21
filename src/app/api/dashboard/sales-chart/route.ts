import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // 🔥 CRITICAL: Obtener companyId de la sesión
    const companyId = session.user.companyId

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')

    // 🔥 CRITICAL: Verificar ventas solo de esta compañía
    const salesCount = await prisma.sale.count({
      where: {
        companyId: companyId
      }
    })
    
    if (salesCount === 0) {
      // Generar datos mock como fallback
      const chartData = []
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const baseVentas = 2000 + Math.random() * 2000
        const isWeekend = date.getDay() === 0 || date.getDay() === 6
        const weekendMultiplier = isWeekend ? 0.7 : 1.0
        
        chartData.push({
          date: date.toISOString().split('T')[0],
          ventas: Math.floor(baseVentas * weekendMultiplier),
          productos: Math.floor((20 + Math.random() * 40) * weekendMultiplier)
        })
      }
      return NextResponse.json(chartData)
    }

    // Usar datos reales de la BD - 🔥 FILTRADO POR EMPRESA
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const salesData = await prisma.sale.findMany({
      where: {
        companyId: companyId, // 🔥 CRITICAL: Filtrar por empresa
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        createdAt: true,
        total: true,
        saleItems: {
          select: {
            quantity: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    // Agrupar por fecha
    const salesByDate = new Map<string, { ventas: number, productos: number }>()

    // Inicializar todas las fechas con 0
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)
      const dateKey = date.toISOString().split('T')[0]
      salesByDate.set(dateKey, { ventas: 0, productos: 0 })
    }

    // Llenar con datos reales
    salesData.forEach(sale => {
      const dateKey = sale.createdAt.toISOString().split('T')[0]
      const existing = salesByDate.get(dateKey) || { ventas: 0, productos: 0 }
      
      existing.ventas += sale.total.toNumber()
      existing.productos += sale.saleItems.reduce((sum, item) => sum + item.quantity, 0)
      
      salesByDate.set(dateKey, existing)
    })

    const chartData = Array.from(salesByDate.entries()).map(([date, data]) => ({
      date,
      ventas: Math.round(data.ventas),
      productos: data.productos
    }))

    return NextResponse.json(chartData)

  } catch (error) {
    console.error('Error en sales chart:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}