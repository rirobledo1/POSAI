'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import MainLayout from '@/components/layout/MainLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useQuotations } from '@/hooks/useQuotations'
import {
  ArrowLeft,
  Eye,
  Mail,
  MessageCircle,
  Download,
  ShoppingCart,
  Calendar,
  DollarSign,
  User,
  Phone,
  MapPin,
  FileText,
  Edit,
  Trash2,
  Building,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface QuotationDetail {
  id: string
  quotationNumber: string
  status: string
  customerId: string
  customer: {
    id: string
    name: string
    email: string
    phone: string
    address: string
    taxId: string
  }
  items: Array<{
    id: string
    productId: string
    productName: string
    product: {
      id: string
      name: string
      barcode: string
    }
    description: string
    quantity: number
    unitPrice: number
    discount: number
    subtotal: number
  }>
  subtotal: number
  discount: number
  discountPercent: number
  tax: number
  total: number
  notes: string
  paymentTerms: string
  deliveryTime: string
  validUntil: string
  convertedToSaleId: string | null
  viewCount: number
  company: {
    id: string
    name: string
    tradeName: string
  }
  branch: {
    id: string
    name: string
    address: string
  } | null
  createdBy: {
    id: string
    name: string
    email: string
  }
  createdAt: string
  updatedAt: string
  cancelledAt: string | null
}

export default function QuotationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const quotationId = params?.id as string

  const {
    sendByEmail,
    sendByWhatsApp,
    convertToSale,
    downloadPDF,
    deleteQuotation,
    loading
  } = useQuotations()

  const [quotation, setQuotation] = useState<QuotationDetail | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (quotationId) {
      loadQuotationDetail()
    }
  }, [quotationId])

  const loadQuotationDetail = async () => {
    setLoadingDetail(true)
    setError(null)

    try {
      const response = await fetch(`/api/quotations/${quotationId}`)

      if (!response.ok) {
        throw new Error('Error al cargar la cotización')
      }

      const data = await response.json()
      setQuotation(data)
    } catch (err: any) {
      setError(err.message || 'Error al cargar la cotización')
      console.error('Error loading quotation:', err)
    } finally {
      setLoadingDetail(false)
    }
  }

  const handleSendEmail = async () => {
    if (!quotation) return

    try {
      await sendByEmail(quotation.id, quotation.customer.email)
      alert('Cotización enviada por email exitosamente')
      loadQuotationDetail()
    } catch (error: any) {
      alert(error.message || 'Error al enviar email')
    }
  }

  const handleSendWhatsApp = async () => {
    if (!quotation) return

    try {
      const result = await sendByWhatsApp(quotation.id, quotation.customer.phone)

      if (result.mode === 'manual' && result.whatsappUrl) {
        window.open(result.whatsappUrl, '_blank')
      } else {
        alert('Cotización enviada por WhatsApp exitosamente')
      }

      loadQuotationDetail()
    } catch (error: any) {
      alert(error.message || 'Error al enviar por WhatsApp')
    }
  }

  const handleConvertToSale = async () => {
    if (!quotation) return
    if (!confirm('¿Deseas convertir esta cotización a venta?')) return

    try {
      const result = await convertToSale(quotation.id)
      alert(`Venta creada exitosamente: ${result.sale.saleNumber}`)
      loadQuotationDetail()
    } catch (error: any) {
      alert(error.message || 'Error al convertir a venta')
    }
  }

  const handleDownloadPDF = async () => {
    if (!quotation) return

    try {
      await downloadPDF(quotation.id, quotation.quotationNumber)
    } catch (error: any) {
      alert(error.message || 'Error al descargar PDF')
    }
  }

  const handleDelete = async () => {
    if (!quotation) return
    if (!confirm('¿Estás seguro de cancelar esta cotización?')) return

    try {
      await deleteQuotation(quotation.id)
      alert('Cotización cancelada exitosamente')
      router.push('/cotizaciones')
    } catch (error: any) {
      alert(error.message || 'Error al cancelar cotización')
    }
  }

  const getStatusConfig = (status: string) => {
    const configs = {
      'DRAFT': { 
        label: 'Borrador', 
        color: 'bg-gray-100 text-gray-800',
        icon: FileText 
      },
      'SENT': { 
        label: 'Enviada', 
        color: 'bg-blue-100 text-blue-800',
        icon: Mail 
      },
      'VIEWED': { 
        label: 'Vista', 
        color: 'bg-purple-100 text-purple-800',
        icon: Eye 
      },
      'ACCEPTED': { 
        label: 'Aceptada', 
        color: 'bg-green-100 text-green-800',
        icon: CheckCircle 
      },
      'REJECTED': { 
        label: 'Rechazada', 
        color: 'bg-red-100 text-red-800',
        icon: XCircle 
      },
      'EXPIRED': { 
        label: 'Expirada', 
        color: 'bg-orange-100 text-orange-800',
        icon: AlertCircle 
      },
      'CONVERTED': { 
        label: 'Convertida', 
        color: 'bg-emerald-100 text-emerald-800',
        icon: ShoppingCart 
      },
      'CANCELLED': { 
        label: 'Cancelada', 
        color: 'bg-red-100 text-red-800',
        icon: XCircle 
      }
    }

    return configs[status as keyof typeof configs] || {
      label: status,
      color: 'bg-gray-100 text-gray-800',
      icon: FileText
    }
  }

  const isExpired = (validUntil: string) => {
    return new Date(validUntil) < new Date()
  }

  const canConvertToSale = (quotation: QuotationDetail) => {
    return !quotation.convertedToSaleId &&
      quotation.status !== 'CANCELLED' &&
      quotation.status !== 'REJECTED' &&
      !isExpired(quotation.validUntil)
  }

  if (loadingDetail) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-500">Cargando cotización...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (error || !quotation) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-500 mb-4">{error || 'Cotización no encontrada'}</p>
            <Button onClick={() => router.push('/cotizaciones')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a cotizaciones
            </Button>
          </div>
        </div>
      </MainLayout>
    )
  }

  const statusConfig = getStatusConfig(quotation.status)
  const StatusIcon = statusConfig.icon

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.push('/cotizaciones')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>

            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">
                  {quotation.quotationNumber}
                </h1>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${statusConfig.color}`}>
                  <StatusIcon className="h-4 w-4" />
                  {statusConfig.label}
                </span>
              </div>
              <p className="text-gray-600 mt-1">
                Creada el {format(new Date(quotation.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: es })}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleDownloadPDF}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              PDF
            </Button>

            <Button
              variant="outline"
              onClick={handleSendEmail}
              disabled={loading || !quotation.customer.email}
              className="flex items-center gap-2 text-purple-600 hover:text-purple-700 hover:border-purple-300"
            >
              <Mail className="h-4 w-4" />
              Email
            </Button>

            <Button
              variant="outline"
              onClick={handleSendWhatsApp}
              disabled={loading || !quotation.customer.phone}
              className="flex items-center gap-2 text-green-600 hover:text-green-700 hover:border-green-300"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </Button>

            {canConvertToSale(quotation) && (
              <Button
                onClick={handleConvertToSale}
                disabled={loading}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700"
              >
                <ShoppingCart className="h-4 w-4" />
                Convertir a Venta
              </Button>
            )}

            {quotation.status === 'DRAFT' && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Cancelar
              </Button>
            )}
          </div>
        </div>

        {/* Alert if expired */}
        {isExpired(quotation.validUntil) && quotation.status !== 'CONVERTED' && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <p className="text-orange-800 font-medium">
                Esta cotización expiró el {format(new Date(quotation.validUntil), 'dd/MM/yyyy', { locale: es })}
              </p>
            </div>
          </div>
        )}

        {/* Converted to sale alert */}
        {quotation.convertedToSaleId && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
              <p className="text-emerald-800 font-medium">
                Esta cotización fue convertida a venta exitosamente
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Información del Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Nombre</label>
                    <p className="mt-1 text-gray-900">{quotation.customer.name}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">RFC/Tax ID</label>
                    <p className="mt-1 text-gray-900">{quotation.customer.taxId || 'N/A'}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      Email
                    </label>
                    <p className="mt-1 text-gray-900">{quotation.customer.email || 'N/A'}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      Teléfono
                    </label>
                    <p className="mt-1 text-gray-900">{quotation.customer.phone || 'N/A'}</p>
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      Dirección
                    </label>
                    <p className="mt-1 text-gray-900">{quotation.customer.address || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Items Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Productos / Servicios
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Producto</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Descripción</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">Cantidad</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">Precio Unit.</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">Descuento</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {quotation.items.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm">
                            <div className="font-medium text-gray-900">{item.product.name}</div>
                            <div className="text-gray-500 text-xs">{item.product.barcode}</div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {item.description}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-gray-900">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-gray-900">
                            ${Number(item.unitPrice).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-gray-900">
                            ${Number(item.discount).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                            ${Number(item.subtotal).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div className="mt-6 space-y-2 border-t pt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium text-gray-900">${Number(quotation.subtotal).toFixed(2)}</span>
                  </div>
                  {quotation.discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        Descuento {quotation.discountPercent > 0 && `(${quotation.discountPercent}%)`}:
                      </span>
                      <span className="font-medium text-red-600">-${Number(quotation.discount).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      IVA ({Number(quotation.subtotal) > 0 ? Math.round((Number(quotation.tax) / Number(quotation.subtotal)) * 100) : 16}%):
                    </span>
                    <span className="font-medium text-gray-900">${Number(quotation.tax).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                    <span className="text-gray-900">Total:</span>
                    <span className="text-blue-600">${Number(quotation.total).toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes and Terms */}
            {(quotation.notes || quotation.paymentTerms || quotation.deliveryTime) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Notas y Condiciones
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {quotation.notes && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Notas</label>
                      <p className="mt-1 text-gray-900 whitespace-pre-wrap">{quotation.notes}</p>
                    </div>
                  )}

                  {quotation.paymentTerms && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Términos de Pago</label>
                      <p className="mt-1 text-gray-900">{quotation.paymentTerms}</p>
                    </div>
                  )}

                  {quotation.deliveryTime && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Tiempo de Entrega</label>
                      <p className="mt-1 text-gray-900">{quotation.deliveryTime}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Stats and Info */}
          <div className="space-y-6">
            {/* Key Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-700">Información General</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs text-gray-500 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Válida hasta
                  </label>
                  <p className={`mt-1 font-medium ${isExpired(quotation.validUntil) ? 'text-red-600' : 'text-gray-900'}`}>
                    {format(new Date(quotation.validUntil), "dd 'de' MMMM 'de' yyyy", { locale: es })}
                  </p>
                </div>

                <div>
                  <label className="text-xs text-gray-500 flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    Veces vista
                  </label>
                  <p className="mt-1 font-medium text-gray-900">{quotation.viewCount}</p>
                </div>

                <div>
                  <label className="text-xs text-gray-500 flex items-center gap-1">
                    <User className="h-3 w-3" />
                    Creada por
                  </label>
                  <p className="mt-1 font-medium text-gray-900">{quotation.createdBy.name}</p>
                  <p className="text-xs text-gray-500">{quotation.createdBy.email}</p>
                </div>

                {quotation.branch && (
                  <div>
                    <label className="text-xs text-gray-500 flex items-center gap-1">
                      <Building className="h-3 w-3" />
                      Sucursal
                    </label>
                    <p className="mt-1 font-medium text-gray-900">{quotation.branch.name}</p>
                    <p className="text-xs text-gray-500">{quotation.branch.address}</p>
                  </div>
                )}

                <div>
                  <label className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Última actualización
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {format(new Date(quotation.updatedAt), "dd/MM/yyyy HH:mm", { locale: es })}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Summary Card */}
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">Total de la Cotización</p>
                  <p className="text-3xl font-bold text-blue-600 mb-4">
                    ${Number(quotation.total).toFixed(2)}
                  </p>
                  <div className="space-y-1 text-xs text-gray-600">
                    <p>{quotation.items.length} producto(s)</p>
                    <p>IVA incluido</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
