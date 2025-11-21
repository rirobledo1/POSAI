// Utilidad para generar PDF de Cotización
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface CompanyInfo {
  name: string
  address?: string
  phone?: string
  email?: string
  rfc?: string
}

interface BranchInfo {
  name: string
  address?: string
  phone?: string
}

interface CustomerInfo {
  name: string
  email?: string
  phone?: string
  rfc?: string
  address?: string
}

interface QuotationItem {
  product: {
    name: string
    barcode?: string
  }
  description?: string
  quantity: number
  unitPrice: number
  discount: number
  subtotal: number
}

interface QuotationData {
  quotationNumber: string
  createdAt: Date | string
  validUntil: Date | string
  taxRate: number  // Tasa de IVA dinámica (16, 8, etc.)
  company: CompanyInfo
  branch: BranchInfo
  customer: CustomerInfo
  items: QuotationItem[]
  subtotal: number
  discount: number
  discountPercent?: number
  tax: number
  total: number
  notes?: string
  termsConditions?: string
  createdBy?: {
    name: string
  }
}

export async function generateQuotationPDF(data: QuotationData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      let yPos = 20

      // Colores corporativos
      const primaryColor = [59, 130, 246] // Azul
      const secondaryColor = [107, 114, 128] // Gris
      const accentColor = [16, 185, 129] // Verde
      const warningColor = [251, 191, 36] // Amarillo

      // ===== HEADER =====
      // Título principal
      doc.setFontSize(24)
      doc.setTextColor(...primaryColor)
      doc.setFont('helvetica', 'bold')
      doc.text('COTIZACIÓN', pageWidth / 2, yPos, { align: 'center' })
      yPos += 8

      // Número de cotización
      doc.setFontSize(14)
      doc.setTextColor(...secondaryColor)
      doc.text(`No. ${data.quotationNumber}`, pageWidth / 2, yPos, { align: 'center' })
      yPos += 10

      // Línea decorativa
      doc.setDrawColor(...primaryColor)
      doc.setLineWidth(0.5)
      doc.line(20, yPos, pageWidth - 20, yPos)
      yPos += 10

      // ===== INFORMACIÓN DE LA EMPRESA =====
      doc.setFontSize(12)
      doc.setTextColor(...primaryColor)
      doc.setFont('helvetica', 'bold')
      doc.text(data.company.name, 20, yPos)
      yPos += 6

      doc.setFontSize(9)
      doc.setTextColor(...secondaryColor)
      doc.setFont('helvetica', 'normal')
      
      if (data.company.rfc) {
        doc.text(`RFC: ${data.company.rfc}`, 20, yPos)
        yPos += 4
      }
      
      doc.setFont('helvetica', 'bold')
      doc.text(`Sucursal: ${data.branch.name}`, 20, yPos)
      yPos += 4
      
      doc.setFont('helvetica', 'normal')
      if (data.branch.address || data.company.address) {
        doc.text(data.branch.address || data.company.address || '', 20, yPos)
        yPos += 4
      }
      
      if (data.branch.phone || data.company.phone) {
        doc.text(`Tel: ${data.branch.phone || data.company.phone}`, 20, yPos)
        yPos += 4
      }
      
      if (data.company.email) {
        doc.text(`Email: ${data.company.email}`, 20, yPos)
        yPos += 4
      }

      // ===== FECHAS (esquina derecha) =====
      const dateY = 50
      doc.setFontSize(9)
      doc.setTextColor(...secondaryColor)
      
      const createdDate = new Date(data.createdAt).toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
      doc.text(`Fecha: ${createdDate}`, pageWidth - 20, dateY, { align: 'right' })
      
      const validDate = new Date(data.validUntil).toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
      doc.setTextColor(...warningColor)
      doc.setFont('helvetica', 'bold')
      doc.text(`Válida hasta: ${validDate}`, pageWidth - 20, dateY + 5, { align: 'right' })

      yPos = Math.max(yPos, dateY + 15)

      // ===== INFORMACIÓN DEL CLIENTE =====
      // Cuadro con fondo
      const clientBoxY = yPos
      const boxHeight = 30
      const boxWidth = pageWidth - 40

      doc.setFillColor(249, 250, 251)
      doc.rect(20, clientBoxY, boxWidth, boxHeight, 'F')
      doc.setDrawColor(...primaryColor)
      doc.setLineWidth(0.3)
      doc.rect(20, clientBoxY, boxWidth, boxHeight)

      yPos = clientBoxY + 7

      doc.setFontSize(10)
      doc.setTextColor(...primaryColor)
      doc.setFont('helvetica', 'bold')
      doc.text('CLIENTE', 25, yPos)
      yPos += 6

      doc.setFontSize(10)
      doc.setTextColor(0, 0, 0)
      doc.setFont('helvetica', 'bold')
      doc.text(data.customer.name, 25, yPos)
      
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(...secondaryColor)
      
      // Información en dos columnas
      const col2X = pageWidth / 2 + 10
      
      if (data.customer.rfc) {
        doc.text(`RFC: ${data.customer.rfc}`, 25, yPos + 5)
      }
      
      if (data.customer.email) {
        doc.text(`Email: ${data.customer.email}`, col2X, yPos)
      }
      
      if (data.customer.phone) {
        doc.text(`Tel: ${data.customer.phone}`, col2X, yPos + 5)
      }

      yPos = clientBoxY + boxHeight + 10

      // ===== TABLA DE PRODUCTOS =====
      doc.setFontSize(12)
      doc.setTextColor(...primaryColor)
      doc.setFont('helvetica', 'bold')
      doc.text('PRODUCTOS Y SERVICIOS', 20, yPos)
      yPos += 5

      const tableData = data.items.map((item, index) => {
        const productName = item.product.name
        const barcode = item.product.barcode ? `[${item.product.barcode}]` : ''
        const description = item.description ? `\n${item.description}` : ''
        
        return [
          (index + 1).toString(),
          `${productName}${barcode ? '\n' + barcode : ''}${description}`,
          item.quantity.toString(),
          `$${item.unitPrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
          item.discount > 0 
            ? `-$${item.discount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
            : '-',
          `$${item.subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
        ]
      })

      autoTable(doc, {
        startY: yPos,
        head: [['#', 'Descripción', 'Cant.', 'Precio Unit.', 'Desc.', 'Subtotal']],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: primaryColor,
          textColor: [255, 255, 255],
          fontSize: 9,
          fontStyle: 'bold',
          halign: 'center'
        },
        bodyStyles: {
          fontSize: 9
        },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 'auto' },
          2: { cellWidth: 20, halign: 'center' },
          3: { cellWidth: 30, halign: 'right' },
          4: { cellWidth: 25, halign: 'right' },
          5: { cellWidth: 30, halign: 'right', fontStyle: 'bold' }
        },
        margin: { left: 20, right: 20 },
        didParseCell: function(data) {
          // Color rojo para descuentos
          if (data.column.index === 4 && data.cell.raw !== '-') {
            data.cell.styles.textColor = [239, 68, 68]
          }
        }
      })

      yPos = (doc as any).lastAutoTable.finalY + 5

      // ===== TOTALES =====
      const totalsX = pageWidth - 75
      const totalsWidth = 55

      // Cuadro de totales
      doc.setFillColor(249, 250, 251)
      doc.rect(totalsX - 5, yPos, totalsWidth + 10, 35, 'F')
      doc.setDrawColor(...secondaryColor)
      doc.setLineWidth(0.2)
      doc.rect(totalsX - 5, yPos, totalsWidth + 10, 35)

      doc.setFontSize(9)
      doc.setTextColor(...secondaryColor)
      doc.setFont('helvetica', 'normal')

      yPos += 7

      // Subtotal
      doc.text('Subtotal:', totalsX, yPos)
      doc.text(
        `$${data.subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
        totalsX + totalsWidth,
        yPos,
        { align: 'right' }
      )
      yPos += 6

      // Descuento
      if (data.discount > 0) {
        doc.setTextColor(239, 68, 68)
        doc.text('Descuento:', totalsX, yPos)
        const discountText = data.discountPercent 
          ? `-$${data.discount.toLocaleString('es-MX', { minimumFractionDigits: 2 })} (${data.discountPercent}%)`
          : `-$${data.discount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
        doc.text(discountText, totalsX + totalsWidth, yPos, { align: 'right' })
        yPos += 6
      }

      // IVA
      doc.setTextColor(...secondaryColor)
      doc.text(`IVA (${data.taxRate}%):`, totalsX, yPos)
      doc.text(
        `${data.tax.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
        totalsX + totalsWidth,
        yPos,
        { align: 'right' }
      )
      yPos += 8

      // Línea separadora
      doc.setDrawColor(...primaryColor)
      doc.setLineWidth(0.5)
      doc.line(totalsX, yPos - 2, totalsX + totalsWidth, yPos - 2)

      // Total
      doc.setFontSize(12)
      doc.setTextColor(...primaryColor)
      doc.setFont('helvetica', 'bold')
      doc.text('TOTAL:', totalsX, yPos + 4)
      doc.text(
        `$${data.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
        totalsX + totalsWidth,
        yPos + 4,
        { align: 'right' }
      )

      yPos += 15

      // ===== TÉRMINOS Y CONDICIONES =====
      if (yPos > pageHeight - 70) {
        doc.addPage()
        yPos = 20
      }

      if (data.termsConditions) {
        doc.setFontSize(10)
        doc.setTextColor(...primaryColor)
        doc.setFont('helvetica', 'bold')
        doc.text('TÉRMINOS Y CONDICIONES', 20, yPos)
        yPos += 6

        doc.setFontSize(8)
        doc.setTextColor(...secondaryColor)
        doc.setFont('helvetica', 'normal')
        
        const splitTerms = doc.splitTextToSize(data.termsConditions, pageWidth - 45)
        doc.text(splitTerms, 25, yPos)
        yPos += (splitTerms.length * 4) + 8
      }

      // ===== NOTAS =====
      if (data.notes) {
        if (yPos > pageHeight - 40) {
          doc.addPage()
          yPos = 20
        }

        doc.setFontSize(10)
        doc.setTextColor(...primaryColor)
        doc.setFont('helvetica', 'bold')
        doc.text('NOTAS ADICIONALES', 20, yPos)
        yPos += 6

        doc.setFontSize(9)
        doc.setTextColor(...secondaryColor)
        doc.setFont('helvetica', 'normal')
        
        const splitNotes = doc.splitTextToSize(data.notes, pageWidth - 50)
        doc.text(splitNotes, 25, yPos)
        yPos += (splitNotes.length * 5) + 5
      }

      // ===== FOOTER =====
      const footerY = pageHeight - 25

      // Línea superior del footer
      doc.setDrawColor(...secondaryColor)
      doc.setLineWidth(0.3)
      doc.line(20, footerY - 5, pageWidth - 20, footerY - 5)

      // Texto del footer
      doc.setFontSize(8)
      doc.setTextColor(...secondaryColor)
      doc.setFont('helvetica', 'italic')
      doc.text(
        '¡Gracias por su preferencia!',
        pageWidth / 2,
        footerY,
        { align: 'center' }
      )

      if (data.createdBy) {
        doc.text(
          `Elaborada por: ${data.createdBy.name}`,
          20,
          footerY + 5
        )
      }

      doc.text(
        `Generada: ${new Date().toLocaleString('es-MX')}`,
        pageWidth - 20,
        footerY + 5,
        { align: 'right' }
      )

      // Convertir a Buffer
      const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
      resolve(pdfBuffer)
    } catch (error) {
      reject(error)
    }
  })
}
