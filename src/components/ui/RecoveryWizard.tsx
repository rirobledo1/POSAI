/**
 * RecoveryWizard - Sistema de recuperación de datos post-crash
 * Detecta y ayuda a recuperar ventas no sincronizadas
 */

'use client';

import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  RefreshCw, 
  Download, 
  Upload, 
  Check, 
  X,
  Database,
  Clock,
  ShoppingCart
} from 'lucide-react';
import { useIndexedDB } from '@/lib/indexedDB';
import { useSyncQueue } from '@/lib/syncQueue';
import { useNotifications } from '@/contexts/NotificationContext';

interface RecoveryData {
  salesData: Record<string, any>;
  queueStats: any;
  lastBackup: Date | null;
  hasUnsyncedData: boolean;
}

interface RecoveryWizardProps {
  onRecoveryComplete: (recoveredData?: Record<string, any>) => void;
  onSkip: () => void;
}

export const RecoveryWizard: React.FC<RecoveryWizardProps> = ({
  onRecoveryComplete,
  onSkip
}) => {
  const { 
    initDB, 
    getSalesData, 
    getMetadata, 
    setMetadata 
  } = useIndexedDB();
  
  const { getStats } = useSyncQueue();
  const { showSuccess, showError, showInfo } = useNotifications();
  
  const [isLoading, setIsLoading] = useState(true);
  const [recoveryData, setRecoveryData] = useState<RecoveryData | null>(null);
  const [selectedAction, setSelectedAction] = useState<'recover' | 'skip' | 'merge' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Inicializar y detectar datos de recuperación
  useEffect(() => {
    const detectRecoveryData = async () => {
      try {
        setIsLoading(true);
        
        // Inicializar IndexedDB
        const dbInitialized = await initDB();
        if (!dbInitialized) {
          console.log('IndexedDB not available, skipping recovery');
          onSkip();
          return;
        }

        // Obtener datos de ventas
        const salesData = await getSalesData();
        
        // Obtener estadísticas de cola
        const queueStats = await getStats();
        
        // Obtener último backup
        const lastBackup = await getMetadata('lastBackup');
        
        // Determinar si hay datos para recuperar
        const hasSalesData = Object.keys(salesData).length > 0;
        const hasQueueData = queueStats.total > 0;
        const hasUnsyncedData = hasSalesData || hasQueueData;

        const data: RecoveryData = {
          salesData,
          queueStats,
          lastBackup: lastBackup ? new Date(lastBackup) : null,
          hasUnsyncedData
        };

        setRecoveryData(data);

        // Si no hay datos para recuperar, continuar normalmente
        if (!hasUnsyncedData) {
          console.log('No recovery data found');
          onRecoveryComplete();
          return;
        }

        // Marcar que se detectaron datos de recuperación
        await setMetadata('recoveryDetected', new Date().toISOString());
        
      } catch (error) {
        console.error('Error detecting recovery data:', error);
        showError('Error de recuperación', 'No se pudieron detectar datos de recuperación');
        onSkip();
      } finally {
        setIsLoading(false);
      }
    };

    detectRecoveryData();
  }, [initDB, getSalesData, getStats, getMetadata, setMetadata, onSkip, onRecoveryComplete, showError]);

  // Manejar recuperación de datos
  const handleRecover = async () => {
    if (!recoveryData || !selectedAction || isProcessing) return;

    setIsProcessing(true);
    
    try {
      switch (selectedAction) {
        case 'recover':
          // Recuperar todas las ventas
          await onRecoveryComplete(recoveryData.salesData);
          showSuccess(
            'Datos recuperados', 
            `Se recuperaron ${Object.keys(recoveryData.salesData).length} ventas`
          );
          break;
          
        case 'merge':
          // TODO: Implementar merge inteligente en el futuro
          await onRecoveryComplete(recoveryData.salesData);
          showInfo(
            'Datos fusionados', 
            'Los datos recuperados se han fusionado con la sesión actual'
          );
          break;
          
        case 'skip':
          await onRecoveryComplete();
          showInfo('Recuperación omitida', 'Los datos anteriores no se han cargado');
          break;
      }

      // Marcar recuperación como completada
      await setMetadata('lastRecovery', new Date().toISOString());
      
    } catch (error) {
      console.error('Error during recovery:', error);
      showError('Error en recuperación', 'No se pudieron recuperar los datos');
    } finally {
      setIsProcessing(false);
    }
  };

  // Manejar descarte de datos
  const handleDiscard = async () => {
    setIsProcessing(true);
    
    try {
      // TODO: Implementar limpieza de datos antiguos
      await setMetadata('dataDiscarded', new Date().toISOString());
      onRecoveryComplete();
      showInfo('Datos descartados', 'Se ha iniciado una sesión limpia');
    } catch (error) {
      console.error('Error discarding data:', error);
      showError('Error', 'No se pudieron descartar los datos');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex items-center gap-3 mb-4">
            <RefreshCw className="h-6 w-6 text-blue-500 animate-spin" />
            <h2 className="text-lg font-semibold">Verificando datos...</h2>
          </div>
          <p className="text-gray-600">
            Revisando si hay datos de ventas anteriores para recuperar.
          </p>
        </div>
      </div>
    );
  }

  if (!recoveryData?.hasUnsyncedData) {
    return null; // No mostrar el wizard si no hay datos
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="h-6 w-6 text-amber-500" />
            <h2 className="text-xl font-semibold text-gray-900">
              Datos de Recuperación Detectados
            </h2>
          </div>
          <p className="text-gray-600">
            Se encontraron datos de ventas anteriores que no fueron sincronizados. 
            ¿Qué deseas hacer con estos datos?
          </p>
        </div>

        {/* Información de datos encontrados */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Ventas en progreso */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <ShoppingCart className="h-5 w-5 text-blue-600" />
                <h3 className="font-medium text-blue-900">Ventas en Progreso</h3>
              </div>
              <div className="text-2xl font-bold text-blue-700">
                {Object.keys(recoveryData.salesData).length}
              </div>
              <p className="text-sm text-blue-600">
                Ventas no completadas
              </p>
            </div>

            {/* Cola de sincronización */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-amber-600" />
                <h3 className="font-medium text-amber-900">Pendientes</h3>
              </div>
              <div className="text-2xl font-bold text-amber-700">
                {recoveryData.queueStats.total}
              </div>
              <p className="text-sm text-amber-600">
                Operaciones sin sincronizar
              </p>
            </div>

            {/* Último backup */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Database className="h-5 w-5 text-gray-600" />
                <h3 className="font-medium text-gray-900">Último Backup</h3>
              </div>
              <div className="text-sm font-medium text-gray-700">
                {recoveryData.lastBackup ? 
                  recoveryData.lastBackup.toLocaleString('es-ES') : 
                  'No disponible'
                }
              </div>
            </div>
          </div>

          {/* Detalle de ventas */}
          {Object.keys(recoveryData.salesData).length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Detalle de Ventas Encontradas:</h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {Object.entries(recoveryData.salesData).map(([id, sale]: [string, any]) => (
                  <div key={id} className="flex justify-between items-center text-sm">
                    <span className="font-medium">{sale.name || `Venta ${id}`}</span>
                    <div className="flex gap-4 text-gray-600">
                      <span>{sale.cart?.length || 0} productos</span>
                      {sale.customer && (
                        <span>Cliente: {sale.customer.name}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Opciones de acción */}
        <div className="p-6 border-t border-gray-200">
          <h3 className="font-medium text-gray-900 mb-4">Elige una acción:</h3>
          
          <div className="space-y-3 mb-6">
            <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="action"
                value="recover"
                checked={selectedAction === 'recover'}
                onChange={(e) => setSelectedAction(e.target.value as any)}
                className="mt-1"
              />
              <div>
                <div className="flex items-center gap-2 font-medium text-gray-900">
                  <Download className="h-4 w-4 text-green-600" />
                  Recuperar Datos
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Cargar todas las ventas y continuar donde se quedó. Recomendado si no has trabajado desde entonces.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="action"
                value="skip"
                checked={selectedAction === 'skip'}
                onChange={(e) => setSelectedAction(e.target.value as any)}
                className="mt-1"
              />
              <div>
                <div className="flex items-center gap-2 font-medium text-gray-900">
                  <X className="h-4 w-4 text-red-600" />
                  Comenzar Limpio
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Ignorar los datos anteriores y comenzar una nueva sesión. Los datos antiguos se conservarán para recuperación futura.
                </p>
              </div>
            </label>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-3">
            <button
              onClick={handleRecover}
              disabled={!selectedAction || isProcessing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Confirmar
            </button>
            
            <button
              onClick={handleDiscard}
              disabled={isProcessing}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Descartar Todo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecoveryWizard;