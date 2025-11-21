/**
 * Componente para rastrear el estado de las entregas
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TruckIcon, 
  MapPinIcon, 
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  PhoneIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { DeliveryStatus, Delivery } from '@/types/pos';

interface DeliveryTrackingProps {
  deliveryId: string;
  onStatusUpdate?: (status: DeliveryStatus) => void;
}

interface DeliveryTracking extends Delivery {
  customer: {
    name: string;
    phone?: string;
  };
  address: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    formattedAddress?: string;
  };
  sale: {
    id: string;
    total: number;
    items: Array<{
      productName: string;
      quantity: number;
    }>;
  };
}

export default function DeliveryTracking({ 
  deliveryId, 
  onStatusUpdate 
}: DeliveryTrackingProps) {
  const [delivery, setDelivery] = useState<DeliveryTracking | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDelivery();
  }, [deliveryId]);

  const loadDelivery = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/deliveries/${deliveryId}`);
      if (!response.ok) {
        throw new Error('Error al cargar la entrega');
      }

      const data = await response.json();
      setDelivery(data.delivery);
    } catch (error) {
      console.error('Error loading delivery:', error);
      setError('Error al cargar la información de entrega');
    } finally {
      setLoading(false);
    }
  };

  const updateDeliveryStatus = async (newStatus: DeliveryStatus) => {
    if (!delivery) return;

    setUpdating(true);
    try {
      const response = await fetch(`/api/deliveries/${deliveryId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Error al actualizar el estado');
      }

      const data = await response.json();
      setDelivery(prev => prev ? { ...prev, deliveryStatus: newStatus } : null);
      onStatusUpdate?.(newStatus);
    } catch (error) {
      console.error('Error updating status:', error);
      setError('Error al actualizar el estado de entrega');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusConfig = (status: DeliveryStatus) => {
    const configs = {
      [DeliveryStatus.PENDING]: {
        label: 'Pendiente',
        color: 'bg-yellow-100 text-yellow-800',
        icon: ClockIcon,
        description: 'Pedido recibido, esperando preparación'
      },
      [DeliveryStatus.PREPARING]: {
        label: 'Preparando',
        color: 'bg-blue-100 text-blue-800',
        icon: ArrowPathIcon,
        description: 'Preparando el pedido para envío'
      },
      [DeliveryStatus.IN_TRANSIT]: {
        label: 'En Camino',
        color: 'bg-purple-100 text-purple-800',
        icon: TruckIcon,
        description: 'El pedido está en camino a su destino'
      },
      [DeliveryStatus.DELIVERED]: {
        label: 'Entregado',
        color: 'bg-green-100 text-green-800',
        icon: CheckCircleIcon,
        description: 'Pedido entregado exitosamente'
      },
      [DeliveryStatus.FAILED]: {
        label: 'Falló',
        color: 'bg-red-100 text-red-800',
        icon: XCircleIcon,
        description: 'No se pudo completar la entrega'
      },
      [DeliveryStatus.RETURNED]: {
        label: 'Devuelto',
        color: 'bg-gray-100 text-gray-800',
        icon: ArrowPathIcon,
        description: 'Pedido devuelto al origen'
      }
    };

    return configs[status];
  };

  const getAvailableActions = (currentStatus: DeliveryStatus) => {
    const actions: Array<{ status: DeliveryStatus; label: string; variant?: 'default' | 'secondary' }> = [];

    switch (currentStatus) {
      case DeliveryStatus.PENDING:
        actions.push({ status: DeliveryStatus.PREPARING, label: 'Marcar como Preparando' });
        actions.push({ status: DeliveryStatus.FAILED, label: 'Marcar como Fallido', variant: 'secondary' });
        break;
      case DeliveryStatus.PREPARING:
        actions.push({ status: DeliveryStatus.IN_TRANSIT, label: 'Enviar' });
        actions.push({ status: DeliveryStatus.FAILED, label: 'Marcar como Fallido', variant: 'secondary' });
        break;
      case DeliveryStatus.IN_TRANSIT:
        actions.push({ status: DeliveryStatus.DELIVERED, label: 'Marcar como Entregado' });
        actions.push({ status: DeliveryStatus.FAILED, label: 'Marcar como Fallido', variant: 'secondary' });
        break;
      case DeliveryStatus.FAILED:
        actions.push({ status: DeliveryStatus.PREPARING, label: 'Reintentar' });
        actions.push({ status: DeliveryStatus.RETURNED, label: 'Marcar como Devuelto' });
        break;
    }

    return actions;
  };

  const formatAddress = (address: DeliveryTracking['address']) => {
    return [
      address.addressLine1,
      address.addressLine2,
      `${address.city}, ${address.state}`
    ].filter(Boolean).join(', ');
  };

  const formatEstimatedTime = (delivery: DeliveryTracking) => {
    if (!delivery.estimatedDeliveryTime) return 'No disponible';
    
    const now = new Date();
    const estimated = new Date(delivery.estimatedDeliveryTime);
    const diffMs = estimated.getTime() - now.getTime();
    const diffMins = Math.round(diffMs / (1000 * 60));

    if (diffMins < 0) {
      return 'Tiempo estimado pasado';
    } else if (diffMins < 60) {
      return `${diffMins} minutos`;
    } else {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `${hours}h ${mins}m`;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <ArrowPathIcon className="h-6 w-6 animate-spin mr-2" />
            Cargando información de entrega...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !delivery) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <ExclamationTriangleIcon className="h-4 w-4" />
        <AlertDescription>
          {error || 'No se pudo cargar la información de entrega'}
        </AlertDescription>
      </Alert>
    );
  }

  const statusConfig = getStatusConfig(delivery.deliveryStatus);
  const StatusIcon = statusConfig.icon;
  const availableActions = getAvailableActions(delivery.deliveryStatus);

  return (
    <div className="space-y-4">
      {/* Estado principal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <StatusIcon className="h-6 w-6" />
            Estado de Entrega
            <Badge className={statusConfig.color}>
              {statusConfig.label}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">{statusConfig.description}</p>
          
          {/* Información de tiempo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700">Pedido realizado</p>
              <p className="text-sm text-gray-600">
                {new Date(delivery.createdAt).toLocaleString('es-MX')}
              </p>
            </div>
            {delivery.estimatedDeliveryTime && (
              <div>
                <p className="text-sm font-medium text-gray-700">Tiempo estimado</p>
                <p className="text-sm text-gray-600">
                  {formatEstimatedTime(delivery)}
                </p>
              </div>
            )}
          </div>

          {/* Acciones disponibles */}
          {availableActions.length > 0 && (
            <div className="pt-4 border-t">
              <p className="text-sm font-medium text-gray-700 mb-3">Acciones disponibles</p>
              <div className="flex flex-wrap gap-2">
                {availableActions.map((action) => (
                  <Button
                    key={action.status}
                    variant={action.variant || 'default'}
                    size="sm"
                    onClick={() => updateDeliveryStatus(action.status)}
                    disabled={updating}
                  >
                    {updating ? (
                      <ArrowPathIcon className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Información del cliente y dirección */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PhoneIcon className="h-5 w-5" />
              Cliente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{delivery.customer.name}</p>
            {delivery.customer.phone && (
              <p className="text-sm text-gray-600">{delivery.customer.phone}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPinIcon className="h-5 w-5" />
              Dirección de Entrega
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              {delivery.address.formattedAddress || formatAddress(delivery.address)}
            </p>
            {delivery.customerNotes && (
              <p className="text-sm text-gray-600 mt-2">
                <strong>Notas:</strong> {delivery.customerNotes}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Información del pedido */}
      <Card>
        <CardHeader>
          <CardTitle>Detalles del Pedido</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-medium">ID de Venta:</span>
              <span className="text-sm text-gray-600">{delivery.sale.id}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="font-medium">Total:</span>
              <span className="font-medium">${delivery.sale.total.toFixed(2)}</span>
            </div>

            {delivery.deliveryFee > 0 && (
              <div className="flex justify-between items-center">
                <span className="font-medium">Costo de entrega:</span>
                <span className="text-sm">${delivery.deliveryFee.toFixed(2)}</span>
              </div>
            )}

            <div className="pt-3 border-t">
              <p className="font-medium mb-2">Productos:</p>
              <div className="space-y-1">
                {delivery.sale.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{item.productName}</span>
                    <span>x{item.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}