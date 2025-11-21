'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import MainLayout from '@/components/layout/MainLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function DebugSuperAdmin() {
  const { data: session } = useSession()
  const [apiResponse, setApiResponse] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const checkSuperAdmin = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/check-super-admin')
      const data = await response.json()
      setApiResponse({
        status: response.status,
        data: data
      })
    } catch (error) {
      setApiResponse({
        error: error instanceof Error ? error.message : 'Error desconocido'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session?.user?.id) {
      checkSuperAdmin()
    }
  }, [session?.user?.id])

  return (
    <MainLayout>
      <div className="p-8 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🔍 Debug Super Admin</h1>

        {/* Sesión del Usuario */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>1. Sesión del Usuario</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-sm">
              {JSON.stringify(session, null, 2)}
            </pre>
          </CardContent>
        </Card>

        {/* Respuesta del API */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              2. Respuesta de /api/admin/check-super-admin
              <Button onClick={checkSuperAdmin} disabled={loading} size="sm">
                {loading ? 'Verificando...' : 'Refrescar'}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {apiResponse ? (
              <div>
                <div className="mb-4">
                  <strong>Status HTTP:</strong> {apiResponse.status || 'N/A'}
                </div>
                <div className="mb-4">
                  <strong>¿Es Super Admin?</strong>{' '}
                  <span className={apiResponse.data?.isSuperAdmin ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                    {apiResponse.data?.isSuperAdmin ? '✅ SÍ' : '❌ NO'}
                  </span>
                </div>
                <strong>Respuesta completa:</strong>
                <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-sm mt-2">
                  {JSON.stringify(apiResponse, null, 2)}
                </pre>
              </div>
            ) : (
              <p className="text-gray-500">Cargando...</p>
            )}
          </CardContent>
        </Card>

        {/* Instrucciones */}
        <Card>
          <CardHeader>
            <CardTitle>3. Pasos para Solucionar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
              <strong>Si "¿Es Super Admin?" dice NO:</strong>
              <ol className="list-decimal ml-6 mt-2 space-y-1">
                <li>Ejecuta de nuevo: <code className="bg-gray-200 px-2 py-1 rounded">agregar-super-admin-ferreai.bat</code></li>
                <li>Verifica en PostgreSQL con: <code className="bg-gray-200 px-2 py-1 rounded">debug-super-admin.sql</code></li>
              </ol>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded">
              <strong>Si "¿Es Super Admin?" dice SÍ:</strong>
              <ol className="list-decimal ml-6 mt-2 space-y-1">
                <li>Cierra sesión completamente</li>
                <li>Detén el servidor (Ctrl+C)</li>
                <li>Reinicia: <code className="bg-gray-200 px-2 py-1 rounded">npm run dev</code></li>
                <li>Vuelve a iniciar sesión</li>
                <li>Abre el menú lateral</li>
              </ol>
            </div>

            <div className="p-4 bg-green-50 border border-green-200 rounded">
              <strong>Información del usuario actual:</strong>
              <ul className="ml-6 mt-2 space-y-1">
                <li><strong>Email:</strong> {session?.user?.email || 'N/A'}</li>
                <li><strong>ID:</strong> {session?.user?.id || 'N/A'}</li>
                <li><strong>Rol:</strong> {session?.user?.role || 'N/A'}</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
