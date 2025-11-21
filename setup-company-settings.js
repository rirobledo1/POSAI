/**
 * Script para verificar y crear la tabla company_settings
 * Necesaria para el sistema de importación CSV
 */

const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  database: process.env.DATABASE_NAME || 'ferreai_dev',
  user: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'admin123',
  ssl: false,
});

async function checkAndCreateCompanySettings() {
  try {
    console.log('🔍 Verificando tabla company_settings...');
    
    // Verificar si la tabla existe
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'company_settings'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log('📋 Creando tabla company_settings...');
      
      await pool.query(`
        CREATE TABLE company_settings (
          id SERIAL PRIMARY KEY,
          company_name VARCHAR(255) NOT NULL DEFAULT 'FerreAI',
          tax_rate DECIMAL(5,4) NOT NULL DEFAULT 0.16,
          currency VARCHAR(10) NOT NULL DEFAULT 'MXN',
          address TEXT,
          phone VARCHAR(20),
          email VARCHAR(100),
          website VARCHAR(100),
          created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
        );
      `);
      
      console.log('✅ Tabla company_settings creada');
      
      // Insertar configuración por defecto
      await pool.query(`
        INSERT INTO company_settings (
          company_name, tax_rate, currency, created_at, updated_at
        ) VALUES (
          'FerreAI', 0.16, 'MXN', NOW(), NOW()
        );
      `);
      
      console.log('✅ Configuración por defecto insertada');
    } else {
      console.log('✅ Tabla company_settings ya existe');
      
      // Verificar si hay datos
      const dataExists = await pool.query('SELECT COUNT(*) FROM company_settings');
      
      if (parseInt(dataExists.rows[0].count) === 0) {
        console.log('📋 Insertando configuración por defecto...');
        
        await pool.query(`
          INSERT INTO company_settings (
            company_name, tax_rate, currency, created_at, updated_at
          ) VALUES (
            'FerreAI', 0.16, 'MXN', NOW(), NOW()
          );
        `);
        
        console.log('✅ Configuración por defecto insertada');
      }
    }
    
    // Mostrar configuración actual
    const settings = await pool.query('SELECT * FROM company_settings WHERE id = 1');
    if (settings.rows.length > 0) {
      const config = settings.rows[0];
      console.log('\n📋 Configuración actual:');
      console.log(`   - Empresa: ${config.company_name}`);
      console.log(`   - Tasa de impuesto: ${(config.tax_rate * 100).toFixed(2)}%`);
      console.log(`   - Moneda: ${config.currency}`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Configurando tabla company_settings para importación CSV\n');
  
  const success = await checkAndCreateCompanySettings();
  
  if (success) {
    console.log('\n🎉 ¡Configuración completada exitosamente!');
    console.log('✅ El sistema de importación CSV puede usar la configuración de impuestos');
  } else {
    console.log('\n❌ Error en la configuración');
  }
  
  await pool.end();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { checkAndCreateCompanySettings };
