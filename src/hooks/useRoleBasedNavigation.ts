import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  HomeIcon,
  ChartBarIcon,
  CubeIcon,
  UserGroupIcon,
  CogIcon,
  TagIcon,
  DocumentTextIcon,
  DocumentChartBarIcon,
  CreditCardIcon,
  CurrencyDollarIcon,
  BanknotesIcon,
  BellIcon,
  EnvelopeIcon,
  BellAlertIcon,
  ShieldCheckIcon,
  ClipboardDocumentListIcon,
  ShoppingBagIcon,
  GlobeAltIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline'

export interface NavItem {
  name: string
  href: string
  icon: any
  current: boolean
  roles: string[] // Roles que pueden ver esta opción
  description?: string // Descripción de la funcionalidad
  external?: boolean // Si debe abrir en nueva ventana
}

export function useRoleBasedNavigation() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [companyInfo, setCompanyInfo] = useState<{
    slug: string
    plan: string
    onlineStoreEnabled: boolean
  } | null>(null)
  
  // Obtener rol del usuario desde la sesión
  const userRole = session?.user?.role || 'SOLO_LECTURA'
  
  // Verificar si es super admin
  useEffect(() => {
    const checkSuperAdmin = async () => {
      if (!session?.user?.id) {
        console.log('[Super Admin Check] No hay session.user.id')
        return
      }
      
      console.log('[Super Admin Check] Iniciando verificación para:', session.user.email)
      
      try {
        const response = await fetch('/api/admin/check-super-admin')
        console.log('[Super Admin Check] Response status:', response.status)
        
        if (response.ok) {
          const data = await response.json()
          console.log('[Super Admin Check] Data recibida:', data)
          setIsSuperAdmin(data.isSuperAdmin)
          console.log('[Super Admin Check] isSuperAdmin establecido a:', data.isSuperAdmin)
        } else {
          console.error('[Super Admin Check] Response no OK:', response.status)
        }
      } catch (error) {
        console.error('[Super Admin Check] Error:', error)
      }
    }
    
    checkSuperAdmin()
  }, [session?.user?.id, session?.user?.email])

  // Obtener información de la empresa para el link de la tienda
  useEffect(() => {
    const fetchCompanyInfo = async () => {
      if (!session?.user?.id) return
      
      try {
        const response = await fetch('/api/company/info')
        if (response.ok) {
          const data = await response.json()
          setCompanyInfo({
            slug: data.slug,
            plan: data.plan,
            onlineStoreEnabled: data.onlineStoreEnabled
          })
        }
      } catch (error) {
        console.error('Error fetching company info:', error)
      }
    }
    
    fetchCompanyInfo()
  }, [session?.user?.id])
  
  // 🔴 SOLUCIÓN TEMPORAL: Forzar super admin para admin@ferreai.com
  const isSuperAdminForced = session?.user?.email === 'admin@ferreai.com' || isSuperAdmin
  
  // Log para debug
  useEffect(() => {
    console.log('=== DEBUG MENU ===')
    console.log('Email:', session?.user?.email)
    console.log('isSuperAdmin (API):', isSuperAdmin)
    console.log('isSuperAdminForced:', isSuperAdminForced)
    console.log('==================')
  }, [session?.user?.email, isSuperAdmin, isSuperAdminForced])
  
  // Definir todas las opciones de navegación con sus roles permitidos
  const allNavigationItems: NavItem[] = [
    // 💰 SECCIÓN OPERATIVA - Lo más importante primero
    { 
      name: 'Ventas (POS)', 
      href: '/pos', 
      icon: ChartBarIcon, 
      current: pathname === '/pos',
      roles: ['ADMIN', 'VENDEDOR'],
      description: 'Procesar ventas y transacciones'
    },
    { 
      name: 'Gestión Ventas', 
      href: '/ventas', 
      icon: DocumentTextIcon, 
      current: pathname === '/ventas',
      roles: ['ADMIN', 'VENDEDOR'],
      description: 'Administrar y cancelar ventas'
    },
    { 
      name: 'Cotizaciones', 
      href: '/cotizaciones', 
      icon: ClipboardDocumentListIcon, 
      current: pathname.startsWith('/cotizaciones'),
      roles: ['ADMIN', 'VENDEDOR'],
      description: 'Crear y gestionar cotizaciones'
    },
    { 
      name: 'Pedidos Web', 
      href: '/pedidos-web', 
      icon: ShoppingBagIcon, 
      current: pathname === '/pedidos-web',
      roles: ['ADMIN', 'VENDEDOR'],
      description: 'Órdenes y cotizaciones de la tienda en línea'
    },
    { 
      name: 'Cortes de Caja', 
      href: '/cortes', 
      icon: CurrencyDollarIcon, 
      current: pathname === '/cortes',
      roles: ['ADMIN', 'VENDEDOR'],
      description: 'Historial de aperturas y cierres de caja'
    },
    { 
      name: 'Clientes', 
      href: '/customers', 
      icon: UserGroupIcon, 
      current: pathname === '/customers',
      roles: ['ADMIN', 'VENDEDOR'],
      description: 'Gestión de clientes'
    },
    { 
      name: 'Cuentas por Cobrar', 
      href: '/cuentas-por-cobrar', 
      icon: BanknotesIcon, 
      current: pathname === '/cuentas-por-cobrar',
      roles: ['ADMIN', 'VENDEDOR'],
      description: 'Gestión de créditos y pagos'
    },
    { 
      name: 'Alertas', 
      href: '/alertas', 
      icon: BellIcon, 
      current: pathname === '/alertas',
      roles: ['ADMIN', 'VENDEDOR'],
      description: 'Notificaciones y alertas del sistema'
    },
    { 
      name: 'Productos', 
      href: '/productos', 
      icon: TagIcon, 
      current: pathname === '/productos',
      roles: ['ADMIN', 'ALMACEN'],
      description: 'Catálogo de productos'
    },
    { 
      name: 'Inventario', 
      href: '/inventory', 
      icon: CubeIcon, 
      current: pathname === '/inventory',
      roles: ['ADMIN', 'ALMACEN'],
      description: 'Control de stock y almacén'
    },
    
    // 📊 SECCIÓN DE ESTADÍSTICAS - Después de operaciones
    { 
      name: 'Estadísticas Ventas', 
      href: '/dashboard', 
      icon: HomeIcon, 
      current: pathname === '/dashboard',
      roles: ['ADMIN', 'VENDEDOR', 'ALMACEN', 'SOLO_LECTURA'],
      description: 'Analítica y métricas de ventas'
    },
    { 
      name: 'Estadísticas Cobranza', 
      href: '/reportes-cobranza', 
      icon: DocumentChartBarIcon, 
      current: pathname === '/reportes-cobranza',
      roles: ['ADMIN', 'VENDEDOR'],
      description: 'Dashboard ejecutivo de cobranza'
    },
    { 
      name: 'Suscripción', 
      href: '/settings/subscription', 
      icon: CreditCardIcon, 
      current: pathname === '/settings/subscription',
      roles: ['ADMIN'],
      description: 'Gestionar plan y facturación'
    },
    { 
      name: 'Configuración', 
      href: '/settings', 
      icon: CogIcon, 
      current: pathname === '/settings',
      roles: ['ADMIN'],
      description: 'Configuración del sistema'
    },
    { 
      name: 'Email (SMTP)', 
      href: '/settings/email', 
      icon: EnvelopeIcon, 
      current: pathname === '/settings/email',
      roles: ['ADMIN'],
      description: 'Configurar email para enviar documentos'
    },
    { 
      name: 'Recordatorios', 
      href: '/settings/reminders', 
      icon: BellAlertIcon, 
      current: pathname === '/settings/reminders',
      roles: ['ADMIN'],
      description: 'Recordatorios automáticos de pago'
    },
    {
      name: 'Reportes',
      href: '/reports',
      icon: DocumentChartBarIcon,
      current: pathname.startsWith('/reports'),
      roles: ['ADMIN'],
      description: 'Reportes y analítica avanzada',
      children: [
        { name: 'General', href: '/reports', roles: ['ADMIN'] },
        { name: 'Por Producto', href: '/reports/products', roles: ['ADMIN'] },
        { name: 'Por Categoría', href: '/reports/categories', roles: ['ADMIN'] },
        { name: 'Por Vendedor', href: '/reports/users', roles: ['ADMIN'] },
        { name: 'Por Cliente', href: '/reports/customers', roles: ['ADMIN'] },
        { name: 'Métodos de Pago', href: '/reports/payments', roles: ['ADMIN'] },
        { name: 'Inventario y Rotación', href: '/reports/inventory', roles: ['ADMIN'] },
        { name: 'Devoluciones y Cancelaciones', href: '/reports/returns', roles: ['ADMIN'] },
        { name: 'Utilidades/Márgenes', href: '/reports/profit', roles: ['ADMIN'] },
        { name: 'Por Hora/Día/Semana', href: '/reports/times', roles: ['ADMIN'] },
      ]
    },
  ]
  
  // Filtrar navegación según el rol del usuario
  const navigation = allNavigationItems.filter(item => 
    item.roles.includes(userRole)
  )
  
  // 🌐 AGREGAR LINK DE TIENDA EN LÍNEA para planes PRO y superiores
  const proPlans = ['PRO', 'PRO_PLUS', 'ENTERPRISE']
  if (companyInfo && 
      proPlans.includes(companyInfo.plan) && 
      companyInfo.onlineStoreEnabled &&
      ['ADMIN', 'VENDEDOR'].includes(userRole)) {
    navigation.push({
      name: 'Mi Tienda Web',
      href: `/tienda/${companyInfo.slug}`,
      icon: GlobeAltIcon,
      current: false,
      roles: ['ADMIN', 'VENDEDOR'],
      description: 'Ver tu tienda en línea',
      external: true
    })
  }
  
  // 👑 AGREGAR PANEL DE SUPER ADMIN después del filtro (no se filtra por rol)
  if (isSuperAdminForced) {
    navigation.push({
      name: '👑 Admin Planes',
      href: '/admin/subscription-plans',
      icon: ShieldCheckIcon,
      current: pathname === '/admin/subscription-plans',
      roles: ['SUPERADMIN', 'ADMIN'], // Incluir ambos roles
      description: 'Gestionar planes de suscripción del sistema'
    })
  }
  
  return {
    navigation,
    userRole,
    allNavigationItems,
    isSuperAdmin: isSuperAdminForced,
  }
}

// Función helper para verificar si un usuario tiene acceso a una ruta
export function hasAccess(userRole: string, allowedRoles: string[]): boolean {
  // SUPERADMIN tiene acceso a TODAS las rutas
  if (userRole === 'SUPERADMIN') return true;
  
  return allowedRoles.includes(userRole);
}

// Configuración de permisos por rol
export const ROLE_PERMISSIONS = {
  SUPERADMIN: {
    name: 'Super Administrador',
    description: 'Acceso total al sistema y administración de planes',
    color: 'bg-purple-600 text-white',
    sections: ['*'] // Acceso a todo
  },
  ADMIN: {
    name: 'Administrador',
    description: 'Acceso completo al sistema',
    color: 'bg-purple-100 text-purple-800',
    sections: ['dashboard', 'ventas', 'clientes', 'productos', 'inventario', 'cortes', 'configuracion']
  },
  VENDEDOR: {
    name: 'Vendedor',
    description: 'Acceso a ventas y clientes',
    color: 'bg-blue-100 text-blue-800',
    sections: ['dashboard', 'ventas', 'clientes', 'cortes']
  },
  ALMACEN: {
    name: 'Almacén',
    description: 'Acceso a productos e inventario',
    color: 'bg-green-100 text-green-800',
    sections: ['dashboard', 'productos', 'inventario']
  },
  SOLO_LECTURA: {
    name: 'Solo Lectura',
    description: 'Acceso básico de solo lectura',
    color: 'bg-gray-100 text-gray-800',
    sections: ['dashboard']
  }
} as const
