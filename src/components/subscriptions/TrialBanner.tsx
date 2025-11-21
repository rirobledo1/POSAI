'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, Zap, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface TrialInfo {
  isInTrial: boolean
  daysRemaining: number
  planType: string
  trialEndsAt: string | null
}

export function TrialBanner() {
  const [trialInfo, setTrialInfo] = useState<TrialInfo | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 🔥 PRIORIDAD BAJA: Esperar 3 segundos antes de cargar suscripción
    // Esto da prioridad a productos y clientes en el POS
    const timer = setTimeout(() => {
      console.log('📋 Cargando información de suscripción (prioridad baja)...')
      loadTrialInfo()
    }, 3000)
    
    // Verificar si ya fue cerrado en esta sesión
    const wasDismissed = sessionStorage.getItem('trial-banner-dismissed')
    if (wasDismissed === 'true') {
      setDismissed(true)
    }
    
    return () => clearTimeout(timer)
  }, [])

  const loadTrialInfo = async () => {
    try {
      const response = await fetch('/api/subscriptions/status')
      if (!response.ok) throw new Error('Error al cargar estado')
      
      const data = await response.json()
      setTrialInfo(data)
    } catch (error) {
      console.error('Error loading trial info:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDismiss = () => {
    setDismissed(true)
    sessionStorage.setItem('trial-banner-dismissed', 'true')
  }

  // No mostrar si está cargando o fue cerrado
  if (loading || dismissed || !trialInfo) return null

  // No mostrar si no está en trial o ya no es plan FREE
  if (!trialInfo.isInTrial || trialInfo.planType !== 'FREE') return null

  const { daysRemaining } = trialInfo

  // Determinar estilo según días restantes
  const isUrgent = daysRemaining <= 7
  const isWarning = daysRemaining <= 14 && daysRemaining > 7

  return (
    <div
      className={`relative ${
        isUrgent
          ? 'bg-red-50 border-red-200'
          : isWarning
          ? 'bg-orange-50 border-orange-200'
          : 'bg-blue-50 border-blue-200'
      } border-b`}
    >
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            {isUrgent ? (
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
            ) : (
              <Zap className="h-5 w-5 text-blue-600 flex-shrink-0" />
            )}
            
            <div className="flex-1">
              <p className={`text-sm font-medium ${
                isUrgent
                  ? 'text-red-900'
                  : isWarning
                  ? 'text-orange-900'
                  : 'text-blue-900'
              }`}>
                {isUrgent ? (
                  <>
                    ⚠️ <strong>¡Quedan {daysRemaining} días de prueba!</strong> Tu plan FREE expirará pronto.
                  </>
                ) : (
                  <>
                    🎉 <strong>Plan FREE</strong> - Te quedan {daysRemaining} días de prueba gratis
                  </>
                )}
              </p>
              <p className={`text-xs mt-0.5 ${
                isUrgent
                  ? 'text-red-700'
                  : isWarning
                  ? 'text-orange-700'
                  : 'text-blue-700'
              }`}>
                Actualiza a PRO para obtener más sucursales, usuarios y funciones avanzadas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/settings/subscription">
              <Button
                size="sm"
                className={
                  isUrgent
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }
              >
                Actualizar Plan
              </Button>
            </Link>
            
            <button
              onClick={handleDismiss}
              className={`p-1 rounded hover:bg-opacity-20 ${
                isUrgent
                  ? 'hover:bg-red-200'
                  : 'hover:bg-blue-200'
              }`}
            >
              <X className={`h-4 w-4 ${
                isUrgent ? 'text-red-600' : 'text-blue-600'
              }`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
