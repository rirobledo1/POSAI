// src/components/dashboard/CustomerManagerOptimized.tsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Users,
  CreditCard,
  AlertCircle,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCustomersOptimized, Customer } from '@/hooks/useCustomersOptimized';
import { useNotifications } from '@/contexts/NotificationContext';

// Modal de edición/creación de cliente
interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer?: Customer | null;
  onSave: (customer: Partial<Customer>) => Promise<void>;
  initialName?: string | null;
}

const CustomerModal: React.FC<CustomerModalProps> = ({ isOpen, onClose, customer, onSave, initialName }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    creditLimit: 0,
    currentDebt: 0,
    active: true
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cargar datos del cliente cuando se abre el modal para edición
  useEffect(() => {
    if (isOpen && customer) {
      setFormData({
        name: customer.name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        address: customer.address || '',
        creditLimit: customer.creditLimit || 0,
        currentDebt: customer.currentDebt || 0,
        active: customer.active ?? true
      });
    } else if (isOpen && !customer) {
      // Resetear para nuevo cliente
      setFormData({
        name: initialName || '',
        email: '',
        phone: '',
        address: '',
        creditLimit: 0,
        currentDebt: 0,
        active: true
      });
    }
  }, [isOpen, customer, initialName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('El nombre es obligatorio');
      return;
    }

    setIsSubmitting(true);
    try {
      const dataToSave = customer 
        ? { ...formData, id: customer.id }
        : formData;
      
      await onSave(dataToSave);
      onClose();
    } catch (error) {
      console.error('Error al guardar cliente:', error);
      alert('Error al guardar el cliente');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              {customer ? 'Editar Cliente' : 'Nuevo Cliente'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Nombre completo del cliente"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="email@ejemplo.com"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teléfono
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="+52 555 123 4567"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dirección
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                rows={3}
                placeholder="Dirección completa del cliente"
                disabled={isSubmitting}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Límite de Crédito
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={formData.creditLimit}
                    onChange={(e) => setFormData(prev => ({ ...prev, creditLimit: parseFloat(e.target.value) || 0 }))}
                    className="w-full pl-8 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deuda Actual
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={formData.currentDebt}
                    onChange={(e) => setFormData(prev => ({ ...prev, currentDebt: parseFloat(e.target.value) || 0 }))}
                    className="w-full pl-8 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center bg-gray-50 p-3 rounded-lg">
              <input
                type="checkbox"
                id="active"
                checked={formData.active ?? true}
                onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                disabled={isSubmitting}
              />
              <label htmlFor="active" className="ml-3 block text-sm font-medium text-gray-900">
                Cliente activo
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Guardando...
                  </div>
                ) : (
                  'Guardar'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Interface para props del componente principal
interface CustomerManagerOptimizedProps {
  shouldCreate?: boolean;
  returnTo?: string | null;
  initialName?: string | null;
}

// Componente principal
const CustomerManagerOptimized: React.FC<CustomerManagerOptimizedProps> = ({ 
  shouldCreate = false, 
  returnTo = null, 
  initialName = null 
}) => {
  const {
    customers,
    pagination,
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
    filters,
    setActiveFilter,
    setDebtFilter,
    sorting,
    setSorting,
    changePage,
    refreshCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer
  } = useCustomersOptimized();

  const router = useRouter();
  const { showSuccess, showError, showWarning, addNotification } = useNotifications();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Abrir modal automáticamente si shouldCreate es true
  useEffect(() => {
    if (shouldCreate) {
      setSelectedCustomer(null);
      setIsModalOpen(true);
    }
  }, [shouldCreate]);

  const handleCreateCustomer = () => {
    setSelectedCustomer(null);
    setIsModalOpen(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsModalOpen(true);
  };

  const handleSaveCustomer = async (customerData: Partial<Customer>) => {
    try {
      if (selectedCustomer) {
        await updateCustomer(selectedCustomer.id, customerData);
        showSuccess(
          'Cliente actualizado',
          `${customerData.name} ha sido actualizado exitosamente`
        );
      } else {
        // Si es un nuevo cliente y viene desde el POS, regresar después de crear
        await createCustomer(customerData);
        
        addNotification({
          type: 'success',
          title: 'Cliente creado',
          message: `${customerData.name} ha sido registrado exitosamente`,
          duration: 5000,
          action: returnTo ? {
            label: 'Volver al POS',
            onClick: () => router.push(returnTo)
          } : undefined
        });
        
        if (returnTo) {
          router.push(returnTo);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      showError(
        selectedCustomer ? 'Error al actualizar cliente' : 'Error al crear cliente',
        errorMessage
      );
      throw error;
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    // Si viene desde el POS y se cancela, regresar
    if (shouldCreate && returnTo) {
      router.push(returnTo);
    }
  };

  const handleDeleteCustomer = async (customer: Customer) => {
    const confirmed = window.confirm(`¿Estás seguro de que quieres eliminar el cliente "${customer.name}"?`);
    
    if (confirmed) {
      try {
        await deleteCustomer(customer.id);
        showSuccess(
          'Cliente eliminado',
          `${customer.name} ha sido eliminado del sistema`
        );
      } catch (error) {
        console.error('Error al eliminar cliente:', error);
        showError(
          'Error al eliminar cliente',
          'No se pudo eliminar el cliente. Inténtalo de nuevo.'
        );
      }
    } else {
      showWarning(
        'Eliminación cancelada',
        `${customer.name} no fue eliminado`
      );
    }
  };

  const getStatusBadge = (customer: Customer) => {
    if (!customer.active) {
      return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">Inactivo</span>;
    }
    if (customer.currentDebt > 0) {
      return <span className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded-full">Con Deuda</span>;
    }
    return <span className="px-2 py-1 text-xs bg-green-100 text-green-600 rounded-full">Activo</span>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mb-4">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error al cargar clientes</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <Button
            onClick={refreshCustomers}
            className="flex items-center space-x-2 bg-red-600 text-white hover:bg-red-700"
          >
            <span>Intentar de nuevo</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <Users className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Clientes</h1>
            <p className="text-gray-600">
              {pagination.total} {pagination.total === 1 ? 'cliente' : 'clientes'}
            </p>
          </div>
        </div>
        <Button
          onClick={handleCreateCustomer}
          className="flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Nuevo Cliente</span>
        </Button>
      </div>

      {/* Filtros y búsqueda */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-6">
          {/* Búsqueda */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Buscar por nombre, email o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={filters.active || 'all'}
                onChange={(e) => setActiveFilter(e.target.value === 'all' ? null : e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
              >
                <option value="all">Todos los estados</option>
                <option value="true">Solo activos</option>
                <option value="false">Solo inactivos</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <CreditCard className="h-4 w-4 text-gray-500" />
              <select
                value={filters.hasDebt || 'all'}
                onChange={(e) => setDebtFilter(e.target.value === 'all' ? null : e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
              >
                <option value="all">Todos</option>
                <option value="true">Con deuda</option>
                <option value="false">Sin deuda</option>
              </select>
            </div>

            {/* Mostrar filtros activos */}
            {(filters.active || filters.hasDebt || searchTerm) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setActiveFilter(null);
                  setDebtFilter(null);
                }}
                className="flex items-center space-x-1 text-xs"
              >
                <span>Limpiar filtros</span>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tabla de clientes */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Cargando clientes</h3>
            <p className="text-gray-500">Por favor espera un momento...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-4">
              <Users className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron clientes</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || filters.active || filters.hasDebt 
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'Comienza agregando tu primer cliente'
              }
            </p>
            {!searchTerm && !filters.active && !filters.hasDebt && (
              <Button
                onClick={handleCreateCustomer}
                className="flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Agregar Cliente</span>
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Tabla desktop */}
            <div className="hidden md:block">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => setSorting('name', sorting.field === 'name' && sorting.order === 'asc' ? 'desc' : 'asc')}
                    >
                      Cliente
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contacto
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Límite/Deuda
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {customers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="px-3 py-4 whitespace-nowrap">
                        <div className="max-w-xs">
                          <div className="text-sm font-medium text-gray-900 truncate">{customer.name}</div>
                          {customer.address && (
                            <div className="text-xs text-gray-500 truncate">{customer.address}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        <div className="text-xs">
                          {customer.email && <div className="text-gray-900 truncate max-w-32">{customer.email}</div>}
                          {customer.phone && <div className="text-gray-500">{customer.phone}</div>}
                        </div>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        <div className="text-xs">
                          <div className="text-gray-900">{formatCurrency(customer.creditLimit)}</div>
                          <div className={`${customer.currentDebt > 0 ? 'text-red-600 font-medium' : 'text-green-600'}`}>
                            {formatCurrency(customer.currentDebt)}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-center">
                        {getStatusBadge(customer)}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/customers/${customer.id}`)}
                            className="h-7 w-7 p-0 text-blue-600 hover:text-blue-800"
                            title="Ver detalles"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditCustomer(customer)}
                            className="h-7 w-7 p-0"
                            title="Editar cliente"
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteCustomer(customer)}
                            className="h-7 w-7 p-0 text-red-600 hover:text-red-800"
                            title="Eliminar cliente"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Vista móvil mejorada */}
            <div className="md:hidden space-y-4">
              {customers.map((customer) => (
                <div key={customer.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-lg">{customer.name}</h3>
                      {customer.email && <p className="text-sm text-gray-600 mt-1">{customer.email}</p>}
                      {customer.phone && <p className="text-sm text-gray-600">{customer.phone}</p>}
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/customers/${customer.id}`)}
                        className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800"
                        title="Ver detalles"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditCustomer(customer)}
                        className="h-8 w-8 p-0"
                        title="Editar cliente"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteCustomer(customer)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-800"
                        title="Eliminar cliente"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                    <div>
                      <span className="text-gray-500">Límite: </span>
                      <span className="font-medium">{formatCurrency(customer.creditLimit)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Deuda: </span>
                      <span className={`font-medium ${customer.currentDebt > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(customer.currentDebt)}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    {customer.address && (
                      <p className="text-sm text-gray-500 truncate flex-1 mr-4">{customer.address}</p>
                    )}
                    {getStatusBadge(customer)}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Paginación */}
      {pagination.totalPages > 1 && (
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center text-sm text-gray-700">
              <span>
                Mostrando <span className="font-medium">{((pagination.page - 1) * 20) + 1}</span> a{' '}
                <span className="font-medium">{Math.min(pagination.page * 20, pagination.total)}</span> de{' '}
                <span className="font-medium">{pagination.total}</span> clientes
              </span>
            </div>
            
            <div className="flex items-center space-x-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => changePage(1)}
                disabled={!pagination.hasPrev}
                className="h-9 w-9 p-0"
                title="Primera página"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => changePage(pagination.page - 1)}
                disabled={!pagination.hasPrev}
                className="h-9 w-9 p-0"
                title="Página anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-300 rounded-lg">
                Página {pagination.page} de {pagination.totalPages}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => changePage(pagination.page + 1)}
                disabled={!pagination.hasNext}
                className="h-9 w-9 p-0"
                title="Página siguiente"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => changePage(pagination.totalPages)}
                disabled={!pagination.hasNext}
                className="h-9 w-9 p-0"
                title="Última página"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      <CustomerModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        customer={selectedCustomer}
        onSave={handleSaveCustomer}
        initialName={initialName}
      />
    </div>
  );
};

export default CustomerManagerOptimized;
