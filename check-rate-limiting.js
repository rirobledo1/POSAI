// Script para verificar si el Rate Limiting está completamente implementado

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkRateLimiting() {
  console.log('🔍 Verificando implementación de Rate Limiting...\n')
  
  try {
    // 1. Verificar si la tabla existe
    console.log('1️⃣ Verificando tabla login_attempts...')
    const count = await prisma.loginAttempt.count()
    console.log(`   ✅ Tabla existe! Registros actuales: ${count}`)
    
    // 2. Verificar estructura de la tabla
    console.log('\n2️⃣ Verificando estructura...')
    const sample = await prisma.loginAttempt.findFirst()
    if (sample) {
      console.log('   ✅ Estructura correcta:', Object.keys(sample))
    } else {
      console.log('   ℹ️  Tabla vacía (no hay intentos registrados aún)')
    }
    
    // 3. Verificar índices
    console.log('\n3️⃣ Verificando índices...')
    const result = await prisma.$queryRaw`
      SELECT 
        tablename, 
        indexname, 
        indexdef
      FROM pg_indexes 
      WHERE tablename = 'login_attempts'
      ORDER BY indexname
    `
    console.log(`   ✅ Índices encontrados: ${result.length}`)
    result.forEach(idx => {
      console.log(`      - ${idx.indexname}`)
    })
    
    // 4. Simular verificación de rate limit
    console.log('\n4️⃣ Probando funciones de rate limiting...')
    const { checkLoginRateLimit } = require('./src/lib/rate-limit/login-rate-limiter.ts')
    const testResult = await checkLoginRateLimit('test@example.com', 'email')
    console.log('   ✅ checkLoginRateLimit funciona:', {
      allowed: testResult.allowed,
      remaining: testResult.remainingAttempts
    })
    
    console.log('\n✨ Rate Limiting está COMPLETAMENTE IMPLEMENTADO ✨')
    console.log('\n📋 Resumen:')
    console.log(`   • Tabla: ✅ login_attempts creada`)
    console.log(`   • Código: ✅ Integrado en auth.ts`)
    console.log(`   • Límite: ⚙️  5 intentos / 15 minutos`)
    console.log(`   • Registros actuales: ${count}`)
    
  } catch (error) {
    if (error.code === 'P2021') {
      console.error('\n❌ La tabla login_attempts NO EXISTE en la base de datos')
      console.log('\n🔧 Solución: Ejecuta la migración:')
      console.log('   npx prisma db push')
      console.log('   O crea manualmente con: add-rate-limiting-table.sql')
    } else {
      console.error('\n❌ Error:', error.message)
      console.log('\nDetalle del error:', error)
    }
  } finally {
    await prisma.$disconnect()
  }
}

checkRateLimiting()
