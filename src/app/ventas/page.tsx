'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import MainLayout from '@/components/layout/MainLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import SaleCancellationModal from '@/components/sales/SaleCancellationModal'
import { useSales, Sale } from '@/hooks/useSales'
import { useTickets } from '@/hooks/useTickets'
import { 
  Search, 
  Filter, 
  Eye, 
  XCircle, 
  Calendar,
  DollarSign,
  User,
  FileText,
  Printer,
  Truck,
  Home,
  MapPin,
  FileIcon
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { PaperClipIcon } from '@heroicons/react/24/outline'

interface SalesPageState {
  sales: Sale[]
  filteredSales: Sale[]
  searchTerm: string
  statusFilter: string
  dateFilter: string
  selectedSale: Sale | null
  showCancellationModal: boolean
  currentPage: number
  totalPages: number
}

export default function VentasPage() {
  const { data: session } = useSession()
  const { fetchSales, loading } = useSales()
  const { printTicket, fetchSaleForTicket, loading: ticketLoading } = useTickets()
  
  const [state, setState] = useState<SalesPageState>({
    sales: [],
    filteredSales: [],
    searchTerm: '',
    statusFilter: 'all',
    dateFilter: 'today',
    selectedSale: null,
    showCancellationModal: false,
    currentPage: 1,
    totalPages: 1
  })

  // Cargar ventas iniciales
  useEffect(() => {
    loadSales()
  }, [state.currentPage, state.statusFilter, state.dateFilter])

  // Filtrar ventas cuando cambia el término de búsqueda
  useEffect(() => {
    filterSales()
  }, [state.sales, state.searchTerm])

  const loadSales = async () => {
    try {
      const params: any = {
        page: state.currentPage,
        limit: 20
      }

      if (state.statusFilter !== 'all') {
        params.status = state.statusFilter
      }

      if (state.dateFilter !== 'all') {
        const today = new Date()
        const startOfDay = new Date(today.setHours(0, 0, 0, 0))
        
        switch (state.dateFilter) {
          case 'today':
            params.startDate = startOfDay.toISOString()
            break
          case 'week':
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
            params.startDate = weekAgo.toISOString()
            break
          case 'month':
            const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
            params.startDate = monthAgo.toISOString()
            break
        }
      }

      const response = await fetchSales(params)
      
      setState(prev => ({
        ...prev,
        sales: response.data || [],
        totalPages: Math.ceil((response.total || 0) / 20)
      }))
    } catch (error) {
      console.error('Error loading sales:', error)
    }
  }

  const filterSales = () => {
    if (!state.searchTerm.trim()) {
      setState(prev => ({ ...prev, filteredSales: prev.sales }))
      return
    }

    const filtered = state.sales.filter(sale => 
      sale.folio.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
      sale.customer?.name?.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
      sale.user.name.toLowerCase().includes(state.searchTerm.toLowerCase())
    )

    setState(prev => ({ ...prev, filteredSales: filtered }))
  }

  const handleCancelSale = (sale: Sale) => {
    setState(prev => ({
      ...prev,
      selectedSale: sale,
      showCancellationModal: true
    }))
  }

  const handleCancellationSuccess = () => {
    loadSales() // Recargar la lista
  }

  const handlePrintTicket = async (sale: Sale) => {
    try {
      const saleDetails = await fetchSaleForTicket(sale.id)
      if (saleDetails) {
        printTicket(saleDetails)
      }
    } catch (error) {
      console.error('Error imprimiendo ticket:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      'COMPLETED': { variant: 'success' as const, label: 'Completada' },
      'CANCELLED': { variant: 'destructive' as const, label: 'Cancelada' },
      'REFUNDED': { variant: 'secondary' as const, label: 'Reembolsada' },
      'PARTIAL_REFUND': { variant: 'warning' as const, label: 'Reembolso Parcial' },
      'PENDING': { variant: 'outline' as const, label: 'Pendiente' }
    }
    
    const config = variants[status as keyof typeof variants] || { variant: 'outline' as const, label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const canCancelSale = (sale: Sale) => {
    return session?.user?.role === 'ADMIN' && 
           ['COMPLETED', 'PENDING'].includes(sale.status)
  }

  const isLoading = loading

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileIcon className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Ventas</h1>
            <p className="text-gray-600 mt-1">Administra y monitorea todas las ventas</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {state.filteredSales.length} ventas
            </Badge>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por folio, cliente o vendedor..."
                    value={state.searchTerm}
                    onChange={(e) => setState(prev => ({ ...prev, searchTerm: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="min-w-[150px]">
                <select
                  value={state.statusFilter}
                  onChange={(e) => setState(prev => ({ ...prev, statusFilter: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="all">Todos los estados</option>
                  <option value="COMPLETED">Completadas</option>
                  <option value="PENDING">Pendientes</option>
                  <option value="CANCELLED">Canceladas</option>
                  <option value="REFUNDED">Reembolsadas</option>
                  <option value="PARTIAL_REFUND">Reembolso Parcial</option>
                </select>
              </div>

              {/* Date Filter */}
              <div className="min-w-[150px]">
                <select
                  value={state.dateFilter}
                  onChange={(e) => setState(prev => ({ ...prev, dateFilter: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="all">Todas las fechas</option>
                  <option value="today">Hoy</option>
                  <option value="week">Última semana</option>
                  <option value="month">Último mes</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sales Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Listado de Ventas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-500">Cargando ventas...</p>
              </div>
            ) : state.filteredSales.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No se encontraron ventas</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Folio</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Cliente</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Vendedor</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Total</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Estado</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Entrega</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Fecha</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {state.filteredSales.map((sale) => (
                      <tr key={sale.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {sale.folio}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            {sale.customer?.name || 'Mostrador'}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {sale.user.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4 text-gray-400" />
                            ${sale.total.toFixed(2)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {getStatusBadge(sale.status)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {sale.deliveryType ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1">
                                {sale.deliveryType === 'HOME_DELIVERY' ? (
                                  <Truck className="h-4 w-4 text-blue-500" />
                                ) : (
                                  <Home className="h-4 w-4 text-green-500" />
                                )}
                                <span className="text-xs font-medium">
                                  {sale.deliveryType === 'HOME_DELIVERY' ? 'Domicilio' : 'Recoger'}
                                </span>
                              </div>
                              {sale.deliveryType === 'HOME_DELIVERY' && sale.deliveryAddress && (
                                <div className="flex items-start gap-1 text-xs text-gray-500">
                                  <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                  <div className="truncate max-w-32" title={`${sale.deliveryAddress}, ${sale.deliveryNeighborhood || ''} ${sale.deliveryCity || ''}`}>
                                    {sale.deliveryAddress}
                                    {sale.deliveryNeighborhood && `, ${sale.deliveryNeighborhood}`}
                                  </div>
                                </div>
                              )}
                              {sale.deliveryFee && sale.deliveryFee > 0 && (
                                <div className="text-xs text-gray-500">
                                  +${sale.deliveryFee.toFixed(2)}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(sale.createdAt), 'dd/MM/yyyy HH:mm', { locale: es })}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {/* TODO: Ver detalles */}}
                              title="Ver detalles"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePrintTicket(sale)}
                              disabled={ticketLoading}
                              title="Reimprimir ticket"
                              className="text-blue-600 hover:text-blue-700 hover:border-blue-300"
                            >
                              <Printer className="h-4 w-4" />
                            </Button>
                            
                            {canCancelSale(sale) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCancelSale(sale)}
                                className="text-red-600 hover:text-red-700 hover:border-red-300"
                                title="Cancelar venta"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {state.totalPages > 1 && (
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => setState(prev => ({ ...prev, currentPage: Math.max(1, prev.currentPage - 1) }))}
              disabled={state.currentPage === 1}
            >
              Anterior
            </Button>
            
            <div className="flex items-center gap-2">
              {Array.from({ length: Math.min(5, state.totalPages) }, (_, i) => {
                const page = i + 1
                return (
                  <Button
                    key={page}
                    variant={page === state.currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => setState(prev => ({ ...prev, currentPage: page }))}
                  >
                    {page}
                  </Button>
                )
              })}
            </div>
            
            <Button
              variant="outline"
              onClick={() => setState(prev => ({ ...prev, currentPage: Math.min(prev.totalPages, prev.currentPage + 1) }))}
              disabled={state.currentPage === state.totalPages}
            >
              Siguiente
            </Button>
          </div>
        )}
      </div>

      {/* Cancellation Modal */}
      <SaleCancellationModal
        sale={state.selectedSale}
        isOpen={state.showCancellationModal}
        onClose={() => setState(prev => ({ ...prev, showCancellationModal: false, selectedSale: null }))}
        onSuccess={handleCancellationSuccess}
      />
    </MainLayout>
  )
}