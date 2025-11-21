// Script para corregir el pago anterior y aplicarlo a la venta
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixLastPayment() {
  try {
    console.log('\n🔧 Corrigiendo último pago...\n')

    // 1. Obtener el último pago sin venta asociada
    const lastPayment = await prisma.customerPayment.findFirst({
      where: {
        saleId: null
      },
      orderBy: { createdAt: 'desc' },
      include: {
        customer: true
      }
    })

    if (!lastPayment) {
      console.log('❌ No se encontró ningún pago sin venta asociada')
      return
    }

    console.log(`📝 Pago encontrado:`)
    console.log(`   ID: ${lastPayment.id}`)
    console.log(`   Cliente: ${lastPayment.customer.name}`)
    console.log(`   Monto: $${lastPayment.amount}`)
    console.log(`   Fecha: ${lastPayment.paymentDate.toLocaleDateString()}`)

    // 2. Buscar ventas pendientes del cliente
    const pendingSales = await prisma.sale.findMany({
      where: {
        customerId: lastPayment.customerId,
        paymentStatus: {
          in: ['PENDING', 'PARTIAL']
        },
        remainingBalance: {
          gt: 0
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    if (pendingSales.length === 0) {
      console.log('\n✅ No hay ventas pendientes para este cliente')
      console.log('   El pago queda como "Pago Anticipado"')
      return
    }

    console.log(`\n📋 Ventas pendientes encontradas: ${pendingSales.length}`)

    // 3. Aplicar el pago a las ventas
    let remainingAmount = parseFloat(lastPayment.amount.toString())

    await prisma.$transaction(async (tx) => {
      for (const sale of pendingSales) {
        if (remainingAmount <= 0) break

        const saleRemaining = parseFloat(sale.remainingBalance.toString())
        const amountToApply = Math.min(remainingAmount, saleRemaining)

        console.log(`\n   💰 Aplicando $${amountToApply} a venta ${sale.folio}`)

        // Actualizar el pago para asociarlo a esta venta
        // Como el pago ya existe, vamos a crear uno nuevo y eliminar el anterior
        await tx.customerPayment.create({
          data: {
            customerId: lastPayment.customerId,
            saleId: sale.id,
            amount: amountToApply,
            paymentMethod: lastPayment.paymentMethod,
            reference: lastPayment.reference,
            userId: lastPayment.userId,
            paymentDate: lastPayment.paymentDate,
            notes: lastPayment.notes ? `${lastPayment.notes} (Corregido)` : 'Pago aplicado a venta (corregido)',
            companyId: lastPayment.companyId,
            createdAt: lastPayment.createdAt
          }
        })

        // Actualizar la venta
        const currentAmountPaid = parseFloat(sale.amountPaid.toString())
        const newAmountPaid = currentAmountPaid + amountToApply
        const total = parseFloat(sale.total.toString())
        const newRemainingBalance = total - newAmountPaid

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

        console.log(`      ✅ Venta actualizada:`)
        console.log(`         Total: $${total}`)
        console.log(`         Pagado: $${newAmountPaid}`)
        console.log(`         Saldo: $${Math.max(0, newRemainingBalance)}`)
        console.log(`         Estado: ${newPaymentStatus}`)

        remainingAmount -= amountToApply
      }

      // Si aplicamos todo el pago, eliminar el original
      if (remainingAmount <= 0.01) {
        await tx.customerPayment.delete({
          where: { id: lastPayment.id }
        })
        console.log(`\n   🗑️  Pago original eliminado (reemplazado por el corregido)`)
      } else {
        // Si sobró dinero, actualizar el pago original con el sobrante
        await tx.customerPayment.update({
          where: { id: lastPayment.id },
          data: {
            amount: remainingAmount,
            notes: 'Pago anticipado a cuenta (sobrante)'
          }
        })
        console.log(`\n   💵 Pago original actualizado con sobrante: $${remainingAmount}`)
      }
    })

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ Pago corregido exitosamente!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    // Mostrar estado final
    const customer = await prisma.customer.findUnique({
      where: { id: lastPayment.customerId }
    })

    console.log(`📊 Estado final del cliente:`)
    console.log(`   Deuda: $${customer?.currentDebt}`)
    console.log(`   Crédito disponible: $${Number(customer?.creditLimit) - Number(customer?.currentDebt)}`)

  } catch (error) {
    console.error('❌ Error corrigiendo pago:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixLastPayment()
