/**
 * 🚀 Script de Migración a Multi-Tenant
 * 
 * Este script:
 * 1. Crea una compañía por defecto ("Mi Empresa")
 * 2. Asigna todos los registros existentes a esa compañía
 * 3. Prepara el sistema para el modelo SaaS
 * 
 * ⚠️ IMPORTANTE: Ejecutar ANTES de aplicar las migraciones de Prisma
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Iniciando migración a Multi-Tenant...\n');

  try {
    // ====================================
    // PASO 1: Verificar si ya existe una compañía
    // ====================================
    console.log('📋 PASO 1: Verificando compañías existentes...');
    const existingCompanies = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM companies
    `;
    
    const companyCount = Number(existingCompanies[0].count);
    
    if (companyCount > 0) {
      console.log(`✅ Ya existen ${companyCount} compañía(s) en el sistema.`);
      console.log('ℹ️  Saltando creación de compañía por defecto.\n');
      return;
    }

    // ====================================
    // PASO 2: Crear compañía por defecto
    // ====================================
    console.log('📋 PASO 2: Creando compañía por defecto...');
    
    const defaultCompanyId = 'default-company-' + Date.now();
    const companySlug = 'mi-empresa';
    
    await prisma.$executeRaw`
      INSERT INTO companies (
        id, 
        name, 
        slug, 
        business_type, 
        plan, 
        status, 
        tax_rate,
        currency,
        timezone,
        created_at, 
        updated_at
      ) VALUES (
        ${defaultCompanyId},
        'Mi Empresa',
        ${companySlug},
        'GENERAL',
        'FREE',
        'ACTIVE',
        16.00,
        'MXN',
        'America/Mexico_City',
        NOW(),
        NOW()
      )
    `;
    
    console.log(`✅ Compañía creada con ID: ${defaultCompanyId}\n`);

    // ====================================
    // PASO 3: Obtener conteo de registros
    // ====================================
    console.log('📋 PASO 3: Contando registros existentes...');
    
    const userCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM users`;
    const productCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM products`;
    const customerCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM customers`;
    const saleCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM sales`;
    const categoryCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM categories`;
    const inventoryCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM inventory_movements`;
    const deliveryCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM delivery_addresses`;

    console.log(`   👥 Usuarios: ${Number(userCount[0].count)}`);
    console.log(`   📦 Productos: ${Number(productCount[0].count)}`);
    console.log(`   🧑‍💼 Clientes: ${Number(customerCount[0].count)}`);
    console.log(`   💰 Ventas: ${Number(saleCount[0].count)}`);
    console.log(`   📂 Categorías: ${Number(categoryCount[0].count)}`);
    console.log(`   📊 Movimientos de inventario: ${Number(inventoryCount[0].count)}`);
    console.log(`   📍 Direcciones de entrega: ${Number(deliveryCount[0].count)}\n`);

    // ====================================
    // PASO 4: Asignar registros a la compañía
    // ====================================
    console.log('📋 PASO 4: Asignando registros a la compañía por defecto...');

    // Solo intentar actualizar si hay registros
    if (Number(userCount[0].count) > 0) {
      console.log('   Actualizando usuarios...');
      await prisma.$executeRaw`
        UPDATE users 
        SET company_id = ${defaultCompanyId}
        WHERE company_id IS NULL
      `;
      console.log('   ✅ Usuarios actualizados');
    }

    if (Number(productCount[0].count) > 0) {
      console.log('   Actualizando productos...');
      await prisma.$executeRaw`
        UPDATE products 
        SET company_id = ${defaultCompanyId}
        WHERE company_id IS NULL
      `;
      console.log('   ✅ Productos actualizados');
    }

    if (Number(customerCount[0].count) > 0) {
      console.log('   Actualizando clientes...');
      await prisma.$executeRaw`
        UPDATE customers 
        SET company_id = ${defaultCompanyId}
        WHERE company_id IS NULL
      `;
      console.log('   ✅ Clientes actualizados');
    }

    if (Number(saleCount[0].count) > 0) {
      console.log('   Actualizando ventas...');
      await prisma.$executeRaw`
        UPDATE sales 
        SET company_id = ${defaultCompanyId}
        WHERE company_id IS NULL
      `;
      console.log('   ✅ Ventas actualizadas');
    }

    if (Number(categoryCount[0].count) > 0) {
      console.log('   Actualizando categorías...');
      await prisma.$executeRaw`
        UPDATE categories 
        SET company_id = ${defaultCompanyId}
        WHERE company_id IS NULL
      `;
      console.log('   ✅ Categorías actualizadas');
    }

    if (Number(inventoryCount[0].count) > 0) {
      console.log('   Actualizando movimientos de inventario...');
      await prisma.$executeRaw`
        UPDATE inventory_movements 
        SET company_id = ${defaultCompanyId}
        WHERE company_id IS NULL
      `;
      console.log('   ✅ Movimientos de inventario actualizados');
    }

    if (Number(deliveryCount[0].count) > 0) {
      console.log('   Actualizando direcciones de entrega...');
      await prisma.$executeRaw`
        UPDATE delivery_addresses 
        SET company_id = ${defaultCompanyId}
        WHERE company_id IS NULL
      `;
      console.log('   ✅ Direcciones de entrega actualizadas');
    }

    console.log('\n✨ ¡Migración completada exitosamente!\n');
    console.log('📝 Resumen:');
    console.log(`   - Compañía creada: ${defaultCompanyId}`);
    console.log(`   - Slug: ${companySlug}`);
    console.log(`   - Todos los registros asignados a la compañía por defecto\n`);
    console.log('⚠️  PRÓXIMO PASO: Ejecutar las migraciones de Prisma');
    console.log('   Comando: npx prisma migrate dev --name add_multi_tenant_support\n');

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
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
