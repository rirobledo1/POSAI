// src/components/pos/checkout/PaymentMethodStep.tsx
'use client';

import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Customer, PaymentMethod } from '@/types/pos';

interface PaymentMethodStepProps {
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  customer: Customer | null;
}

export default function PaymentMethodStep({
  paymentMethod,
  onPaymentMethodChange,
  customer
}: PaymentMethodStepProps) {
  const paymentMethods = [
    {
      id: 'EFECTIVO' as PaymentMethod,
      label: 'Efectivo',
      icon: '💵',
      description: 'Pago en efectivo',
      color: 'from-green-500 to-green-600',
      disabled: false
    },
    {
      id: 'TARJETA' as PaymentMethod,
      label: 'Tarjeta',
      icon: '💳',
      description: 'Débito o crédito',
      color: 'from-blue-500 to-blue-600',
      disabled: false
    },
    {
      id: 'TRANSFERENCIA' as PaymentMethod,
      label: 'Transferencia',
      icon: '📱',
      description: 'Transferencia bancaria',
      color: 'from-purple-500 to-purple-600',
      disabled: false
    },
    {
      id: 'CREDITO' as PaymentMethod,
      label: 'Crédito',
      icon: '💰',
      description: 'Pago a crédito',
      color: 'from-orange-500 to-orange-600',
      disabled: !customer
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">
          Selecciona el método de pago
        </h3>
        <p className="text-sm text-gray-600">
          Elige cómo el cliente pagará esta venta
        </p>
      </div>

      {!customer && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            Selecciona un cliente para habilitar el pago a crédito
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-4">
        {paymentMethods.map((method) => (
          <button
            key={method.id}
            onClick={() => !method.disabled && onPaymentMethodChange(method.id)}
            disabled={method.disabled}
            className={cn(
              "relative p-6 rounded-xl border-2 transition-all duration-200",
              "hover:scale-105 active:scale-95",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
              paymentMethod === method.id
                ? `border-transparent bg-gradient-to-br ${method.color} text-white shadow-lg`
                : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md"
            )}
          >
            {/* Checkmark cuando está seleccionado */}
            {paymentMethod === method.id && (
              <div className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                <span className="text-green-600 font-bold">✓</span>
              </div>
            )}

            <div className="flex flex-col items-center gap-3">
              <div className="text-4xl">{method.icon}</div>
              <div className="text-center">
                <div className="font-bold text-lg">{method.label}</div>
                <div className={cn(
                  "text-xs mt-1",
                  paymentMethod === method.id ? "text-white/90" : "text-gray-500"
                )}>
                  {method.description}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {paymentMethod === 'CREDITO' && customer && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl">ℹ️</div>
            <div className="flex-1">
              <h4 className="font-bold text-blue-900 mb-1">Información de crédito</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <p>Cliente: <span className="font-semibold">{customer.name}</span></p>
                <p>Límite de crédito: <span className="font-semibold">${customer.creditLimit.toFixed(2)}</span></p>
                <p>Crédito usado: <span className="font-semibold">${customer.currentDebt.toFixed(2)}</span></p>
                <p>Disponible: <span className="font-semibold text-green-700">${(customer.creditLimit - customer.currentDebt).toFixed(2)}</span></p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
