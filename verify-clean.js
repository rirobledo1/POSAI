// Verificar que las tablas estén limpias
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function verifyCleanDatabase() {
  try {
    console.log('🔍 Verificando estado de la base de datos...\n')

    // Contar registros
    const salesCount = await prisma.sale.count()
    const saleItemsCount = await prisma.saleItem.count()
    const paymentsCount = await prisma.customerPayment.count()
    const customersWithDebt = await prisma.customer.count({
      where: { currentDebt: { gt: 0 } }
    })

    console.log('📊 Estado actual de la base de datos:')
    console.log(`   ✅ Ventas: ${salesCount}`)
    console.log(`   ✅ Items de venta: ${saleItemsCount}`)
    console.log(`   ✅ Pagos de clientes: ${paymentsCount}`)
    console.log(`   ✅ Clientes con deuda: ${customersWithDebt}`)

    if (salesCount === 0 && saleItemsCount === 0 && paymentsCount === 0 && customersWithDebt === 0) {
      console.log('\n🎉 ¡Base de datos limpia exitosamente!')
      console.log('✨ Lista para comenzar con ventas nuevas')
    } else {
      console.log('\n⚠️ Algunos datos no fueron eliminados:')
      if (salesCount > 0) console.log(`   - Ventas restantes: ${salesCount}`)
      if (saleItemsCount > 0) console.log(`   - Items restantes: ${saleItemsCount}`)
      if (paymentsCount > 0) console.log(`   - Pagos restantes: ${paymentsCount}`)
      if (customersWithDebt > 0) console.log(`   - Clientes con deuda: ${customersWithDebt}`)
    }

    // Verificar otros datos que deben mantenerse
    const customersCount = await prisma.customer.count()
    const productsCount = await prisma.product.count()
    const usersCount = await prisma.user.count()

    console.log('\n📋 Datos que se mantuvieron:')
    console.log(`   ✅ Clientes: ${customersCount}`)
    console.log(`   ✅ Productos: ${productsCount}`)
    console.log(`   ✅ Usuarios: ${usersCount}`)

  } catch (error) {
    console.error('❌ Error al verificar:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verifyCleanDatabase()
