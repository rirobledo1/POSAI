// API para Estado de Cuenta de Cliente
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Obtener estado de cuenta completo de un cliente
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const companyId = session.user.companyId
    const { searchParams } = new URL(request.url)
    
    const customerId = searchParams.get('customerId')

    if (!customerId) {
      return NextResponse.json(
        { error: 'El ID del cliente es requerido' },
        { status: 400 }
      )
    }

    // Verificar que el cliente existe
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

    // Obtener todas las ventas a crédito del cliente
    const sales = await prisma.sale.findMany({
      where: {
        customerId,
        companyId,
        paymentMethod: 'CREDITO'
      },
      include: {
        saleItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        payments: {
          orderBy: {
            paymentDate: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Obtener pagos generales (sin venta asociada)
    const generalPayments = await prisma.customerPayment.findMany({
      where: {
        customerId,
        companyId,
        saleId: null
      },
      orderBy: {
        paymentDate: 'desc'
      }
    })

    // Calcular estadísticas
    const totalSales = sales.reduce((sum, sale) => 
      sum + parseFloat(sale.total.toString()), 0
    )

    const totalPaid = sales.reduce((sum, sale) => 
      sum + parseFloat(sale.amountPaid.toString()), 0
    ) + generalPayments.reduce((sum, payment) => 
      sum + parseFloat(payment.amount.toString()), 0
    )

    const totalPending = parseFloat(customer.currentDebt.toString())

    // Calcular antigüedad de saldos
    const now = new Date()
    const aging = {
      current: 0,      // 0-30 días
      days30: 0,       // 31-60 días
      days60: 0,       // 61-90 días
      days90Plus: 0    // 90+ días
    }

    sales.forEach(sale => {
      const remainingBalance = parseFloat(sale.remainingBalance.toString())
      if (remainingBalance > 0) {
        const daysOld = Math.floor((now.getTime() - new Date(sale.createdAt).getTime()) / (1000 * 60 * 60 * 24))
        
        if (daysOld <= 30) {
          aging.current += remainingBalance
        } else if (daysOld <= 60) {
          aging.days30 += remainingBalance
        } else if (daysOld <= 90) {
          aging.days60 += remainingBalance
        } else {
          aging.days90Plus += remainingBalance
        }
      }
    })

    // Organizar movimientos cronológicamente
    const movements: any[] = []

    // Agregar ventas como movimientos
    sales.forEach(sale => {
      movements.push({
        type: 'SALE',
        date: sale.createdAt,
        description: `Venta ${sale.folio}`,
        reference: sale.folio,
        saleId: sale.id,
        debit: parseFloat(sale.total.toString()),
        credit: 0,
        balance: 0 // Se calculará después
      })

      // Agregar pagos de la venta
      sale.payments.forEach(payment => {
        movements.push({
          type: 'PAYMENT',
          date: payment.paymentDate,
          description: `Pago de venta ${sale.folio}`,
          reference: payment.reference || payment.id,
          paymentId: payment.id,
          saleId: sale.id,
          debit: 0,
          credit: parseFloat(payment.amount.toString()),
          balance: 0,
          paymentMethod: payment.paymentMethod
        })
      })
    })

    // Agregar pagos generales
    generalPayments.forEach(payment => {
      movements.push({
        type: 'PAYMENT',
        date: payment.paymentDate,
        description: 'Pago a cuenta',
        reference: payment.reference || payment.id,
        paymentId: payment.id,
        debit: 0,
        credit: parseFloat(payment.amount.toString()),
        balance: 0,
        paymentMethod: payment.paymentMethod
      })
    })

    // Ordenar movimientos por fecha
    movements.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    // Calcular balance acumulado
    let runningBalance = 0
    movements.forEach(movement => {
      runningBalance += movement.debit - movement.credit
      movement.balance = runningBalance
    })

    return NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        creditLimit: parseFloat(customer.creditLimit.toString()),
        currentDebt: parseFloat(customer.currentDebt.toString()),
        availableCredit: parseFloat(customer.creditLimit.toString()) - parseFloat(customer.currentDebt.toString())
      },
      summary: {
        totalSales,
        totalPaid,
        totalPending,
        numberOfSales: sales.length,
        numberOfPayments: sales.reduce((sum, sale) => sum + sale.payments.length, 0) + generalPayments.length
      },
      aging,
      movements,
      sales: sales.map(sale => ({
        id: sale.id,
        folio: sale.folio,
        date: sale.createdAt,
        total: parseFloat(sale.total.toString()),
        amountPaid: parseFloat(sale.amountPaid.toString()),
        remainingBalance: parseFloat(sale.remainingBalance.toString()),
        paymentStatus: sale.paymentStatus,
        dueDate: sale.dueDate,
        items: sale.saleItems.map(item => ({
          productName: item.product.name,
          quantity: item.quantity,
          unitPrice: parseFloat(item.unitPrice.toString()),
          total: parseFloat(item.total.toString())
        })),
        payments: sale.payments.map(payment => ({
          id: payment.id,
          amount: parseFloat(payment.amount.toString()),
          paymentMethod: payment.paymentMethod,
          paymentDate: payment.paymentDate,
          reference: payment.reference,
          notes: payment.notes
        }))
      }))
    })

  } catch (error) {
    console.error('❌ Error en GET /api/customer-payments/account-statement:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
