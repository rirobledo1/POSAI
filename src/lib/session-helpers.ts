/**
 * 🔒 Session Helpers - Multi-Tenant
 * 
 * Helpers para trabajar con sesiones y aislamiento de datos por compañía
 */

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * Obtener la sesión del servidor
 */
export async function getSession() {
  return await getServerSession(authOptions)
}

/**
 * Obtener el companyId de la sesión actual
 * @throws Error si no hay sesión o no hay companyId
 */
export async function getCompanyIdFromSession(): Promise<string> {
  const session = await getSession()
  
  if (!session?.user) {
    throw new Error('No hay sesión activa')
  }
  
  if (!session.user.companyId) {
    throw new Error('Usuario sin compañía asignada')
  }
  
  return session.user.companyId
}

/**
 * Obtener datos completos del usuario de la sesión
 */
export async function getCurrentUser() {
  const session = await getSession()
  
  if (!session?.user) {
    return null
  }
  
  return session.user
}

/**
 * Verificar si el usuario tiene un rol específico
 */
export async function hasRole(role: string): Promise<boolean> {
  const session = await getSession()
  return session?.user?.role === role
}

/**
 * Verificar si el usuario es ADMIN
 */
export async function isAdmin(): Promise<boolean> {
  return await hasRole('ADMIN')
}

/**
 * Verificar que un recurso pertenece a la compañía del usuario
 * @throws Error si el recurso no pertenece a la compañía
 */
export async function ensureCompanyOwnership(resourceCompanyId: string) {
  const userCompanyId = await getCompanyIdFromSession()
  
  if (resourceCompanyId !== userCompanyId) {
    throw new Error('Acceso denegado: Este recurso no pertenece a tu compañía')
  }
}

/**
 * Crear objeto where para Prisma con filtro de companyId
 */
export async function withCompanyFilter<T extends Record<string, any>>(
  where?: T
): Promise<T & { companyId: string }> {
  const companyId = await getCompanyIdFromSession()
  
  return {
    ...where,
    companyId,
  } as T & { companyId: string }
}
