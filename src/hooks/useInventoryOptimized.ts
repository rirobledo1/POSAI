'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'

interface Product {
  id: string
  name: string
  category: string
  currentStock: number
  minStock: number
  maxStock: number
  unitPrice: number
  unitCost: number
  totalSellValue: number
  totalCostValue: number
  potentialProfit: number
  lastMovement: string
  supplier?: string
  barcode?: string
  active: boolean
}

interface InventoryFilters {
  search: string
  category: string
  stockFilter: 'all' | 'low' | 'out' | 'normal'
  sortBy: 'name' | 'stock' | 'value' | 'lastMovement'
  sortOrder: 'asc' | 'desc'
}

interface InventoryStats {
  totalProducts: number
  lowStockCount: number
  outOfStockCount: number
  totalSellValue: number
  totalCostValue: number
  totalPotentialProfit: number
  categories: string[]
}

interface PaginationData {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

interface UseInventoryOptimizedReturn {
  // Data
  products: Product[]
  stats: InventoryStats | null
  pagination: PaginationData
  
  // Loading states
  isLoading: boolean
  isRefreshing: boolean
  
  // Filters
  filters: InventoryFilters
  setFilters: (filters: Partial<InventoryFilters>) => void
  
  // Pagination
  setPage: (page: number) => void
  setLimit: (limit: number) => void
  
  // Actions
  refreshInventory: () => Promise<void>
  createMovement: (movement: any) => Promise<void>
  
  // Computed
  filteredProducts: Product[]
  alertProducts: Product[]
}

export function useInventoryOptimized(): UseInventoryOptimizedReturn {
  // State
  const [products, setProducts] = useState<Product[]>([])
  const [stats, setStats] = useState<InventoryStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // Filters state
  const [filters, setFiltersState] = useState<InventoryFilters>({
    search: '',
    category: '',
    stockFilter: 'all',
    sortBy: 'name',
    sortOrder: 'asc'
  })
  
  // Pagination state
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  })

  // Debounced filters update
  const [debouncedFilters, setDebouncedFilters] = useState(filters)
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters)
    }, 300)
    
    return () => clearTimeout(timer)
  }, [filters])

  // Load inventory data
  const loadInventory = useCallback(async (
    customFilters?: Partial<InventoryFilters>,
    customPagination?: Partial<PaginationData>
  ) => {
    try {
      setIsLoading(true)
      
      const searchParams = new URLSearchParams({
        page: String(customPagination?.page || pagination.page),
        limit: String(customPagination?.limit || pagination.limit),
        search: customFilters?.search || debouncedFilters.search,
        category: customFilters?.category || debouncedFilters.category,
        stockFilter: customFilters?.stockFilter || debouncedFilters.stockFilter,
        sortBy: customFilters?.sortBy || debouncedFilters.sortBy,
        sortOrder: customFilters?.sortOrder || debouncedFilters.sortOrder
      })

      const response = await fetch(`/api/inventory?${searchParams}`)
      
      if (!response.ok) {
        throw new Error('Error al cargar inventario')
      }
      
      const data = await response.json()
      
      setProducts(data.products || [])
      setStats(data.stats || null)
      setPagination(data.pagination || pagination)
      
    } catch (error) {
      console.error('❌ Error loading inventory:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [debouncedFilters, pagination.page, pagination.limit])

  // Load data when filters or pagination change
  useEffect(() => {
    loadInventory()
  }, [debouncedFilters, pagination.page, pagination.limit])

  // Refresh inventory
  const refreshInventory = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await loadInventory()
    } finally {
      setIsRefreshing(false)
    }
  }, [loadInventory])

  // Create movement
  const createMovement = useCallback(async (movement: any) => {
    try {
      setIsLoading(true)
      
      const response = await fetch('/api/inventory/movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(movement)
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al crear movimiento')
      }
      
      // Refresh data after movement
      await refreshInventory()
      
    } catch (error) {
      console.error('❌ Error creating movement:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [refreshInventory])

  // Update filters
  const setFilters = useCallback((newFilters: Partial<InventoryFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }))
    // Reset to first page when filters change
    if (newFilters.search !== undefined || newFilters.category !== undefined || newFilters.stockFilter !== undefined) {
      setPagination(prev => ({ ...prev, page: 1 }))
    }
  }, [])

  // Update pagination
  const setPage = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }))
  }, [])

  const setLimit = useCallback((limit: number) => {
    setPagination(prev => ({ ...prev, limit, page: 1 }))
  }, [])

  // Computed values
  const filteredProducts = useMemo(() => {
    return products
  }, [products])

  const alertProducts = useMemo(() => {
    return products.filter(product => 
      product.currentStock <= product.minStock
    )
  }, [products])

  return {
    // Data
    products,
    stats,
    pagination,
    
    // Loading states
    isLoading,
    isRefreshing,
    
    // Filters
    filters,
    setFilters,
    
    // Pagination
    setPage,
    setLimit,
    
    // Actions
    refreshInventory,
    createMovement,
    
    // Computed
    filteredProducts,
    alertProducts
  }
}
