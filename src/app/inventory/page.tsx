'use client'

import { useSession } from 'next-auth/react'
import MainLayout from '@/components/layout/MainLayout'
import RouteProtector from '@/components/layout/RouteProtector'
import InventoryOverviewOptimized from '@/components/dashboard/InventoryOverviewOptimized'
import { CubeIcon, ChartBarIcon } from '@heroicons/react/24/outline'
import { Badge } from '@/components/ui/badge'

export default function InventoryPage() {
  const { data: session } = useSession()

  return (
    <RouteProtector allowedRoles={['ADMIN', 'ALMACEN']}>
      <MainLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate flex items-center gap-3">
                <CubeIcon className="h-8 w-8 text-blue-600" />
                Control de Inventario Optimizado
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Sistema optimizado con paginación, filtros avanzados y performance mejorado
              </p>
            </div>
            <div className="mt-4 flex gap-2 md:mt-0 md:ml-4">
              <Badge variant="default" className="flex items-center gap-1">
                <ChartBarIcon className="h-4 w-4" />
                Con Paginación
              </Badge>
            </div>
          </div>

          {/* Main Content */}
          <InventoryOverviewOptimized />
        </div>
      </MainLayout>
    </RouteProtector>
  )
}
