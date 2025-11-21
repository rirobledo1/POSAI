// src/components/cuentas-por-cobrar/ApplyPaymentModal.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, CreditCard, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useNotifications } from '@/components/ui/NotificationProvider';

interface Customer {
  id: string;
  name: string;
  currentDebt: number;
  creditLimit: number;
}

interface ApplyPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
  onSuccess: () => void;
}

export default function ApplyPaymentModal({ isOpen, onClose, customer, onSuccess }: ApplyPaymentModalProps) {
  const { showSuccess, showError } = useNotifications();
  
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('EFECTIVO');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  if (!isOpen) return null;

  const amountNum = parseFloat(amount) || 0;
  const newDebt = customer.currentDebt - amountNum;
  const isValid = amountNum > 0 && amountNum <= customer.currentDebt;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValid) {
      showError('Monto inválido', 'Verifica el monto del pago');
      return;
    }

    try {
      setProcessing(true);

      const response = await fetch('/api/customer-payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customer.id,
          amount: amountNum,
          paymentMethod,
          referenceNumber: referenceNumber || undefined,
          notes: notes || undefined
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al procesar el pago');
      }

      showSuccess('Pago aplicado', `Se aplicó el pago de ${formatCurrency(amountNum)} correctamente`);
      onSuccess();
      
      // Limpiar form
      setAmount('');
      setPaymentMethod('EFECTIVO');
      setReferenceNumber('');
      setNotes('');
      
    } catch (error) {
      console.error('Error aplicando pago:', error);
      showError('Error', error instanceof Error ? error.message : 'No se pudo procesar el pago');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md mx-4">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Aplicar Pago
          </h3>
          <Button onClick={onClose} variant="ghost" size="sm">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Info del cliente */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm font-medium text-gray-700">Cliente:</p>
            <p className="text-lg font-semibold">{customer.name}</p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-gray-600">Saldo Actual:</p>
                <p className="text-lg font-bold text-red-600">{formatCurrency(customer.currentDebt)}</p>
              </div>
              <div>
                <p className="text-gray-600">Nuevo Saldo:</p>
                <p className={`text-lg font-bold ${newDebt > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                  {formatCurrency(Math.max(0, newDebt))}
                </p>
              </div>
            </div>
          </div>

          {/* Monto */}
          <div>
            <Label>Monto del Pago *</Label>
            <div className="relative mt-1">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="number"
                step="0.01"
                min="0"
                max={customer.currentDebt}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-10"
                placeholder="0.00"
                required
              />
            </div>
            {amount && !isValid && (
              <p className="text-sm text-red-600 mt-1">
                El monto no puede ser mayor al saldo actual
              </p>
            )}
          </div>

          {/* Método de pago */}
          <div>
            <Label>Método de Pago *</Label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full mt-1 p-2 border rounded-md"
              required
            >
              <option value="EFECTIVO">Efectivo</option>
              <option value="TARJETA">Tarjeta</option>
              <option value="TRANSFERENCIA">Transferencia</option>
              <option value="CHEQUE">Cheque</option>
            </select>
          </div>

          {/* Número de referencia */}
          {paymentMethod !== 'EFECTIVO' && (
            <div>
              <Label>Número de Referencia</Label>
              <Input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="Últimos 4 dígitos, folio, etc."
              />
            </div>
          )}

          {/* Notas */}
          <div>
            <Label>Notas (opcional)</Label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full mt-1 p-2 border rounded-md"
              rows={2}
              placeholder="Observaciones adicionales..."
            />
          </div>

          {/* Botones */}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={processing}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={!isValid || processing}
            >
              {processing ? 'Procesando...' : `Aplicar ${formatCurrency(amountNum)}`}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
