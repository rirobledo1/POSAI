'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Product {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  hasImage?: boolean;
}

export default function ImageDebugComponent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('/api/products?limit=50');
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('🔍 API Response:', data);
      
      setProducts(data.products || []);
    } catch (err) {
      console.error('Error loading products:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const productsWithImages = products.filter(p => p.hasImage);
  const productsWithoutImages = products.filter(p => !p.hasImage);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Debug de Imágenes de Productos
        </h1>
        <p className="text-gray-600">
          Verificación del estado de las imágenes en el sistema
        </p>
      </div>

      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="text-red-800">
            <strong>Error:</strong> {error}
          </div>
        </Card>
      )}

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{products.length}</div>
            <div className="text-sm text-gray-600">Total Productos</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{productsWithImages.length}</div>
            <div className="text-sm text-gray-600">Con Imagen</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{productsWithoutImages.length}</div>
            <div className="text-sm text-gray-600">Sin Imagen</div>
          </div>
        </Card>
      </div>

      <div className="flex justify-center">
        <Button onClick={loadProducts} className="w-auto">
          🔄 Refrescar Datos
        </Button>
      </div>

      {/* Productos con imágenes */}
      {productsWithImages.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-green-800">
            ✅ Productos con Imagen ({productsWithImages.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {productsWithImages.map((product) => (
              <div key={product.id} className="border rounded-lg p-4 bg-green-50">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    {product.thumbnailUrl || product.imageUrl ? (
                      <div className="relative">
                        <img
                          src={product.thumbnailUrl || product.imageUrl}
                          alt={product.name}
                          className="h-16 w-16 rounded-lg object-cover border border-gray-200"
                          onError={(e) => {
                            console.error(`Error cargando imagen para ${product.name}:`, {
                              thumbnailUrl: product.thumbnailUrl,
                              imageUrl: product.imageUrl
                            });
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const placeholder = target.nextElementSibling as HTMLElement;
                            if (placeholder) placeholder.style.display = 'flex';
                          }}
                        />
                        <div className="hidden h-16 w-16 rounded-lg bg-red-100 border border-red-300 items-center justify-center">
                          <span className="text-red-500 text-xs">Error</span>
                        </div>
                      </div>
                    ) : (
                      <div className="h-16 w-16 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                        <span className="text-gray-400 text-xs">No URL</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {product.name}
                    </h3>
                    <p className="text-xs text-gray-500 truncate">
                      ID: {product.id}
                    </p>
                    <div className="mt-1 space-y-1">
                      <Badge variant="outline" className="text-xs">
                        hasImage: {product.hasImage ? 'true' : 'false'}
                      </Badge>
                      {product.thumbnailUrl && (
                        <div className="text-xs text-blue-600 truncate">
                          Thumb: {product.thumbnailUrl.substring(product.thumbnailUrl.lastIndexOf('/') + 1)}
                        </div>
                      )}
                      {product.imageUrl && (
                        <div className="text-xs text-purple-600 truncate">
                          Image: {product.imageUrl.substring(product.imageUrl.lastIndexOf('/') + 1)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Productos sin imágenes */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 text-orange-800">
          📷 Productos sin Imagen ({productsWithoutImages.length})
        </h2>
        {productsWithoutImages.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {productsWithoutImages.slice(0, 12).map((product) => (
              <div key={product.id} className="border rounded-lg p-3 bg-orange-50">
                <h3 className="text-sm font-medium text-gray-900 truncate">
                  {product.name}
                </h3>
                <p className="text-xs text-gray-500">
                  ID: {product.id}
                </p>
                <Badge variant="outline" className="text-xs mt-1">
                  hasImage: {product.hasImage ? 'true' : 'false'}
                </Badge>
              </div>
            ))}
            {productsWithoutImages.length > 12 && (
              <div className="text-sm text-gray-500 p-3">
                ... y {productsWithoutImages.length - 12} más
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-500">¡Todos los productos tienen imagen! 🎉</p>
        )}
      </Card>

      {/* Debug Raw Data */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">🔍 Debug: Datos Raw</h2>
        <details className="text-sm">
          <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
            Ver datos completos (primeros 3 productos)
          </summary>
          <pre className="mt-2 p-4 bg-gray-50 rounded overflow-auto text-xs">
            {JSON.stringify(products.slice(0, 3), null, 2)}
          </pre>
        </details>
      </Card>
    </div>
  );
}
