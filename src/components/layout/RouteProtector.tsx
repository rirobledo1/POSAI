'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, ReactNode } from 'react'
import { hasAccess } from '@/hooks/useRoleBasedNavigation'
import { Card, CardContent } from '@/components/ui/card'
import { ShieldExclamationIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'

interface RouteProtectorProps {
  children: ReactNode
  allowedRoles: string[]
  fallbackPath?: string
  showFallback?: boolean
}

export default function RouteProtector({ 
  children, 
  allowedRoles, 
  fallbackPath = '/dashboard',
  showFallback = true 
}: RouteProtectorProps) {
  const { data: session, status } = useSession() // ✅ Agregar status
  const router = useRouter()
  
  const userRole = session?.user?.role || 'SOLO_LECTURA'
  const hasPermission = hasAccess(userRole, allowedRoles)

  useEffect(() => {
    if (session && !hasPermission && !showFallback) {
      router.push(fallbackPath)
    }
  }, [session, hasPermission, router, fallbackPath, showFallback])

  // ⏳ Mostrar loading mientras la sesión carga
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Verificando permisos...</p>
        </div>
      </div>
    )
  }

  // Si no tiene permisos y queremos mostrar el fallback
  if (!hasPermission && showFallback) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <Card>
            <CardContent className="py-8 px-6">
              <div className="text-center">
                <ShieldExclamationIcon className="mx-auto h-16 w-16 text-red-500 mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Acceso Denegado
                </h2>
                <p className="text-gray-600 mb-6">
                  No tienes permisos para acceder a esta sección.
                </p>
                <div className="bg-gray-50 rounded-md p-4 mb-6">
                  <div className="text-sm">
                    <p className="font-medium text-gray-900">Tu rol actual:</p>
                    <p className="text-gray-700">{userRole}</p>
                  </div>
                  <div className="text-sm mt-3">
                    <p className="font-medium text-gray-900">Roles requeridos:</p>
                    <p className="text-gray-700">{allowedRoles.join(', ')}</p>
                  </div>
                </div>
                <button
                  onClick={() => router.push(fallbackPath)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <ArrowLeftIcon className="h-4 w-4 mr-2" />
                  Volver al Dashboard
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Si no tiene permisos y NO queremos mostrar fallback (redirección automática)
  if (!hasPermission && !showFallback) {
    return null
  }

  // Si tiene permisos, mostrar el contenido
  return <>{children}</>
}

// Hook para usar en componentes que necesiten verificar permisos
export function useRouteProtection(allowedRoles: string[]) {
  const { data: session } = useSession()
  const userRole = session?.user?.role || 'SOLO_LECTURA'
  
  return {
    hasPermission: hasAccess(userRole, allowedRoles),
    userRole,
    session
  }
}
