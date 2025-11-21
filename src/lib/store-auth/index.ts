// src/lib/store-auth/index.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

interface TokenPayload {
  customerId: string
  email: string
  companyId: string
  exp: number
}

interface AuthResult {
  success: boolean
  customer?: {
    id: string
    email: string
    name: string
    phone: string | null
    companyId: string
  }
  error?: string
}

/**
 * Valida el token de autenticación del cliente de tienda
 */
export async function validateStoreCustomerToken(
  req: NextRequest,
  companyId: string
): Promise<AuthResult> {
  try {
    // Obtener token del header Authorization
    const authHeader = req.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        success: false,
        error: 'Token no proporcionado'
      }
    }

    const token = authHeader.substring(7) // Remover "Bearer "

    // Decodificar token
    let payload: TokenPayload
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8')
      payload = JSON.parse(decoded)
    } catch {
      return {
        success: false,
        error: 'Token inválido'
      }
    }

    // Verificar expiración
    if (payload.exp < Date.now()) {
      return {
        success: false,
        error: 'Token expirado'
      }
    }

    // Verificar que el token es para esta empresa
    if (payload.companyId !== companyId) {
      return {
        success: false,
        error: 'Token no válido para esta tienda'
      }
    }

    // Buscar el cliente
    const customer = await prisma.storeCustomer.findUnique({
      where: { id: payload.customerId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        companyId: true
      }
    })

    if (!customer) {
      return {
        success: false,
        error: 'Cliente no encontrado'
      }
    }

    // Verificar que el cliente pertenece a la empresa
    if (customer.companyId !== companyId) {
      return {
        success: false,
        error: 'Acceso no autorizado'
      }
    }

    return {
      success: true,
      customer
    }

  } catch (error) {
    console.error('Error validando token:', error)
    return {
      success: false,
      error: 'Error de autenticación'
    }
  }
}

/**
 * Genera un token para el cliente
 */
export function generateStoreCustomerToken(
  customerId: string,
  email: string,
  companyId: string,
  expiresInDays: number = 7
): string {
  const payload: TokenPayload = {
    customerId,
    email,
    companyId,
    exp: Date.now() + (expiresInDays * 24 * 60 * 60 * 1000)
  }

  return Buffer.from(JSON.stringify(payload)).toString('base64')
}
