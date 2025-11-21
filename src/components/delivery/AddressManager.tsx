/**
 * Componente para gestionar direcciones de entrega del cliente
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPinIcon, PlusIcon, PencilIcon, TrashIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { DeliveryAddress, DeliveryType } from '@/types/pos';

interface AddressManagerProps {
  customerId: string;
  addresses: DeliveryAddress[];
  onAddressAdded: (address: DeliveryAddress) => void;
  onAddressUpdated: (address: DeliveryAddress) => void;
  onAddressDeleted: (addressId: string) => void;
  onAddressSelected?: (address: DeliveryAddress) => void;
  selectedAddressId?: string;
  showSelector?: boolean;
}

export default function AddressManager({
  customerId,
  addresses,
  onAddressAdded,
  onAddressUpdated,
  onAddressDeleted,
  onAddressSelected,
  selectedAddressId,
  showSelector = false
}: AddressManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<DeliveryAddress | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    deliveryNotes: '',
    isDefault: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when showing/hiding
  useEffect(() => {
    if (!showForm && !editingAddress) {
      setFormData({
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        postalCode: '',
        deliveryNotes: '',
        isDefault: false
      });
      setErrors({});
    }
  }, [showForm, editingAddress]);

  // Load address data when editing
  useEffect(() => {
    if (editingAddress) {
      setFormData({
        addressLine1: editingAddress.addressLine1,
        addressLine2: editingAddress.addressLine2 || '',
        city: editingAddress.city,
        state: editingAddress.state,
        postalCode: editingAddress.postalCode || '',
        deliveryNotes: editingAddress.deliveryNotes || '',
        isDefault: editingAddress.isDefault
      });
    }
  }, [editingAddress]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.addressLine1.trim()) {
      newErrors.addressLine1 = 'La dirección es requerida';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'La ciudad es requerida';
    }

    if (!formData.state.trim()) {
      newErrors.state = 'El estado es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const addressData = {
        customerId,
        addressLine1: formData.addressLine1.trim(),
        addressLine2: formData.addressLine2.trim() || null,
        city: formData.city.trim(),
        state: formData.state.trim(),
        postalCode: formData.postalCode.trim() || null,
        country: 'México',
        latitude: null,
        longitude: null,
        deliveryNotes: formData.deliveryNotes.trim() || null,
        isVerified: false,
        deliveryZone: 'LOCAL',
        geocodeProvider: null,
        lastGeocoded: null,
        isDefault: formData.isDefault
      };

      const url = editingAddress
        ? `/api/delivery/addresses/${customerId}/${editingAddress.id}`
        : `/api/delivery/addresses/${customerId}`;      const method = editingAddress ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addressData)
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Error response:', errorData);
        throw new Error(`Error al guardar la dirección: ${response.status} ${response.statusText}`);
      }

      const responseData = await response.json();
      const savedAddress = responseData.address; // Extraer solo el objeto address
      
      console.log('📍 Dirección guardada:', savedAddress);

      if (editingAddress) {
        onAddressUpdated(savedAddress);
      } else {
        onAddressAdded(savedAddress);
      }

      // Reset form
      setShowForm(false);
      setEditingAddress(null);
      setFormData({
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        postalCode: '',
        deliveryNotes: '',
        isDefault: false
      });

    } catch (error) {
      console.error('Error saving address:', error);
      setErrors({ general: 'Error al guardar la dirección' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (addressId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta dirección?')) return;

    try {
      const response = await fetch(`/api/delivery/addresses/${customerId}/${addressId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Error al eliminar la dirección');
      }

      onAddressDeleted(addressId);
    } catch (error) {
      console.error('Error deleting address:', error);
    }
  };

  const handleEdit = (address: DeliveryAddress) => {
    setEditingAddress(address);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingAddress(null);
    setErrors({});
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Direcciones de Entrega</h3>
        {!showForm && (
          <Button
            onClick={() => setShowForm(true)}
            size="sm"
            className="flex items-center gap-2"
          >
            <PlusIcon className="h-4 w-4" />
            Nueva Dirección
          </Button>
        )}
      </div>

      {/* Lista de direcciones */}
      <div className="space-y-3">
        {addresses.map((address) => (
          <Card 
            key={address.id} 
            className={`${showSelector && selectedAddressId === address.id ? 'ring-2 ring-blue-500' : ''} ${showSelector ? 'cursor-pointer hover:bg-gray-50' : ''}`}
            onClick={() => showSelector && onAddressSelected?.(address)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPinIcon className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">{address.addressLine1}</span>
                    {address.isDefault && (
                      <Badge variant="default" className="text-xs">Principal</Badge>
                    )}
                    {address.isVerified && (
                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                        Verificada
                      </Badge>
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    {address.addressLine2 && (
                      <p>{address.addressLine2}</p>
                    )}
                    <p>{address.city}, {address.state}</p>
                    {address.postalCode && (
                      <p>CP: {address.postalCode}</p>
                    )}
                    {address.deliveryNotes && (
                      <p className="text-xs italic">Notas: {address.deliveryNotes}</p>
                    )}
                    {address.deliveryZone && (
                      <div className="mt-2">
                        <Badge 
                          variant={address.deliveryZone === 'LOCAL' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {address.deliveryZone === 'LOCAL' ? 'Entrega Local' : 'Entrega Foránea'}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>

                {!showSelector && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(address)}
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(address.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {showSelector && selectedAddressId === address.id && (
                  <CheckIcon className="h-5 w-5 text-blue-600" />
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {addresses.length === 0 && !showForm && (
          <div className="text-center py-8 text-gray-500">
            <MapPinIcon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p>No hay direcciones registradas</p>
            <p className="text-sm">Agrega una dirección para entregas a domicilio</p>
          </div>
        )}
      </div>

      {/* Formulario */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingAddress ? 'Editar Dirección' : 'Nueva Dirección'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {errors.general && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-700">
                    {errors.general}
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">
                    Dirección *
                  </label>
                  <Input
                    value={formData.addressLine1}
                    onChange={(e) => setFormData(prev => ({ ...prev, addressLine1: e.target.value }))}
                    placeholder="Calle y número"
                    className={errors.addressLine1 ? 'border-red-500' : ''}
                  />
                  {errors.addressLine1 && (
                    <p className="text-red-500 text-sm mt-1">{errors.addressLine1}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">
                    Colonia / Fraccionamiento
                  </label>
                  <Input
                    value={formData.addressLine2}
                    onChange={(e) => setFormData(prev => ({ ...prev, addressLine2: e.target.value }))}
                    placeholder="Colonia, fraccionamiento, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Ciudad *
                  </label>
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="Ciudad"
                    className={errors.city ? 'border-red-500' : ''}
                  />
                  {errors.city && (
                    <p className="text-red-500 text-sm mt-1">{errors.city}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Estado *
                  </label>
                  <Input
                    value={formData.state}
                    onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                    placeholder="Estado"
                    className={errors.state ? 'border-red-500' : ''}
                  />
                  {errors.state && (
                    <p className="text-red-500 text-sm mt-1">{errors.state}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Código Postal
                  </label>
                  <Input
                    value={formData.postalCode}
                    onChange={(e) => setFormData(prev => ({ ...prev, postalCode: e.target.value }))}
                    placeholder="12345"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">
                    Referencias de Ubicación
                  </label>
                  <textarea
                    value={formData.deliveryNotes}
                    onChange={(e) => setFormData(prev => ({ ...prev, deliveryNotes: e.target.value }))}
                    placeholder="Entre qué calles, color de casa, puntos de referencia..."
                    rows={3}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isDefault}
                      onChange={(e) => setFormData(prev => ({ ...prev, isDefault: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm">Establecer como dirección principal</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                
                <Button
                  type="submit"
                  disabled={loading}
                >
                  {loading ? 'Guardando...' : editingAddress ? 'Actualizar' : 'Guardar'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}