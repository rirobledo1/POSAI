/**
 * Componente para seleccionar tipo de entrega en el POS
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BuildingStorefrontIcon, 
  TruckIcon, 
  MapPinIcon,
  ClockIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { DeliveryType, DeliveryAddress, Customer } from '@/types/pos';
import { calculateDeliveryFee as calculateFee, formatDeliveryInfo, DeliveryCalculation } from '@/lib/delivery';
import AddressManager from './AddressManager';

interface DeliveryOption {
  type: DeliveryType;
  label: string;
  description: string;
  icon: React.ComponentType<any>;
  fee?: number;
  estimatedTime?: string;
  available: boolean;
}

interface DeliverySelectorProps {
  customer?: Customer;
  orderTotal: number;
  selectedDeliveryType: DeliveryType;
  selectedAddressId?: string;
  onDeliveryTypeChange: (type: DeliveryType) => void;
  onAddressChange: (addressId: string) => void;
  onDeliveryFeeChange: (fee: number) => void;
}

export default function DeliverySelector({
  customer,
  orderTotal,
  selectedDeliveryType,
  selectedAddressId,
  onDeliveryTypeChange,
  onAddressChange,
  onDeliveryFeeChange
}: DeliverySelectorProps) {
  const [addresses, setAddresses] = useState<DeliveryAddress[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [showAddressManager, setShowAddressManager] = useState(false);
  const [deliveryCalculation, setDeliveryCalculation] = useState<DeliveryCalculation | null>(null);

  // Cargar direcciones del cliente
  useEffect(() => {
    if (customer?.id && selectedDeliveryType !== 'PICKUP') {
      loadCustomerAddresses();
    }
  }, [customer?.id, selectedDeliveryType]);

  // Calcular tarifa cuando cambia la dirección seleccionada
  useEffect(() => {
    if (selectedAddressId && selectedDeliveryType !== 'PICKUP') {
      calculateDeliveryFee();
    } else {
      setDeliveryCalculation(null);
      onDeliveryFeeChange(0);
    }
  }, [selectedAddressId, orderTotal]);

  const loadCustomerAddresses = async () => {
    if (!customer?.id) return;

    setLoadingAddresses(true);
    try {
      const response = await fetch(`/api/delivery/addresses/${customer.id}`);
      if (response.ok) {
        const data = await response.json();
        setAddresses(data.addresses || []);
        
        // Auto-seleccionar dirección principal si existe
        const defaultAddress = data.addresses?.find((addr: DeliveryAddress) => addr.isDefault);
        if (defaultAddress && !selectedAddressId) {
          onAddressChange(defaultAddress.id);
        }
      }
    } catch (error) {
      console.error('Error loading addresses:', error);
    } finally {
      setLoadingAddresses(false);
    }
  };

  const calculateDeliveryFee = () => {
    const selectedAddress = addresses.find(addr => addr.id === selectedAddressId);
    if (!selectedAddress || !selectedAddress.latitude || !selectedAddress.longitude) {
      return;
    }

    try {
      const calculation = calculateFee(
        selectedAddress.latitude,
        selectedAddress.longitude,
        orderTotal
      );
      
      setDeliveryCalculation(calculation);
      onDeliveryFeeChange(calculation?.totalFee || 0);
    } catch (error) {
      console.error('Error calculating delivery fee:', error);
      setDeliveryCalculation(null);
      onDeliveryFeeChange(0);
    }
  };

  const deliveryOptions: DeliveryOption[] = [
    {
      type: DeliveryType.PICKUP,
      label: 'Recoger en Tienda',
      description: 'El cliente recoge el pedido en nuestra ubicación',
      icon: BuildingStorefrontIcon,
      fee: 0,
      estimatedTime: 'Inmediato',
      available: true
    },
    {
      type: DeliveryType.LOCAL,
      label: 'Entrega Local',
      description: 'Entrega en la misma ciudad o zona metropolitana',
      icon: TruckIcon,
      fee: deliveryCalculation?.totalFee || 50,
      estimatedTime: deliveryCalculation ? `${deliveryCalculation.estimatedTime} min` : '30-60 min',
      available: !!customer?.id
    },
    {
      type: DeliveryType.FORANEO,
      label: 'Entrega Foránea',
      description: 'Entrega a otras ciudades o estados',
      icon: TruckIcon,
      fee: deliveryCalculation?.totalFee || 150,
      estimatedTime: deliveryCalculation ? `${deliveryCalculation.estimatedTime} min` : '2-4 hrs',
      available: !!customer?.id
    }
  ];

  const handleDeliveryTypeSelect = (type: DeliveryType) => {
    onDeliveryTypeChange(type);
    
    if (type === 'PICKUP') {
      onDeliveryFeeChange(0);
      setDeliveryCalculation(null);
    }
  };

  const handleAddressAdded = (address: DeliveryAddress) => {
    setAddresses(prev => [...prev, address]);
    onAddressChange(address.id);
    setShowAddressManager(false);
  };

  const handleAddressUpdated = (address: DeliveryAddress) => {
    setAddresses(prev => prev.map(addr => addr.id === address.id ? address : addr));
  };

  const handleAddressDeleted = (addressId: string) => {
    setAddresses(prev => prev.filter(addr => addr.id !== addressId));
    if (selectedAddressId === addressId) {
      onAddressChange('');
    }
  };

  const selectedAddress = addresses.find(addr => addr.id === selectedAddressId);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Tipo de Entrega</h3>

      {/* Opciones de entrega */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {deliveryOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = selectedDeliveryType === option.type;
          const isDisabled = !option.available;

          return (
            <Card 
              key={option.type}
              className={`cursor-pointer transition-all ${
                isSelected 
                  ? 'ring-2 ring-blue-500 bg-blue-50' 
                  : isDisabled 
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-gray-50'
              }`}
              onClick={() => option.available && handleDeliveryTypeSelect(option.type)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Icon className={`h-6 w-6 mt-1 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`} />
                  <div className="flex-1">
                    <h4 className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                      {option.label}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {option.description}
                    </p>
                    
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-1">
                        <CurrencyDollarIcon className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium">
                          {option.fee === 0 ? 'Gratis' : `$${option.fee}`}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <ClockIcon className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {option.estimatedTime}
                        </span>
                      </div>
                    </div>

                    {!option.available && (
                      <Badge variant="secondary" className="mt-2 text-xs">
                        Requiere cliente
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Información de entrega calculada */}
      {deliveryCalculation && selectedDeliveryType !== 'PICKUP' && (
        <Alert className="border-green-200 bg-green-50">
          <TruckIcon className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-medium text-green-800">
                Información de Entrega
              </p>
              <p className="text-sm text-green-700">
                {formatDeliveryInfo(deliveryCalculation)}
              </p>
              {deliveryCalculation.isFreeDelivery && (
                <p className="text-sm font-medium text-green-800">
                  🎉 ¡Envío gratuito por compra mayor a ${deliveryCalculation.zone.freeDeliveryMinimum}!
                </p>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Selector de dirección */}
      {selectedDeliveryType !== 'PICKUP' && customer?.id && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Dirección de Entrega</h4>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddressManager(true)}
            >
              <MapPinIcon className="h-4 w-4 mr-2" />
              Gestionar Direcciones
            </Button>
          </div>

          {addresses.length > 0 ? (
            <div className="space-y-2">
              {addresses.map((address) => (
                <Card 
                  key={address.id}
                  className={`cursor-pointer transition-all ${
                    selectedAddressId === address.id 
                      ? 'ring-2 ring-blue-500 bg-blue-50' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => onAddressChange(address.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{address.addressLine1}</p>
                        <p className="text-sm text-gray-600">
                          {address.addressLine2 && `${address.addressLine2}, `}
                          {address.city}, {address.state}
                        </p>
                        {address.deliveryNotes && (
                          <p className="text-xs text-gray-500 mt-1">
                            {address.deliveryNotes}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {address.isDefault && (
                          <Badge variant="default" className="text-xs">Principal</Badge>
                        )}
                        {address.deliveryZone && (
                          <Badge 
                            variant={address.deliveryZone === 'LOCAL' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {address.deliveryZone === 'LOCAL' ? 'Local' : 'Foráneo'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Alert className="border-yellow-200 bg-yellow-50">
              <MapPinIcon className="h-4 w-4" />
              <AlertDescription>
                <p className="text-yellow-800">
                  Este cliente no tiene direcciones registradas.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => setShowAddressManager(true)}
                >
                  Agregar Dirección
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Gestión de direcciones */}
      {showAddressManager && customer?.id && (
        <div className="border-t pt-4">
          <AddressManager
            customerId={customer.id}
            addresses={addresses}
            onAddressAdded={handleAddressAdded}
            onAddressUpdated={handleAddressUpdated}
            onAddressDeleted={handleAddressDeleted}
          />
          <div className="mt-4 flex justify-end">
            <Button
              variant="outline"
              onClick={() => setShowAddressManager(false)}
            >
              Cerrar
            </Button>
          </div>
        </div>
      )}

      {/* Mensaje si no hay cliente seleccionado */}
      {selectedDeliveryType !== 'PICKUP' && !customer?.id && (
        <Alert className="border-blue-200 bg-blue-50">
          <AlertDescription>
            <p className="text-blue-800">
              Selecciona un cliente para habilitar las opciones de entrega a domicilio.
            </p>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}