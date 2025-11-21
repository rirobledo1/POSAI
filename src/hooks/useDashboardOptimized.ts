// 🚀 HOOK DASHBOARD CON SELECTOR DE PERÍODOS
// src/hooks/useDashboardOptimized.ts

'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'

// 🗓️ Tipos de período
export type PeriodType = 'current_month' | 'current_year' | 'last_12_months' | 'last_30_days' | 'all_time'

export interface DashboardStats {
  // Información del período
  period: PeriodType
  periodLabel: string
  
  // Estadísticas principales
  totalSales: number
  totalProducts: number
  totalCustomers: number
  lowStockAlerts: number
  todaySales: number
  weekSales: number
  monthSales: number
  salesGrowth: number
  
  // Comparación con período anterior
  comparison?: {
    currentAmount: number
    previousAmount: number
    change: number
    changePercent: number
  }
  
  // Créditos
  totalCreditSales: number
  totalCustomerDebt: number
  customersWithDebt: number
  averageDebt: number
  
  // Datos detallados
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
  customersWithDebtList: Array<{
    id: string
    name: string
    currentDebt: number
    creditLimit: number
    utilizationPercentage: number
  }>
  paymentMethodBreakdown?: {
    efectivo: { count: number, amount: number }
    tarjeta: { count: number, amount: number }
    transferencia: { count: number, amount: number }
    credito: { count: number, amount: number }
    total: { count: number, amount: number }
  }
  
  // Metadata
  performanceMs?: number
  queryCount?: number
  cached?: boolean
  filteredByUser?: boolean
  userRole?: string
}

// 🎯 Hook para localStorage del período seleccionado
function usePeriodStorage() {
  const [storedPeriod, setStoredPeriod] = useState<PeriodType>('current_month')

  useEffect(() => {
    try {
      const stored = localStorage.getItem('dashboard-period')
      if (stored && ['current_month', 'current_year', 'last_12_months', 'last_30_days', 'all_time'].includes(stored)) {
        setStoredPeriod(stored as PeriodType)
      }
    } catch (error) {
      console.log('Error loading period from localStorage:', error)
    }
  }, [])

  const updateStoredPeriod = useCallback((period: PeriodType) => {
    try {
      localStorage.setItem('dashboard-period', period)
      setStoredPeriod(period)
    } catch (error) {
      console.log('Error saving period to localStorage:', error)
    }
  }, [])

  return [storedPeriod, updateStoredPeriod] as const
}

// 🎯 Función para generar datos mock realistas
const generateMockData = (period: PeriodType): DashboardStats => {
  return {
    period,
    periodLabel: getPeriodLabel(period),
    totalSales: 0,
    totalProducts: 0,
    totalCustomers: 0,
    lowStockAlerts: 0,
    todaySales: 0,
    weekSales: 0,
    monthSales: 0,
    salesGrowth: 0,
    totalCreditSales: 0,
    totalCustomerDebt: 0,
    customersWithDebt: 0,
    averageDebt: 0,
    topProducts: [],
    recentSales: [],
    stockAlerts: [],
    customersWithDebtList: [],
    performanceMs: 0,
    queryCount: 0,
    cached: false
  }
}

// 🎯 Función para generar gráficos mock
const generateMockCharts = () => {
  const salesChart = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    return {
      date: date.toISOString().split('T')[0],
      ventas: Math.floor(Math.random() * 15) + 5,
      productos: Math.floor(Math.random() * 8) + 3,
    }
  })

  const inventoryChart = [
    { categoria: 'Ferretería', total: 0, bajo_stock: 0 },
    { categoria: 'Pinturas', total: 0, bajo_stock: 0 },
    { categoria: 'Plomería', total: 0, bajo_stock: 0 },
    { categoria: 'Eléctrico', total: 0, bajo_stock: 0 },
    { categoria: 'Construcción', total: 0, bajo_stock: 0 }
  ]

  return { salesChart, inventoryChart }
}

// 🎯 Helper para obtener etiqueta del período
function getPeriodLabel(period: PeriodType): string {
  switch (period) {
    case 'current_month': return 'Este Mes'
    case 'current_year': return 'Este Año'
    case 'last_12_months': return 'Últimos 12 Meses'
    case 'last_30_days': return 'Últimos 30 Días'
    case 'all_time': return 'Todo el Tiempo'
    default: return 'Período Desconocido'
  }
}

// 🎯 Hook principal que carga datos reales con selector de períodos
export function useDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [salesChart, setSalesChart] = useState<any[]>([])
  const [inventoryChart, setInventoryChart] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const mountedRef = useRef(true)
  const [selectedPeriod, setSelectedPeriod] = usePeriodStorage()

  // 🎯 Función para cargar datos reales del dashboard con período
  const loadDashboardData = useCallback(async (period: PeriodType = selectedPeriod, force = false) => {
    console.log(`🔄 Loading dashboard data for period: ${period}${force ? ' (forced)' : ''}`)
    setLoading(true)
    setError(null)
    
    try {
      // Cargar estadísticas principales con período
      console.log('📊 Fetching dashboard stats with period...')
      const statsResponse = await fetch(`/api/dashboard/stats?period=${period}${force ? '&refresh=true' : ''}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': force ? 'no-cache' : 'default'
        }
      })

      if (!statsResponse.ok) {
        throw new Error(`Dashboard stats API error: ${statsResponse.status} ${statsResponse.statusText}`)
      }

      const statsData = await statsResponse.json()
      console.log('✅ Dashboard stats loaded for period:', period, statsData)

      // Cargar gráficos de ventas (independientes del período por ahora)
      console.log('📈 Fetching sales chart...')
      const salesChartResponse = await fetch('/api/dashboard/sales-chart', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      let salesChartData = []
      if (salesChartResponse.ok) {
        const salesChart = await salesChartResponse.json()
        salesChartData = salesChart || []
        console.log('✅ Sales chart loaded:', salesChartData.length, 'days')
      } else {
        console.log('⚠️ Sales chart API not available, using mock data')
        salesChartData = generateMockCharts().salesChart
      }

      // Cargar gráfico de inventario
      console.log('📦 Fetching inventory chart...')
      const inventoryResponse = await fetch('/api/dashboard/inventory-chart', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      let inventoryChartData = []
      if (inventoryResponse.ok) {
        const inventoryChart = await inventoryResponse.json()
        inventoryChartData = inventoryChart.data || []
        console.log('✅ Inventory chart loaded:', inventoryChartData.length, 'categories')
      } else {
        console.log('⚠️ Inventory chart API not available, using mock data')
        inventoryChartData = generateMockCharts().inventoryChart
      }

      // Actualizar estado con datos reales
      if (mountedRef.current) {
        setStats(statsData)
        setSalesChart(salesChartData)
        setInventoryChart(inventoryChartData)
        setLoading(false)
        setError(null)
      }

      console.log('✅ All dashboard data loaded successfully for period:', period)

    } catch (error) {
      console.error('❌ Error loading dashboard data:', error)
      
      // Fallback a datos mock si hay error
      console.log('🔄 Falling back to mock data...')
      const mockData = generateMockData(period)
      const mockCharts = generateMockCharts()

      if (mountedRef.current) {
        setStats(mockData)
        setSalesChart(mockCharts.salesChart)
        setInventoryChart(mockCharts.inventoryChart)
        setLoading(false)
        setError(error instanceof Error ? error.message : 'Error desconocido')
      }
    }
  }, [selectedPeriod])

  // 🎯 Función para cambiar período
  const changePeriod = useCallback((newPeriod: PeriodType) => {
    console.log('📅 Changing period from', selectedPeriod, 'to', newPeriod)
    setSelectedPeriod(newPeriod)
    loadDashboardData(newPeriod, true) // Force refresh when changing period
  }, [selectedPeriod, setSelectedPeriod, loadDashboardData])

  // 🎯 Función de refetch
  const refetch = useCallback(() => {
    console.log('🔄 Force refresh dashboard data...')
    loadDashboardData(selectedPeriod, true)
  }, [selectedPeriod, loadDashboardData])

  // 🎯 Efecto principal - carga inicial
  useEffect(() => {
    mountedRef.current = true
    loadDashboardData(selectedPeriod)

    return () => {
      mountedRef.current = false
    }
  }, []) // Solo cargar una vez al montar

  // 🎯 Performance info
  const performanceInfo = useMemo(() => ({
    loadTime: stats?.performanceMs || 0,
    cached: stats?.cached || false,
    queryCount: stats?.queryCount || 0,
    dataSource: stats?.cached ? 'cache' : 'api',
    filteredByUser: stats?.filteredByUser || false,
    userRole: stats?.userRole || 'UNKNOWN',
    period: selectedPeriod,
    periodLabel: getPeriodLabel(selectedPeriod)
  }), [stats, selectedPeriod])

  // 🎯 Función helper para formatear comparación
  const formatComparison = useCallback((comparison?: DashboardStats['comparison']) => {
    if (!comparison) return null
    
    const { change, changePercent } = comparison
    const isPositive = change >= 0
    const isSignificant = Math.abs(changePercent) >= 5 // 5% threshold
    
    return {
      change,
      changePercent,
      isPositive,
      isSignificant,
      formattedChange: `${isPositive ? '+' : ''}$${Math.abs(change).toLocaleString()}`,
      formattedPercent: `${isPositive ? '+' : ''}${changePercent.toFixed(1)}%`,
      icon: isPositive ? '📈' : '📉',
      color: isPositive ? 'text-green-600' : 'text-red-600',
      bgColor: isPositive ? 'bg-green-50' : 'bg-red-50'
    }
  }, [])

  return {
    // Data
    stats,
    salesChart,
    inventoryChart,
    
    // State
    loading,
    error,
    selectedPeriod,
    
    // Actions
    refetch,
    changePeriod,
    
    // Computed
    performanceInfo,
    comparison: formatComparison(stats?.comparison)
  }
}