'use client'

import React, { useState, useMemo } from 'react'
import { Search, Filter, BarChart3, AlertTriangle, Package, Truck } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { StatCard } from '@/components/ui/stat-card'
import { useInventoryOptimized } from '@/hooks/useInventoryOptimized'

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
  barcode?: string | null
  active: boolean
  stockStatus?: 'normal' | 'low' | 'out'
  stockPercentage?: number
}

interface StockMovementModalProps {
  isOpen: boolean
  onClose: () => void
  product: Product | null
  onMovementComplete: () => void
}

const StockMovementModal: React.FC<StockMovementModalProps> = ({ 
  isOpen, 
  onClose, 
  product, 
  onMovementComplete 
}) => {
  const [movementType, setMovementType] = useState<'entrada' | 'salida'>('entrada')
  const [quantity, setQuantity] = useState('')
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen || !product) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/inventory/movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          type: movementType,
          quantity: parseInt(quantity),
          reason
        })
      })

      if (response.ok) {
        onMovementComplete()
        onClose()
        setQuantity('')
        setReason('')
      }
    } catch (error) {
      console.error('Error creating movement:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">
          Movimiento de Stock - {product.name}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Tipo de Movimiento</label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={movementType === 'entrada' ? 'default' : 'outline'}
                onClick={() => setMovementType('entrada')}
                className="flex-1"
              >
                Entrada
              </Button>
              <Button
                type="button"
                variant={movementType === 'salida' ? 'default' : 'outline'}
                onClick={() => setMovementType('salida')}
                className="flex-1"
              >
                Salida
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Cantidad</label>
            <Input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="1"
              required
              placeholder="Ingrese cantidad"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Motivo</label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Motivo del movimiento"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function InventoryOverviewOptimized() {
  const {
    products,
    stats,
    pagination,
    filters,
    isLoading,
    setFilters,
    setPage,
    setLimit,
    refreshInventory,
    filteredProducts,
    alertProducts
  } = useInventoryOptimized()

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false)

  // Enhance products with stock status
  const enhancedProducts = useMemo(() => {
    return filteredProducts.map(product => ({
      ...product,
      stockStatus: product.currentStock === 0 
        ? 'out' as const
        : product.currentStock <= product.minStock 
          ? 'low' as const 
          : 'normal' as const,
      stockPercentage: Math.min(100, (product.currentStock / product.maxStock) * 100)
    }))
  }, [filteredProducts])

  const getStockStatusColor = (status: 'normal' | 'low' | 'out') => {
    switch (status) {
      case 'out': return 'bg-red-500'
      case 'low': return 'bg-yellow-500'
      default: return 'bg-green-500'
    }
  }

  const getStockStatusText = (status: 'normal' | 'low' | 'out') => {
    switch (status) {
      case 'out': return 'Agotado'
      case 'low': return 'Stock Bajo'
      default: return 'Normal'
    }
  }

  const handleMovementComplete = () => {
    refreshInventory()
  }

  const openMovementModal = (product: Product) => {
    setSelectedProduct(product)
    setIsMovementModalOpen(true)
  }

  const updateSearch = (search: string) => {
    setFilters({ search })
    setPage(1)
  }

  const updateCategory = (category: string) => {
    setFilters({ category })
    setPage(1)
  }

  const updateStockFilter = (stockFilter: 'all' | 'low' | 'out' | 'normal') => {
    setFilters({ stockFilter })
    setPage(1)
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      stockFilter: 'all',
      sortBy: 'name',
      sortOrder: 'asc'
    })
    setPage(1)
  }

  if (!stats) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando inventario optimizado...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Control de Inventario Optimizado</h1>
          <p className="text-gray-600">Gestión avanzada con rendimiento mejorado</p>
        </div>
        <Button onClick={refreshInventory} disabled={isLoading}>
          {isLoading ? 'Cargando...' : 'Actualizar'}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Productos"
          value={stats.totalProducts.toLocaleString()}
          icon={<Package className="h-4 w-4" />}
        />
        <StatCard
          title="Stock Bajo"
          value={stats.lowStockCount.toLocaleString()}
          icon={<AlertTriangle className="h-4 w-4" />}
        />
        <StatCard
          title="Productos Agotados"
          value={stats.outOfStockCount.toLocaleString()}
          icon={<AlertTriangle className="h-4 w-4" />}
        />
        <StatCard
          title="Valor de Venta"
          value={`$${stats.totalSellValue.toLocaleString()}`}
          icon={<BarChart3 className="h-4 w-4" />}
          trend="Precio de venta × Stock"
        />
        <StatCard
          title="Valor de Costo"
          value={`$${stats.totalCostValue.toLocaleString()}`}
          icon={<Package className="h-4 w-4" />}
          trend="Precio de costo × Stock"
        />
        <StatCard
          title="Ganancia Potencial"
          value={`$${stats.totalPotentialProfit.toLocaleString()}`}
          icon={<Truck className="h-4 w-4" />}
          trend="Diferencia entre venta y costo"
        />
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar productos..."
                value={filters.search}
                onChange={(e) => updateSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <select
              value={filters.category}
              onChange={(e) => updateCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas las categorías</option>
              {stats.categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            <select
              value={filters.stockFilter}
              onChange={(e) => updateStockFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos los stocks</option>
              <option value="normal">Stock normal</option>
              <option value="low">Stock bajo</option>
              <option value="out">Agotados</option>
            </select>

            <Button variant="outline" onClick={clearFilters}>
              Limpiar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Productos en Inventario</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                Mostrando {products.length} de {pagination.total} productos
              </span>
              <select
                value={pagination.limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="px-2 py-1 border border-gray-300 rounded text-sm"
              >
                <option value={10}>10 por página</option>
                <option value={20}>20 por página</option>
                <option value={50}>50 por página</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-600">Cargando productos...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">
                      Producto
                    </th>
                    <th className="text-left p-2">Categoría</th>
                    <th className="text-left p-2">
                      Stock Actual
                    </th>
                    <th className="text-left p-2">Estado</th>
                    <th className="text-left p-2">Progreso</th>
                    <th className="text-left p-2">
                      Precio Unit.
                    </th>
                    <th className="text-left p-2">
                      Valor Venta
                    </th>
                    <th className="text-left p-2">
                      Valor Costo
                    </th>
                    <th className="text-left p-2">
                      Ganancia Pot.
                    </th>
                    <th className="text-left p-2">
                      Último Mov.
                    </th>
                    <th className="text-left p-2">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {enhancedProducts.map((product) => (
                    <tr key={product.id} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-medium">{product.name}</td>
                      <td className="p-2">{product.category}</td>
                      <td className="p-2">
                        <span className="font-mono">
                          {product.currentStock} / {product.minStock}
                        </span>
                      </td>
                      <td className="p-2">
                        <Badge
                          variant={
                            product.stockStatus === 'out' ? 'destructive' :
                            product.stockStatus === 'low' ? 'warning' : 'default'
                          }
                        >
                          {getStockStatusText(product.stockStatus)}
                        </Badge>
                      </td>
                      <td className="p-2 w-24">
                        <Progress
                          value={product.stockPercentage}
                          className="h-2"
                        />
                      </td>
                      <td className="p-2 font-mono text-sm">
                        ${product.unitPrice.toLocaleString()}
                      </td>
                      <td className="p-2 font-mono text-sm text-green-600">
                        ${product.totalSellValue.toLocaleString()}
                      </td>
                      <td className="p-2 font-mono text-sm text-blue-600">
                        ${product.totalCostValue.toLocaleString()}
                      </td>
                      <td className="p-2 font-mono text-sm text-purple-600">
                        ${product.potentialProfit.toLocaleString()}
                      </td>
                      <td className="p-2 text-sm text-gray-600">
                        {product.lastMovement}
                      </td>
                      <td className="p-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openMovementModal(product)}
                        >
                          <Truck className="h-4 w-4 mr-1" />
                          Movimiento
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination && (
            <div className="flex justify-between items-center mt-4 pt-4 border-t">
              <div className="text-sm text-gray-600">
                Página {pagination.page} de {pagination.totalPages || 1} | Total: {pagination.total} productos
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(pagination.page - 1)}
                  disabled={!pagination.hasPrev}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(pagination.page + 1)}
                  disabled={!pagination.hasNext}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stock Movement Modal */}
      <StockMovementModal
        isOpen={isMovementModalOpen}
        onClose={() => setIsMovementModalOpen(false)}
        product={selectedProduct}
        onMovementComplete={handleMovementComplete}
      />
    </div>
  )
}
