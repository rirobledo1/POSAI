// 🚀 HOOK OPTIMIZADO CON CACHÉ Y LAZY LOADING
// src/hooks/useDashboard.ts - VERSIÓN OPTIMIZADA

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
  // Nuevos campos para créditos y adeudos
  totalCreditSales: number
  totalCustomerDebt: number
  customersWithDebt: number
  averageDebt: number
  topProducts: Array<{
    name: string
    sales: number
    revenue: number
  }>
  recentSales: Array<{
    id: string
    folio: string
    customer: string
    amount: number
    paymentMethod: string
    date: string
    status: 'completed' | 'pending' | 'cancelled'
  }>
  stockAlerts: Array<{
    product: string
    currentStock: number
    minStock: number
    category: string
  }>
  // Nuevos datos de adeudos
  customersWithDebtList: Array<{
    id: string
    name: string
    currentDebt: number
    creditLimit: number
    utilizationPercentage: number
  }>
  // Desglose por métodos de pago
  paymentMethodBreakdown?: {
    efectivo: { count: number, amount: number }
    tarjeta: { count: number, amount: number }
    transferencia: { count: number, amount: number }
    credito: { count: number, amount: number }
    total: { count: number, amount: number }
  }
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
    
    console.log('📈 Using cached dashboard data from localStorage')
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

// Datos mock simplificados para fallback rápido
const generateFastMockStats = (): DashboardStats => {
  return {
    totalSales: 156789,
    totalProducts: 2847,
    totalCustomers: 423,
    lowStockAlerts: 12,
    todaySales: 5640,
    weekSales: 32100,
    monthSales: 156789,
    salesGrowth: 8.2,
    // Nuevos campos de crédito - valores mock
    totalCreditSales: 45000,
    totalCustomerDebt: 12500,
    customersWithDebt: 8,
    averageDebt: 1562.5,
    topProducts: [
      { name: 'Tornillo Phillips 1/4"', sales: 145, revenue: 2890 },
      { name: 'Pintura Vinílica Blanca 4L', sales: 89, revenue: 5340 },
      { name: 'Tubo PVC 1/2" x 6m', sales: 76, revenue: 3800 },
      { name: 'Cemento Gris 50kg', sales: 45, revenue: 4500 },
      { name: 'Cable THW Cal 12 AWG', sales: 67, revenue: 3350 }
    ],
    recentSales: [
      { id: 'VTA-001', folio: 'V-001', customer: 'Juan Pérez', amount: 1250, paymentMethod: 'EFECTIVO', date: '2024-01-15', status: 'completed' },
      { id: 'VTA-002', folio: 'V-002', customer: 'María García', amount: 890, paymentMethod: 'CREDITO', date: '2024-01-15', status: 'completed' },
      { id: 'VTA-003', folio: 'V-003', customer: 'Carlos López', amount: 2150, paymentMethod: 'TARJETA', date: '2024-01-14', status: 'completed' },
      { id: 'VTA-004', folio: 'V-004', customer: 'Ana Martínez', amount: 675, paymentMethod: 'CREDITO', date: '2024-01-14', status: 'pending' },
      { id: 'VTA-005', folio: 'V-005', customer: 'Luis Rodríguez', amount: 3200, paymentMethod: 'EFECTIVO', date: '2024-01-13', status: 'completed' }
    ],
    stockAlerts: [
      { product: 'Tornillo Phillips 1/4"', currentStock: 45, minStock: 50, category: 'Ferretería' },
      { product: 'Pintura Blanca 4L', currentStock: 8, minStock: 15, category: 'Pinturas' },
      { product: 'Tubo PVC 1/2"', currentStock: 12, minStock: 20, category: 'Plomería' },
      { product: 'Cable THW Cal 12', currentStock: 5, minStock: 10, category: 'Eléctrico' }
    ],
    customersWithDebtList: [
      { id: 'cust-1', name: 'María García', currentDebt: 2500, creditLimit: 5000, utilizationPercentage: 50 },
      { id: 'cust-2', name: 'Carlos López', currentDebt: 3200, creditLimit: 8000, utilizationPercentage: 40 },
      { id: 'cust-3', name: 'Ana Martínez', currentDebt: 1500, creditLimit: 3000, utilizationPercentage: 50 },
    ],
    paymentMethodBreakdown: {
      efectivo: { count: 5, amount: 2500 },
      tarjeta: { count: 3, amount: 1800 },
      transferencia: { count: 2, amount: 900 },
      credito: { count: 4, amount: 2200 },
      total: { count: 14, amount: 7400 }
    }
  }
}

// Gráficos simplificados para fallback
const generateMockSalesChart = () => {
  return Array.from({ length: 7 }, (_, i) => ({
    date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    ventas: Math.floor(500 + Math.random() * 1000),
    productos: Math.floor(5 + Math.random() * 15)
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

export function useDashboard() {
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
          setStats(cached)
          setLoading(false)
          // Cargar gráficos en background
          setTimeout(() => fetchCharts(), 100)
          return cached
        }
      }
      
      console.log('📊 Fetching fresh dashboard data...')
      const startTime = performance.now()
      
      // Intentar endpoint principal primero
      console.log('🔍 Attempting /api/dashboard/stats...')
      let statsRes = await fetch('/api/dashboard/stats', {
        signal: abortControllerRef.current.signal,
        credentials: 'include', // Asegurar que las cookies de sesión se envíen
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      // Si es error 401, verificar sesión antes de ir a demo
      if (statsRes.status === 401) {
        console.log('🔓 Auth error (401) - checking session first...')
        
        // Verificar si hay sesión activa
        const sessionRes = await fetch('/api/debug-session', {
          signal: abortControllerRef.current.signal,
          credentials: 'include'
        })
        
        if (sessionRes.ok) {
          const sessionData = await sessionRes.json()
          console.log('🔍 Session debug:', sessionData)
          
          if (sessionData.canAccessDashboard) {
            // Hay sesión válida, reintentar una vez más
            console.log('🔄 Session valid, retrying dashboard API...')
            statsRes = await fetch('/api/dashboard/stats', {
              signal: abortControllerRef.current.signal,
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json',
              }
            })
            
            console.log(`🔄 Retry result: ${statsRes.status} ${statsRes.statusText}`)
          } else {
            console.log('❌ Session indicates no dashboard access')
          }
        } else {
          console.log('❌ Failed to get session debug info')
        }
        
        // Si sigue fallando, usar endpoint demo como último recurso
        if (!statsRes.ok) {
          console.log('🔓 Still unauthorized after retry, using demo endpoint as fallback')
          console.log(`📊 Using DEMO data - this explains the high figures like $45,231.89`)
          statsRes = await fetch('/api/demo/dashboard', {
            signal: abortControllerRef.current.signal
          })
        } else {
          console.log('✅ Dashboard API working after retry!')
        }
      } else if (statsRes.ok) {
        console.log('✅ Dashboard API responded successfully on first try')
      } else {
        console.log(`❌ Dashboard API error: ${statsRes.status} ${statsRes.statusText}`)
      }
      
      if (!statsRes.ok) {
        throw new Error(`HTTP ${statsRes.status}`)
      }
      
      const apiStats = await statsRes.json()
      const fetchTime = performance.now() - startTime
      
      console.log(`✅ Dashboard data fetched in ${Math.round(fetchTime)}ms`)
      console.log(`📊 Server processing: ${apiStats.performanceMs}ms`)
      console.log(`🔄 Queries executed: ${apiStats.queryCount}`)
      console.log(`💾 From server cache: ${apiStats.cached ? 'Yes' : 'No'}`)
      
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
        // Nuevos campos de crédito
        totalCreditSales: apiStats.totalCreditSales || 0,
        totalCustomerDebt: apiStats.totalCustomerDebt || 0,
        customersWithDebt: apiStats.customersWithDebt || 0,
        averageDebt: apiStats.averageDebt || 0,
        topProducts: apiStats.topProducts || [],
        recentSales: apiStats.recentSales || [],
        stockAlerts: apiStats.stockAlerts || [],
        customersWithDebtList: apiStats.customersWithDebtList || [],
        paymentMethodBreakdown: apiStats.paymentMethodBreakdown || {
          efectivo: { count: 0, amount: 0 },
          tarjeta: { count: 0, amount: 0 },
          transferencia: { count: 0, amount: 0 },
          credito: { count: 0, amount: 0 },
          total: { count: 0, amount: 0 }
        },
        performanceMs: apiStats.performanceMs,
        queryCount: apiStats.queryCount,
        cached: apiStats.cached
      }
      
      console.log('🐛 DEBUG - Payment method breakdown received:', apiStats.paymentMethodBreakdown)
      console.log('🐛 DEBUG - Full mapped stats:', statsData)
      
      setStats(statsData)
      
      // Guardar en caché
      setCachedStats(statsData)
      
      // Cargar gráficos de forma lazy (no críticos)
      setTimeout(() => fetchCharts(), 100)
      
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
      } else {
        // Usar datos mock como último recurso
        setStats(generateFastMockStats())
      }
      
    } finally {
      setLoading(false)
    }
  }, [])
  
  const fetchCharts = async () => {
    try {
      // Cargar gráficos solo si se necesitan (lazy loading)
      console.log('📈 Loading charts (lazy)...')
      
      const chartsRes = await fetch('/api/dashboard/charts')
      
      if (chartsRes.ok) {
        const chartsData = await chartsRes.json()
        console.log(`📊 Charts loaded (${chartsData.performanceMs}ms, cache: ${chartsData.cached})`)
        
        setSalesChart(chartsData.salesChart || [])
        setInventoryChart(chartsData.inventoryChart || [])
      } else {
        throw new Error(`Charts API error: ${chartsRes.status}`)
      }
      
    } catch (err) {
      console.error('❌ Charts fetch error:', err)
      // Fallback a datos mock
      setSalesChart(generateMockSalesChart())
      setInventoryChart(generateMockInventoryChart())
    }
  }

  const refetch = useCallback(() => {
    console.log('🔄 Forcing dashboard refresh...')
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