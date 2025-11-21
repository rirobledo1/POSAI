// Hook optimizado para cargar productos con lazy loading y cache
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import type { Product } from '@/types/pos'

interface UseOptimizedProductsResult {
  products: Product[]
  featuredProducts: Product[]
  loading: boolean
  error: string | null
  searchProducts: (term: string) => Product[]
  loadMore: () => Promise<void>
  hasMore: boolean
  refreshProducts: () => Promise<void>
}

const INITIAL_LOAD = 50 // Solo 50 productos al inicio
const PRODUCTS_PER_PAGE = 50
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

// Cache global (fuera del componente para persistir entre renders)
let productsCache: {
  data: Product[] | null
  timestamp: number
} = {
  data: null,
  timestamp: 0
}

export function useOptimizedProducts(favoriteIds: string[] = []): UseOptimizedProductsResult {
  const [products, setProducts] = useState<Product[]>([])
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  
  const abortControllerRef = useRef<AbortController | null>(null)

  // Verificar si el cache es válido
  const isCacheValid = useCallback(() => {
    const now = Date.now()
    return productsCache.data !== null && 
           (now - productsCache.timestamp) < CACHE_DURATION
  }, [])

  // Cargar productos iniciales (solo destacados)
  useEffect(() => {
    loadInitialProducts()
    
    return () => {
      // Cancelar requests al desmontar
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  const loadInitialProducts = async () => {
    try {
      setLoading(true)
      setError(null)

      // Usar cache si es válido
      if (isCacheValid() && productsCache.data) {
        console.log('✅ Usando cache de productos')
        const cached = productsCache.data
        setProducts(cached.slice(0, INITIAL_LOAD))
        const featured = generateFeatured(cached, favoriteIds)
        setFeaturedProducts(featured)
        setLoading(false)
        return
      }

      // Cancelar request anterior si existe
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      abortControllerRef.current = new AbortController()

      console.log('🔄 Cargando productos destacados...')
      
      // Cargar solo productos destacados al inicio (mucho más rápido)
      const response = await fetch(
        `/api/products/featured?limit=${INITIAL_LOAD}`,
        { signal: abortControllerRef.current.signal }
      )

      if (!response.ok) throw new Error('Error cargando productos')

      const data = await response.json()
      const featured = data.products || []

      setProducts(featured)
      setFeaturedProducts(featured)
      
      // Actualizar cache
      productsCache = {
        data: featured,
        timestamp: Date.now()
      }

      console.log(`✅ ${featured.length} productos destacados cargados`)
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('⏸️ Request cancelado')
        return
      }
      console.error('Error cargando productos:', err)
      setError('Error cargando productos')
    } finally {
      setLoading(false)
    }
  }

  // Cargar más productos (lazy loading)
  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return

    try {
      setLoading(true)
      
      const response = await fetch(
        `/api/products?page=${page + 1}&limit=${PRODUCTS_PER_PAGE}&active=true`
      )

      if (!response.ok) throw new Error('Error cargando más productos')

      const data = await response.json()
      const newProducts = data.products || []

      if (newProducts.length < PRODUCTS_PER_PAGE) {
        setHasMore(false)
      }

      setProducts(prev => [...prev, ...newProducts])
      setPage(prev => prev + 1)

      // Actualizar cache
      if (productsCache.data) {
        productsCache.data = [...productsCache.data, ...newProducts]
      }

      console.log(`✅ ${newProducts.length} productos más cargados`)
    } catch (err) {
      console.error('Error cargando más productos:', err)
    } finally {
      setLoading(false)
    }
  }, [page, hasMore, loading])

  // Refrescar productos (invalidar cache)
  const refreshProducts = useCallback(async () => {
    productsCache = { data: null, timestamp: 0 }
    setPage(1)
    setHasMore(true)
    await loadInitialProducts()
  }, [])

  // Búsqueda optimizada con memoización
  const searchProducts = useCallback((term: string): Product[] => {
    if (!term.trim()) return products

    const lowerTerm = term.toLowerCase()
    
    return products.filter(p =>
      p.name.toLowerCase().includes(lowerTerm) ||
      p.barcode?.toLowerCase().includes(lowerTerm) ||
      p.description?.toLowerCase().includes(lowerTerm)
    )
  }, [products])

  return {
    products,
    featuredProducts,
    loading,
    error,
    searchProducts,
    loadMore,
    hasMore,
    refreshProducts
  }
}

// Función helper para generar productos destacados
function generateFeatured(allProducts: Product[], favoriteIds: string[]): Product[] {
  const productsWithStock = allProducts.filter(p => p.stock > 0)
  
  // Prioridad 1: Favoritos
  const favorites = productsWithStock
    .filter(p => favoriteIds.includes(p.id))
    .slice(0, 20)

  // Prioridad 2: Con ventas
  const bestsellers = productsWithStock
    .filter(p => !favoriteIds.includes(p.id))
    .filter(p => (p as any).totalSold > 0)
    .sort((a, b) => ((b as any).totalSold || 0) - ((a as any).totalSold || 0))
    .slice(0, 10)

  // Prioridad 3: Alto margen
  const highMargin = productsWithStock
    .filter(p => !favoriteIds.includes(p.id))
    .filter(p => (p.profitMargin || 0) > 25)
    .slice(0, 10)

  // Combinar sin duplicados
  const featured = new Map()
  favorites.forEach(p => featured.set(p.id, p))
  bestsellers.forEach(p => featured.set(p.id, p))
  highMargin.forEach(p => featured.set(p.id, p))

  return Array.from(featured.values()).slice(0, 30)
}
