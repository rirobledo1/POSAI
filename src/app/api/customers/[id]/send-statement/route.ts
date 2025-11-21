// API para enviar Estado de Cuenta por Email
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendAccountStatement } from '@/lib/email/emailService'
import { generateAccountStatementPDF } from '@/lib/pdf/accountStatement'

export async function POST(
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
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email es requerido' },
        { status: 400 }
      )
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Email inválido' },
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

    // Obtener datos del estado de cuenta
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

    const payments = await prisma.customerPayment.findMany({
      where: {
        customerId,
        companyId
      },
      select: {
        amount: true,
        paymentMethod: true,
        reference: true,
        paymentDate: true,
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

    // Obtener información de la empresa
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        name: true,
        address: true,
        phone: true,
        email: true,
        rfc: true
      }
    })

    // Calcular resumen
    const totalDebt = parseFloat(customer.currentDebt.toString())
    const creditLimit = parseFloat(customer.creditLimit.toString())
    const availableCredit = Math.max(0, creditLimit - totalDebt)

    // Calcular ventas vencidas
    const now = new Date()
    const overdueSales = creditSales.filter(sale => {
      if (!sale.dueDate) return false
      return new Date(sale.dueDate) < now
    })

    const overdueAmount = overdueSales.reduce((sum, sale) => {
      return sum + parseFloat(sale.remainingBalance.toString())
    }, 0)

    // Generar PDF
    const pdfData = {
      company: {
        name: company?.name || 'Mi Empresa',
        address: company?.address || '',
        phone: company?.phone || '',
        email: company?.email || '',
        rfc: company?.rfc || ''
      },
      customer: {
        name: customer.name,
        email: customer.email || '',
        phone: customer.phone || '',
        rfc: customer.rfc || '',
        creditLimit,
        currentDebt: totalDebt,
        availableCredit
      },
      sales: creditSales.map(sale => ({
        folio: sale.folio,
        createdAt: sale.createdAt.toISOString(),
        dueDate: sale.dueDate?.toISOString(),
        total: parseFloat(sale.total.toString()),
        amountPaid: parseFloat(sale.amountPaid.toString()),
        remainingBalance: parseFloat(sale.remainingBalance.toString()),
        paymentStatus: sale.paymentStatus
      })),
      payments: payments.map(payment => ({
        paymentDate: payment.paymentDate.toISOString(),
        amount: parseFloat(payment.amount.toString()),
        paymentMethod: payment.paymentMethod,
        reference: payment.reference || undefined,
        sale: payment.sale ? { folio: payment.sale.folio } : undefined
      })),
      generatedAt: new Date()
    }

    const doc = generateAccountStatementPDF(pdfData)
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
    const pdfFilename = `estado-cuenta-${customer.name.replace(/\s/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`

    // Enviar email
    const result = await sendAccountStatement({
      companyId,
      to: email,
      customerName: customer.name,
      creditLimit,
      currentDebt: totalDebt,
      availableCredit,
      pendingSales: creditSales.length,
      overdueAmount,
      pdfBuffer,
      pdfFilename,
      companyName: company?.name
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Error al enviar email' },
        { status: 500 }
      )
    }

    // Registrar el envío en la base de datos (opcional)
    await prisma.emailLog.create({
      data: {
        companyId,
        customerId,
        type: 'ACCOUNT_STATEMENT',
        recipient: email,
        subject: `Estado de Cuenta - ${company?.name || 'Mi Empresa'}`,
        status: 'SENT',
        messageId: result.messageId,
        sentAt: new Date()
      }
    }).catch(err => {
      // Si no existe la tabla EmailLog, solo logear
      console.warn('⚠️ No se pudo registrar el email log:', err.message)
    })

    return NextResponse.json({
      success: true,
      message: 'Estado de cuenta enviado exitosamente',
      email,
      messageId: result.messageId
    })

  } catch (error) {
    console.error('❌ Error enviando estado de cuenta:', error)
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}
