'use client'

import { useState, useEffect } from 'react'

export function useAlertCount() {
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchAlertCount = async () => {
    try {
      const response = await fetch('/api/alerts')
      if (response.ok) {
        const data = await response.json()
        // Solo contar alertas de alta y media prioridad
        const criticalCount = data.summary.byPriority.HIGH + data.summary.byPriority.MEDIUM
        setCount(criticalCount)
      }
    } catch (error) {
      console.error('Error fetching alert count:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAlertCount()
    
    // Actualizar cada 60 segundos
    const interval = setInterval(fetchAlertCount, 60000)
    
    return () => clearInterval(interval)
  }, [])

  return { count, loading, refresh: fetchAlertCount }
}
