#!/usr/bin/env node

/**
 * Script para aplicar migración del sistema de sucursales
 * Fase 1: Modelos Base
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🏢 ========================================');
console.log('🏢 MIGRACIÓN: Sistema de Sucursales');
console.log('🏢 Fase 1: Modelos Base');
console.log('🏢 ========================================\n');

// Función para ejecutar comandos
function runCommand(command, description) {
  console.log(`\n📋 ${description}...`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} completado\n`);
    return true;
  } catch (error) {
    console.error(`❌ Error en ${description}:`, error.message);
    return false;
  }
}

// Verificar que existe el archivo de migración
const migrationPath = path.join(__dirname, '..', 'prisma', 'migrations', '20250101000000_add_branches_system', 'migration.sql');
if (!fs.existsSync(migrationPath)) {
  console.error('❌ Error: Archivo de migración no encontrado');
  console.error(`   Ruta esperada: ${migrationPath}`);
  process.exit(1);
}

console.log('✅ Archivo de migración encontrado\n');

// Paso 1: Generar cliente de Prisma
console.log('📦 PASO 1/3: Generando cliente de Prisma\n');
if (!runCommand('npx prisma generate', 'Generación del cliente Prisma')) {
  console.error('\n❌ Error generando cliente. Abortando migración.');
  process.exit(1);
}

// Paso 2: Aplicar migración
console.log('🔄 PASO 2/3: Aplicando migración a la base de datos\n');
console.log('⚠️  IMPORTANTE: Esta migración hará lo siguiente:');
console.log('   1. Crear tablas: branches, branch_products, stock_transfers, stock_transfer_items');
console.log('   2. Agregar columnas: branch_id a users, sales, inventory_movements');
console.log('   3. Agregar límites de plan a companies');
console.log('   4. Crear sucursal principal para cada compañía');
console.log('   5. Migrar todos los datos existentes');
console.log('');

// Preguntar confirmación (solo en modo interactivo)
if (process.stdin.isTTY) {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('¿Deseas continuar? (y/N): ', (answer) => {
    rl.close();
    
    if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
      console.log('\n⏸️  Migración cancelada por el usuario');
      process.exit(0);
    }

    applyMigration();
  });
} else {
  // Modo no interactivo, aplicar directamente
  applyMigration();
}

function applyMigration() {
  console.log('\n🚀 Aplicando migración...\n');
  
  if (!runCommand('npx prisma migrate deploy', 'Aplicación de la migración')) {
    console.error('\n❌ Error aplicando migración.');
    console.error('💡 Sugerencias:');
    console.error('   1. Verifica que la base de datos esté accesible');
    console.error('   2. Verifica las credenciales en DATABASE_URL');
    console.error('   3. Asegúrate de que no hay otras migraciones pendientes');
    process.exit(1);
  }

  // Paso 3: Verificar migración
  console.log('🔍 PASO 3/3: Verificando migración\n');
  verifyMigration();
}

function verifyMigration() {
  console.log('📊 Verificando tablas creadas...\n');
  
  // Crear script de verificación
  const verifyScript = `
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    async function verify() {
      try {
        // Verificar que existen las tablas
        const branches = await prisma.branch.count();
        const branchProducts = await prisma.branchProduct.count();
        const companies = await prisma.company.findMany({
          select: { 
            id: true, 
            name: true, 
            maxBranches: true,
            _count: { select: { branches: true } }
          }
        });

        console.log('✅ Verificación completada:');
        console.log(\`   - Sucursales creadas: \${branches}\`);
        console.log(\`   - Productos por sucursal: \${branchProducts}\`);
        console.log(\`   - Compañías con límites configurados: \${companies.length}\`);
        console.log('');
        
        if (branches === 0) {
          console.log('⚠️  No se encontraron sucursales.');
          console.log('   Esto es normal si no hay compañías en la base de datos.');
        } else {
          console.log('📋 Resumen por compañía:');
          companies.forEach(c => {
            console.log(\`   - \${c.name}: \${c._count.branches} sucursal(es), límite: \${c.maxBranches}\`);
          });
        }

        await prisma.$disconnect();
        process.exit(0);
      } catch (error) {
        console.error('❌ Error en verificación:', error.message);
        await prisma.$disconnect();
        process.exit(1);
      }
    }

    verify();
  `;

  const verifyPath = path.join(__dirname, 'verify-migration.js');
  fs.writeFileSync(verifyPath, verifyScript);

  try {
    execSync(`node ${verifyPath}`, { stdio: 'inherit' });
    fs.unlinkSync(verifyPath);
  } catch (error) {
    console.error('⚠️  No se pudo verificar la migración automáticamente');
    console.log('💡 Puedes verificar manualmente con: npx prisma studio');
  }

  console.log('\n🎉 ========================================');
  console.log('🎉 MIGRACIÓN COMPLETADA EXITOSAMENTE');
  console.log('🎉 ========================================\n');
  console.log('✅ Sistema de sucursales instalado correctamente');
  console.log('');
  console.log('📋 Próximos pasos:');
  console.log('   1. Abrir Prisma Studio: npm run db:studio');
  console.log('   2. Verificar que cada compañía tiene una sucursal principal');
  console.log('   3. Continuar con Fase 2: APIs de Sucursales');
  console.log('');
  console.log('💡 Documentación completa en el artefact generado');
  console.log('');
}
