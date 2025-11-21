// 🛡️ ERROR BOUNDARIES ESPECIALIZADOS
// src/components/error/SpecializedErrorBoundaries.tsx

'use client'

import React, { ReactNode } from 'react'
import { ErrorBoundary } from './ErrorBoundarySystem'
import { 
  ExclamationTriangleIcon, 
  ChartBarIcon, 
  CubeIcon, 
  UsersIcon,
  ShoppingCartIcon,
  CogIcon
} from '@heroicons/react/24/outline'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

// 🎯 Error Boundary para páginas completas
export function PageErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      level="page"
      enableRecovery={true}
      enableReporting={true}
      showDetails={true}
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <Card className="max-w-md w-full border-red-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <h1 className="text-xl font-bold text-gray-900 mb-2">
                  Error en la Página
                </h1>
                <p className="text-gray-600 mb-6">
                  Se produjo un error inesperado. Estamos trabajando para solucionarlo.
                </p>
                <div className="space-y-2">
                  <Button 
                    onClick={() => window.location.reload()}
                    className="w-full"
                  >
                    Recargar Página
                  </Button>
                  <Button 
                    onClick={() => window.location.href = '/dashboard'}
                    variant="outline"
                    className="w-full"
                  >
                    Ir al Dashboard
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  )
}

// 🎯 Error Boundary para el Dashboard
export function DashboardErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      level="section"
      enableRecovery={true}
      enableReporting={true}
      fallback={
        <Card className="border-red-200">
          <CardContent className="py-8">
            <div className="text-center text-red-500">
              <ChartBarIcon className="h-16 w-16 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Error en el Dashboard
              </h3>
              <p className="text-gray-600 mb-4">
                No se pudieron cargar las métricas del dashboard.
              </p>
              <Button 
                onClick={() => window.location.reload()}
                variant="outline"
                size="sm"
              >
                Recargar Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      }
    >
      {children}
    </ErrorBoundary>
  )
}

// 🎯 Error Boundary para Inventario
export function InventoryErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      level="section"
      enableRecovery={true}
      fallback={
        <Card className="border-red-200">
          <CardContent className="py-8">
            <div className="text-center text-red-500">
              <CubeIcon className="h-16 w-16 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Error en el Inventario
              </h3>
              <p className="text-gray-600 mb-4">
                No se pudo cargar la información del inventario.
              </p>
              <div className="space-x-2">
                <Button 
                  onClick={() => window.location.reload()}
                  variant="outline"
                  size="sm"
                >
                  Recargar
                </Button>
                <Button 
                  onClick={() => window.location.href = '/dashboard'}
                  variant="outline"
                  size="sm"
                >
                  Ir al Dashboard
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      }
    >
      {children}
    </ErrorBoundary>
  )
}

// 🎯 Error Boundary para POS
export function POSErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      level="section"
      enableRecovery={true}
      enableReporting={true}
      fallback={
        <Card className="border-red-200">
          <CardContent className="py-8">
            <div className="text-center text-red-500">
              <ShoppingCartIcon className="h-16 w-16 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Error en el Punto de Venta
              </h3>
              <p className="text-gray-600 mb-4">
                Se produjo un error en el sistema de ventas.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
                <p className="text-sm text-yellow-800">
                  <strong>Importante:</strong> Si estabas procesando una venta, 
                  verifica si se completó antes de continuar.
                </p>
              </div>
              <div className="space-x-2">
                <Button 
                  onClick={() => window.location.reload()}
                  variant="outline"
                  size="sm"
                >
                  Recargar POS
                </Button>
                <Button 
                  onClick={() => window.location.href = '/ventas'}
                  variant="outline"
                  size="sm"
                >
                  Ver Ventas
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      }
    >
      {children}
    </ErrorBoundary>
  )
}

// 🎯 Error Boundary para Clientes
export function CustomersErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      level="section"
      enableRecovery={true}
      fallback={
        <Card className="border-red-200">
          <CardContent className="py-8">
            <div className="text-center text-red-500">
              <UsersIcon className="h-16 w-16 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Error en Clientes
              </h3>
              <p className="text-gray-600 mb-4">
                No se pudo cargar la información de clientes.
              </p>
              <Button 
                onClick={() => window.location.reload()}
                variant="outline"
                size="sm"
              >
                Recargar
              </Button>
            </div>
          </CardContent>
        </Card>
      }
    >
      {children}
    </ErrorBoundary>
  )
}

// 🎯 Error Boundary para Configuración
export function SettingsErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      level="section"
      enableRecovery={false} // Configuración no debe auto-recuperarse
      enableReporting={true}
      fallback={
        <Card className="border-red-200">
          <CardContent className="py-8">
            <div className="text-center text-red-500">
              <CogIcon className="h-16 w-16 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Error en Configuración
              </h3>
              <p className="text-gray-600 mb-4">
                Se produjo un error al cargar la configuración del sistema.
              </p>
              <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
                <p className="text-sm text-red-800">
                  <strong>Precaución:</strong> No realices cambios hasta resolver este error.
                </p>
              </div>
              <div className="space-x-2">
                <Button 
                  onClick={() => window.location.reload()}
                  variant="outline"
                  size="sm"
                >
                  Recargar
                </Button>
                <Button 
                  onClick={() => window.location.href = '/dashboard'}
                  variant="outline"
                  size="sm"
                >
                  Ir al Dashboard
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      }
    >
      {children}
    </ErrorBoundary>
  )
}

// 🎯 Error Boundary para componentes pequeños
export function ComponentErrorBoundary({ 
  children, 
  componentName = 'Componente',
  showFallback = true 
}: { 
  children: ReactNode
  componentName?: string
  showFallback?: boolean
}) {
  return (
    <ErrorBoundary
      level="component"
      enableRecovery={true}
      fallback={
        showFallback ? (
          <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
            <div className="flex items-center gap-2 text-red-700">
              <ExclamationTriangleIcon className="h-4 w-4" />
              <span className="text-sm font-medium">
                Error en {componentName}
              </span>
            </div>
            <p className="text-xs text-red-600 mt-1">
              Este componente no pudo cargarse correctamente.
            </p>
          </div>
        ) : null
      }
    >
      {children}
    </ErrorBoundary>
  )
}

// 🎯 Error Boundary para formularios
export function FormErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      level="component"
      enableRecovery={true}
      fallback={
        <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
          <div className="text-center">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <h4 className="text-sm font-medium text-red-700 mb-1">
              Error en el Formulario
            </h4>
            <p className="text-xs text-red-600 mb-3">
              Se produjo un error al cargar el formulario.
            </p>
            <Button 
              onClick={() => window.location.reload()}
              size="sm"
              variant="outline"
            >
              Recargar Formulario
            </Button>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  )
}

// 🎯 HOC (Higher Order Component) para envolver componentes fácilmente
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string,
  boundaryType: 'page' | 'section' | 'component' = 'component'
) {
  const WrappedComponent = (props: P) => {
    const BoundaryComponent = 
      boundaryType === 'page' ? PageErrorBoundary :
      boundaryType === 'section' ? DashboardErrorBoundary :
      ComponentErrorBoundary

    if (boundaryType === 'component') {
      return (
        <ComponentErrorBoundary componentName={componentName || Component.displayName || Component.name}>
          <Component {...props} />
        </ComponentErrorBoundary>
      )
    }

    return (
      <BoundaryComponent>
        <Component {...props} />
      </BoundaryComponent>
    )
  }
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}