'use client'

import { useState } from 'react'
import { X, CreditCard, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PaymentForm } from './PaymentForm'
import { useNotifications } from '@/components/ui/NotificationProvider'

interface CheckoutModalProps {
  plan: {
    code: string
    name: string
    monthlyPrice: number
    annualPrice: number
    annualDiscountPercent: number
  }
  billingPeriod: 'monthly' | 'annual'
  onClose: () => void
  onSuccess: () => void
}

export function CheckoutModal({ plan, billingPeriod, onClose, onSuccess }: CheckoutModalProps) {
  const [processing, setProcessing] = useState(false)
  const { showSuccess, showError } = useNotifications()

  const price = billingPeriod === 'monthly' ? plan.monthlyPrice : plan.annualPrice
  const iva = price * 0.16
  const total = price + iva
  const originalAnnualPrice = plan.monthlyPrice * 12
  const savings = billingPeriod === 'annual' ? originalAnnualPrice - plan.annualPrice : 0

  const handlePayment = async (paymentData: any) => {
    try {
      setProcessing(true)

      // Llamar a API de pago (dummy por ahora)
      const response = await fetch('/api/subscriptions/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planCode: plan.code,
          billingPeriod,
          paymentMethod: 'card',
          cardData: paymentData
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al procesar el pago')
      }

      showSuccess(
        '¡Pago exitoso!',
        `Tu plan ha sido actualizado a ${plan.name}`
      )
      
      onSuccess()
    } catch (error: any) {
      console.error('Error processing payment:', error)
      showError('Error', error.message || 'No se pudo procesar el pago')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Confirmar Suscripción</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Estás a punto de suscribirte al plan {plan.name}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {/* Resumen del Plan */}
          <div className="bg-blue-50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-lg">{plan.name}</h3>
                <p className="text-sm text-gray-600">
                  Facturación {billingPeriod === 'monthly' ? 'mensual' : 'anual'}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">
                  ${price.toLocaleString('es-MX')}
                </div>
                <div className="text-sm text-gray-600">
                  /{billingPeriod === 'monthly' ? 'mes' : 'año'}
                </div>
              </div>
            </div>

            {billingPeriod === 'annual' && savings > 0 && (
              <div className="flex items-center justify-between pt-3 border-t border-blue-200">
                <span className="text-sm font-medium text-green-700">
                  Ahorro anual
                </span>
                <span className="text-sm font-bold text-green-700">
                  -${savings.toLocaleString('es-MX')} ({plan.annualDiscountPercent}%)
                </span>
              </div>
            )}
          </div>

          {/* Desglose de Costos */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium">${price.toLocaleString('es-MX')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">IVA (16%)</span>
              <span className="font-medium">${iva.toLocaleString('es-MX')}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span>Total</span>
              <span>${total.toLocaleString('es-MX')} MXN</span>
            </div>
          </div>

          {/* Formulario de Pago */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="h-5 w-5 text-gray-600" />
              <h3 className="font-semibold">Información de Pago</h3>
            </div>
            <PaymentForm 
              onSubmit={handlePayment}
              processing={processing}
              amount={total}
            />
          </div>

          {/* Seguridad */}
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
            <Lock className="h-4 w-4" />
            <span>Tus datos están protegidos con cifrado SSL de 256 bits</span>
          </div>

          {/* Nota */}
          <p className="text-xs text-gray-500 text-center">
            Al confirmar, aceptas los términos y condiciones del servicio.
            {billingPeriod === 'annual' ? ' Tu suscripción se renovará automáticamente cada año.' : ' Tu suscripción se renovará automáticamente cada mes.'}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
