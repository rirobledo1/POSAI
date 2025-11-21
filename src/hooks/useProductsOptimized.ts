// src/hooks/useProductsOptimized.ts
import { useState, useEffect, useCallback } from 'react';
import { Product, Category } from '@/types/pos';

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface Filters {
  search: string;
  categoryId: string;
  active: boolean;
  hasStock: boolean;
}

interface UseProductsOptimizedResult {
  products: Product[];
  categories: Category[];
  pagination: PaginationInfo;
  filters: Filters;
  loading: boolean;
  error: string | null;
  featuredOnly: boolean;
  
  // Actions
  setSearch: (search: string) => void;
  setCategoryFilter: (categoryId: string) => void;
  setActiveFilter: (active: boolean) => void;
  setStockFilter: (hasStock: boolean) => void;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  refreshProducts: () => Promise<void>;
  clearFilters: () => void;
  setFeaturedOnly: (featured: boolean) => void;
  loadAllProducts: () => void;
}

export function useProductsOptimized(initialFeaturedOnly = false): UseProductsOptimizedResult {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredOnly, setFeaturedOnly] = useState(initialFeaturedOnly);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });
  const [filters, setFilters] = useState<Filters>({
    search: '',
    categoryId: '',
    active: true,
    hasStock: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchDebounce, setSearchDebounce] = useState<NodeJS.Timeout | null>(null);

  // Función para construir la URL con parámetros
  const buildApiUrl = useCallback((customFilters?: Partial<Filters>, customPagination?: Partial<PaginationInfo>) => {
    const params = new URLSearchParams();
    
    const finalFilters = { ...filters, ...customFilters };
    const finalPagination = { ...pagination, ...customPagination };

    if (finalFilters.search.trim()) {
      params.append('search', finalFilters.search.trim());
    }
    if (finalFilters.categoryId) {
      params.append('categoryId', finalFilters.categoryId);
    }
    if (finalFilters.active) {
      params.append('active', 'true');
    }
    if (finalFilters.hasStock) {
      params.append('hasStock', 'true');
    }
    
    params.append('page', finalPagination.page.toString());
    params.append('limit', finalPagination.limit.toString());

    return `/api/products?${params.toString()}`;
  }, [filters, pagination]);

  // Función para cargar productos
  const loadProducts = useCallback(async (customFilters?: Partial<Filters>, customPagination?: Partial<PaginationInfo>) => {
    try {
      setLoading(true);
      setError(null);

      let url: string;
      
      if (featuredOnly && !customFilters?.search && !customFilters?.categoryId) {
        // Usar endpoint de productos destacados cuando esté en modo featured y sin filtros específicos
        const params = new URLSearchParams();
        params.append('limit', '50'); // Límite para productos destacados
        params.append('includeStock', customFilters?.hasStock ? 'true' : 'false');
        url = `/api/products/featured?${params.toString()}`;
        console.log('🌟 Cargando productos destacados:', url);
      } else {
        // Usar endpoint normal para búsquedas o cuando no esté en modo featured
        url = buildApiUrl(customFilters, customPagination);
        console.log('🔄 Cargando productos normales:', url);
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setProducts(data.products || []);
        
        // Para productos destacados, simular paginación
        if (data.isFeatured) {
          setPagination({
            page: 1,
            limit: data.count,
            total: data.count,
            totalPages: 1,
            hasNext: false,
            hasPrev: false
          });
        } else {
          setPagination(data.pagination);
        }
        
        console.log('✅ Productos cargados:', {
          products: data.products?.length || 0,
          total: data.isFeatured ? data.count : data.pagination?.total || 0,
          page: data.isFeatured ? 1 : data.pagination?.page || 1,
          mode: data.isFeatured ? 'featured' : 'normal'
        });
      } else {
        throw new Error(data.error || 'Error cargando productos');
      }
    } catch (err) {
      console.error('❌ Error cargando productos:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [buildApiUrl, featuredOnly]);

  // Función para cargar categorías
  const loadCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/categories?active=true');
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (err) {
      console.error('Error cargando categorías:', err);
    }
  }, []);

  // Cargar datos iniciales
  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  // Función para actualizar búsqueda con debounce
  const setSearch = useCallback((search: string) => {
    setFilters(prev => ({ ...prev, search }));
    
    // Limpiar timeout anterior
    if (searchDebounce) {
      clearTimeout(searchDebounce);
    }

    // Configurar nuevo timeout
    const timeout = setTimeout(() => {
      loadProducts({ search }, { page: 1 });
    }, 500); // 500ms de debounce

    setSearchDebounce(timeout);
  }, [searchDebounce, loadProducts]);

  // Funciones para actualizar filtros
  const setCategoryFilter = useCallback((categoryId: string) => {
    const newFilters = { ...filters, categoryId };
    setFilters(newFilters);
    loadProducts(newFilters, { page: 1 });
  }, [filters, loadProducts]);

  const setActiveFilter = useCallback((active: boolean) => {
    const newFilters = { ...filters, active };
    setFilters(newFilters);
    loadProducts(newFilters, { page: 1 });
  }, [filters, loadProducts]);

  const setStockFilter = useCallback((hasStock: boolean) => {
    const newFilters = { ...filters, hasStock };
    setFilters(newFilters);
    loadProducts(newFilters, { page: 1 });
  }, [filters, loadProducts]);

  // Funciones para paginación
  const setPage = useCallback((page: number) => {
    const newPagination = { ...pagination, page };
    setPagination(newPagination);
    loadProducts(undefined, newPagination);
  }, [pagination, loadProducts]);

  const setLimit = useCallback((limit: number) => {
    const newPagination = { ...pagination, limit, page: 1 };
    setPagination(newPagination);
    loadProducts(undefined, newPagination);
  }, [pagination, loadProducts]);

  // Función para refrescar productos
  const refreshProducts = useCallback(async () => {
    await loadProducts();
  }, [loadProducts]);

  // Función para limpiar filtros
  const clearFilters = useCallback(() => {
    const defaultFilters = {
      search: '',
      categoryId: '',
      active: true,
      hasStock: false
    };
    setFilters(defaultFilters);
    loadProducts(defaultFilters, { page: 1 });
  }, [loadProducts]);

  // Cleanup del debounce
  useEffect(() => {
    return () => {
      if (searchDebounce) {
        clearTimeout(searchDebounce);
      }
    };
  }, [searchDebounce]);

  // Función para cambiar a modo todos los productos
  const loadAllProducts = useCallback(() => {
    setFeaturedOnly(false);
    loadProducts();
  }, [loadProducts]);

  // Efecto para recargar productos cuando cambia el modo featured
  useEffect(() => {
    loadProducts();
  }, [featuredOnly]);

  return {
    products,
    categories,
    pagination,
    filters,
    loading,
    error,
    featuredOnly,
    setSearch,
    setCategoryFilter,
    setActiveFilter,
    setStockFilter,
    setPage,
    setLimit,
    refreshProducts,
    clearFilters,
    setFeaturedOnly,
    loadAllProducts
  };
}
