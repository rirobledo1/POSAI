'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import MainLayout from '@/components/layout/MainLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useQuotations, Quotation } from '@/hooks/useQuotations'
import { 
  Search, 
  Plus,
  Eye, 
  Mail,
  MessageCircle,
  Download,
  ShoppingCart,
  Calendar,
  DollarSign,
  User,
  FileText,
  Trash2,
  Clock
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface QuotationsPageState {
  quotations: Quotation[]
  filteredQuotations: Quotation[]
  searchTerm: string
  statusFilter: string
  selectedQuotation: Quotation | null
  currentPage: number
  totalPages: number
}

export default function CotizacionesPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { 
    fetchQuotations, 
    sendByEmail, 
    sendByWhatsApp,
    convertToSale,
    downloadPDF,
    deleteQuotation,
    loading 
  } = useQuotations()
  
  const [state, setState] = useState<QuotationsPageState>({
    quotations: [],
    filteredQuotations: [],
    searchTerm: '',
    statusFilter: 'all',
    selectedQuotation: null,
    currentPage: 1,
    totalPages: 1
  })

  // Cargar cotizaciones iniciales
  useEffect(() => {
    loadQuotations()
  }, [state.currentPage, state.statusFilter])

  // Filtrar cotizaciones cuando cambia el término de búsqueda
  useEffect(() => {
    filterQuotations()
  }, [state.quotations, state.searchTerm])

  const loadQuotations = async () => {
    try {
      const params: any = {
        page: state.currentPage,
        limit: 20,
        companyId: session?.user?.companyId
      }

      if (state.statusFilter !== 'all') {
        params.status = state.statusFilter
      }

      const response = await fetchQuotations(params)
      
      setState(prev => ({
        ...prev,
        quotations: response.quotations || [],
        totalPages: response.pagination?.totalPages || 1
      }))
    } catch (error) {
      console.error('Error loading quotations:', error)
    }
  }

  const filterQuotations = () => {
    if (!state.searchTerm.trim()) {
      setState(prev => ({ ...prev, filteredQuotations: prev.quotations }))
      return
    }

    const filtered = state.quotations.filter(quotation => 
      quotation.quotationNumber.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
      quotation.customer?.name?.toLowerCase().includes(state.searchTerm.toLowerCase())
    )

    setState(prev => ({ ...prev, filteredQuotations: filtered }))
  }

  const handleSendEmail = async (quotation: Quotation) => {
    try {
      await sendByEmail(quotation.id, quotation.customer.email)
      alert('Cotización enviada por email exitosamente')
      loadQuotations()
    } catch (error: any) {
      alert(error.message || 'Error al enviar email')
    }
  }

  const handleSendWhatsApp = async (quotation: Quotation) => {
    try {
      const result = await sendByWhatsApp(quotation.id, quotation.customer.phone)
      
      if (result.mode === 'manual' && result.whatsappUrl) {
        window.open(result.whatsappUrl, '_blank')
      } else {
        alert('Cotización enviada por WhatsApp exitosamente')
      }
      
      loadQuotations()
    } catch (error: any) {
      alert(error.message || 'Error al enviar por WhatsApp')
    }
  }

  const handleConvertToSale = async (quotation: Quotation) => {
    if (!confirm('¿Deseas convertir esta cotización a venta?')) return
    
    try {
      const result = await convertToSale(quotation.id)
      alert(`Venta creada exitosamente: ${result.sale.saleNumber}`)
      loadQuotations()
    } catch (error: any) {
      alert(error.message || 'Error al convertir a venta')
    }
  }

  const handleDownloadPDF = async (quotation: Quotation) => {
    try {
      await downloadPDF(quotation.id, quotation.quotationNumber)
    } catch (error: any) {
      alert(error.message || 'Error al descargar PDF')
    }
  }

  const handleDelete = async (quotation: Quotation) => {
    if (!confirm('¿Estás seguro de cancelar esta cotización?')) return
    
    try {
      await deleteQuotation(quotation.id)
      alert('Cotización cancelada exitosamente')
      loadQuotations()
    } catch (error: any) {
      alert(error.message || 'Error al cancelar cotización')
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      'DRAFT': { variant: 'secondary' as const, label: 'Borrador', color: 'bg-gray-100 text-gray-800' },
      'SENT': { variant: 'default' as const, label: 'Enviada', color: 'bg-blue-100 text-blue-800' },
      'VIEWED': { variant: 'default' as const, label: 'Vista', color: 'bg-purple-100 text-purple-800' },
      'ACCEPTED': { variant: 'success' as const, label: 'Aceptada', color: 'bg-green-100 text-green-800' },
      'REJECTED': { variant: 'destructive' as const, label: 'Rechazada', color: 'bg-red-100 text-red-800' },
      'EXPIRED': { variant: 'secondary' as const, label: 'Expirada', color: 'bg-orange-100 text-orange-800' },
      'CONVERTED': { variant: 'success' as const, label: 'Convertida', color: 'bg-emerald-100 text-emerald-800' },
      'CANCELLED': { variant: 'destructive' as const, label: 'Cancelada', color: 'bg-red-100 text-red-800' }
    }
    
    const config = variants[status as keyof typeof variants] || { variant: 'outline' as const, label: status, color: '' }
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    )
  }

  const isExpired = (validUntil: string) => {
    return new Date(validUntil) < new Date()
  }

  const canConvertToSale = (quotation: Quotation) => {
    return !quotation.convertedToSaleId && 
           quotation.status !== 'CANCELLED' && 
           quotation.status !== 'REJECTED' &&
           !isExpired(quotation.validUntil)
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Cotizaciones</h1>
            <p className="text-gray-600">Administra tus cotizaciones y conviértelas a ventas</p>
          </div>
          
          <div className="flex items-center gap-4">
            <Badge variant="outline">
              {state.filteredQuotations.length} cotizaciones
            </Badge>
            
            <Button 
              onClick={() => router.push('/cotizaciones/nueva')}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Nueva Cotización
            </Button>
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
                    placeholder="Buscar por número de cotización o cliente..."
                    value={state.searchTerm}
                    onChange={(e) => setState(prev => ({ ...prev, searchTerm: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="min-w-[180px]">
                <select
                  value={state.statusFilter}
                  onChange={(e) => setState(prev => ({ ...prev, statusFilter: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="all">Todos los estados</option>
                  <option value="DRAFT">Borrador</option>
                  <option value="SENT">Enviadas</option>
                  <option value="VIEWED">Vistas</option>
                  <option value="ACCEPTED">Aceptadas</option>
                  <option value="REJECTED">Rechazadas</option>
                  <option value="EXPIRED">Expiradas</option>
                  <option value="CONVERTED">Convertidas</option>
                  <option value="CANCELLED">Canceladas</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quotations Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Listado de Cotizaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-500">Cargando cotizaciones...</p>
              </div>
            ) : state.filteredQuotations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No se encontraron cotizaciones</p>
                <Button 
                  onClick={() => router.push('/cotizaciones/nueva')}
                  className="mt-4"
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Crear primera cotización
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Número</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Cliente</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Total</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Estado</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Válida hasta</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Creada</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {state.filteredQuotations.map((quotation) => (
                      <tr key={quotation.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {quotation.quotationNumber}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            {quotation.customer.name}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4 text-gray-400" />
                            ${Number(quotation.total).toFixed(2)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {getStatusBadge(quotation.status)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {format(new Date(quotation.validUntil), 'dd/MM/yyyy', { locale: es })}
                            {isExpired(quotation.validUntil) && (
                              <span className="text-red-500 text-xs ml-1">(Expirada)</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(quotation.createdAt), 'dd/MM/yyyy', { locale: es })}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/cotizaciones/${quotation.id}`)}
                              title="Ver detalles"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadPDF(quotation)}
                              title="Descargar PDF"
                              className="text-blue-600 hover:text-blue-700 hover:border-blue-300"
                            >
                              <Download className="h-4 w-4" />
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSendEmail(quotation)}
                              disabled={!quotation.customer.email}
                              title="Enviar por email"
                              className="text-purple-600 hover:text-purple-700 hover:border-purple-300"
                            >
                              <Mail className="h-4 w-4" />
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSendWhatsApp(quotation)}
                              disabled={!quotation.customer.phone}
                              title="Enviar por WhatsApp"
                              className="text-green-600 hover:text-green-700 hover:border-green-300"
                            >
                              <MessageCircle className="h-4 w-4" />
                            </Button>
                            
                            {canConvertToSale(quotation) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleConvertToSale(quotation)}
                                className="text-emerald-600 hover:text-emerald-700 hover:border-emerald-300"
                                title="Convertir a venta"
                              >
                                <ShoppingCart className="h-4 w-4" />
                              </Button>
                            )}

                            {quotation.status === 'DRAFT' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(quotation)}
                                className="text-red-600 hover:text-red-700 hover:border-red-300"
                                title="Cancelar cotización"
                              >
                                <Trash2 className="h-4 w-4" />
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
    </MainLayout>
  )
}
