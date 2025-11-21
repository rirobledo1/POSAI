const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function fixExistingDebt() {
  console.log('🔧 Corrigiendo adeudos existentes...')
  
  try {
    // 1. Buscar cliente Liz Hereyda
    const customer = await prisma.$queryRaw`
      SELECT * FROM customers 
      WHERE name ILIKE '%Liz Hereyda%' 
      LIMIT 1
    `
    
    if (!customer || customer.length === 0) {
      console.log('❌ Cliente no encontrado')
      return
    }
    
    console.log('👤 Cliente encontrado:', customer[0].name)
    console.log('   ID:', customer[0].id)
    console.log('   Adeudo actual:', customer[0].current_debt)
    
    // 2. Buscar todas sus ventas a crédito
    const creditSales = await prisma.$queryRaw`
      SELECT * FROM sales 
      WHERE customer_id = ${customer[0].id} 
      AND payment_method = 'CREDITO'
      ORDER BY created_at DESC
    `
    
    console.log(`\n📊 Ventas a crédito encontradas: ${creditSales.length}`)
    
    let totalDebt = 0
    creditSales.forEach((sale, index) => {
      console.log(`   ${index + 1}. Folio: ${sale.folio} - Total: $${sale.total}`)
      totalDebt += parseFloat(sale.total)
    })
    
    console.log(`\n💰 Total que debería ser el adeudo: $${totalDebt}`)
    console.log(`💰 Adeudo actual en BD: $${customer[0].current_debt}`)
    
    // 3. Corregir el adeudo si hay diferencia
    if (totalDebt !== parseFloat(customer[0].current_debt)) {
      console.log(`\n🔧 Corrigiendo adeudo de $${customer[0].current_debt} a $${totalDebt}`)
      
      await prisma.$queryRaw`
        UPDATE customers 
        SET current_debt = ${totalDebt}, updated_at = NOW()
        WHERE id = ${customer[0].id}
      `
      
      console.log('✅ Adeudo corregido exitosamente!')
      
      // Verificar la corrección
      const updatedCustomer = await prisma.$queryRaw`
        SELECT current_debt FROM customers WHERE id = ${customer[0].id}
      `
      
      console.log(`✅ Nuevo adeudo verificado: $${updatedCustomer[0].current_debt}`)
    } else {
      console.log('ℹ️  El adeudo ya está correcto')
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixExistingDebt()
