'use client'

import { useSession } from 'next-auth/react'
import { useDashboard } from '@/hooks/useDashboardOptimized'
import { useDeliveryStats } from '@/hooks/useDeliveryStats'
import MainLayout from '@/components/layout/MainLayout'
import { StatCard } from '@/components/ui/stat-card'
import { Button } from '@/components/ui/button'
import { RoleBasedContent, RolePermissionsInfo } from '@/components/dashboard/RoleBasedContent'
import PeriodSelector from '@/components/dashboard/PeriodSelector'
import { 
  DashboardErrorBoundary, 
  ComponentErrorBoundary
} from '@/components/error/SpecializedErrorBoundaries'
import { useErrorHandler } from '@/hooks/useErrorHandling'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { memo, useMemo, useCallback } from 'react'
import {
  CurrencyDollarIcon,
  CubeIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ShoppingCartIcon,
  ChartBarIcon,
  ArrowPathIcon,
  UsersIcon,
  BellIcon,
  ArrowTrendingUpIcon as TrendingUpIcon,
  ArrowTrendingDownIcon as TrendingDownIcon
} from '@heroicons/react/24/outline'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ChartAreaIcon, CurrencyIcon, GitGraph, GitGraphIcon, GrapeIcon } from 'lucide-react'

// 🎯 Header optimizado con selector de períodos
const DashboardHeader = memo(({ session, userRole, onRefresh, loading, performanceInfo, selectedPeriod, onPeriodChange }: { 
  session: any, 
  userRole: string,
  onRefresh: () => void,
  loading: boolean,
  performanceInfo: any,
  selectedPeriod: any,
  onPeriodChange: (period: any) => void
}) => (
  <div className="p-6 space-y-6 pt-14">
    <div className="md:flex md:items-center md:justify-between">
      <ChartAreaIcon className="h-8 w-8 text-blue-600" />
      <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-gray-900">
          Dashboard Ejecutivo
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Bienvenido, {session?.user?.name || session?.user?.email} ({userRole})
          {performanceInfo?.filteredByUser && (
            <Badge className="ml-2" variant="outline">Datos personalizados</Badge>
          )}
        </p>
      </div>
      <div className="mt-4 flex md:mt-0 md:ml-4 space-x-2">
        <Button
          onClick={onRefresh}
          disabled={loading}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Cargando...' : 'Actualizar'}
        </Button>
        <Badge variant={performanceInfo?.dataSource === 'cache' ? 'secondary' : 'success'}>
          {performanceInfo?.dataSource === 'cache' ? '📈 Cache' : '🔄 En vivo'} 
          {performanceInfo?.loadTime ? ` (${performanceInfo.loadTime}ms)` : ''}
        </Badge>
      </div>
    </div>
    
    {/* Selector de períodos */}
    <div className="border-t pt-4">
      <ComponentErrorBoundary componentName="PeriodSelector">
        <PeriodSelector
          selectedPeriod={selectedPeriod}
          onPeriodChange={onPeriodChange}
          loading={loading}
        />
      </ComponentErrorBoundary>
    </div>
  </div>
))

DashboardHeader.displayName = 'DashboardHeader'

// 🎯 Componente de métricas principales con comparación
const MainMetricsSection = memo(({ stats, loading, comparison }: { 
  stats: any,
  loading: boolean,
  comparison: any
}) => {
  const mainMetrics = useMemo(() => {
    if (!stats) return []
    
    return [
      {
        title: "Ventas del Período",
        value: stats.totalSales > 0 ? `$${stats.totalSales.toLocaleString()}` : '$0',
        icon: <CurrencyDollarIcon className="h-5 w-5" />,
        subtitle: `${stats.periodLabel || 'Período actual'}`,
        comparison: comparison,
        color: "blue"
      },
      {
        title: "Clientes",
        value: stats.totalCustomers?.toLocaleString() || '0',
        icon: <UsersIcon className="h-5 w-5" />,
        subtitle: `${stats.customersWithDebt || 0} con crédito`,
        color: "green"
      },
      {
        title: "Productos",
        value: stats.totalProducts?.toLocaleString() || '0',
        icon: <CubeIcon className="h-5 w-5" />,
        subtitle: "En inventario",
        color: "blue"
      },
      {
        title: "Stock Bajo",
        value: stats.lowStockAlerts?.toLocaleString() || '0',
        icon: <BellIcon className="h-5 w-5" />,
        subtitle: "Requieren atención",
        color: stats.lowStockAlerts > 0 ? "red" : "green"
      }
    ]
  }, [stats, comparison])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array(4).fill(0).map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {mainMetrics.map((metric, index) => (
        <ComponentErrorBoundary key={`metric-${index}`} componentName={`MainMetric-${index}`}>
          <Card className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  {metric.icon}
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {metric.title}
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {metric.value}
                    </dd>
                    <dd className="text-xs text-gray-500">
                      {metric.subtitle}
                    </dd>
                  </dl>
                </div>
              </div>
              
              {/* Mostrar comparación solo en la primera métrica */}
              {index === 0 && metric.comparison && metric.comparison.isSignificant && (
                <div className={`mt-3 flex items-center text-xs ${metric.comparison.color}`}>
                  {metric.comparison.isPositive ? (
                    <TrendingUpIcon className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDownIcon className="h-3 w-3 mr-1" />
                  )}
                  <span>{metric.comparison.formattedChange}</span>
                  <span className="ml-1">({metric.comparison.formattedPercent})</span>
                  <span className="ml-1 text-gray-500">vs período anterior</span>
                </div>
              )}
            </CardContent>
          </Card>
        </ComponentErrorBoundary>
      ))}
    </div>
  )
})

MainMetricsSection.displayName = 'MainMetricsSection'

// 🎯 Lista de ventas recientes
const RecentSalesList = memo(({ sales, loading, periodLabel }: { sales: any[], loading: boolean, periodLabel?: string }) => {
  const formatDate = useCallback((date: string) => {
    try {
      return format(new Date(date), 'dd/MM HH:mm')
    } catch {
      return 'Fecha inválida'
    }
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        {Array(3).fill(0).map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
              <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
            </div>
            <div className="h-6 bg-gray-200 rounded animate-pulse w-16" />
          </div>
        ))}
      </div>
    )
  }

  if (!sales || sales.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <ShoppingCartIcon className="h-12 w-12 mx-auto mb-2 opacity-30" />
        <p>No hay ventas recientes</p>
        <p className="text-sm text-gray-400">Las ventas aparecerán aquí cuando se registren</p>
        {periodLabel && (
          <p className="text-xs text-blue-600 mt-2">Período: {periodLabel}</p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4 max-h-96 overflow-y-auto">
      {sales.map((sale, index) => (
        <ComponentErrorBoundary key={sale.id || index} componentName={`SaleItem-${index}`}>
          <div className="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                <span className="text-sm font-medium text-indigo-700">
                  {sale.customer ? sale.customer[0].toUpperCase() : 'C'}
                </span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {sale.customer || 'Cliente General'}
              </p>
              <p className="text-sm text-gray-500">
                {sale.folio || 'Sin folio'} • {formatDate(sale.date)}
              </p>
              <p className="text-xs text-gray-400">
                {sale.paymentMethod || 'Efectivo'}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-900">
                ${sale.amount?.toLocaleString() || '0'}
              </span>
              <Badge variant={sale.status === 'completed' ? 'success' : sale.status === 'pending' ? 'warning' : 'error'}>
                {sale.status === 'completed' ? 'Completada' : sale.status === 'pending' ? 'Pendiente' : 'Cancelada'}
              </Badge>
            </div>
          </div>
        </ComponentErrorBoundary>
      ))}
    </div>
  )
})

RecentSalesList.displayName = 'RecentSalesList'

// 🎯 Componente principal
export default function DashboardPage() {
  const { data: session } = useSession()
  const { stats, salesChart, loading, error, refetch, performanceInfo, selectedPeriod, changePeriod, comparison } = useDashboard()
  const { stats: deliveryStats, loading: loadingDelivery } = useDeliveryStats()
  
  const userRole = useMemo(() => session?.user?.role || 'SOLO_LECTURA', [session?.user?.role])

  // Debug info en consola
  console.log('🎯 Dashboard Debug:', {
    hasStats: !!stats,
    hasSalesChart: !!salesChart,
    salesChartLength: salesChart?.length,
    hasDeliveryStats: !!deliveryStats,
    loading,
    error,
    userRole,
    performanceInfo,
    selectedPeriod,
    periodLabel: stats?.periodLabel,
    comparison
  })

  if (error) {
    return (
      <MainLayout>
        <DashboardErrorBoundary>
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-red-500">
                <ExclamationTriangleIcon className="h-16 w-16 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Error al cargar el dashboard</h3>
                <p className="mb-4 text-gray-600">{error}</p>
                <Button onClick={refetch} variant="outline">
                  Reintentar
                </Button>
              </div>
            </CardContent>
          </Card>
        </DashboardErrorBoundary>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <DashboardErrorBoundary>
        <div className="space-y-6">
          {/* Header con selector de períodos */}
          <ComponentErrorBoundary componentName="DashboardHeader">
            <DashboardHeader 
              session={session} 
              userRole={userRole} 
              onRefresh={refetch}
              loading={loading}
              performanceInfo={performanceInfo}
              selectedPeriod={selectedPeriod}
              onPeriodChange={changePeriod}
            />
          </ComponentErrorBoundary>

          {/* Main metrics con comparación */}
          <ComponentErrorBoundary componentName="MainMetrics">
            <MainMetricsSection 
              stats={stats}
              loading={loading}
              comparison={comparison}
            />
          </ComponentErrorBoundary>

          {/* Role Information */}
          <ComponentErrorBoundary componentName="RoleInfo">
            <RolePermissionsInfo />
          </ComponentErrorBoundary>

          {/* Charts Row */}
          <ComponentErrorBoundary componentName="ChartsSection">
            <RoleBasedContent
              allowedRoles={['ADMIN', 'VENDEDOR']}
              fallback={
                <Card>
                  <CardContent className="py-8">
                    <div className="text-center text-gray-500">
                      <ChartBarIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-medium mb-2">Gráficas Restringidas</h3>
                      <p>Las gráficas detalladas están disponibles solo para administradores y vendedores</p>
                    </div>
                  </CardContent>
                </Card>
              }
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sales Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ArrowTrendingUpIcon className="h-5 w-5" />
                      Tendencia de Ventas (7 días)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ComponentErrorBoundary componentName="SalesChart">
                      {loading ? (
                        <div className="h-80 bg-gray-50 rounded flex items-center justify-center">
                          <div className="text-center">
                            <ArrowPathIcon className="h-8 w-8 mx-auto mb-2 animate-spin text-blue-500" />
                            <p className="text-gray-500">Cargando gráfica...</p>
                          </div>
                        </div>
                      ) : salesChart && salesChart.length > 0 ? (
                        <ResponsiveContainer width="100%" height={320}>
                          <LineChart
                            data={salesChart}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                            <XAxis 
                              dataKey="date" 
                              stroke="#666"
                              style={{ fontSize: '12px' }}
                            />
                            <YAxis 
                              stroke="#666"
                              style={{ fontSize: '12px' }}
                              tickFormatter={(value) => `${value.toLocaleString()}`}
                            />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'white', 
                                border: '1px solid #e0e0e0',
                                borderRadius: '8px',
                                padding: '12px'
                              }}
                              formatter={(value: any) => [`${value.toLocaleString()}`, 'Ventas']}
                              labelFormatter={(label) => `Fecha: ${label}`}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="ventas" 
                              stroke="#3b82f6" 
                              strokeWidth={2}
                              dot={{ fill: '#3b82f6', r: 4 }}
                              activeDot={{ r: 6 }}
                              name="Ventas"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-80 bg-gray-50 rounded flex items-center justify-center">
                          <div className="text-center text-gray-500">
                            <ChartBarIcon className="h-16 w-16 mx-auto mb-2 opacity-30" />
                            <p>No hay datos de ventas para el período</p>
                            <p className="text-sm text-gray-400">
                              Período: {stats?.periodLabel || 'No seleccionado'}
                            </p>
                          </div>
                        </div>
                      )}
                    </ComponentErrorBoundary>
                  </CardContent>
                </Card>

                {/* Recent Sales Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingCartIcon className="h-5 w-5" />
                      Ventas Recientes del Período
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ComponentErrorBoundary componentName="RecentSales">
                      <RecentSalesList 
                        sales={stats?.recentSales || []} 
                        loading={loading}
                        periodLabel={stats?.periodLabel}
                      />
                    </ComponentErrorBoundary>
                  </CardContent>
                </Card>
              </div>
            </RoleBasedContent>
          </ComponentErrorBoundary>

          {/* Debug info - Only in development */}
          {/*process.env.NODE_ENV === 'development' && (
            <ComponentErrorBoundary componentName="DebugInfo">
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="text-blue-800">Información de Debug</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <p><strong>Período seleccionado:</strong> {selectedPeriod} ({stats?.periodLabel})</p>
                    <p><strong>Tiempo de carga:</strong> {performanceInfo?.loadTime || 0}ms</p>
                    <p><strong>Fuente de datos:</strong> {performanceInfo?.dataSource || 'unknown'}</p>
                    <p><strong>Datos filtrados por usuario:</strong> {performanceInfo?.filteredByUser ? 'Sí' : 'No'}</p>
                    <p><strong>Rol de usuario:</strong> {userRole}</p>
                    <p><strong>Total de ventas del período:</strong> ${stats?.totalSales?.toLocaleString() || '0'}</p>
                    <p><strong>Total de productos:</strong> {stats?.totalProducts || 0}</p>
                    <p><strong>Ventas recientes del período:</strong> {stats?.recentSales?.length || 0}</p>
                    <p><strong>Datos de gráfico:</strong> {salesChart?.length || 0} días</p>
                    <p><strong>Delivery stats día:</strong> ${deliveryStats?.day?.totalVentas || 0}</p>
                    <p><strong>Delivery stats mes:</strong> ${deliveryStats?.month?.totalVentas || 0}</p>
                    {comparison && (
                      <div className="mt-2 p-2 bg-white rounded">
                        <p><strong>Comparación:</strong></p>
                        <p>Período actual: ${comparison.currentAmount?.toLocaleString()}</p>
                        <p>Período anterior: ${comparison.previousAmount?.toLocaleString()}</p>
                        <p>Cambio: {comparison.formattedChange} ({comparison.formattedPercent})</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </ComponentErrorBoundary>
          )*/}
        </div>
      </DashboardErrorBoundary>
    </MainLayout>
  )
}