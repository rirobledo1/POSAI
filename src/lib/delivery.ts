/**
 * Utilidades para gestión de zonas de entrega y cálculo de tarifas
 */

import { DeliveryType } from '@/types/pos';

export interface DeliveryZoneConfig {
  id: string;
  name: string;
  type: DeliveryType;
  baseFee: number;
  feePerKm: number;
  maxDistance?: number;
  centerLat?: number;
  centerLng?: number;
  radius?: number;
  freeDeliveryMinimum?: number;
  isActive: boolean;
}

export interface DeliveryCalculation {
  zone: DeliveryZoneConfig;
  distance: number;
  baseFee: number;
  distanceFee: number;
  totalFee: number;
  isFreeDelivery: boolean;
  estimatedTime: number; // minutos
}

/**
 * Configuración por defecto de zonas de entrega
 */
export const DEFAULT_DELIVERY_ZONES: DeliveryZoneConfig[] = [
  {
    id: 'local-centro',
    name: 'Centro (Local)',
    type: DeliveryType.LOCAL,
    baseFee: 50,
    feePerKm: 10,
    maxDistance: 15,
    centerLat: 20.659698,
    centerLng: -103.349609,
    radius: 15,
    freeDeliveryMinimum: 1000,
    isActive: true
  },
  {
    id: 'local-extended',
    name: 'Zona Metropolitana',
    type: DeliveryType.LOCAL,
    baseFee: 80,
    feePerKm: 15,
    maxDistance: 25,
    centerLat: 20.659698,
    centerLng: -103.349609,
    radius: 25,
    freeDeliveryMinimum: 1500,
    isActive: true
  },
  {
    id: 'foraneo',
    name: 'Foráneo',
    type: DeliveryType.FORANEO,
    baseFee: 150,
    feePerKm: 20,
    maxDistance: 200,
    freeDeliveryMinimum: 3000,
    isActive: true
  }
];

/**
 * Calcula la distancia entre dos puntos GPS usando la fórmula de Haversine
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return Math.round(distance * 100) / 100; // Redondear a 2 decimales
}

/**
 * Determina la zona de entrega basada en las coordenadas
 */
export function determineDeliveryZone(
  destinationLat: number,
  destinationLng: number,
  zones: DeliveryZoneConfig[] = DEFAULT_DELIVERY_ZONES
): DeliveryZoneConfig | null {
  
  for (const zone of zones.filter(z => z.isActive)) {
    if (zone.type === 'FORANEO') {
      // Para zonas foráneas, verificar si está fuera de todas las zonas locales
      const isOutsideLocal = zones
        .filter(z => z.type === 'LOCAL' && z.isActive && z.centerLat && z.centerLng && z.radius)
        .every(localZone => {
          const distance = calculateDistance(
            localZone.centerLat!,
            localZone.centerLng!,
            destinationLat,
            destinationLng
          );
          return distance > localZone.radius!;
        });
      
      if (isOutsideLocal) {
        return zone;
      }
    } else if (zone.centerLat && zone.centerLng && zone.radius) {
      // Para zonas locales, verificar si está dentro del radio
      const distance = calculateDistance(
        zone.centerLat,
        zone.centerLng,
        destinationLat,
        destinationLng
      );
      
      if (distance <= zone.radius) {
        return zone;
      }
    }
  }
  
  return null; // No está en ninguna zona de cobertura
}

/**
 * Calcula el costo de entrega
 */
export function calculateDeliveryFee(
  destinationLat: number,
  destinationLng: number,
  orderTotal: number,
  zones: DeliveryZoneConfig[] = DEFAULT_DELIVERY_ZONES
): DeliveryCalculation | null {
  
  const zone = determineDeliveryZone(destinationLat, destinationLng, zones);
  
  if (!zone) {
    return null; // Fuera de zona de cobertura
  }
  
  // Calcular distancia desde el centro de la zona
  let distance = 0;
  if (zone.centerLat && zone.centerLng) {
    distance = calculateDistance(
      zone.centerLat,
      zone.centerLng,
      destinationLat,
      destinationLng
    );
  }
  
  // Verificar si excede la distancia máxima
  if (zone.maxDistance && distance > zone.maxDistance) {
    return null; // Fuera del rango máximo
  }
  
  // Calcular tarifas
  const baseFee = zone.baseFee;
  const distanceFee = Math.max(0, distance - 5) * zone.feePerKm; // Primeros 5km incluidos
  const totalFee = baseFee + distanceFee;
  
  // Verificar envío gratis
  const isFreeDelivery = zone.freeDeliveryMinimum 
    ? orderTotal >= zone.freeDeliveryMinimum 
    : false;
  
  // Estimar tiempo de entrega (promedio 30 km/h + 15 min de preparación)
  const estimatedTime = Math.round(15 + (distance / 30) * 60);
  
  return {
    zone,
    distance,
    baseFee,
    distanceFee,
    totalFee: isFreeDelivery ? 0 : totalFee,
    isFreeDelivery,
    estimatedTime
  };
}

/**
 * Verifica si una ubicación está dentro de la zona de cobertura
 */
export function isInDeliveryZone(
  destinationLat: number,
  destinationLng: number,
  zones: DeliveryZoneConfig[] = DEFAULT_DELIVERY_ZONES
): boolean {
  return determineDeliveryZone(destinationLat, destinationLng, zones) !== null;
}

/**
 * Obtiene todas las zonas de entrega activas
 */
export function getActiveDeliveryZones(
  zones: DeliveryZoneConfig[] = DEFAULT_DELIVERY_ZONES
): DeliveryZoneConfig[] {
  return zones.filter(zone => zone.isActive);
}

/**
 * Formatea la información de entrega para mostrar al usuario
 */
export function formatDeliveryInfo(calculation: DeliveryCalculation): string {
  const { zone, distance, totalFee, isFreeDelivery, estimatedTime } = calculation;
  
  let info = `${zone.name} (${distance.toFixed(1)}km)`;
  
  if (isFreeDelivery) {
    info += ' - ¡Envío GRATIS!';
  } else {
    info += ` - $${totalFee.toFixed(2)}`;
  }
  
  info += ` - ${estimatedTime} min aprox.`;
  
  return info;
}

/**
 * Genera un número de tracking único
 */
export function generateTrackingNumber(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `DEL-${timestamp}-${random}`.toUpperCase();
}

/**
 * Calcula el tiempo estimado de entrega
 */
export function calculateEstimatedDeliveryTime(
  distance: number,
  preparationTime: number = 30 // minutos
): Date {
  // Velocidad promedio: 25 km/h en ciudad, 50 km/h en carretera
  const averageSpeed = distance > 15 ? 45 : 25;
  const travelTime = (distance / averageSpeed) * 60; // en minutos
  const totalTime = preparationTime + travelTime;
  
  const now = new Date();
  now.setMinutes(now.getMinutes() + totalTime);
  
  return now;
}

/**
 * Valida si una dirección es válida para entrega
 */
export function validateDeliveryAddress(address: {
  addressLine1: string;
  city: string;
  state: string;
  latitude?: number;
  longitude?: number;
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!address.addressLine1?.trim()) {
    errors.push('La dirección es requerida');
  }
  
  if (!address.city?.trim()) {
    errors.push('La ciudad es requerida');
  }
  
  if (!address.state?.trim()) {
    errors.push('El estado es requerido');
  }
  
  if (address.latitude !== undefined && address.longitude !== undefined) {
    if (!isInDeliveryZone(address.latitude, address.longitude)) {
      errors.push('La dirección está fuera de la zona de cobertura');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}