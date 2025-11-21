// API para Dashboard de Cuentas por Cobrar
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Obtener resumen de cuentas por cobrar
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const companyId = session.user.companyId

    // Obtener todos los clientes con deuda
    const customersWithDebt = await prisma.customer.findMany({
      where: {
        companyId,
        active: true,
        currentDebt: {
          gt: 0
        }
      },
      include: {
        sales: {
          where: {
            paymentMethod: 'CREDITO',
            remainingBalance: {
              gt: 0
            }
          },
          select: {
            id: true,
            folio: true,
            total: true,
            amountPaid: true,
            remainingBalance: true,
            paymentStatus: true,
            createdAt: true,
            dueDate: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
      orderBy: {
        currentDebt: 'desc'
      }
    })

    // Calcular métricas globales
    const totalReceivable = customersWithDebt.reduce((sum, customer) => 
      sum + parseFloat(customer.currentDebt.toString()), 0
    )

    const totalCreditLimit = customersWithDebt.reduce((sum, customer) => 
      sum + parseFloat(customer.creditLimit.toString()), 0
    )

    const totalCustomersWithDebt = customersWithDebt.length

    // Calcular antigüedad de saldos
    const now = new Date()
    const aging = {
      current: 0,      // 0-30 días
      days30: 0,       // 31-60 días
      days60: 0,       // 61-90 días
      days90Plus: 0    // 90+ días
    }

    let overdueAmount = 0
    let overdueCustomers = 0

    customersWithDebt.forEach(customer => {
      customer.sales.forEach(sale => {
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

          // Verificar vencimiento
          if (sale.dueDate && new Date(sale.dueDate) < now) {
            overdueAmount += remainingBalance
          }
        }
      })

      // Contar clientes con deuda vencida
      const hasOverdue = customer.sales.some(sale => 
        sale.dueDate && new Date(sale.dueDate) < now && parseFloat(sale.remainingBalance.toString()) > 0
      )
      if (hasOverdue) {
        overdueCustomers++
      }
    })

    // Top 5 clientes con mayor deuda
    const topDebtors = customersWithDebt.slice(0, 5).map(customer => ({
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      currentDebt: parseFloat(customer.currentDebt.toString()),
      creditLimit: parseFloat(customer.creditLimit.toString()),
      availableCredit: parseFloat(customer.creditLimit.toString()) - parseFloat(customer.currentDebt.toString()),
      pendingSales: customer.sales.length,
      oldestSale: customer.sales.length > 0 ? customer.sales[customer.sales.length - 1].createdAt : null
    }))

    // Obtener pagos recientes (últimos 10)
    const recentPayments = await prisma.customerPayment.findMany({
      where: {
        companyId
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true
          }
        },
        sale: {
          select: {
            id: true,
            folio: true
          }
        }
      },
      orderBy: {
        paymentDate: 'desc'
      },
      take: 10
    })

    // Formatear lista de clientes
    const customersList = customersWithDebt.map(customer => ({
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      currentDebt: parseFloat(customer.currentDebt.toString()),
      creditLimit: parseFloat(customer.creditLimit.toString()),
      availableCredit: parseFloat(customer.creditLimit.toString()) - parseFloat(customer.currentDebt.toString()),
      utilizationPercent: (parseFloat(customer.currentDebt.toString()) / parseFloat(customer.creditLimit.toString())) * 100,
      pendingSales: customer.sales.length,
      oldestSaleDate: customer.sales.length > 0 ? customer.sales[customer.sales.length - 1].createdAt : null,
      hasOverdue: customer.sales.some(sale => 
        sale.dueDate && new Date(sale.dueDate) < now && parseFloat(sale.remainingBalance.toString()) > 0
      ),
      sales: customer.sales.map(sale => ({
        id: sale.id,
        folio: sale.folio,
        total: parseFloat(sale.total.toString()),
        amountPaid: parseFloat(sale.amountPaid.toString()),
        remainingBalance: parseFloat(sale.remainingBalance.toString()),
        paymentStatus: sale.paymentStatus,
        date: sale.createdAt,
        dueDate: sale.dueDate,
        daysOld: Math.floor((now.getTime() - new Date(sale.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
        isOverdue: sale.dueDate ? new Date(sale.dueDate) < now : false
      }))
    }))

    return NextResponse.json({
      success: true,
      summary: {
        totalReceivable,
        totalCreditLimit,
        totalCustomersWithDebt,
        overdueAmount,
        overdueCustomers,
        utilizationPercent: totalCreditLimit > 0 ? (totalReceivable / totalCreditLimit) * 100 : 0
      },
      aging,
      topDebtors,
      recentPayments: recentPayments.map(payment => ({
        id: payment.id,
        customerName: payment.customer.name,
        customerId: payment.customer.id,
        amount: parseFloat(payment.amount.toString()),
        paymentMethod: payment.paymentMethod,
        paymentDate: payment.paymentDate,
        reference: payment.reference,
        saleFolio: payment.sale?.folio,
        notes: payment.notes
      })),
      customers: customersList
    })

  } catch (error) {
    console.error('❌ Error en GET /api/customer-payments/dashboard:', error)
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
