'use client';

import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useRoleBasedNavigation, ROLE_PERMISSIONS } from '@/hooks/useRoleBasedNavigation';
import { useCompany } from '@/hooks/useCompany';
import {
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  ShieldCheckIcon,
  ChevronLeftIcon,
} from '@heroicons/react/24/outline';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { navigation, userRole } = useRoleBasedNavigation();

  // Cargar estado del sidebar desde localStorage al montar el componente
  useEffect(() => {
    const savedCollapsedState = localStorage.getItem('sidebarCollapsed');
    if (savedCollapsedState !== null) {
      setSidebarCollapsed(JSON.parse(savedCollapsedState));
    }
  }, []);

  // Función para alternar el estado del sidebar y guardarlo en localStorage
  const toggleSidebar = () => {
    const newCollapsedState = !sidebarCollapsed;
    setSidebarCollapsed(newCollapsedState);
    localStorage.setItem('sidebarCollapsed', JSON.stringify(newCollapsedState));
  };

  // Obtener información del rol actual
  const roleInfo = ROLE_PERMISSIONS[userRole as keyof typeof ROLE_PERMISSIONS] || ROLE_PERMISSIONS.SOLO_LECTURA;

  // Obtener información de la empresa
  const { company } = useCompany();

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  const handleNavigation = (href: string) => {
    router.push(href);
    setSidebarOpen(false);
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!session) {
    router.push('/login');
    return null;
  }

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <XMarkIcon className="h-6 w-6 text-white" />
              </button>
            </div>
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex-shrink-0 flex items-center px-4">
                <h1 className="text-xl font-bold text-gray-900">{company?.name || 'PosAI'}</h1>
              </div>
              
              {/* Role Information - Mobile */}
              <div className="mx-4 mt-4 p-3 bg-gray-50 rounded-lg border">
                <div className="flex items-center">
                  <ShieldCheckIcon className="h-5 w-5 text-gray-600 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{roleInfo.name}</p>
                    <p className="text-xs text-gray-600">{roleInfo.description}</p>
                  </div>
                </div>
              </div>
              
              <nav className="mt-5 px-2 space-y-1">
                {navigation.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => handleNavigation(item.href)}
                    className={`${
                      item.current
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    } group flex items-center px-2 py-2 text-base font-medium rounded-md w-full text-left`}
                    title={item.description}
                  >
                    <item.icon
                      className={`${
                        item.current ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500'
                      } mr-4 h-6 w-6`}
                    />
                    {item.name}
                  </button>
                ))}
              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <div className="flex items-center">
                <div className="ml-3">
                  <p className="text-base font-medium text-gray-700 group-hover:text-gray-900">
                    {session.user.name}
                  </p>
                  <p className="text-sm font-medium text-gray-500">{session.user.email}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Static sidebar for desktop */}
        <div className="hidden md:flex md:flex-shrink-0">
          <div className={`flex flex-col transition-all duration-300 ease-in-out ${
            sidebarCollapsed ? 'w-16' : 'w-64'
          }`}>
            <div className="flex flex-col h-0 flex-1 border-r border-gray-200 bg-white">
              <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
                <div className="flex items-center justify-between flex-shrink-0 px-4">
                  {!sidebarCollapsed && (
                    <h1 className="text-xl font-bold text-gray-900">{company?.name || 'PosAI'}</h1>
                  )}
                  <button
                    onClick={toggleSidebar}
                    className={`p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors ${
                      sidebarCollapsed ? 'ml-0' : ''
                    }`}
                    title={sidebarCollapsed ? 'Expandir menú' : 'Colapsar menú'}
                  >
                    <ChevronLeftIcon 
                      className={`h-5 w-5 transition-transform duration-300 ${
                        sidebarCollapsed ? 'rotate-180' : ''
                      }`} 
                    />
                  </button>
                </div>
                
                {/* Role Information - Desktop */}
                {!sidebarCollapsed && (
                  <div className="mx-4 mt-4 p-3 bg-gray-50 rounded-lg border">
                    <div className="flex items-center">
                      <ShieldCheckIcon className="h-4 w-4 text-gray-600 mr-2" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{roleInfo.name}</p>
                        <p className="text-xs text-gray-600">{roleInfo.description}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {sidebarCollapsed && (
                  <div className="mx-2 mt-4 p-2 bg-gray-50 rounded-lg border flex justify-center">
                    <ShieldCheckIcon className="h-5 w-5 text-gray-600" title={`${roleInfo.name}: ${roleInfo.description}`} />
                  </div>
                )}
                
                <nav className="mt-5 flex-1 px-2 space-y-1">
                  {navigation.map((item) => (
                    <button
                      key={item.name}
                      onClick={() => handleNavigation(item.href)}
                      className={`${
                        item.current
                          ? 'bg-gray-100 text-gray-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      } group flex items-center ${
                        sidebarCollapsed ? 'justify-center px-2' : 'px-2'
                      } py-2 text-sm font-medium rounded-md w-full text-left transition-all duration-200`}
                      title={sidebarCollapsed ? `${item.name}: ${item.description}` : item.description}
                    >
                      <item.icon
                        className={`${
                          item.current ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500'
                        } h-6 w-6 ${sidebarCollapsed ? '' : 'mr-3'} transition-colors`}
                      />
                      {!sidebarCollapsed && (
                        <span className="truncate">{item.name}</span>
                      )}
                    </button>
                  ))}
                </nav>
              </div>
              <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
                {!sidebarCollapsed ? (
                  <div className="flex items-center w-full">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700">{session.user.name}</p>
                      <p className="text-xs text-gray-500">{session.user.email}</p>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="ml-3 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-500 bg-white hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      title="Cerrar sesión"
                    >
                      <ArrowRightOnRectangleIcon className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex justify-center w-full">
                    <button
                      onClick={handleSignOut}
                      className="inline-flex items-center justify-center p-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-500 bg-white hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      title={`Cerrar sesión - ${session.user.name}`}
                    >
                      <ArrowRightOnRectangleIcon className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-col w-0 flex-1 overflow-hidden">
          <div className="md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3">
            <button
              type="button"
              className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              onClick={() => setSidebarOpen(true)}
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
          </div>
          <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
            <div className="py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}