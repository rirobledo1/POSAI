// src/components/pos/SaleSuccessModal.tsx
'use client';

import { useState } from 'react';
import { X, Printer, Mail, FileText, MessageCircle, CheckCircle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';

interface SaleSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  saleData: {
    saleId: string;
    folio: string;
    total: number;
    customerName?: string;
    customerPhone?: string;
  };
  onPrintTicket: (saleId: string) => void;
  onSendEmail?: (saleId: string) => void;
  onSendWhatsApp?: (saleId: string) => void;
}

export default function SaleSuccessModal({
  isOpen,
  onClose,
  saleData,
  onPrintTicket,
  onSendEmail,
  onSendWhatsApp
}: SaleSuccessModalProps) {
  const [printing, setPrinting] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);
  const [hasPrinted, setHasPrinted] = useState(false);

  if (!isOpen) return null;

  console.log('📝 Modal de éxito renderizado con datos:', saleData);

  const handlePrint = async () => {
    console.log('🖨️ Iniciando impresión desde modal con saleId:', saleData.saleId);
    setPrinting(true);
    try {
      await onPrintTicket(saleData.saleId);
      setHasPrinted(true);
      console.log('✅ Impresión completada exitosamente');
    } catch (error) {
      console.error('❌ Error en handlePrint:', error);
    } finally {
      setPrinting(false);
    }
  };

  const handleSendEmail = async () => {
    if (!onSendEmail) return;
    setSendingEmail(true);
    try {
      await onSendEmail(saleData.saleId);
    } finally {
      setSendingEmail(false);
    }
  };

  const handleSendWhatsApp = async () => {
    if (!onSendWhatsApp) return;
    console.log('📱 Iniciando WhatsApp desde modal con saleId:', saleData.saleId);
    setSendingWhatsApp(true);
    try {
      await onSendWhatsApp(saleData.saleId);
      console.log('✅ WhatsApp enviado exitosamente');
    } catch (error) {
      console.error('❌ Error en handleSendWhatsApp:', error);
    } finally {
      setSendingWhatsApp(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Panel deslizante desde la derecha - MÁS ANCHO */}
      <div className="relative bg-white h-full w-full md:w-[700px] lg:w-[800px] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header con animación de éxito - COMPACTO */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 text-center relative overflow-hidden flex-shrink-0">
          {/* Efecto de confeti animado */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-1/4 w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="absolute top-0 left-1/2 w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="absolute top-0 left-3/4 w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>

          <div className="relative z-10 flex items-center justify-center gap-4">
            <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center">
              <CheckCircle className="h-9 w-9 text-green-500" />
            </div>
            <div className="text-left">
              <h2 className="text-2xl font-bold">
                ¡Venta Exitosa!
              </h2>
              <p className="text-green-100 text-base">
                Folio: <span className="font-bold">{saleData.folio}</span>
              </p>
            </div>
          </div>

          {/* Botón cerrar */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute top-3 right-3 text-white hover:bg-white/20 rounded-full h-8 w-8 p-0"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content optimizado sin scroll */}
        <div className="flex-1 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 h-full">
            {/* Columna Izquierda - Opciones de acción */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900">
                ¿Qué deseas hacer con esta venta?
              </h3>

              {/* Opciones de acción - GRID 2x2 */}
              <div className="grid grid-cols-2 gap-4">
                {/* Imprimir Ticket */}
                <button
                  onClick={handlePrint}
                  disabled={printing}
                  className={cn(
                    "flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all",
                    "hover:scale-105 active:scale-95 min-h-[140px]",
                    "border-blue-300 hover:border-blue-500 bg-blue-50 hover:bg-blue-100",
                    printing && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <Printer className="h-10 w-10 text-blue-600 mb-3" />
                  <span className="font-bold text-blue-900 text-base mb-1">
                    {printing ? 'Imprimiendo...' : 'Imprimir Ticket'}
                  </span>
                  <span className="text-xs text-blue-600">
                    Ticket físico
                  </span>
                </button>

                {/* Enviar por WhatsApp */}
                <button
                  onClick={handleSendWhatsApp}
                  disabled={sendingWhatsApp || !saleData.customerPhone}
                  className={cn(
                    "flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all",
                    "hover:scale-105 active:scale-95 min-h-[140px]",
                    saleData.customerPhone
                      ? "border-green-300 hover:border-green-500 bg-green-50 hover:bg-green-100"
                      : "border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed",
                    sendingWhatsApp && "opacity-50 cursor-not-allowed"
                  )}
                  title={!saleData.customerPhone ? 'El cliente no tiene teléfono registrado' : ''}
                >
                  <MessageCircle className={cn(
                    "h-10 w-10 mb-3",
                    saleData.customerPhone ? "text-green-600" : "text-gray-400"
                  )} />
                  <span className={cn(
                    "font-bold text-base mb-1",
                    saleData.customerPhone ? "text-green-900" : "text-gray-500"
                  )}>
                    {sendingWhatsApp ? 'Enviando...' : 'WhatsApp'}
                  </span>
                  <span className={cn(
                    "text-xs",
                    saleData.customerPhone ? "text-green-600" : "text-gray-400"
                  )}>
                    {saleData.customerPhone ? 'Enviar ticket' : 'Sin teléfono'}
                  </span>
                </button>

                {/* Enviar por Email */}
                <button
                  onClick={handleSendEmail}
                  disabled={sendingEmail || !onSendEmail}
                  className={cn(
                    "flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all",
                    "hover:scale-105 active:scale-95 min-h-[140px]",
                    onSendEmail
                      ? "border-purple-300 hover:border-purple-500 bg-purple-50 hover:bg-purple-100"
                      : "border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed",
                    sendingEmail && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <Mail className={cn(
                    "h-10 w-10 mb-3",
                    onSendEmail ? "text-purple-600" : "text-gray-400"
                  )} />
                  <span className={cn(
                    "font-bold text-base mb-1",
                    onSendEmail ? "text-purple-900" : "text-gray-500"
                  )}>
                    {sendingEmail ? 'Enviando...' : 'Enviar Email'}
                  </span>
                  <span className={cn(
                    "text-xs",
                    onSendEmail ? "text-purple-600" : "text-gray-400"
                  )}>
                    {onSendEmail ? 'Correo electrónico' : 'Próximamente'}
                  </span>
                </button>

                {/* Facturar (Próximamente) */}
                <button
                  disabled
                  className="flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed min-h-[140px]"
                >
                  <FileText className="h-10 w-10 text-gray-400 mb-3" />
                  <span className="font-bold text-gray-500 text-base mb-1">
                    Facturar
                  </span>
                  <span className="text-xs text-gray-400">
                    Próximamente
                  </span>
                </button>
              </div>

              {/* Info adicional */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                <div className="flex gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-blue-900">
                    <p className="font-medium mb-1">Venta registrada correctamente</p>
                    <p className="text-blue-700">
                      {hasPrinted 
                        ? 'Ticket impreso. Puedes reimprimir usando el botón de abajo.' 
                        : 'El inventario se ha actualizado. Puedes imprimir el ticket cuando lo necesites.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Columna Derecha - Resumen */}
            <div>
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border-2 border-gray-200 sticky top-0">
                <h3 className="text-lg font-bold text-gray-900 mb-4">📋 Resumen</h3>
                <div className="space-y-3">
                  <div className="text-center py-4 bg-white rounded-lg">
                    <span className="text-sm text-gray-600 block mb-1">Total de la venta</span>
                    <span className="text-4xl font-black text-green-600">
                      {formatCurrency(saleData.total)}
                    </span>
                  </div>
                  {saleData.customerName && (
                    <div className="pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-600">Cliente:</p>
                      <p className="font-semibold text-sm">{saleData.customerName}</p>
                      {saleData.customerPhone && (
                        <p className="text-xs text-gray-500 mt-1">📱 {saleData.customerPhone}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Botón para continuar - FIJO */}
        <div className="p-4 border-t border-gray-200 flex-shrink-0 bg-white space-y-2">
          {/* Botón Reimprimir (solo si ya imprimió) */}
          {hasPrinted && (
            <Button
              onClick={handlePrint}
              disabled={printing}
              variant="outline"
              className="w-full h-10 text-sm font-semibold rounded-xl border-2 border-blue-600 text-blue-600 hover:bg-blue-50 flex items-center justify-center gap-2"
            >
              <Printer className="h-4 w-4" />
              {printing ? 'Imprimiendo...' : 'Reimprimir Ticket'}
            </Button>
          )}
          <Button
            onClick={onClose}
            className="w-full h-12 text-base font-bold rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
          >
            Continuar Vendiendo
          </Button>
        </div>
      </div>
    </div>
  );
}
