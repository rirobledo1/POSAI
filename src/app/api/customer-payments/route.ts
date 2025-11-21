// API para Pagos de Clientes (Cuentas por Cobrar)
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Obtener pagos (con filtros)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const companyId = session.user.companyId
    const { searchParams } = new URL(request.url)
    
    const customerId = searchParams.get('customerId')
    const saleId = searchParams.get('saleId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Construir filtros
    const where: any = {
      companyId
    }

    if (customerId) where.customerId = customerId
    if (saleId) where.saleId = saleId
    
    if (startDate || endDate) {
      where.paymentDate = {}
      if (startDate) where.paymentDate.gte = new Date(startDate)
      if (endDate) where.paymentDate.lte = new Date(endDate)
    }

    const payments = await prisma.customerPayment.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        },
        sale: {
          select: {
            id: true,
            folio: true,
            total: true,
            remainingBalance: true,
            paymentStatus: true,
          }
        }
      },
      orderBy: {
        paymentDate: 'desc'
      },
      take: limit
    })

    return NextResponse.json({
      success: true,
      payments
    })

  } catch (error) {
    console.error('❌ Error obteniendo pagos:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST - Registrar nuevo pago
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const companyId = session.user.companyId
    const userId = session.user.id

    const body = await request.json()
    const {
      customerId,
      saleId,
      amount,
      paymentMethod,
      reference,
      paymentDate,
      notes
    } = body

    // Validaciones
    if (!customerId || !amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Datos inválidos' },
        { status: 400 }
      )
    }

    // Verificar que el cliente existe y pertenece a la compañía
    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        companyId
      }
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      )
    }

    // Si se especifica una venta, verificar que existe
    let sale = null
    if (saleId) {
      sale = await prisma.sale.findFirst({
        where: {
          id: saleId,
          customerId,
          companyId
        }
      })

      if (!sale) {
        return NextResponse.json(
          { error: 'Venta no encontrada' },
          { status: 404 }
        )
      }

      // Verificar que el monto no exceda el saldo pendiente
      const remainingBalance = parseFloat(sale.remainingBalance.toString())
      if (amount > remainingBalance) {
        return NextResponse.json(
          { error: `El monto excede el saldo pendiente ($${remainingBalance.toFixed(2)})` },
          { status: 400 }
        )
      }
    }

    // Registrar el pago en una transacción
    const result = await prisma.$transaction(async (tx) => {
      let remainingAmount = amount
      const paymentsCreated = []

      // 2. Aplicar el pago según el caso
      if (saleId && sale) {
        // CASO A: Pago a venta específica
        const payment = await tx.customerPayment.create({
          data: {
            customerId,
            saleId,
            amount,
            paymentMethod: paymentMethod || 'EFECTIVO',
            reference,
            userId,
            paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
            notes,
            companyId
          }
        })
        paymentsCreated.push(payment)

        const currentAmountPaid = parseFloat(sale.amountPaid.toString())
        const newAmountPaid = currentAmountPaid + amount
        const total = parseFloat(sale.total.toString())
        const newRemainingBalance = total - newAmountPaid

        // Determinar nuevo estado de pago
        let newPaymentStatus = 'PARTIAL'
        if (newRemainingBalance <= 0) {
          newPaymentStatus = 'PAID'
        } else if (newAmountPaid === 0) {
          newPaymentStatus = 'PENDING'
        }

        await tx.sale.update({
          where: { id: saleId },
          data: {
            amountPaid: newAmountPaid,
            remainingBalance: Math.max(0, newRemainingBalance),
            paymentStatus: newPaymentStatus as any
          }
        })
      } else {
        // CASO B: Pago a cuenta general - Distribuir entre ventas pendientes (FIFO)
        console.log(`💰 Distribuyendo pago de ${amount} entre ventas pendientes...`)

        // Obtener ventas pendientes ordenadas por fecha (las más antiguas primero)
        const pendingSales = await tx.sale.findMany({
          where: {
            customerId,
            companyId,
            paymentStatus: {
              in: ['PENDING', 'PARTIAL']
            },
            remainingBalance: {
              gt: 0
            }
          },
          orderBy: {
            createdAt: 'asc' // FIFO - First In First Out
          }
        })

        if (pendingSales.length === 0) {
          // No hay ventas pendientes, crear pago general
          const payment = await tx.customerPayment.create({
            data: {
              customerId,
              saleId: null,
              amount,
              paymentMethod: paymentMethod || 'EFECTIVO',
              reference,
              userId,
              paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
              notes: notes || 'Pago anticipado a cuenta',
              companyId
            }
          })
          paymentsCreated.push(payment)
        } else {
          // Distribuir el pago entre las ventas pendientes
          for (const pendingSale of pendingSales) {
            if (remainingAmount <= 0) break

            const saleRemaining = parseFloat(pendingSale.remainingBalance.toString())
            const amountToApply = Math.min(remainingAmount, saleRemaining)

            // Crear registro de pago para esta venta
            const payment = await tx.customerPayment.create({
              data: {
                customerId,
                saleId: pendingSale.id,
                amount: amountToApply,
                paymentMethod: paymentMethod || 'EFECTIVO',
                reference,
                userId,
                paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
                notes: notes ? `${notes} (Auto-distribuido)` : 'Pago distribuido automáticamente',
                companyId
              }
            })
            paymentsCreated.push(payment)

            // Actualizar la venta
            const currentAmountPaid = parseFloat(pendingSale.amountPaid.toString())
            const newAmountPaid = currentAmountPaid + amountToApply
            const total = parseFloat(pendingSale.total.toString())
            const newRemainingBalance = total - newAmountPaid

            let newPaymentStatus = 'PARTIAL'
            if (newRemainingBalance <= 0.01) { // Tolerancia de 1 centavo
              newPaymentStatus = 'PAID'
            }

            await tx.sale.update({
              where: { id: pendingSale.id },
              data: {
                amountPaid: newAmountPaid,
                remainingBalance: Math.max(0, newRemainingBalance),
                paymentStatus: newPaymentStatus as any
              }
            })

            remainingAmount -= amountToApply
            console.log(`  ✅ Aplicado ${amountToApply} a venta ${pendingSale.folio}`)
          }

          // Si sobra dinero, crear un pago anticipado
          if (remainingAmount > 0.01) {
            const payment = await tx.customerPayment.create({
              data: {
                customerId,
                saleId: null,
                amount: remainingAmount,
                paymentMethod: paymentMethod || 'EFECTIVO',
                reference,
                userId,
                paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
                notes: notes ? `${notes} (Anticipado)` : 'Pago anticipado a cuenta',
                companyId
              }
            })
            paymentsCreated.push(payment)
            console.log(`  💵 Sobrante ${remainingAmount} como pago anticipado`)
          }
        }
      }

      // 3. Actualizar deuda del cliente
      const currentDebt = parseFloat(customer.currentDebt.toString())
      const newDebt = Math.max(0, currentDebt - amount)

      await tx.customer.update({
        where: { id: customerId },
        data: {
          currentDebt: newDebt
        }
      })

      return paymentsCreated[0] || null // Retornar el primer pago creado
    })

    console.log(`✅ Pago registrado: $${amount} de ${customer.name}`)

    return NextResponse.json({
      success: true,
      message: 'Pago registrado exitosamente',
      payment: result
    }, { status: 201 })

  } catch (error) {
    console.error('❌ Error registrando pago:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
