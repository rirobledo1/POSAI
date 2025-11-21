// src/components/pos/touch/CartTouchOptimized.tsx
'use client';

import { ShoppingCart, X, User, Package, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';
import CartItemTouchOptimized from './CartItemTouchOptimized';
import type { CartItem, Customer } from '@/types/pos';

interface CartTouchOptimizedProps {
  cart: CartItem[];
  selectedCustomer: Customer | null;
  onUpdateQuantity: (productId: string, newQuantity: number) => void;
  onRemoveFromCart: (productId: string) => void;
  onClearCart: () => void;
  onSelectCustomer: () => void;
  onRemoveCustomer: () => void;
  className?: string;
  compact?: boolean;
}

export default function CartTouchOptimized({
  cart,
  selectedCustomer,
  onUpdateQuantity,
  onRemoveFromCart,
  onClearCart,
  onSelectCustomer,
  onRemoveCustomer,
  className,
  compact = false
}: CartTouchOptimizedProps) {

  const hasItems = cart.length > 0;
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className={cn(
      "bg-white border-l shadow-lg flex flex-col h-full",
      compact ? "w-80" : "w-80 xl:w-96",
      className
    )}>
      {/* Header del carrito - MÁS GRANDE */}
      <div className="px-4 md:px-6 py-3 md:py-4 border-b bg-gray-50 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <ShoppingCart className="h-5 w-5 md:h-6 md:w-6 text-gray-600" />
            <span className="font-semibold text-base md:text-lg text-gray-800">
              Carrito
            </span>
            {hasItems && (
              <Badge className="bg-blue-500 text-white text-sm md:text-base px-2 py-1">
                {totalItems} {totalItems === 1 ? 'item' : 'items'}
              </Badge>
            )}
          </div>
          
          {hasItems && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClearCart}
              title={`Vaciar carrito (${totalItems} productos)`}
              className="h-8 w-8 md:h-10 md:w-10 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-all active:scale-95"
            >
              <X className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Cliente seleccionado - MÁS PROMINENTE */}
      <div className="px-4 md:px-6 py-3 md:py-4 border-b bg-gray-50 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <User className="h-5 w-5 md:h-6 md:w-6 text-gray-600" />
            <span className="font-medium text-sm md:text-base text-gray-700">
              Cliente:
            </span>
          </div>
          
          {selectedCustomer ? (
            <div className="flex items-center gap-2 md:gap-3 flex-1 ml-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm md:text-base text-gray-900 truncate">
                  {selectedCustomer.name}
                </p>
                {selectedCustomer.phone && (
                  <p className="text-xs md:text-sm text-gray-500 truncate">
                    {selectedCustomer.phone}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onRemoveCustomer}
                className="h-7 w-7 md:h-8 md:w-8 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all active:scale-95"
                title="Remover cliente"
              >
                <X className="h-3 w-3 md:h-4 md:w-4" />
              </Button>
            </div>
          ) : (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onSelectCustomer}
              className="h-8 md:h-10 px-3 md:px-4 text-sm md:text-base rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-all active:scale-95"
            >
              <User className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" />
              Seleccionar Cliente
            </Button>
          )}
        </div>
      </div>

      {/* Lista de productos en el carrito */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {!hasItems ? (
          // Estado vacío - MÁS ATRACTIVO
          <div className="flex flex-col items-center justify-center h-full text-center p-6 md:p-8">
            <div className="w-20 h-20 md:w-24 md:h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <ShoppingCart className="h-10 w-10 md:h-12 md:w-12 text-gray-400" />
            </div>
            <h3 className="text-lg md:text-xl font-medium text-gray-600 mb-2">
              Carrito vacío
            </h3>
            <p className="text-sm md:text-base text-gray-500">
              Agrega productos para comenzar una venta
            </p>
          </div>
        ) : (
          // Lista de productos
          <div className="divide-y divide-gray-100">
            {cart.map((item) => (
              <CartItemTouchOptimized
                key={item.product.id}
                item={item}
                onUpdateQuantity={onUpdateQuantity}
                onRemoveFromCart={onRemoveFromCart}
                compact={compact}
                className="hover:bg-gray-50 transition-colors"
              />
            ))}
          </div>
        )}
      </div>

      {/* Resumen rápido si hay productos - MÁS VISIBLE */}
      {hasItems && (
        <div className="px-4 md:px-6 py-3 md:py-4 border-t bg-gray-50 flex-shrink-0">
          <div className="space-y-2">
            {/* Resumen de productos */}
            <div className="flex items-center justify-between text-sm md:text-base">
              <span className="flex items-center gap-2 text-gray-600">
                <Package className="h-4 w-4 md:h-5 md:w-5" />
                <span>{cart.length} producto{cart.length !== 1 ? 's' : ''}</span>
              </span>
              <span className="text-gray-600">
                {totalItems} unidad{totalItems !== 1 ? 'es' : ''}
              </span>
            </div>
            
            {/* Subtotal rápido */}
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-medium text-gray-700">
                <DollarSign className="h-4 w-4 md:h-5 md:w-5" />
                <span>Subtotal:</span>
              </span>
              <span className="font-bold text-lg md:text-xl text-green-600">
                {formatCurrency(cart.reduce((sum, item) => sum + item.subtotal, 0))}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}