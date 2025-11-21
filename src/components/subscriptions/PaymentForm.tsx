'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface PaymentFormProps {
  onSubmit: (data: any) => void
  processing: boolean
  amount: number
}

export function PaymentForm({ onSubmit, processing, amount }: PaymentFormProps) {
  const [cardNumber, setCardNumber] = useState('')
  const [cardName, setCardName] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '')
    const chunks = cleaned.match(/.{1,4}/g) || []
    return chunks.join(' ').substr(0, 19) // 4 grupos de 4 dígitos
  }

  const formatExpiry = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length >= 2) {
      return cleaned.substr(0, 2) + '/' + cleaned.substr(2, 2)
    }
    return cleaned
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const last4 = cardNumber.replace(/\s/g, '').slice(-4)
    const cardBrand = detectCardBrand(cardNumber)

    onSubmit({
      cardNumber,
      cardName,
      expiry,
      cvv,
      last4,
      cardBrand
    })
  }

  const detectCardBrand = (number: string): string => {
    const cleaned = number.replace(/\s/g, '')
    if (cleaned.startsWith('4')) return 'Visa'
    if (cleaned.startsWith('5')) return 'Mastercard'
    if (cleaned.startsWith('3')) return 'American Express'
    return 'Tarjeta'
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Nombre del Titular */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nombre del Titular
        </label>
        <input
          type="text"
          value={cardName}
          onChange={(e) => setCardName(e.target.value.toUpperCase())}
          placeholder="JUAN PEREZ"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={processing}
        />
      </div>

      {/* Número de Tarjeta */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Número de Tarjeta
        </label>
        <div className="relative">
          <input
            type="text"
            value={cardNumber}
            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
            placeholder="1234 5678 9012 3456"
            required
            maxLength={19}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={processing}
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="flex gap-1">
              <div className="w-8 h-5 bg-gradient-to-r from-blue-600 to-blue-400 rounded"></div>
              <div className="w-8 h-5 bg-gradient-to-r from-orange-600 to-red-500 rounded"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Fecha de Expiración */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Expiración
          </label>
          <input
            type="text"
            value={expiry}
            onChange={(e) => setExpiry(formatExpiry(e.target.value))}
            placeholder="MM/AA"
            required
            maxLength={5}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={processing}
          />
        </div>

        {/* CVV */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            CVV
          </label>
          <input
            type="text"
            value={cvv}
            onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').substr(0, 4))}
            placeholder="123"
            required
            maxLength={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={processing}
          />
        </div>
      </div>

      {/* Nota de Dummy */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
        <p className="text-xs text-yellow-800">
          <strong>Modo de prueba:</strong> Puedes usar cualquier número de tarjeta válido. No se realizará ningún cargo real.
        </p>
      </div>

      {/* Botón de Pago */}
      <Button
        type="submit"
        disabled={processing || !cardNumber || !cardName || !expiry || !cvv}
        className="w-full"
      >
        {processing ? (
          <span className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Procesando...
          </span>
        ) : (
          `Pagar $${amount.toLocaleString('es-MX')} MXN`
        )}
      </Button>
    </form>
  )
}
