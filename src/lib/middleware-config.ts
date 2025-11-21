// 🎯 CONFIGURACIÓN CENTRALIZADA DE ROLES Y PERMISOS
// src/lib/middleware-config.ts

import { Role } from '@prisma/client'

// 🎯 Configuración detallada por rol
export const ROLE_CONFIG = {
  ADMIN: {
    name: 'Administrador',
    homeRedirect: '/dashboard',
    color: 'red',
    allowedPaths: [
      '/dashboard',
      '/pos', 
      '/inventory',
      '/products',
      '/customers',
      '/reports',
      '/ventas',
      '/settings',
      '/usuarios',
      '/configuracion'
    ],
    blockedPaths: [],
    permissions: [
      'view_all_sales',
      'manage_users',
      'manage_settings',
      'view_financial_data',
      'manage_inventory',
      'manage_customers',
      'generate_reports'
    ],
    description: 'Acceso completo al sistema'
  },
  VENDEDOR: {
    name: 'Vendedor',
    homeRedirect: '/pos',
    color: 'yellow',
    allowedPaths: [
      '/dashboard',
      '/pos',
      '/customers',
      '/reports/sales',
      '/ventas'
    ],
    blockedPaths: [
      '/settings',
      '/inventory/add',
      '/inventory/edit',
      '/inventory/delete',
      '/users',
      '/products/edit',
      '/products/delete'
    ],
    permissions: [
      'view_own_sales',
      'create_sales',
      'view_customers',
      'manage_customers'
    ],
    description: 'Acceso a ventas y gestión de clientes'
  },
  ALMACEN: {
    name: 'Almacén',
    homeRedirect: '/inventory',
    color: 'blue',
    allowedPaths: [
      '/dashboard',
      '/inventory',
      '/products',
      '/reports/inventory',
      '/reports'
    ],
    blockedPaths: [
      '/pos',
      '/customers',
      '/settings',
      '/ventas',
      '/users'
    ],
    permissions: [
      'view_inventory',
      'manage_inventory',
      'manage_products',
      'view_inventory_reports'
    ],
    description: 'Gestión completa de inventario y productos'
  },
  SOLO_LECTURA: {
    name: 'Solo Lectura',
    homeRedirect: '/reports',
    color: 'green',
    allowedPaths: [
      '/dashboard',
      '/reports'
    ],
    blockedPaths: [
      '/pos',
      '/inventory/add',
      '/inventory/edit',
      '/inventory/delete',
      '/customers/add',
      '/customers/edit',
      '/customers/delete',
      '/products/add',
      '/products/edit',
      '/products/delete',
      '/settings',
      '/ventas',
      '/users'
    ],
    permissions: [
      'view_reports',
      'view_dashboard'
    ],
    description: 'Solo consulta de información y reportes'
  }
} as const

// 🎯 Rutas públicas que no requieren autenticación
export const PUBLIC_ROUTES = [
  '/login',
  '/register',
  '/api/auth',
  '/api/health',
  '/favicon.ico',
  '/_next',
  '/public',
  '/manifest.json',
  '/sw.js'
]

// 🎯 Rutas que requieren autenticación pero no verificación de roles
export const AUTH_ONLY_ROUTES = [
  '/api/user/profile',
  '/api/dashboard/stats'
]

// 🎯 Configuración de logging
export const LOGGING_CONFIG = {
  enabled: process.env.NODE_ENV === 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
  logAccessAttempts: true,
  logBlockedAttempts: true,
  logPerformance: true,
  performanceThreshold: 10 // ms
}

// 🎯 Configuración de seguridad
export const SECURITY_CONFIG = {
  maxRequestsPerMinute: 120,
  enableSecurityHeaders: true,
  enableRateLimiting: process.env.NODE_ENV === 'production',
  csrfProtection: true
}

// 🎯 Utilidades para verificación de permisos
export const PermissionUtils = {
  // Verificar si un rol puede acceder a una ruta
  canAccessPath: (role: Role, pathname: string): boolean => {
    const config = ROLE_CONFIG[role]
    if (!config) return false

    // Verificar rutas bloqueadas específicamente
    if (config.blockedPaths.some(blocked => pathname.startsWith(blocked))) {
      return false
    }

    // Verificar rutas permitidas
    return config.allowedPaths.some(allowed => pathname.startsWith(allowed))
  },

  // Obtener la ruta de redirección para un rol
  getHomeRedirect: (role: Role): string => {
    return ROLE_CONFIG[role]?.homeRedirect || '/dashboard'
  },

  // Verificar si un rol tiene un permiso específico
  hasPermission: (role: Role, permission: string): boolean => {
    const config = ROLE_CONFIG[role]
    return config?.permissions.includes(permission) || false
  },

  // Obtener información completa de un rol
  getRoleInfo: (role: Role) => {
    return ROLE_CONFIG[role] || ROLE_CONFIG.SOLO_LECTURA
  },

  // Verificar si una ruta es pública
  isPublicRoute: (pathname: string): boolean => {
    return PUBLIC_ROUTES.some(route => pathname.startsWith(route))
  },

  // Verificar si una ruta solo requiere autenticación
  isAuthOnlyRoute: (pathname: string): boolean => {
    return AUTH_ONLY_ROUTES.some(route => pathname.startsWith(route))
  }
}

// 🎯 Tipos TypeScript
export type RolePermissions = keyof typeof ROLE_CONFIG
export type Permission = string
export type RouteConfig = typeof ROLE_CONFIG[keyof typeof ROLE_CONFIG]

export default ROLE_CONFIG