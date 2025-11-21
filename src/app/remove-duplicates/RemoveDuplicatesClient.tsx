'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function RemoveDuplicatesClient() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <Button
          onClick={handleRemoveDuplicates}
          disabled={isLoading}
          size="lg"
          variant="destructive"
          className="px-8 py-3"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Eliminando Duplicados...
            </>
          ) : (
            'Eliminar Productos Duplicados'
          )}
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {result && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                ¡Proceso Completado Exitosamente!
              </h3>
              <div className="mt-2 text-sm text-green-700">
                <p className="mb-3">{result.message}</p>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-white rounded p-3 border border-green-200">
                    <p className="font-semibold">Grupos de duplicados encontrados:</p>
                    <p className="text-lg font-bold text-green-600">{result.duplicateGroupsFound}</p>
                  </div>
                  <div className="bg-white rounded p-3 border border-green-200">
                    <p className="font-semibold">Productos desactivados:</p>
                    <p className="text-lg font-bold text-red-600">{result.totalProductsDeactivated}</p>
                  </div>
                  <div className="bg-white rounded p-3 border border-green-200">
                    <p className="font-semibold">Productos finales:</p>
                    <p className="text-lg font-bold text-blue-600">{result.finalProductCount}</p>
                  </div>
                  <div className="bg-white rounded p-3 border border-green-200">
                    <p className="font-semibold">Estado:</p>
                    <p className="text-lg font-bold text-green-600">Sin duplicados</p>
                  </div>
                </div>

                {result.consolidationResults && result.consolidationResults.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Detalles de consolidación:</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {result.consolidationResults.map((consolidation: any, index: number) => (
                        <div key={index} className="bg-white rounded p-3 border border-green-200 text-xs">
                          <p><strong>Producto:</strong> {consolidation.productName}</p>
                          <p><strong>ID mantenido:</strong> {consolidation.keptId}</p>
                          <p><strong>Stock consolidado:</strong> {consolidation.consolidatedStock} unidades</p>
                          <p><strong>Productos desactivados:</strong> {consolidation.deactivatedCount}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="text-center">
        <Button
          onClick={() => window.location.href = '/dashboard'}
          variant="outline"
        >
          Volver al Dashboard
        </Button>
      </div>
    </div>
  );
}
