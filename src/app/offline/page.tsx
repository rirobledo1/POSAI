'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { WifiIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false)

  useEffect(() => {
    setIsOnline(navigator.onLine)
    
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleRetry = () => {
    if (isOnline) {
      window.location.href = '/dashboard'
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <WifiIcon className="h-16 w-16 text-gray-400" />
          </div>
          <CardTitle className="text-xl">Sin Conexión</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            No tienes conexión a internet. Algunas funciones pueden estar limitadas.
          </p>
          
          {isOnline ? (
            <div className="space-y-2">
              <div className="text-green-600 text-sm">✓ Conexión restaurada</div>
              <Button onClick={handleRetry} className="w-full">
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                Volver al Dashboard
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-red-600 text-sm">✗ Sin conexión</div>
              <p className="text-sm text-gray-500">
                Verifica tu conexión y vuelve a intentar
              </p>
            </div>
          )}
          
          <div className="pt-4 border-t">
            <h3 className="font-medium mb-2">Funciones disponibles offline:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Consultar productos en cache</li>
              <li>• Ver últimas ventas guardadas</li>
              <li>• Acceder a datos sincronizados</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
