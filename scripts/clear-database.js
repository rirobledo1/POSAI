/**
 * Script para limpiar completamente las tablas de productos y categorías
 * Uso: node scripts/clear-database.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearDatabase() {
  try {
    console.log('🗑️  Iniciando limpieza de base de datos...');
    
    // Paso 1: Eliminar todos los productos (esto también elimina las referencias)
    console.log('📦 Eliminando todos los productos...');
    const deletedProducts = await prisma.product.deleteMany({});
    console.log(`✅ Eliminados ${deletedProducts.count} productos`);
    
    // Paso 2: Eliminar todas las categorías
    console.log('📁 Eliminando todas las categorías...');
    const deletedCategories = await prisma.category.deleteMany({});
    console.log(`✅ Eliminadas ${deletedCategories.count} categorías`);
    
    // Paso 3: Resetear secuencias de ID (PostgreSQL)
    console.log('🔄 Reseteando secuencias de ID...');
    await prisma.$executeRaw`ALTER SEQUENCE "Product_id_seq" RESTART WITH 1;`;
    await prisma.$executeRaw`ALTER SEQUENCE "Category_id_seq" RESTART WITH 1;`;
    console.log('✅ Secuencias reseteadas');
    
    console.log('🎉 Base de datos limpiada exitosamente!');
    console.log('📊 Estado actual:');
    
    // Verificar que todo esté limpio
    const productCount = await prisma.product.count();
    const categoryCount = await prisma.category.count();
    
    console.log(`   - Productos: ${productCount}`);
    console.log(`   - Categorías: ${categoryCount}`);
    
  } catch (error) {
    console.error('❌ Error limpiando la base de datos:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  clearDatabase();
}

module.exports = { clearDatabase };