/**
 * Hook para detectar estado de conexión y manejar modo offline
 * Integra con IndexedDB para persistencia robusta
 */

import { useState, useEffect, useCallback } from 'react';
import { useNotifications } from '@/components/ui/NotificationProvider';

interface ConnectionState {
  isOnline: boolean;
  connectionType: 'fast' | 'slow' | 'offline';
  lastOnline: Date | null;
  offlineDuration: number; // en segundos
}

interface NetworkEvent {
  type: 'online' | 'offline' | 'slow' | 'fast';
  timestamp: Date;
  details?: string;
}

export const useNetworkStatus = () => {
  const { showInfo, showWarning, showError } = useNotifications();
  
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    isOnline: navigator.onLine,
    connectionType: navigator.onLine ? 'fast' : 'offline',
    lastOnline: navigator.onLine ? new Date() : null,
    offlineDuration: 0
  });

  const [networkEvents, setNetworkEvents] = useState<NetworkEvent[]>([]);
  const [isChecking, setIsChecking] = useState(false);

  // Detectar cambios de conexión del navegador
  useEffect(() => {
    const handleOnline = () => {
      const now = new Date();
      const offlineDuration = connectionState.lastOnline 
        ? Math.floor((now.getTime() - connectionState.lastOnline.getTime()) / 1000)
        : 0;

      setConnectionState(prev => ({
        ...prev,
        isOnline: true,
        connectionType: 'fast', // Se determinará después con el test de velocidad
        lastOnline: now,
        offlineDuration: 0
      }));

      // Agregar evento
      setNetworkEvents(prev => [...prev.slice(-9), {
        type: 'online',
        timestamp: now,
        details: offlineDuration > 0 ? `Reconectado después de ${offlineDuration}s` : undefined
      }]);

      if (offlineDuration > 0) {
        showInfo(
          'Conexión restaurada', 
          `Reconectado después de ${formatDuration(offlineDuration)}`
        );
      }

      // Test de velocidad después de un momento
      setTimeout(testConnectionSpeed, 1000);
    };

    const handleOffline = () => {
      const now = new Date();
      
      setConnectionState(prev => ({
        ...prev,
        isOnline: false,
        connectionType: 'offline',
        lastOnline: prev.isOnline ? now : prev.lastOnline
      }));

      // Agregar evento
      setNetworkEvents(prev => [...prev.slice(-9), {
        type: 'offline',
        timestamp: now
      }]);

      showWarning(
        'Sin conexión', 
        'Trabajando en modo offline. Los datos se sincronizarán cuando se restaure la conexión.'
      );
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [connectionState.lastOnline, showInfo, showWarning]);

  // Contador de duración offline
  useEffect(() => {
    if (!connectionState.isOnline && connectionState.lastOnline) {
      const interval = setInterval(() => {
        const now = new Date();
        const duration = Math.floor((now.getTime() - connectionState.lastOnline!.getTime()) / 1000);
        
        setConnectionState(prev => ({
          ...prev,
          offlineDuration: duration
        }));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [connectionState.isOnline, connectionState.lastOnline]);

  // Test de velocidad de conexión
  const testConnectionSpeed = useCallback(async () => {
    if (!connectionState.isOnline || isChecking) return;

    setIsChecking(true);
    
    try {
      const startTime = performance.now();
      
      // Test simple: cargar un archivo pequeño desde el mismo dominio
      const response = await fetch('/favicon.ico?' + Date.now(), {
        method: 'GET',
        cache: 'no-cache'
      });

      if (!response.ok) throw new Error('Network test failed');

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Clasificar velocidad basada en latencia
      const newConnectionType: 'fast' | 'slow' = duration < 1000 ? 'fast' : 'slow';
      
      setConnectionState(prev => ({
        ...prev,
        connectionType: newConnectionType
      }));

      // Agregar evento si cambió la velocidad
      if (newConnectionType !== connectionState.connectionType) {
        setNetworkEvents(prev => [...prev.slice(-9), {
          type: newConnectionType,
          timestamp: new Date(),
          details: `Latencia: ${Math.round(duration)}ms`
        }]);

        if (newConnectionType === 'slow') {
          showWarning(
            'Conexión lenta', 
            'La sincronización puede tomar más tiempo de lo normal.'
          );
        }
      }

    } catch (error) {
      // Si falla el test pero navigator.onLine dice que estamos online,
      // probablemente hay problemas de conectividad
      setConnectionState(prev => ({
        ...prev,
        connectionType: 'slow'
      }));

      setNetworkEvents(prev => [...prev.slice(-9), {
        type: 'slow',
        timestamp: new Date(),
        details: 'Test de velocidad falló'
      }]);

    } finally {
      setIsChecking(false);
    }
  }, [connectionState.isOnline, connectionState.connectionType, isChecking, showWarning]);

  // Test automático cada 5 minutos si estamos online
  useEffect(() => {
    if (!connectionState.isOnline) return;

    const interval = setInterval(testConnectionSpeed, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [connectionState.isOnline, testConnectionSpeed]);

  // Función para forzar test manual
  const forceConnectionTest = useCallback(async () => {
    if (isChecking) return;
    await testConnectionSpeed();
  }, [testConnectionSpeed, isChecking]);

  // Función para obtener información de la conexión
  const getConnectionInfo = useCallback(() => {
    const connection = (navigator as any).connection || 
                     (navigator as any).mozConnection || 
                     (navigator as any).webkitConnection;

    if (connection) {
      return {
        effectiveType: connection.effectiveType, // '4g', '3g', etc.
        downlink: connection.downlink, // Mbps estimado
        rtt: connection.rtt, // Round trip time en ms
        saveData: connection.saveData // Si el usuario tiene modo ahorro activado
      };
    }

    return null;
  }, []);

  // Función para obtener estadísticas de red
  const getNetworkStats = useCallback(() => {
    const recentEvents = networkEvents.slice(-10);
    const offlineEvents = recentEvents.filter(e => e.type === 'offline');
    const onlineEvents = recentEvents.filter(e => e.type === 'online');

    return {
      totalEvents: networkEvents.length,
      recentDisconnections: offlineEvents.length,
      recentReconnections: onlineEvents.length,
      averageOfflineTime: offlineEvents.length > 0 ? 
        offlineEvents.reduce((acc, event, index) => {
          if (index < onlineEvents.length) {
            const reconnectTime = onlineEvents[index].timestamp.getTime();
            const disconnectTime = event.timestamp.getTime();
            return acc + (reconnectTime - disconnectTime) / 1000;
          }
          return acc;
        }, 0) / Math.min(offlineEvents.length, onlineEvents.length) : 0,
      connectionInfo: getConnectionInfo()
    };
  }, [networkEvents, getConnectionInfo]);

  return {
    // Estado actual
    isOnline: connectionState.isOnline,
    connectionType: connectionState.connectionType,
    offlineDuration: connectionState.offlineDuration,
    lastOnline: connectionState.lastOnline,
    
    // Estado de testing
    isChecking,
    
    // Eventos y estadísticas
    networkEvents: networkEvents.slice(-10), // Últimos 10 eventos
    getNetworkStats,
    
    // Acciones
    forceConnectionTest,
    
    // Utilidades
    isGoodConnection: connectionState.isOnline && connectionState.connectionType === 'fast',
    shouldSyncNow: connectionState.isOnline && !isChecking,
    canSyncHeavyData: connectionState.isOnline && connectionState.connectionType === 'fast'
  };
};

// Utilidad para formatear duración
function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

// Hook simplificado para casos básicos
export const useOnlineStatus = () => {
  const { isOnline, connectionType, shouldSyncNow } = useNetworkStatus();
  
  return {
    isOnline,
    isGoodConnection: isOnline && connectionType === 'fast',
    shouldSyncNow
  };
};