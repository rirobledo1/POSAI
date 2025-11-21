// scripts/enable-online-store.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function enableOnlineStore() {
  try {
    console.log('🔍 Buscando empresas...\n')

    // Listar todas las empresas
    const companies = await prisma.company.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        onlineStoreEnabled: true,
        allowOnlineQuotes: true,
        allowOnlineSales: true
      }
    })

    if (companies.length === 0) {
      console.log('❌ No se encontraron empresas')
      return
    }

    console.log(`✅ Empresas encontradas: ${companies.length}\n`)
    companies.forEach((c, i) => {
      console.log(`${i + 1}. ${c.name} (${c.slug})`)
      console.log(`   Tienda Online: ${c.onlineStoreEnabled ? '✅ Habilitada' : '❌ Deshabilitada'}`)
      console.log(`   Cotizaciones: ${c.allowOnlineQuotes ? '✅' : '❌'}`)
      console.log(`   Ventas: ${c.allowOnlineSales ? '✅' : '❌'}\n`)
    })

    // Habilitar tienda para la primera empresa (ajusta el índice si necesitas otra)
    const companyToUpdate = companies[0]

    console.log(`🔄 Habilitando tienda online para: ${companyToUpdate.name}...\n`)

    const updated = await prisma.company.update({
      where: { id: companyToUpdate.id },
      data: {
        onlineStoreEnabled: true,
        allowOnlineQuotes: true,
        allowOnlineSales: true,
        onlinePaymentEnabled: true,
        paymentMode: 'mock'
      }
    })

    console.log('✅ Tienda online habilitada exitosamente!\n')
    console.log('📊 Configuración:')
    console.log(`   URL: /tienda/${updated.slug}`)
    console.log(`   Cotizaciones: ✅ Habilitadas`)
    console.log(`   Ventas: ✅ Habilitadas`)
    console.log(`   Pago: ✅ Habilitado (modo: ${updated.paymentMode})`)
    console.log('\n🔗 URLs para probar:')
    console.log(`   Config:    http://localhost:3000/api/tienda/${updated.slug}/config`)
    console.log(`   Productos: http://localhost:3000/api/tienda/${updated.slug}/productos`)
    console.log(`   Tienda:    http://localhost:3000/tienda/${updated.slug}`)

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

enableOnlineStore()
