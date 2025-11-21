'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  X,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle,
  CreditCard,
  FileText,
  Download,
  Calendar
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface Customer {
  id: string
  name: string
  email?: string
  phone?: string
  creditLimit: number
  currentDebt: number
  availableCredit: number
}

interface Sale {
  id: string
  folio: string
  total: number
  amountPaid: number
  remainingBalance: number
  paymentStatus: string
  dueDate?: string
  createdAt: string
}

interface Payment {
  id: string
  amount: number
  paymentMethod: string
  paymentDate: string
  reference?: string
  notes?: string
  sale?: {
    folio: string
  }
}

interface AccountData {
  customer: Customer
  summary: {
    totalDebt: number
    creditLimit: number
    availableCredit: number
    pendingSales: number
    overdueSales: number
    dueSoon: number
    totalPayments: number
  }
  creditSales: Sale[]
  payments: Payment[]
}

interface AccountStatementModalProps {
  isOpen: boolean
  onClose: () => void
  customerId: string
  customerName: string
  onApplyPayment?: (customer: Customer) => void
}

export default function AccountStatementModal({
  isOpen,
  onClose,
  customerId,
  customerName,
  onApplyPayment
}: AccountStatementModalProps) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<AccountData | null>(null)

  useEffect(() => {
    if (isOpen) {
      loadAccountStatement()
    }
  }, [isOpen, customerId])

  const loadAccountStatement = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/customers/${customerId}/account-statement`)
      
      if (response.ok) {
        const result = await response.json()
        setData(result)
      }
    } catch (error) {
      console.error('Error cargando estado de cuenta:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between border-b shrink-0">
          <div>
            <CardTitle className="text-xl font-bold">Estado de Cuenta</CardTitle>
            <p className="text-sm text-gray-500 mt-1">{customerName}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>

        <CardContent className="pt-6 overflow-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : !data ? (
            <div className="text-center py-12">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-gray-500">No se pudo cargar el estado de cuenta</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Resumen de Crédito */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-blue-700 font-medium">Límite de Crédito</p>
                        <p className="text-2xl font-bold text-blue-900">
                          {formatCurrency(data.customer.creditLimit)}
                        </p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-red-500">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-red-700 font-medium">Deuda Actual</p>
                        <p className="text-2xl font-bold text-red-900">
                          {formatCurrency(data.customer.currentDebt)}
                        </p>
                      </div>
                      <DollarSign className="h-8 w-8 text-red-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-green-700 font-medium">Crédito Disponible</p>
                        <p className="text-2xl font-bold text-green-900">
                          {formatCurrency(data.customer.availableCredit)}
                        </p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-orange-500">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-orange-700 font-medium">Uso de Crédito</p>
                        <p className="text-2xl font-bold text-orange-900">
                          {Math.round((data.customer.currentDebt / data.customer.creditLimit) * 100)}%
                        </p>
                      </div>
                      <Badge 
                        variant={
                          (data.customer.currentDebt / data.customer.creditLimit) > 0.8 
                            ? 'destructive' 
                            : 'secondary'
                        }
                      >
                        {(data.customer.currentDebt / data.customer.creditLimit) > 0.8 ? 'Alto' : 'Normal'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Alertas */}
              {data.summary.overdueSales > 0 && (
                <Card className="bg-red-50 border-red-200">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      <div>
                        <p className="font-semibold text-red-900">
                          {data.summary.overdueSales} venta{data.summary.overdueSales > 1 ? 's' : ''} vencida{data.summary.overdueSales > 1 ? 's' : ''}
                        </p>
                        <p className="text-sm text-red-700">
                          Se requiere seguimiento urgente
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {data.summary.dueSoon > 0 && (
                <Card className="bg-yellow-50 border-yellow-200">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-yellow-600" />
                      <div>
                        <p className="font-semibold text-yellow-900">
                          {data.summary.dueSoon} venta{data.summary.dueSoon > 1 ? 's' : ''} próxima{data.summary.dueSoon > 1 ? 's' : ''} a vencer
                        </p>
                        <p className="text-sm text-yellow-700">
                          Vencen en los próximos 7 días
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Ventas Pendientes */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Ventas Pendientes ({data.summary.pendingSales})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {data.creditSales.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                      <p className="text-gray-500">No hay ventas pendientes</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {data.creditSales.map((sale) => {
                        const isOverdue = sale.dueDate && new Date(sale.dueDate) < new Date()
                        const daysOverdue = sale.dueDate 
                          ? Math.floor((new Date().getTime() - new Date(sale.dueDate).getTime()) / (1000 * 60 * 60 * 24))
                          : 0

                        return (
                          <div
                            key={sale.id}
                            className={`p-4 border rounded-lg ${isOverdue ? 'border-red-200 bg-red-50' : 'bg-white'}`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3">
                                  <FileText className="h-5 w-5 text-gray-400" />
                                  <div>
                                    <p className="font-semibold text-gray-900">
                                      Venta {sale.folio}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      {new Date(sale.createdAt).toLocaleDateString('es-MX', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                      })}
                                    </p>
                                    {sale.dueDate && (
                                      <p className={`text-xs ${isOverdue ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                                        {isOverdue 
                                          ? `Vencida hace ${daysOverdue} día${daysOverdue > 1 ? 's' : ''}`
                                          : `Vence: ${new Date(sale.dueDate).toLocaleDateString('es-MX')}`
                                        }
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="text-right">
                                <p className="text-sm text-gray-500">Total</p>
                                <p className="text-lg font-bold text-gray-900">
                                  {formatCurrency(parseFloat(sale.total.toString()))}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Pagado: {formatCurrency(parseFloat(sale.amountPaid.toString()))}
                                </p>
                                <p className="text-lg font-bold text-red-600 mt-1">
                                  Saldo: {formatCurrency(parseFloat(sale.remainingBalance.toString()))}
                                </p>
                                <Badge variant={sale.paymentStatus === 'PENDING' ? 'destructive' : 'default'}>
                                  {sale.paymentStatus === 'PENDING' ? 'Pendiente' : 
                                   sale.paymentStatus === 'PARTIAL' ? 'Parcial' : 
                                   'Pagado'}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Últimos Pagos */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Últimos Pagos ({Math.min(data.payments.length, 5)})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {data.payments.length === 0 ? (
                    <div className="text-center py-8">
                      <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500">No hay pagos registrados</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {data.payments.slice(0, 5).map((payment) => (
                        <div
                          key={payment.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {formatCurrency(parseFloat(payment.amount.toString()))}
                              </p>
                              <p className="text-sm text-gray-500">
                                {payment.paymentMethod}
                                {payment.sale && ` - Venta ${payment.sale.folio}`}
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="text-sm text-gray-900">
                              {new Date(payment.paymentDate).toLocaleDateString('es-MX')}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(payment.paymentDate).toLocaleTimeString('es-MX', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Botones de acción */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                >
                  Cerrar
                </Button>
                {onApplyPayment && (
                  <Button
                    onClick={() => {
                      onApplyPayment(data.customer)
                      // NO llamar onClose() aquí - lo maneja onApplyPayment
                    }}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Aplicar Pago
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
