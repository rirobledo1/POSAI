// Sistema de permisos granulares
export type Permission = 
  // Usuarios
  | 'users:read' | 'users:create' | 'users:update' | 'users:delete'
  // Productos  
  | 'products:read' | 'products:create' | 'products:update' | 'products:delete'
  // Inventario
  | 'inventory:read' | 'inventory:update' | 'inventory:movements'
  // Ventas
  | 'sales:read' | 'sales:create' | 'sales:update' | 'sales:delete'
  // Clientes
  | 'customers:read' | 'customers:create' | 'customers:update' | 'customers:delete'
  // Categorías
  | 'categories:read' | 'categories:create' | 'categories:update' | 'categories:delete'
  // Configuración
  | 'settings:read' | 'settings:update'
  // Reportes
  | 'reports:read' | 'reports:export'
  // Auditoría
  | 'audit:read'

export type Role = 'ADMIN' | 'VENDEDOR' | 'ALMACEN' | 'SOLO_LECTURA'

// Permisos por rol
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  ADMIN: [
    // Todos los permisos
    'users:read', 'users:create', 'users:update', 'users:delete',
    'products:read', 'products:create', 'products:update', 'products:delete',
    'inventory:read', 'inventory:update', 'inventory:movements',
    'sales:read', 'sales:create', 'sales:update', 'sales:delete',
    'customers:read', 'customers:create', 'customers:update', 'customers:delete',
    'categories:read', 'categories:create', 'categories:update', 'categories:delete',
    'settings:read', 'settings:update',
    'reports:read', 'reports:export',
    'audit:read'
  ],
  
  VENDEDOR: [
    // Ventas y clientes completo
    'sales:read', 'sales:create', 'sales:update',
    'customers:read', 'customers:create', 'customers:update',
    // Productos solo lectura y actualización de stock
    'products:read', 'inventory:read', 'inventory:update',
    // Categorías solo lectura
    'categories:read',
    // Reportes básicos
    'reports:read'
  ],
  
  ALMACEN: [
    // Productos e inventario completo
    'products:read', 'products:create', 'products:update',
    'inventory:read', 'inventory:update', 'inventory:movements',
    'categories:read', 'categories:create', 'categories:update',
    // Ventas solo lectura
    'sales:read',
    // Reportes básicos
    'reports:read'
  ],
  
  SOLO_LECTURA: [
    // Solo lectura en todo
    'products:read',
    'inventory:read',
    'sales:read',
    'customers:read',
    'categories:read',
    'reports:read'
  ]
}

// Función para verificar si un usuario tiene un permiso específico
export function hasPermission(userRole: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[userRole].includes(permission)
}

// Función para verificar múltiples permisos (AND)
export function hasAllPermissions(userRole: Role, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(userRole, permission))
}

// Función para verificar si tiene al menos uno de los permisos (OR)
export function hasAnyPermission(userRole: Role, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(userRole, permission))
}

// Middleware de verificación de permisos para APIs
export function requirePermissions(permissions: Permission[]) {
  return (userRole: Role) => {
    return hasAllPermissions(userRole, permissions)
  }
}

// Función para obtener todos los permisos de un rol
export function getRolePermissions(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] || []
}

// Función para verificar si puede acceder a una ruta
export function canAccessRoute(userRole: Role, route: string): boolean {
  const routePermissions: Record<string, Permission[]> = {
    '/settings/users': ['users:read'],
    '/settings/company': ['settings:read'],
    '/settings/categories': ['categories:read'],
    '/dashboard': [],
    '/products': ['products:read'],
    '/inventory': ['inventory:read'],
    '/sales': ['sales:read'],
    '/customers': ['customers:read'],
    '/reports': ['reports:read']
  }

  const requiredPermissions = routePermissions[route]
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return true // Ruta pública
  }

  return hasAllPermissions(userRole, requiredPermissions)
}

// Hook para usar permisos en componentes React
export function usePermissions(userRole: Role) {
  return {
    hasPermission: (permission: Permission) => hasPermission(userRole, permission),
    hasAllPermissions: (permissions: Permission[]) => hasAllPermissions(userRole, permissions),
    hasAnyPermission: (permissions: Permission[]) => hasAnyPermission(userRole, permissions),
    canAccessRoute: (route: string) => canAccessRoute(userRole, route),
    getAllPermissions: () => getRolePermissions(userRole)
  }
}
