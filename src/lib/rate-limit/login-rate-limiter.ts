// src/lib/rate-limit/login-rate-limiter.ts
import { prisma } from '@/lib/prisma'

interface RateLimitResult {
  allowed: boolean
  remainingAttempts: number
  resetAt?: Date
  message?: string
}

const MAX_ATTEMPTS = 5
const WINDOW_MINUTES = 15

/**
 * Verificar si un IP o identificador puede intentar login
 */
export async function checkLoginRateLimit(
  identifier: string, // IP o email
  type: 'ip' | 'email' = 'ip'
): Promise<RateLimitResult> {
  const now = new Date()
  const windowStart = new Date(now.getTime() - WINDOW_MINUTES * 60 * 1000)

  try {
    // Contar intentos fallidos en la ventana de tiempo
    const attempts = await prisma.loginAttempt.count({
      where: {
        identifier,
        type,
        success: false,
        attemptedAt: {
          gte: windowStart
        }
      }
    })

    if (attempts >= MAX_ATTEMPTS) {
      // Buscar el intento más antiguo para calcular cuándo se resetea
      const oldestAttempt = await prisma.loginAttempt.findFirst({
        where: {
          identifier,
          type,
          success: false,
          attemptedAt: {
            gte: windowStart
          }
        },
        orderBy: {
          attemptedAt: 'asc'
        }
      })

      const resetAt = oldestAttempt
        ? new Date(oldestAttempt.attemptedAt.getTime() + WINDOW_MINUTES * 60 * 1000)
        : new Date(now.getTime() + WINDOW_MINUTES * 60 * 1000)

      const minutesLeft = Math.ceil((resetAt.getTime() - now.getTime()) / 60000)

      return {
        allowed: false,
        remainingAttempts: 0,
        resetAt,
        message: `Demasiados intentos fallidos. Por favor, intenta de nuevo en ${minutesLeft} minutos.`
      }
    }

    return {
      allowed: true,
      remainingAttempts: MAX_ATTEMPTS - attempts
    }
  } catch (error) {
    console.error('Error checking rate limit:', error)
    // En caso de error, permitir el intento (fail open)
    return {
      allowed: true,
      remainingAttempts: MAX_ATTEMPTS
    }
  }
}

/**
 * Registrar un intento de login
 */
export async function recordLoginAttempt(
  identifier: string,
  type: 'ip' | 'email',
  success: boolean,
  userId?: string,
  userAgent?: string
): Promise<void> {
  try {
    await prisma.loginAttempt.create({
      data: {
        identifier,
        type,
        success,
        userId,
        userAgent,
        attemptedAt: new Date()
      }
    })

    // Limpiar intentos antiguos (más de 24 horas)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
    await prisma.loginAttempt.deleteMany({
      where: {
        attemptedAt: {
          lt: yesterday
        }
      }
    })
  } catch (error) {
    console.error('Error recording login attempt:', error)
    // No lanzar error, solo logear
  }
}

/**
 * Limpiar intentos fallidos de un usuario después de login exitoso
 */
export async function clearLoginAttempts(identifier: string): Promise<void> {
  try {
    await prisma.loginAttempt.deleteMany({
      where: {
        identifier,
        success: false
      }
    })
  } catch (error) {
    console.error('Error clearing login attempts:', error)
  }
}

/**
 * Obtener información de rate limit para mostrar al usuario
 */
export async function getRateLimitInfo(identifier: string, type: 'ip' | 'email' = 'ip') {
  const now = new Date()
  const windowStart = new Date(now.getTime() - WINDOW_MINUTES * 60 * 1000)

  try {
    const attempts = await prisma.loginAttempt.findMany({
      where: {
        identifier,
        type,
        success: false,
        attemptedAt: {
          gte: windowStart
        }
      },
      orderBy: {
        attemptedAt: 'desc'
      }
    })

    return {
      totalAttempts: attempts.length,
      remainingAttempts: Math.max(0, MAX_ATTEMPTS - attempts.length),
      isLocked: attempts.length >= MAX_ATTEMPTS,
      attempts: attempts.map(a => ({
        attemptedAt: a.attemptedAt,
        userAgent: a.userAgent
      }))
    }
  } catch (error) {
    console.error('Error getting rate limit info:', error)
    return null
  }
}
