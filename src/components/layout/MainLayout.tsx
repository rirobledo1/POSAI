'use client';

import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect, ReactNode, memo, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useRoleBasedNavigation, ROLE_PERMISSIONS } from '@/hooks/useRoleBasedNavigation';
import { useCompany } from '@/hooks/useCompany';
import { PageErrorBoundary } from '@/components/error/SpecializedErrorBoundaries';
import { ErrorProvider } from '@/hooks/useErrorHandling';
import { BranchSelector } from '@/components/branches/BranchSelector';
import { TrialBanner } from '@/components/subscriptions/TrialBanner';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import SubscriptionAwareNavigation from '@/components/layout/SubscriptionAwareNavigation';
import AlertBadge from '@/components/alerts/AlertBadge';
import {
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import NetworkStatusIndicator from '@/components/ui/NetworkStatusIndicator';

interface MainLayoutProps {
  children: ReactNode;
}

// 🎯 Loading spinner optimizado
const LoadingSpinner = memo(() => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="relative">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-sm text-gray-500 font-medium">Cargando...</div>
      </div>
    </div>
  </div>
))
LoadingSpinner.displayName = 'LoadingSpinner'

// 🎯 Componente principal optimizado con Error Boundaries completos
export default function MainLayout({ children }: MainLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);
  const { navigation, userRole } = useRoleBasedNavigation();
  const { company } = useCompany();

  // 🎯 Callbacks optimizados
  const handleSignOut = useCallback(async () => {
    try {
      console.log('🚪 Cerrando sesión...');
      // Usar redirect: false y manejar la redirección manualmente
      await signOut({ 
        redirect: false,
        callbackUrl: '/login' 
      });
      // Redirección manual para asegurar la URL correcta
      window.location.href = '/login';
    } catch (error) {
      console.error('❌ Error al cerrar sesión:', error);
      // Fallback: redirección forzada
      window.location.href = '/login';
    }
  }, []);

  const handleNavigation = useCallback((href: string) => {
    try {
      setNavigatingTo(href);
      setIsNavigating(true);
      
      // Pequeño delay para mostrar feedback visual
      setTimeout(() => {
        router.push(href);
        // Mantener el sidebar abierto brevemente para feedback
        setTimeout(() => {
          setSidebarOpen(false);
          setIsNavigating(false);
          setNavigatingTo(null);
        }, 300);
      }, 100);
    } catch (error) {
      console.error('Error navigating:', error);
      setIsNavigating(false);
      setNavigatingTo(null);
      window.location.href = href;
    }
  }, [router]);

  // 🎯 Valores memoizados
  const roleInfo = useMemo(() => 
    ROLE_PERMISSIONS[userRole as keyof typeof ROLE_PERMISSIONS] || ROLE_PERMISSIONS.SOLO_LECTURA, 
    [userRole]
  );

  // 🎯 Manejo de redirección a login con useEffect (evita error de setState durante render)
  useEffect(() => {
    if (status !== 'loading' && !session) {
      console.log('⚠️ No hay sesión, redirigiendo a login...');
      window.location.href = '/login';
    }
  }, [session, status]);

  // 🎯 Early returns con loading y autenticación
  if (status === 'loading') {
    return <LoadingSpinner />
  }

  // Si no hay sesión, mostrar loading mientras redirige (el useEffect maneja la redirección)
  if (!session) {
    return <LoadingSpinner />
  }

  return (
    <ErrorProvider>
      <PageErrorBoundary>
        <div className="h-screen flex overflow-hidden bg-gray-100">
          {/* Botón hamburguesa - SIEMPRE VISIBLE */}
          <button
            type="button"
            className="fixed top-2 left-4 z-50 p-2 rounded-md bg-blue-600 shadow-lg text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title={sidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
          >
            {sidebarOpen ? (
              <XMarkIcon className="h-6 w-6" />
            ) : (
              <Bars3Icon className="h-6 w-6" />
            )}
          </button>

          {/* 🚨 Badge de Alertas + 🏢 Selector de Sucursal - FIXED en header */}
          <div className="fixed top-4 right-4 z-50 flex items-center gap-3">
            <PageErrorBoundary>
              <AlertBadge />
            </PageErrorBoundary>
            <PageErrorBoundary>
              <BranchSelector />
            </PageErrorBoundary>
          </div>

          {/* Overlay cuando el sidebar está abierto */}
          {sidebarOpen && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Sidebar deslizante desde la izquierda */}
          <div className={`
            fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-xl
            transform transition-transform duration-300 ease-in-out
            ${
              sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }
          `}>
            {/* Contenido del sidebar */}
            <div className="flex flex-col h-full">
              <div className="flex-1 flex flex-col pt-16 pb-4 overflow-y-auto">
                <div className="flex items-center justify-between flex-shrink-0 px-4">
                  <button
                    onClick={() => handleNavigation('/pos')}
                    className="flex-1 text-left hover:opacity-80 transition-opacity"
                    title="Ir a Ventas (POS)"
                  >
                    <h1 className="text-xl font-bold text-gray-900 truncate">{company?.name || 'PosAI'}</h1>
                    {/* Indicador de red */}
                    <div className="mt-1">
                      <NetworkStatusIndicator compact />
                    </div>
                  </button>
                </div>
                
                {/* Role Information */}
                <PageErrorBoundary>
                  <div className="mx-4 mt-4 p-3 bg-gray-50 rounded-lg border">
                    <div className="flex items-center">
                      <ShieldCheckIcon className="h-4 w-4 text-gray-600 mr-2" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{roleInfo.name}</p>
                        <p className="text-xs text-gray-600">{roleInfo.description}</p>
                      </div>
                    </div>
                  </div>
                </PageErrorBoundary>
                
                {/* Navigation */}
                <PageErrorBoundary>
                  <SubscriptionAwareNavigation 
                    navigation={navigation} 
                    onNavigate={handleNavigation}
                    isNavigating={isNavigating}
                    navigatingTo={navigatingTo}
                  />
                </PageErrorBoundary>
              </div>
              
              {/* User Profile en la parte inferior */}
              <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
                <PageErrorBoundary>
                  <div className="flex items-center w-full">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700">{session.user.name}</p>
                      <p className="text-xs text-gray-500">{session.user.email}</p>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="ml-3 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-500 bg-white hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                      title="Cerrar sesión"
                    >
                      <ArrowRightOnRectangleIcon className="h-4 w-4" />
                    </button>
                  </div>
                </PageErrorBoundary>
              </div>
            </div>
          </div>

          {/* Main content - PANTALLA COMPLETA */}
          <div className="flex flex-col w-full h-full overflow-hidden">
            {/* Trial Banner - Arriba de todo */}
            <PageErrorBoundary>
              <TrialBanner />
            </PageErrorBoundary>

            {/* Breadcrumb */}
            <PageErrorBoundary>
              <Breadcrumb />
            </PageErrorBoundary>

            {/* Main content con error boundary específico para contenido */}
            <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
              {/* Contenedor con padding superior para no tapar con hamburguesa y selector */}
              <div className="h-full pt-1">
                <PageErrorBoundary>
                  {children}
                </PageErrorBoundary>
              </div>
            </main>
          </div>
        </div>
      </PageErrorBoundary>
    </ErrorProvider>
  );
}
