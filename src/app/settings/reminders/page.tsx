'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import MainLayout from '@/components/layout/MainLayout'
import RouteProtector from '@/components/layout/RouteProtector'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Bell, 
  CheckCircle, 
  Info,
  Loader2,
  Save,
  Play,
  AlertCircle,
  Mail,
  Calendar,
  Clock
} from 'lucide-react'
import { useNotifications } from '@/components/ui/NotificationProvider'

interface ReminderConfig {
  enabled: boolean
  daysBefore: number
  daysAfter: number[]
  time: string
}

interface ReminderStats {
  last30Days: {
    totalSent: number
    remindersSent: number
    overdueNoticesSent: number
    failedCount: number
  }
}

export default function RemindersSettingsPage() {
  const { data: session } = useSession()
  const { showSuccess, showError } = useNotifications()

  const [config, setConfig] = useState<ReminderConfig>({
    enabled: false,
    daysBefore: 7,
    daysAfter: [1, 3, 7],
    time: '09:00'
  })

  const [stats, setStats] = useState<ReminderStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    loadConfig()
    loadStats()
  }, [])

  const loadConfig = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/settings/reminders')
      
      if (response.ok) {
        const data = await response.json()
        setConfig(data)
      }
    } catch (error) {
      console.error('Error cargando configuración:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const response = await fetch('/api/settings/reminders/stats')
      
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error)
    }
  }

  const handleSave = async () => {
    setSaving(true)

    try {
      const response = await fetch('/api/settings/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })

      if (response.ok) {
        showSuccess('Guardado', 'Configuración de recordatorios actualizada')
      } else {
        const data = await response.json()
        showError('Error', data.error || 'No se pudo guardar')
      }
    } catch (error) {
      showError('Error', 'No se pudo guardar la configuración')
    } finally {
      setSaving(false)
    }
  }

  const handleRunNow = async () => {
    setRunning(true)

    try {
      const response = await fetch('/api/cron/run', {
        method: 'POST'
      })

      const data = await response.json()

      if (data.success) {
        const totalSent = data.results.reduce((sum: number, r: any) => sum + r.successCount, 0)
        showSuccess('Completado', `Se enviaron ${totalSent} recordatorio(s)`)
        loadStats() // Recargar estadísticas
      } else {
        showError('Error', data.error || 'Error ejecutando recordatorios')
      }
    } catch (error) {
      showError('Error', 'No se pudieron enviar los recordatorios')
    } finally {
      setRunning(false)
    }
  }

  const handleDaysAfterChange = (day: number, checked: boolean) => {
    if (checked) {
      setConfig(prev => ({
        ...prev,
        daysAfter: [...prev.daysAfter, day].sort((a, b) => a - b)
      }))
    } else {
      setConfig(prev => ({
        ...prev,
        daysAfter: prev.daysAfter.filter(d => d !== day)
      }))
    }
  }

  if (loading) {
    return (
      <RouteProtector allowedRoles={['ADMIN']}>
        <MainLayout>
          <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        </MainLayout>
      </RouteProtector>
    )
  }

  return (
    <RouteProtector allowedRoles={['ADMIN']}>
      <MainLayout>
        <div className="p-6 max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Recordatorios Automáticos</h1>
            <p className="text-gray-600 mt-2">
              Configura recordatorios de pago automáticos para tus clientes
            </p>
          </div>

          {/* Estado actual */}
          {config.enabled ? (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <div className="flex-1">
                    <p className="font-semibold text-green-900">Recordatorios activados</p>
                    <p className="text-sm text-green-700">
                      Se envían automáticamente todos los días a las {config.time}
                    </p>
                  </div>
                  <Button
                    onClick={handleRunNow}
                    disabled={running}
                    variant="outline"
                    size="sm"
                    className="bg-white hover:bg-gray-50"
                  >
                    {running ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Enviar Ahora
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-6 w-6 text-yellow-600" />
                  <div>
                    <p className="font-semibold text-yellow-900">Recordatorios desactivados</p>
                    <p className="text-sm text-yellow-700">
                      Activa los recordatorios para enviar notificaciones automáticas
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Estadísticas */}
          {stats && (
            <Card>
              <CardHeader>
                <CardTitle>Estadísticas (Últimos 30 días)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <Mail className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-blue-900">{stats.last30Days.totalSent}</p>
                    <p className="text-sm text-blue-700">Total enviados</p>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <Bell className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-yellow-900">{stats.last30Days.remindersSent}</p>
                    <p className="text-sm text-yellow-700">Recordatorios</p>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-red-900">{stats.last30Days.overdueNoticesSent}</p>
                    <p className="text-sm text-red-700">Pagos vencidos</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <Clock className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">{stats.last30Days.failedCount}</p>
                    <p className="text-sm text-gray-700">Errores</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Configuración */}
          <Card>
            <CardHeader>
              <CardTitle>Configuración</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Activar/Desactivar */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="font-medium text-gray-900">Activar recordatorios automáticos</p>
                    <p className="text-sm text-gray-600">
                      Los recordatorios se enviarán diariamente
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.enabled}
                    onChange={(e) => setConfig(prev => ({ ...prev, enabled: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {config.enabled && (
                <>
                  {/* Días antes de vencimiento */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="h-4 w-4 inline mr-2" />
                      Recordatorio antes del vencimiento
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={config.daysBefore}
                        onChange={(e) => setConfig(prev => ({ ...prev, daysBefore: parseInt(e.target.value) }))}
                        className="w-20 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <span className="text-gray-700">días antes del vencimiento</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Ej: Si es 7, se enviará recordatorio 7 días antes de la fecha de vencimiento
                    </p>
                  </div>

                  {/* Días después de vencido */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      <AlertCircle className="h-4 w-4 inline mr-2" />
                      Recordatorios después de vencido
                    </label>
                    <div className="space-y-2">
                      {[1, 3, 7, 15, 30].map(day => (
                        <label key={day} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                          <input
                            type="checkbox"
                            checked={config.daysAfter.includes(day)}
                            onChange={(e) => handleDaysAfterChange(day, e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="text-gray-700">{day} día{day > 1 ? 's' : ''} después de vencido</span>
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Se enviará un recordatorio en cada uno de los días seleccionados
                    </p>
                  </div>

                  {/* Hora de envío */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Clock className="h-4 w-4 inline mr-2" />
                      Hora de envío
                    </label>
                    <input
                      type="time"
                      value={config.time}
                      onChange={(e) => setConfig(prev => ({ ...prev, time: e.target.value }))}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Hora del día en que se enviarán los recordatorios (horario de México)
                    </p>
                  </div>
                </>
              )}

              {/* Info adicional */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800 space-y-1">
                    <p className="font-medium">¿Cómo funcionan los recordatorios?</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Se envían automáticamente todos los días a la hora configurada</li>
                      <li>Solo se envían a clientes con email registrado</li>
                      <li>No se envía más de un recordatorio por día por venta</li>
                      <li>Los emails incluyen información de la venta y monto pendiente</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Botón guardar */}
              <div className="flex justify-end pt-4">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Guardar Configuración
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    </RouteProtector>
  )
}
