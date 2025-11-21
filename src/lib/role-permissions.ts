// src/lib/role-permissions.ts
export const ROLE_PERMISSIONS = {
  SUPERADMIN: {
    name: 'Super Administrador',
    description: 'Acceso total al sistema y administración de planes',
    permissions: ['*'], // Todos los permisos
    canAccessSubscriptionAdmin: true,
    canEditPlans: true,
    canViewAllCompanies: true,
    color: 'purple'
  },
  ADMIN: {
    name: 'Administrador',
    description: 'Acceso completo a la empresa',
    permissions: ['read', 'write', 'delete', 'manage_users', 'manage_settings'],
    canAccessSubscriptionAdmin: false,
    canEditPlans: false,
    color: 'blue'
  },
  VENDEDOR: {
    name: 'Vendedor',
    description: 'Acceso a ventas y clientes',
    permissions: ['read', 'write_sales', 'read_products', 'read_customers', 'pos'],
    canAccessSubscriptionAdmin: false,
    color: 'green'
  },
  ALMACEN: {
    name: 'Almacén',
    description: 'Gestión de inventario y productos',
    permissions: ['read', 'write_products', 'manage_inventory', 'stock_transfers'],
    canAccessSubscriptionAdmin: false,
    color: 'orange'
  },
  SOLO_LECTURA: {
    name: 'Solo Lectura',
    description: 'Visualización sin modificaciones',
    permissions: ['read'],
    canAccessSubscriptionAdmin: false,
    color: 'gray'
  }
} as const;

export type RoleType = keyof typeof ROLE_PERMISSIONS;

/**
 * Verifica si un usuario es super administrador
 */
export function isSuperAdmin(role: string): boolean {
  return role === 'SUPERADMIN';
}

/**
 * Verifica si un rol puede acceder a la administración de suscripciones
 */
export function canAccessSubscriptionAdmin(role: string): boolean {
  const rolePerms = ROLE_PERMISSIONS[role as RoleType];
  return rolePerms?.canAccessSubscriptionAdmin || false;
}

/**
 * Verifica si un rol puede editar planes de suscripción
 */
export function canEditPlans(role: string): boolean {
  const rolePerms = ROLE_PERMISSIONS[role as RoleType];
  return rolePerms?.canEditPlans || false;
}

/**
 * Verifica si un rol tiene un permiso específico
 */
export function hasPermission(role: string, permission: string): boolean {
  const rolePerms = ROLE_PERMISSIONS[role as RoleType];
  if (!rolePerms) return false;
  
  // SUPERADMIN tiene todos los permisos
  if (rolePerms.permissions.includes('*')) return true;
  
  return rolePerms.permissions.includes(permission);
}

/**
 * Obtiene información de un rol
 */
export function getRoleInfo(role: string) {
  return ROLE_PERMISSIONS[role as RoleType] || ROLE_PERMISSIONS.SOLO_LECTURA;
}
