// src/lib/rate-limit/login-rate-limit.ts
import { Pool } from 'pg'
import crypto from 'crypto'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

/**
 * Configuración de rate limiting
 */
const RATE_LIMIT_CONFIG = {
  maxAttempts: 5, // Máximo de intentos fallidos
  windowMinutes: 15, // Ventana de tiempo en minutos
  blockDurationMinutes: 30, // Duración del bloqueo
}

/**
 * Registrar un intento de login
 */
export async function recordLoginAttempt(
  ipAddress: string,
  email: string | null,
  success: boolean,
  userAgent: string | null
): Promise<void> {
  const id = crypto.randomBytes(15).toString('hex')
  
  try {
    await pool.query(
      `INSERT INTO login_attempts (id, ip_address, email, success, attempted_at, user_agent)
       VALUES ($1, $2, $3, $4, NOW(), $5)`,
      [id, ipAddress, email, success, userAgent]
    )
    
    console.log(`📝 Intento de login registrado: ${email || 'unknown'} desde ${ipAddress} - ${success ? '✅ Éxito' : '❌ Fallo'}`)
  } catch (error) {
    console.error('❌ Error al registrar intento de login:', error)
  }
}

/**
 * Verificar si una IP está bloqueada por rate limiting
 */
export async function checkRateLimit(ipAddress: string): Promise<{
  blocked: boolean
  remainingAttempts: number
  resetAt?: Date
}> {
  try {
    const windowStart = new Date()
    windowStart.setMinutes(windowStart.getMinutes() - RATE_LIMIT_CONFIG.windowMinutes)

    // Contar intentos fallidos en la ventana de tiempo
    const result = await pool.query(
      `SELECT COUNT(*) as failed_attempts
       FROM login_attempts
       WHERE ip_address = $1
         AND success = false
         AND attempted_at > $2`,
      [ipAddress, windowStart]
    )

    const failedAttempts = parseInt(result.rows[0]?.failed_attempts || '0')
    const remainingAttempts = Math.max(0, RATE_LIMIT_CONFIG.maxAttempts - failedAttempts)

    if (failedAttempts >= RATE_LIMIT_CONFIG.maxAttempts) {
      // IP bloqueada
      const resetAt = new Date()
      resetAt.setMinutes(resetAt.getMinutes() + RATE_LIMIT_CONFIG.blockDurationMinutes)

      console.log(`🚫 IP bloqueada por rate limiting: ${ipAddress} (${failedAttempts} intentos fallidos)`)

      return {
        blocked: true,
        remainingAttempts: 0,
        resetAt
      }
    }

    return {
      blocked: false,
      remainingAttempts
    }
  } catch (error) {
    console.error('❌ Error al verificar rate limit:', error)
    // En caso de error, no bloquear
    return {
      blocked: false,
      remainingAttempts: RATE_LIMIT_CONFIG.maxAttempts
    }
  }
}

/**
 * Obtener el número de intentos fallidos recientes
 */
export async function getFailedAttemptsCount(ipAddress: string): Promise<number> {
  try {
    const windowStart = new Date()
    windowStart.setMinutes(windowStart.getMinutes() - RATE_LIMIT_CONFIG.windowMinutes)

    const result = await pool.query(
      `SELECT COUNT(*) as count
       FROM login_attempts
       WHERE ip_address = $1
         AND success = false
         AND attempted_at > $2`,
      [ipAddress, windowStart]
    )

    return parseInt(result.rows[0]?.count || '0')
  } catch (error) {
    console.error('❌ Error al obtener intentos fallidos:', error)
    return 0
  }
}

/**
 * Limpiar intentos antiguos (llamar periódicamente para mantenimiento)
 */
export async function cleanupOldAttempts(): Promise<void> {
  try {
    const cutoff = new Date()
    cutoff.setHours(cutoff.getHours() - 24)

    const result = await pool.query(
      `DELETE FROM login_attempts WHERE attempted_at < $1`,
      [cutoff]
    )

    console.log(`🧹 Limpieza de intentos antiguos: ${result.rowCount} registros eliminados`)
  } catch (error) {
    console.error('❌ Error en limpieza de intentos:', error)
  }
}

/**
 * Obtener IP del cliente desde headers de Next.js
 */
export function getClientIP(request: Request): string {
  const headers = request.headers
  
  // Intentar obtener IP real detrás de proxies
  const forwardedFor = headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }
  
  const realIP = headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }
  
  // Fallback a IP directa (puede ser del proxy en producción)
  return 'unknown'
}
