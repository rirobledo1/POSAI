'use client';

import { useState, useEffect } from 'react';

export default function TestPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/categories')
        ]);
        
        const productsData = await productsRes.json();
        const categoriesData = await categoriesRes.json();
        
        setProducts(productsData.products || []);
        setCategories(categoriesData.categories || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const clearDatabase = async () => {
    if (confirm('¿Estás seguro de que quieres limpiar la base de datos?')) {
      try {
        const response = await fetch('/api/products/clear', { method: 'DELETE' });
        const result = await response.json();
        
        if (result.success) {
          setProducts([]);
          setCategories([]);
          alert('Base de datos limpiada exitosamente');
        } else {
          alert('Error al limpiar la base de datos: ' + result.error);
        }
      } catch (error) {
        alert('Error: ' + error.message);
      }
    }
  };

  if (loading) {
    return <div className="p-8">Cargando...</div>;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Estado de la Base de Datos</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Categorías ({categories.length})</h2>
          {categories.length === 0 ? (
            <p className="text-gray-500">No hay categorías</p>
          ) : (
            <ul className="space-y-2">
              {categories.map(category => (
                <li key={category.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="font-medium">{category.name}</span>
                  <span className="text-sm text-gray-500">ID: {category.id}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Productos ({products.length})</h2>
          {products.length === 0 ? (
            <p className="text-gray-500">No hay productos</p>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <ul className="space-y-2">
                {products.slice(0, 20).map(product => (
                  <li key={product.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <div>
                      <span className="font-medium">{product.name}</span>
                      <br />
                      <span className="text-sm text-gray-500">
                        Categoría: {product.category?.name || 'Sin categoría'}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">${product.price}</span>
                  </li>
                ))}
                {products.length > 20 && (
                  <li className="text-center text-gray-500 italic">
                    ... y {products.length - 20} productos más
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 flex gap-4">
        <button
          onClick={clearDatabase}
          className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Limpiar Base de Datos
        </button>
        
        <a
          href="/dashboard"
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 inline-block"
        >
          Ir al Dashboard
        </a>
      </div>

      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h3 className="font-semibold text-yellow-800 mb-2">Instrucciones para Probar la Importación:</h3>
        <ol className="list-decimal list-inside text-yellow-700 space-y-1">
          <li>Haz clic en "Limpiar Base de Datos" si hay datos existentes</li>
          <li>Ve al Dashboard y usa la función de importación CSV</li>
          <li>Selecciona el archivo "productos-prueba-100.csv" desde la carpeta del proyecto</li>
          <li>Observa cómo se clasifican los productos en categorías</li>
          <li>Regresa aquí para ver el resultado final</li>
        </ol>
      </div>
    </div>
  );
}