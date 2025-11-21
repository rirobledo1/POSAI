// scripts/verify-enums.ts
import { PrismaClient, OrderType, OrderStatus } from '@prisma/client'

const prisma = new PrismaClient()

async function verifyEnums() {
  console.log('🔍 Verificando enums...\n')

  // Verificar que los enums existen en el Prisma Client
  console.log('✅ OrderType enum:', Object.values(OrderType))
  console.log('✅ OrderStatus enum:', Object.values(OrderStatus))

  // Verificar en la base de datos
  try {
    const result = await prisma.$queryRaw`
      SELECT 
        t.typname as enum_name,
        array_agg(e.enumlabel ORDER BY e.enumsortorder) as values
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid  
      WHERE t.typname IN ('OrderType', 'OrderStatus')
      GROUP BY t.typname
      ORDER BY t.typname;
    `
    
    console.log('\n📊 Enums en PostgreSQL:')
    console.log(JSON.stringify(result, null, 2))
  } catch (error) {
    console.error('❌ Error consultando enums:', error)
  }

  await prisma.$disconnect()
}

verifyEnums()
