'use client'

import { useState, useEffect } from 'react'
import MainLayout from '@/components/layout/MainLayout'
import RouteProtector from '@/components/layout/RouteProtector'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Bell,
  AlertTriangle,
  Clock,
  CreditCard,
  Package,
  RefreshCw,
  Filter,
  X,
  ExternalLink,
  CheckCircle
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'
import { useNotifications } from '@/components/ui/NotificationProvider'

interface Alert {
  id: string
  type: 'OVERDUE' | 'DUE_SOON' | 'CREDIT_LIMIT' | 'LOW_STOCK'
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  title: string
  message: string
  entityType: 'SALE' | 'CUSTOMER' | 'PRODUCT'
  entityId: string
  entityName: string
  actionUrl: string
  createdAt: string
  metadata?: any
}

interface AlertSummary {
  total: number
  byType: {
    OVERDUE: number
    DUE_SOON: number
    CREDIT_LIMIT: number
    LOW_STOCK: number
  }
  byPriority: {
    HIGH: number
    MEDIUM: number
    LOW: number
  }
}

const ALERT_TYPE_CONFIG = {
  OVERDUE: {
    icon: AlertTriangle,
    label: 'Pagos Vencidos',
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    badge: 'bg-red-100 text-red-800'
  },
  DUE_SOON: {
    icon: Clock,
    label: 'Por Vencer',
    color: 'text-yellow-600',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    badge: 'bg-yellow-100 text-yellow-800'
  },
  CREDIT_LIMIT: {
    icon: CreditCard,
    label: 'Límite de Crédito',
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    badge: 'bg-orange-100 text-orange-800'
  },
  LOW_STOCK: {
    icon: Package,
    label: 'Stock Bajo',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    badge: 'bg-blue-100 text-blue-800'
  }
}

const PRIORITY_CONFIG = {
  HIGH: {
    label: 'Alta',
    color: 'bg-red-100 text-red-800',
    border: 'border-l-4 border-l-red-500'
  },
  MEDIUM: {
    label: 'Media',
    color: 'bg-yellow-100 text-yellow-800',
    border: 'border-l-4 border-l-yellow-500'
  },
  LOW: {
    label: 'Baja',
    color: 'bg-blue-100 text-blue-800',
    border: 'border-l-4 border-l-blue-500'
  }
}

export default function AlertasPage() {
  const router = useRouter()
  const { showSuccess, showError } = useNotifications()
  
  const [loading, setLoading] = useState(true)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [summary, setSummary] = useState<AlertSummary | null>(null)
  const [filterType, setFilterType] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')

  useEffect(() => {
    loadAlerts()
    
    // Auto-refresh cada 60 segundos
    const interval = setInterval(loadAlerts, 60000)
    return () => clearInterval(interval)
  }, [filterType, filterPriority])

  const loadAlerts = async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams()
      if (filterType !== 'all') params.append('type', filterType)
      if (filterPriority !== 'all') params.append('priority', filterPriority)
      
      const response = await fetch(`/api/alerts?${params}`)
      const data = await response.json()
      
      if (response.ok) {
        setAlerts(data.alerts)
        setSummary(data.summary)
      } else {
        throw new Error(data.error || 'Error cargando alertas')
      }
    } catch (error) {
      console.error('Error cargando alertas:', error)
      showError('Error', 'No se pudieron cargar las alertas')
    } finally {
      setLoading(false)
    }
  }

  const handleAlertAction = (alert: Alert) => {
    router.push(alert.actionUrl)
  }

  const clearFilters = () => {
    setFilterType('all')
    setFilterPriority('all')
  }

  return (
    <RouteProtector allowedRoles={['ADMIN', 'VENDEDOR']}>
      <MainLayout>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Bell className="h-8 w-8" />
                Centro de Alertas
              </h1>
              <p className="text-gray-500 mt-1">Notificaciones y alertas del sistema</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={loadAlerts}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualizar
              </Button>
            </div>
          </div>

          {/* Resumen de Alertas */}
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Object.entries(ALERT_TYPE_CONFIG).map(([type, config]) => {
                const Icon = config.icon
                const count = summary.byType[type as keyof typeof summary.byType]
                
                return (
                  <Card 
                    key={type}
                    className={`cursor-pointer transition-all hover:shadow-lg ${config.border}`}
                    onClick={() => setFilterType(type)}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">{config.label}</p>
                          <p className={`text-3xl font-bold ${config.color}`}>
                            {count}
                          </p>
                        </div>
                        <Icon className={`h-8 w-8 ${config.color}`} />
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filtros
                </span>
                {(filterType !== 'all' || filterPriority !== 'all') && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-1" />
                    Limpiar
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Filtro por Tipo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Alerta
                  </label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="all">Todas</option>
                    {Object.entries(ALERT_TYPE_CONFIG).map(([type, config]) => (
                      <option key={type} value={type}>{config.label}</option>
                    ))}
                  </select>
                </div>

                {/* Filtro por Prioridad */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prioridad
                  </label>
                  <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="all">Todas</option>
                    {Object.entries(PRIORITY_CONFIG).map(([priority, config]) => (
                      <option key={priority} value={priority}>{config.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Alertas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Alertas Activas ({alerts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
              ) : alerts.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-500">¡No hay alertas pendientes!</p>
                  <p className="text-sm text-gray-400 mt-2">Todo está bajo control</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alerts.map((alert) => {
                    const typeConfig = ALERT_TYPE_CONFIG[alert.type]
                    const priorityConfig = PRIORITY_CONFIG[alert.priority]
                    const Icon = typeConfig.icon

                    return (
                      <div
                        key={alert.id}
                        className={`p-4 border rounded-lg ${priorityConfig.border} hover:shadow-md transition-shadow`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div className={`p-2 rounded-lg ${typeConfig.bg}`}>
                              <Icon className={`h-5 w-5 ${typeConfig.color}`} />
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-gray-900">
                                  {alert.title}
                                </h3>
                                <Badge className={priorityConfig.color}>
                                  {priorityConfig.label}
                                </Badge>
                                <Badge className={typeConfig.badge}>
                                  {typeConfig.label}
                                </Badge>
                              </div>
                              
                              <p className="text-sm text-gray-600 mb-2">
                                {alert.message}
                              </p>

                              {/* Metadata específica según tipo */}
                              {alert.type === 'OVERDUE' && alert.metadata && (
                                <div className="text-xs text-red-600 font-medium">
                                  Vencido hace {alert.metadata.daysOverdue} día{alert.metadata.daysOverdue > 1 ? 's' : ''}
                                </div>
                              )}
                              
                              {alert.type === 'DUE_SOON' && alert.metadata && (
                                <div className="text-xs text-yellow-600 font-medium">
                                  Vence en {alert.metadata.daysUntilDue} día{alert.metadata.daysUntilDue > 1 ? 's' : ''}
                                </div>
                              )}

                              {alert.type === 'CREDIT_LIMIT' && alert.metadata && (
                                <div className="text-xs text-orange-600 font-medium">
                                  Uso: {alert.metadata.usagePercent}% del límite
                                </div>
                              )}

                              {alert.type === 'LOW_STOCK' && alert.metadata && (
                                <div className="text-xs text-blue-600 font-medium">
                                  {alert.metadata.stock} unidades disponibles (mínimo: {alert.metadata.minStock})
                                </div>
                              )}
                            </div>
                          </div>

                          <Button
                            size="sm"
                            onClick={() => handleAlertAction(alert)}
                            className="ml-4"
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Ver
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    </RouteProtector>
  )
}
