// src/hooks/useShippingSettings.ts
'use client';

import { useState, useEffect, useCallback } from 'react';

export interface ShippingZone {
  id: string;
  name: string;
  description?: string;
  baseCost: number;
  costPerKm?: number;
  maxDistance?: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ShippingSettings {
  zones: ShippingZone[];
  defaultLocalCost: number;
  defaultForaneoCost: number;
  allowManualEdit: boolean;
  lastUpdated?: string;
}

interface UseShippingSettingsReturn {
  shippingSettings: ShippingSettings;
  zones: ShippingZone[];
  loading: boolean;
  error: string | null;
  addZone: (zone: Omit<ShippingZone, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  updateZone: (id: string, zone: Partial<ShippingZone>) => Promise<boolean>;
  deleteZone: (id: string) => Promise<boolean>;
  updateSettings: (settings: Partial<ShippingSettings>) => Promise<boolean>;
  calculateShippingCost: (zoneId?: string, distance?: number) => number;
  getZoneByName: (name: string) => ShippingZone | undefined;
  refreshSettings: () => Promise<void>;
}

export default function useShippingSettings(): UseShippingSettingsReturn {
  const [shippingSettings, setShippingSettings] = useState<ShippingSettings>({
    zones: [],
    defaultLocalCost: 50,
    defaultForaneoCost: 150,
    allowManualEdit: true
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar configuración inicial
  const loadShippingSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🚚 Intentando cargar configuración de envío...');
      const response = await fetch('/api/settings/shipping');
      console.log('🚚 Respuesta de la API:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('🚚 Datos recibidos:', data);
        setShippingSettings(prev => ({
          ...prev,
          ...data,
          zones: data.zones || prev.zones
        }));
      } else if (response.status === 404) {
        // Si no hay configuración, usar valores por defecto y crear configuración inicial
        console.log('📦 No hay configuración de envío, usando valores por defecto');
        await createDefaultSettings();
      } else {
        const errorData = await response.text();
        console.error('❌ Error HTTP:', response.status, errorData);
        throw new Error(`Error HTTP ${response.status}: ${errorData}`);
      }
    } catch (error) {
      console.error('Error cargando configuración de envío:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
      
      // En caso de error, usar configuración por defecto local
      console.log('🔄 Usando configuración de envío por defecto debido al error');
      setShippingSettings(prev => ({
        ...prev,
        zones: [],
        defaultLocalCost: 50,
        defaultForaneoCost: 150,
        allowManualEdit: true
      }));
    } finally {
      setLoading(false);
    }
  }, []);

  // Crear configuración por defecto
  const createDefaultSettings = async () => {
    const defaultSettings: ShippingSettings = {
      zones: [
        {
          id: 'local',
          name: 'Local',
          description: 'Entregas dentro de la ciudad',
          baseCost: 50,
          costPerKm: 5,
          maxDistance: 15,
          active: true
        },
        {
          id: 'foraneo',
          name: 'Foráneo',
          description: 'Entregas fuera de la ciudad',
          baseCost: 150,
          costPerKm: 10,
          maxDistance: 100,
          active: true
        },
        {
          id: 'nacional',
          name: 'Nacional',
          description: 'Entregas a nivel nacional',
          baseCost: 300,
          costPerKm: 15,
          active: true
        }
      ],
      defaultLocalCost: 50,
      defaultForaneoCost: 150,
      allowManualEdit: true
    };

    try {
      console.log('🚚 Intentando crear configuración por defecto...');
      const response = await fetch('/api/settings/shipping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(defaultSettings)
      });

      if (response.ok) {
        const data = await response.json();
        setShippingSettings(data);
        console.log('✅ Configuración de envío por defecto creada');
      } else {
        console.warn('⚠️ No se pudo crear configuración en servidor, usando local');
        setShippingSettings(defaultSettings);
      }
    } catch (error) {
      console.error('Error creando configuración por defecto:', error);
      // Usar configuración local si no se puede guardar
      setShippingSettings(defaultSettings);
      console.log('📋 Usando configuración local por defecto');
    }
  };

  // Agregar nueva zona
  const addZone = async (zoneData: Omit<ShippingZone, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    try {
      const response = await fetch('/api/settings/shipping/zones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(zoneData)
      });

      if (response.ok) {
        const newZone = await response.json();
        setShippingSettings(prev => ({
          ...prev,
          zones: [...prev.zones, newZone]
        }));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error agregando zona:', error);
      setError('Error agregando zona de envío');
      return false;
    }
  };

  // Actualizar zona existente
  const updateZone = async (id: string, zoneData: Partial<ShippingZone>): Promise<boolean> => {
    try {
      const response = await fetch(`/api/settings/shipping/zones/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(zoneData)
      });

      if (response.ok) {
        const updatedZone = await response.json();
        setShippingSettings(prev => ({
          ...prev,
          zones: prev.zones.map(zone => zone.id === id ? updatedZone : zone)
        }));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error actualizando zona:', error);
      setError('Error actualizando zona de envío');
      return false;
    }
  };

  // Eliminar zona
  const deleteZone = async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/settings/shipping/zones/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setShippingSettings(prev => ({
          ...prev,
          zones: prev.zones.filter(zone => zone.id !== id)
        }));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error eliminando zona:', error);
      setError('Error eliminando zona de envío');
      return false;
    }
  };

  // Actualizar configuración general
  const updateSettings = async (settingsData: Partial<ShippingSettings>): Promise<boolean> => {
    try {
      const response = await fetch('/api/settings/shipping', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsData)
      });

      if (response.ok) {
        const updatedSettings = await response.json();
        setShippingSettings(prev => ({ ...prev, ...updatedSettings }));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error actualizando configuración:', error);
      setError('Error actualizando configuración de envío');
      return false;
    }
  };

  // Calcular costo de envío
  const calculateShippingCost = (zoneId?: string, distance?: number): number => {
    if (!zoneId) {
      return shippingSettings.defaultLocalCost;
    }

    const zone = shippingSettings.zones.find(z => z.id === zoneId && z.active);
    if (!zone) {
      return shippingSettings.defaultLocalCost;
    }

    let cost = zone.baseCost;

    // Si hay distancia y costo por km, calcularlo
    if (distance && zone.costPerKm) {
      const kmCost = distance * zone.costPerKm;
      cost += kmCost;
    }

    // Validar distancia máxima
    if (zone.maxDistance && distance && distance > zone.maxDistance) {
      // Agregar recargo por exceso de distancia
      const excess = distance - zone.maxDistance;
      const surcharge = excess * (zone.costPerKm || 0) * 1.5; // 50% más caro por exceso
      cost += surcharge;
    }

    return Math.round(cost * 100) / 100; // Redondear a 2 decimales
  };

  // Buscar zona por nombre
  const getZoneByName = (name: string): ShippingZone | undefined => {
    return shippingSettings.zones.find(zone => 
      zone.name.toLowerCase() === name.toLowerCase() && zone.active
    );
  };

  // Refrescar configuración
  const refreshSettings = async (): Promise<void> => {
    await loadShippingSettings();
  };

  // 🔥 PRIORIDAD BAJA: Esperar antes de cargar configuración de envío
  // Esto da prioridad a productos y clientes
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('🚚 Cargando configuración de envío (prioridad baja)...');
      loadShippingSettings();
    }, 1500); // Esperar 1.5 segundos
    
    return () => clearTimeout(timer);
  }, [loadShippingSettings]);

  return {
    shippingSettings,
    zones: shippingSettings.zones.filter(zone => zone.active),
    loading,
    error,
    addZone,
    updateZone,
    deleteZone,
    updateSettings,
    calculateShippingCost,
    getZoneByName,
    refreshSettings
  };
}