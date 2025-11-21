// src/hooks/useProductsLazy.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import type { Product } from '@/types/pos';

interface UseProductsLazyOptions {
  initialLimit?: number;
  pageSize?: number;
  autoLoad?: boolean;
  enabled?: boolean;
}

interface UseProductsLazyReturn {
  products: Product[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  totalLoaded: number;
}

/**
 * Hook para carga lazy de productos con paginación
 * Optimiza el rendimiento cargando productos progresivamente
 * 
 * @param options - Opciones de configuración
 * @returns Estado y funciones para manejar productos
 * 
 * @example
 * const { products, loadMore, hasMore, loading } = useProductsLazy({
 *   initialLimit: 50,
 *   pageSize: 50
 * });
 */
export function useProductsLazy(options: UseProductsLazyOptions = {}): UseProductsLazyReturn {
  const {
    initialLimit = 50,
    pageSize = 50,
    autoLoad = true,
    enabled = true
  } = options;

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  // Usar ref para evitar múltiples llamadas simultáneas
  const loadingRef = useRef(false);
  const initialLoadDone = useRef(false);

  /**
   * Cargar productos de la API
   */
  const loadProducts = useCallback(async (pageNum: number, reset: boolean = false) => {
    // Prevenir múltiples llamadas simultáneas
    if (loadingRef.current) {
      console.log('⏸️ Ya hay una carga en progreso, saltando...');
      return;
    }

    if (!enabled) {
      console.log('⏸️ Hook deshabilitado, saltando carga...');
      return;
    }

    const startTime = performance.now(); // 🔍 Medir tiempo de inicio

    try {
      loadingRef.current = true;
      setLoading(true);
      setError(null);

      const limit = pageNum === 1 ? initialLimit : pageSize;
      const offset = pageNum === 1 ? 0 : initialLimit + (pageNum - 2) * pageSize;

      console.log(`📦 Cargando productos - Página: ${pageNum}, Límite: ${limit}, Offset: ${offset}`);
      
      const fetchStart = performance.now();
      const response = await fetch(
        `/api/products?active=true&limit=${limit}&offset=${offset}`
      );
      const fetchEnd = performance.now();
      console.log(`⏱️ Request completado en: ${(fetchEnd - fetchStart).toFixed(0)}ms`);

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const parseStart = performance.now();
      const data = await response.json();
      const parseEnd = performance.now();
      console.log(`⏱️ JSON parseado en: ${(parseEnd - parseStart).toFixed(0)}ms`);
      
      const newProducts = data.products || [];

      console.log(`✅ Productos cargados: ${newProducts.length}`);

      if (reset) {
        setProducts(newProducts);
      } else {
        setProducts(prev => {
          // Evitar duplicados
          const existingIds = new Set(prev.map(p => p.id));
          const uniqueNew = newProducts.filter((p: Product) => !existingIds.has(p.id));
          return [...prev, ...uniqueNew];
        });
      }

      // Determinar si hay más productos
      setHasMore(newProducts.length === limit);
      
      if (newProducts.length < limit) {
        console.log('✅ Todos los productos cargados');
      }

    } catch (err) {
      console.error('❌ Error cargando productos:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setHasMore(false);
    } finally {
      const endTime = performance.now();
      const totalTime = (endTime - startTime).toFixed(0);
      console.log(`⏱️ 🏁 Tiempo total de carga: ${totalTime}ms`);
      
      setLoading(false);
      loadingRef.current = false;
    }
  }, [initialLimit, pageSize, enabled]);

  /**
   * Cargar más productos (siguiente página)
   */
  const loadMore = useCallback(async () => {
    if (!hasMore || loading || loadingRef.current) {
      return;
    }

    const nextPage = page + 1;
    console.log(`📄 Cargando página ${nextPage}...`);
    await loadProducts(nextPage, false);
    setPage(nextPage);
  }, [hasMore, loading, page, loadProducts]);

  /**
   * Refrescar productos desde el inicio
   */
  const refresh = useCallback(async () => {
    console.log('🔄 Refrescando productos...');
    setPage(1);
    setHasMore(true);
    await loadProducts(1, true);
  }, [loadProducts]);

  /**
   * Carga inicial automática
   */
  useEffect(() => {
    if (autoLoad && !initialLoadDone.current && enabled) {
      console.log('🎬 Carga inicial de productos...');
      initialLoadDone.current = true;
      loadProducts(1, true);
    }
  }, [autoLoad, enabled, loadProducts]);

  return {
    products,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    totalLoaded: products.length
  };
}

export default useProductsLazy;
