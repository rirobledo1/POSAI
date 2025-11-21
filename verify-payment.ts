// Script para verificar el último pago registrado
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verifyLastPayment() {
  try {
    console.log('\n🔍 Verificando último pago registrado...\n')

    // 1. Obtener el último pago
    const lastPayment = await prisma.customerPayment.findFirst({
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            currentDebt: true,
            creditLimit: true
          }
        },
        sale: {
          select: {
            folio: true,
            total: true,
            amountPaid: true,
            remainingBalance: true,
            paymentStatus: true
          }
        }
      }
    })

    if (!lastPayment) {
      console.log('❌ No se encontró ningún pago registrado')
      return
    }

    console.log('✅ PAGO ENCONTRADO:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`ID del Pago:     ${lastPayment.id}`)
    console.log(`Cliente:         ${lastPayment.customer.name}`)
    console.log(`Monto:           $${lastPayment.amount}`)
    console.log(`Método:          ${lastPayment.paymentMethod}`)
    console.log(`Referencia:      ${lastPayment.reference || 'N/A'}`)
    console.log(`Fecha de Pago:   ${lastPayment.paymentDate.toLocaleDateString()}`)
    console.log(`Registrado:      ${lastPayment.createdAt.toLocaleString()}`)
    console.log(`Notas:           ${lastPayment.notes || 'Sin notas'}`)
    
    console.log('\n📊 ESTADO DEL CLIENTE:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`Deuda Actual:    $${lastPayment.customer.currentDebt}`)
    console.log(`Límite Crédito:  $${lastPayment.customer.creditLimit}`)
    console.log(`Crédito Disponible: $${Number(lastPayment.customer.creditLimit) - Number(lastPayment.customer.currentDebt)}`)

    if (lastPayment.sale) {
      console.log('\n🧾 VENTA ASOCIADA:')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log(`Folio:           ${lastPayment.sale.folio}`)
      console.log(`Total:           $${lastPayment.sale.total}`)
      console.log(`Pagado:          $${lastPayment.sale.amountPaid}`)
      console.log(`Saldo Restante:  $${lastPayment.sale.remainingBalance}`)
      console.log(`Estado:          ${lastPayment.sale.paymentStatus}`)
    } else {
      console.log('\n💵 PAGO A CUENTA GENERAL (sin venta específica)')
    }

    // 2. Obtener todas las ventas pendientes del cliente
    const pendingSales = await prisma.sale.findMany({
      where: {
        customerId: lastPayment.customerId,
        paymentStatus: {
          in: ['PENDING', 'PARTIAL']
        }
      },
      select: {
        folio: true,
        total: true,
        amountPaid: true,
        remainingBalance: true,
        paymentStatus: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    if (pendingSales.length > 0) {
      console.log('\n📋 VENTAS PENDIENTES DEL CLIENTE:')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      pendingSales.forEach(sale => {
        console.log(`\n  Folio: ${sale.folio}`)
        console.log(`  Total: $${sale.total}`)
        console.log(`  Pagado: $${sale.amountPaid}`)
        console.log(`  Saldo: $${sale.remainingBalance}`)
        console.log(`  Estado: ${sale.paymentStatus}`)
      })
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  } catch (error) {
    console.error('❌ Error al verificar pago:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verifyLastPayment()
