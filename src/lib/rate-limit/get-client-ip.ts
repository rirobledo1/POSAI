// src/lib/rate-limit/get-client-ip.ts

/**
 * Obtener la IP real del cliente considerando proxies y load balancers
 */
export function getClientIp(request: Request): string {
  // Intentar obtener IP de diferentes headers
  const headers = request.headers

  // Cloudflare
  const cfConnectingIp = headers.get('cf-connecting-ip')
  if (cfConnectingIp) return cfConnectingIp

  // Headers comunes de proxies
  const xForwardedFor = headers.get('x-forwarded-for')
  if (xForwardedFor) {
    // x-forwarded-for puede contener múltiples IPs separadas por comas
    // La primera es la IP del cliente original
    return xForwardedFor.split(',')[0].trim()
  }

  const xRealIp = headers.get('x-real-ip')
  if (xRealIp) return xRealIp

  // Headers de otros load balancers
  const forwardedFor = headers.get('forwarded')
  if (forwardedFor) {
    const match = forwardedFor.match(/for=([^;,\s]+)/)
    if (match) return match[1]
  }

  // Si no hay headers de proxy, usar una IP placeholder
  // En producción, esto debería tener la IP real del servidor
  return '127.0.0.1'
}

/**
 * Normalizar IP para rate limiting (remover puerto si existe)
 */
export function normalizeIp(ip: string): string {
  // Remover puerto si existe (e.g., "192.168.1.1:5432" -> "192.168.1.1")
  return ip.split(':')[0]
}

/**
 * Validar si una IP es válida
 */
export function isValidIp(ip: string): boolean {
  // IPv4
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/
  if (ipv4Regex.test(ip)) {
    const parts = ip.split('.')
    return parts.every(part => {
      const num = parseInt(part, 10)
      return num >= 0 && num <= 255
    })
  }

  // IPv6 (simplificado)
  const ipv6Regex = /^([0-9a-fA-F]{0,4}:){7}[0-9a-fA-F]{0,4}$/
  return ipv6Regex.test(ip)
}
