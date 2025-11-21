'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  FunnelIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  StarIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { Product, Category } from '@/types/pos';
import { formatCurrency } from '@/lib/utils';
import { formatProductUnit, getUnitInfo } from '@/lib/units';
import { useProductsOptimized } from '@/hooks/useProductsOptimized';
import ProductModal from './ProductModal';
import CSVImportManager from './CSVImportManager';
import RemoveDuplicatesManager from './RemoveDuplicatesManager';
import BulkImageManager from './BulkImageManager';

interface ProductsManagerOptimizedProps {
  editProductId?: string;
  createProduct?: boolean;
  returnTo?: string;
  initialName?: string;
}

export default function ProductsManagerOptimized({ 
  editProductId, 
  createProduct, 
  returnTo, 
  initialName 
}: ProductsManagerOptimizedProps = {}) {
  const { data: session } = useSession();
  const router = useRouter();
  
  const {
    products,
    categories,
    pagination,
    filters,
    loading,
    error,
    setSearch,
    setCategoryFilter,
    setActiveFilter,
    setStockFilter,
    setPage,
    setLimit,
    refreshProducts,
    clearFilters
  } = useProductsOptimized();

  // Modal states
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showCSVImportModal, setShowCSVImportModal] = useState(false);
  const [showRemoveDuplicatesModal, setShowRemoveDuplicatesModal] = useState(false);
  const [showBulkImageModal, setShowBulkImageModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Featured products management
  const [featuredLoading, setFeaturedLoading] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [localSearch, setLocalSearch] = useState(filters.search);

  // Efectos para manejar parámetros de URL
  useEffect(() => {
    if (createProduct) {
      // Abrir modal para crear producto
      const newProduct: Partial<Product> = initialName ? { name: initialName } : {};
      setEditingProduct(newProduct as Product);
      setShowProductModal(true);
    } else if (editProductId && products.length > 0) {
      // Buscar y abrir modal para editar producto
      const productToEdit = products.find(p => p.id === editProductId);
      if (productToEdit) {
        setEditingProduct(productToEdit);
        setShowProductModal(true);
      }
    }
  }, [createProduct, editProductId, products, initialName]);

  // Función para cerrar modal y redirigir si es necesario
  const handleCloseModal = () => {
    setShowProductModal(false);
    setEditingProduct(null);
    
    if (returnTo) {
      // Redirigir de vuelta a la página original
      router.push(returnTo);
    }
  };

  // Función para guardar y redirigir si es necesario
  const handleSaveAndClose = async () => {
    await refreshProducts(); // Refrescar lista de productos
    handleCloseModal();
  };

  // Función para refrescar después de subir imagen
  const handleImageUploaded = async () => {
    await refreshProducts(); // Refrescar para mostrar la nueva imagen
    console.log('✅ Lista de productos refrescada después de subir imagen');
  };

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setLocalSearch(value);
    setSearch(value);
  };

  // Handle product deletion
  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      return;
    }

    try {
      setDeleteLoading(productId);
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      });

      const responseData = await response.json();

      if (response.ok) {
        await refreshProducts();
        alert(responseData.message || 'Producto eliminado correctamente');
      } else {
        // Manejar diferentes tipos de errores
        if (responseData.code === 'HAS_REFERENCES') {
          const details = responseData.details;
          let message = `❌ ${responseData.message}\n\n`;
          
          if (details.hasSales) {
            message += `📊 Ventas registradas: ${details.salesCount}\n`;
            message += `📅 Primera venta: ${new Date(details.firstSale).toLocaleDateString()}\n`;
            message += `📅 Última venta: ${new Date(details.lastSale).toLocaleDateString()}\n`;
          }
          
          if (details.hasMovements) {
            message += `📦 Movimientos de inventario: ${details.movementCount}\n`;
          }
          
          message += `\n💡 ${responseData.suggestion}`;
          
          // Preguntar si quiere proceder con el soft delete
          const proceedWithSoftDelete = confirm(
            `${message}\n\n¿Deseas marcar el producto como inactivo de todas formas?\n\n` +
            `✅ Se preservará todo el historial\n` +
            `✅ No aparecerá en nuevas ventas\n` +
            `✅ Podrás reactivarlo más tarde`
          );
          
          if (proceedWithSoftDelete) {
            // Forzar soft delete
            const forceResponse = await fetch(`/api/products/${productId}?force=true`, {
              method: 'DELETE',
            });
            
            if (forceResponse.ok) {
              await refreshProducts();
              alert('Producto marcado como inactivo correctamente');
            } else {
              const forceError = await forceResponse.json();
              alert(forceError.error || 'Error al marcar como inactivo');
            }
          }
        } else {
          alert(responseData.error || 'Error al eliminar el producto');
        }
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Error de conexión al eliminar el producto');
    } finally {
      setDeleteLoading(null);
    }
  };

  // Calculate margin percentage for display
  const calculateMargin = (price: number, cost: number) => {
    if (!cost || cost === 0) return 0;
    return ((price - cost) / cost * 100);
  };

  // Get stock status
  const getStockStatus = (stock: number, minStock: number) => {
    if (stock === 0) return { status: 'out', label: 'Sin stock', color: 'bg-red-100 text-red-800' };
    if (stock <= minStock) return { status: 'low', label: 'Stock bajo', color: 'bg-yellow-100 text-yellow-800' };
    return { status: 'good', label: 'En stock', color: 'bg-green-100 text-green-800' };
  };

  // Toggle featured status
  const toggleFeaturedStatus = async (productId: string, currentFeatured: boolean) => {
    try {
      setFeaturedLoading(productId);
      const newFeaturedStatus = !currentFeatured;
      
      const response = await fetch('/api/products/featured', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          featured: newFeaturedStatus
        }),
      });

      const responseData = await response.json();

      if (response.ok) {
        // Actualizar la lista de productos
        await refreshProducts();
        
        // Mostrar mensaje de éxito
        const message = newFeaturedStatus 
          ? `✅ Producto marcado como destacado` 
          : `📝 Producto removido de destacados`;
        
        console.log(message);
        
        // Usar alert temporal para mostrar éxito
        alert(message);
      } else {
        throw new Error(responseData.error || 'Error al actualizar estado destacado');
      }
    } catch (error) {
      console.error('Error toggling featured status:', error);
      alert(error instanceof Error ? error.message : 'Error al actualizar producto destacado');
    } finally {
      setFeaturedLoading(null);
    }
  };

  const canEdit = session?.user.role === 'ADMIN' || session?.user.role === 'ALMACEN';
  const isAdmin = session?.user.role === 'ADMIN';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          {returnTo && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(returnTo)}
              className="flex items-center gap-2"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Volver
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
            <p className="text-sm text-gray-600">
              {pagination.total} productos encontrados
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <FunnelIcon className="h-4 w-4" />
            Filtros
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={refreshProducts}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          
          {canEdit && (
            <>
              {/* Separador visual para acciones de administración */}
              <div className="border-l border-gray-300 h-8 mx-1"></div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCSVImportModal(true)}
                className="flex items-center gap-2"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
                Importar CSV
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBulkImageModal(true)}
                className="flex items-center gap-2 text-purple-600 hover:text-purple-700 border-purple-300 hover:border-purple-400"
              >
                <PhotoIcon className="h-4 w-4" />
                Imágenes Masivas
              </Button>
              
              {isAdmin && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowRemoveDuplicatesModal(true)}
                    className="flex items-center gap-2 text-orange-600 hover:text-orange-700 border-orange-300 hover:border-orange-400"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Limpiar Duplicados
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Mostrar solo productos duplicados inactivos
                      setActiveFilter(false);
                      setSearch('[DUPLICADO-INACTIVO]');
                      setShowFilters(true);
                    }}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-700 border-gray-300 hover:border-gray-400"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Ver Historial
                  </Button>
                </>
              )}
              
              {/* Botón para limpiar filtros cuando se está viendo el historial */}
              {(filters.search.includes('[DUPLICADO-INACTIVO]') || !filters.active) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    clearFilters();
                    setLocalSearch('');
                  }}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700 border-blue-300 hover:border-blue-400"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Ver Todos
                </Button>

                
              )}
              
              <Button
                onClick={() => {
                  setEditingProduct(null);
                  setShowProductModal(true);
                }}
                className="flex items-center gap-2 ml-2"
              >
                <PlusIcon className="h-4 w-4" />
                Nuevo Producto
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Error display */}
      {error && (
        <Alert variant="destructive">
          <ExclamationTriangleIcon className="h-4 w-4" />
          <span>{error}</span>
        </Alert>
      )}

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nombre, descripción o código de barras..."
              value={localSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
            
          </div>
          

          {/* Filters (collapsible) */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoría
                </label>
                <select
                  value={filters.categoryId}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todas las categorías</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Active Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select
                  value={filters.active ? 'true' : 'false'}
                  onChange={(e) => setActiveFilter(e.target.value === 'true')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="true">Activos</option>
                  <option value="false">Inactivos</option>
                </select>
              </div>

              {/* Stock Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stock
                </label>
                <select
                  value={filters.hasStock ? 'true' : 'false'}
                  onChange={(e) => setStockFilter(e.target.value === 'true')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="false">Todos</option>
                  <option value="true">Solo con stock</option>
                </select>
              </div>

              {/* Results per page */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Por página
                </label>
                <select
                  value={pagination.limit}
                  onChange={(e) => setLimit(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>

              {/* Clear filters */}
              <div className="md:col-span-4 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="flex items-center gap-2"
                >
                  Limpiar filtros
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Products Display */}
      <Card>
        {/* Desktop Table View */}
        <div className="hidden lg:block">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Imagen
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Precio/Costo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unidad
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex items-center justify-center">
                        <ArrowPathIcon className="h-6 w-6 animate-spin text-gray-400 mr-2" />
                        Cargando productos...
                      </div>
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      No se encontraron productos
                    </td>
                  </tr>
                ) : (
                  products.map((product) => {
                    const stockStatus = getStockStatus(product.stock, product.minStock);
                    const margin = calculateMargin(product.price, product.cost || 0);
                    const isDuplicateInactive = !product.active && product.name.includes('[DUPLICADO-INACTIVO');

                    return (
                      <tr 
                        key={product.id} 
                        className={`hover:bg-gray-50 ${
                          isDuplicateInactive 
                            ? 'bg-red-50 border-l-4 border-red-300' 
                            : !product.active 
                              ? 'bg-gray-50 opacity-60' 
                              : ''
                        }`}
                      >
                        {/* Columna de Imagen */}
                        <td className="px-4 py-4">
                          <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 border">
                            {product.hasImage && product.thumbnailUrl ? (
                              <img
                                src={product.thumbnailUrl}
                                alt={product.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  // Fallback si la imagen no carga
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                            ) : null}
                            <div className={`w-full h-full flex items-center justify-center ${product.hasImage ? 'hidden' : ''}`}>
                              <PhotoIcon className="h-6 w-6 text-gray-400" />
                              <span className="sr-only">Sin imagen</span>
                            </div>
                          </div>
                          {!product.hasImage && (
                            <div className="mt-1">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                                Sin imagen
                              </span>
                            </div>
                          )}
                        </td>
                        
                        {/* Columna de Producto */}
                        <td className="px-4 py-4">
                          <div>
                            <div className={`text-sm font-medium line-clamp-2 ${
                              isDuplicateInactive ? 'text-red-700' : 'text-gray-900'
                            }`}>
                              {product.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {categories.find(cat => cat.id === product.categoryId)?.name || 'Sin categoría'}
                            </div>
                            {product.barcode && (
                              <div className="text-xs text-gray-400">
                                {product.barcode}
                              </div>
                            )}
                            {isDuplicateInactive && (
                              <div className="mt-1">
                                <Badge className="bg-red-100 text-red-800 text-xs">
                                  Duplicado Eliminado
                                </Badge>
                              </div>
                            )}
                            {!product.active && !isDuplicateInactive && (
                              <div className="mt-1">
                                <Badge className="bg-gray-100 text-gray-800 text-xs">
                                  Inactivo
                                </Badge>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="space-y-1">
                            <div className="text-sm font-medium text-gray-900">
                              {formatCurrency(product.price)}
                            </div>
                            {product.cost && (
                              <div className="text-xs text-gray-500">
                                Costo: {formatCurrency(product.cost)}
                              </div>
                            )}
                            {margin > 0 && (
                              <div className="text-xs text-green-600">
                                {margin.toFixed(1)}% margen
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="space-y-1">
                            <div className="text-sm font-medium text-gray-900">
                              {formatProductUnit(product.unitQuantity || 1, product.unitOfMeasure || 'PIECE' as any)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {getUnitInfo(product.unitOfMeasure || 'PIECE' as any).label}
                            </div>
                            {product.isBulkSale && (
                              <div className="text-xs text-blue-600">
                                A granel
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">
                                {product.stock}
                              </span>
                              <Badge className={`text-xs ${stockStatus.color}`}>
                                {stockStatus.status === 'out' ? 'Sin stock' : 
                                 stockStatus.status === 'low' ? 'Bajo' : 'Ok'}
                              </Badge>
                            </div>
                            <div className="text-xs text-gray-500">
                              Min: {product.minStock}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="space-y-1">
                            <Badge
                              className={`text-xs ${
                                product.active
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {product.active ? 'Activo' : 'Inactivo'}
                            </Badge>
                            {product.useAutomaticPricing && (
                              <div className="text-xs text-blue-600">
                                Auto
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingProduct(product);
                                setShowProductModal(true);
                              }}
                              className="h-8 w-8 p-0"
                              title="Ver detalles"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </Button>

                            {canEdit && (
                              <>
                                {/* Botón para marcar como destacado (solo admins) */}
                                {isAdmin && (
                                  <Button
                                    variant={product.featured ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => toggleFeaturedStatus(product.id, product.featured || false)}
                                    disabled={featuredLoading === product.id}
                                    className={`h-8 w-8 p-0 ${product.featured ? 'text-yellow-600 bg-yellow-50 border-yellow-200' : ''}`}
                                    title={product.featured ? "Remover de destacados" : "Marcar como destacado"}
                                  >
                                    {featuredLoading === product.id ? (
                                      <ArrowPathIcon className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <StarIcon className={`h-4 w-4 ${product.featured ? 'fill-current' : ''}`} />
                                    )}
                                  </Button>
                                )}
                                
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setEditingProduct(product);
                                    setShowProductModal(true);
                                  }}
                                  className="h-8 w-8 p-0"
                                  title="Editar"
                                >
                                  <PencilIcon className="h-4 w-4" />
                                </Button>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteProduct(product.id)}
                                  disabled={deleteLoading === product.id}
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-800"
                                  title="Eliminar"
                                >
                                  {deleteLoading === product.id ? (
                                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <TrashIcon className="h-4 w-4" />
                                  )}
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="flex items-center justify-center">
                <ArrowPathIcon className="h-6 w-6 animate-spin text-gray-400 mr-2" />
                Cargando productos...
              </div>
            </div>
          ) : products.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No se encontraron productos
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {products.map((product) => {
                const stockStatus = getStockStatus(product.stock, product.minStock);
                const margin = calculateMargin(product.price, product.cost || 0);

                return (
                  <div key={product.id} className="p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start gap-3">
                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-medium text-gray-900 truncate">
                              {product.name}
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">
                              {categories.find(cat => cat.id === product.categoryId)?.name || 'Sin categoría'}
                            </p>
                            {product.barcode && (
                              <p className="text-xs text-gray-400 mt-1">
                                {product.barcode}
                              </p>
                            )}
                          </div>
                          
                          {/* Action Buttons - Always Visible */}
                          <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingProduct(product);
                                setShowProductModal(true);
                              }}
                              className="h-8 w-8 p-0"
                            >
                              <EyeIcon className="h-3 w-3" />
                            </Button>

                            {canEdit && (
                              <>
                                {/* Botón para marcar como destacado (solo admins) */}
                                {isAdmin && (
                                  <Button
                                    variant={product.featured ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => toggleFeaturedStatus(product.id, product.featured || false)}
                                    disabled={featuredLoading === product.id}
                                    className={`h-8 w-8 p-0 ${product.featured ? 'text-yellow-600 bg-yellow-50 border-yellow-200' : ''}`}
                                    title={product.featured ? "Remover de destacados" : "Marcar como destacado"}
                                  >
                                    {featuredLoading === product.id ? (
                                      <ArrowPathIcon className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <StarIcon className={`h-3 w-3 ${product.featured ? 'fill-current' : ''}`} />
                                    )}
                                  </Button>
                                )}
                                
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setEditingProduct(product);
                                    setShowProductModal(true);
                                  }}
                                  className="h-8 w-8 p-0"
                                >
                                  <PencilIcon className="h-3 w-3" />
                                </Button>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteProduct(product.id)}
                                  disabled={deleteLoading === product.id}
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-800"
                                >
                                  {deleteLoading === product.id ? (
                                    <ArrowPathIcon className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <TrashIcon className="h-3 w-3" />
                                  )}
                                </Button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Price and Cost */}
                        <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Precio:</span>
                            <div className="font-medium text-gray-900">
                              {formatCurrency(product.price)}
                            </div>
                            {product.cost && (
                              <div className="text-xs text-gray-500">
                                Costo: {formatCurrency(product.cost)}
                              </div>
                            )}
                          </div>

                          <div>
                            <span className="text-gray-500">Stock:</span>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{product.stock}</span>
                              <Badge className={`text-xs ${stockStatus.color}`}>
                                {stockStatus.status === 'out' ? 'Sin stock' : 
                                 stockStatus.status === 'low' ? 'Bajo' : 'Ok'}
                              </Badge>
                            </div>
                            <div className="text-xs text-gray-500">
                              Min: {product.minStock}
                            </div>
                          </div>
                        </div>

                        {/* Status and Additional Info */}
                        <div className="mt-2 flex items-center gap-2 flex-wrap">
                          <Badge
                            className={`text-xs ${
                              product.active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {product.active ? 'Activo' : 'Inactivo'}
                          </Badge>
                          
                          {product.useAutomaticPricing && (
                            <Badge className="text-xs bg-blue-100 text-blue-800">
                              Precio automático
                            </Badge>
                          )}
                          
                          {margin > 0 && (
                            <Badge className="text-xs bg-green-100 text-green-800">
                              {margin.toFixed(1)}% margen
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Mostrando{' '}
                <span className="font-medium">
                  {(pagination.page - 1) * pagination.limit + 1}
                </span>{' '}
                a{' '}
                <span className="font-medium">
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span>{' '}
                de{' '}
                <span className="font-medium">{pagination.total}</span>{' '}
                productos
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(pagination.page - 1)}
                  disabled={!pagination.hasPrev || loading}
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                  Anterior
                </Button>

                <span className="text-sm text-gray-700">
                  Página {pagination.page} de {pagination.totalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(pagination.page + 1)}
                  disabled={!pagination.hasNext || loading}
                >
                  Siguiente
                  <ChevronRightIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Product Modal */}
      {showProductModal && (
        <ProductModal
          product={editingProduct}
          categories={categories}
          onSave={handleSaveAndClose}
          onClose={handleCloseModal}
          isQuickEdit={!!returnTo} // Use quick edit mode if coming from another page (like POS)
          onImageUploaded={handleImageUploaded} // Refrescar después de subir imagen
        />
      )}

      {/* Modal de Importación CSV */}
      {showCSVImportModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
                 onClick={() => setShowCSVImportModal(false)}></div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
              &#8203;
            </span>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Importar Productos desde CSV
                  </h3>
                  <button
                    type="button"
                    className="bg-white rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    onClick={() => setShowCSVImportModal(false)}
                  >
                    <span className="sr-only">Cerrar</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <CSVImportManager 
                  onImportComplete={async () => {
                    await refreshProducts();
                  }}
                  onClose={() => setShowCSVImportModal(false)}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Remove Duplicates Modal */}
      {showRemoveDuplicatesModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                  <ExclamationTriangleIcon className="h-6 w-6 text-orange-500" />
                  Eliminar Productos Duplicados
                </h3>
                <button
                  type="button"
                  className="bg-white rounded-md text-gray-400 hover:text-gray-600"
                  onClick={() => setShowRemoveDuplicatesModal(false)}
                >
                  <span className="sr-only">Cerrar</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <RemoveDuplicatesManager 
                onComplete={async () => {
                  await refreshProducts();
                  setShowRemoveDuplicatesModal(false);
                }}
                onClose={() => setShowRemoveDuplicatesModal(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Bulk Image Upload Modal */}
      {showBulkImageModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="mt-3">
              <BulkImageManager 
                onUploadComplete={async (results) => {
                  await refreshProducts();
                  // Mostrar resumen
                  const successful = results.filter(r => r.success).length;
                  const failed = results.filter(r => !r.success).length;
                  alert(`Upload completado: ${successful} exitosas, ${failed} fallidas`);
                }}
                onClose={() => setShowBulkImageModal(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
