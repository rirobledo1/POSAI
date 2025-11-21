/**
 * NetworkStatusIndicator - Componente visual para mostrar estado de conexión y sincronización
 */

'use client';

import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  WifiOff, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw,
  Database,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useSyncQueue } from '@/lib/syncQueue';

interface NetworkStatusIndicatorProps {
  className?: string;
  compact?: boolean;  // Versión compacta (sin panel expandible)
  iconOnly?: boolean; // Solo icono (para sidebar colapsado)
}

export const NetworkStatusIndicator: React.FC<NetworkStatusIndicatorProps> = ({ 
  className = "",
  compact = false,
  iconOnly = false
}) => {
  const { 
    isOnline, 
    connectionType, 
    offlineDuration, 
    isChecking,
    forceConnectionTest,
    networkEvents 
  } = useNetworkStatus();
  
  const { getStats, processQueueNow } = useSyncQueue();
  
  const [queueStats, setQueueStats] = useState<any>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Actualizar estadísticas de cola cada 30 segundos
  useEffect(() => {
    const updateStats = async () => {
      try {
        const stats = await getStats();
        setQueueStats(stats);
      } catch (error) {
        console.warn('Queue stats not available:', error);
        setQueueStats(null);
      }
    };

    const timer = setTimeout(updateStats, 1000);
    const interval = setInterval(updateStats, 30000);
    
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [getStats]);

  // Obtener color e ícono según estado
  const getStatusInfo = () => {
    if (!isOnline) {
      return {
        color: 'text-red-500 bg-red-50 border-red-200',
        icon: WifiOff,
        text: `Offline ${offlineDuration > 0 ? `(${formatDuration(offlineDuration)})` : ''}`,
        shortText: 'Offline',
        pulse: true
      };
    }
    
    if (connectionType === 'slow') {
      return {
        color: 'text-yellow-500 bg-yellow-50 border-yellow-200',
        icon: Wifi,
        text: 'Conexión lenta',
        shortText: 'Lento',
        pulse: false
      };
    }
    
    if (queueStats && queueStats.total > 0) {
      return {
        color: 'text-blue-500 bg-blue-50 border-blue-200',
        icon: Clock,
        text: `${queueStats.total} pendiente${queueStats.total > 1 ? 's' : ''}`,
        shortText: `${queueStats.total}`,
        pulse: true
      };
    }
    
    return {
      color: 'text-green-500 bg-green-50 border-green-200',
      icon: CheckCircle,
      text: 'En línea',
      shortText: 'Online',
      pulse: false
    };
  };

  const handleSyncNow = async () => {
    if (isProcessing || !isOnline) return;
    
    setIsProcessing(true);
    try {
      await processQueueNow();
      const stats = await getStats();
      setQueueStats(stats);
    } catch (error) {
      console.error('Error processing queue:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  // Versión solo ícono (sidebar colapsado)
  if (iconOnly) {
    return (
      <div 
        className={`flex items-center justify-center w-10 h-10 rounded-lg ${statusInfo.color} ${className}`}
        title={statusInfo.text}
      >
        <StatusIcon className={`h-5 w-5 ${statusInfo.pulse ? 'animate-pulse' : ''}`} />
      </div>
    );
  }

  // Versión compacta (sin expandir)
  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${statusInfo.color} ${className}`}>
        <StatusIcon className={`h-3 w-3 ${statusInfo.pulse ? 'animate-pulse' : ''}`} />
        <span>{statusInfo.shortText}</span>
        {queueStats && queueStats.total > 0 && (
          <span className="ml-1">({queueStats.total})</span>
        )}
      </div>
    );
  }

  // Versión completa (con panel expandible)
  return (
    <div className={`relative ${className}`}>
      {/* Indicador principal */}
      <div 
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer
          transition-all duration-200 hover:shadow-sm
          ${statusInfo.color}
          ${statusInfo.pulse ? 'animate-pulse' : ''}
        `}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <StatusIcon className="h-4 w-4" />
        <span className="text-sm font-medium">{statusInfo.text}</span>
        
        {queueStats && queueStats.total > 0 && (
          <div className="flex items-center gap-1 ml-2">
            <Database className="h-3 w-3" />
            <span className="text-xs">{queueStats.total}</span>
          </div>
        )}
        
        {isExpanded ? (
          <ChevronUp className="h-3 w-3 ml-auto" />
        ) : (
          <ChevronDown className="h-3 w-3 ml-auto" />
        )}
      </div>

      {/* Panel expandido */}
      {isExpanded && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4">
          {/* Estado de conexión */}
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Estado de Conexión</h4>
            <div className="space-y-1 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Estado:</span>
                <span className={isOnline ? 'text-green-600' : 'text-red-600'}>
                  {isOnline ? 'En línea' : 'Sin conexión'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Velocidad:</span>
                <span className={connectionType === 'fast' ? 'text-green-600' : 'text-yellow-600'}>
                  {connectionType === 'fast' ? 'Rápida' : connectionType === 'slow' ? 'Lenta' : 'N/A'}
                </span>
              </div>
              {!isOnline && offlineDuration > 0 && (
                <div className="flex justify-between">
                  <span>Tiempo offline:</span>
                  <span className="text-red-600">{formatDuration(offlineDuration)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Estadísticas de cola */}
          {queueStats && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Cola de Sincronización</h4>
              <div className="space-y-1 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Total pendiente:</span>
                  <span className={queueStats.total > 0 ? 'text-blue-600 font-medium' : 'text-green-600'}>
                    {queueStats.total}
                  </span>
                </div>
                {queueStats.failedItems > 0 && (
                  <div className="flex justify-between">
                    <span>Con errores:</span>
                    <span className="text-red-600 font-medium">{queueStats.failedItems}</span>
                  </div>
                )}
                {queueStats.byType && Object.keys(queueStats.byType).length > 0 && (
                  <div className="mt-2">
                    <div className="text-xs text-gray-500 mb-1">Por tipo:</div>
                    {Object.entries(queueStats.byType).map(([type, count]) => (
                      <div key={type} className="flex justify-between ml-2">
                        <span>{getTypeLabel(type)}:</span>
                        <span>{count as number}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Acciones */}
          <div className="flex gap-2">
            <button
              onClick={forceConnectionTest}
              disabled={isChecking}
              className="flex items-center gap-1 px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border disabled:opacity-50"
            >
              <RefreshCw className={`h-3 w-3 ${isChecking ? 'animate-spin' : ''}`} />
              Test Conexión
            </button>
            
            {isOnline && queueStats && queueStats.total > 0 && (
              <button
                onClick={handleSyncNow}
                disabled={isProcessing}
                className="flex items-center gap-1 px-3 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded border disabled:opacity-50"
              >
                <Database className={`h-3 w-3 ${isProcessing ? 'animate-spin' : ''}`} />
                Sincronizar
              </button>
            )}
          </div>

          {/* Eventos recientes */}
          {networkEvents.length > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-100">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Eventos Recientes</h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {networkEvents.slice(-5).reverse().map((event, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs text-gray-600">
                    <div className={`w-2 h-2 rounded-full ${
                      event.type === 'online' ? 'bg-green-400' :
                      event.type === 'offline' ? 'bg-red-400' :
                      'bg-yellow-400'
                    }`} />
                    <span className="flex-1">
                      {event.type === 'online' ? 'Conectado' :
                       event.type === 'offline' ? 'Desconectado' :
                       event.type === 'fast' ? 'Conexión rápida' :
                       'Conexión lenta'}
                    </span>
                    <span className="text-gray-400">
                      {formatTime(event.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Utilidades
function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('es-ES', { 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit'
  });
}

function getTypeLabel(type: string): string {
  switch (type) {
    case 'SALE_COMPLETE': return 'Ventas';
    case 'SALE_CANCEL': return 'Cancelaciones';
    case 'INVENTORY_UPDATE': return 'Inventario';
    default: return type;
  }
}

export default NetworkStatusIndicator;
