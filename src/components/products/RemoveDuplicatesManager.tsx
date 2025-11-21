'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface RemoveDuplicatesManagerProps {
  onComplete: () => void;
  onClose: () => void;
}

interface DuplicateStats {
  totalDuplicates: number;
  recentDuplicates: number;
  monthlyDuplicates: number;
  recentDuplicatesList: Array<{
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    stock: number;
  }>;
}

interface DuplicateResult {
  success: boolean;
  message: string;
  duplicateGroupsFound?: number;
  totalProductsDeactivated?: number;
  finalProductCount?: number;
  consolidationResults?: Array<{
    productName: string;
    keptId: string;
    deactivatedIds: string[];
    consolidatedStock: number;
    deactivatedCount: number;
  }>;
  error?: string;
  details?: string;
}

export default function RemoveDuplicatesManager({ onComplete, onClose }: RemoveDuplicatesManagerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DuplicateResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DuplicateStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Cargar estadísticas al abrir el modal
  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await fetch('/api/duplicate-stats');
        const data = await response.json();
        if (data.success) {
          setStats(data.data);
        }
      } catch (err) {
        console.error('Error loading stats:', err);
      } finally {
        setLoadingStats(false);
      }
    };

    loadStats();
  }, []);

  const handleRemoveDuplicates = async () => {
    setIsLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch('/api/remove-duplicates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
        // Llamar onComplete después de un breve delay para mostrar los resultados
        setTimeout(() => {
          onComplete();
        }, 3000);
      } else {
        setError(data.error || 'Error desconocido');
      }
    } catch (err) {
      setError('Error de conexión');
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (result) {
    return (
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                ¡Proceso Completado Exitosamente!
              </h3>
              <div className="mt-2 text-sm text-green-700">
                <p className="mb-3">{result.message}</p>
                
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-white rounded p-3 border border-green-200">
                    <p className="font-semibold text-xs">Grupos de duplicados:</p>
                    <p className="text-lg font-bold text-green-600">{result.duplicateGroupsFound || 0}</p>
                  </div>
                  <div className="bg-white rounded p-3 border border-green-200">
                    <p className="font-semibold text-xs">Productos desactivados:</p>
                    <p className="text-lg font-bold text-red-600">{result.totalProductsDeactivated || 0}</p>
                  </div>
                </div>

                {result.consolidationResults && result.consolidationResults.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 text-sm">Productos consolidados:</h4>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {result.consolidationResults.slice(0, 3).map((consolidation, index) => (
                        <div key={index} className="bg-white rounded p-2 border border-green-200 text-xs">
                          <p><strong>{consolidation.productName}</strong></p>
                          <p className="text-gray-600">Stock consolidado: {consolidation.consolidatedStock} unidades</p>
                        </div>
                      ))}
                      {result.consolidationResults.length > 3 && (
                        <p className="text-xs text-gray-500 italic">
                          Y {result.consolidationResults.length - 3} productos más...
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <p className="text-xs text-green-600 mt-3 font-medium">
                  La lista de productos se actualizará automáticamente en unos segundos.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end">
          <Button onClick={onClose} variant="outline">
            Cerrar
          </Button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button onClick={() => {
            setError(null);
            setResult(null);
          }} variant="outline">
            Reintentar
          </Button>
          <Button onClick={onClose} variant="outline">
            Cerrar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas de historial */}
      {stats && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-800 mb-3 flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Historial de Duplicados Eliminados
          </h4>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900">{stats.totalDuplicates}</p>
              <p className="text-xs text-gray-600">Total eliminados</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-blue-600">{stats.monthlyDuplicates}</p>
              <p className="text-xs text-gray-600">Este mes</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-green-600">{stats.recentDuplicates}</p>
              <p className="text-xs text-gray-600">Esta semana</p>
            </div>
          </div>
          {stats.totalDuplicates > 0 && (
            <p className="text-xs text-gray-500">
              Puedes ver el historial completo usando el botón "Ver Historial" en la gestión de productos.
            </p>
          )}
        </div>
      )}

      {/* Advertencia */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Advertencia Importante
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p className="mb-2">
                Esta acción identificará y consolidará productos duplicados en tu inventario:
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>Se mantiene el producto creado más recientemente</li>
                <li>El stock de todos los duplicados se suma al producto principal</li>
                <li>Los productos duplicados se marcan como inactivos</li>
                <li>Las referencias de ventas se transfieren al producto principal</li>
                <li>Los datos históricos se preservan</li>
              </ul>
              <p className="mt-2 font-medium">
                Esta operación es segura y no elimina datos de ventas o historial.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Información adicional */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              ¿Cómo identifica duplicados?
            </h3>
            <div className="mt-1 text-sm text-blue-700">
              <p>
                El sistema compara los nombres de productos ignorando diferencias en mayúsculas, 
                espacios adicionales y caracteres especiales para identificar duplicados reales.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex justify-end gap-3">
        <Button 
          onClick={onClose} 
          variant="outline"
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleRemoveDuplicates}
          disabled={isLoading}
          className="bg-orange-600 hover:bg-orange-700 text-white"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Procesando...
            </>
          ) : (
            <>
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Eliminar Duplicados
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
