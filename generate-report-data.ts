// Script para generar datos de prueba para reportes
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function generateTestData() {
  try {
    console.log('\n📊 Generando datos de prueba para reportes...\n')

    // Obtener cliente y usuario
    const customer = await prisma.customer.findFirst({
      where: {
        name: {
          contains: 'Liz',
          mode: 'insensitive'
        }
      },
      include: {
        company: true
      }
    })

    if (!customer) {
      console.log('❌ Cliente no encontrado')
      return
    }

    const user = await prisma.user.findFirst({
      where: {
        companyId: customer.companyId,
        role: { in: ['ADMIN', 'VENDEDOR'] }
      }
    })

    if (!user) {
      console.log('❌ Usuario no encontrado')
      return
    }

    const products = await prisma.product.findMany({
      where: {
        companyId: customer.companyId,
        active: true,
        stock: { gt: 0 }
      },
      take: 5
    })

    if (products.length === 0) {
      console.log('❌ No hay productos disponibles')
      return
    }

    console.log(`✅ Cliente: ${customer.name}`)
    console.log(`✅ Productos disponibles: ${products.length}`)

    // Generar 10 ventas a crédito en los últimos 3 meses
    const salesData = []
    const now = new Date()
    
    for (let i = 0; i < 10; i++) {
      // Fecha aleatoria en los últimos 90 días
      const daysAgo = Math.floor(Math.random() * 90)
      const saleDate = new Date(now)
      saleDate.setDate(saleDate.getDate() - daysAgo)

      // Producto aleatorio
      const product = products[Math.floor(Math.random() * products.length)]
      const quantity = Math.floor(Math.random() * 3) + 1
      const subtotal = parseFloat(product.price.toString()) * quantity
      const tax = subtotal * 0.16
      const total = subtotal + tax

      const randomNumber = Math.floor(Math.random() * 90000000) + 10000000
      const folio = `V-${randomNumber}`

      salesData.push({
        folio,
        customerId: customer.id,
        userId: user.id,
        companyId: customer.companyId,
        paymentMethod: 'CREDITO',
        subtotal,
        tax,
        total,
        paidAmount: 0,
        changeAmount: 0,
        status: 'COMPLETED',
        amountPaid: 0,
        remainingBalance: total,
        paymentStatus: 'PENDING' as any,
        dueDate: new Date(saleDate.getTime() + 30 * 24 * 60 * 60 * 1000),
        createdAt: saleDate,
        updatedAt: saleDate,
        saleItems: {
          create: {
            productId: product.id,
            quantity,
            unitPrice: parseFloat(product.price.toString()),
            total: subtotal
          }
        }
      })
    }

    // Crear ventas
    console.log('\n📝 Creando ventas...')
    const sales = []
    for (const saleData of salesData) {
      const sale = await prisma.sale.create({
        data: saleData
      })
      sales.push(sale)
      console.log(`  ✅ ${sale.folio}: $${sale.total}`)
    }

    // Actualizar deuda del cliente
    const totalDebt = sales.reduce((sum, s) => sum + parseFloat(s.total.toString()), 0)
    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        currentDebt: totalDebt
      }
    })

    // Generar 15 pagos aleatorios
    console.log('\n💰 Generando pagos...')
    const paymentMethods = ['EFECTIVO', 'TRANSFERENCIA', 'TARJETA', 'CHEQUE']
    
    for (let i = 0; i < 15; i++) {
      const sale = sales[Math.floor(Math.random() * sales.length)]
      const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)]
      
      // Pago parcial o total
      const maxAmount = parseFloat(sale.remainingBalance.toString())
      if (maxAmount <= 0) continue
      
      const amount = Math.min(
        Math.random() < 0.5 
          ? maxAmount // Pago total
          : Math.random() * maxAmount, // Pago parcial
        maxAmount
      )

      // Fecha entre la venta y ahora
      const daysSinceSale = Math.floor((now.getTime() - new Date(sale.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      const daysAgo = Math.floor(Math.random() * Math.max(1, daysSinceSale))
      const paymentDate = new Date(now)
      paymentDate.setDate(paymentDate.getDate() - daysAgo)

      await prisma.$transaction(async (tx) => {
        // Crear pago
        await tx.customerPayment.create({
          data: {
            customerId: customer.id,
            saleId: sale.id,
            amount,
            paymentMethod,
            paymentDate,
            companyId: customer.companyId,
            userId: user.id
          }
        })

        // Actualizar venta
        const currentAmountPaid = parseFloat(sale.amountPaid.toString())
        const newAmountPaid = currentAmountPaid + amount
        const newRemainingBalance = parseFloat(sale.total.toString()) - newAmountPaid

        let newPaymentStatus: 'PENDING' | 'PARTIAL' | 'PAID' = 'PARTIAL'
        if (newRemainingBalance <= 0.01) {
          newPaymentStatus = 'PAID'
        }

        await tx.sale.update({
          where: { id: sale.id },
          data: {
            amountPaid: newAmountPaid,
            remainingBalance: Math.max(0, newRemainingBalance),
            paymentStatus: newPaymentStatus
          }
        })

        // Actualizar objeto local
        sale.amountPaid = newAmountPaid as any
        sale.remainingBalance = Math.max(0, newRemainingBalance) as any
      })

      console.log(`  ✅ Pago $${amount.toFixed(2)} - ${paymentMethod} - Venta ${sale.folio}`)
    }

    // Actualizar deuda final del cliente
    const finalSales = await prisma.sale.findMany({
      where: {
        customerId: customer.id,
        paymentStatus: { in: ['PENDING', 'PARTIAL'] }
      }
    })

    const finalDebt = finalSales.reduce((sum, s) => sum + parseFloat(s.remainingBalance.toString()), 0)
    await prisma.customer.update({
      where: { id: customer.id },
      data: { currentDebt: finalDebt }
    })

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ Datos de prueba generados exitosamente!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`📊 ${salesData.length} ventas creadas`)
    console.log(`💰 15 pagos registrados`)
    console.log(`📈 Deuda final del cliente: $${finalDebt.toFixed(2)}`)
    console.log('\n✅ Ahora puedes ver los reportes en: http://localhost:3000/reportes-cobranza')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  } catch (error) {
    console.error('❌ Error generando datos:', error)
  } finally {
    await prisma.$disconnect()
  }
}

generateTestData()
