'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bell } from 'lucide-react'

interface AlertSummary {
  total: number
  high: number
}

export default function AlertBadge() {
  const router = useRouter()
  const [summary, setSummary] = useState<AlertSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 🔥 PRIORIDAD BAJA: Esperar 2 segundos antes de cargar alertas
    // Esto da prioridad a productos y clientes en el POS
    const timer = setTimeout(() => {
      console.log('🔔 Cargando alertas (prioridad baja)...')
      loadAlerts()
    }, 2000)
    
    // Recargar cada 5 minutos después de la carga inicial
    const interval = setInterval(loadAlerts, 5 * 60 * 1000)
    
    return () => {
      clearTimeout(timer)
      clearInterval(interval)
    }
  }, [])

  const loadAlerts = async () => {
    try {
      const response = await fetch('/api/alerts/summary')
      
      if (response.ok) {
        const data = await response.json()
        setSummary({
          total: data.total,
          high: data.high
        })
      }
    } catch (error) {
      console.error('Error cargando alertas:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClick = () => {
    router.push('/alertas')
  }

  if (loading) {
    return (
      <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
        <Bell className="h-5 w-5 text-gray-400" />
      </button>
    )
  }

  const hasAlerts = summary && summary.total > 0
  const hasHighPriority = summary && summary.high > 0

  return (
    <button
      onClick={handleClick}
      className={`relative p-2 rounded-lg transition-colors ${
        hasHighPriority 
          ? 'hover:bg-red-50 text-red-600' 
          : hasAlerts
          ? 'hover:bg-yellow-50 text-yellow-600'
          : 'hover:bg-gray-100 text-gray-600'
      }`}
      title={`${summary?.total || 0} alerta(s) - Click para ver`}
    >
      <Bell className={`h-5 w-5 ${hasHighPriority ? 'animate-pulse' : ''}`} />
      
      {/* Badge con número */}
      {hasAlerts && (
        <span className={`absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] text-xs font-bold text-white rounded-full px-1 ${
          hasHighPriority ? 'bg-red-600 animate-pulse' : 'bg-yellow-600'
        }`}>
          {summary.total > 99 ? '99+' : summary.total}
        </span>
      )}
    </button>
  )
}
