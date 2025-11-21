// Servicio para enviar recordatorios automáticos de pagos
import { prisma } from '@/lib/prisma'
import { sendPaymentReminder } from '@/lib/email/emailService'

interface ReminderResult {
  companyId: string
  companyName: string
  totalReminders: number
  successCount: number
  errorCount: number
  errors: string[]
}

/**
 * Procesa recordatorios para todas las empresas que los tienen habilitados
 */
export async function processPaymentReminders(): Promise<ReminderResult[]> {
  console.log('🔔 [CRON] Iniciando proceso de recordatorios automáticos...')
  
  try {
    // Obtener empresas con recordatorios habilitados y email configurado
    const companies = await prisma.company.findMany({
      where: {
        remindersEnabled: true,
        emailConfigured: true
      },
      select: {
        id: true,
        name: true,
        reminderDaysBefore: true,
        reminderDaysAfter: true
      }
    })

    console.log(`📊 [CRON] ${companies.length} empresa(s) con recordatorios habilitados`)

    const results: ReminderResult[] = []

    for (const company of companies) {
      const result = await processCompanyReminders(company)
      results.push(result)
    }

    // Resumen general
    const totalReminders = results.reduce((sum, r) => sum + r.totalReminders, 0)
    const totalSuccess = results.reduce((sum, r) => sum + r.successCount, 0)
    const totalErrors = results.reduce((sum, r) => sum + r.errorCount, 0)

    console.log(`✅ [CRON] Proceso completado:`)
    console.log(`   - Total recordatorios: ${totalReminders}`)
    console.log(`   - Enviados: ${totalSuccess}`)
    console.log(`   - Errores: ${totalErrors}`)

    return results
  } catch (error) {
    console.error('❌ [CRON] Error en proceso de recordatorios:', error)
    throw error
  }
}

/**
 * Procesa recordatorios para una empresa específica
 */
async function processCompanyReminders(company: {
  id: string
  name: string
  reminderDaysBefore: number
  reminderDaysAfter: number[]
}): Promise<ReminderResult> {
  console.log(`🏢 [CRON] Procesando empresa: ${company.name}`)

  const result: ReminderResult = {
    companyId: company.id,
    companyName: company.name,
    totalReminders: 0,
    successCount: 0,
    errorCount: 0,
    errors: []
  }

  try {
    const now = new Date()
    
    // 1. Buscar ventas próximas a vencer
    const upcomingSales = await findUpcomingSales(company.id, company.reminderDaysBefore, now)
    
    // 2. Buscar ventas vencidas
    const overdueSales = await findOverdueSales(company.id, company.reminderDaysAfter, now)

    const allSales = [...upcomingSales, ...overdueSales]
    result.totalReminders = allSales.length

    console.log(`   📧 ${allSales.length} recordatorio(s) a enviar`)

    // 3. Enviar recordatorios
    for (const sale of allSales) {
      try {
        await sendSaleReminder(company.id, sale, now)
        result.successCount++
      } catch (error) {
        result.errorCount++
        const errorMsg = error instanceof Error ? error.message : 'Error desconocido'
        result.errors.push(`Venta ${sale.folio}: ${errorMsg}`)
        console.error(`   ❌ Error enviando recordatorio para ${sale.folio}:`, errorMsg)
      }
    }

  } catch (error) {
    console.error(`❌ Error procesando empresa ${company.name}:`, error)
    result.errorCount++
    result.errors.push(error instanceof Error ? error.message : 'Error desconocido')
  }

  return result
}

/**
 * Encuentra ventas próximas a vencer
 */
async function findUpcomingSales(companyId: string, daysBefore: number, now: Date) {
  const startDate = new Date(now)
  startDate.setDate(startDate.getDate() + daysBefore)
  startDate.setHours(0, 0, 0, 0)

  const endDate = new Date(startDate)
  endDate.setHours(23, 59, 59, 999)

  const sales = await prisma.sale.findMany({
    where: {
      companyId,
      paymentMethod: 'CREDITO',
      paymentStatus: 'PENDING',
      dueDate: {
        gte: startDate,
        lte: endDate
      },
      customer: {
        email: {
          not: null
        }
      }
    },
    include: {
      customer: {
        select: {
          name: true,
          email: true
        }
      }
    }
  })

  return sales.map(sale => ({
    ...sale,
    isOverdue: false,
    daysUntilDue: daysBefore
  }))
}

/**
 * Encuentra ventas vencidas que necesitan recordatorio
 */
async function findOverdueSales(companyId: string, daysAfter: number[], now: Date) {
  const results = []

  for (const days of daysAfter) {
    const targetDate = new Date(now)
    targetDate.setDate(targetDate.getDate() - days)
    targetDate.setHours(0, 0, 0, 0)

    const endDate = new Date(targetDate)
    endDate.setHours(23, 59, 59, 999)

    const sales = await prisma.sale.findMany({
      where: {
        companyId,
        paymentMethod: 'CREDITO',
        paymentStatus: {
          in: ['PENDING', 'PARTIAL', 'OVERDUE']
        },
        dueDate: {
          gte: targetDate,
          lte: endDate
        },
        customer: {
          email: {
            not: null
          }
        }
      },
      include: {
        customer: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    results.push(...sales.map(sale => ({
      ...sale,
      isOverdue: true,
      daysOverdue: days
    })))
  }

  return results
}

/**
 * Envía recordatorio de pago para una venta
 */
async function sendSaleReminder(
  companyId: string,
  sale: any,
  now: Date
) {
  if (!sale.customer?.email) {
    throw new Error('Cliente no tiene email')
  }

  // Verificar si ya se envió recordatorio hoy para esta venta
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)

  const existingLog = await prisma.emailLog.findFirst({
    where: {
      companyId,
      customerId: sale.customerId,
      type: sale.isOverdue ? 'OVERDUE_NOTICE' : 'PAYMENT_REMINDER',
      recipient: sale.customer.email,
      createdAt: {
        gte: today
      },
      metadata: {
        path: ['saleId'],
        equals: sale.id
      }
    }
  })

  if (existingLog) {
    console.log(`   ⏭️  Ya se envió recordatorio hoy para venta ${sale.folio}`)
    return
  }

  // Obtener nombre de la empresa
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { name: true }
  })

  // Enviar email
  const result = await sendPaymentReminder({
    companyId,
    to: sale.customer.email,
    customerName: sale.customer.name,
    dueDate: sale.dueDate ? new Date(sale.dueDate).toLocaleDateString('es-MX') : 'No especificada',
    amount: parseFloat(sale.remainingBalance.toString()),
    daysUntilDue: sale.daysUntilDue,
    daysOverdue: sale.daysOverdue,
    invoiceNumber: sale.folio,
    companyName: company?.name
  })

  if (!result.success) {
    throw new Error(result.error || 'Error enviando email')
  }

  // Registrar en log
  await prisma.emailLog.create({
    data: {
      companyId,
      customerId: sale.customerId,
      type: sale.isOverdue ? 'OVERDUE_NOTICE' : 'PAYMENT_REMINDER',
      recipient: sale.customer.email,
      subject: sale.isOverdue 
        ? `🔴 Pago Vencido - Factura ${sale.folio}`
        : `⚠️ Recordatorio de Pago - Factura ${sale.folio}`,
      status: 'SENT',
      messageId: result.messageId,
      sentAt: new Date(),
      metadata: {
        saleId: sale.id,
        saleFolio: sale.folio,
        amount: sale.remainingBalance.toString(),
        isOverdue: sale.isOverdue,
        daysUntilDue: sale.daysUntilDue,
        daysOverdue: sale.daysOverdue,
        automated: true
      }
    }
  })

  console.log(`   ✅ Recordatorio enviado: ${sale.folio} -> ${sale.customer.email}`)
}

/**
 * Obtiene estadísticas de recordatorios de una empresa
 */
export async function getReminderStats(companyId: string, days: number = 30) {
  const since = new Date()
  since.setDate(since.getDate() - days)

  const stats = await prisma.emailLog.groupBy({
    by: ['type', 'status'],
    where: {
      companyId,
      type: {
        in: ['PAYMENT_REMINDER', 'OVERDUE_NOTICE']
      },
      createdAt: {
        gte: since
      }
    },
    _count: {
      id: true
    }
  })

  return stats
}
