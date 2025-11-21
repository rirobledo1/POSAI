'use client'

import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import MainLayout from '@/components/layout/MainLayout'
import RouteProtector from '@/components/layout/RouteProtector'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft,
  CreditCard,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle,
  Mail,
  Phone,
  User,
  Calendar,
  FileText,
  Download,
  Send
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useNotifications } from '@/components/ui/NotificationProvider'
import ApplyPaymentModal from '@/components/payments/ApplyPaymentModal'
import PaymentHistoryModal from '@/components/payments/PaymentHistoryModal'
import SendStatementModal from '@/components/email/SendStatementModal'
import { useAccountStatementPDF } from '@/hooks/useAccountStatementPDF'

interface CustomerData {
  id: string
  name: string
  email?: string
  phone?: string
  creditLimit: number
  currentDebt: number
  availableCredit: number
}

interface CreditSale {
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
  reference?: string
  paymentDate: string
  notes?: string
  saleId?: string
  sale?: {
    folio: string
  }
}

interface AccountStatement {
  customer: CustomerData
  summary: {
    totalDebt: number
    creditLimit: number
    availableCredit: number
    pendingSales: number
    overdueSales: number
    dueSoon: number
    totalPayments: number
  }
  creditSales: CreditSale[]
  payments: Payment[]
}

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { showSuccess, showError } = useNotifications()
  
  // Unwrap params usando React.use()
  const { id } = use(params)
  
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<AccountStatement | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)
  
  // Hook para generar PDF
  const { generatePDF, loading: pdfLoading } = useAccountStatementPDF()

  useEffect(() => {
    loadAccountStatement()
  }, [id])

  const loadAccountStatement = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/customers/${id}/account-statement`)
      
      if (!response.ok) {
        throw new Error('Error cargando estado de cuenta')
      }
      
      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error('Error:', error)
      showError('Error', 'No se pudo cargar el estado de cuenta')
    } finally {
      setLoading(false)
    }
  }

  const handleExportPDF = async () => {
    if (!data) return
    
    const result = await generatePDF(customer.id, customer.name)
    
    if (result.success) {
      showSuccess('PDF Generado', `Estado de cuenta de ${customer.name} descargado exitosamente`)
    } else {
      showError('Error', result.error || 'No se pudo generar el PDF')
    }
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

  if (!data) {
    return (
      <RouteProtector allowedRoles={['ADMIN', 'VENDEDOR']}>
        <MainLayout>
          <div className="p-6">
            <div className="text-center py-12">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-gray-500">No se pudo cargar la información del cliente</p>
              <Button onClick={() => router.back()} className="mt-4">
                Volver
              </Button>
            </div>
          </div>
        </MainLayout>
      </RouteProtector>
    )
  }

  const { customer, summary, creditSales, payments } = data

  // Calcular porcentaje de uso
  const creditUsagePercent = customer.creditLimit > 0 
    ? (customer.currentDebt / customer.creditLimit) * 100 
    : 0

  return (
    <RouteProtector allowedRoles={['ADMIN', 'VENDEDOR']}>
      <MainLayout>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => router.back()}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
              
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{customer.name}</h1>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                  {customer.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {customer.email}
                    </span>
                  )}
                  {customer.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      {customer.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowHistoryModal(true)}>
                <FileText className="h-4 w-4 mr-2" />
                Historial
              </Button>
              <Button 
                variant="outline" 
                onClick={handleExportPDF}
                disabled={pdfLoading}
              >
                {pdfLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                    Generando...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Exportar PDF
                  </>
                )}
              </Button>
              <Button 
                variant="outline"
                onClick={() => setShowEmailModal(true)}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              >
                <Send className="h-4 w-4 mr-2" />
                Enviar por Email
              </Button>
              <Button 
                className="bg-green-600 hover:bg-green-700"
                onClick={() => setShowPaymentModal(true)}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Aplicar Pago
              </Button>
            </div>
          </div>

          {/* Resumen de Crédito */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Límite de Crédito
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(customer.creditLimit)}
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-red-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Deuda Actual
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(customer.currentDebt)}
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Crédito Disponible
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(customer.availableCredit)}
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Uso de Crédito
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-gray-900">
                    {Math.round(creditUsagePercent)}%
                  </div>
                  <Badge 
                    variant={
                      creditUsagePercent > 80 
                        ? 'destructive' 
                        : creditUsagePercent > 50
                        ? 'default'
                        : 'secondary'
                    }
                  >
                    {creditUsagePercent > 80 ? 'Alto' : creditUsagePercent > 50 ? 'Medio' : 'Bajo'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Alertas */}
          {summary.overdueSales > 0 && (
            <Card className="bg-red-50 border-red-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="font-semibold text-red-900">
                      {summary.overdueSales} venta{summary.overdueSales > 1 ? 's' : ''} vencida{summary.overdueSales > 1 ? 's' : ''}
                    </p>
                    <p className="text-sm text-red-700">
                      Se requiere seguimiento para recuperar el pago
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {summary.dueSoon > 0 && (
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="font-semibold text-yellow-900">
                      {summary.dueSoon} venta{summary.dueSoon > 1 ? 's' : ''} próxima{summary.dueSoon > 1 ? 's' : ''} a vencer
                    </p>
                    <p className="text-sm text-yellow-700">
                      Vencen en los próximos 7 días
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Ventas a Crédito Pendientes */}
          <Card>
            <CardHeader>
              <CardTitle>Ventas a Crédito Pendientes ({summary.pendingSales})</CardTitle>
            </CardHeader>
            <CardContent>
              {creditSales.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                  <p className="text-gray-500">No hay ventas pendientes de pago</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {creditSales.map((sale) => {
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

                          <div className="text-right mr-6">
                            <p className="text-sm text-gray-500">Total</p>
                            <p className="text-lg font-bold text-gray-900">
                              {formatCurrency(parseFloat(sale.total.toString()))}
                            </p>
                            <p className="text-xs text-gray-500">
                              Pagado: {formatCurrency(parseFloat(sale.amountPaid.toString()))}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-sm text-gray-500">Saldo</p>
                            <p className="text-xl font-bold text-red-600">
                              {formatCurrency(parseFloat(sale.remainingBalance.toString()))}
                            </p>
                            <Badge variant={sale.paymentStatus === 'PENDING' ? 'destructive' : 'default'}>
                              {sale.paymentStatus === 'PENDING' ? 'Pendiente' : 
                               sale.paymentStatus === 'PARTIAL' ? 'Parcial' : 
                               'Pagado'}
                            </Badge>
                          </div>

                          <Button
                            className="ml-4 bg-green-600 hover:bg-green-700"
                            size="sm"
                            onClick={() => setShowPaymentModal(true)}
                          >
                            <CreditCard className="h-4 w-4 mr-1" />
                            Pagar
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Historial de Pagos */}
          <Card>
            <CardHeader>
              <CardTitle>Historial de Pagos ({summary.totalPayments})</CardTitle>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <div className="text-center py-8">
                  <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No hay pagos registrados</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {payments.map((payment) => (
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
                          {payment.reference && (
                            <p className="text-xs text-gray-400">
                              Ref: {payment.reference}
                            </p>
                          )}
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
        </div>

        {/* Modales */}
        {data && (
          <>
            <ApplyPaymentModal
              isOpen={showPaymentModal}
              onClose={() => setShowPaymentModal(false)}
              customer={{
                id: customer.id,
                name: customer.name,
                currentDebt: customer.currentDebt
              }}
              sales={creditSales}
              onSuccess={() => {
                // Recargar datos después de aplicar pago
                loadAccountStatement()
              }}
            />

            <PaymentHistoryModal
              isOpen={showHistoryModal}
              onClose={() => setShowHistoryModal(false)}
              customer={{
                id: customer.id,
                name: customer.name
              }}
            />

            <SendStatementModal
              isOpen={showEmailModal}
              onClose={() => setShowEmailModal(false)}
              customer={{
                id: customer.id,
                name: customer.name,
                email: customer.email
              }}
              onSuccess={() => {
                showSuccess('Email enviado', `Estado de cuenta enviado a ${customer.email || 'el cliente'}`)
              }}
            />
          </>
        )}
      </MainLayout>
    </RouteProtector>
  )
}
