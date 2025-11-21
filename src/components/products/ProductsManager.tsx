'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  FunnelIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { Product, Category } from '@/types/pos';
import { formatCurrency } from '@/lib/utils';
import ProductModal from './ProductModal';
import { useNotifications } from '@/components/ui/NotificationProvider';

export default function ProductsManager() {
  const { data: session } = useSession();
  const { showSuccess, showError, showWarning } = useNotifications();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(''); // String para IDs
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');

  // Modal states
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [products, searchTerm, selectedCategory, stockFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Cargar productos
      const productsResponse = await fetch('/api/products');
      const productsData = await productsResponse.json();
      
      // Cargar categorías
      const categoriesResponse = await fetch('/api/categories?active=true');
      const categoriesData = await categoriesResponse.json();
      
      setProducts(productsData.products || []);
      setCategories(categoriesData.categories || []);
    } catch (error) {
      console.error('Error loading data:', error);
      showError('Error al cargar datos', 'No se pudieron cargar los productos. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...products];

    // Filtro de búsqueda
    if (searchTerm.trim()) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.barcode?.includes(searchTerm) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro de categoría
    if (selectedCategory) {
      filtered = filtered.filter(product => product.categoryId === selectedCategory);
    }

    // Filtro de stock
    if (stockFilter === 'low') {
      filtered = filtered.filter(product => product.stock <= product.minStock && product.stock > 0);
    } else if (stockFilter === 'out') {
      filtered = filtered.filter(product => product.stock === 0);
    }

    setFilteredProducts(filtered);
  };

  const handleCreateProduct = () => {
    setEditingProduct(null);
    setShowProductModal(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowProductModal(true);
  };

  const handleDeleteProduct = async (productId: string) => { // String para IDs
    if (!confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      return;
    }

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadData();
        showSuccess('Producto eliminado', 'El producto se eliminó exitosamente');
      } else {
        throw new Error('Error al eliminar producto');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      showError('Error al eliminar', 'No se pudo eliminar el producto. Intenta de nuevo.');
    }
  };

  const handleProductSaved = async () => {
    setShowProductModal(false);
    setEditingProduct(null);
    await loadData(); // Recargar datos para mostrar las imágenes actualizadas
  };

  // Función para refrescar después de subir imagen
  const handleImageUploaded = async () => {
    await loadData(); // Recargar productos para mostrar la imagen
  };

  const getStockBadgeColor = (product: Product) => {
    if (product.stock === 0) return 'destructive';
    if (product.stock <= product.minStock) return 'warning';
    return 'success';
  };

  const getStockStatus = (product: Product) => {
    if (product.stock === 0) return 'Sin Stock';
    if (product.stock <= product.minStock) return 'Stock Bajo';
    return 'En Stock';
  };

  const lowStockCount = products.filter(p => p.stock <= p.minStock && p.stock > 0).length;
  const outOfStockCount = products.filter(p => p.stock === 0).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alertas de Stock */}
      {(lowStockCount > 0 || outOfStockCount > 0) && (
        <div className="space-y-3">
          {outOfStockCount > 0 && (
            <Alert variant="destructive">
              <ExclamationTriangleIcon className="h-4 w-4" />
              <div>
                <strong>{outOfStockCount} productos sin stock</strong>
                <p className="text-sm">Algunos productos necesitan reabastecimiento urgente.</p>
              </div>
            </Alert>
          )}
          {lowStockCount > 0 && (
            <Alert variant="warning">
              <ExclamationTriangleIcon className="h-4 w-4" />
              <div>
                <strong>{lowStockCount} productos con stock bajo</strong>
                <p className="text-sm">Considera reabastecer estos productos pronto.</p>
              </div>
            </Alert>
          )}
        </div>
      )}

      {/* Header y Controles */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Gestión de Productos</h2>
            <p className="text-gray-600">
              {filteredProducts.length} de {products.length} productos
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
            >
              <FunnelIcon className="h-4 w-4 mr-2" />
              Filtros
            </Button>
            
            {['ADMIN', 'ALMACEN'].includes(session?.user?.role || '') && (
              <Button onClick={handleCreateProduct}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Nuevo Producto
              </Button>
            )}
          </div>
        </div>

        {/* Filtros */}
        {showFilters && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Búsqueda */}
              <div>
                <label className="block text-sm font-medium mb-2">Buscar</label>
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Nombre, código o descripción..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Filtro de categoría */}
              <div>
                <label className="block text-sm font-medium mb-2">Categoría</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Todas las categorías</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Stock */}
              <div>
                <label className="block text-sm font-medium mb-2">Estado de Stock</label>
                <select
                  value={stockFilter}
                  onChange={(e) => setStockFilter(e.target.value as 'all' | 'low' | 'out')}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Todos</option>
                  <option value="low">Stock Bajo</option>
                  <option value="out">Sin Stock</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Tabla de Productos */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Imagen
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Producto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoría
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Precio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  {/* Columna de Imagen */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-center">
                      {product.hasImage && (product.thumbnailUrl || product.imageUrl) ? (
                        <div className="relative group">
                          <div className="h-12 w-12 bg-gray-50 rounded-lg border border-gray-200 shadow-sm flex items-center justify-center overflow-hidden">
                            <img
                              src={product.thumbnailUrl || product.imageUrl}
                              alt={product.name}
                              className="max-h-full max-w-full object-contain"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const placeholder = target.parentElement?.nextElementSibling as HTMLElement;
                                if (placeholder) placeholder.style.display = 'flex';
                              }}
                            />
                          </div>
                          {/* Placeholder que se muestra si la imagen falla */}
                          <div className="hidden h-12 w-12 rounded-lg bg-gray-100 border border-gray-200 items-center justify-center">
                            <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          {/* Tooltip con imagen grande al hover */}
                          <div className="absolute z-50 invisible group-hover:visible bg-white border border-gray-200 rounded-lg shadow-lg p-2 bottom-full left-1/2 transform -translate-x-1/2 mb-2">
                            <div className="h-32 w-32 bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden">
                              <img
                                src={product.imageUrl || product.thumbnailUrl}
                                alt={product.name}
                                className="max-h-full max-w-full object-contain"
                              />
                            </div>
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-white"></div>
                          </div>
                        </div>
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                          <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </td>
                  
                  {/* Columna de Producto */}
                  <td className="px-6 py-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          {product.name}
                        </div>
                        {product.description && (
                          <div className="text-sm text-gray-500 line-clamp-2">
                            {product.description}
                          </div>
                        )}
                        {product.barcode && (
                          <div className="text-xs text-gray-400 font-mono">
                            {product.barcode}
                          </div>
                        )}
                        {/* Indicador de imagen */}
                        {product.hasImage && (
                          <div className="flex items-center mt-1">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                              </svg>
                              Con imagen
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {/* Necesitaríamos una relación o lookup para mostrar la categoría */}
                      {categories.find(c => c.id === product.categoryId)?.name || 'Sin categoría'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">
                        {formatCurrency(product.price)}
                      </div>
                      {/* La interfaz Product no tiene campo cost, así que lo comentamos por ahora */}
                      {/*{product.cost && product.cost > 0 && (
                        <div className="text-xs text-gray-500">
                          Costo: {formatCurrency(product.cost)}
                        </div>
                      )}*/}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div className="font-medium">{product.stock}</div>
                      <div className="text-xs text-gray-500">
                        Mín: {product.minStock}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <Badge variant={getStockBadgeColor(product)}>
                        {getStockStatus(product)}
                      </Badge>
                      <div>
                        <Badge variant={product.active ? 'success' : 'destructive'}>
                          {product.active ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditProduct(product)}
                      >
                        <EyeIcon className="h-4 w-4" />
                      </Button>
                      
                      {['ADMIN', 'ALMACEN'].includes(session?.user?.role || '') && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditProduct(product)}
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteProduct(product.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">
              <h3 className="text-lg font-medium mb-2">No se encontraron productos</h3>
              <p className="text-sm">
                {searchTerm || selectedCategory || stockFilter !== 'all'
                  ? 'Intenta ajustar los filtros de búsqueda'
                  : 'Comienza agregando tu primer producto'}
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Modal de Producto */}
      {showProductModal && (
        <ProductModal
          product={editingProduct}
          categories={categories}
          onSave={handleProductSaved}
          onClose={() => setShowProductModal(false)}
          onImageUploaded={handleImageUploaded}
        />
      )}
    </div>
  );
}
