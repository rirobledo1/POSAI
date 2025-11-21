import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hasPermission, Permission, Role } from '@/lib/permissions'

interface AuthCheckOptions {
  requiredPermissions?: Permission[]
  allowedRoles?: Role[]
  requireAuth?: boolean
}

export async function checkAuth(
  request: NextRequest,
  options: AuthCheckOptions = {}
) {
  const {
    requiredPermissions = [],
    allowedRoles = [],
    requireAuth = true
  } = options

  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions)
    
    if (requireAuth && !session?.user) {
      return NextResponse.json(
        { error: 'No autorizado. Debe iniciar sesión.' },
        { status: 401 }
      )
    }

    if (!session?.user) {
      return null // No autenticado pero no requerido
    }

    const userRole = session.user.role as Role

    // Verificar roles permitidos
    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
      return NextResponse.json(
        { 
          error: `Acceso denegado. Se requiere uno de los siguientes roles: ${allowedRoles.join(', ')}`,
          userRole,
          allowedRoles
        },
        { status: 403 }
      )
    }

    // Verificar permisos específicos
    if (requiredPermissions.length > 0) {
      const hasAllPerms = requiredPermissions.every(permission => 
        hasPermission(userRole, permission)
      )

      if (!hasAllPerms) {
        return NextResponse.json(
          { 
            error: `Permisos insuficientes. Se requieren: ${requiredPermissions.join(', ')}`,
            userRole,
            requiredPermissions,
            userPermissions: []
          },
          { status: 403 }
        )
      }
    }

    // Obtener información del cliente para auditoría
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     '127.0.0.1'
    
    const userAgent = request.headers.get('user-agent') || 'Unknown'

    return {
      user: session.user,
      ipAddress,
      userAgent
    }
  } catch (error) {
    console.error('Error in auth check:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor durante la autenticación' },
      { status: 500 }
    )
  }
}

// Wrapper para APIs que requieren autenticación
export function withAuth(
  handler: (req: NextRequest, authInfo: any, ...args: any[]) => Promise<NextResponse>,
  options: AuthCheckOptions = {}
) {
  return async (req: NextRequest, ...args: any[]) => {
    const authResult = await checkAuth(req, options)
    
    if (authResult instanceof NextResponse) {
      return authResult // Error de autenticación/autorización
    }

    return handler(req, authResult, ...args)
  }
}

// Decorador para rutas que requieren permisos específicos
export function requirePermissions(permissions: Permission[]) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = async function(req: NextRequest, ...args: any[]) {
      const authResult = await checkAuth(req, { requiredPermissions: permissions })
      
      if (authResult instanceof NextResponse) {
        return authResult
      }

      return originalMethod.call(this, req, authResult, ...args)
    }

    return descriptor
  }
}

// Middleware específico para diferentes tipos de operaciones
export const authMiddleware = {
  // Solo admin
  adminOnly: (req: NextRequest) => checkAuth(req, { 
    allowedRoles: ['ADMIN'] 
  }),

  // Admin y personal de almacén
  inventoryAccess: (req: NextRequest) => checkAuth(req, { 
    allowedRoles: ['ADMIN', 'ALMACEN'] 
  }),

  // Admin y vendedores
  salesAccess: (req: NextRequest) => checkAuth(req, { 
    allowedRoles: ['ADMIN', 'VENDEDOR'] 
  }),

  // Cualquier usuario autenticado
  authenticated: (req: NextRequest) => checkAuth(req, { 
    requireAuth: true 
  }),

  // Lectura general (todos los roles)
  readAccess: (req: NextRequest) => checkAuth(req, { 
    requiredPermissions: [] 
  })
}

// Función para registrar actividad de auditoría
export async function logActivity(
  authInfo: any,
  action: string,
  entityType: string,
  entityId: string,
  details?: any
) {
  try {
    if (!authInfo?.user) return

    // Importar Prisma dinámicamente para evitar problemas de dependencias circulares
    const { prisma } = await import('@/lib/prisma')

    await prisma.auditLog.create({
      data: {
        action,
        entityType,
        entityId,
        userId: authInfo.user.id,
        details: details || null,
        ipAddress: authInfo.ipAddress,
        userAgent: authInfo.userAgent
      }
    })
  } catch (error) {
    console.error('Error logging activity:', error)
    // No fallar la operación principal por errores de auditoría
  }
}
