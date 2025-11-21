const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function findProductsForTesting() {
  try {
    console.log('🔍 Analizando productos para pruebas de eliminación...\n');

    // Obtener todos los productos activos
    const products = await prisma.product.findMany({
      where: { active: true },
      include: {
        saleItems: {
          include: {
            sale: true
          }
        },
        inventoryMovements: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20
    });

    if (products.length === 0) {
      console.log('❌ No se encontraron productos activos');
      return;
    }

    console.log('📊 PRODUCTOS DISPONIBLES PARA PROBAR:\n');

    // Categorizar productos
    const productsWithSales = products.filter(p => p.saleItems.length > 0);
    const productsWithMovements = products.filter(p => p.inventoryMovements.length > 0);
    const productsWithoutReferences = products.filter(p => p.saleItems.length === 0 && p.inventoryMovements.length === 0);

    // Mostrar productos CON ventas (mejor para probar validaciones)
    if (productsWithSales.length > 0) {
      console.log('🎯 MEJORES PRODUCTOS PARA PROBAR VALIDACIONES (tienen ventas):');
      console.log('================================================================');
      
      productsWithSales.slice(0, 5).forEach((product, index) => {
        const firstSale = product.saleItems.length > 0 ? 
          new Date(Math.min(...product.saleItems.map(si => new Date(si.sale.createdAt).getTime()))) : null;
        const lastSale = product.saleItems.length > 0 ? 
          new Date(Math.max(...product.saleItems.map(si => new Date(si.sale.createdAt).getTime()))) : null;

        console.log(`${index + 1}. 📦 "${product.name}"`);
        console.log(`   ID: ${product.id}`);
        console.log(`   💰 Ventas: ${product.saleItems.length}`);
        console.log(`   📦 Movimientos: ${product.inventoryMovements.length}`);
        console.log(`   📅 Primera venta: ${firstSale ? firstSale.toLocaleDateString() : 'N/A'}`);
        console.log(`   📅 Última venta: ${lastSale ? lastSale.toLocaleDateString() : 'N/A'}`);
        console.log(`   🏷️  Stock actual: ${product.stock}`);
        console.log('');
      });
    }

    // Mostrar productos SIN referencias (se eliminarán fácilmente)
    if (productsWithoutReferences.length > 0) {
      console.log('⚡ PRODUCTOS SIN REFERENCIAS (se eliminarán sin confirmación):');
      console.log('============================================================');
      
      productsWithoutReferences.slice(0, 3).forEach((product, index) => {
        console.log(`${index + 1}. 📦 "${product.name}"`);
        console.log(`   ID: ${product.id}`);
        console.log(`   📅 Creado: ${new Date(product.createdAt).toLocaleDateString()}`);
        console.log(`   🏷️  Stock: ${product.stock}`);
        console.log('');
      });
    }

    // Resumen
    console.log('📋 RESUMEN:');
    console.log('===========');
    console.log(`✅ Productos con ventas: ${productsWithSales.length} (mostrarán validación completa)`);
    console.log(`📦 Productos con movimientos: ${productsWithMovements.length}`);
    console.log(`⚡ Productos sin referencias: ${productsWithoutReferences.length} (eliminación directa)`);
    console.log(`📊 Total productos activos: ${products.length}`);
    console.log('');

    // Recomendación
    if (productsWithSales.length > 0) {
      const recommended = productsWithSales[0];
      console.log('🎯 RECOMENDACIÓN PARA PRUEBA:');
      console.log('=============================');
      console.log(`Usa: "${recommended.name}"`);
      console.log(`ID: ${recommended.id}`);
      console.log(`Razón: Tiene ${recommended.saleItems.length} venta(s) registrada(s)`);
      console.log('Comportamiento esperado: Te mostrará el diálogo de confirmación completo');
      console.log('');
      
      console.log('🔍 PASOS PARA PROBAR:');
      console.log('1. Ve a Gestión de Productos');
      console.log('2. Busca el producto recomendado');
      console.log('3. Haz clic en el botón de eliminar (🗑️)');
      console.log('4. Verás el diálogo de confirmación con estadísticas');
      console.log('5. Puedes confirmar para hacer soft delete');
      console.log('');
      console.log('💡 COPY-PASTE PARA BUSCAR:');
      console.log(`"${recommended.name}"`);
    } else if (productsWithoutReferences.length > 0) {
      console.log('💡 PRODUCTOS PARA PROBAR ELIMINACIÓN DIRECTA:');
      console.log('=============================================');
      const simpleProduct = productsWithoutReferences[0];
      console.log(`Usa: "${simpleProduct.name}"`);
      console.log(`ID: ${simpleProduct.id}`);
      console.log('Comportamiento esperado: Se eliminará directamente sin confirmación extra');
      console.log('');
      console.log('💡 COPY-PASTE PARA BUSCAR:');
      console.log(`"${simpleProduct.name}"`);
    } else {
      console.log('⚠️  No hay productos disponibles para probar');
      console.log('💡 Considera importar productos usando el CSV o crear algunos manualmente');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar
if (require.main === module) {
  findProductsForTesting();
}

module.exports = { findProductsForTesting };
