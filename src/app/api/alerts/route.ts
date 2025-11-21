// API para Sistema de Alertas
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface Alert {
  id: string
  type: 'OVERDUE' | 'DUE_SOON' | 'CREDIT_LIMIT' | 'LOW_STOCK'
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  title: string
  message: string
  entityType: 'SALE' | 'CUSTOMER' | 'PRODUCT'
  entityId: string
  entityName: string
  actionUrl: string
  createdAt: Date
  metadata?: any
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const companyId = session.user.companyId
    const { searchParams } = new URL(request.url)
    
    // Filtros opcionales
    const type = searchParams.get('type') // Tipo específico de alerta
    const priority = searchParams.get('priority') // Prioridad específica

    const alerts: Alert[] = []
    const now = new Date()
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    // 1. VENTAS VENCIDAS (Prioridad ALTA)
    const overdueSales = await prisma.sale.findMany({
      where: {
        companyId,
        paymentMethod: 'CREDITO',
        paymentStatus: {
          in: ['PENDING', 'PARTIAL']
        },
        dueDate: {
          lt: now
        }
      },
      include: {
        customer: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        dueDate: 'asc'
      }
    })

    overdueSales.forEach(sale => {
      const daysOverdue = Math.floor((now.getTime() - new Date(sale.dueDate!).getTime()) / (1000 * 60 * 60 * 24))
      
      alerts.push({
        id: `overdue-${sale.id}`,
        type: 'OVERDUE',
        priority: 'HIGH',
        title: `Pago vencido hace ${daysOverdue} día${daysOverdue > 1 ? 's' : ''}`,
        message: `${sale.customer?.name || 'Cliente'} - Venta ${sale.folio} - ${sale.remainingBalance.toString()} pendiente`,
        entityType: 'SALE',
        entityId: sale.id,
        entityName: sale.folio,
        actionUrl: `/customers/${sale.customerId}`,
        createdAt: sale.dueDate!,
        metadata: {
          customerId: sale.customerId,
          customerName: sale.customer?.name,
          folio: sale.folio,
          amount: sale.remainingBalance.toString(),
          daysOverdue
        }
      })
    })

    // 2. VENTAS POR VENCER (Próximos 7 días) (Prioridad MEDIA)
    const dueSoonSales = await prisma.sale.findMany({
      where: {
        companyId,
        paymentMethod: 'CREDITO',
        paymentStatus: {
          in: ['PENDING', 'PARTIAL']
        },
        dueDate: {
          gte: now,
          lte: sevenDaysFromNow
        }
      },
      include: {
        customer: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        dueDate: 'asc'
      }
    })

    dueSoonSales.forEach(sale => {
      const daysUntilDue = Math.floor((new Date(sale.dueDate!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      
      alerts.push({
        id: `due-soon-${sale.id}`,
        type: 'DUE_SOON',
        priority: 'MEDIUM',
        title: `Vence en ${daysUntilDue} día${daysUntilDue > 1 ? 's' : ''}`,
        message: `${sale.customer?.name || 'Cliente'} - Venta ${sale.folio} - ${sale.remainingBalance.toString()} pendiente`,
        entityType: 'SALE',
        entityId: sale.id,
        entityName: sale.folio,
        actionUrl: `/customers/${sale.customerId}`,
        createdAt: sale.dueDate!,
        metadata: {
          customerId: sale.customerId,
          customerName: sale.customer?.name,
          folio: sale.folio,
          amount: sale.remainingBalance.toString(),
          daysUntilDue
        }
      })
    })

    // 3. CLIENTES EXCEDIENDO LÍMITE DE CRÉDITO (Prioridad ALTA)
    const customersOverLimit = await prisma.customer.findMany({
      where: {
        companyId,
        active: true,
        currentDebt: {
          gt: 0
        }
      }
    })

    customersOverLimit.forEach(customer => {
      const debt = parseFloat(customer.currentDebt.toString())
      const limit = parseFloat(customer.creditLimit.toString())
      const usagePercent = (debt / limit) * 100

      if (usagePercent >= 100) {
        // Excedió el límite
        const exceededAmount = debt - limit
        
        alerts.push({
          id: `credit-limit-${customer.id}`,
          type: 'CREDIT_LIMIT',
          priority: 'HIGH',
          title: `Límite de crédito excedido`,
          message: `${customer.name} - Debe ${debt.toFixed(2)} de ${limit.toFixed(2)} límite (${exceededAmount.toFixed(2)} excedido)`,
          entityType: 'CUSTOMER',
          entityId: customer.id,
          entityName: customer.name,
          actionUrl: `/customers/${customer.id}`,
          createdAt: customer.updatedAt,
          metadata: {
            debt,
            limit,
            exceeded: exceededAmount,
            usagePercent: usagePercent.toFixed(1)
          }
        })
      } else if (usagePercent >= 90) {
        // Cerca del límite (90-99%)
        alerts.push({
          id: `credit-warning-${customer.id}`,
          type: 'CREDIT_LIMIT',
          priority: 'MEDIUM',
          title: `Crédito al ${usagePercent.toFixed(0)}%`,
          message: `${customer.name} - Debe ${debt.toFixed(2)} de ${limit.toFixed(2)} límite`,
          entityType: 'CUSTOMER',
          entityId: customer.id,
          entityName: customer.name,
          actionUrl: `/customers/${customer.id}`,
          createdAt: customer.updatedAt,
          metadata: {
            debt,
            limit,
            usagePercent: usagePercent.toFixed(1)
          }
        })
      }
    })

    // 4. PRODUCTOS CON STOCK BAJO (Prioridad BAJA)
    const lowStockProducts = await prisma.product.findMany({
      where: {
        companyId,
        active: true,
        stock: {
          lte: prisma.product.fields.minStock
        }
      },
      orderBy: {
        stock: 'asc'
      },
      take: 20 // Limitar a 20 productos
    })

    lowStockProducts.forEach(product => {
      const priority = product.stock === 0 ? 'HIGH' : product.stock <= 3 ? 'MEDIUM' : 'LOW'
      
      alerts.push({
        id: `low-stock-${product.id}`,
        type: 'LOW_STOCK',
        priority,
        title: product.stock === 0 ? 'Sin stock' : 'Stock bajo',
        message: `${product.name} - ${product.stock} unidades (mínimo: ${product.minStock})`,
        entityType: 'PRODUCT',
        entityId: product.id,
        entityName: product.name,
        actionUrl: `/productos?edit=${product.id}`,
        createdAt: product.updatedAt,
        metadata: {
          stock: product.stock,
          minStock: product.minStock,
          barcode: product.barcode
        }
      })
    })

    // Filtrar por tipo si se especificó
    let filteredAlerts = alerts
    if (type) {
      filteredAlerts = filteredAlerts.filter(a => a.type === type)
    }
    if (priority) {
      filteredAlerts = filteredAlerts.filter(a => a.priority === priority)
    }

    // Ordenar por prioridad y fecha
    const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 }
    filteredAlerts.sort((a, b) => {
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      }
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    })

    // Resumen de alertas
    const summary = {
      total: filteredAlerts.length,
      byType: {
        OVERDUE: filteredAlerts.filter(a => a.type === 'OVERDUE').length,
        DUE_SOON: filteredAlerts.filter(a => a.type === 'DUE_SOON').length,
        CREDIT_LIMIT: filteredAlerts.filter(a => a.type === 'CREDIT_LIMIT').length,
        LOW_STOCK: filteredAlerts.filter(a => a.type === 'LOW_STOCK').length
      },
      byPriority: {
        HIGH: filteredAlerts.filter(a => a.priority === 'HIGH').length,
        MEDIUM: filteredAlerts.filter(a => a.priority === 'MEDIUM').length,
        LOW: filteredAlerts.filter(a => a.priority === 'LOW').length
      }
    }

    return NextResponse.json({
      success: true,
      summary,
      alerts: filteredAlerts
    })

  } catch (error) {
    console.error('❌ Error obteniendo alertas:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
