// src/components/pos/touch/ProductCardTouchOptimized.tsx
'use client';

import { useState } from 'react';
import { Package, Star, AlertTriangle, ShoppingCart, ExternalLink, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';
import { formatProductUnit } from '@/lib/units';
import type { Product } from '@/types/pos';

interface ProductCardTouchOptimizedProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onToggleFavorite?: (productId: string) => void;
  onEditProduct?: (product: Product) => void;
  isFavorite?: boolean;
  reason?: string;
  isHotProduct?: boolean;
  isHighMargin?: boolean;
  className?: string;
}

export default function ProductCardTouchOptimized({
  product,
  onAddToCart,
  onToggleFavorite,
  onEditProduct,
  isFavorite = false,
  reason,
  isHotProduct = false,
  isHighMargin = false,
  className
}: ProductCardTouchOptimizedProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // Determinar si el producto está disponible
  const isAvailable = product.stock > 0;
  const isLowStock = product.stock <= product.minStock && product.stock > 0;
  const isOutOfStock = product.stock <= 0;

  // Manejar click en la tarjeta (agregar al carrito)
  const handleCardClick = () => {
    if (isAvailable) {
      onAddToCart(product);
    }
  };

  // Prevenir propagación en botones secundarios
  const stopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all duration-200 touch-manipulation select-none relative",
        "border hover:shadow-lg active:scale-[0.98]",
        "h-56 md:h-60", // ALTURA AÚN MÁS GRANDE para asegurar que todo se vea
        isAvailable 
          ? "hover:border-blue-400 active:bg-gray-50 bg-white" 
          : "opacity-70 cursor-not-allowed border-gray-300 bg-gray-50",
        isFavorite && "border-yellow-400 bg-yellow-50",
        className
      )}
      onClick={handleCardClick}
    >
      {/* Overlay sin stock */}
      {isOutOfStock && (
        <div className="absolute inset-0 bg-red-500 bg-opacity-80 flex items-center justify-center z-10 rounded">
          <span className="text-white font-bold text-sm">SIN STOCK</span>
        </div>
      )}

      {/* Indicadores en esquina superior */}
      <div className="absolute top-1 right-1 z-5 flex flex-col gap-1">
        {isFavorite && (
          <div className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
            <Star className="h-3 w-3 text-white fill-current" />
          </div>
        )}
        {reason && (
          <Badge className="bg-blue-500 text-white text-xs px-1 py-0.5 rounded">
            {reason}
          </Badge>
        )}
      </div>

      <CardContent className="p-3 md:p-4 h-full flex flex-col">
        {/* Imagen del producto - BALANCEADA */}
        <div className="w-full h-24 md:h-28 bg-gray-100 rounded mb-2 overflow-hidden flex-shrink-0 relative flex items-center justify-center">
          {product.imageUrl && !imageError ? (
            <img 
              src={product.imageUrl} 
              alt={product.name}
              className="max-w-full max-h-full object-contain transition-transform hover:scale-105"
              onLoad={() => setImageLoading(false)}
              onError={() => setImageError(true)}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
              <Package className="h-8 w-8 md:h-10 md:w-10 text-gray-400" />
            </div>
          )}
        </div>
        
        {/* Información del producto */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Nombre del producto - LEGIBLE Y CLARO */}
          <div className="mb-1">
            <h3 
              className="font-bold text-sm leading-tight text-gray-900 overflow-hidden"
              style={{ 
                display: '-webkit-box', 
                WebkitLineClamp: 2, 
                WebkitBoxOrient: 'vertical',
                lineHeight: '1.15',
                minHeight: '2.3rem'
              }}
              title={product.name}
            >
              {product.name}
            </h3>
            
            {/* Código de barras pequeño */}
            {product.barcode && (
              <div className="text-xs text-gray-500 font-mono mt-0.5 truncate">
                {product.barcode}
              </div>
            )}
          </div>

          {/* Información adicional compacta */}
          {(product.unitQuantity && product.unitQuantity !== 1) || product.isBulkSale ? (
            <div className="text-xs text-gray-600 mb-1">
              {formatProductUnit(product.unitQuantity || 1, product.unitOfMeasure || 'PIECE' as any)}
              {product.isBulkSale && " • A granel"}
            </div>
          ) : null}
          
          {/* Precio BALANCEADO - visible pero no exagerado */}
          <div className="mb-1 flex-shrink-0">
            <div className="text-base md:text-lg font-bold text-blue-600 leading-none">
              {formatCurrency(product.price)}
            </div>
            {product.profitMargin && (
              <div className="text-xs text-green-600 font-medium">
                +{product.profitMargin}%
              </div>
            )}
          </div>
          
          {/* SPACER para empujar los botones hacia abajo */}
          <div className="flex-1"></div>
          
          {/* Stock y botones - SIEMPRE EN LA PARTE INFERIOR */}
          <div className="flex items-center justify-between flex-shrink-0 mt-2">
            {/* Stock badge */}
            <Badge 
              variant={isOutOfStock ? "destructive" : isLowStock ? "secondary" : "outline"}
              className={cn(
                "text-xs font-bold px-2 py-1 flex-shrink-0",
                isLowStock && !isOutOfStock && "bg-yellow-100 text-yellow-800 border-yellow-300",
                !isOutOfStock && !isLowStock && "bg-green-100 text-green-800 border-green-300"
              )}
            >
              Stock: {product.stock}
            </Badge>
            
            {/* Botones de acción */}
            <div className="flex gap-1 flex-shrink-0">
              {/* Ventas si hay */}
              {(product as any).totalSold > 0 && (
                <div className="text-xs text-orange-600 font-bold bg-orange-100 px-1 py-0.5 rounded">
                  🔥{(product as any).totalSold}
                </div>
              )}
              
              {/* Botón favorito */}
              {onToggleFavorite && (
                <Button
                  size="sm"
                  variant="ghost"
                  className={cn(
                    "h-7 w-7 p-0 rounded flex-shrink-0",
                    isFavorite 
                      ? "text-yellow-500 bg-yellow-100" 
                      : "text-gray-400 hover:text-yellow-500 hover:bg-yellow-50"
                  )}
                  onClick={(e) => {
                    stopPropagation(e);
                    onToggleFavorite(product.id);
                  }}
                  title={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                >
                  <Star className={cn("h-4 w-4", isFavorite && "fill-current")} />
                </Button>
              )}

              {/* Botón editar */}
              {onEditProduct && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 rounded text-blue-500 hover:text-blue-600 hover:bg-blue-50 flex-shrink-0"
                  onClick={(e) => {
                    stopPropagation(e);
                    onEditProduct(product);
                  }}
                  title="Editar producto"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}