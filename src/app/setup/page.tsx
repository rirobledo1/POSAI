'use client';

import { useState } from 'react';

export default function SetupPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const setupDatabase = async () => {
    try {
      setLoading(true);
      setResult(null);
      setLogs([]);
      
      addLog('🚀 Iniciando configuración de base de datos...');
      
      const response = await fetch('/api/setup-database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      addLog(`📡 Respuesta del servidor: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        addLog(`❌ Error del servidor: ${errorText}`);
        throw new Error(`Error ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      addLog('✅ Datos recibidos correctamente');
      
      setResult(data);
      
      if (data.success) {
        addLog('🎉 ¡Base de datos configurada exitosamente!');
        alert('✅ Base de datos configurada exitosamente!');
      } else {
        addLog(`❌ Error en configuración: ${data.error}`);
        alert('❌ Error: ' + data.error);
      }
    } catch (error) {
      console.error('Error completo:', error);
      addLog(`💥 Error de conexión: ${error}`);
      alert('❌ Error de conexión: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    try {
      addLog('🔌 Probando conexión a la API...');
      const response = await fetch('/api/setup-database', {
        method: 'GET',
      });
      const data = await response.json();
      addLog(`✅ API responde: ${data.message}`);
      alert('✅ API funcionando correctamente');
    } catch (error) {
      addLog(`❌ Error de conexión: ${error}`);
      alert('❌ Error de conexión a la API');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🚀 Setup FerreAI
            </h1>
            <p className="text-gray-600">
              Configurar base de datos y datos de prueba
            </p>
          </div>

          <div className="space-y-4">
            <button 
              onClick={testConnection}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-md text-sm font-medium"
            >
              🔌 Probar Conexión API
            </button>

            <button 
              onClick={setupDatabase}
              disabled={loading}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                loading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              }`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Configurando...
                </>
              ) : (
                '🛠️ Crear Tablas y Datos'
              )}
            </button>
          </div>

          {/* Logs en tiempo real */}
          {logs.length > 0 && (
            <div className="mt-6 p-4 bg-gray-100 rounded-md max-h-48 overflow-y-auto">
              <h3 className="text-sm font-medium text-gray-700 mb-2">📋 Logs de proceso:</h3>
              <div className="space-y-1">
                {logs.map((log, index) => (
                  <div key={index} className="text-xs font-mono text-gray-600">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}

          {result && (
            <div className={`mt-6 p-4 rounded-md ${
              result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex">
                <div className="ml-3">
                  <h3 className={`text-sm font-medium ${
                    result.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {result.success ? '✅ Éxito' : '❌ Error'}
                  </h3>
                  <div className={`mt-2 text-sm ${
                    result.success ? 'text-green-700' : 'text-red-700'
                  }`}>
                    <p>{result.message}</p>
                    {result.data && (
                      <div className="mt-2">
                        <p className="font-medium">Datos creados:</p>
                        <ul className="list-disc list-inside">
                          {result.data.map((item: any, index: number) => (
                            <li key={index}>
                              {item.tabla}: {item.total} registros
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {result.error && (
                      <div className="mt-2">
                        <p className="font-medium">Detalles del error:</p>
                        <pre className="text-xs bg-red-100 p-2 rounded overflow-x-auto">
                          {result.details || result.error}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {result && result.success && (
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 mb-4">
                ¡Base de datos lista! Ahora puedes usar el sistema:
              </p>
              <div className="space-y-2">
                <a 
                  href="/dashboard" 
                  className="block w-full bg-green-600 hover:bg-green-700 text-white text-center py-2 px-4 rounded-md text-sm font-medium"
                >
                  📊 Ir al Dashboard
                </a>
                <a 
                  href="/pos" 
                  className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-2 px-4 rounded-md text-sm font-medium"
                >
                  💳 Ir al POS
                </a>
                <a 
                  href="/productos" 
                  className="block w-full bg-purple-600 hover:bg-purple-700 text-white text-center py-2 px-4 rounded-md text-sm font-medium"
                >
                  📦 Gestión de Productos
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}