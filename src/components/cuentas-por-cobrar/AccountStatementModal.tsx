// src/components/cuentas-por-cobrar/AccountStatementModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, FileText, Printer, Download } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  currentDebt: number;
  creditLimit: number;
}

interface Payment {
  id: string;
  amount: number;
  paymentMethod: string;
  referenceNumber?: string;
  notes?: string;
  previousDebt: number;
  newDebt: number;
  createdAt: string;
  userName: string;
}

interface AccountStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
}

export default function AccountStatementModal({ isOpen, onClose, customer }: AccountStatementModalProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && customer) {
      loadPaymentHistory();
    }
  }, [isOpen, customer]);

  const loadPaymentHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/customer-payments?customerId=${customer.id}`);
      
      if (response.ok) {
        const data = await response.json();
        setPayments(data.payments || []);
      }
    } catch (error) {
      console.error('Error cargando historial:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Estado de Cuenta
          </h3>
          <div className="flex gap-2">
            <Button onClick={handlePrint} variant="outline" size="sm">
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
            <Button onClick={onClose} variant="ghost" size="sm">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {/* Info del cliente */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-xl font-bold mb-2">{customer.name}</h4>
            {customer.email && <p className="text-sm text-gray-600">📧 {customer.email}</p>}
            {customer.phone && <p className="text-sm text-gray-600">📱 {customer.phone}</p>}
            
            <div className="mt-4 grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Saldo Actual</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(customer.currentDebt)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Límite de Crédito</p>
                <p className="text-xl font-semibold">{formatCurrency(customer.creditLimit)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Crédito Disponible</p>
                <p className="text-xl font-semibold text-green-600">
                  {formatCurrency(Math.max(0, customer.creditLimit - customer.currentDebt))}
                </p>
              </div>
            </div>
          </div>

          {/* Historial de pagos */}
          <div>
            <h5 className="text-lg font-semibold mb-3">Historial de Pagos</h5>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-gray-600 mt-2">Cargando historial...</p>
              </div>
            ) : payments.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">No hay pagos registrados</p>
              </div>
            ) : (
              <div className="space-y-3">
                {payments.map((payment) => (
                  <div key={payment.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-green-600 text-lg">
                          {formatCurrency(payment.amount)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(payment.createdAt).toLocaleDateString('es-MX', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          Método: {payment.paymentMethod}
                        </p>
                        {payment.referenceNumber && (
                          <p className="text-sm text-gray-600">
                            Ref: {payment.referenceNumber}
                          </p>
                        )}
                        {payment.notes && (
                          <p className="text-sm text-gray-500 italic mt-1">{payment.notes}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          Registrado por: {payment.userName}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Saldo anterior:</p>
                        <p className="font-semibold">{formatCurrency(payment.previousDebt)}</p>
                        <p className="text-sm text-gray-600 mt-1">Nuevo saldo:</p>
                        <p className="font-semibold text-red-600">{formatCurrency(payment.newDebt)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Nota: Próximamente mostraremos también el historial de compras */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 <strong>Próximamente:</strong> Aquí también se mostrará el historial de compras a crédito
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
