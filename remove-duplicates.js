const { Pool } = require('pg');

// Configuración de la base de datos
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'ferreai_dev',
  user: 'postgres',
  password: 'admin123',
  ssl: false,
});

async function findAndRemoveDuplicates() {
  try {
    console.log('🔍 Buscando productos duplicados...');
    
    // Buscar productos duplicados basándose en nombres normalizados
    const duplicatesQuery = `
      SELECT 
        LOWER(TRIM(name)) as normalized_name,
        COUNT(*) as count,
        ARRAY_AGG(id ORDER BY created_at DESC) as product_ids,
        ARRAY_AGG(name ORDER BY created_at DESC) as product_names,
        ARRAY_AGG(stock ORDER BY created_at DESC) as product_stocks,
        ARRAY_AGG(created_at ORDER BY created_at DESC) as created_dates
      FROM products 
      WHERE active = true
      GROUP BY LOWER(TRIM(name))
      HAVING COUNT(*) > 1
      ORDER BY COUNT(*) DESC, LOWER(TRIM(name))
    `;
    
    const duplicatesResult = await pool.query(duplicatesQuery);
    
    if (duplicatesResult.rows.length === 0) {
      console.log('✅ No se encontraron productos duplicados');
      return;
    }
    
    console.log(`📊 Encontrados ${duplicatesResult.rows.length} grupos de productos duplicados:`);
    console.log('');
    
    let totalToDelete = 0;
    let stockConsolidations = [];
    
    // Mostrar información de duplicados
    duplicatesResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. Producto: "${row.product_names[0]}" (${row.count} duplicados)`);
      console.log(`   IDs: ${row.product_ids.join(', ')}`);
      console.log(`   Stocks: ${row.product_stocks.join(', ')}`);
      console.log(`   Fechas: ${row.created_dates.map(d => d.toISOString().split('T')[0]).join(', ')}`);
      
      // El primer producto (más reciente) se mantiene, los demás se eliminan
      const keepId = row.product_ids[0];
      const deleteIds = row.product_ids.slice(1);
      const totalStock = row.product_stocks.reduce((sum, stock) => sum + parseInt(stock), 0);
      
      console.log(`   ✅ Mantener: ${keepId} (más reciente)`);
      console.log(`   🗑️  Eliminar: ${deleteIds.join(', ')}`);
      console.log(`   📦 Stock consolidado: ${totalStock}`);
      console.log('');
      
      totalToDelete += deleteIds.length;
      stockConsolidations.push({
        keepId,
        deleteIds,
        totalStock,
        productName: row.product_names[0]
      });
    });
    
    console.log(`📊 Resumen:`);
    console.log(`   - Productos únicos a mantener: ${duplicatesResult.rows.length}`);
    console.log(`   - Productos duplicados a eliminar: ${totalToDelete}`);
    console.log('');
    
    // Confirmar antes de proceder
    console.log('⚠️  ATENCIÓN: Esta operación eliminará productos duplicados permanentemente.');
    console.log('   Los stocks se consolidarán en el producto más reciente de cada grupo.');
    console.log('');
    
    // En un entorno real, aquí se podría pedir confirmación del usuario
    // Para este script automatizado, procederemos directamente
    
    console.log('🚀 Iniciando consolidación de productos duplicados...');
    console.log('');
    
    // Procesar cada grupo de duplicados
    for (const consolidation of stockConsolidations) {
      const { keepId, deleteIds, totalStock, productName } = consolidation;
      
      console.log(`📦 Procesando: "${productName}"`);
      
      // 1. Actualizar el stock del producto que se mantiene
      const updateStockQuery = `
        UPDATE products 
        SET stock = $1, updated_at = NOW()
        WHERE id = $2
      `;
      
      await pool.query(updateStockQuery, [totalStock, keepId]);
      console.log(`   ✅ Stock consolidado: ${totalStock} unidades`);
      
      // 2. Eliminar los productos duplicados
      if (deleteIds.length > 0) {
        const deleteQuery = `
          DELETE FROM products 
          WHERE id = ANY($1)
        `;
        
        const deleteResult = await pool.query(deleteQuery, [deleteIds]);
        console.log(`   🗑️  Eliminados ${deleteResult.rowCount} productos duplicados`);
      }
      
      console.log('');
    }
    
    console.log('✅ Proceso completado exitosamente!');
    console.log('');
    
    // Verificar el resultado
    console.log('🔍 Verificando resultado...');
    const verificationQuery = `
      SELECT 
        LOWER(TRIM(name)) as normalized_name,
        COUNT(*) as count
      FROM products 
      WHERE active = true
      GROUP BY LOWER(TRIM(name))
      HAVING COUNT(*) > 1
    `;
    
    const verificationResult = await pool.query(verificationQuery);
    
    if (verificationResult.rows.length === 0) {
      console.log('✅ Verificación exitosa: No hay productos duplicados');
    } else {
      console.log(`⚠️  Aún quedan ${verificationResult.rows.length} grupos con duplicados`);
    }
    
    // Mostrar estadísticas finales
    const totalProductsQuery = `
      SELECT COUNT(*) as total FROM products WHERE active = true
    `;
    const totalResult = await pool.query(totalProductsQuery);
    console.log(`📊 Total de productos activos: ${totalResult.rows[0].total}`);
    
  } catch (error) {
    console.error('❌ Error durante el proceso:', error);
  } finally {
    await pool.end();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  findAndRemoveDuplicates();
}

module.exports = { findAndRemoveDuplicates };
