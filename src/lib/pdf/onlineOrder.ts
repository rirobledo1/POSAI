// Utilidad para generar PDF de Orden Online
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
  email: string
  phone: string
  address?: string
}

interface OrderItem {
  productName: string
  description?: string
  quantity: number
  price: number
  subtotal: number
}

interface OnlineOrderData {
  orderNumber: string
  type: 'QUOTE' | 'SALE'
  createdAt: Date | string
  taxRate: number
  company: CompanyInfo
  customer: CustomerInfo
  items: OrderItem[]
  subtotal: number
  tax: number
  total: number
  notes?: string
}

export async function generateOnlineOrderPDF(data: OnlineOrderData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      let yPos = 20

      // Colores corporativos
      const primaryColor = [59, 130, 246] as [number, number, number] // Azul
      const secondaryColor = [107, 114, 128] as [number, number, number] // Gris
      const accentColor = [16, 185, 129] as [number, number, number] // Verde
      const warningColor = [251, 191, 36] as [number, number, number] // Amarillo

      // ===== HEADER =====
      // Título principal
      doc.setFontSize(24)
      doc.setTextColor(...primaryColor)
      doc.setFont('helvetica', 'bold')
      
      const title = data.type === 'QUOTE' ? 'SOLICITUD DE COTIZACIÓN' : 'ORDEN DE COMPRA'
      doc.text(title, pageWidth / 2, yPos, { align: 'center' })
      yPos += 8

      // Número de orden
      doc.setFontSize(14)
      doc.setTextColor(...secondaryColor)
      doc.text(`No. ${data.orderNumber}`, pageWidth / 2, yPos, { align: 'center' })
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

      // ===== FECHAS (esquina derecha) =====
      const dateY = 50
      doc.setFontSize(9)
      doc.setTextColor(...secondaryColor)
      
      const createdDate = new Date(data.createdAt).toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
      doc.text(`Fecha: ${createdDate}`, pageWidth - 20, dateY, { align: 'right' })
      
      // Estado de la orden
      doc.setTextColor(...accentColor)
      doc.setFont('helvetica', 'bold')
      const statusText = data.type === 'QUOTE' ? 'Pendiente de cotizar' : 'Pendiente de pago'
      doc.text(`Estado: ${statusText}`, pageWidth - 20, dateY + 5, { align: 'right' })

      yPos = Math.max(yPos, dateY + 15)

      // ===== INFORMACIÓN DEL CLIENTE =====
      const clientBoxY = yPos
      const boxHeight = 35
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
      doc.text('DATOS DEL CLIENTE', 25, yPos)
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
      
      doc.text(`Email: ${data.customer.email}`, 25, yPos + 5)
      doc.text(`Tel: ${data.customer.phone}`, col2X, yPos + 5)
      
      if (data.customer.address) {
        yPos += 5
        doc.text(`Dirección: ${data.customer.address}`, 25, yPos + 5)
      }

      yPos = clientBoxY + boxHeight + 10

      // ===== TABLA DE PRODUCTOS =====
      doc.setFontSize(12)
      doc.setTextColor(...primaryColor)
      doc.setFont('helvetica', 'bold')
      doc.text('PRODUCTOS SOLICITADOS', 20, yPos)
      yPos += 5

      const tableData = data.items.map((item, index) => {
        return [
          (index + 1).toString(),
          item.productName + (item.description ? `\n${item.description}` : ''),
          item.quantity.toString(),
          `$${item.price.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
          `$${item.subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
        ]
      })

      autoTable(doc, {
        startY: yPos,
        head: [['#', 'Producto', 'Cant.', 'Precio Unit.', 'Subtotal']],
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
          3: { cellWidth: 35, halign: 'right' },
          4: { cellWidth: 35, halign: 'right', fontStyle: 'bold' }
        },
        margin: { left: 20, right: 20 }
      })

      yPos = (doc as any).lastAutoTable.finalY + 5

      // ===== TOTALES =====
      const totalsX = pageWidth - 75
      const totalsWidth = 55

      // Cuadro de totales
      doc.setFillColor(249, 250, 251)
      doc.rect(totalsX - 5, yPos, totalsWidth + 10, 30, 'F')
      doc.setDrawColor(...secondaryColor)
      doc.setLineWidth(0.2)
      doc.rect(totalsX - 5, yPos, totalsWidth + 10, 30)

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

      // IVA
      doc.text(`IVA (${data.taxRate}%):`, totalsX, yPos)
      doc.text(
        `$${data.tax.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
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

      yPos += 20

      // ===== NOTAS =====
      if (data.notes) {
        if (yPos > pageHeight - 60) {
          doc.addPage()
          yPos = 20
        }

        doc.setFontSize(10)
        doc.setTextColor(...primaryColor)
        doc.setFont('helvetica', 'bold')
        doc.text('NOTAS DEL CLIENTE', 20, yPos)
        yPos += 6

        doc.setFontSize(9)
        doc.setTextColor(...secondaryColor)
        doc.setFont('helvetica', 'normal')
        
        const splitNotes = doc.splitTextToSize(data.notes, pageWidth - 50)
        doc.text(splitNotes, 25, yPos)
        yPos += (splitNotes.length * 5) + 5
      }

      // ===== MENSAJE SEGÚN TIPO =====
      if (yPos > pageHeight - 50) {
        doc.addPage()
        yPos = 20
      }

      const messageBoxY = yPos
      const messageBoxHeight = 25

      if (data.type === 'QUOTE') {
        doc.setFillColor(254, 243, 199) // Amarillo claro
        doc.rect(20, messageBoxY, pageWidth - 40, messageBoxHeight, 'F')
        doc.setDrawColor(...warningColor)
        doc.rect(20, messageBoxY, pageWidth - 40, messageBoxHeight)

        doc.setFontSize(9)
        doc.setTextColor(146, 64, 14)
        doc.setFont('helvetica', 'bold')
        doc.text('SOLICITUD DE COTIZACIÓN', 25, messageBoxY + 8)
        doc.setFont('helvetica', 'normal')
        doc.text(
          'Nos pondremos en contacto con usted para proporcionarle una cotización formal.',
          25, 
          messageBoxY + 15
        )
      } else {
        doc.setFillColor(220, 252, 231) // Verde claro
        doc.rect(20, messageBoxY, pageWidth - 40, messageBoxHeight, 'F')
        doc.setDrawColor(...accentColor)
        doc.rect(20, messageBoxY, pageWidth - 40, messageBoxHeight)

        doc.setFontSize(9)
        doc.setTextColor(21, 128, 61)
        doc.setFont('helvetica', 'bold')
        doc.text('ORDEN DE COMPRA', 25, messageBoxY + 8)
        doc.setFont('helvetica', 'normal')
        doc.text(
          'Nos comunicaremos con usted para coordinar el pago y la entrega de su pedido.',
          25, 
          messageBoxY + 15
        )
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
        '¡Gracias por su preferencia!',
        pageWidth / 2,
        footerY,
        { align: 'center' }
      )

      doc.text(
        `Generado: ${new Date().toLocaleString('es-MX')}`,
        pageWidth - 20,
        footerY + 5,
        { align: 'right' }
      )

      if (data.company.phone) {
        doc.text(
          `Contacto: ${data.company.phone}`,
          20,
          footerY + 5
        )
      }

      // Convertir a Buffer
      const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
      resolve(pdfBuffer)
    } catch (error) {
      reject(error)
    }
  })
}
