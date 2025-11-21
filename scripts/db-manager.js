/**
 * Script avanzado para manejo de base de datos
 * Uso: 
 *   node scripts/db-manager.js clear-all     # Borra todo y resetea IDs
 *   node scripts/db-manager.js clear-data    # Solo borra datos
 *   node scripts/db-manager.js clear-products # Solo borra productos
 *   node scripts/db-manager.js clear-categories # Solo borra categorías
 *   node scripts/db-manager.js status        # Muestra estado actual
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function showStatus() {
  try {
    const productCount = await prisma.product.count();
    const categoryCount = await prisma.category.count();
    
    console.log('📊 Estado actual de la base de datos:');
    console.log(`   📦 Productos: ${productCount}`);
    console.log(`   📁 Categorías: ${categoryCount}`);
    
    if (categoryCount > 0) {
      console.log('\n📁 Categorías existentes:');
      const categories = await prisma.category.findMany({
        include: { _count: { select: { products: true } } },
        orderBy: { name: 'asc' }
      });
      
      categories.forEach(cat => {
        console.log(`   - ${cat.name} (ID: ${cat.id}, ${cat._count.products} productos)`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error obteniendo estado:', error);
    // Si las tablas no existen, mostrar mensaje informativo
    if (error.code === 'P2021' || error.message.includes('does not exist')) {
      console.log('ℹ️  Las tablas aún no existen. Ejecuta "npx prisma db push" para crearlas.');
    }
  }
}

async function clearProducts() {
  try {
    console.log('📦 Eliminando todos los productos...');
    const result = await prisma.product.deleteMany({});
    console.log(`✅ Eliminados ${result.count} productos`);
  } catch (error) {
    console.error('❌ Error eliminando productos:', error);
  }
}

async function clearCategories() {
  try {
    console.log('📁 Eliminando todas las categorías...');
    const result = await prisma.category.deleteMany({});
    console.log(`✅ Eliminadas ${result.count} categorías`);
  } catch (error) {
    console.error('❌ Error eliminando categorías:', error);
  }
}

async function clearData() {
  try {
    console.log('🧹 Limpiando todos los datos...');
    await clearProducts();
    await clearCategories();
    console.log('✅ Todos los datos eliminados');
  } catch (error) {
    console.error('❌ Error limpiando datos:', error);
  }
}

async function clearAll() {
  try {
    console.log('🗑️  Limpieza completa (datos + reset IDs)...');
    await clearProducts();
    await clearCategories();
    
    console.log('🔄 Reseteando secuencias de ID...');
    await prisma.$executeRaw`ALTER SEQUENCE "Product_id_seq" RESTART WITH 1;`;
    await prisma.$executeRaw`ALTER SEQUENCE "Category_id_seq" RESTART WITH 1;`;
    console.log('✅ Limpieza completa finalizada');
  } catch (error) {
    console.error('❌ Error en limpieza completa:', error);
  }
}

async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'clear-all':
      await clearAll();
      break;
    case 'clear-data':
      await clearData();
      break;
    case 'clear-products':
      await clearProducts();
      break;
    case 'clear-categories':
      await clearCategories();
      break;
    case 'status':
      await showStatus();
      break;
    default:
      console.log('📋 Comandos disponibles:');
      console.log('  clear-all       - Borra todo y resetea IDs');
      console.log('  clear-data      - Solo borra datos');
      console.log('  clear-products  - Solo borra productos');
      console.log('  clear-categories - Solo borra categorías');
      console.log('  status          - Muestra estado actual');
      console.log('\n💡 Ejemplo: node scripts/db-manager.js clear-all');
  }
  
  await prisma.$disconnect();
}

main().catch(console.error);