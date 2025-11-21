// src/components/pos/touch/CartItemTouchOptimized.tsx
'use client';

import { useState } from 'react';
import { Package, X, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';
import { formatQuantityWithUnit } from '@/lib/units';
import type { CartItem, Product } from '@/types/pos';

interface CartItemTouchOptimizedProps {
  item: CartItem;
  onUpdateQuantity: (productId: string, newQuantity: number) => void;
  onRemoveFromCart: (productId: string) => void;
  className?: string;
  showImage?: boolean;
  compact?: boolean;
}

export default function CartItemTouchOptimized({
  item,
  onUpdateQuantity,
  onRemoveFromCart,
  className,
  showImage = true,
  compact = false
}: CartItemTouchOptimizedProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const { product, quantity, unitPrice, subtotal } = item;
  
  // Calcular si hay stock disponible para incrementar
  const canIncrement = quantity < product.stock;
  const canDecrement = quantity > 1;

  // Manejar cambios de cantidad
  const handleDecrement = () => {
    if (canDecrement) {
      onUpdateQuantity(product.id, quantity - 1);
    }
  };

  const handleIncrement = () => {
    if (canIncrement) {
      onUpdateQuantity(product.id, quantity + 1);
    }
  };

  const handleRemove = () => {
    onRemoveFromCart(product.id);
  };

  return (
    <div className={cn(
      "flex items-center gap-4 md:gap-6 p-4 md:p-6 border-b border-gray-200 bg-white hover:bg-gray-50 transition-colors",
      compact && "p-3 md:p-4",
      className
    )}>
      {/* Imagen miniatura - MÁS GRANDE COMO EN EL EJEMPLO */}
      {showImage && (
        <div className={cn(
          "bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 relative shadow-sm",
          compact ? "w-16 h-16 md:w-20 md:h-20" : "w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28"
        )}>
          {product.imageUrl && !imageError ? (
            <>
              {imageLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-3 w-3 border border-blue-500 border-t-transparent" />
                </div>
              )}
              <img 
                src={product.imageUrl} 
                alt={product.name}
                className={cn(
                  "w-full h-full object-cover",
                  imageLoading && "opacity-0"
                )}
                onLoad={() => setImageLoading(false)}
                onError={() => {
                  setImageError(true);
                  setImageLoading(false);
                }}
                loading="lazy"
              />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className={cn(
                "text-gray-400",
                compact ? "h-4 w-4" : "h-6 w-6 md:h-8 md:w-8"
              )} />
            </div>
          )}
        </div>
      )}
      
      {/* Información del producto - MÁS PROMINENTE */}
      <div className="flex-1 min-w-0">
        <h4 className={cn(
          "font-bold text-gray-900 mb-2",
          compact ? "text-sm md:text-base" : "text-base md:text-lg lg:text-xl"
        )}>
          {product.name}
        </h4>
        <div className="flex flex-col gap-1 md:gap-2">
          <p className={cn(
            "text-blue-600 font-bold",
            compact ? "text-sm md:text-base" : "text-base md:text-lg lg:text-xl"
          )}>
            {formatCurrency(unitPrice)} c/u
          </p>
          {/* Información de unidades si aplica */}
          {(product.unitQuantity && product.unitQuantity !== 1) && (
            <span className={cn(
              "text-gray-500 font-medium",
              compact ? "text-xs" : "text-sm md:text-base"
            )}>
              {formatQuantityWithUnit(quantity, product.unitQuantity, product.unitOfMeasure || 'PIECE' as any)}
            </span>
          )}
        </div>
      </div>
      
      {/* Controles de cantidad - MÁS GRANDES COMO EN EL EJEMPLO */}
      <div className="flex items-center gap-3 md:gap-4">
        <Button 
          size="lg" 
          variant="outline"
          className={cn(
            "rounded-full border-2 transition-all shadow-sm",
            compact ? "h-10 w-10 md:h-12 md:w-12" : "h-12 w-12 md:h-14 md:w-14 lg:h-16 lg:w-16",
            canDecrement 
              ? "hover:bg-red-50 hover:border-red-300 hover:text-red-600 active:scale-95" 
              : "opacity-50 cursor-not-allowed"
          )}
          onClick={handleDecrement}
          disabled={!canDecrement}
          title={canDecrement ? "Reducir cantidad" : "Cantidad mínima alcanzada"}
        >
          <Minus className={cn(
            compact ? "h-4 w-4 md:h-5 md:w-5" : "h-5 w-5 md:h-6 md:w-6 lg:h-7 lg:w-7"
          )} />
        </Button>
        
        <div className="flex flex-col items-center">
          <span className={cn(
            "font-black text-gray-900 text-center min-w-[3rem] leading-tight",
            compact ? "text-lg md:text-xl" : "text-xl md:text-2xl lg:text-3xl"
          )}>
            {quantity}
          </span>
          {!compact && (
            <span className="text-xs md:text-sm text-gray-500 font-medium">
              de {product.stock}
            </span>
          )}
        </div>
        
        <Button 
          size="lg" 
          variant="outline"
          className={cn(
            "rounded-full border-2 transition-all shadow-sm",
            compact ? "h-10 w-10 md:h-12 md:w-12" : "h-12 w-12 md:h-14 md:w-14 lg:h-16 lg:w-16",
            canIncrement 
              ? "hover:bg-green-50 hover:border-green-300 hover:text-green-600 active:scale-95" 
              : "opacity-50 cursor-not-allowed"
          )}
          onClick={handleIncrement}
          disabled={!canIncrement}
          title={canIncrement ? "Aumentar cantidad" : `Stock máximo alcanzado (${product.stock})`}
        >
          <Plus className={cn(
            compact ? "h-4 w-4 md:h-5 md:w-5" : "h-5 w-5 md:h-6 md:w-6 lg:h-7 lg:w-7"
          )} />
        </Button>
      </div>
      
      {/* Total y botón eliminar - MÁS PROMINENTE */}
      <div className="flex flex-col items-end gap-2 md:gap-3">
        <span className={cn(
          "font-black text-green-600 text-right leading-tight",
          compact ? "text-lg md:text-xl" : "text-xl md:text-2xl lg:text-3xl"
        )}>
          {formatCurrency(subtotal)}
        </span>
        
        <Button 
          size="lg" 
          variant="ghost"
          className={cn(
            "rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all active:scale-95 shadow-sm",
            compact ? "h-8 w-8 md:h-10 md:w-10" : "h-10 w-10 md:h-12 md:w-12 lg:h-14 lg:w-14"
          )}
          onClick={handleRemove}
          title={`Eliminar ${product.name} del carrito`}
        >
          <X className={cn(
            compact ? "h-4 w-4 md:h-5 md:w-5" : "h-5 w-5 md:h-6 md:w-6 lg:h-7 lg:w-7"
          )} />
        </Button>
      </div>
    </div>
  );
}