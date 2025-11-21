/**
 * Página para hacer seed de productos de prueba
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function SeedPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runSeed = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/products/seed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Error desconocido');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              🌱 Seed de Productos de Prueba
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600 text-center">
              Crea productos de ejemplo para probar el sistema POS
            </p>

            <Button 
              onClick={runSeed}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Creando productos...' : 'Crear Productos de Prueba'}
            </Button>

            {result && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircleIcon className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-medium text-green-800">
                      ¡Éxito!
                    </p>
                    <p className="text-sm text-green-700">
                      {result.message}
                    </p>
                    {result.products && (
                      <p className="text-xs text-green-600">
                        Productos creados: {result.products}
                      </p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert className="border-red-200 bg-red-50">
                <ExclamationTriangleIcon className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-medium text-red-800">Error</p>
                  <p className="text-sm text-red-700">{error}</p>
                </AlertDescription>
              </Alert>
            )}

            <div className="pt-4 border-t">
              <p className="text-xs text-gray-500 text-center">
                Una vez creados, puedes ir al{' '}
                <a href="/pos" className="text-blue-600 hover:underline">
                  sistema POS
                </a>{' '}
                para verlos
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}