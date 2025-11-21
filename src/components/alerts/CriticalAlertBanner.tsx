'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, X, ChevronRight } from 'lucide-react'

interface CriticalAlert {
  id: string
  title: string
  description: string
  link: string
}

export default function CriticalAlertBanner() {
  const router = useRouter()
  const [alerts, setAlerts] = useState<CriticalAlert[]>([])
  const [dismissed, setDismissed] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCriticalAlerts()
    
    // Recargar cada 10 minutos
    const interval = setInterval(loadCriticalAlerts, 10 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [])

  const loadCriticalAlerts = async () => {
    try {
      const response = await fetch('/api/alerts/summary')
      
      if (response.ok) {
        const data = await response.json()
        
        // Solo alertas de alta prioridad
        const critical = data.alerts
          .filter((a: any) => a.priority === 'HIGH')
          .slice(0, 3) // Máximo 3
        
        setAlerts(critical)
      }
    } catch (error) {
      console.error('Error cargando alertas críticas:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDismiss = (alertId: string) => {
    setDismissed(prev => [...prev, alertId])
    
    // Guardar en localStorage para no mostrar de nuevo en esta sesión
    const dismissed = JSON.parse(localStorage.getItem('dismissedAlerts') || '[]')
    dismissed.push(alertId)
    localStorage.setItem('dismissedAlerts', JSON.stringify(dismissed))
  }

  const handleClick = (alert: CriticalAlert) => {
    router.push(alert.link)
  }

  // Filtrar alertas no descartadas
  const visibleAlerts = alerts.filter(alert => !dismissed.includes(alert.id))

  if (loading || visibleAlerts.length === 0) {
    return null
  }

  return (
    <div className="bg-red-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto">
        {visibleAlerts.map(alert => (
          <div
            key={alert.id}
            className="flex items-center justify-between p-3 border-b border-red-700 last:border-0"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 animate-pulse" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{alert.title}</p>
                <p className="text-xs text-red-100 truncate">{alert.description}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 ml-3">
              <button
                onClick={() => handleClick(alert)}
                className="px-3 py-1.5 bg-white text-red-600 text-xs font-medium rounded hover:bg-red-50 transition-colors whitespace-nowrap"
              >
                Ver detalles
                <ChevronRight className="h-3 w-3 inline ml-1" />
              </button>
              
              <button
                onClick={() => handleDismiss(alert.id)}
                className="p-1 hover:bg-red-700 rounded transition-colors"
                title="Descartar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
