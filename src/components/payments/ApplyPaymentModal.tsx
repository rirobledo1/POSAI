'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  X,
  DollarSign,
  CreditCard,
  CheckCircle,
  AlertTriangle,
  Calendar
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useNotifications } from '@/components/ui/NotificationProvider'

interface Sale {
  id: string
  folio: string
  total: number
  amountPaid: number
  remainingBalance: number
  paymentStatus: string
}

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  customer: {
    id: string
    name: string
    currentDebt: number
  }
  sales?: Sale[]
  onSuccess?: () => void
}

const PAYMENT_METHODS = [
  { value: 'EFECTIVO', label: 'Efectivo', icon: '💵' },
  { value: 'TRANSFERENCIA', label: 'Transferencia', icon: '🏦' },
  { value: 'TARJETA', label: 'Tarjeta', icon: '💳' },
  { value: 'CHEQUE', label: 'Cheque', icon: '📝' },
]

export default function ApplyPaymentModal({
  isOpen,
  onClose,
  customer,
  sales = [],
  onSuccess
}: PaymentModalProps) {
  const { showSuccess, showError, showWarning } = useNotifications()
  
  // Estados del formulario
  const [selectedSaleId, setSelectedSaleId] = useState<string>('')
  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('EFECTIVO')
  const [reference, setReference] = useState('')
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  // Resetear formulario cuando se abre
  useEffect(() => {
    if (isOpen) {
      setSelectedSaleId('')
      setAmount('')
      setPaymentMethod('EFECTIVO')
      setReference('')
      setPaymentDate(new Date().toISOString().split('T')[0])
      setNotes('')
    }
  }, [isOpen])

  // Obtener venta seleccionada
  const selectedSale = sales.find(s => s.id === selectedSaleId)
  const maxAmount = selectedSale 
    ? parseFloat(selectedSale.remainingBalance.toString())
    : customer.currentDebt

  // Calcular nuevo saldo
  const amountNum = parseFloat(amount) || 0
  const newBalance = maxAmount - amountNum

  // Validaciones
  const isValid = amountNum > 0 && amountNum <= maxAmount

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isValid) {
      showWarning('Monto inválido', `El monto debe ser mayor a $0 y menor o igual a ${formatCurrency(maxAmount)}`)
      return
    }

    setIsProcessing(true)

    try {
      const response = await fetch('/api/customer-payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: customer.id,
          saleId: selectedSaleId || null,
          amount: amountNum,
          paymentMethod,
          reference: reference.trim() || null,
          paymentDate,
          notes: notes.trim() || null
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al registrar el pago')
      }

      showSuccess(
        '¡Pago registrado!',
        `Se registró un pago de ${formatCurrency(amountNum)} para ${customer.name}`
      )

      onClose()
      
      // Callback de éxito
      if (onSuccess) {
        onSuccess()
      }

    } catch (error: any) {
      console.error('Error registrando pago:', error)
      showError('Error', error.message || 'No se pudo registrar el pago')
    } finally {
      setIsProcessing(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between border-b">
          <CardTitle className="text-xl font-bold">
            Aplicar Pago - {customer.name}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isProcessing}
          >
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>

        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Resumen del cliente */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-700 font-medium">Deuda Total</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {formatCurrency(customer.currentDebt)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-blue-500" />
              </div>
            </div>

            {/* Seleccionar venta específica */}
            {sales.length > 0 && (
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Aplicar a venta específica (opcional)
                </Label>
                <div className="space-y-2">
                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="sale"
                      value=""
                      checked={selectedSaleId === ''}
                      onChange={() => setSelectedSaleId('')}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Pago a cuenta general</p>
                      <p className="text-sm text-gray-500">
                        El pago se distribuirá automáticamente
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {formatCurrency(customer.currentDebt)}
                    </Badge>
                  </label>

                  {sales.map((sale) => (
                    <label
                      key={sale.id}
                      className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                    >
                      <input
                        type="radio"
                        name="sale"
                        value={sale.id}
                        checked={selectedSaleId === sale.id}
                        onChange={() => setSelectedSaleId(sale.id)}
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">Venta {sale.folio}</p>
                        <p className="text-sm text-gray-500">
                          Pagado: {formatCurrency(parseFloat(sale.amountPaid.toString()))}
                        </p>
                      </div>
                      <Badge variant="destructive">
                        {formatCurrency(parseFloat(sale.remainingBalance.toString()))}
                      </Badge>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Monto */}
            <div>
              <Label htmlFor="amount" className="text-sm font-medium mb-2 block">
                Monto a pagar *
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  $
                </span>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  max={maxAmount}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-8 text-lg font-semibold"
                  placeholder="0.00"
                  required
                  disabled={isProcessing}
                />
              </div>
              <div className="flex items-center justify-between mt-2 text-sm">
                <span className="text-gray-500">
                  Máximo: {formatCurrency(maxAmount)}
                </span>
                {amountNum > 0 && (
                  <span className={`font-medium ${newBalance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    Nuevo saldo: {formatCurrency(Math.max(0, newBalance))}
                  </span>
                )}
              </div>
              
              {/* Botones rápidos */}
              <div className="flex gap-2 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount((maxAmount * 0.5).toFixed(2))}
                  disabled={isProcessing}
                >
                  50%
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(maxAmount.toFixed(2))}
                  disabled={isProcessing}
                >
                  Total
                </Button>
              </div>
            </div>

            {/* Método de pago */}
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Método de pago *
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_METHODS.map((method) => (
                  <label
                    key={method.value}
                    className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                      paymentMethod === method.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method.value}
                      checked={paymentMethod === method.value}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="sr-only"
                    />
                    <span className="text-2xl mr-2">{method.icon}</span>
                    <span className="font-medium">{method.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Referencia */}
            {(paymentMethod === 'TRANSFERENCIA' || paymentMethod === 'CHEQUE') && (
              <div>
                <Label htmlFor="reference" className="text-sm font-medium mb-2 block">
                  {paymentMethod === 'CHEQUE' ? 'Número de cheque' : 'Referencia de transferencia'}
                </Label>
                <Input
                  id="reference"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder={paymentMethod === 'CHEQUE' ? 'Ej: 12345' : 'Ej: TRF-123456'}
                  disabled={isProcessing}
                />
              </div>
            )}

            {/* Fecha del pago */}
            <div>
              <Label htmlFor="paymentDate" className="text-sm font-medium mb-2 block">
                Fecha del pago *
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="paymentDate"
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="pl-10"
                  required
                  disabled={isProcessing}
                />
              </div>
            </div>

            {/* Notas */}
            <div>
              <Label htmlFor="notes" className="text-sm font-medium mb-2 block">
                Notas (opcional)
              </Label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Agrega cualquier observación..."
                disabled={isProcessing}
              />
            </div>

            {/* Advertencias */}
            {amountNum > maxAmount && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-700">
                  El monto excede el saldo pendiente de {formatCurrency(maxAmount)}
                </div>
              </div>
            )}

            {/* Botones */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isProcessing}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={!isValid || isProcessing}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Procesando...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Registrar Pago
                  </div>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
