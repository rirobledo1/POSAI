/**
 * Script simple para borrar solo los datos de productos y categorías
 * Mantiene las secuencias de ID intactas
 * Uso: node scripts/clear-data.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearData() {
  try {
    console.log('🧹 Limpiando datos de productos y categorías...');
    
    // Eliminar productos primero (por la foreign key)
    const deletedProducts = await prisma.product.deleteMany({});
    console.log(`📦 Productos eliminados: ${deletedProducts.count}`);
    
    // Eliminar categorías
    const deletedCategories = await prisma.category.deleteMany({});
    console.log(`📁 Categorías eliminadas: ${deletedCategories.count}`);
    
    console.log('✅ Datos eliminados exitosamente');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

clearData();