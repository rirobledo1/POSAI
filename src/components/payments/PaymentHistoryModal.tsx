'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  X,
  Search,
  Filter,
  Download,
  DollarSign,
  ChevronDown,
  ChevronUp,
  FileText,
  CreditCard
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface Payment {
  id: string
  amount: number
  paymentMethod: string
  reference?: string
  paymentDate: string
  notes?: string
  createdAt: string
  sale?: {
    id: string
    folio: string
    total: number
  }
}

interface PaymentHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  customer: {
    id: string
    name: string
  }
}

const PAYMENT_METHOD_ICONS: Record<string, string> = {
  'EFECTIVO': '💵',
  'TRANSFERENCIA': '🏦',
  'TARJETA': '💳',
  'CHEQUE': '📝',
}

const PAYMENT_METHOD_COLORS: Record<string, string> = {
  'EFECTIVO': 'bg-green-100 text-green-800',
  'TRANSFERENCIA': 'bg-blue-100 text-blue-800',
  'TARJETA': 'bg-purple-100 text-purple-800',
  'CHEQUE': 'bg-orange-100 text-orange-800',
}

export default function PaymentHistoryModal({
  isOpen,
  onClose,
  customer
}: PaymentHistoryModalProps) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMethod, setSelectedMethod] = useState<string>('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [expandedPayment, setExpandedPayment] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadPayments()
    }
  }, [isOpen, customer.id])

  useEffect(() => {
    filterPayments()
  }, [payments, searchTerm, selectedMethod, startDate, endDate])

  const loadPayments = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/customer-payments?customerId=${customer.id}&limit=200`)
      const data = await response.json()

      if (response.ok) {
        setPayments(data.payments || [])
      }
    } catch (error) {
      console.error('Error cargando historial de pagos:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterPayments = () => {
    let filtered = [...payments]

    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.sale?.folio.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedMethod !== 'all') {
      filtered = filtered.filter(p => p.paymentMethod === selectedMethod)
    }

    if (startDate) {
      filtered = filtered.filter(p => new Date(p.paymentDate) >= new Date(startDate))
    }
    if (endDate) {
      filtered = filtered.filter(p => new Date(p.paymentDate) <= new Date(endDate))
    }

    setFilteredPayments(filtered)
  }

  const totalPaid = filteredPayments.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0)

  const exportToCSV = () => {
    const csvContent = [
      ['Fecha', 'Método', 'Monto', 'Referencia', 'Venta', 'Notas'].join(','),
      ...filteredPayments.map(p => [
        new Date(p.paymentDate).toLocaleDateString(),
        p.paymentMethod,
        p.amount,
        p.reference || '',
        p.sale?.folio || 'General',
        p.notes || ''
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `historial-pagos-${customer.name.replace(/\s/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between border-b shrink-0">
          <div>
            <CardTitle className="text-xl font-bold">Historial de Pagos</CardTitle>
            <p className="text-sm text-gray-500 mt-1">{customer.name}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>

        <CardContent className="pt-6 overflow-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-700 font-medium">Total Pagado</p>
                    <p className="text-2xl font-bold text-blue-900">{formatCurrency(totalPaid)}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-700 font-medium">Total de Pagos</p>
                    <p className="text-2xl font-bold text-green-900">{filteredPayments.length}</p>
                  </div>
                  <FileText className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-700 font-medium">Pago Promedio</p>
                    <p className="text-2xl font-bold text-purple-900">
                      {formatCurrency(filteredPayments.length > 0 ? totalPaid / filteredPayments.length : 0)}
                    </p>
                  </div>
                  <CreditCard className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por folio, referencia o notas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
                <Filter className="h-4 w-4 mr-2" />
                Filtros
                {showFilters ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
              </Button>

              <Button variant="outline" onClick={exportToCSV} disabled={filteredPayments.length === 0}>
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>

            {showFilters && (
              <Card className="bg-gray-50">
                <CardContent className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Método de Pago</label>
                      <select
                        value={selectedMethod}
                        onChange={(e) => setSelectedMethod(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="all">Todos</option>
                        <option value="EFECTIVO">💵 Efectivo</option>
                        <option value="TRANSFERENCIA">🏦 Transferencia</option>
                        <option value="TARJETA">💳 Tarjeta</option>
                        <option value="CHEQUE">📝 Cheque</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Desde</label>
                      <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Hasta</label>
                      <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No se encontraron pagos</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPayments.map((payment) => (
                <Card key={payment.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">{PAYMENT_METHOD_ICONS[payment.paymentMethod] || '💰'}</span>
                          <div>
                            <p className="text-2xl font-bold text-gray-900">
                              {formatCurrency(parseFloat(payment.amount.toString()))}
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(payment.paymentDate).toLocaleDateString('es-MX', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge className={PAYMENT_METHOD_COLORS[payment.paymentMethod] || 'bg-gray-100 text-gray-800'}>
                            {payment.paymentMethod}
                          </Badge>
                          {payment.sale && (
                            <Badge variant="outline">Venta: {payment.sale.folio}</Badge>
                          )}
                          {payment.reference && (
                            <Badge variant="secondary">Ref: {payment.reference}</Badge>
                          )}
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedPayment(expandedPayment === payment.id ? null : payment.id)}
                      >
                        {expandedPayment === payment.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </div>

                    {expandedPayment === payment.id && (
                      <div className="mt-4 pt-4 border-t space-y-2 text-sm">
                        {payment.sale && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Venta Total:</span>
                            <span className="font-medium">{formatCurrency(parseFloat(payment.sale.total.toString()))}</span>
                          </div>
                        )}
                        {payment.notes && (
                          <div>
                            <span className="text-gray-600">Notas:</span>
                            <p className="mt-1 text-gray-900">{payment.notes}</p>
                          </div>
                        )}
                        <div className="flex justify-between text-gray-500">
                          <span>Registrado:</span>
                          <span>{new Date(payment.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
