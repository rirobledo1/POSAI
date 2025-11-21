// src/components/categories/CategoryManagerOptimized.tsx
'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
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
  TagIcon,
  BuildingStorefrontIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { formatCurrency } from '@/lib/utils';
import { useCategoriesOptimized } from '@/hooks/useCategoriesOptimized';

interface Category {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  product_count?: number;
  created_at?: string;
  updated_at?: string;
}

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: Category | null;
  onSave: (category: Category) => void;
}

function CategoryModal({ isOpen, onClose, category, onSave }: CategoryModalProps) {
  const [formData, setFormData] = useState({
    name: category?.name || '',
    description: category?.description || '',
    active: category?.active ?? true
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = category ? `/api/categories/${category.id}` : '/api/categories';
      const method = category ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        onSave(data.category);
        onClose();
        alert(category ? 'Categoría actualizada correctamente' : 'Categoría creada correctamente');
      } else {
        alert(data.error || 'Error al guardar la categoría');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">
          {category ? 'Editar Categoría' : 'Nueva Categoría'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre *
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nombre de la categoría"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descripción de la categoría (opcional)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="active"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="mr-2"
            />
            <label htmlFor="active" className="text-sm font-medium text-gray-700">
              Categoría activa
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Guardando...' : (category ? 'Actualizar' : 'Crear')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CategoryManagerOptimized() {
  const { data: session } = useSession();
  const {
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
  } = useCategoriesOptimized();

  // Modal states
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [localSearch, setLocalSearch] = useState(filters.search);

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setLocalSearch(value);
    setSearch(value);
  };

  // Handle category creation
  const handleCreateCategory = () => {
    setEditingCategory(null);
    setShowCategoryModal(true);
  };

  // Handle category editing
  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setShowCategoryModal(true);
  };

  // Handle category save (from modal)
  const handleSaveCategory = async (savedCategory: Category) => {
    await refreshCategories();
  };

  // Handle category deletion
  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta categoría?')) {
      return;
    }

    try {
      setDeleteLoading(categoryId);
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'DELETE',
      });

      const responseData = await response.json();

      if (response.ok) {
        await refreshCategories();
        alert(responseData.message || 'Categoría eliminada correctamente');
      } else {
        // Manejar errores específicos
        if (responseData.code === 'HAS_PRODUCTS') {
          const message = `❌ ${responseData.message}\n\n` +
            `📦 Productos asociados: ${responseData.details.productCount}\n\n` +
            `💡 ${responseData.suggestion}\n\n` +
            `¿Deseas marcar la categoría como inactiva?`;
          
          const proceedWithDeactivation = confirm(message);
          
          if (proceedWithDeactivation) {
            // Forzar desactivación
            const forceResponse = await fetch(`/api/categories/${categoryId}?force=true`, {
              method: 'DELETE',
            });
            
            if (forceResponse.ok) {
              await refreshCategories();
              alert('Categoría marcada como inactiva correctamente');
            } else {
              const forceError = await forceResponse.json();
              alert(forceError.error || 'Error al marcar como inactiva');
            }
          }
        } else {
          alert(responseData.error || 'Error al eliminar la categoría');
        }
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Error de conexión al eliminar la categoría');
    } finally {
      setDeleteLoading(null);
    }
  };

  // Handle toggle category status
  const handleToggleStatus = async (categoryId: string, currentActive: boolean) => {
    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ active: !currentActive }),
      });

      if (response.ok) {
        await refreshCategories();
        alert(`Categoría ${!currentActive ? 'activada' : 'desactivada'} correctamente`);
      } else {
        const data = await response.json();
        alert(data.error || 'Error al cambiar el estado de la categoría');
      }
    } catch (error) {
      console.error('Error toggling category status:', error);
      alert('Error de conexión');
    }
  };

  const canEdit = session?.user.role === 'ADMIN' || session?.user.role === 'ALMACEN';
  const isAdmin = session?.user.role === 'ADMIN';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Categorías</h1>
          <p className="text-sm text-gray-600">
            {pagination.total} categorías encontradas
          </p>
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
            onClick={refreshCategories}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          
          {canEdit && (
            <>
              <Button
                onClick={handleCreateCategory}
                className="flex items-center gap-2 ml-2"
              >
                <PlusIcon className="h-4 w-4" />
                Nueva Categoría
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
              placeholder="Buscar categorías por nombre o descripción..."
              value={localSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters (collapsible) */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
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
                  <option value="true">Activas</option>
                  <option value="false">Inactivas</option>
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
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    clearFilters();
                    setLocalSearch('');
                  }}
                  className="w-full"
                >
                  Limpiar Filtros
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Categories Table - Desktop */}
      <div className="hidden lg:block">
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 min-w-[200px]">Categoría</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 min-w-[180px]">Descripción</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900 w-24">Productos</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900 w-20">Estado</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900 w-28">Fecha</th>
                  {canEdit && (
                    <th className="text-center py-3 px-4 font-medium text-gray-900 w-32">Acciones</th>
                  )}
                </tr>
              </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={canEdit ? 6 : 5} className="py-8 text-center text-gray-500">
                    Cargando categorías...
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 6 : 5} className="py-8 text-center text-gray-500">
                    No se encontraron categorías
                  </td>
                </tr>
              ) : (
                categories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50">
                    {/* Category Name */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <TagIcon className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{category.name}</div>
                          <div className="text-xs text-gray-500">ID: {category.id}</div>
                        </div>
                      </div>
                    </td>

                    {/* Description */}
                    <td className="py-3 px-4">
                      <div className="text-sm text-gray-600 max-w-xs truncate">
                        {category.description || 'Sin descripción'}
                      </div>
                    </td>

                    {/* Product Count */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <BuildingStorefrontIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium">
                          {(category as any).product_count || 0}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-center">
                      <Badge
                        variant={category.active ? 'default' : 'secondary'}
                        className={category.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                      >
                        {category.active ? 'Activa' : 'Inactiva'}
                      </Badge>
                    </td>

                    {/* Creation Date */}
                    <td className="py-3 px-4 text-center text-sm text-gray-600 w-28">
                      {new Date(category.createdAt).toLocaleDateString('es-ES', { 
                        day: '2-digit', 
                        month: '2-digit', 
                        year: '2-digit' 
                      })}
                    </td>

                    {/* Actions */}
                    {canEdit && (
                      <td className="py-3 px-4 w-32">
                        <div className="flex items-center justify-center gap-1">
                          {/* Edit Button */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditCategory(category)}
                            className="h-7 w-7 p-0 hover:bg-blue-50 border-blue-200"
                            title="Editar categoría"
                          >
                            <PencilIcon className="h-3.5 w-3.5 text-blue-600" />
                          </Button>
                          
                          {/* Toggle Status Button */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleStatus(category.id, category.active)}
                            className={`h-7 w-7 p-0 ${
                              category.active 
                                ? 'hover:bg-orange-50 border-orange-200 text-orange-600' 
                                : 'hover:bg-green-50 border-green-200 text-green-600'
                            }`}
                            title={category.active ? 'Desactivar categoría' : 'Activar categoría'}
                          >
                            {category.active ? (
                              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                              </svg>
                            ) : (
                              <EyeIcon className="h-3.5 w-3.5" />
                            )}
                          </Button>

                          {/* Delete Button (only for ADMIN) */}
                          {isAdmin && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteCategory(category.id)}
                              disabled={deleteLoading === category.id}
                              className="h-7 w-7 p-0 hover:bg-red-50 border-red-200 text-red-600"
                              title="Eliminar categoría"
                            >
                              {deleteLoading === category.id ? (
                                <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <TrashIcon className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View - Card Layout */}
        <div className="md:hidden space-y-4">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="p-4">
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4"></div>
                  <div className="flex justify-between items-center">
                    <div className="h-6 bg-gray-200 rounded animate-pulse w-16"></div>
                    <div className="flex gap-2">
                      <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          ) : categories.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-gray-500">
                {filters.search || filters.active !== null 
                  ? 'No se encontraron categorías con los filtros aplicados.'
                  : 'No hay categorías disponibles.'
                }
              </p>
            </Card>
          ) : (
            categories.map((category) => (
              <Card key={category.id} className="p-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{category.name}</h3>
                      {category.description && (
                        <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                      )}
                    </div>
                    <Badge 
                      variant={category.active ? "default" : "secondary"}
                      className="ml-2"
                    >
                      {category.active ? 'Activa' : 'Inactiva'}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-sm text-gray-500">
                      {(category as any).product_count || 0} producto{((category as any).product_count || 0) !== 1 ? 's' : ''}
                    </span>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditCategory(category)}
                        className="h-8 w-8 p-0"
                        title="Editar categoría"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteCategory(category.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Eliminar categoría"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <div className="text-sm text-gray-700">
              Mostrando {((pagination.page - 1) * pagination.limit) + 1} a{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
              {pagination.total} categorías
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(pagination.page - 1)}
                disabled={!pagination.hasPrev || loading}
                className="flex items-center gap-1"
              >
                <ChevronLeftIcon className="h-4 w-4" />
                Anterior
              </Button>
              
              <span className="text-sm text-gray-600">
                Página {pagination.page} de {pagination.totalPages}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(pagination.page + 1)}
                disabled={!pagination.hasNext || loading}
                className="flex items-center gap-1"
              >
                Siguiente
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Category Modal */}
      <CategoryModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        category={editingCategory}
        onSave={handleSaveCategory}
      />
    </div>
  );
}
