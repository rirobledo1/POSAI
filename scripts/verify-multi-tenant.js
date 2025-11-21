/**
 * 🔍 Script de Verificación Post-Migración - Versión Simplificada
 * 
 * Verifica que la migración a Multi-Tenant se haya completado correctamente
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Iniciando verificación del sistema Multi-Tenant...\n');

  let hasErrors = false;

  try {
    // ====================================
    // 1. Verificar que existe al menos una compañía
    // ====================================
    console.log('✓ Verificando compañías...');
    const companies = await prisma.company.findMany();
    
    if (companies.length === 0) {
      console.log('   ❌ ERROR: No hay compañías en el sistema');
      hasErrors = true;
    } else {
      console.log(`   ✅ ${companies.length} compañía(s) encontrada(s)`);
      companies.forEach(company => {
        console.log(`      - ${company.name} (${company.slug}) - Plan: ${company.plan}`);
      });
    }

    // ====================================
    // 2. Contar registros por tabla
    // ====================================
    console.log('\n✓ Contando registros en el sistema...');
    
    const totalUsers = await prisma.user.count();
    console.log(`   📊 Usuarios: ${totalUsers}`);
    
    const totalProducts = await prisma.product.count();
    console.log(`   📊 Productos: ${totalProducts}`);
    
    const totalCustomers = await prisma.customer.count();
    console.log(`   📊 Clientes: ${totalCustomers}`);
    
    const totalSales = await prisma.sale.count();
    console.log(`   📊 Ventas: ${totalSales}`);
    
    const totalCategories = await prisma.categories.count();
    console.log(`   📊 Categorías: ${totalCategories}`);
    
    const totalInventory = await prisma.inventoryMovement.count();
    console.log(`   📊 Movimientos de inventario: ${totalInventory}`);
    
    const totalAddresses = await prisma.deliveryAddress.count();
    console.log(`   📊 Direcciones de entrega: ${totalAddresses}`);

    // ====================================
    // 3. Verificar estructura de la tabla Company
    // ====================================
    console.log('\n✓ Verificando estructura de la tabla Company...');
    
    if (companies.length > 0) {
      const company = companies[0];
      const requiredFields = ['id', 'name', 'slug', 'plan', 'status', 'createdAt', 'updatedAt'];
      const missingFields = requiredFields.filter(field => !(field in company));
      
      if (missingFields.length > 0) {
        console.log(`   ❌ ERROR: Faltan campos en Company: ${missingFields.join(', ')}`);
        hasErrors = true;
      } else {
        console.log('   ✅ Estructura de Company correcta');
      }
    }

    // ====================================
    // 4. Verificar que los campos companyId existan
    // ====================================
    console.log('\n✓ Verificando campos companyId en las tablas...');
    
    try {
      // Intentar obtener un registro de cada tabla para verificar que companyId existe
      if (totalUsers > 0) {
        const user = await prisma.user.findFirst({ select: { companyId: true } });
        console.log('   ✅ Campo companyId existe en User');
      } else {
        console.log('   ℹ️  No hay usuarios para verificar (tabla vacía)');
      }
      
      if (totalProducts > 0) {
        const product = await prisma.product.findFirst({ select: { companyId: true } });
        console.log('   ✅ Campo companyId existe en Product');
      } else {
        console.log('   ℹ️  No hay productos para verificar (tabla vacía)');
      }
      
      if (totalCustomers > 0) {
        const customer = await prisma.customer.findFirst({ select: { companyId: true } });
        console.log('   ✅ Campo companyId existe en Customer');
      } else {
        console.log('   ℹ️  No hay clientes para verificar (tabla vacía)');
      }
      
      if (totalSales > 0) {
        const sale = await prisma.sale.findFirst({ select: { companyId: true } });
        console.log('   ✅ Campo companyId existe en Sale');
      } else {
        console.log('   ℹ️  No hay ventas para verificar (tabla vacía)');
      }
      
      if (totalCategories > 0) {
        const category = await prisma.categories.findFirst({ select: { companyId: true } });
        console.log('   ✅ Campo companyId existe en Categories');
      } else {
        console.log('   ℹ️  No hay categorías para verificar (tabla vacía)');
      }
      
      if (totalInventory > 0) {
        const inventory = await prisma.inventoryMovement.findFirst({ select: { companyId: true } });
        console.log('   ✅ Campo companyId existe en InventoryMovement');
      } else {
        console.log('   ℹ️  No hay movimientos para verificar (tabla vacía)');
      }
      
      if (totalAddresses > 0) {
        const address = await prisma.deliveryAddress.findFirst({ select: { companyId: true } });
        console.log('   ✅ Campo companyId existe en DeliveryAddress');
      } else {
        console.log('   ℹ️  No hay direcciones para verificar (tabla vacía)');
      }
      
    } catch (error) {
      console.log(`   ❌ ERROR: Algunos campos companyId no existen: ${error.message}`);
      hasErrors = true;
    }

    // ====================================
    // RESUMEN FINAL
    // ====================================
    console.log('\n' + '='.repeat(60));
    
    if (hasErrors) {
      console.log('❌ VERIFICACIÓN FALLIDA - Se encontraron errores');
      console.log('\n⚠️  ACCIÓN REQUERIDA:');
      console.log('   1. Revisa los errores arriba');
      console.log('   2. Verifica la integridad de los datos');
      console.log('   3. Contacta soporte si persiste el error\n');
      process.exit(1);
    } else {
      console.log('✅ VERIFICACIÓN EXITOSA');
      console.log('\n🎉 ¡El sistema Multi-Tenant está correctamente configurado!');
      console.log('\n📝 Resumen:');
      console.log(`   - Compañías: ${companies.length}`);
      console.log(`   - Usuarios: ${totalUsers}`);
      console.log(`   - Productos: ${totalProducts}`);
      console.log(`   - Clientes: ${totalCustomers}`);
      console.log(`   - Ventas: ${totalSales}`);
      console.log(`   - Categorías: ${totalCategories}`);
      console.log(`   - Movimientos: ${totalInventory}`);
      console.log(`   - Direcciones: ${totalAddresses}`);
      console.log('\n✅ FASE 1 COMPLETADA AL 100%');
      console.log('📍 Continúa con la Fase 2 (Autenticación)\n');
    }

  } catch (error) {
    console.error('\n❌ Error durante la verificación:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });
