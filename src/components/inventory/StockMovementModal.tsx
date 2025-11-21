'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ArrowUpIcon,
  ArrowDownIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

interface Product {
  id: number
  name: string
  category: string
  currentStock: number
  minStock: number
  maxStock: number
  unitPrice: number
  totalValue: number
  lastMovement: string
  supplier?: string
}

interface StockMovement {
  productId: number
  type: 'entrada' | 'salida'
  quantity: number
  reason: string
  notes?: string
  unitCost?: number
}

interface StockMovementModalProps {
  product: Product
  isOpen: boolean
  onClose: () => void
  onSubmit: (movement: StockMovement) => void
}

export function StockMovementModal({
  product,
  isOpen,
  onClose,
  onSubmit
}: StockMovementModalProps) {
  const [movementType, setMovementType] = useState<'entrada' | 'salida'>('entrada')
  const [quantity, setQuantity] = useState<number>(0)
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [unitCost, setUnitCost] = useState<number>(product.unitPrice)
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!quantity || quantity <= 0 || !reason.trim()) {
      alert('Por favor complete todos los campos requeridos')
      return
    }

    if (movementType === 'salida' && quantity > product.currentStock) {
      alert('No hay suficiente stock para realizar esta salida')
      return
    }

    setLoading(true)
    
    const movement: StockMovement = {
      productId: product.id,
      type: movementType,
      quantity,
      reason: reason.trim(),
      notes: notes.trim() || undefined,
      unitCost: movementType === 'entrada' ? unitCost : undefined
    }

    try {
      await onSubmit(movement)
    } catch (error) {
      console.error('Error processing movement:', error)
      alert('Error al procesar el movimiento')
    } finally {
      setLoading(false)
    }
  }

  const newStock = movementType === 'entrada' 
    ? product.currentStock + quantity
    : product.currentStock - quantity

  const getStockAlert = () => {
    if (newStock <= 0) {
      return { type: 'error', message: 'El producto quedará sin stock' }
    } else if (newStock <= product.minStock) {
      return { type: 'warning', message: 'El stock quedará por debajo del mínimo' }
    } else if (newStock > product.maxStock) {
      return { type: 'warning', message: 'El stock excederá el máximo recomendado' }
    }
    return null
  }

  const stockAlert = getStockAlert()

  const reasonOptions = {
    entrada: [
      'Compra a proveedor',
      'Devolución de cliente',
      'Ajuste de inventario',
      'Producción interna',
      'Transferencia de sucursal'
    ],
    salida: [
      'Venta a cliente',
      'Devolución a proveedor',
      'Producto dañado',
      'Ajuste de inventario',
      'Transferencia a sucursal',
      'Uso interno'
    ]
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold">Movimiento de Stock</h2>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <XMarkIcon className="h-4 w-4" />
            </Button>
          </div>

          <div className="p-6 space-y-6">
            {/* Product Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">{product.name}</CardTitle>
                <p className="text-xs text-gray-500">{product.category}</p>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Stock Actual</p>
                    <p className="font-semibold text-lg">{product.currentStock}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Precio Unitario</p>
                    <p className="font-medium">${product.unitPrice.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Movement Type */}
            <div className="space-y-3">
              <Label>Tipo de Movimiento</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={movementType === 'entrada' ? 'default' : 'outline'}
                  onClick={() => setMovementType('entrada')}
                  className="flex-1 flex items-center gap-2"
                >
                  <ArrowUpIcon className="h-4 w-4" />
                  Entrada
                </Button>
                <Button
                  type="button"
                  variant={movementType === 'salida' ? 'default' : 'outline'}
                  onClick={() => setMovementType('salida')}
                  className="flex-1 flex items-center gap-2"
                >
                  <ArrowDownIcon className="h-4 w-4" />
                  Salida
                </Button>
              </div>
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <Label htmlFor="quantity">Cantidad *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity || ''}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                placeholder="Ingrese la cantidad"
                required
              />
              {quantity > 0 && (
                <div className="text-sm text-gray-600">
                  Nuevo stock: <span className="font-semibold">{newStock}</span>
                </div>
              )}
            </div>

            {/* Unit Cost (for entries) */}
            {movementType === 'entrada' && (
              <div className="space-y-2">
                <Label htmlFor="unitCost">Costo Unitario</Label>
                <Input
                  id="unitCost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={unitCost || ''}
                  onChange={(e) => setUnitCost(parseFloat(e.target.value) || 0)}
                  placeholder="Costo por unidad"
                />
                {quantity > 0 && unitCost > 0 && (
                  <div className="text-sm text-gray-600">
                    Costo total: <span className="font-semibold">
                      ${(quantity * unitCost).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason">Motivo *</Label>
              <select
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Seleccione un motivo</option>
                {reasonOptions[movementType].map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notas adicionales</Label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
                placeholder="Observaciones o comentarios adicionales..."
              />
            </div>

            {/* Stock Alert */}
            {stockAlert && (
              <div className={`flex items-center gap-2 p-3 rounded-md ${
                stockAlert.type === 'error' 
                  ? 'bg-red-50 text-red-700' 
                  : 'bg-yellow-50 text-yellow-700'
              }`}>
                <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm">{stockAlert.message}</span>
              </div>
            )}

            {/* Preview */}
            {quantity > 0 && reason && (
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CheckCircleIcon className="h-4 w-4 text-blue-600" />
                    Resumen del Movimiento
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Tipo:</span>
                    <Badge variant={movementType === 'entrada' ? 'default' : 'secondary'}>
                      {movementType.charAt(0).toUpperCase() + movementType.slice(1)}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Cantidad:</span>
                    <span className="font-medium">{quantity} unidades</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Stock resultante:</span>
                    <span className="font-medium">{newStock}</span>
                  </div>
                  {movementType === 'entrada' && unitCost > 0 && (
                    <div className="flex justify-between">
                      <span>Valor total:</span>
                      <span className="font-medium text-green-600">
                        ${(quantity * unitCost).toLocaleString()}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="flex gap-3 p-6 border-t bg-gray-50">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={loading || !quantity || !reason.trim()}
            >
              {loading ? 'Procesando...' : 'Confirmar Movimiento'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
