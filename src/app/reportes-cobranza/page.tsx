'use client'

import { useState, useEffect } from 'react'
import MainLayout from '@/components/layout/MainLayout'
import RouteProtector from '@/components/layout/RouteProtector'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  Download,
  RefreshCw,
  BarChart3,
  PieChart,
  Activity,
  ChartAreaIcon
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useNotifications } from '@/components/ui/NotificationProvider'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

interface ReportData {
  period: {
    start: string
    end: string
    months: number
  }
  summary: {
    totalCollected: number
    totalSales: number
    totalDebt: number
    collectionRate: number
    averagePayment: number
    totalPayments: number
    totalCreditSales: number
    customersWithDebt: number
  }
  charts: {
    paymentsByMonth: Array<{
      month: string
      total: number
      count: number
    }>
    salesByMonth: Array<{
      month: string
      total: number
      count: number
    }>
    paymentsByMethod: Array<{
      method: string
      total: number
      count: number
    }>
  }
  rankings: {
    topDebtors: Array<{
      id: string
      name: string
      debt: number
      limit: number
      usagePercent: number
    }>
    topPayers: Array<{
      id: string
      name: string
      total: number
      count: number
    }>
  }
  agingAnalysis: {
    current: { count: number; amount: number }
    days30: { count: number; amount: number }
    days60: { count: number; amount: number }
    days90: { count: number; amount: number }
    overdue: { count: number; amount: number }
  }
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
const METHOD_COLORS: Record<string, string> = {
  'EFECTIVO': '#10b981',
  'TRANSFERENCIA': '#3b82f6',
  'TARJETA': '#8b5cf6',
  'CHEQUE': '#f59e0b'
}

export default function ReportesCobranzaPage() {
  const { showSuccess, showError } = useNotifications()
  
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<ReportData | null>(null)
  const [months, setMonths] = useState(6)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    loadReports()
  }, [])

  const loadReports = async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams()
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      if (!startDate && !endDate) params.append('months', months.toString())
      
      const response = await fetch(`/api/reports/collections?${params}`)
      const result = await response.json()
      
      if (response.ok) {
        setData(result)
      } else {
        throw new Error(result.error || 'Error cargando reportes')
      }
    } catch (error) {
      console.error('Error cargando reportes:', error)
      showError('Error', 'No se pudieron cargar los reportes')
    } finally {
      setLoading(false)
    }
  }

  const exportToExcel = () => {
    showSuccess('Próximamente', 'Exportar a Excel estará disponible pronto')
  }

  // Preparar datos para gráfica de líneas (Cobranza vs Ventas)
  const prepareLineChartData = () => {
    if (!data) return []
    
    const months = new Set([
      ...data.charts.paymentsByMonth.map(p => p.month),
      ...data.charts.salesByMonth.map(s => s.month)
    ])
    
    return Array.from(months).sort().map(month => {
      const payment = data.charts.paymentsByMonth.find(p => p.month === month)
      const sale = data.charts.salesByMonth.find(s => s.month === month)
      
      return {
        month: new Date(month + '-01').toLocaleDateString('es-MX', { month: 'short', year: 'numeric' }),
        cobrado: payment?.total || 0,
        vendido: sale?.total || 0
      }
    })
  }

  // Preparar datos para antigüedad
  const prepareAgingData = () => {
    if (!data) return []
    
    return [
      { range: '0-30 días', amount: data.agingAnalysis.current.amount, count: data.agingAnalysis.current.count },
      { range: '31-60 días', amount: data.agingAnalysis.days30.amount, count: data.agingAnalysis.days30.count },
      { range: '61-90 días', amount: data.agingAnalysis.days60.amount, count: data.agingAnalysis.days60.count },
      { range: '91-120 días', amount: data.agingAnalysis.days90.amount, count: data.agingAnalysis.days90.count },
      { range: '+120 días', amount: data.agingAnalysis.overdue.amount, count: data.agingAnalysis.overdue.count }
    ]
  }

  if (loading) {
    return (
      <RouteProtector allowedRoles={['ADMIN', 'VENDEDOR']}>
        <MainLayout>
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        </MainLayout>
      </RouteProtector>
    )
  }

  return (
    <RouteProtector allowedRoles={['ADMIN', 'VENDEDOR']}>
      <MainLayout>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <ChartAreaIcon className="h-8 w-8 text-blue-600" />
            <div className="flex-1 min-w-0">
              
              <h1 className="text-3xl font-bold text-gray-900">Reportes de Cobranza</h1>
              <p className="text-gray-600 mt-1">Análisis y métricas de cuentas por cobrar</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={loadReports}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualizar
              </Button>
              <Button onClick={exportToExcel}>
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>

          {/* Filtros de Período */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filtros de Período</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Últimos meses
                  </label>
                  <select
                    value={months}
                    onChange={(e) => {
                      setMonths(parseInt(e.target.value))
                      setStartDate('')
                      setEndDate('')
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="3">3 meses</option>
                    <option value="6">6 meses</option>
                    <option value="12">12 meses</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha Inicio
                  </label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha Fin
                  </label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>

                <div className="flex items-end">
                  <Button onClick={loadReports} className="w-full">
                    Aplicar Filtros
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* KPIs Principales */}
          {data && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-l-4 border-l-green-500">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 font-medium">Total Cobrado</p>
                        <p className="text-2xl font-bold text-green-600">
                          {formatCurrency(data.summary.totalCollected)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {data.summary.totalPayments} pagos
                        </p>
                      </div>
                      <DollarSign className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 font-medium">Ventas a Crédito</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {formatCurrency(data.summary.totalSales)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {data.summary.totalCreditSales} ventas
                        </p>
                      </div>
                      <BarChart3 className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-orange-500">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 font-medium">Tasa de Cobranza</p>
                        <p className="text-2xl font-bold text-orange-600">
                          {data.summary.collectionRate.toFixed(1)}%
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Cobrado vs Vendido
                        </p>
                      </div>
                      <Activity className="h-8 w-8 text-orange-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-red-500">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 font-medium">Deuda Actual</p>
                        <p className="text-2xl font-bold text-red-600">
                          {formatCurrency(data.summary.totalDebt)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {data.summary.customersWithDebt} clientes
                        </p>
                      </div>
                      <TrendingDown className="h-8 w-8 text-red-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Gráficas */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Gráfica de Líneas: Cobranza vs Ventas */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Evolución Mensual
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={prepareLineChartData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value: any) => formatCurrency(value)}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="cobrado" 
                          stroke="#10b981" 
                          name="Cobrado"
                          strokeWidth={2}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="vendido" 
                          stroke="#3b82f6" 
                          name="Vendido"
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Gráfica de Pie: Métodos de Pago */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <PieChart className="h-5 w-5" />
                      Por Método de Pago
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RePieChart>
                        <Pie
                          data={data.charts.paymentsByMethod}
                          dataKey="total"
                          nameKey="method"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label={(entry) => `${entry.method}: ${formatCurrency(entry.total)}`}
                        >
                          {data.charts.paymentsByMethod.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={METHOD_COLORS[entry.method] || COLORS[index % COLORS.length]} 
                            />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: any) => formatCurrency(value)} />
                      </RePieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Análisis de Antigüedad */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Antigüedad de Saldos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={prepareAgingData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="range" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: any) => formatCurrency(value)}
                      />
                      <Bar dataKey="amount" fill="#3b82f6" name="Monto">
                        {prepareAgingData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  
                  <div className="mt-4 grid grid-cols-5 gap-2 text-center text-sm">
                    {prepareAgingData().map((item, idx) => (
                      <div key={idx} className="p-2 bg-gray-50 rounded">
                        <p className="font-medium">{item.range}</p>
                        <p className="text-xs text-gray-600">{item.count} ventas</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Rankings */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Deudores */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingDown className="h-5 w-5 text-red-500" />
                      Top 10 Clientes con Mayor Deuda
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {data.rankings.topDebtors.map((customer, idx) => (
                        <div key={customer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-bold text-gray-400">#{idx + 1}</span>
                            <div>
                              <p className="font-medium text-gray-900">{customer.name}</p>
                              <p className="text-xs text-gray-500">
                                Límite: {formatCurrency(customer.limit)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-red-600">
                              {formatCurrency(customer.debt)}
                            </p>
                            <Badge variant={customer.usagePercent > 80 ? 'destructive' : 'default'}>
                              {customer.usagePercent.toFixed(0)}%
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Top Pagadores */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-500" />
                      Top 10 Clientes que Más Pagan
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {data.rankings.topPayers.map((customer: any, idx) => (
                        <div key={customer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-bold text-gray-400">#{idx + 1}</span>
                            <div>
                              <p className="font-medium text-gray-900">{customer.name}</p>
                              <p className="text-xs text-gray-500">
                                {customer.count} pagos
                              </p>
                            </div>
                          </div>
                          <p className="font-bold text-green-600">
                            {formatCurrency(customer.total)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </MainLayout>
    </RouteProtector>
  )
}
