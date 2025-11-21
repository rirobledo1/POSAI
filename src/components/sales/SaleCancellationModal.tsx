import React, { useState } from 'react'
import { X, AlertTriangle, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useSales, Sale } from '@/hooks/useSales'

interface SaleCancellationModalProps {
  sale: Sale | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

type CancellationType = 'FULL' | 'PARTIAL'

const CANCELLATION_REASONS = [
  'Producto defectuoso',
  'Cliente no satisfecho',
  'Error en el precio',
  'Error en el producto',
  'Devolución por garantía',
  'Cambio de producto',
  'Error del sistema',
  'Otro'
]

export default function SaleCancellationModal({
  sale,
  isOpen,
  onClose,
  onSuccess
}: SaleCancellationModalProps) {
  const [cancellationType, setCancellationType] = useState<CancellationType>('FULL')
  const [reason, setReason] = useState('')
  const [customReason, setCustomReason] = useState('')
  const [refundAmount, setRefundAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { cancelSale, loading } = useSales()

  // Resetear form cuando se abre/cierra
  React.useEffect(() => {
    if (isOpen && sale) {
      setCancellationType('FULL')
      setReason('')
      setCustomReason('')
      setRefundAmount(sale.total.toString())
      setNotes('')
    }
  }, [isOpen, sale])

  // Actualizar monto cuando cambia el tipo
  React.useEffect(() => {
    if (sale) {
      if (cancellationType === 'FULL') {
        setRefundAmount(sale.total.toString())
      } else {
        setRefundAmount('')
      }
    }
  }, [cancellationType, sale])

  const handleCancel = async () => {
    if (!sale) return

    // Validaciones básicas del lado cliente
    const finalReason = reason === 'Otro' ? customReason : reason
    if (!finalReason.trim()) {
      return // El hook ya mostrará el error
    }

    const refundAmountNum = parseFloat(refundAmount)
    if (isNaN(refundAmountNum) || refundAmountNum < 0) {
      return // El hook ya mostrará el error
    }

    if (refundAmountNum > sale.total) {
      return // El hook ya mostrará el error
    }

    try {
      await cancelSale({
        saleId: sale.id,
        cancellationType,
        reason: finalReason,
        refundAmount: refundAmountNum,
        notes: notes.trim() || undefined
      })

      onSuccess()
      onClose()
    } catch (error) {
      // El error ya fue manejado por el hook
      console.error('Error cancelando venta:', error)
    }
  }

  if (!isOpen || !sale) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            <h2 className="text-xl font-semibold text-gray-900">
              Cancelar Venta
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Sale Info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-gray-900 mb-2">Información de la Venta</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Folio:</span>
              <span className="ml-2 font-medium">{sale.folio}</span>
            </div>
            <div>
              <span className="text-gray-500">Total:</span>
              <span className="ml-2 font-medium">${sale.total.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-gray-500">Estado:</span>
              <span className="ml-2 font-medium">{sale.status}</span>
            </div>
            <div>
              <span className="text-gray-500">Cliente:</span>
              <span className="ml-2 font-medium">{sale.customer?.name || 'Mostrador'}</span>
            </div>
          </div>
        </div>

        {/* Cancellation Type */}
        <div className="mb-6">
          <Label className="text-base font-medium mb-3 block">Tipo de Cancelación</Label>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <input
                type="radio"
                id="full"
                name="cancellationType"
                value="FULL"
                checked={cancellationType === 'FULL'}
                onChange={(e) => setCancellationType(e.target.value as CancellationType)}
                className="h-4 w-4 text-blue-600"
              />
              <label htmlFor="full" className="text-sm">
                <span className="font-medium">Cancelación completa</span>
                <span className="text-gray-500 block">Se cancelará toda la venta y se restituirá el inventario</span>
              </label>
            </div>
            <div className="flex items-center space-x-3">
              <input
                type="radio"
                id="partial"
                name="cancellationType"
                value="PARTIAL"
                checked={cancellationType === 'PARTIAL'}
                onChange={(e) => setCancellationType(e.target.value as CancellationType)}
                className="h-4 w-4 text-blue-600"
              />
              <label htmlFor="partial" className="text-sm">
                <span className="font-medium">Reembolso parcial</span>
                <span className="text-gray-500 block">Solo se reembolsará parte del monto, sin restituir inventario</span>
              </label>
            </div>
          </div>
        </div>

        {/* Refund Amount */}
        <div className="mb-6">
          <Label htmlFor="refundAmount" className="text-base font-medium mb-2 block">
            <DollarSign className="h-4 w-4 inline mr-1" />
            Monto de Reembolso
          </Label>
          <Input
            id="refundAmount"
            type="number"
            step="0.01"
            min="0"
            max={sale.total}
            value={refundAmount}
            onChange={(e) => setRefundAmount(e.target.value)}
            placeholder="0.00"
            className="text-lg"
            disabled={cancellationType === 'FULL'}
          />
          <p className="text-sm text-gray-500 mt-1">
            Máximo: ${sale.total.toFixed(2)}
          </p>
        </div>

        {/* Reason */}
        <div className="mb-6">
          <Label className="text-base font-medium mb-3 block">Razón de la Cancelación *</Label>
          <div className="space-y-2">
            {CANCELLATION_REASONS.map((reasonOption) => (
              <div key={reasonOption} className="flex items-center space-x-3">
                <input
                  type="radio"
                  id={reasonOption}
                  name="reason"
                  value={reasonOption}
                  checked={reason === reasonOption}
                  onChange={(e) => setReason(e.target.value)}
                  className="h-4 w-4 text-blue-600"
                />
                <label htmlFor={reasonOption} className="text-sm">
                  {reasonOption}
                </label>
              </div>
            ))}
          </div>

          {reason === 'Otro' && (
            <div className="mt-3">
              <Input
                placeholder="Escriba la razón personalizada..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                required
              />
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="mb-6">
          <Label htmlFor="notes" className="text-base font-medium mb-2 block">
            Notas Adicionales (Opcional)
          </Label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Información adicional sobre la cancelación..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            rows={3}
          />
        </div>

        {/* Warning */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-yellow-800 mb-1">
                ⚠️ Esta acción no se puede deshacer
              </p>
              <p className="text-yellow-700">
                {cancellationType === 'FULL' 
                  ? 'La venta será marcada como cancelada y el inventario será restituido automáticamente.'
                  : 'Se creará un registro de reembolso parcial sin afectar el inventario.'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleCancel}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {loading ? 'Procesando...' : 'Confirmar Cancelación'}
          </Button>
        </div>
      </div>
    </div>
  )
}