// Script para crear una venta a crédito de prueba
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createTestCreditSale() {
  try {
    console.log('\n🛒 Creando venta a crédito de prueba...\n')

    // 1. Obtener el cliente
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

    console.log(`✅ Cliente encontrado: ${customer.name}`)
    console.log(`   Deuda actual: $${customer.currentDebt}`)
    console.log(`   Límite: $${customer.creditLimit}`)

    // 2. Obtener un producto del catálogo
    const product = await prisma.product.findFirst({
      where: {
        companyId: customer.companyId,
        active: true,
        stock: {
          gt: 0
        }
      }
    })

    if (!product) {
      console.log('❌ No hay productos disponibles')
      return
    }

    // 3. Obtener un usuario vendedor
    const user = await prisma.user.findFirst({
      where: {
        companyId: customer.companyId,
        role: {
          in: ['ADMIN', 'VENDEDOR']
        }
      }
    })

    if (!user) {
      console.log('❌ Usuario no encontrado')
      return
    }

    // 4. Crear venta a crédito
    const quantity = 2
    const subtotal = parseFloat(product.price.toString()) * quantity
    const tax = subtotal * 0.16
    const total = subtotal + tax

    const sale = await prisma.$transaction(async (tx) => {
      // Generar folio
      const randomNumber = Math.floor(Math.random() * 90000000) + 10000000
      const folio = `V-${randomNumber}`

      // Crear venta
      const newSale = await tx.sale.create({
        data: {
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
          
          // Campos para crédito
          amountPaid: 0,
          remainingBalance: total,
          paymentStatus: 'PENDING',
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
          
          saleItems: {
            create: {
              productId: product.id,
              quantity,
              unitPrice: parseFloat(product.price.toString()),
              total: subtotal
            }
          }
        },
        include: {
          saleItems: true
        }
      })

      // Actualizar deuda del cliente
      await tx.customer.update({
        where: { id: customer.id },
        data: {
          currentDebt: {
            increment: total
          }
        }
      })

      // Reducir stock del producto
      await tx.product.update({
        where: { id: product.id },
        data: {
          stock: {
            decrement: quantity
          }
        }
      })

      // Registrar movimiento de inventario
      await tx.inventoryMovement.create({
        data: {
          product_id: product.id,
          sale_id: newSale.id,
          type: 'SALIDA',
          quantity: -quantity,
          previous_stock: product.stock,
          new_stock: product.stock - quantity,
          reason: 'Venta a crédito',
          companyId: customer.companyId
        }
      })

      return newSale
    })

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ Venta a crédito creada exitosamente!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`📄 Folio: ${sale.folio}`)
    console.log(`👤 Cliente: ${customer.name}`)
    console.log(`🛒 Producto: ${product.name} (${quantity} unidades)`)
    console.log(`💰 Total: $${total.toFixed(2)}`)
    console.log(`📅 Vence: ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}`)

    // Verificar estado final
    const updatedCustomer = await prisma.customer.findUnique({
      where: { id: customer.id }
    })

    console.log('\n📊 Estado del cliente:')
    console.log(`   Deuda nueva: $${updatedCustomer?.currentDebt}`)
    console.log(`   Crédito disponible: $${Number(updatedCustomer?.creditLimit) - Number(updatedCustomer?.currentDebt)}`)
    
    console.log('\n✅ Ahora puedes ver al cliente en /cuentas-por-cobrar')
    console.log('✅ Y probar el historial de pagos!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  } catch (error) {
    console.error('❌ Error creando venta:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestCreditSale()
