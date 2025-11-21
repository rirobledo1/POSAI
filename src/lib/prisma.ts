import { PrismaClient } from '@prisma/client'

// Declarar el tipo global
declare global {
  var prisma: PrismaClient | undefined
}

// Prevenir múltiples instancias de Prisma en desarrollo
export const prisma = global.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma
}

// Asegurar que Prisma se desconecte al cerrar el proceso
if (typeof window === 'undefined') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })
}

// Export default para compatibilidad
export default prisma
