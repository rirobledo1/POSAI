// src/hooks/useCategoriesOptimized.ts
import { useState, useEffect, useCallback } from 'react';
import { Category } from '@/types/pos';

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
  active: boolean | null; // Permitir null para mostrar todas las categorías
}

interface UseCategoriesOptimizedResult {
  categories: Category[];
  pagination: PaginationInfo;
  filters: Filters;
  loading: boolean;
  error: string | null;
  
  // Actions
  setSearch: (search: string) => void;
  setActiveFilter: (active: boolean | null) => void; // Permitir null
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  refreshCategories: () => Promise<void>;
  clearFilters: () => void;
}

export function useCategoriesOptimized(): UseCategoriesOptimizedResult {
  const [categories, setCategories] = useState<Category[]>([]);
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
    active: null // Cambiar a null para mostrar todas las categorías por defecto
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
    if (finalFilters.active !== null) {
      params.append('active', finalFilters.active.toString());
    }
    
    params.append('page', finalPagination.page.toString());
    params.append('limit', finalPagination.limit.toString());

    return `/api/categories?${params.toString()}`;
  }, [filters, pagination]);

  // Función para cargar categorías
  const loadCategories = useCallback(async (customFilters?: Partial<Filters>, customPagination?: Partial<PaginationInfo>) => {
    try {
      setLoading(true);
      setError(null);

      const url = buildApiUrl(customFilters, customPagination);
      console.log('🔄 Cargando categorías:', url);

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setCategories(data.categories || []);
        setPagination(data.pagination);
        
        console.log('✅ Categorías cargadas:', {
          categories: data.categories?.length || 0,
          total: data.pagination?.total || 0,
          page: data.pagination?.page || 1
        });
      } else {
        throw new Error(data.error || 'Error cargando categorías');
      }
    } catch (err) {
      console.error('❌ Error cargando categorías:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [buildApiUrl]);

  // Cargar datos iniciales
  useEffect(() => {
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
      loadCategories({ search }, { page: 1 });
    }, 500); // 500ms de debounce

    setSearchDebounce(timeout);
  }, [searchDebounce, loadCategories]);

  // Función para actualizar filtro de estado activo
  const setActiveFilter = useCallback((active: boolean | null) => {
    const newFilters = { ...filters, active };
    setFilters(newFilters);
    loadCategories(newFilters, { page: 1 });
  }, [filters, loadCategories]);

  // Funciones para paginación
  const setPage = useCallback((page: number) => {
    const newPagination = { ...pagination, page };
    setPagination(newPagination);
    loadCategories(undefined, newPagination);
  }, [pagination, loadCategories]);

  const setLimit = useCallback((limit: number) => {
    const newPagination = { ...pagination, limit, page: 1 };
    setPagination(newPagination);
    loadCategories(undefined, newPagination);
  }, [pagination, loadCategories]);

  // Función para refrescar categorías
  const refreshCategories = useCallback(async () => {
    await loadCategories();
  }, [loadCategories]);

  // Función para limpiar filtros
  const clearFilters = useCallback(() => {
    const defaultFilters = {
      search: '',
      active: null // Mostrar todas las categorías por defecto
    };
    setFilters(defaultFilters);
    loadCategories(defaultFilters, { page: 1 });
  }, [loadCategories]);

  // Cleanup del debounce
  useEffect(() => {
    return () => {
      if (searchDebounce) {
        clearTimeout(searchDebounce);
      }
    };
  }, [searchDebounce]);

  return {
    categories,
    pagination,
    filters,
    loading,
    error,
    setSearch,
    setActiveFilter,
    setPage,
    setLimit,
    refreshCategories,
    clearFilters
  };
}
