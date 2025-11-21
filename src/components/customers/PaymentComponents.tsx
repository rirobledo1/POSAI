'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'

interface Customer {
  id: string
  name: string
  currentDebt: number
  creditLimit: number
}

interface Payment {
  id: string
  customerName: string
  userName: string
  paymentMethod: string
  amount: number
  referenceNumber?: string
  notes?: string
  previousDebt: number
  newDebt: number
  createdAt: string
}

interface PaymentModalProps {
  customer: Customer
  isOpen: boolean
  onClose: () => void
  onPaymentSuccess: () => void
}

function PaymentModal({ customer, isOpen, onClose, onPaymentSuccess }: PaymentModalProps) {
  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('EFECTIVO')
  const [referenceNumber, setReferenceNumber] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    const paymentAmount = parseFloat(amount)
    
    if (!paymentAmount || paymentAmount <= 0) {
      setError('El monto debe ser mayor a 0')
      return
    }
    
    if (paymentAmount > customer.currentDebt) {
      setError(`El monto no puede ser mayor al adeudo actual ($${customer.currentDebt})`)
      return
    }
    
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/customer-payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: customer.id,
          amount: paymentAmount,
          paymentMethod,
          referenceNumber: referenceNumber || undefined,
          notes: notes || undefined,
        }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Error procesando el pago')
      }
      
      // Limpiar formulario
      setAmount('')
      setReferenceNumber('')
      setNotes('')
      
      onPaymentSuccess()
      onClose()
      
    } catch (error) {
      console.error('Error:', error)
      setError(error instanceof Error ? error.message : 'Error procesando el pago')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md p-6 bg-white">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Registrar Pago</h2>
          <Button variant="ghost" onClick={onClose}>✕</Button>
        </div>
        
        <div className="mb-4 p-3 bg-gray-50 rounded">
          <p><strong>Cliente:</strong> {customer.name}</p>
          <p><strong>Adeudo actual:</strong> <span className="text-red-600">${customer.currentDebt}</span></p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="amount">Monto del Pago *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              max={customer.currentDebt}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="paymentMethod">Método de Pago *</Label>
            <select
              id="paymentMethod"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full p-2 border rounded"
              required
            >
              <option value="EFECTIVO">Efectivo</option>
              <option value="TRANSFERENCIA">Transferencia</option>
              <option value="CHEQUE">Cheque</option>
              <option value="TARJETA">Tarjeta</option>
            </select>
          </div>
          
          <div>
            <Label htmlFor="referenceNumber">Número de Referencia</Label>
            <Input
              id="referenceNumber"
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="Opcional"
            />
          </div>
          
          <div>
            <Label htmlFor="notes">Notas</Label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2 border rounded"
              rows={3}
              placeholder="Notas adicionales (opcional)"
            />
          </div>
          
          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
              {error}
            </div>
          )}
          
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Procesando...' : 'Registrar Pago'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

interface PaymentHistoryProps {
  customerId: string
  customerName: string
  isOpen: boolean
  onClose: () => void
}

function PaymentHistory({ customerId, customerName, isOpen, onClose }: PaymentHistoryProps) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && customerId) {
      fetchPayments()
    }
  }, [isOpen, customerId])

  const fetchPayments = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/customer-payments?customerId=${customerId}`)
      const data = await response.json()
      
      if (response.ok) {
        setPayments(data.payments || [])
      }
    } catch (error) {
      console.error('Error fetching payments:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl p-6 bg-white max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Historial de Pagos - {customerName}</h2>
          <Button variant="ghost" onClick={onClose}>✕</Button>
        </div>
        
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <p>Cargando historial...</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {payments.length === 0 ? (
              <p className="text-center text-gray-500">No hay pagos registrados</p>
            ) : (
              <div className="space-y-2">
                {payments.map((payment) => (
                  <div key={payment.id} className="border rounded p-3 bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-green-600">${payment.amount}</p>
                        <p className="text-sm text-gray-600">{payment.paymentMethod}</p>
                      </div>
                      <div className="text-right text-sm">
                        <p>{new Date(payment.createdAt).toLocaleDateString()}</p>
                        <p className="text-gray-600">{payment.userName}</p>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600 grid grid-cols-2 gap-2">
                      <p>Adeudo anterior: <span className="text-red-600">${payment.previousDebt}</span></p>
                      <p>Nuevo adeudo: <span className="text-red-600">${payment.newDebt}</span></p>
                    </div>
                    
                    {payment.referenceNumber && (
                      <p className="text-sm text-gray-600 mt-1">Ref: {payment.referenceNumber}</p>
                    )}
                    
                    {payment.notes && (
                      <p className="text-sm text-gray-600 mt-1 italic">{payment.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}

export { PaymentModal, PaymentHistory }
