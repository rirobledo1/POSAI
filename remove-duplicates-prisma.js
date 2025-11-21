const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function findAndRemoveDuplicates() {
  try {
    console.log('🔍 Buscando productos duplicados...');
    
    // Obtener todos los productos activos
    const allProducts = await prisma.product.findMany({
      where: { active: true },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`📊 Total de productos encontrados: ${allProducts.length}`);
    
    // Agrupar por nombre normalizado
    const productGroups = {};
    
    allProducts.forEach(product => {
      const normalizedName = product.name.toLowerCase().trim();
      if (!productGroups[normalizedName]) {
        productGroups[normalizedName] = [];
      }
      productGroups[normalizedName].push(product);
    });
    
    // Encontrar duplicados
    const duplicateGroups = [];
    Object.entries(productGroups).forEach(([normalizedName, products]) => {
      if (products.length > 1) {
        duplicateGroups.push({
          normalizedName,
          products,
          count: products.length
        });
      }
    });
    
    if (duplicateGroups.length === 0) {
      console.log('✅ No se encontraron productos duplicados');
      return;
    }
    
    console.log(`📊 Encontrados ${duplicateGroups.length} grupos de productos duplicados:`);
    console.log('');
    
    let totalToDelete = 0;
    let consolidations = [];
    
    // Mostrar información de duplicados
    duplicateGroups.forEach((group, index) => {
      console.log(`${index + 1}. Producto: "${group.products[0].name}" (${group.count} duplicados)`);
      
      // Ordenar por fecha de creación (más reciente primero)
      const sortedProducts = group.products.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      
      const keepProduct = sortedProducts[0]; // Mantener el más reciente
      const deleteProducts = sortedProducts.slice(1); // Eliminar el resto
      const totalStock = sortedProducts.reduce((sum, p) => sum + p.stock, 0);
      
      console.log(`   IDs: ${sortedProducts.map(p => p.id).join(', ')}`);
      console.log(`   Stocks: ${sortedProducts.map(p => p.stock).join(', ')}`);
      console.log(`   Fechas: ${sortedProducts.map(p => p.createdAt.toISOString().split('T')[0]).join(', ')}`);
      console.log(`   ✅ Mantener: ${keepProduct.id} (más reciente)`);
      console.log(`   🗑️  Eliminar: ${deleteProducts.map(p => p.id).join(', ')}`);
      console.log(`   📦 Stock consolidado: ${totalStock}`);
      console.log('');
      
      totalToDelete += deleteProducts.length;
      consolidations.push({
        keepProduct,
        deleteProducts,
        totalStock
      });
    });
    
    console.log(`📊 Resumen:`);
    console.log(`   - Productos únicos a mantener: ${duplicateGroups.length}`);
    console.log(`   - Productos duplicados a eliminar: ${totalToDelete}`);
    console.log('');
    
    console.log('🚀 Iniciando consolidación de productos duplicados...');
    console.log('');
    
    // Procesar cada grupo de duplicados
    for (const consolidation of consolidations) {
      const { keepProduct, deleteProducts, totalStock } = consolidation;
      
      console.log(`📦 Procesando: "${keepProduct.name}"`);
      
      // 1. Actualizar el stock del producto que se mantiene
      await prisma.product.update({
        where: { id: keepProduct.id },
        data: { 
          stock: totalStock,
          updatedAt: new Date()
        }
      });
      
      console.log(`   ✅ Stock consolidado: ${totalStock} unidades`);
      
      // 2. Eliminar los productos duplicados
      if (deleteProducts.length > 0) {
        const deleteIds = deleteProducts.map(p => p.id);
        
        const deleteResult = await prisma.product.deleteMany({
          where: {
            id: {
              in: deleteIds
            }
          }
        });
        
        console.log(`   🗑️  Eliminados ${deleteResult.count} productos duplicados`);
      }
      
      console.log('');
    }
    
    console.log('✅ Proceso completado exitosamente!');
    console.log('');
    
    // Verificar el resultado
    console.log('🔍 Verificando resultado...');
    
    const finalProducts = await prisma.product.findMany({
      where: { active: true }
    });
    
    const finalGroups = {};
    finalProducts.forEach(product => {
      const normalizedName = product.name.toLowerCase().trim();
      if (!finalGroups[normalizedName]) {
        finalGroups[normalizedName] = [];
      }
      finalGroups[normalizedName].push(product);
    });
    
    const remainingDuplicates = Object.values(finalGroups).filter(group => group.length > 1);
    
    if (remainingDuplicates.length === 0) {
      console.log('✅ Verificación exitosa: No hay productos duplicados');
    } else {
      console.log(`⚠️  Aún quedan ${remainingDuplicates.length} grupos con duplicados`);
    }
    
    console.log(`📊 Total de productos activos: ${finalProducts.length}`);
    
  } catch (error) {
    console.error('❌ Error durante el proceso:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  findAndRemoveDuplicates();
}

module.exports = { findAndRemoveDuplicates };
