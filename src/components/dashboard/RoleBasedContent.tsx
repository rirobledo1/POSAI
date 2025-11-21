// 👥 COMPONENTE DE CONTROL DE ACCESO POR ROLES - OPTIMIZADO
// src/components/dashboard/RoleBasedContent.tsx

'use client'

import React, { memo, useMemo, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatCard } from '@/components/ui/stat-card'
import { 
  EyeSlashIcon, 
  ShieldCheckIcon, 
  CurrencyDollarIcon,
  CubeIcon,
  UsersIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'

interface RoleBasedContentProps {
  children: React.ReactNode
  allowedRoles: string[]
  fallback?: React.ReactNode
}

// 🎯 Hook optimizado para verificación de permisos
const useRolePermission = (allowedRoles: string[]) => {
  const { data: session, status } = useSession()
  
  return useMemo(() => {
    if (status === 'loading') {
      return { hasPermission: false, isLoading: true, userRole: null }
    }
    
    if (!session?.user) {
      return { hasPermission: false, isLoading: false, userRole: null }
    }
    
    const userRole = session.user.role || 'SOLO_LECTURA'
    const normalizedUserRole = userRole.toString().trim().toUpperCase()
    const normalizedAllowedRoles = allowedRoles.map(role => role.toString().trim().toUpperCase())
    const hasPermission = normalizedAllowedRoles.includes(normalizedUserRole)
    
    return { hasPermission, isLoading: false, userRole: normalizedUserRole }
  }, [session, status, allowedRoles])
}

// 🎯 Componente para mostrar contenido según roles permitidos - OPTIMIZADO
export const RoleBasedContent = memo(({ children, allowedRoles, fallback }: RoleBasedContentProps) => {
  const { hasPermission, isLoading, userRole } = useRolePermission(allowedRoles)
  
  // 🎯 Fallback por defecto memoizado
  const defaultFallback = useMemo(() => (
    <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
      <div className="text-center">
        <EyeSlashIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-500">
          Contenido no disponible para tu rol: <strong>{userRole}</strong>
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Se requiere: {allowedRoles.join(', ')}
        </p>
      </div>
    </div>
  ), [userRole, allowedRoles])
  
  if (isLoading) {
    return <div className="animate-pulse bg-gray-200 rounded-lg h-32"></div>
  }
  
  if (!hasPermission) {
    return fallback || defaultFallback
  }
  
  return <>{children}</>
})

RoleBasedContent.displayName = 'RoleBasedContent'

// 🎯 Información de permisos por rol - OPTIMIZADA
export const RolePermissionsInfo = memo(() => {
  const { data: session } = useSession()
  const [isVisible, setIsVisible] = React.useState(true)
  
  const userRole = useMemo(() => session?.user?.role || 'SOLO_LECTURA', [session?.user?.role])
  
  // 🎯 Configuración de roles memoizada
  const roleInfo = useMemo(() => ({
    'ADMIN': {
      color: 'bg-red-100 text-red-800 border-red-200',
      icon: '🔴',
      title: 'Administrador',
      description: 'Acceso completo a todas las funciones',
      permissions: [
        'Ver todas las métricas financieras',
        'Gestionar inventario completo',
        'Ver todas las ventas',
        'Configurar sistema (IVA, precios)',
        'Gestionar usuarios'
      ]
    },
    'VENDEDOR': {
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: '🟡',
      title: 'Vendedor',
      description: 'Enfocado en ventas y atención al cliente',
      permissions: [
        'Ver sus propias ventas',
        'Gestionar clientes',
        'Ver catálogo de productos (sin costos)',
        'Ver productos más vendidos',
        'Procesar ventas'
      ]
    },
    'ALMACEN': {
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: '🔵',
      title: 'Almacén',
      description: 'Control de inventario y productos',
      permissions: [
        'Ver inventario completo',
        'Gestionar alertas de stock',
        'Ver movimientos de inventario',
        'Organizar por categorías',
        'Gestionar entradas/salidas'
      ]
    },
    'SOLO_LECTURA': {
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: '🟢',
      title: 'Solo Lectura',
      description: 'Acceso limitado a información básica',
      permissions: [
        'Ver estadísticas generales',
        'Ver catálogo básico',
        'Ver estado del sistema',
        'Sin acceso a datos financieros'
      ]
    }
  }), [])
  
  // 🎯 Callback optimizado para cerrar
  const handleClose = useCallback(() => {
    setIsVisible(false)
  }, [])
  
  // 🎯 Auto-ocultar después de 5 segundos
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
    }, 5000)
    
    return () => clearTimeout(timer)
  }, [])
  
  // Si no está visible, no renderizar
  if (!isVisible) return null
  
  const info = roleInfo[userRole as keyof typeof roleInfo]
  
  if (!info) return null
  
  return (
    <div 
      className={`transition-all duration-700 ease-out ${
        isVisible ? 'opacity-100 max-h-96 mb-6' : 'opacity-0 max-h-0 mb-0'
      } overflow-hidden`}
    >
      <Card className={`p-4 border-2 ${info.color} transform transition-transform duration-300`}>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">{info.icon}</span>
          <div className="flex-1">
            <h3 className="font-semibold flex items-center gap-2">
              <ShieldCheckIcon className="h-4 w-4" />
              Tu Rol: {info.title}
              <Badge variant="secondary" className="text-xs ml-2">
                Se oculta automáticamente
              </Badge>
            </h3>
            <p className="text-sm opacity-80">{info.description}</p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 transition-colors text-lg leading-none"
            title="Cerrar mensaje"
          >
            ×
          </button>
        </div>
        
        <div className="mt-3">
          <p className="text-sm font-medium mb-2">Permisos disponibles:</p>
          <ul className="text-xs space-y-1">
            {info.permissions.map((permission, i) => (
              <li key={i} className="flex items-center gap-1">
                <span className="text-green-600">✓</span>
                {permission}
              </li>
            ))}
          </ul>
        </div>
      </Card>
    </div>
  )
})

RolePermissionsInfo.displayName = 'RolePermissionsInfo'

// 🎯 Stats cards específicos por rol - OPTIMIZADOS
export const RoleBasedStats = memo(({ stats, loading }: { stats: any, loading: boolean }) => {
  const { data: session } = useSession()
  const userRole = useMemo(() => session?.user?.role || 'SOLO_LECTURA', [session?.user?.role])
  
  // 🎯 Configuración de stats memoizada
  const statsConfig = useMemo(() => [
    {
      component: (
        <StatCard
          title="Ventas Totales"
          value={stats ? `$${stats.totalSales.toLocaleString()}` : '$0'}
          icon={<CurrencyDollarIcon className="h-4 w-4" />}
          change={{
            value: stats ? `+${stats.salesGrowth}%` : '+0%',
            type: 'increase' as const
          }}
          subtitle="vs mes anterior"
          loading={loading}
        />
      ),
      roles: ['ADMIN']
    },
    {
      component: (
        <StatCard
          title="Mis Ventas del Día"
          value={stats ? `$${stats.todaySales.toLocaleString()}` : '$0'}
          icon={<ChartBarIcon className="h-4 w-4" />}
          change={{
            value: "Tu progreso diario",
            type: 'neutral' as const
          }}
          subtitle="ventas procesadas hoy"
          loading={loading}
        />
      ),
      roles: ['ADMIN', 'VENDEDOR']
    },
    {
      component: (
        <StatCard
          title="Ventas a Crédito"
          value={stats && stats.totalCreditSales ? `$${stats.totalCreditSales.toLocaleString()}` : '$0'}
          icon={<CurrencyDollarIcon className="h-4 w-4 text-orange-600" />}
          change={{
            value: "Ventas pendientes",
            type: 'neutral' as const
          }}
          subtitle="total en crédito"
          loading={loading}
        />
      ),
      roles: ['ADMIN']
    },
    {
      component: (
        <StatCard
          title="Adeudos Pendientes"
          value={stats && stats.totalCustomerDebt ? `$${stats.totalCustomerDebt.toLocaleString()}` : '$0'}
          icon={<UsersIcon className="h-4 w-4 text-red-600" />}
          change={{
            value: `${stats?.customersWithDebt || 0} clientes`,
            type: stats && stats.customersWithDebt && stats.customersWithDebt > 0 ? 'decrease' as const : 'neutral' as const
          }}
          subtitle="deben dinero"
          loading={loading}
        />
      ),
      roles: ['ADMIN']
    },
    {
      component: (
        <StatCard
          title="Productos en Stock"
          value={stats?.totalProducts.toLocaleString() || '0'}
          icon={<CubeIcon className="h-4 w-4" />}
          change={{
            value: `${stats?.lowStockAlerts || 0} alertas`,
            type: stats && stats.lowStockAlerts > 0 ? 'decrease' as const : 'neutral' as const
          }}
          subtitle="productos con stock bajo"
          loading={loading}
        />
      ),
      roles: ['ADMIN', 'ALMACEN']
    },
    {
      component: (
        <StatCard
          title="Clientes Totales"
          value={stats?.totalCustomers.toLocaleString() || '0'}
          icon={<UsersIcon className="h-4 w-4" />}
          change={{
            value: "Base de clientes",
            type: 'neutral' as const
          }}
          subtitle="clientes registrados"
          loading={loading}
        />
      ),
      roles: ['ADMIN', 'VENDEDOR']
    },
    {
      component: (
        <StatCard
          title="Estado del Sistema"
          value="Online"
          icon={<ShieldCheckIcon className="h-4 w-4" />}
          change={{
            value: "Sistema funcionando",
            type: 'increase' as const
          }}
          subtitle="todos los servicios activos"
          loading={loading}
        />
      ),
      roles: ['ADMIN', 'SOLO_LECTURA']
    }
  ], [stats, loading])

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
      {statsConfig.map((config, index) => (
        <RoleBasedContent key={index} allowedRoles={config.roles}>
          {config.component}
        </RoleBasedContent>
      ))}

      {/* Desglose de Métodos de Pago - ADMIN y VENDEDOR */}
      <RoleBasedContent allowedRoles={['ADMIN', 'VENDEDOR']}>
        <div className="col-span-full">
          <PaymentMethodBreakdown stats={stats} loading={loading} />
        </div>
      </RoleBasedContent>
    </div>
  )
})

RoleBasedStats.displayName = 'RoleBasedStats'

// 🎯 Componente separado para desglose de métodos de pago
const PaymentMethodBreakdown = memo(({ stats, loading }: { stats: any, loading: boolean }) => {
  // 🎯 Configuración de métodos de pago memoizada
  const paymentMethods = useMemo(() => [
    {
      key: 'efectivo',
      label: 'Efectivo',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-600',
      boldColor: 'text-green-800'
    },
    {
      key: 'tarjeta',
      label: 'Tarjeta',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-600',
      boldColor: 'text-blue-800'
    },
    {
      key: 'transferencia',
      label: 'Transferencia',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      textColor: 'text-purple-600',
      boldColor: 'text-purple-800'
    },
    {
      key: 'credito',
      label: 'Crédito',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      textColor: 'text-orange-600',
      boldColor: 'text-orange-800'
    },
    {
      key: 'total',
      label: 'Total del Día',
      bgColor: 'bg-gray-100',
      borderColor: 'border-gray-300',
      textColor: 'text-gray-600',
      boldColor: 'text-gray-800'
    }
  ], [])

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="h-6 bg-gray-200 rounded animate-pulse mb-4 w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-6 bg-gray-200 rounded animate-pulse mb-1"></div>
              <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <CurrencyDollarIcon className="h-5 w-5" />
        Desglose de Ventas del Día por Método de Pago
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {paymentMethods.map((method) => {
          const methodData = stats?.paymentMethodBreakdown?.[method.key]
          const amount = methodData?.amount || 0
          const count = methodData?.count || 0
          
          return (
            <div key={method.key} className={`text-center p-4 ${method.bgColor} border ${method.borderColor} rounded-lg`}>
              <div className={`text-sm ${method.textColor} font-medium`}>{method.label}</div>
              <div className={`text-lg font-bold ${method.boldColor}`}>
                ${amount.toLocaleString()}
              </div>
              <div className={`text-xs ${method.textColor}`}>
                {count} ventas
              </div>
            </div>
          )
        })}
      </div>

      {/* Verificación de consistencia */}
      {stats?.paymentMethodBreakdown && stats.todaySales && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-sm text-blue-800">
            <strong>Verificación:</strong> {' '}
            {Math.abs(
              (stats.paymentMethodBreakdown.total?.amount || 0) - (stats.todaySales || 0)
            ) < 0.01 
              ? '✅ Los totales coinciden correctamente'
              : `⚠️ Diferencia: $${Math.abs((stats.paymentMethodBreakdown.total?.amount || 0) - (stats.todaySales || 0)).toFixed(2)}`
            }
          </div>
        </div>
      )}
    </div>
  )
})

PaymentMethodBreakdown.displayName = 'PaymentMethodBreakdown'