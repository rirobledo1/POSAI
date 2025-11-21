// src/hooks/useCustomersOptimized.ts
import { useState, useEffect, useCallback } from 'react';

export interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  creditLimit: number;
  currentDebt: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  totalPurchases?: number;
  lastPurchase?: string;
}

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
  active: string | null;
  hasDebt: string | null;
}

interface UseCustomersOptimizedResult {
  customers: Customer[];
  pagination: PaginationInfo;
  filters: Filters;
  isLoading: boolean;
  error: string | null;
  searchTerm: string;
  setSearchTerm: (search: string) => void;
  setActiveFilter: (active: string | null) => void;
  setDebtFilter: (hasDebt: string | null) => void;
  sorting: { field: string; order: 'asc' | 'desc' };
  setSorting: (field: string, order: 'asc' | 'desc') => void;
  changePage: (page: number) => void;
  refreshCustomers: () => Promise<void>;
  createCustomer: (customerData: Partial<Customer>) => Promise<void>;
  updateCustomer: (id: string, customerData: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
}

export function useCustomersOptimized(): UseCustomersOptimizedResult {
  const [customers, setCustomers] = useState<Customer[]>([]);
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
    active: null,
    hasDebt: null
  });
  const [sorting, setSortingState] = useState({ field: 'name', order: 'asc' as 'asc' | 'desc' });
  const [isLoading, setIsLoading] = useState(false);
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
      params.append('active', finalFilters.active);
    }
    if (finalFilters.hasDebt !== null) {
      params.append('hasDebt', finalFilters.hasDebt);
    }
    
    params.append('page', finalPagination.page.toString());
    params.append('limit', finalPagination.limit.toString());
    params.append('sortBy', sorting.field);
    params.append('sortOrder', sorting.order);

    return `/api/customers?${params.toString()}`;
  }, [filters, pagination, sorting]);

  // Función para cargar clientes
  const loadCustomers = useCallback(async (customFilters?: Partial<Filters>, customPagination?: Partial<PaginationInfo>) => {
    try {
      setIsLoading(true);
      setError(null);

      const url = buildApiUrl(customFilters, customPagination);
      console.log('🔄 Cargando clientes:', url);

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setCustomers(data.customers || []);
        setPagination(data.pagination);
        
        console.log('✅ Clientes cargados:', {
          customers: data.customers?.length || 0,
          total: data.pagination?.total || 0,
          page: data.pagination?.page || 1
        });
      } else {
        throw new Error(data.error || 'Error cargando clientes');
      }
    } catch (err) {
      console.error('❌ Error cargando clientes:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  }, [buildApiUrl]);

  // Función para actualizar búsqueda con debounce
  const setSearchTerm = useCallback((search: string) => {
    if (searchDebounce) {
      clearTimeout(searchDebounce);
    }
    
    const newFilters = { ...filters, search };
    setFilters(newFilters);
    
    const timeout = setTimeout(() => {
      loadCustomers(newFilters, { page: 1 });
    }, 500);
    
    setSearchDebounce(timeout);
  }, [searchDebounce, loadCustomers, filters]);

  // Función para actualizar filtro de estado activo
  const setActiveFilter = useCallback((active: string | null) => {
    const newFilters = { ...filters, active };
    setFilters(newFilters);
    loadCustomers(newFilters, { page: 1 });
  }, [filters, loadCustomers]);

  // Función para actualizar filtro de deuda
  const setDebtFilter = useCallback((hasDebt: string | null) => {
    const newFilters = { ...filters, hasDebt };
    setFilters(newFilters);
    loadCustomers(newFilters, { page: 1 });
  }, [filters, loadCustomers]);

  // Función para cambiar página
  const changePage = useCallback((page: number) => {
    const newPagination = { ...pagination, page };
    setPagination(newPagination);
    loadCustomers(undefined, newPagination);
  }, [pagination, loadCustomers]);

  // Función para cambiar ordenamiento
  const setSorting = useCallback((field: string, order: 'asc' | 'desc') => {
    setSortingState({ field, order });
    loadCustomers({ ...filters }, { page: 1 });
  }, [filters, loadCustomers]);

  // Función para refrescar
  const refreshCustomers = useCallback(async () => {
    await loadCustomers();
  }, [loadCustomers]);

  // Función para crear cliente
  const createCustomer = useCallback(async (customerData: Partial<Customer>) => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customerData),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Error al crear cliente');
      }

      await refreshCustomers();
    } catch (err) {
      console.error('❌ Error creando cliente:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [refreshCustomers]);

  // Función para actualizar cliente
  const updateCustomer = useCallback(async (id: string, customerData: Partial<Customer>) => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/customers', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, ...customerData }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Error al actualizar cliente');
      }

      await refreshCustomers();
    } catch (err) {
      console.error('❌ Error actualizando cliente:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [refreshCustomers]);

  // Función para eliminar cliente
  const deleteCustomer = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/customers?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Error al eliminar cliente');
      }

      await refreshCustomers();
    } catch (err) {
      console.error('❌ Error eliminando cliente:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [refreshCustomers]);

  // Cleanup del debounce
  useEffect(() => {
    return () => {
      if (searchDebounce) {
        clearTimeout(searchDebounce);
      }
    };
  }, [searchDebounce]);

  // Cargar datos iniciales
  useEffect(() => {
    loadCustomers();
  }, []);

  return {
    customers,
    pagination,
    filters,
    isLoading,
    error,
    searchTerm: filters.search,
    setSearchTerm,
    setActiveFilter,
    setDebtFilter,
    sorting,
    setSorting,
    changePage,
    refreshCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer
  };
}
