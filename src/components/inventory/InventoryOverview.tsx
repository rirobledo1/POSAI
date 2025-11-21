'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  ExclamationTriangleIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  CubeIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
// import { StockMovementModal } from './StockMovementModal'
// import { InventoryReports } from './InventoryReports'

interface Product {
  id: number
  name: string
  category: string
  currentStock: number
  minStock: number
  maxStock: number
  unitPrice: number
  totalValue: number
  lastMovement: string
  supplier?: string
}

interface StockMovement {
  productId: number
  type: 'entrada' | 'salida'
  quantity: number
  reason: string
  notes?: string
  unitCost?: number
}

export function InventoryOverview() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all')
  const [showMovementModal, setShowMovementModal] = useState(false)
  const [showReports, setShowReports] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)

  // Mock data for fallback
  const mockProducts: Product[] = [
    {
      id: 1,
      name: 'Martillo Carpenter 16 oz',
      category: 'Herramientas',
      currentStock: 45,
      minStock: 20,
      maxStock: 100,
      unitPrice: 25000,
      totalValue: 1125000,
      lastMovement: '2024-01-15',
      supplier: 'Ferretería Central'
    },
    {
      id: 2,
      name: 'Destornillador Phillips #2',
      category: 'Herramientas',
      currentStock: 8,
      minStock: 15,
      maxStock: 50,
      unitPrice: 8500,
      totalValue: 68000,
      lastMovement: '2024-01-14',
      supplier: 'ToolMax'
    },
    {
      id: 3,
      name: 'Tornillos Autorroscantes 3/4"',
      category: 'Fijaciones',
      currentStock: 0,
      minStock: 100,
      maxStock: 500,
      unitPrice: 150,
      totalValue: 0,
      lastMovement: '2024-01-10',
      supplier: 'Fijaciones Pro'
    },
    {
      id: 4,
      name: 'Llave Inglesa 12"',
      category: 'Herramientas',
      currentStock: 32,
      minStock: 10,
      maxStock: 40,
      unitPrice: 45000,
      totalValue: 1440000,
      lastMovement: '2024-01-16',
      supplier: 'Herramientas Industriales'
    },
    {
      id: 5,
      name: 'Cable Eléctrico 12 AWG',
      category: 'Eléctrico',
      currentStock: 5,
      minStock: 20,
      maxStock: 100,
      unitPrice: 3200,
      totalValue: 16000,
      lastMovement: '2024-01-13',
      supplier: 'ElectroSuministros'
    }
  ]

  useEffect(() => {
    // Load data from API
    const loadData = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({
          search: searchTerm,
          stockFilter
        })

        const response = await fetch(`/api/inventory?${params}`)
        if (!response.ok) throw new Error('Failed to fetch inventory')
        
        const data = await response.json()
        setProducts(data.products || mockProducts)
        setFilteredProducts(data.products || mockProducts)
      } catch (error) {
        console.error('Error loading inventory:', error)
        // Fall back to mock data
        setProducts(mockProducts)
        setFilteredProducts(mockProducts)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [searchTerm, stockFilter])

  const getStockStatus = (product: Product) => {
    if (product.currentStock === 0) {
      return { label: 'Sin Stock', color: 'bg-red-100 text-red-800' }
    } else if (product.currentStock <= product.minStock) {
      return { label: 'Stock Bajo', color: 'bg-yellow-100 text-yellow-800' }
    } else {
      return { label: 'Stock Normal', color: 'bg-green-100 text-green-800' }
    }
  }

  const handleMovement = (product: Product) => {
    setSelectedProduct(product)
    setShowMovementModal(true)
  }

  const handleMovementSubmit = async (movement: StockMovement) => {
    try {
      const response = await fetch('/api/inventory/movements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(movement)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al procesar movimiento')
      }

      // Reload inventory data
      const params = new URLSearchParams({
        search: searchTerm,
        stockFilter
      })

      const inventoryResponse = await fetch(`/api/inventory?${params}`)
      if (inventoryResponse.ok) {
        const data = await inventoryResponse.json()
        setProducts(data.products || mockProducts)
        setFilteredProducts(data.products || mockProducts)
      }

      setShowMovementModal(false)
      setSelectedProduct(null)
    } catch (error) {
      console.error('Error processing movement:', error)
      alert(error instanceof Error ? error.message : 'Error al procesar el movimiento')
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        {/* Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CubeIcon className="h-5 w-5" />
              Control de Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar productos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={stockFilter === 'all' ? 'default' : 'outline'}
                  onClick={() => setStockFilter('all')}
                  className="flex items-center gap-1"
                >
                  <FunnelIcon className="h-4 w-4" />
                  Todos
                </Button>
                <Button
                  variant={stockFilter === 'low' ? 'default' : 'outline'}
                  onClick={() => setStockFilter('low')}
                  className="flex items-center gap-1"
                >
                  <ExclamationTriangleIcon className="h-4 w-4" />
                  Stock Bajo
                </Button>
                <Button
                  variant={stockFilter === 'out' ? 'default' : 'outline'}
                  onClick={() => setStockFilter('out')}
                  className="flex items-center gap-1"
                >
                  <ArrowDownIcon className="h-4 w-4" />
                  Sin Stock
                </Button>
                <Button
                  onClick={() => setShowReports(true)}
                  className="flex items-center gap-1"
                >
                  <ChartBarIcon className="h-4 w-4" />
                  Reportes
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => {
            const status = getStockStatus(product)
            return (
              <Card key={product.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base leading-tight">
                        {product.name}
                      </CardTitle>
                      <p className="text-sm text-gray-500 mt-1">
                        {product.category}
                      </p>
                    </div>
                    <Badge className={status.color}>
                      {status.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <p className="text-gray-500">Stock Actual</p>
                        <p className="font-semibold text-lg">{product.currentStock}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Mín/Máx</p>
                        <p className="font-medium">{product.minStock}/{product.maxStock}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Precio Unit.</p>
                        <p className="font-medium">${product.unitPrice.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="text-sm">
                      <p className="text-gray-500">Valor Total</p>
                      <p className="font-semibold text-green-600">
                        ${product.totalValue.toLocaleString()}
                      </p>
                    </div>

                    <div className="text-xs text-gray-500">
                      Último movimiento: {product.lastMovement}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        onClick={() => handleMovement(product)}
                        className="flex-1 flex items-center gap-1"
                      >
                        <ArrowUpIcon className="h-3 w-3" />
                        Entrada
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMovement(product)}
                        className="flex-1 flex items-center gap-1"
                      >
                        <ArrowDownIcon className="h-3 w-3" />
                        Salida
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {filteredProducts.length === 0 && !loading && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CubeIcon className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No se encontraron productos
              </h3>
              <p className="text-sm text-gray-500 text-center">
                {searchTerm 
                  ? 'Intenta con otros términos de búsqueda'
                  : 'No hay productos que coincidan con los filtros seleccionados'
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modals */}
      {showMovementModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="max-w-md w-full mx-4">
            <CardHeader>
              <CardTitle>Movimiento de Stock</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Producto: {selectedProduct.name}
              </p>
              <div className="flex gap-2">
                <Button onClick={() => {
                  setShowMovementModal(false)
                  setSelectedProduct(null)
                }}>
                  Cerrar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showReports && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="max-w-2xl w-full mx-4">
            <CardHeader>
              <CardTitle>Reportes de Inventario</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Reportes y análisis de inventario próximamente...
              </p>
              <Button onClick={() => setShowReports(false)}>
                Cerrar
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
