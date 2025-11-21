// API para resumen rápido de alertas (para el badge del header)
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const companyId = session.user.companyId
    const now = new Date()

    // Obtener ventas vencidas (ALTA PRIORIDAD)
    const overdueSales = await prisma.sale.findMany({
      where: {
        companyId,
        paymentMethod: 'CREDITO',
        paymentStatus: {
          in: ['PENDING', 'PARTIAL', 'OVERDUE']
        },
        dueDate: {
          lt: now
        },
        remainingBalance: {
          gt: 0
        }
      },
      select: {
        id: true,
        folio: true,
        dueDate: true,
        remainingBalance: true,
        customer: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        dueDate: 'asc'
      },
      take: 5
    })

    // Obtener ventas por vencer (MEDIA PRIORIDAD)
    const sevenDaysFromNow = new Date(now)
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

    const dueSoonSales = await prisma.sale.findMany({
      where: {
        companyId,
        paymentMethod: 'CREDITO',
        paymentStatus: 'PENDING',
        dueDate: {
          gte: now,
          lte: sevenDaysFromNow
        },
        remainingBalance: {
          gt: 0
        }
      },
      select: {
        id: true,
        folio: true,
        dueDate: true,
        remainingBalance: true,
        customer: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        dueDate: 'asc'
      },
      take: 5
    })

    // Obtener clientes cerca del límite (MEDIA PRIORIDAD)
    const creditLimitAlerts = await prisma.customer.findMany({
      where: {
        companyId,
        active: true,
        creditLimit: {
          gt: 0
        },
        currentDebt: {
          gt: 0
        }
      },
      select: {
        id: true,
        name: true,
        creditLimit: true,
        currentDebt: true
      }
    })

    const nearLimitCustomers = creditLimitAlerts
      .filter(customer => {
        const usage = (parseFloat(customer.currentDebt.toString()) / parseFloat(customer.creditLimit.toString())) * 100
        return usage >= 80
      })
      .slice(0, 5)

    // Obtener productos con stock bajo (BAJA/MEDIA PRIORIDAD)
    const lowStockProducts = await prisma.product.findMany({
      where: {
        companyId,
        active: true,
        stock: {
          lte: prisma.product.fields.minStock
        }
      },
      select: {
        id: true,
        name: true,
        stock: true,
        minStock: true
      },
      orderBy: {
        stock: 'asc'
      },
      take: 5
    })

    // Construir array de alertas
    const alerts = []

    // Ventas vencidas (ALTA)
    for (const sale of overdueSales) {
      const daysOverdue = Math.floor((now.getTime() - new Date(sale.dueDate!).getTime()) / (1000 * 60 * 60 * 24))
      
      alerts.push({
        id: `overdue-${sale.id}`,
        type: 'OVERDUE_SALE',
        priority: 'HIGH',
        title: `${sale.customer.name} - ${sale.folio}`,
        description: `Vencida hace ${daysOverdue} día${daysOverdue !== 1 ? 's' : ''} - $${parseFloat(sale.remainingBalance.toString()).toLocaleString('es-MX')}`,
        link: `/customers/${sale.customer.id}`,
        data: {
          saleId: sale.id,
          customerId: sale.customer.id,
          daysOverdue
        },
        createdAt: sale.dueDate!.toISOString()
      })
    }

    // Ventas por vencer (MEDIA)
    for (const sale of dueSoonSales) {
      const daysUntilDue = Math.ceil((new Date(sale.dueDate!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      
      alerts.push({
        id: `due-soon-${sale.id}`,
        type: 'DUE_SOON',
        priority: 'MEDIUM',
        title: `${sale.customer.name} - ${sale.folio}`,
        description: `Vence en ${daysUntilDue} día${daysUntilDue !== 1 ? 's' : ''} - $${parseFloat(sale.remainingBalance.toString()).toLocaleString('es-MX')}`,
        link: `/customers/${sale.customer.id}`,
        data: {
          saleId: sale.id,
          customerId: sale.customer.id,
          daysUntilDue
        },
        createdAt: sale.dueDate!.toISOString()
      })
    }

    // Límites de crédito (MEDIA)
    for (const customer of nearLimitCustomers) {
      const usage = (parseFloat(customer.currentDebt.toString()) / parseFloat(customer.creditLimit.toString())) * 100
      
      alerts.push({
        id: `credit-${customer.id}`,
        type: 'CREDIT_LIMIT',
        priority: usage >= 95 ? 'HIGH' : 'MEDIUM',
        title: customer.name,
        description: `${Math.round(usage)}% del crédito utilizado - $${parseFloat(customer.currentDebt.toString()).toLocaleString('es-MX')} de $${parseFloat(customer.creditLimit.toString()).toLocaleString('es-MX')}`,
        link: `/customers/${customer.id}`,
        data: {
          customerId: customer.id,
          usage: Math.round(usage)
        },
        createdAt: new Date().toISOString()
      })
    }

    // Stock bajo (BAJA/MEDIA)
    for (const product of lowStockProducts) {
      const priority = product.stock === 0 ? 'HIGH' : product.stock <= 2 ? 'MEDIUM' : 'LOW'
      
      alerts.push({
        id: `stock-${product.id}`,
        type: 'LOW_STOCK',
        priority,
        title: product.name,
        description: `Stock: ${product.stock} unidad${product.stock !== 1 ? 'es' : ''} (mínimo: ${product.minStock})`,
        link: `/productos?search=${encodeURIComponent(product.name)}`,
        data: {
          productId: product.id,
          stock: product.stock,
          minStock: product.minStock
        },
        createdAt: new Date().toISOString()
      })
    }

    // Ordenar por prioridad: HIGH primero, luego MEDIUM, luego LOW
    const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 }
    alerts.sort((a, b) => priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder])

    // Tomar solo las primeras 10
    const topAlerts = alerts.slice(0, 10)

    // Calcular totales
    const total = alerts.length
    const high = alerts.filter(a => a.priority === 'HIGH').length
    const medium = alerts.filter(a => a.priority === 'MEDIUM').length

    return NextResponse.json({
      total,
      high,
      medium,
      alerts: topAlerts
    })

  } catch (error) {
    console.error('❌ Error obteniendo resumen de alertas:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
