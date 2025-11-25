// Script para LIMPIAR la base de datos
// =====================================
// ⚠️ CUIDADO: Este script elimina datos
// =====================================

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
}

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  step: (msg) => console.log(`${colors.cyan}🔹 ${msg}${colors.reset}`),
  danger: (msg) => console.log(`${colors.red}🚨 ${msg}${colors.reset}`)
}

async function limpiarBaseDatos() {
  console.log('\n' + '='.repeat(80))
  console.log('🧹 LIMPIEZA DE BASE DE DATOS')
  console.log('='.repeat(80) + '\n')

  log.danger('⚠️  ADVERTENCIA: Este script eliminará datos de la base de datos')
  log.warning('Asegúrate de tener un backup si tienes datos importantes\n')

  try {
    await prisma.$connect()
    log.success('Conectado a la base de datos\n')

    // Mostrar estadísticas antes de limpiar
    log.step('Estadísticas ANTES de limpiar:\n')
    
    const stats = {
      companies: await prisma.company.count(),
      users: await prisma.user.count(),
      products: await prisma.product.count(),
      customers: await prisma.customer.count(),
      sales: await prisma.sale.count(),
      quotations: await prisma.quotation.count(),
      branches: await prisma.branch.count(),
      categories: await prisma.categories.count(),
      loginAttempts: await prisma.loginAttempt.count(),
    }

    console.log('📊 Registros actuales:')
    console.log(`   • Empresas: ${stats.companies}`)
    console.log(`   • Usuarios: ${stats.users}`)
    console.log(`   • Productos: ${stats.products}`)
    console.log(`   • Clientes: ${stats.customers}`)
    console.log(`   • Ventas: ${stats.sales}`)
    console.log(`   • Cotizaciones: ${stats.quotations}`)
    console.log(`   • Sucursales: ${stats.branches}`)
    console.log(`   • Categorías: ${stats.categories}`)
    console.log(`   • Intentos de login: ${stats.loginAttempts}`)
    console.log()

    // ============================================
    // LIMPIEZA EN ORDEN (respetando dependencias)
    // ============================================
    
    log.step('Iniciando limpieza en orden correcto...\n')

    // 1. Datos transaccionales (no tienen dependencias externas)
    log.info('1. Limpiando intentos de login...')
    await prisma.loginAttempt.deleteMany({})
    log.success('   Intentos de login eliminados')

    log.info('2. Limpiando logs de email...')
    await prisma.emailLog.deleteMany({})
    log.success('   Logs de email eliminados')

    log.info('3. Limpiando auditoría...')
    await prisma.auditLog.deleteMany({})
    log.success('   Logs de auditoría eliminados')

    // 2. Datos de cotizaciones (tienen items como dependencia)
    log.info('4. Limpiando items de cotizaciones...')
    await prisma.quotationItem.deleteMany({})
    log.success('   Items de cotizaciones eliminados')

    log.info('5. Limpiando cotizaciones...')
    await prisma.quotation.deleteMany({})
    log.success('   Cotizaciones eliminadas')

    // 3. Órdenes online
    log.info('6. Limpiando órdenes online...')
    await prisma.onlineOrder.deleteMany({})
    log.success('   Órdenes online eliminadas')

    log.info('7. Limpiando clientes de tienda online...')
    await prisma.storeCustomerAddress.deleteMany({})
    await prisma.storeCustomer.deleteMany({})
    log.success('   Clientes de tienda online eliminados')

    // 4. Ventas (tienen items y movimientos)
    log.info('8. Limpiando items de ventas...')
    await prisma.saleItem.deleteMany({})
    log.success('   Items de ventas eliminados')

    log.info('9. Limpiando pagos de clientes...')
    await prisma.customerPayment.deleteMany({})
    log.success('   Pagos eliminados')

    log.info('10. Limpiando ventas...')
    await prisma.sale.deleteMany({})
    log.success('   Ventas eliminadas')

    // 5. Inventario
    log.info('11. Limpiando movimientos de inventario...')
    await prisma.inventoryMovement.deleteMany({})
    log.success('   Movimientos de inventario eliminados')

    log.info('12. Limpiando transferencias de stock...')
    await prisma.stockTransferItem.deleteMany({})
    await prisma.stockTransfer.deleteMany({})
    log.success('   Transferencias de stock eliminadas')

    log.info('13. Limpiando productos por sucursal...')
    await prisma.branchProduct.deleteMany({})
    log.success('   Productos por sucursal eliminados')

    // 6. Productos e imágenes
    log.info('14. Limpiando imágenes de productos...')
    await prisma.productImage.deleteMany({})
    log.success('   Imágenes de productos eliminadas')

    log.info('15. Limpiando productos...')
    await prisma.product.deleteMany({})
    log.success('   Productos eliminados')

    // 7. Clientes
    log.info('16. Limpiando direcciones de entrega...')
    await prisma.deliveryAddress.deleteMany({})
    log.success('   Direcciones de entrega eliminadas')

    log.info('17. Limpiando clientes...')
    await prisma.customer.deleteMany({})
    log.success('   Clientes eliminados')

    // 8. Cajas
    log.info('18. Limpiando cierres de caja...')
    await prisma.cashRegisterClosure.deleteMany({})
    log.success('   Cierres de caja eliminados')

    // 9. Categorías
    log.info('19. Limpiando categorías...')
    await prisma.categories.deleteMany({})
    await prisma.productCategory.deleteMany({})
    log.success('   Categorías eliminadas')

    // 10. Suscripciones y pagos
    log.info('20. Limpiando historial de pagos...')
    await prisma.paymentHistory.deleteMany({})
    log.success('   Historial de pagos eliminado')

    log.info('21. Limpiando suscripciones...')
    await prisma.subscription.deleteMany({})
    log.success('   Suscripciones eliminadas')

    // 11. Sucursales
    log.info('22. Limpiando sucursales...')
    await prisma.branch.deleteMany({})
    log.success('   Sucursales eliminadas')

    // 12. Usuarios y sesiones
    log.info('23. Limpiando sesiones...')
    await prisma.session.deleteMany({})
    log.success('   Sesiones eliminadas')

    log.info('24. Limpiando cuentas OAuth...')
    await prisma.account.deleteMany({})
    log.success('   Cuentas OAuth eliminadas')

    log.info('25. Limpiando super admins...')
    await prisma.superAdmin.deleteMany({})
    log.success('   Super admins eliminados')

    log.info('26. Limpiando usuarios...')
    await prisma.user.deleteMany({})
    log.success('   Usuarios eliminados')

    // 13. Empresas y configuraciones
    log.info('27. Limpiando empresas...')
    await prisma.company.deleteMany({})
    log.success('   Empresas eliminadas')

    log.info('28. Limpiando configuraciones...')
    await prisma.companySettings.deleteMany({})
    log.success('   Configuraciones eliminadas')

    log.info('29. Limpiando tokens de verificación...')
    await prisma.verificationToken.deleteMany({})
    log.success('   Tokens de verificación eliminados')

    // Verificar limpieza
    console.log('\n' + '─'.repeat(80))
    log.step('Verificando limpieza...\n')

    const statsAfter = {
      companies: await prisma.company.count(),
      users: await prisma.user.count(),
      products: await prisma.product.count(),
      customers: await prisma.customer.count(),
      sales: await prisma.sale.count(),
      quotations: await prisma.quotation.count(),
      branches: await prisma.branch.count(),
      categories: await prisma.categories.count(),
      loginAttempts: await prisma.loginAttempt.count(),
    }

    console.log('📊 Registros DESPUÉS de limpiar:')
    console.log(`   • Empresas: ${statsAfter.companies}`)
    console.log(`   • Usuarios: ${statsAfter.users}`)
    console.log(`   • Productos: ${statsAfter.products}`)
    console.log(`   • Clientes: ${statsAfter.customers}`)
    console.log(`   • Ventas: ${statsAfter.sales}`)
    console.log(`   • Cotizaciones: ${statsAfter.quotations}`)
    console.log(`   • Sucursales: ${statsAfter.branches}`)
    console.log(`   • Categorías: ${statsAfter.categories}`)
    console.log(`   • Intentos de login: ${statsAfter.loginAttempts}`)
    console.log()

    const totalBefore = Object.values(stats).reduce((a, b) => a + b, 0)
    const totalAfter = Object.values(statsAfter).reduce((a, b) => a + b, 0)

    console.log('='.repeat(80))
    log.success(`✨ Base de datos limpiada exitosamente!`)
    console.log('='.repeat(80))
    console.log(`\n📊 Resumen:`)
    console.log(`   • Registros eliminados: ${totalBefore - totalAfter}`)
    console.log(`   • Registros restantes: ${totalAfter}`)
    console.log()

    log.warning('⚠️  IMPORTANTE: La base de datos está vacía')
    log.info('📝 Planes de suscripción: SIN MODIFICAR (se mantienen)')
    log.info('🏗️  Estructura de tablas: INTACTA')
    log.info('🔧 Migraciones de Prisma: INTACTAS')
    console.log()

    console.log('🎯 Siguientes pasos sugeridos:')
    console.log('   1. Ejecutar: node fix-all-features.js (actualizar planes)')
    console.log('   2. Crear primera empresa desde /register')
    console.log('   3. Poblar categorías: node seed-categories.js')
    console.log('   4. Poblar productos: node seed-products.js (opcional)')
    console.log()

  } catch (error) {
    log.error('Error durante la limpieza:')
    console.error(error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// CONFIRMACIÓN DE SEGURIDAD
console.log('\n' + '='.repeat(80))
console.log('🚨 ADVERTENCIA: Limpieza de Base de Datos')
console.log('='.repeat(80))
console.log()
console.log('Este script eliminará TODOS los datos de:')
console.log('  ❌ Empresas')
console.log('  ❌ Usuarios')
console.log('  ❌ Productos')
console.log('  ❌ Clientes')
console.log('  ❌ Ventas')
console.log('  ❌ Cotizaciones')
console.log('  ❌ Movimientos de inventario')
console.log('  ❌ TODO (excepto planes de suscripción)')
console.log()
console.log('✅ Se MANTENDRÁ:')
console.log('  ✅ Estructura de tablas')
console.log('  ✅ Planes de suscripción (subscription_plans)')
console.log('  ✅ Migraciones de Prisma')
console.log()
console.log('⚠️  Asegúrate de tener un backup antes de continuar')
console.log()

// Pedir confirmación
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
})

readline.question('¿Estás seguro de que quieres limpiar la base de datos? (escribe "SI ESTOY SEGURO" para confirmar): ', (respuesta) => {
  readline.close()
  
  if (respuesta === 'SI ESTOY SEGURO') {
    console.log()
    limpiarBaseDatos()
  } else {
    console.log('\n❌ Operación cancelada. No se eliminó nada.\n')
    process.exit(0)
  }
})
