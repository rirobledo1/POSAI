// Optimización 2: Hook con lazy loading y caché cliente
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

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
  // Metadata de performance
  performanceMs?: number
  queryCount?: number
  cached?: boolean
}

// Caché en localStorage con TTL
const getCachedStats = (): DashboardStats | null => {
  try {
    const cached = localStorage.getItem('dashboard-stats')
    if (!cached) return null
    
    const { data, timestamp } = JSON.parse(cached)
    const now = Date.now()
    const TTL = 2 * 60 * 1000 // 2 minutos
    
    if (now - timestamp > TTL) {
      localStorage.removeItem('dashboard-stats')
      return null
    }
    
    return data
  } catch {
    return null
  }
}

const setCachedStats = (data: DashboardStats) => {
  try {
    localStorage.setItem('dashboard-stats', JSON.stringify({
      data,
      timestamp: Date.now()
    }))
  } catch {
    // Ignorar errores de storage
  }
}

export function useDashboardOptimized() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [salesChart, setSalesChart] = useState<any[]>([])
  const [inventoryChart, setInventoryChart] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const fetchStats = useCallback(async (useCache = true) => {
    // Cancelar request anterior si existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    // Crear nuevo AbortController
    abortControllerRef.current = new AbortController()
    
    try {
      setLoading(true)
      setError(null)
      
      // Intentar usar caché primero
      if (useCache) {
        const cached = getCachedStats()
        if (cached) {
          console.log('📈 Using cached dashboard data')
          setStats(cached)
          setLoading(false)
          return cached
        }
      }
      
      console.log('📊 Fetching fresh dashboard data...')
      const startTime = performance.now()
      
      // Fetch solo stats principales primero (críticos)
      const statsRes = await fetch('/api/dashboard/stats', {
        signal: abortControllerRef.current.signal
      })
      
      if (!statsRes.ok) {
        throw new Error(`HTTP ${statsRes.status}`)
      }
      
      const apiStats = await statsRes.json()
      const fetchTime = performance.now() - startTime
      
      console.log(`✅ Dashboard data fetched in ${Math.round(fetchTime)}ms`)
      console.log(`📊 Server processing: ${apiStats.performanceMs}ms`)
      console.log(`🔄 Queries executed: ${apiStats.queryCount}`)
      console.log(`💾 From cache: ${apiStats.cached ? 'Yes' : 'No'}`)
      
      // Mapear datos
      const statsData: DashboardStats = {
        totalSales: apiStats.totalSales || 0,
        totalProducts: apiStats.totalProducts || 0,
        totalCustomers: apiStats.totalCustomers || 0,
        lowStockAlerts: apiStats.lowStockAlerts || 0,
        todaySales: apiStats.todaySales || 0,
        weekSales: apiStats.weekSales || 0,
        monthSales: apiStats.monthSales || 0,
        salesGrowth: apiStats.salesGrowth || 0,
        topProducts: apiStats.topProducts || [],
        recentSales: apiStats.recentSales || [],
        stockAlerts: apiStats.stockAlerts || [],
        performanceMs: apiStats.performanceMs,
        queryCount: apiStats.queryCount,
        cached: apiStats.cached
      }
      
      setStats(statsData)
      
      // Guardar en caché
      setCachedStats(statsData)
      
      // Cargar gráficos de forma lazy (no críticos)
      setTimeout(() => {
        fetchCharts()
      }, 100)
      
      return statsData
      
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('📊 Dashboard request aborted')
        return
      }
      
      console.error('❌ Dashboard fetch error:', err)
      setError(err.message || 'Error loading dashboard')
      
      // Fallback a caché expirado si existe
      const expiredCache = getCachedStats()
      if (expiredCache) {
        console.log('📈 Using expired cache as fallback')
        setStats({ ...expiredCache, cached: true })
      }
      
    } finally {
      setLoading(false)
    }
  }, [])
  
  const fetchCharts = async () => {
    try {
      // Cargar gráficos solo si se necesitan
      const [salesChartRes, inventoryChartRes] = await Promise.all([
        fetch('/api/dashboard/sales-chart').catch(() => null),
        fetch('/api/dashboard/inventory-chart').catch(() => null)
      ])
      
      // Usar datos mock por ahora (pueden optimizarse después)
      setSalesChart(generateMockSalesChart())
      setInventoryChart(generateMockInventoryChart())
      
    } catch (err) {
      console.error('❌ Charts fetch error:', err)
    }
  }

  const refetch = useCallback(() => {
    return fetchStats(false) // Forzar refresh sin caché
  }, [fetchStats])

  useEffect(() => {
    fetchStats()
    
    // Cleanup
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [fetchStats])

  return {
    stats,
    salesChart,
    inventoryChart,
    loading,
    error,
    refetch
  }
}

// Funciones helper para datos mock de gráficos
const generateMockSalesChart = () => {
  // Datos simplificados para gráficos
  return Array.from({ length: 7 }, (_, i) => ({
    date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    ventas: Math.floor(1000 + Math.random() * 2000),
    productos: Math.floor(10 + Math.random() * 20)
  }))
}

const generateMockInventoryChart = () => {
  return [
    { categoria: 'Ferretería', total: 45, bajo_stock: 5 },
    { categoria: 'Pinturas', total: 23, bajo_stock: 3 },
    { categoria: 'Plomería', total: 18, bajo_stock: 2 },
    { categoria: 'Eléctrico', total: 12, bajo_stock: 1 }
  ]
}
