// src/components/pos/CompactCartFooter.tsx
'use client';

import { ShoppingCart, User, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { CartItem, Customer } from '@/types/pos';

interface CompactCartFooterProps {
  cart: CartItem[];
  selectedCustomer: Customer | null;
  total: number;
  onCheckout: () => void;
  onSelectCustomer: () => void;
  onRemoveCustomer: () => void;
  onViewCart: () => void;
}

export default function CompactCartFooter({
  cart,
  selectedCustomer,
  total,
  onCheckout,
  onSelectCustomer,
  onRemoveCustomer,
  onViewCart
}: CompactCartFooterProps) {
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-lg z-50">
      <div className="max-w-screen-2xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Sección Izquierda: Cliente */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <User className="h-5 w-5 text-gray-500" />
            {selectedCustomer ? (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">
                  {selectedCustomer.name}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRemoveCustomer}
                  className="h-6 w-6 p-0 rounded-full hover:bg-red-100"
                >
                  <X className="h-3 w-3 text-red-500" />
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={onSelectCustomer}
                className="h-8 text-xs"
              >
                Seleccionar cliente
              </Button>
            )}
          </div>

          {/* Sección Centro: Resumen del carrito */}
          <div 
            className="flex items-center gap-4 flex-1 cursor-pointer hover:bg-gray-50 px-4 py-2 rounded-lg transition-colors"
            onClick={onViewCart}
          >
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-blue-600" />
              <Badge 
                variant="default" 
                className="bg-blue-600 text-white font-bold"
              >
                {itemCount}
              </Badge>
            </div>
            
            <div className="flex-1 hidden md:flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {cart.length} producto{cart.length !== 1 ? 's' : ''}
              </span>
              <span className="text-gray-400">•</span>
              <span className="text-lg font-bold text-gray-900">
                {formatCurrency(total)}
              </span>
            </div>
          </div>

          {/* Sección Derecha: Total y Botón Cobrar */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="text-right hidden sm:block">
              <div className="text-xs text-gray-500">Total a cobrar</div>
              <div className="text-2xl font-black text-green-600">
                {formatCurrency(total)}
              </div>
            </div>

            <Button
              onClick={onCheckout}
              disabled={cart.length === 0}
              className={cn(
                "h-12 px-8 text-base font-bold rounded-xl shadow-lg transition-all",
                "bg-gradient-to-r from-green-500 to-green-600",
                "hover:from-green-600 hover:to-green-700",
                "disabled:from-gray-300 disabled:to-gray-400",
                "transform hover:scale-105 active:scale-95"
              )}
            >
              <span className="hidden sm:inline">💰 COBRAR</span>
              <span className="sm:hidden">COBRAR</span>
            </Button>
          </div>
        </div>

        {/* Barra de progreso sutil cuando hay items */}
        {cart.length > 0 && (
          <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-300"
              style={{ width: `${Math.min((itemCount / 10) * 100, 100)}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
