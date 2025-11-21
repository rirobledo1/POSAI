'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import MainLayout from '@/components/layout/MainLayout'
import RouteProtector from '@/components/layout/RouteProtector'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useNotifications } from '@/components/ui/NotificationProvider'
import { 
  DollarSign, 
  Calendar, 
  User, 
  TrendingUp, 
  Download,
  Eye,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertCircle,
  DollarSignIcon,
  CircleDollarSignIcon
} from 'lucide-react'

interface CashRegisterClosure {
  id: string
  folio: string
  user_name: string
  status: 'ABIERTO' | 'CERRADO'
  opened_at: string
  closed_at: string | null
  shift: string
  initial_fund: number
  total_sales_count: number
  total_sales_amount: number
  cash_count: number
  cash_amount: number
  cash_expected: number
  cash_real: number | null
  cash_difference: number | null
  card_count: number
  card_amount: number
  transfer_count: number
  transfer_amount: number
  credit_count: number
  credit_amount: number
  notes: string | null
}

export default function CortesPage() {
  const { data: session } = useSession()
  const { showSuccess, showError, showInfo } = useNotifications()
  
  const [closures, setClosures] = useState<CashRegisterClosure[]>([])
  const [filteredClosures, setFilteredClosures] = useState<CashRegisterClosure[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedClosure, setSelectedClosure] = useState<CashRegisterClosure | null>(null)
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ABIERTO' | 'CERRADO'>('ALL')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    loadClosures()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [closures, searchTerm, statusFilter, dateFrom, dateTo])

  const loadClosures = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/cash-register?action=history&limit=100')
      const data = await response.json()
      
      if (data.success) {
        setClosures(data.closures || [])
      } else {
        showError('Error', 'No se pudieron cargar los cortes')
      }
    } catch (error) {
      console.error('Error cargando cortes:', error)
      showError('Error', 'Error al cargar el historial de cortes')
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...closures]

    // Filtro de búsqueda (folio o usuario)
    if (searchTerm) {
      filtered = filtered.filter(c => 
        c.folio.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.user_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtro de estado
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(c => c.status === statusFilter)
    }

    // Filtro de fecha desde
    if (dateFrom) {
      filtered = filtered.filter(c => 
        new Date(c.opened_at) >= new Date(dateFrom)
      )
    }

    // Filtro de fecha hasta
    if (dateTo) {
      filtered = filtered.filter(c => 
        new Date(c.opened_at) <= new Date(dateTo + 'T23:59:59')
      )
    }

    setFilteredClosures(filtered)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    if (status === 'ABIERTO') {
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          <Clock className="h-3 w-3 mr-1" />
          Abierto
        </Badge>
      )
    }
    return (
      <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
        <CheckCircle className="h-3 w-3 mr-1" />
        Cerrado
      </Badge>
    )
  }

  const getDifferenceColor = (difference: number | null) => {
    if (difference === null) return 'text-gray-500'
    if (Math.abs(difference) < 0.01) return 'text-green-600'
    if (difference > 0) return 'text-blue-600'
    return 'text-red-600'
  }

  // Estadísticas generales
  const stats = {
    total: closures.length,
    abiertos: closures.filter(c => c.status === 'ABIERTO').length,
    cerrados: closures.filter(c => c.status === 'CERRADO').length,
    totalVentas: closures.reduce((sum, c) => sum + (c.total_sales_amount || 0), 0),
    totalDiferencias: closures
      .filter(c => c.cash_difference !== null)
      .reduce((sum, c) => sum + (c.cash_difference || 0), 0)
  }

  return (
    <RouteProtector allowedRoles={['ADMIN', 'VENDEDOR']}>
      <MainLayout>
        <div className="p-6 space-y-6">
          {/* Header - Solo botón de actualizar */}
          <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CircleDollarSignIcon className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              Cortes de Caja
            </h1>
          </div>
          <div className="flex justify-end">
            <Button
              onClick={loadClosures}
              variant="outline"
            >
              🔄 Actualizar
            </Button>
          </div>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Cortes</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Abiertos</p>
                    <p className="text-2xl font-bold text-green-600">{stats.abiertos}</p>
                  </div>
                  <Clock className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Cerrados</p>
                    <p className="text-2xl font-bold text-gray-600">{stats.cerrados}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-gray-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Ventas</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(stats.totalVentas)}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Diferencias</p>
                    <p className={`text-2xl font-bold ${getDifferenceColor(stats.totalDiferencias)}`}>
                      {formatCurrency(stats.totalDiferencias)}
                    </p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filtros */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Buscar</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Folio o usuario..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Estado</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="w-full border rounded-md px-3 py-2 text-sm"
                  >
                    <option value="ALL">Todos</option>
                    <option value="ABIERTO">Abiertos</option>
                    <option value="CERRADO">Cerrados</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Desde</label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Hasta</label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
              </div>

              {(searchTerm || statusFilter !== 'ALL' || dateFrom || dateTo) && (
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    Mostrando {filteredClosures.length} de {closures.length} cortes
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchTerm('')
                      setStatusFilter('ALL')
                      setDateFrom('')
                      setDateTo('')
                    }}
                  >
                    Limpiar filtros
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Lista de Cortes */}
          <Card>
            <CardHeader>
              <CardTitle>Historial de Cortes</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
              ) : filteredClosures.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No se encontraron cortes de caja</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredClosures.map((closure) => (
                    <div
                      key={closure.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => setSelectedClosure(closure)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-mono font-bold text-lg">
                              {closure.folio}
                            </span>
                            {getStatusBadge(closure.status)}
                            <Badge variant="outline">{closure.shift}</Badge>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600">Vendedor</p>
                              <p className="font-medium">{closure.user_name}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Apertura</p>
                              <p className="font-medium">{formatDate(closure.opened_at)}</p>
                            </div>
                            {closure.closed_at && (
                              <div>
                                <p className="text-gray-600">Cierre</p>
                                <p className="font-medium">{formatDate(closure.closed_at)}</p>
                              </div>
                            )}
                            <div>
                              <p className="text-gray-600">Total Ventas</p>
                              <p className="font-bold text-blue-600">
                                {formatCurrency(closure.total_sales_amount || 0)}
                              </p>
                              <p className="text-xs text-gray-500">
                                {closure.total_sales_count || 0} tickets
                              </p>
                            </div>
                          </div>

                          {closure.status === 'CERRADO' && closure.cash_difference !== null && (
                            <div className="mt-3 pt-3 border-t">
                              <div className="flex items-center gap-4 text-sm">
                                <div>
                                  <span className="text-gray-600">Efectivo esperado: </span>
                                  <span className="font-medium">
                                    {formatCurrency(closure.cash_expected || 0)}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Efectivo real: </span>
                                  <span className="font-medium">
                                    {formatCurrency(closure.cash_real || 0)}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Diferencia: </span>
                                  <span className={`font-bold ${getDifferenceColor(closure.cash_difference)}`}>
                                    {closure.cash_difference > 0 ? '+' : ''}
                                    {formatCurrency(Math.abs(closure.cash_difference))}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedClosure(closure)
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Modal de Detalles */}
          {selectedClosure && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
                  <div>
                    <h2 className="text-2xl font-bold">{selectedClosure.folio}</h2>
                    <p className="text-gray-600">Detalles del corte de caja</p>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => setSelectedClosure(null)}
                  >
                    ✕
                  </Button>
                </div>

                <div className="p-6 space-y-6">
                  {/* Información General */}
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Información General</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Estado</p>
                        <div>{getStatusBadge(selectedClosure.status)}</div>
                      </div>
                      <div>
                        <p className="text-gray-600 mb-1">Turno</p>
                        <p className="font-medium">{selectedClosure.shift}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Vendedor</p>
                        <p className="font-medium">{selectedClosure.user_name}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Fondo Inicial</p>
                        <p className="font-medium">{formatCurrency(selectedClosure.initial_fund)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Apertura</p>
                        <p className="font-medium">{formatDate(selectedClosure.opened_at)}</p>
                      </div>
                      {selectedClosure.closed_at && (
                        <div>
                          <p className="text-gray-600">Cierre</p>
                          <p className="font-medium">{formatDate(selectedClosure.closed_at)}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Resumen de Ventas */}
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Resumen de Ventas</h3>
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-gray-600">Total de Ventas</p>
                          <p className="text-3xl font-bold text-blue-700">
                            {formatCurrency(selectedClosure.total_sales_amount || 0)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-semibold text-gray-700">
                            {selectedClosure.total_sales_count || 0}
                          </p>
                          <p className="text-sm text-gray-600">tickets</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="border rounded-lg p-3">
                        <p className="text-sm text-gray-600 mb-1">💵 Efectivo</p>
                        <p className="text-xl font-bold text-green-700">
                          {formatCurrency(selectedClosure.cash_amount || 0)}
                        </p>
                        <p className="text-xs text-gray-500">{selectedClosure.cash_count} transacciones</p>
                      </div>

                      <div className="border rounded-lg p-3">
                        <p className="text-sm text-gray-600 mb-1">💳 Tarjeta</p>
                        <p className="text-xl font-bold text-blue-700">
                          {formatCurrency(selectedClosure.card_amount || 0)}
                        </p>
                        <p className="text-xs text-gray-500">{selectedClosure.card_count} transacciones</p>
                      </div>

                      <div className="border rounded-lg p-3">
                        <p className="text-sm text-gray-600 mb-1">📱 Transferencia</p>
                        <p className="text-xl font-bold text-purple-700">
                          {formatCurrency(selectedClosure.transfer_amount || 0)}
                        </p>
                        <p className="text-xs text-gray-500">{selectedClosure.transfer_count} transacciones</p>
                      </div>

                      <div className="border rounded-lg p-3">
                        <p className="text-sm text-gray-600 mb-1">📋 Crédito</p>
                        <p className="text-xl font-bold text-orange-700">
                          {formatCurrency(selectedClosure.credit_amount || 0)}
                        </p>
                        <p className="text-xs text-gray-500">{selectedClosure.credit_count} transacciones</p>
                      </div>
                    </div>
                  </div>

                  {/* Efectivo en Caja (solo si está cerrado) */}
                  {selectedClosure.status === 'CERRADO' && (
                    <div>
                      <h3 className="font-semibold text-lg mb-3">Efectivo en Caja</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span className="text-gray-600">Efectivo esperado</span>
                          <span className="font-bold">{formatCurrency(selectedClosure.cash_expected || 0)}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span className="text-gray-600">Efectivo real</span>
                          <span className="font-bold">{formatCurrency(selectedClosure.cash_real || 0)}</span>
                        </div>
                        <div className={`flex justify-between items-center p-3 rounded-lg ${
                          Math.abs(selectedClosure.cash_difference || 0) < 0.01
                            ? 'bg-green-50 border border-green-200'
                            : 'bg-red-50 border border-red-200'
                        }`}>
                          <span className="font-medium">Diferencia</span>
                          <span className={`font-bold text-xl ${getDifferenceColor(selectedClosure.cash_difference)}`}>
                            {(selectedClosure.cash_difference || 0) > 0 ? '+' : ''}
                            {formatCurrency(Math.abs(selectedClosure.cash_difference || 0))}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Observaciones */}
                  {selectedClosure.notes && (
                    <div>
                      <h3 className="font-semibold text-lg mb-3">Observaciones</h3>
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-gray-700">{selectedClosure.notes}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </MainLayout>
    </RouteProtector>
  )
}
