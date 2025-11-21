const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function forceCleanDatabase() {
  try {
    console.log('🧹 Iniciando limpieza forzada de la base de datos...');

    // 1. Eliminar elementos de ventas
    const deletedSaleItems = await prisma.saleItem.deleteMany();
    console.log(`✅ Eliminados ${deletedSaleItems.count} elementos de ventas`);

    // 2. Eliminar ventas
    const deletedSales = await prisma.sale.deleteMany();
    console.log(`✅ Eliminadas ${deletedSales.count} ventas`);

    // 3. Resetear deudas de clientes
    const resetCustomers = await prisma.customer.updateMany({
      data: {
        currentDebt: 0
      }
    });
    console.log(`✅ Reseteadas deudas de ${resetCustomers.count} clientes`);

    // 4. Verificar limpieza
    const salesCount = await prisma.sale.count();
    const saleItemsCount = await prisma.saleItem.count();
    const totalDebt = await prisma.customer.aggregate({
      _sum: {
        currentDebt: true
      }
    });

    console.log('\n📊 Estado después de la limpieza:');
    console.log(`- Ventas: ${salesCount}`);
    console.log(`- Elementos de venta: ${saleItemsCount}`);
    console.log(`- Deuda total: $${totalDebt._sum.currentDebt || 0}`);

    if (salesCount === 0 && saleItemsCount === 0 && (totalDebt._sum.currentDebt || 0) === 0) {
      console.log('\n✅ Base de datos limpiada exitosamente!');
    } else {
      console.log('\n❌ La limpieza no fue completa');
    }

  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
  } finally {
    await prisma.$disconnect();
  }
}

forceCleanDatabase();
