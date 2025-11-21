// Utilidades para encriptar y desencriptar credenciales de email
import crypto from 'crypto'

// Llave de encriptación - debe estar en variables de entorno en producción
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'ferreai-default-key-change-in-production-32bytes'
const ALGORITHM = 'aes-256-cbc'
const IV_LENGTH = 16

/**
 * Encripta texto
 */
export function encrypt(text: string): string {
  if (!text) return ''
  
  try {
    // Asegurar que la key tenga 32 bytes
    const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32))
    const iv = crypto.randomBytes(IV_LENGTH)
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
    
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    // Retornar IV + texto encriptado
    return iv.toString('hex') + ':' + encrypted
  } catch (error) {
    console.error('Error encriptando:', error)
    throw new Error('Error al encriptar credenciales')
  }
}

/**
 * Desencripta texto
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) return ''
  
  try {
    const parts = encryptedText.split(':')
    if (parts.length !== 2) {
      throw new Error('Formato de texto encriptado inválido')
    }
    
    const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32))
    const iv = Buffer.from(parts[0], 'hex')
    const encrypted = parts[1]
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  } catch (error) {
    console.error('Error desencriptando:', error)
    throw new Error('Error al desencriptar credenciales')
  }
}

/**
 * Valida si un texto está encriptado correctamente
 */
export function isEncrypted(text: string): boolean {
  if (!text) return false
  const parts = text.split(':')
  return parts.length === 2 && parts[0].length === IV_LENGTH * 2
}
