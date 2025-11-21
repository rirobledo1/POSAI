'use client'

import Link from 'next/link'
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline'
import { usePathname } from 'next/navigation'
import { useMemo } from 'react'

export function Breadcrumb() {
  const pathname = usePathname()

  const breadcrumbs = useMemo(() => {
    if (!pathname || pathname === '/dashboard') return []

    const paths = pathname.split('/').filter(Boolean)
    const items = []

    // Mapeo de rutas a nombres amigables
    const nameMap: Record<string, string> = {
      'dashboard': 'Dashboard',
      'settings': 'Configuración',
      'subscription': 'Suscripción',
      'pos': 'Punto de Venta',
      'ventas': 'Gestión de Ventas',
      'customers': 'Clientes',
      'productos': 'Productos',
      'inventory': 'Inventario',
      'reports': 'Reportes'
    }

    let currentPath = ''
    for (const path of paths) {
      currentPath += `/${path}`
      items.push({
        name: nameMap[path] || path.charAt(0).toUpperCase() + path.slice(1),
        href: currentPath,
        current: currentPath === pathname
      })
    }

    return items
  }, [pathname])

  if (breadcrumbs.length === 0) return null

  return (
    <nav className="flex px-4 py-3 bg-white border-b" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        <li>
          <Link
            href="/dashboard"
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <HomeIcon className="h-5 w-5" />
            <span className="sr-only">Dashboard</span>
          </Link>
        </li>

        {breadcrumbs.map((item, index) => (
          <li key={item.href} className="flex items-center">
            <ChevronRightIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
            {item.current ? (
              <span className="ml-2 text-sm font-medium text-gray-900">
                {item.name}
              </span>
            ) : (
              <Link
                href={item.href}
                className="ml-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
              >
                {item.name}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
