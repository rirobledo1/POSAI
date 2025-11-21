// 🎯 COMPONENTE DE MONITOREO DE ERRORES PARA ADMIN
// src/components/admin/ErrorMonitoringDashboard.tsx

'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ComponentErrorBoundary } from '@/components/error/SpecializedErrorBoundaries'
import { useErrorHandler, useApiErrorHandler } from '@/hooks/useErrorHandling'
import {
  ExclamationTriangleIcon,
  ChartBarIcon,
  ClockIcon,
  UserIcon,
  ArrowPathIcon,
  TrashIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface ErrorStats {
  total: number
  timeRange: string
  bySeverity: { severity: string, count: number }[]
  byCategory: { category: string, count: number }[]
  recent: {
    id: string
    message: string
    severity: string
    category: string
    url: string
    timestamp: string
    recoverable: boolean
    user: string
  }[]
}

interface ErrorMonitoringProps {
  className?: string
}

// 🎯 Colores para gráficos
const SEVERITY_COLORS = {
  critical: '#DC2626', // red-600
  high: '#EA580C',     // orange-600
  medium: '#D97706',   // amber-600
  low: '#65A30D'       // lime-600
}

const CATEGORY_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']

export function ErrorMonitoringDashboard({ className = '' }: ErrorMonitoringProps) {
  const [stats, setStats] = useState<ErrorStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'1' | '24' | '168'>('24') // 1h, 24h, 7 days
  const [selectedSeverity, setSelectedSeverity] = useState<string>('')
  const [expandedError, setExpandedError] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(false)
  
  const { reportError } = useErrorHandler()
  const { handleApiCall } = useApiErrorHandler()

  // 🎯 Cargar estadísticas de errores
  const loadErrorStats = async () => {
    const url = `/api/errors/report?hours=${timeRange}${selectedSeverity ? `&severity=${selectedSeverity}` : ''}`
    
    try {
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.success) {
        setStats(data.stats)
      } else {
        reportError(new Error(data.error || 'Error loading stats'), 'network', 'medium')
      }
    } catch (error) {
      reportError(error instanceof Error ? error : new Error('Network error'), 'network', 'medium')
    }
  }

  // 🎯 Efecto para cargar datos iniciales
  useEffect(() => {
    setLoading(true)
    loadErrorStats().finally(() => setLoading(false))
  }, [timeRange, selectedSeverity])

  // 🎯 Auto-refresh cada 30 segundos si está habilitado
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      loadErrorStats()
    }, 30000)

    return () => clearInterval(interval)
  }, [autoRefresh, timeRange, selectedSeverity])

  // 🎯 Datos procesados para gráficos
  const chartData = useMemo(() => {
    if (!stats) return { severityData: [], categoryData: [] }

    return {
      severityData: stats.bySeverity.map(item => ({
        name: item.severity.charAt(0).toUpperCase() + item.severity.slice(1),
        value: item.count,
        fill: SEVERITY_COLORS[item.severity as keyof typeof SEVERITY_COLORS] || '#6B7280'
      })),
      categoryData: stats.byCategory.map((item, index) => ({
        name: item.category.charAt(0).toUpperCase() + item.category.slice(1),
        value: item.count,
        fill: CATEGORY_COLORS[index % CATEGORY_COLORS.length]
      }))
    }
  }, [stats])

  // 🎯 Función para obtener el color del badge según severidad
  const getSeverityVariant = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive'
      case 'high': return 'destructive'
      case 'medium': return 'warning'
      case 'low': return 'success'
      default: return 'secondary'
    }
  }

  if (loading && !stats) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array(4).fill(0).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <ComponentErrorBoundary componentName="ErrorMonitoringDashboard">
      <div className={`space-y-6 ${className}`}>
        {/* Header con controles */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Monitoreo de Errores</h2>
            <p className="text-sm text-gray-600">
              Sistema de seguimiento y análisis de errores de la aplicación
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {/* Selector de rango de tiempo */}
            <div className="flex rounded-md shadow-sm" role="group">
              {[
                { value: '1', label: '1h' },
                { value: '24', label: '24h' }, 
                { value: '168', label: '7d' }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTimeRange(option.value as any)}
                  className={`px-3 py-2 text-sm font-medium border ${
                    timeRange === option.value
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  } first:rounded-l-md last:rounded-r-md`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {/* Filtro por severidad */}
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md bg-white"
            >
              <option value="">Todas las severidades</option>
              <option value="critical">Crítico</option>
              <option value="high">Alto</option>
              <option value="medium">Medio</option>
              <option value="low">Bajo</option>
            </select>

            {/* Auto-refresh toggle */}
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-2 text-sm font-medium rounded-md flex items-center gap-2 ${
                autoRefresh 
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <ArrowPathIcon className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
              {autoRefresh ? 'Auto' : 'Manual'}
            </button>

            {/* Refresh manual */}
            <Button
              onClick={() => loadErrorStats()}
              variant="outline"
              size="sm"
              disabled={loading}
            >
              <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Estadísticas generales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total de Errores
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats?.total.toLocaleString() || '0'}
                    </dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClockIcon className="h-8 w-8 text-blue-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Período
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats?.timeRange || 'N/A'}
                    </dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChartBarIcon className="h-8 w-8 text-yellow-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Errores Críticos
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats?.bySeverity.find(s => s.severity === 'critical')?.count || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UserIcon className="h-8 w-8 text-green-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Recuperables
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats?.recent.filter(e => e.recoverable).length || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de errores recientes */}
        <Card>
          <CardHeader>
            <CardTitle>Errores Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {stats?.recent && stats.recent.length > 0 ? (
                stats.recent.map((error, index) => (
                  <ComponentErrorBoundary key={error.id} componentName={`ErrorItem-${index}`}>
                    <div className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={getSeverityVariant(error.severity)}>
                              {error.severity}
                            </Badge>
                            <Badge variant="outline">
                              {error.category}
                            </Badge>
                            {error.recoverable && (
                              <Badge variant="success">
                                Recuperable
                              </Badge>
                            )}
                          </div>
                          
                          <h4 className="text-sm font-medium text-gray-900 mb-1">
                            {error.message}
                          </h4>
                          
                          <div className="text-xs text-gray-500 space-y-1">
                            <p>🌐 URL: {error.url}</p>
                            <p>👤 Usuario: {error.user}</p>
                            <p>⏰ {format(new Date(error.timestamp), 'dd/MM/yyyy HH:mm:ss', { locale: es })}</p>
                          </div>
                        </div>
                        
                        <div className="flex-shrink-0 ml-4">
                          <button
                            onClick={() => setExpandedError(expandedError === error.id ? null : error.id)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <EyeIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                      
                      {expandedError === error.id && (
                        <div className="mt-3 pt-3 border-t">
                          <div className="text-xs space-y-2">
                            <div>
                              <span className="font-medium text-gray-700">ID del Error:</span>
                              <span className="ml-2 font-mono text-gray-600">{error.id}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Timestamp:</span>
                              <span className="ml-2 text-gray-600">{error.timestamp}</span>
                            </div>
                            <div className="flex gap-2 mt-2">
                              <Button
                                onClick={() => navigator.clipboard.writeText(JSON.stringify(error, null, 2))}
                                size="sm"
                                variant="outline"
                              >
                                Copiar JSON
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </ComponentErrorBoundary>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <ExclamationTriangleIcon className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p>No hay errores recientes</p>
                  <p className="text-sm">¡Excelente! El sistema está funcionando sin problemas.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Información del sistema */}
        <Card>
          <CardHeader>
            <CardTitle>Estado del Sistema de Monitoreo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {autoRefresh ? 'ON' : 'OFF'}
                </div>
                <div className="text-sm text-green-700">Auto Refresh</div>
              </div>
              
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {timeRange}h
                </div>
                <div className="text-sm text-blue-700">Ventana de Tiempo</div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {stats?.recent.length || 0}
                </div>
                <div className="text-sm text-purple-700">Errores Mostrados</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ComponentErrorBoundary>
  )
}

export default ErrorMonitoringDashboard