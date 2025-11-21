// Script para ejecutar migración de cash_register_closures
const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:admin123@localhost:5432/ferreai_dev'
})

async function runMigration() {
  try {
    console.log('🔄 Ejecutando migración: cash_register_closures...')
    
    const migrationPath = path.join(__dirname, 'prisma', 'migrations', '20251009_cash_register_closures', 'migration.sql')
    const sql = fs.readFileSync(migrationPath, 'utf8')
    
    await pool.query(sql)
    
    console.log('✅ Migración ejecutada exitosamente')
    console.log('📊 Tabla cash_register_closures creada')
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Error ejecutando migración:', error)
    process.exit(1)
  }
}

runMigration()
