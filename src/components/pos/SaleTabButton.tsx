// src/components/pos/SaleTabButton.tsx
import React, { useState } from 'react'
import { X, Edit2, User, ShoppingCart, DollarSign, Copy } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { SaleTab } from '@/hooks/useMultiSales'

interface SaleTabButtonProps {
  tab: SaleTab
  isActive: boolean
  onSelect: () => void
  onClose: () => void
  onRename: (newName: string) => void
  onDuplicate: () => void
  canClose: boolean
}

export default function SaleTabButton({
  tab,
  isActive,
  onSelect,
  onClose,
  onRename,
  onDuplicate,
  canClose
}: SaleTabButtonProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(tab.name)
  const [showActions, setShowActions] = useState(false)

  // Calcular estadísticas de la venta
  const itemCount = tab.cart.length
  const totalAmount = tab.cart.reduce((sum, item) => {
    // Asegurar que los valores sean números válidos
    const subtotal = (typeof item.subtotal === 'number' && !isNaN(item.subtotal)) 
      ? item.subtotal 
      : (item.quantity * item.unitPrice)
    return sum + subtotal
  }, 0)
  const hasCustomer = tab.customer !== null
  const hasItems = itemCount > 0

  // Manejar guardar nombre
  const handleSaveName = () => {
    if (editName.trim() && editName.trim() !== tab.name) {
      onRename(editName.trim())
    } else {
      setEditName(tab.name) // Restaurar nombre original
    }
    setIsEditing(false)
  }

  // Manejar cancelar edición
  const handleCancelEdit = () => {
    setEditName(tab.name)
    setIsEditing(false)
  }

  // Manejar teclas en edición
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveName()
    } else if (e.key === 'Escape') {
      handleCancelEdit()
    }
  }

  return (
    <div 
      className={`
        relative group flex items-center min-w-[180px] max-w-[220px] border-r border-gray-200
        ${isActive 
          ? 'bg-white border-b-2 border-b-blue-500 shadow-sm' 
          : 'bg-gray-50 hover:bg-gray-100 cursor-pointer'
        }
      `}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Contenido principal del tab */}
      <div 
        className="flex-1 px-2 py-1.5 min-w-0"
        onClick={!isEditing ? onSelect : undefined}
      >
        {/* Nombre de la venta */}
        <div className="flex items-center gap-1.5 mb-0.5">
          {isEditing ? (
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleSaveName}
              onKeyDown={handleKeyDown}
              className="h-5 text-xs font-medium"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <>
              <span className={`text-xs font-medium truncate ${isActive ? 'text-gray-900' : 'text-gray-700'}`}>
                {tab.name}
              </span>
              {showActions && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 opacity-60 hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsEditing(true)
                  }}
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
              )}
            </>
          )}
        </div>

        {/* Indicadores de estado */}
        <div className="flex items-center gap-1.5 text-xs">
          {/* Indicador de cliente */}
          <div className={`flex items-center gap-1 ${hasCustomer ? 'text-green-600' : 'text-gray-400'}`}>
            <User className="h-3 w-3" />
            <span>{hasCustomer ? tab.customer!.name.split(' ')[0] : 'Sin cliente'}</span>
          </div>

          {/* Indicador de productos */}
          <div className={`flex items-center gap-1 ${hasItems ? 'text-blue-600' : 'text-gray-400'}`}>
            <ShoppingCart className="h-3 w-3" />
            <span>{itemCount}</span>
          </div>

          {/* Total */}
          {hasItems && (
            <div className="flex items-center gap-1 text-green-600">
              <DollarSign className="h-3 w-3" />
              <span>${(totalAmount || 0).toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Badges de estado - REMOVIDOS PARA COMPACTAR */}
        {/* Los badges ocupan mucho espacio vertical */}
      </div>

      {/* Acciones del tab */}
      <div className={`flex items-center gap-1 px-2 transition-opacity ${
        showActions || isActive ? 'opacity-100' : 'opacity-0'
      }`}>
        {/* Botón duplicar */}
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 hover:bg-blue-100 hover:text-blue-600"
          onClick={(e) => {
            e.stopPropagation()
            onDuplicate()
          }}
          title="Duplicar venta"
        >
          <Copy className="h-3 w-3" />
        </Button>

        {/* Botón cerrar */}
        {canClose && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }}
            title="Cerrar venta"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Indicador de venta activa */}
      {isActive && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
      )}

      {/* Indicador de venta con productos */}
      {hasItems && !isActive && (
        <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full" />
      )}
    </div>
  )
}