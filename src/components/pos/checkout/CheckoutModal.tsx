// src/components/pos/checkout/CheckoutModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { X, CreditCard, Banknote, Smartphone, DollarSign, Store, Truck, Package as PackageIcon, MapPin, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';
import type { PaymentMethod, Customer, DeliveryAddress } from '@/types/pos';
import { DeliveryType } from '@/types/pos';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  subtotal: number;
  tax: number;
  deliveryFee: number;
  total: number;
  onConfirm: (data: CheckoutData) => void;
}

export interface CheckoutData {
  paymentMethod: PaymentMethod;
  deliveryType: DeliveryType;
  deliveryFee: number;
  deliveryAddressId?: string;
  cashReceived?: number;
}

export default function CheckoutModal({
  isOpen,
  onClose,
  customer,
  subtotal,
  tax,
  deliveryFee: initialDeliveryFee,
  total: initialTotal,
  onConfirm
}: CheckoutModalProps) {
  const [step, setStep] = useState<'payment' | 'confirm'>('payment');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('EFECTIVO');
  const [deliveryType, setDeliveryType] = useState<DeliveryType>(DeliveryType.PICKUP);
  const [deliveryFee, setDeliveryFee] = useState(initialDeliveryFee);
  const [cashReceived, setCashReceived] = useState('');
  
  // Estados para direcciones
  const [customerAddresses, setCustomerAddresses] = useState<DeliveryAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  // Calcular total con envío
  const total = subtotal + tax + deliveryFee;
  const cashReceivedAmount = parseFloat(cashReceived) || 0;
  const change = paymentMethod === 'EFECTIVO' ? Math.max(0, cashReceivedAmount - total) : 0;

  // Cargar direcciones del cliente cuando se abre el modal o cambia el cliente
  useEffect(() => {
    if (isOpen && customer && deliveryType !== DeliveryType.PICKUP) {
      loadCustomerAddresses(customer.id);
    }
  }, [isOpen, customer, deliveryType]);

  // Resetear estados cuando se cierra el modal
  useEffect(() => {
    if (!isOpen) {
      setStep('payment');
      setPaymentMethod('EFECTIVO');
      setDeliveryType(DeliveryType.PICKUP);
      setDeliveryFee(0);
      setCashReceived('');
      setSelectedAddressId('');
      setCustomerAddresses([]);
    }
  }, [isOpen]);

  const loadCustomerAddresses = async (customerId: string) => {
    setLoadingAddresses(true);
    try {
      const response = await fetch(`/api/delivery/addresses/${customerId}`);
      if (response.ok) {
        const data = await response.json();
        setCustomerAddresses(data.addresses || []);
        
        // Auto-seleccionar dirección principal si existe
        const defaultAddress = data.addresses?.find((addr: DeliveryAddress) => addr.isDefault);
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id);
        }
      }
    } catch (error) {
      console.error('Error cargando direcciones:', error);
    } finally {
      setLoadingAddresses(false);
    }
  };

  const handlePaymentMethodSelect = (method: PaymentMethod) => {
    setPaymentMethod(method);
    if (method !== 'EFECTIVO') {
      setCashReceived('');
    }
  };

  const handleDeliveryTypeSelect = (type: DeliveryType) => {
    setDeliveryType(type);
    setSelectedAddressId(''); // Resetear dirección al cambiar tipo
    
    // Calcular costo de envío
    if (type === DeliveryType.PICKUP) {
      setDeliveryFee(0);
    } else if (type === DeliveryType.LOCAL) {
      setDeliveryFee(50);
      // Cargar direcciones si hay cliente
      if (customer) {
        loadCustomerAddresses(customer.id);
      }
    } else {
      setDeliveryFee(150);
      // Cargar direcciones si hay cliente
      if (customer) {
        loadCustomerAddresses(customer.id);
      }
    }
  };

  const handleContinue = () => {
    if (paymentMethod === 'EFECTIVO') {
      setStep('confirm');
    } else {
      // Para otros métodos de pago, proceder directamente
      onConfirm({
        paymentMethod,
        deliveryType,
        deliveryFee,
        deliveryAddressId: deliveryType !== DeliveryType.PICKUP ? selectedAddressId : undefined
      });
    }
  };

  const handleConfirm = () => {
    onConfirm({
      paymentMethod,
      deliveryType,
      deliveryFee,
      deliveryAddressId: deliveryType !== DeliveryType.PICKUP ? selectedAddressId : undefined,
      cashReceived: cashReceivedAmount
    });
  };

  const canContinue = () => {
    // Validar método de pago
    if (paymentMethod === 'CREDITO' && !customer) {
      return false;
    }
    
    // Validar dirección si es envío
    if (deliveryType !== DeliveryType.PICKUP) {
      if (!customer) return false;
      if (!selectedAddressId) return false;
    }
    
    return true;
  };

  const canConfirm = paymentMethod !== 'EFECTIVO' || cashReceivedAmount >= total;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Panel deslizante desde la derecha - MÁS ANCHO */}
      <div className="relative bg-white h-full w-full md:w-[800px] lg:w-[900px] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header compacto */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex-shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold">
              {step === 'payment' ? '💳 Procesar Venta' : '💵 Confirmar Efectivo'}
            </h2>
            {customer && (
              <span className="text-sm text-blue-100">
                Cliente: <span className="font-semibold">{customer.name}</span>
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full h-8 w-8 p-0"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content - Layout Horizontal Optimizado */}
        <div className="flex-1 overflow-y-auto">
          {step === 'payment' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 h-full">
              {/* Columna Izquierda - Métodos y Entrega */}
              <div className="space-y-6">
                {/* Método de Pago */}
                <div>
                  <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Método de Pago
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { method: 'EFECTIVO', label: 'Efectivo', emoji: '💵' },
                      { method: 'TARJETA', label: 'Tarjeta', emoji: '💳' },
                      { method: 'TRANSFERENCIA', label: 'Transfer', emoji: '📱' },
                      { method: 'CREDITO', label: 'Crédito', emoji: '💰' }
                    ].map(({ method, label, emoji }) => {
                      const isDisabled = method === 'CREDITO' && !customer;
                      return (
                        <button
                          key={method}
                          onClick={() => !isDisabled && handlePaymentMethodSelect(method as PaymentMethod)}
                          disabled={isDisabled}
                          className={cn(
                            "flex items-center justify-center gap-3 p-4 rounded-lg border-2 transition-all",
                            "hover:scale-105 active:scale-95",
                            paymentMethod === method
                              ? "border-blue-600 bg-blue-50 shadow-md"
                              : "border-gray-200 hover:border-blue-300 bg-white",
                            isDisabled && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          <span className="text-2xl">{emoji}</span>
                          <span className={cn(
                            "text-sm font-semibold",
                            paymentMethod === method ? "text-blue-700" : "text-gray-700"
                          )}>
                            {label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {paymentMethod === 'CREDITO' && !customer && (
                    <p className="text-xs text-red-600 mt-2">
                      Selecciona un cliente para pago a crédito
                    </p>
                  )}
                </div>

                {/* Tipo de Entrega */}
                <div>
                  <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Tipo de Entrega
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { type: DeliveryType.PICKUP, label: 'Tienda', emoji: '🏪' },
                      { type: DeliveryType.LOCAL, label: 'Local', emoji: '🚛' },
                      { type: DeliveryType.FORANEO, label: 'Foráneo', emoji: '🚚' }
                    ].map(({ type, label, emoji }) => {
                      const needsCustomer = type !== DeliveryType.PICKUP && !customer;
                      return (
                        <button
                          key={type}
                          onClick={() => !needsCustomer && handleDeliveryTypeSelect(type)}
                          disabled={needsCustomer}
                          className={cn(
                            "flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all",
                            "hover:scale-105 active:scale-95",
                            deliveryType === type
                              ? "border-green-600 bg-green-50 shadow-md"
                              : "border-gray-200 hover:border-green-300 bg-white",
                            needsCustomer && "opacity-50 cursor-not-allowed"
                          )}
                          title={needsCustomer ? "Selecciona un cliente primero" : label}
                        >
                          <span className="text-2xl mb-1">{emoji}</span>
                          <span className={cn(
                            "text-xs font-semibold",
                            deliveryType === type ? "text-green-700" : "text-gray-700"
                          )}>
                            {label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Selector de Dirección */}
                {deliveryType !== DeliveryType.PICKUP && customer && (
                  <div>
                    <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Dirección de Entrega
                    </h3>
                    
                    {loadingAddresses ? (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto"></div>
                        <p className="text-sm text-gray-600 mt-2">Cargando direcciones...</p>
                      </div>
                    ) : customerAddresses.length > 0 ? (
                      <select
                        value={selectedAddressId}
                        onChange={(e) => setSelectedAddressId(e.target.value)}
                        className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none text-sm"
                      >
                        <option value="">Seleccionar dirección...</option>
                        {customerAddresses.map((address) => (
                          <option key={address.id} value={address.id}>
                            {address.addressLine1}, {address.city}
                            {address.isDefault && ' ⭐ (Principal)'}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                        <MapPin className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 mb-2">
                          No hay direcciones registradas
                        </p>
                        <p className="text-xs text-gray-500">
                          Se pueden agregar desde la sección de clientes
                        </p>
                      </div>
                    )}
                    
                    {!selectedAddressId && customerAddresses.length > 0 && (
                      <p className="text-xs text-red-600 mt-2">
                        Por favor selecciona una dirección de entrega
                      </p>
                    )}
                  </div>
                )}

                {deliveryType !== DeliveryType.PICKUP && !customer && (
                  <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      ⚠️ Debes seleccionar un cliente antes de elegir un tipo de entrega con envío
                    </p>
                  </div>
                )}
              </div>

              {/* Columna Derecha - Resumen */}
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border-2 border-gray-200 sticky top-0">
                  <h3 className="text-base font-bold text-gray-900 mb-4">📋 Resumen de Venta</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-semibold">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">IVA (16%)</span>
                      <span className="font-semibold">{formatCurrency(tax)}</span>
                    </div>
                    {deliveryFee > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Envío</span>
                        <span className="font-semibold text-blue-600">{formatCurrency(deliveryFee)}</span>
                      </div>
                    )}
                    <div className="border-t-2 border-gray-300 pt-3 mt-3">
                      <div className="flex justify-between items-baseline">
                        <span className="text-lg font-bold text-gray-900">TOTAL</span>
                        <span className="text-3xl font-black text-green-600">
                          {formatCurrency(total)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {customer && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-xs text-gray-600">Cliente:</p>
                      <p className="font-semibold text-sm">{customer.name}</p>
                    </div>
                  )}

                  {paymentMethod && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-600">Método de pago:</p>
                      <p className="font-semibold text-sm">{paymentMethod}</p>
                    </div>
                  )}

                  {deliveryType !== DeliveryType.PICKUP && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-600">Tipo de entrega:</p>
                      <p className="font-semibold text-sm">{deliveryType}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Pantalla de Confirmación de Efectivo - Centrada */
            <div className="flex items-center justify-center h-full p-6">
              <div className="w-full max-w-md space-y-6">
                <div className="text-center">
                  <div className="text-7xl mb-4">💵</div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Pago en Efectivo
                  </h3>
                  <p className="text-4xl font-black text-green-600 mb-6">
                    {formatCurrency(total)}
                  </p>
                </div>

                {/* Input de Efectivo Recibido */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Efectivo Recibido
                  </label>
                  <Input
                    type="number"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    placeholder="0.00"
                    className="text-3xl font-bold text-center h-20 text-blue-600"
                    step="0.01"
                    min={total}
                    autoFocus
                  />
                </div>

                {/* Cambio */}
                {cashReceivedAmount >= total && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200">
                    <div className="text-center">
                      <div className="text-sm text-green-700 font-medium mb-1">
                        💵 CAMBIO A ENTREGAR
                      </div>
                      <div className="text-5xl font-black text-green-600">
                        {formatCurrency(change)}
                      </div>
                    </div>
                  </div>
                )}

                {/* Botones rápidos de denominaciones */}
                <div className="grid grid-cols-4 gap-2">
                  {[100, 200, 500, 1000].map((amount) => (
                    <Button
                      key={amount}
                      variant="outline"
                      size="lg"
                      onClick={() => setCashReceived(amount.toString())}
                      className="text-sm font-semibold h-12"
                    >
                      ${amount}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer con botones - FIJO */}
        <div className="border-t border-gray-200 p-4 bg-gray-50 flex-shrink-0">
          <div className="flex gap-3 max-w-4xl mx-auto">
            {/* Botón Cancelar/Cerrar - siempre visible */}
            <Button
              variant="outline"
              onClick={step === 'confirm' ? () => setStep('payment') : onClose}
              className="flex-1 h-12 text-base font-semibold"
            >
              {step === 'confirm' ? '← Atrás' : '✕ Cancelar'}
            </Button>
            <Button
              onClick={step === 'payment' ? handleContinue : handleConfirm}
              disabled={step === 'payment' ? !canContinue() : !canConfirm}
              className={cn(
                "flex-1 h-12 text-base font-bold rounded-xl",
                "bg-gradient-to-r from-green-500 to-green-600",
                "hover:from-green-600 hover:to-green-700",
                "disabled:from-gray-300 disabled:to-gray-400",
                "flex items-center justify-center gap-2"
              )}
            >
              {step === 'payment' ? (
                <>
                  Continuar <ArrowRight className="h-5 w-5" />
                </>
              ) : (
                '✓ Confirmar Venta'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
