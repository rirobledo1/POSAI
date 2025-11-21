'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import MainLayout from '@/components/layout/MainLayout'
import { 
  ShoppingBag, 
  FileText, 
  Eye, 
  Download, 
  Mail, 
  Phone, 
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Search,
  Filter,
  DollarSign,
  CreditCard,
  Banknote,
  Play
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import toast from 'react-hot-toast'

interface OnlineOrder {
  id: string
  orderNumber: string
  type: 'QUOTE' | 'SALE'
  status: string
  customerName: string
  customerEmail: string
  customerPhone: string
  customerAddress?: string
  items: any[]
  subtotal: number
  tax: number
  total: number
  notes?: string
  createdAt: string
  emailSentAt?: string
  paymentMethod?: string
  paymentStatus?: string
  saleId?: string
  company: {
    slug: string
  }
}

export default function PedidosWebPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [orders, setOrders] = useState<OnlineOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'QUOTE' | 'SALE'>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [selectedOrder, setSelectedOrder] = useState<OnlineOrder | null>(null)
  const [sendingEmail, setSendingEmail] = useState<string | null>(null)
  const [processingOrder, setProcessingOrder] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      loadOrders()
    }
  }, [status, router])

  const loadOrders = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/online-orders')
      
      if (!response.ok) {
        throw new Error('Error al cargar pedidos')
      }
      
      const data = await response.json()
      setOrders(data.orders || [])
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar pedidos')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = (order: OnlineOrder) => {
    const url = `/api/tienda/${order.company.slug}/orders/${order.id}/pdf`
    window.open(url, '_blank')
    toast.success('Descargando PDF...')
  }

  const handleSendEmail = async (order: OnlineOrder) => {
    if (sendingEmail) return
    
    setSendingEmail(order.id)
    
    try {
      const response = await fetch(`/api/tienda/${order.company.slug}/orders/${order.id}/send-email`, {
        method: 'POST'
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Error al enviar email')
      }
      
      toast.success(`Email enviado a ${order.customerEmail}`)
      loadOrders() // Recargar para actualizar estado
    } catch (error) {
      console.error('Error:', error)
      toast.error(error instanceof Error ? error.message : 'Error al enviar email')
    } finally {
      setSendingEmail(null)
    }
  }

  const handleProcessOrder = async (order: OnlineOrder) => {
    if (processingOrder) return
    
    // Confirmar antes de procesar
    const confirmed = window.confirm(
      `¿Procesar el pedido ${order.orderNumber}?\n\n` +
      `Esto creará una venta por ${order.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })} ` +
      `y descontará el inventario.\n\n` +
      `Cliente: ${order.customerName}\n` +
      `Email: ${order.customerEmail}`
    )
    
    if (!confirmed) return
    
    setProcessingOrder(order.id)
    
    try {
      const response = await fetch(`/api/online-orders/${order.id}/process`, {
        method: 'POST'
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        if (result.details) {
          throw new Error(result.details.join('\n'))
        }
        throw new Error(result.error || 'Error al procesar pedido')
      }
      
      toast.success(
        `Pedido procesado exitosamente\n` +
        `Venta: ${result.data.saleFolio}`,
        { duration: 5000 }
      )
      loadOrders() // Recargar para actualizar estado
    } catch (error) {
      console.error('Error:', error)
      toast.error(error instanceof Error ? error.message : 'Error al procesar pedido')
    } finally {
      setProcessingOrder(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
      PENDING: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pendiente' },
      PROCESSING: { color: 'bg-blue-100 text-blue-800', icon: Loader2, label: 'Procesando' },
      COMPLETED: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Completado' },
      CANCELLED: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Cancelado' },
      FAILED: { color: 'bg-red-100 text-red-800', icon: AlertCircle, label: 'Fallido' }
    }
    
    const config = statusConfig[status] || statusConfig.PENDING
    const Icon = config.icon
    
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const getTypeBadge = (type: string) => {
    if (type === 'QUOTE') {
      return (
        <Badge className="bg-purple-100 text-purple-800 flex items-center gap-1">
          <FileText className="h-3 w-3" />
          Cotización
        </Badge>
      )
    }
    return (
      <Badge className="bg-blue-100 text-blue-800 flex items-center gap-1">
        <ShoppingBag className="h-3 w-3" />
        Compra
      </Badge>
    )
  }

  // Filtrar órdenes
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      order.customerName.toLowerCase().includes(search.toLowerCase()) ||
      order.customerEmail.toLowerCase().includes(search.toLowerCase())
    
    const matchesType = filterType === 'all' || order.type === filterType
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus
    
    return matchesSearch && matchesType && matchesStatus
  })

  if (status === 'loading' || loading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShoppingBag className="h-7 w-7 text-blue-600" />
            Pedidos Web
          </h1>
          <p className="text-gray-500 mt-1">
            Gestiona las órdenes y cotizaciones de tu tienda en línea
          </p>
        </div>
        
        <Button onClick={loadOrders} variant="outline" className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Actualizar
        </Button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Búsqueda */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por número, nombre o email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          
          {/* Filtro por tipo */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="all">Todos los tipos</option>
            <option value="QUOTE">Cotizaciones</option>
            <option value="SALE">Compras</option>
          </select>
          
          {/* Filtro por estado */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="all">Todos los estados</option>
            <option value="PENDING">Pendiente</option>
            <option value="PROCESSING">Procesando</option>
            <option value="COMPLETED">Completado</option>
            <option value="CANCELLED">Cancelado</option>
          </select>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{orders.length}</div>
            <div className="text-sm text-gray-500">Total Pedidos</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {orders.filter(o => o.status === 'PENDING').length}
            </div>
            <div className="text-sm text-gray-500">Pendientes</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {orders.filter(o => o.type === 'QUOTE').length}
            </div>
            <div className="text-sm text-gray-500">Cotizaciones</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {orders.filter(o => o.type === 'SALE').length}
            </div>
            <div className="text-sm text-gray-500">Compras</div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de pedidos */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay pedidos
          </h3>
          <p className="text-gray-500">
            {search || filterType !== 'all' || filterStatus !== 'all'
              ? 'No se encontraron pedidos con los filtros seleccionados'
              : 'Los pedidos de tu tienda en línea aparecerán aquí'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow"
            >
              <div className="p-4">
                {/* Header del pedido */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-lg">{order.orderNumber}</span>
                      {getTypeBadge(order.type)}
                      {getStatusBadge(order.status)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleString('es-MX', {
                        dateStyle: 'medium',
                        timeStyle: 'short'
                      })}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">
                      ${order.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-sm text-gray-500">
                      {(order.items as any[]).length} producto(s)
                    </div>
                  </div>
                </div>

                {/* Info del cliente */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-sm">
                        {order.customerName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-sm">{order.customerName}</div>
                      <div className="text-xs text-gray-500">Cliente</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <div>
                      <div className="text-sm">{order.customerEmail}</div>
                      <div className="text-xs text-gray-500">Email</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <div>
                      <div className="text-sm">{order.customerPhone}</div>
                      <div className="text-xs text-gray-500">Teléfono</div>
                    </div>
                  </div>
                </div>

                {/* Productos */}
                <div className="mb-4">
                  <div className="text-sm font-medium text-gray-700 mb-2">Productos:</div>
                  <div className="space-y-1">
                    {(order.items as any[]).slice(0, 3).map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          {item.quantity}x {item.productName}
                        </span>
                        <span className="font-medium">
                          ${item.subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                    {(order.items as any[]).length > 3 && (
                      <div className="text-sm text-gray-500">
                        +{(order.items as any[]).length - 3} más...
                      </div>
                    )}
                  </div>
                </div>

                {/* Notas */}
                {order.notes && (
                  <div className="mb-4 p-2 bg-yellow-50 rounded text-sm">
                    <span className="font-medium">Notas:</span> {order.notes}
                  </div>
                )}

                {/* Acciones */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-2">
                    {order.emailSentAt && (
                      <span className="text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Email enviado
                      </span>
                    )}
                    {order.paymentMethod && (
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        {order.paymentMethod === 'CASH_ON_DELIVERY' ? (
                          <><Banknote className="h-3 w-3" /> Contra entrega</>
                        ) : (
                          <><CreditCard className="h-3 w-3" /> Tarjeta</>
                        )}
                      </span>
                    )}
                    {order.saleId && (
                      <span className="text-xs text-green-600 flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        Venta registrada
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Botón Procesar - Solo para ventas pendientes con pago contra entrega */}
                    {order.type === 'SALE' && 
                     order.status === 'PENDING' && 
                     order.paymentMethod === 'CASH_ON_DELIVERY' && (
                      <Button
                        size="sm"
                        onClick={() => handleProcessOrder(order)}
                        disabled={processingOrder === order.id}
                        className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white"
                      >
                        {processingOrder === order.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                        Procesar
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedOrder(order)}
                      className="flex items-center gap-1"
                    >
                      <Eye className="h-4 w-4" />
                      Ver detalles
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadPDF(order)}
                      className="flex items-center gap-1"
                    >
                      <Download className="h-4 w-4" />
                      PDF
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSendEmail(order)}
                      disabled={sendingEmail === order.id}
                      className="flex items-center gap-1"
                    >
                      {sendingEmail === order.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Mail className="h-4 w-4" />
                      )}
                      Email
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de detalles */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onDownloadPDF={() => handleDownloadPDF(selectedOrder)}
          onSendEmail={() => handleSendEmail(selectedOrder)}
        />
      )}
    </div>
    </MainLayout>
  )
}

// Modal de detalles
function OrderDetailModal({
  order,
  onClose,
  onDownloadPDF,
  onSendEmail
}: {
  order: OnlineOrder
  onClose: () => void
  onDownloadPDF: () => void
  onSendEmail: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white">
          <div>
            <h2 className="text-lg font-bold">{order.orderNumber}</h2>
            <p className="text-sm text-gray-500">
              {new Date(order.createdAt).toLocaleString('es-MX')}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Cliente */}
          <div>
            <h3 className="font-semibold mb-2">Datos del cliente</h3>
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">{order.customerName}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="h-4 w-4" />
                {order.customerEmail}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="h-4 w-4" />
                {order.customerPhone}
              </div>
              {order.customerAddress && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4" />
                  {order.customerAddress}
                </div>
              )}
            </div>
          </div>

          {/* Productos */}
          <div>
            <h3 className="font-semibold mb-2">Productos</h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-2">Producto</th>
                    <th className="text-center p-2">Cant.</th>
                    <th className="text-right p-2">Precio</th>
                    <th className="text-right p-2">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {(order.items as any[]).map((item, index) => (
                    <tr key={index} className="border-t">
                      <td className="p-2">{item.productName}</td>
                      <td className="p-2 text-center">{item.quantity}</td>
                      <td className="p-2 text-right">
                        ${item.price.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-2 text-right font-medium">
                        ${item.subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totales */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex justify-between mb-1">
              <span className="text-gray-600">Subtotal:</span>
              <span>${order.subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span className="text-gray-600">IVA:</span>
              <span>${order.tax.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between font-bold text-lg pt-2 border-t">
              <span>Total:</span>
              <span className="text-blue-600">
                ${order.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Notas */}
          {order.notes && (
            <div>
              <h3 className="font-semibold mb-2">Notas del cliente</h3>
              <div className="bg-yellow-50 rounded-lg p-3 text-sm">
                {order.notes}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex justify-end gap-2">
          <Button variant="outline" onClick={onDownloadPDF}>
            <Download className="h-4 w-4 mr-2" />
            Descargar PDF
          </Button>
          <Button variant="outline" onClick={onSendEmail}>
            <Mail className="h-4 w-4 mr-2" />
            Enviar Email
          </Button>
          <Button onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  )
}
