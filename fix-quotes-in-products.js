/**
 * Script para identificar y corregir productos con comillas problemáticas
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

async function findProductsWithQuotes() {
  try {
    console.log('🔍 Buscando productos con comillas problemáticas...\n');

    // Buscar productos que tienen comillas al final o múltiples comillas
    const query = `
      SELECT 
        id,
        name,
        description,
        created_at
      FROM products 
      WHERE 
        name LIKE '%"""%' OR 
        name LIKE '%"""' OR
        description LIKE '%"""%' OR
        description LIKE '%"""'
      ORDER BY created_at DESC
    `;

    const result = await pool.query(query);
    
    if (result.rows.length === 0) {
      console.log('✅ No se encontraron productos con comillas problemáticas');
      return [];
    }

    console.log(`🔍 Encontrados ${result.rows.length} productos con comillas problemáticas:\n`);
    
    result.rows.forEach((product, index) => {
      console.log(`${index + 1}. ID: ${product.id}`);
      console.log(`   Nombre: "${product.name}"`);
      if (product.description) {
        console.log(`   Descripción: "${product.description}"`);
      }
      console.log(`   Creado: ${product.created_at}`);
      console.log('');
    });

    return result.rows;

  } catch (error) {
    console.error('❌ Error al buscar productos:', error);
    throw error;
  }
}

async function fixQuotesInProducts(products) {
  if (products.length === 0) return;

  console.log('\n🔧 Corrigiendo comillas en productos...\n');

  for (const product of products) {
    try {
      // Limpiar nombre
      let cleanName = product.name;
      // Quitar comillas al final
      cleanName = cleanName.replace(/"+$/, '');
      // Reemplazar comillas dobles por comillas simples
      cleanName = cleanName.replace(/""/g, '"');
      
      // Limpiar descripción
      let cleanDescription = product.description || '';
      if (cleanDescription) {
        cleanDescription = cleanDescription.replace(/"+$/, '');
        cleanDescription = cleanDescription.replace(/""/g, '"');
      }

      // Actualizar si hay cambios
      if (cleanName !== product.name || cleanDescription !== product.description) {
        await pool.query(
          'UPDATE products SET name = $1, description = $2, updated_at = NOW() WHERE id = $3',
          [cleanName, cleanDescription, product.id]
        );

        console.log(`✅ Corregido producto ${product.id}:`);
        console.log(`   Antes: "${product.name}"`);
        console.log(`   Después: "${cleanName}"`);
        if (product.description && cleanDescription !== product.description) {
          console.log(`   Descripción antes: "${product.description}"`);
          console.log(`   Descripción después: "${cleanDescription}"`);
        }
        console.log('');
      }

    } catch (error) {
      console.error(`❌ Error corrigiendo producto ${product.id}:`, error);
    }
  }
}

async function main() {
  try {
    console.log('🔄 Iniciando corrección de comillas en productos...\n');

    const productsWithQuotes = await findProductsWithQuotes();
    
    if (productsWithQuotes.length > 0) {
      await fixQuotesInProducts(productsWithQuotes);
      console.log('\n✅ Proceso completado. Verificando cambios...\n');
      
      // Verificar que se corrigieron
      const remainingProblems = await findProductsWithQuotes();
      if (remainingProblems.length === 0) {
        console.log('🎉 ¡Todas las comillas problemáticas han sido corregidas!');
      } else {
        console.log(`⚠️ Aún quedan ${remainingProblems.length} productos con problemas`);
      }
    }

  } catch (error) {
    console.error('❌ Error en el proceso:', error);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main();
}

module.exports = { findProductsWithQuotes, fixQuotesInProducts };
