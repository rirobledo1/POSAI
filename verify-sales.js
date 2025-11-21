// verify-sales.js - Verificar las ventas en la base de datos
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function verifySales() {
  console.log('🔍 Verificando ventas en la base de datos...\n')

  try {
    // Obtener todas las ventas
    const sales = await prisma.sale.findMany({
      include: {
        user: {
          select: { name: true, email: true, role: true }
        },
        customer: {
          select: { name: true, email: true }
        },
        saleItems: {
          include: {
            product: {
              select: { name: true, barcode: true, price: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    console.log(`📊 Total de ventas encontradas: ${sales.length}\n`)

    if (sales.length === 0) {
      console.log('❌ No se encontraron ventas en la base de datos')
      return
    }

    sales.forEach((sale, index) => {
      console.log(`🛒 Venta ${index + 1}:`)
      console.log(`  ID: ${sale.id}`)
      console.log(`  Folio: ${sale.folio}`)
      console.log(`  Usuario: ${sale.user?.name} (${sale.user?.email})`)
      console.log(`  Cliente: ${sale.customer?.name || 'Sin cliente'}`)
      console.log(`  Subtotal: $${sale.subtotal.toNumber()}`)
      console.log(`  Impuestos: $${sale.tax.toNumber()}`)
      console.log(`  Total: $${sale.total.toNumber()}`)
      console.log(`  Método de pago: ${sale.paymentMethod}`)
      console.log(`  Fecha: ${sale.createdAt}`)
      console.log(`  Items: ${sale.saleItems.length}`)
      
      sale.saleItems.forEach((item, itemIndex) => {
        console.log(`    ${itemIndex + 1}. ${item.product?.name} - Cantidad: ${item.quantity}, Precio: $${item.unitPrice.toNumber()}`)
      })
      console.log('')
    })

    // Verificar stats básicas
    const totalSales = sales.reduce((sum, sale) => sum + sale.total.toNumber(), 0)
    const totalToday = sales.filter(sale => {
      const today = new Date()
      const saleDate = new Date(sale.createdAt)
      return saleDate.toDateString() === today.toDateString()
    }).reduce((sum, sale) => sum + sale.total.toNumber(), 0)

    console.log('📈 Estadísticas:')
    console.log(`  Total ventas (todas): $${totalSales.toFixed(2)}`)
    console.log(`  Total ventas hoy: $${totalToday.toFixed(2)}`)
    console.log(`  Ventas hoy: ${sales.filter(sale => {
      const today = new Date()
      const saleDate = new Date(sale.createdAt)
      return saleDate.toDateString() === today.toDateString()
    }).length}`)

  } catch (error) {
    console.error('❌ Error verificando ventas:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verifySales()
