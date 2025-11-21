// 🛡️ MIDDLEWARE UNIFICADO Y ULTRA OPTIMIZADO
// middleware.ts - Control de acceso centralizado con logging y performance

import { withAuth } from 'next-auth/middleware'
import { NextResponse, NextRequest } from 'next/server'
import { Role } from '@prisma/client'

// 🎯 Configuración optimizada importada
const ROLE_CONFIG = {
  ADMIN: {
    homeRedirect: '/dashboard',
    allowedPaths: ['/dashboard', '/pos', '/inventory', '/customers', '/reports', '/ventas', '/settings', '/products', '/usuarios', '/configuracion'],
    blockedPaths: [],
    description: 'Acceso completo al sistema'
  },
  VENDEDOR: {
    homeRedirect: '/pos',
    allowedPaths: ['/dashboard', '/pos', '/customers', '/reports/sales', '/ventas'],
    blockedPaths: ['/settings', '/inventory/add', '/inventory/edit', '/users'],
    description: 'Acceso a ventas y clientes'
  },
  ALMACEN: {
    homeRedirect: '/inventory',
    allowedPaths: ['/dashboard', '/inventory', '/products', '/reports/inventory', '/reports'],
    blockedPaths: ['/pos', '/customers', '/settings', '/ventas'],
    description: 'Acceso a inventario y productos'
  },
  SOLO_LECTURA: {
    homeRedirect: '/reports',
    allowedPaths: ['/dashboard', '/reports'],
    blockedPaths: ['/pos', '/inventory/add', '/inventory/edit', '/customers/add', '/settings', '/ventas'],
    description: 'Solo consulta de información'
  }
} as const

// 🎯 Performance cache optimizado
const routeCache = new Map<string, { allowed: boolean, redirectTo?: string, expires: number }>()
const CACHE_TTL = 30000 // 30 segundos

// 🎯 Rate limiting simple
const requestCounts = new Map<string, { count: number, resetTime: number }>()
const RATE_LIMIT = 60 // requests per minute
const RATE_WINDOW = 60000 // 1 minute

// 🎯 Función de verificación ultra rápida
const checkAccess = (pathname: string, role: Role): { allowed: boolean, redirectTo?: string } => {
  // Cache check
  const cacheKey = `${pathname}:${role}`
  const cached = routeCache.get(cacheKey)
  
  if (cached && Date.now() < cached.expires) {
    return { allowed: cached.allowed, redirectTo: cached.redirectTo }
  }

  // Lógica de acceso
  const config = ROLE_CONFIG[role] || ROLE_CONFIG.SOLO_LECTURA
  let result: { allowed: boolean, redirectTo?: string }

  // Raíz - redirigir a home del rol
  if (pathname === '/') {
    result = { allowed: false, redirectTo: config.homeRedirect }
  }
  // Verificar rutas bloqueadas
  else if (config.blockedPaths.some(blocked => pathname.startsWith(blocked))) {
    result = { allowed: false, redirectTo: config.homeRedirect }
  }
  // Verificar rutas permitidas
  else if (config.allowedPaths.some(allowed => pathname.startsWith(allowed))) {
    result = { allowed: true }
  }
  // Default: denegar y redirigir a home
  else {
    result = { allowed: false, redirectTo: config.homeRedirect }
  }

  // Cache result
  routeCache.set(cacheKey, { ...result, expires: Date.now() + CACHE_TTL })
  
  return result
}

// 🎯 Rate limiting check
const checkRateLimit = (identifier: string): boolean => {
  const now = Date.now()
  const current = requestCounts.get(identifier)
  
  if (!current || now > current.resetTime) {
    requestCounts.set(identifier, { count: 1, resetTime: now + RATE_WINDOW })
    return true
  }
  
  if (current.count >= RATE_LIMIT) {
    return false
  }
  
  current.count++
  return true
}

// 🎯 Logger optimizado
const logAccess = (pathname: string, role: Role, action: 'ALLOWED' | 'BLOCKED' | 'REDIRECT', details?: string) => {
  if (process.env.NODE_ENV === 'development') {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0]
    console.log(`🔐 [${timestamp}] ${action}: ${pathname} (${role})${details ? ` - ${details}` : ''}`)
  }
}

// 🎯 Middleware principal
export default withAuth(
  function middleware(req: NextRequest) {
    const startTime = performance.now()
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    // Rutas públicas - bypass completo
    const publicPaths = ['/login', '/register', '/api/auth', '/favicon.ico', '/_next', '/public']
    if (publicPaths.some(path => pathname.startsWith(path))) {
      return NextResponse.next()
    }

    // Rate limiting
    const clientId = req.ip || req.headers.get('x-forwarded-for') || 'unknown'
    if (!checkRateLimit(clientId)) {
      logAccess(pathname, 'UNKNOWN' as Role, 'BLOCKED', 'Rate limit exceeded')
      return NextResponse.json(
        { error: 'Demasiadas solicitudes' }, 
        { status: 429 }
      )
    }

    // Verificar token
    if (!token) {
      logAccess(pathname, 'ANONYMOUS' as Role, 'REDIRECT', 'No authenticated')
      return NextResponse.redirect(new URL('/login', req.url))
    }

    const userRole = (token.role as Role) || 'SOLO_LECTURA'
    
    // Verificar acceso
    const { allowed, redirectTo } = checkAccess(pathname, userRole)

    if (!allowed && redirectTo) {
      logAccess(pathname, userRole, 'REDIRECT', `-> ${redirectTo}`)
      return NextResponse.redirect(new URL(redirectTo, req.url))
    }

    if (!allowed) {
      logAccess(pathname, userRole, 'BLOCKED', 'Access denied')
      return NextResponse.redirect(new URL(ROLE_CONFIG[userRole].homeRedirect, req.url))
    }

    // Performance logging
    const processingTime = performance.now() - startTime
    if (processingTime > 5) {
      logAccess(pathname, userRole, 'ALLOWED', `${processingTime.toFixed(1)}ms`)
    }

    // Headers de seguridad
    const response = NextResponse.next()
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    
    // Headers de desarrollo
    if (process.env.NODE_ENV === 'development') {
      response.headers.set('X-User-Role', userRole)
      response.headers.set('X-Processing-Time', `${processingTime.toFixed(2)}ms`)
    }

    return response
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/login'
    }
  }
)

// 🎯 Configuración de matching optimizada
export const config = {
  matcher: [
    /*
     * Coincidir con todas las rutas excepto:
     * - api/auth (autenticación)
     * - _next/static (archivos estáticos)
     * - _next/image (optimización de imágenes)  
     * - favicon.ico
     * - archivos con extensión
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
}

// 🎯 Cleanup cache periódicamente
setInterval(() => {
  const now = Date.now()
  
  // Limpiar route cache expirado
  for (const [key, value] of routeCache.entries()) {
    if (now >= value.expires) {
      routeCache.delete(key)
    }
  }
  
  // Limpiar rate limiting expirado
  for (const [key, value] of requestCounts.entries()) {
    if (now > value.resetTime) {
      requestCounts.delete(key)
    }
  }
}, 60000) // Cada minuto