// 🚀 DEMO DEL DASHBOARD OPTIMIZADO - SIN AUTENTICACIÓN
// src/app/demo-dashboard/page.tsx

'use client'

import { useDashboard } from '@/hooks/useDashboardOptimized'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCw, Clock, Database, Zap } from 'lucide-react'

export default function DemoDashboard() {
  const { stats, salesChart, inventoryChart, loading, error, refetch } = useDashboard()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header con métricas de performance */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              🚀 Dashboard Optimizado - Demo
            </h1>
            <p className="text-gray-600 mt-1">
              Prueba del rendimiento con caché inteligente
            </p>
          </div>
          <Button onClick={refetch} disabled={loading} className="flex items-center gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refrescar
          </Button>
        </div>

        {/* Métricas de Performance */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4 bg-green-50 border-green-200">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-green-600 font-medium">Tiempo de Carga</p>
                  <p className="text-xl font-bold text-green-800">
                    {stats.performanceMs ? `${Math.round(stats.performanceMs)}ms` : '---'}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-blue-50 border-blue-200">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-blue-600 font-medium">Consultas DB</p>
                  <p className="text-xl font-bold text-blue-800">
                    {stats.queryCount || '---'}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-purple-50 border-purple-200">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm text-purple-600 font-medium">Desde Caché</p>
                  <p className="text-xl font-bold text-purple-800">
                    {stats.cached ? '✅ Sí' : '❌ No'}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-orange-50 border-orange-200">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="text-sm text-orange-600 font-medium">Estado</p>
                  <p className="text-xl font-bold text-orange-800">
                    {loading ? '⏳ Cargando...' : error ? '❌ Error' : '✅ OK'}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Stats principales */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-6 bg-white">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-600">Ventas Totales</h3>
                <p className="text-3xl font-bold text-blue-600">{stats.totalSales}</p>
              </div>
            </Card>

            <Card className="p-6 bg-white">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-600">Productos</h3>
                <p className="text-3xl font-bold text-green-600">{stats.totalProducts}</p>
              </div>
            </Card>

            <Card className="p-6 bg-white">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-600">Clientes</h3>
                <p className="text-3xl font-bold text-purple-600">{stats.totalCustomers}</p>
              </div>
            </Card>

            <Card className="p-6 bg-white">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-600">Stock Bajo</h3>
                <p className="text-3xl font-bold text-red-600">{stats.lowStockAlerts}</p>
              </div>
            </Card>
          </div>
        )}

        {/* Datos de gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6 bg-white">
            <h3 className="text-lg font-semibold mb-4">📊 Datos de Ventas (7 días)</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {salesChart.map((day, i) => (
                <div key={i} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">{day.date}</span>
                  <div className="flex gap-4">
                    <span className="text-sm font-medium text-blue-600">
                      {day.ventas} ventas
                    </span>
                    <span className="text-sm font-medium text-green-600">
                      {day.productos} productos
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 bg-white">
            <h3 className="text-lg font-semibold mb-4">📦 Inventario por Categoría</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {inventoryChart.map((cat, i) => (
                <div key={i} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-sm font-medium text-gray-800">{cat.categoria}</span>
                  <div className="flex gap-4">
                    <span className="text-sm text-blue-600">
                      {cat.total} total
                    </span>
                    <span className={`text-sm font-medium ${
                      cat.bajo_stock > 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {cat.bajo_stock} bajo stock
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Información de optimización */}
        <Card className="p-6 bg-gradient-to-r from-indigo-50 to-blue-50">
          <h3 className="text-lg font-semibold mb-4">🚀 Optimizaciones Implementadas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-indigo-800 mb-2">Backend (Servidor)</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>✅ Caché en memoria (5 minutos)</li>
                <li>✅ Consultas SQL optimizadas (3 vs 7+)</li>
                <li>✅ Endpoint separado para gráficos</li>
                <li>✅ Métricas de performance incluidas</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-indigo-800 mb-2">Frontend (Cliente)</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>✅ localStorage caché (2 minutos)</li>
                <li>✅ Lazy loading de gráficos</li>
                <li>✅ AbortController para cancelar requests</li>
                <li>✅ Fallback a datos mock si falla</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Error state */}
        {error && (
          <Card className="p-6 bg-red-50 border-red-200">
            <div className="flex items-center gap-2 text-red-700">
              <span className="text-xl">⚠️</span>
              <div>
                <h3 className="font-semibold">Error de conexión</h3>
                <p className="text-sm">{error}</p>
                <p className="text-xs mt-1">
                  Se están mostrando datos de fallback. La aplicación sigue funcionando.
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
