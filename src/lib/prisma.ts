import { PrismaClient } from '@prisma/client'

// Declarar el tipo global
declare global {
  var prisma: PrismaClient | undefined
}

// 🎯 Configuración de logging según ambiente
const logConfig = process.env.NODE_ENV === 'development'
  ? [
    { emit: 'event', level: 'query' },
    { emit: 'event', level: 'error' },
    { emit: 'event', level: 'warn' },
    { emit: 'stdout', level: 'info' },
  ]
  : [
    { emit: 'event', level: 'error' },
    { emit: 'event', level: 'warn' },
  ]

// 🎯 Threshold para queries lentas (en milisegundos)
const SLOW_QUERY_THRESHOLD = parseInt(process.env.SLOW_QUERY_THRESHOLD || '100')

// 🎯 Crear instancia de Prisma con logging avanzado
export const prisma = global.prisma || new PrismaClient({
  log: logConfig as any,
})

// 🎯 Event listeners para logging detallado
if (process.env.NODE_ENV === 'development') {
  // Logging de queries con métricas de rendimiento
  prisma.$on('query' as never, (e: any) => {
    const duration = e.duration
    const query = e.query
    const params = e.params

    // Detectar queries lentas
    if (duration > SLOW_QUERY_THRESHOLD) {
      console.warn(`🐌 SLOW QUERY (${duration}ms):`, {
        query: query.substring(0, 200) + (query.length > 200 ? '...' : ''),
        params: params,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      })
    } else {
      // Log normal de queries (solo en modo verbose)
      if (process.env.PRISMA_VERBOSE === 'true') {
        console.log(`⚡ Query (${duration}ms):`, {
          query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
          duration: `${duration}ms`
        })
      }
    }
  })

  // Logging de errores
  prisma.$on('error' as never, (e: any) => {
    console.error('❌ Prisma Error:', {
      message: e.message,
      target: e.target,
      timestamp: new Date().toISOString()
    })
  })

  // Logging de warnings
  prisma.$on('warn' as never, (e: any) => {
    console.warn('⚠️ Prisma Warning:', {
      message: e.message,
      timestamp: new Date().toISOString()
    })
  })
}

// 🎯 Prevenir múltiples instancias en desarrollo
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma
}

// 🎯 Asegurar desconexión limpia
if (typeof window === 'undefined') {
  process.on('beforeExit', async () => {
    console.log('🔌 Disconnecting Prisma...')
    await prisma.$disconnect()
  })

  // Manejar señales de terminación
  process.on('SIGINT', async () => {
    console.log('🔌 SIGINT received, disconnecting Prisma...')
    await prisma.$disconnect()
    process.exit(0)
  })

  process.on('SIGTERM', async () => {
    console.log('🔌 SIGTERM received, disconnecting Prisma...')
    await prisma.$disconnect()
    process.exit(0)
  })
}

// 🎯 Utilidad para análisis de queries
export const queryAnalytics = {
  slowQueries: [] as Array<{
    query: string
    duration: number
    timestamp: string
    model?: string
    action?: string
  }>,

  recordSlowQuery(data: {
    query?: string
    duration: number
    model?: string
    action?: string
  }) {
    this.slowQueries.push({
      query: data.query || `${data.model}.${data.action}`,
      duration: data.duration,
      timestamp: new Date().toISOString(),
      model: data.model,
      action: data.action
    })

    // Mantener solo las últimas 100 queries lentas
    if (this.slowQueries.length > 100) {
      this.slowQueries.shift()
    }
  },

  getSlowQueries(limit: number = 10) {
    return this.slowQueries
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit)
  },

  getStats() {
    if (this.slowQueries.length === 0) {
      return {
        total: 0,
        avgDuration: 0,
        maxDuration: 0,
        minDuration: 0
      }
    }

    const durations = this.slowQueries.map(q => q.duration)
    return {
      total: this.slowQueries.length,
      avgDuration: Math.round(durations.reduce((a, b) => a + b, 0) / durations.length),
      maxDuration: Math.max(...durations),
      minDuration: Math.min(...durations)
    }
  },

  clear() {
    this.slowQueries = []
  }
}

// Export default para compatibilidad
export default prisma

