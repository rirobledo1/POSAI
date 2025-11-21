// API para Estado de Cuenta de Cliente
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const companyId = session.user.companyId
    const customerId = params.id

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

    // Obtener ventas a crédito con saldo pendiente
    const creditSales = await prisma.sale.findMany({
      where: {
        customerId,
        companyId,
        paymentMethod: 'CREDITO',
        paymentStatus: {
          in: ['PENDING', 'PARTIAL', 'OVERDUE']
        }
      },
      select: {
        id: true,
        folio: true,
        total: true,
        amountPaid: true,
        remainingBalance: true,
        paymentStatus: true,
        dueDate: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Obtener historial de pagos
    const payments = await prisma.customerPayment.findMany({
      where: {
        customerId,
        companyId
      },
      select: {
        id: true,
        amount: true,
        paymentMethod: true,
        reference: true,
        paymentDate: true,
        notes: true,
        saleId: true,
        sale: {
          select: {
            folio: true
          }
        }
      },
      orderBy: {
        paymentDate: 'desc'
      },
      take: 50
    })

    // Calcular totales
    const totalDebt = parseFloat(customer.currentDebt.toString())
    const creditLimit = parseFloat(customer.creditLimit.toString())
    const availableCredit = Math.max(0, creditLimit - totalDebt)

    // Clasificar ventas por antigüedad
    const now = new Date()
    const overdueSales = creditSales.filter(sale => {
      if (!sale.dueDate) return false
      return new Date(sale.dueDate) < now
    })

    const dueSoonSales = creditSales.filter(sale => {
      if (!sale.dueDate) return false
      const daysUntilDue = Math.ceil((new Date(sale.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      return daysUntilDue > 0 && daysUntilDue <= 7
    })

    return NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        creditLimit,
        currentDebt: totalDebt,
        availableCredit
      },
      summary: {
        totalDebt,
        creditLimit,
        availableCredit,
        pendingSales: creditSales.length,
        overdueSales: overdueSales.length,
        dueSoon: dueSoonSales.length,
        totalPayments: payments.length
      },
      creditSales,
      payments
    })

  } catch (error) {
    console.error('❌ Error obteniendo estado de cuenta:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
