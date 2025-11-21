// 🎯 HOOK OPTIMIZADO PARA ESTADÍSTICAS DE DELIVERY/VENTAS
// src/hooks/useDeliveryStats.ts

import { useEffect, useState, useCallback, useRef } from 'react'

export interface DeliveryStats {
  day: {
    totalVentas: number
    totalEnvio: number
    totalProductos: number
  }
  month: {
    totalVentas: number
    totalEnvio: number
    totalProductos: number
  }
}

// 🎯 Datos mock para fallback
const getMockDeliveryStats = (): DeliveryStats => ({
  day: {
    totalVentas: 0,
    totalEnvio: 0,
    totalProductos: 0
  },
  month: {
    totalVentas: 0,
    totalEnvio: 0,
    totalProductos: 0
  }
})

export function useDeliveryStats() {
  const [stats, setStats] = useState<DeliveryStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(true)

  // 🎯 Función para cargar estadísticas de delivery
  const loadDeliveryStats = useCallback(async () => {
    console.log('📦 Loading delivery stats...')
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/sales/stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      })

      if (!response.ok) {
        throw new Error(`Delivery stats API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log('✅ Delivery stats loaded:', data)

      // Validar estructura de datos
      const validatedStats: DeliveryStats = {
        day: {
          totalVentas: Number(data.day?.totalVentas || 0),
          totalEnvio: Number(data.day?.totalEnvio || 0),
          totalProductos: Number(data.day?.totalProductos || 0)
        },
        month: {
          totalVentas: Number(data.month?.totalVentas || 0),
          totalEnvio: Number(data.month?.totalEnvio || 0),
          totalProductos: Number(data.month?.totalProductos || 0)
        }
      }

      if (mountedRef.current) {
        setStats(validatedStats)
        setLoading(false)
        setError(null)
      }

    } catch (error) {
      console.error('❌ Error loading delivery stats:', error)
      
      // Fallback a datos mock
      const mockStats = getMockDeliveryStats()
      
      if (mountedRef.current) {
        setStats(mockStats)
        setLoading(false)
        setError(error instanceof Error ? error.message : 'Error desconocido')
      }
    }
  }, [])

  // 🎯 Efecto principal
  useEffect(() => {
    mountedRef.current = true
    loadDeliveryStats()

    return () => {
      mountedRef.current = false
    }
  }, [loadDeliveryStats])

  // 🎯 Función de refresco
  const refetch = useCallback(() => {
    console.log('🔄 Refreshing delivery stats...')
    loadDeliveryStats()
  }, [loadDeliveryStats])

  return { 
    stats, 
    loading, 
    error,
    refetch
  }
}