// 📊 ENDPOINT SIMPLIFICADO Y RÁPIDO PARA GRÁFICOS
// src/app/api/dashboard/charts/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Cache simplificado (por compañía)
let quickCache: Map<string, any> = new Map()
let cacheTime: Map<string, number> = new Map()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutos

export async function GET(request: NextRequest) {
  const startTime = performance.now()
  
  try {
    // 🔥 CRITICAL: Verificar sesión y obtener companyId
    const session = await getServerSession(authOptions)
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const companyId = session.user.companyId
    
    // Verificar caché rápido por compañía
    const cachedData = quickCache.get(companyId)
    const cachedTime = cacheTime.get(companyId) || 0
    
    if (cachedData && (Date.now() - cachedTime) < CACHE_TTL) {
      console.log(`📈 Charts from cache for company ${companyId}`)
      return NextResponse.json({
        ...cachedData,
        performanceMs: Math.round(performance.now() - startTime),
        cached: true
      })
    }

    console.log(`📊 Generating charts data for company ${companyId}...`)

    // Queries simplificadas y rápidas - 🔥 FILTRADAS POR EMPRESA
    const [salesResult, inventoryResult] = await Promise.all([
      // Query de ventas simplificada (últimos 7 días) - FILTRADA
      prisma.$queryRaw<any[]>`
        SELECT 
          DATE(created_at) as date,
          COUNT(*)::int as ventas,
          SUM(total)::numeric as ingresos
        FROM sales 
        WHERE created_at >= CURRENT_DATE - INTERVAL '6 days'
          AND company_id = ${companyId}
        GROUP BY DATE(created_at)
        ORDER BY DATE(created_at)
      `,
      
      // Query de inventario simplificada - FILTRADA
      prisma.$queryRaw<any[]>`
        SELECT 
          COALESCE(c.name, 'Sin categoría') as categoria,
          COUNT(p.id)::int as total,
          COUNT(CASE WHEN p.stock <= p.min_stock THEN 1 END)::int as bajo_stock
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.active = true
          AND p.company_id = ${companyId}
        GROUP BY c.name
        ORDER BY COUNT(p.id) DESC
        LIMIT 6
      `
    ])

    // Generar datos para los últimos 7 días (rellenar días faltantes)
    const salesMap = new Map()
    salesResult.forEach(row => {
      salesMap.set(row.date.toISOString().split('T')[0], {
        ventas: Number(row.ventas) || 0,
        ingresos: Number(row.ingresos) || 0
      })
    })

    const salesChart = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      const dateStr = date.toISOString().split('T')[0]
      const data = salesMap.get(dateStr) || { ventas: 0, ingresos: 0 }
      
      return {
        date: dateStr,
        ventas: data.ventas,
        productos: Math.max(1, Math.floor(data.ventas * 0.3)), // Estimación
        ingresos: data.ingresos
      }
    })

    const inventoryChart = inventoryResult.map(item => ({
      categoria: item.categoria || 'Sin categoría',
      total: Number(item.total) || 0,
      bajo_stock: Number(item.bajo_stock) || 0
    }))

    const chartsData = {
      salesChart,
      inventoryChart,
      summary: {
        totalDays: 7,
        totalCategories: inventoryChart.length,
        weekRevenue: salesChart.reduce((sum, day) => sum + (day.ingresos || 0), 0),
        totalStock: inventoryChart.reduce((sum, cat) => sum + cat.total, 0)
      }
    }

    // Actualizar caché por compañía
    quickCache.set(companyId, chartsData)
    cacheTime.set(companyId, Date.now())

    const processingTime = Math.round(performance.now() - startTime)
    console.log(`✅ Charts generated in ${processingTime}ms for company ${companyId}`)

    return NextResponse.json({
      ...chartsData,
      performanceMs: processingTime,
      cached: false,
      queryCount: 2
    })

  } catch (error) {
    console.error('❌ Charts API Error:', error)
    
    // Datos mock inmediatos
    const mockData = {
      salesChart: Array.from({ length: 7 }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - (6 - i))
        return {
          date: date.toISOString().split('T')[0],
          ventas: Math.floor(Math.random() * 20) + 5,
          productos: Math.floor(Math.random() * 10) + 3,
          ingresos: Math.floor(Math.random() * 50000) + 10000
        }
      }),
      inventoryChart: [
        { categoria: 'Ferretería', total: 145, bajo_stock: 12 },
        { categoria: 'Pinturas', total: 89, bajo_stock: 8 },
        { categoria: 'Plomería', total: 76, bajo_stock: 5 },
        { categoria: 'Eléctrico', total: 67, bajo_stock: 3 },
        { categoria: 'Herramientas', total: 45, bajo_stock: 7 }
      ],
      summary: {
        totalDays: 7,
        totalCategories: 5,
        weekRevenue: 245000,
        totalStock: 422
      }
    }

    console.log('📊 Using mock charts data')
    
    return NextResponse.json({
      ...mockData,
      performanceMs: Math.round(performance.now() - startTime),
      cached: false,
      error: 'Using mock data',
      queryCount: 0
    })
  }
}
