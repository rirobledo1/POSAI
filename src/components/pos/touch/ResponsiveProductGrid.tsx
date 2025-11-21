// src/components/pos/touch/ResponsiveProductGrid.tsx
'use client';

import { Search, Package, Plus, Star, Grid3x3, AlertTriangle, Loader2 } from 'lucide-react';
import { useRef, useEffect, useMemo } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import ProductCardTouchOptimized from './ProductCardTouchOptimized';
import type { Product } from '@/types/pos';

interface ResponsiveProductGridProps {
  products: Product[];
  allProducts: Product[];
  featuredProducts: Product[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onAddToCart: (product: Product) => void;
  onToggleFavorite?: (productId: string) => void;
  onEditProduct?: (product: Product) => void;
  onCreateProduct?: (searchTerm?: string) => void;
  isFavorite?: (productId: string) => boolean;
  showAllProducts: boolean;
  onShowFeatured: () => void;
  onShowAll: () => void;
  favoriteProducts: string[];
  loading?: boolean;
  error?: string;
  className?: string;
  hasMore?: boolean;
  onLoadMore?: () => void;
  loadingMore?: boolean;
}

export default function ResponsiveProductGrid({
  products,
  allProducts,
  featuredProducts,
  searchTerm,
  onSearchChange,
  onAddToCart,
  onToggleFavorite,
  onEditProduct,
  onCreateProduct,
  isFavorite,
  showAllProducts,
  onShowFeatured,
  onShowAll,
  favoriteProducts,
  loading = false,
  error,
  className,
  hasMore = false,
  onLoadMore,
  loadingMore = false
}: ResponsiveProductGridProps) {
  // Ref para el observador de scroll infinito
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null);
  
  // Debouncing de búsqueda - solo filtrar después de 300ms de inactividad
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Función para obtener grid columns responsivo - ESTILO SICARX ESPACIOSO
  const getGridCols = () => {
    // Basado en SICARX: tarjetas más grandes con mejor espaciado
    // 2xl: 5 columnas en pantallas muy grandes (1536px+)
    // xl: 4 columnas en desktop grande (1280px+) 
    // lg: 3 columnas en laptops (1024px+)
    // md: 3 columnas en tablets (768px+)
    // sm: 2 columnas en tablets pequeñas (640px+)
    // default: 2 columnas en móviles
    return "grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5";
  };

  // Filtrar productos según búsqueda (con debouncing)
  // useMemo previene re-filtrados innecesarios
  const filteredProducts = useMemo(() => {
    if (!debouncedSearchTerm) return products;
    
    const searchLower = debouncedSearchTerm.toLowerCase();
    return products.filter(product =>
      product.name.toLowerCase().includes(searchLower) ||
      product.barcode?.toLowerCase().includes(searchLower) ||
      product.description?.toLowerCase().includes(searchLower)
    );
  }, [products, debouncedSearchTerm]);
  
  // Intersection Observer para scroll infinito
  useEffect(() => {
    if (!onLoadMore || !hasMore || loadingMore) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        // Cuando el elemento trigger es visible, cargar más productos
        if (entries[0].isIntersecting) {
          console.log('🔽 Scroll trigger visible, cargando más productos...');
          onLoadMore();
        }
      },
      {
        // Activar cuando el elemento está 10% visible
        threshold: 0.1,
        // Margen para activar antes de llegar al final
        rootMargin: '100px'
      }
    );
    
    const currentRef = loadMoreTriggerRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }
    
    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [onLoadMore, hasMore, loadingMore]);

  return (
    <div className={cn("flex flex-col h-full bg-gray-50", className)}>
      {/* Header con buscador - SIN PADDING EXTRA */}
      <div className="bg-white px-3 py-2 border-b flex-shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          {/* Buscador compacto */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 pr-9 text-sm h-9 rounded-lg border-2 focus:ring-2 focus:ring-blue-500 transition-all"
            />
            {searchTerm && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onSearchChange('')}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 rounded-full hover:bg-gray-100"
              >
                <span className="text-lg text-gray-400">×</span>
              </Button>
            )}
          </div>
          
          {/* Filtros con iconos */}
          <div className="flex items-center gap-2">
            <Button
              variant={!showAllProducts ? 'default' : 'outline'}
              size="sm"
              onClick={onShowFeatured}
              disabled={loading}
              className="h-9 px-3 text-sm font-medium rounded-lg transition-all active:scale-95 flex items-center gap-1.5"
              title={`Productos destacados (${featuredProducts.length})`}
            >
              <Star className="h-4 w-4" />
              <span className="hidden sm:inline">Destacados</span>
              <span className="inline sm:hidden">{featuredProducts.length}</span>
            </Button>
            
            <Button
              variant={showAllProducts ? 'default' : 'outline'}
              size="sm"
              onClick={onShowAll}
              disabled={loading}
              className="h-9 px-3 text-sm font-medium rounded-lg transition-all active:scale-95 flex items-center gap-1.5"
              title={`Todos los productos (${allProducts.length})`}
            >
              <Grid3x3 className="h-4 w-4" />
              <span className="hidden sm:inline">Todos</span>
              <span className="inline sm:hidden">{allProducts.length}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Alertas de error */}
      {error && (
        <div className="p-4 md:p-6 flex-shrink-0">
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-5 w-5" />
            <AlertDescription className="text-red-700 text-base">
              {error}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Grid de productos - SIN PADDING EXCESIVO */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 min-h-0 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400">
        {loading ? (
          // Loading skeleton - MÁS GRANDE
          <div className={cn("grid gap-4", getGridCols())}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded p-3 md:p-4 shadow-sm h-56 md:h-60">
                <div className="w-full h-24 md:h-28 bg-gray-200 rounded mb-2 animate-pulse" />
                <div className="h-4 bg-gray-200 rounded mb-1 animate-pulse" />
                <div className="h-3 bg-gray-200 rounded w-2/3 mb-2 animate-pulse" />
                <div className="h-5 bg-gray-200 rounded mb-2 animate-pulse" />
                <div className="flex justify-between items-center mb-2">
                  <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded w-8 animate-pulse" />
                </div>
                <div className="h-8 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          // Estado vacío - MÁS GRANDE Y CLARO
          <div className="flex flex-col items-center justify-center h-64 md:h-80 text-center">
            <Search className="h-16 w-16 md:h-20 md:w-20 text-gray-400 mx-auto mb-4" />
            {searchTerm ? (
              <div className="space-y-4">
                <p className="text-gray-500 text-lg md:text-xl mb-4">
                  No se encontró "{searchTerm}"
                </p>
                {onCreateProduct && (
                  <Button
                    onClick={() => onCreateProduct(searchTerm)}
                    size="lg"
                    className="bg-green-600 hover:bg-green-700 text-white h-12 md:h-14 px-6 md:px-8 text-base md:text-lg rounded-xl transition-all active:scale-95"
                  >
                    <Plus className="h-5 w-5 md:h-6 md:w-6 mr-2" />
                    Agregar Producto Nuevo
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-gray-500 text-lg md:text-xl mb-4">
                  No hay productos registrados
                </p>
                {onCreateProduct && (
                  <Button
                    onClick={() => onCreateProduct()}
                    size="lg"
                    className="bg-green-600 hover:bg-green-700 text-white h-12 md:h-14 px-6 md:px-8 text-base md:text-lg rounded-xl transition-all active:scale-95"
                  >
                    <Plus className="h-5 w-5 md:h-6 md:w-6 mr-2" />
                    Agregar Producto Nuevo
                  </Button>
                )}
              </div>
            )}
          </div>
        ) : (
          // Grid de productos principal
          <div className={cn("grid gap-4", getGridCols())}>
            {filteredProducts.map((product) => {
              const isHotProduct = (product as any).totalSold > 0;
              const isHighMargin = product.profitMargin && product.profitMargin > 25;
              const reason = (product as any).reason;
              
              return (
                <ProductCardTouchOptimized
                  key={product.id}
                  product={product}
                  onAddToCart={onAddToCart}
                  onToggleFavorite={onToggleFavorite}
                  onEditProduct={onEditProduct}
                  isFavorite={isFavorite ? isFavorite(product.id) : false}
                  reason={reason}
                  isHotProduct={isHotProduct}
                  isHighMargin={isHighMargin}
                  className="transform transition-transform hover:scale-[1.02] active:scale-[0.98]"
                />
              );
            })}
          </div>
        )}
        
        {/* Trigger para scroll infinito */}
        {hasMore && !loading && (
          <div ref={loadMoreTriggerRef} className="flex justify-center py-4">
            {loadingMore ? (
              <div className="flex items-center gap-2 text-gray-500">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Cargando más productos...</span>
              </div>
            ) : (
              <div className="text-sm text-gray-400">Desplázate para cargar más</div>
            )}
          </div>
        )}
        
        {/* Mensaje cuando ya no hay más productos */}
        {!hasMore && filteredProducts.length > 0 && (
          <div className="flex justify-center py-4 text-sm text-gray-400">
            ✅ Todos los productos cargados ({filteredProducts.length})
          </div>
        )}
        
        {/* Espaciado adicional reducido */}
        <div className="h-4" />
      </div>
    </div>
  );
}