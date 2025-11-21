// Utilidad para generar PDF de Estado de Cuenta
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface CompanyInfo {
  name: string
  address?: string
  phone?: string
  email?: string
  rfc?: string
}

interface CustomerInfo {
  name: string
  email?: string
  phone?: string
  rfc?: string
  creditLimit: number
  currentDebt: number
  availableCredit: number
}

interface Sale {
  folio: string
  createdAt: string
  dueDate?: string
  total: number
  amountPaid: number
  remainingBalance: number
  paymentStatus: string
}

interface Payment {
  paymentDate: string
  amount: number
  paymentMethod: string
  reference?: string
  sale?: {
    folio: string
  }
}

interface AccountStatementData {
  company: CompanyInfo
  customer: CustomerInfo
  sales: Sale[]
  payments: Payment[]
  generatedAt: Date
}

export function generateAccountStatementPDF(data: AccountStatementData): jsPDF {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  let yPos = 20

  // Colores corporativos
  const primaryColor = [59, 130, 246] // Azul
  const secondaryColor = [107, 114, 128] // Gris
  const accentColor = [16, 185, 129] // Verde
  const dangerColor = [239, 68, 68] // Rojo

  // ===== HEADER =====
  // Título principal
  doc.setFontSize(24)
  doc.setTextColor(...primaryColor)
  doc.setFont('helvetica', 'bold')
  doc.text('ESTADO DE CUENTA', pageWidth / 2, yPos, { align: 'center' })
  yPos += 10

  // Línea decorativa
  doc.setDrawColor(...primaryColor)
  doc.setLineWidth(0.5)
  doc.line(20, yPos, pageWidth - 20, yPos)
  yPos += 10

  // Información de la empresa
  doc.setFontSize(10)
  doc.setTextColor(...secondaryColor)
  doc.setFont('helvetica', 'bold')
  doc.text(data.company.name, 20, yPos)
  yPos += 5

  doc.setFont('helvetica', 'normal')
  if (data.company.rfc) {
    doc.text(`RFC: ${data.company.rfc}`, 20, yPos)
    yPos += 4
  }
  if (data.company.address) {
    doc.text(data.company.address, 20, yPos)
    yPos += 4
  }
  if (data.company.phone) {
    doc.text(`Tel: ${data.company.phone}`, 20, yPos)
    yPos += 4
  }
  if (data.company.email) {
    doc.text(`Email: ${data.company.email}`, 20, yPos)
    yPos += 4
  }

  // Fecha de generación (esquina derecha)
  const dateStr = new Date(data.generatedAt).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  doc.text(`Fecha: ${dateStr}`, pageWidth - 20, 40, { align: 'right' })

  yPos = 70

  // ===== INFORMACIÓN DEL CLIENTE =====
  doc.setFontSize(12)
  doc.setTextColor(...primaryColor)
  doc.setFont('helvetica', 'bold')
  doc.text('CLIENTE', 20, yPos)
  yPos += 7

  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'bold')
  doc.text(data.customer.name, 20, yPos)
  yPos += 5

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...secondaryColor)
  if (data.customer.rfc) {
    doc.text(`RFC: ${data.customer.rfc}`, 20, yPos)
    yPos += 4
  }
  if (data.customer.email) {
    doc.text(`Email: ${data.customer.email}`, 20, yPos)
    yPos += 4
  }
  if (data.customer.phone) {
    doc.text(`Tel: ${data.customer.phone}`, 20, yPos)
    yPos += 4
  }

  yPos += 5

  // ===== RESUMEN DE CRÉDITO =====
  // Cuadro con información de crédito
  const creditBoxY = yPos
  const boxHeight = 35
  const boxWidth = pageWidth - 40

  // Fondo del cuadro
  doc.setFillColor(249, 250, 251)
  doc.rect(20, creditBoxY, boxWidth, boxHeight, 'F')
  
  // Bordes
  doc.setDrawColor(...primaryColor)
  doc.setLineWidth(0.3)
  doc.rect(20, creditBoxY, boxWidth, boxHeight)

  yPos = creditBoxY + 8

  // Grid de 3 columnas
  const col1X = 30
  const col2X = pageWidth / 2
  const col3X = pageWidth - 70

  doc.setFontSize(9)
  doc.setTextColor(...secondaryColor)
  doc.text('Límite de Crédito', col1X, yPos)
  doc.text('Deuda Actual', col2X, yPos)
  doc.text('Crédito Disponible', col3X, yPos)
  yPos += 6

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  
  doc.setTextColor(...primaryColor)
  doc.text(`$${data.customer.creditLimit.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, col1X, yPos)
  
  doc.setTextColor(...dangerColor)
  doc.text(`$${data.customer.currentDebt.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, col2X, yPos)
  
  doc.setTextColor(...accentColor)
  doc.text(`$${data.customer.availableCredit.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, col3X, yPos)
  
  yPos += 8

  // Barra de progreso de uso de crédito
  const usagePercent = (data.customer.currentDebt / data.customer.creditLimit) * 100
  const barWidth = boxWidth - 20
  const barX = 30
  const barY = yPos

  // Fondo de la barra
  doc.setFillColor(229, 231, 235)
  doc.rect(barX, barY, barWidth, 4, 'F')

  // Barra de progreso
  const progressWidth = (barWidth * usagePercent) / 100
  if (usagePercent >= 90) {
    doc.setFillColor(...dangerColor)
  } else if (usagePercent >= 70) {
    doc.setFillColor(251, 191, 36) // Amarillo
  } else {
    doc.setFillColor(...accentColor)
  }
  doc.rect(barX, barY, progressWidth, 4, 'F')

  // Porcentaje
  doc.setFontSize(8)
  doc.setTextColor(...secondaryColor)
  doc.text(`${usagePercent.toFixed(1)}% utilizado`, barX + barWidth / 2, barY + 8, { align: 'center' })

  yPos += 15

  // ===== VENTAS PENDIENTES =====
  yPos += 10
  doc.setFontSize(12)
  doc.setTextColor(...primaryColor)
  doc.setFont('helvetica', 'bold')
  doc.text('VENTAS PENDIENTES', 20, yPos)
  yPos += 5

  if (data.sales.length > 0) {
    const salesTableData = data.sales.map(sale => [
      sale.folio,
      new Date(sale.createdAt).toLocaleDateString('es-MX'),
      sale.dueDate ? new Date(sale.dueDate).toLocaleDateString('es-MX') : '-',
      `$${parseFloat(sale.total.toString()).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
      `$${parseFloat(sale.amountPaid.toString()).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
      `$${parseFloat(sale.remainingBalance.toString()).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
      sale.paymentStatus === 'PENDING' ? 'Pendiente' : 
      sale.paymentStatus === 'PARTIAL' ? 'Parcial' : 'Pagado'
    ])

    autoTable(doc, {
      startY: yPos,
      head: [['Folio', 'Fecha', 'Vencimiento', 'Total', 'Pagado', 'Saldo', 'Estado']],
      body: salesTableData,
      theme: 'grid',
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 8
      },
      columnStyles: {
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right', textColor: dangerColor, fontStyle: 'bold' }
      },
      margin: { left: 20, right: 20 }
    })

    yPos = (doc as any).lastAutoTable.finalY + 10
  } else {
    doc.setFontSize(9)
    doc.setTextColor(...secondaryColor)
    doc.setFont('helvetica', 'italic')
    doc.text('No hay ventas pendientes', 20, yPos + 5)
    yPos += 15
  }

  // ===== HISTORIAL DE PAGOS =====
  // Verificar si necesitamos nueva página
  if (yPos > pageHeight - 80) {
    doc.addPage()
    yPos = 20
  }

  doc.setFontSize(12)
  doc.setTextColor(...primaryColor)
  doc.setFont('helvetica', 'bold')
  doc.text('HISTORIAL DE PAGOS', 20, yPos)
  yPos += 5

  if (data.payments.length > 0) {
    const paymentsTableData = data.payments.slice(0, 10).map(payment => [
      new Date(payment.paymentDate).toLocaleDateString('es-MX'),
      `$${parseFloat(payment.amount.toString()).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
      payment.paymentMethod,
      payment.reference || '-',
      payment.sale?.folio || 'General'
    ])

    autoTable(doc, {
      startY: yPos,
      head: [['Fecha', 'Monto', 'Método', 'Referencia', 'Venta']],
      body: paymentsTableData,
      theme: 'grid',
      headStyles: {
        fillColor: accentColor,
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 8
      },
      columnStyles: {
        1: { halign: 'right', textColor: accentColor, fontStyle: 'bold' }
      },
      margin: { left: 20, right: 20 }
    })

    yPos = (doc as any).lastAutoTable.finalY + 5

    if (data.payments.length > 10) {
      doc.setFontSize(8)
      doc.setTextColor(...secondaryColor)
      doc.setFont('helvetica', 'italic')
      doc.text(`Mostrando los últimos 10 pagos de ${data.payments.length} totales`, 20, yPos)
    }
  } else {
    doc.setFontSize(9)
    doc.setTextColor(...secondaryColor)
    doc.setFont('helvetica', 'italic')
    doc.text('No hay pagos registrados', 20, yPos + 5)
  }

  // ===== FOOTER =====
  const footerY = pageHeight - 20

  // Línea superior del footer
  doc.setDrawColor(...secondaryColor)
  doc.setLineWidth(0.3)
  doc.line(20, footerY - 5, pageWidth - 20, footerY - 5)

  // Texto del footer
  doc.setFontSize(8)
  doc.setTextColor(...secondaryColor)
  doc.setFont('helvetica', 'italic')
  doc.text(
    'Este documento es un estado de cuenta generado automáticamente',
    pageWidth / 2,
    footerY,
    { align: 'center' }
  )

  doc.text(
    `Generado: ${new Date(data.generatedAt).toLocaleString('es-MX')}`,
    pageWidth / 2,
    footerY + 4,
    { align: 'center' }
  )

  return doc
}
