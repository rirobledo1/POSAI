import { useState, useCallback } from 'react'
import { useNotifications } from '@/components/ui/NotificationProvider'

export interface TicketSale {
  id: string
  folio: string
  total: number
  subtotal: number
  tax: number
  paymentMethod: string
  deliveryType: string
  status: string
  notes?: string
  createdAt: string
  paidAmount?: number
  changeAmount?: number
  customer?: {
    name: string
    email?: string
    phone?: string
    rfc?: string
  }
  user: {
    name: string
  }
  delivery?: {
    address1: string
    address2?: string
    city: string
    state: string
    postalCode?: string
    notes?: string
    fee: number
    status: string
  }
  saleItems: Array<{
    quantity: number
    unitPrice: number
    total: number
    product: {
      name: string
      description?: string
    }
  }>
}

export const useTickets = () => {
  const [loading, setLoading] = useState(false)
  const { showError, showSuccess, showWarning } = useNotifications()

  const fetchSaleForTicket = useCallback(async (saleId: string): Promise<TicketSale | null> => {
    setLoading(true)
    try {
      console.log('🎫 Cargando venta para ticket:', saleId)
      const response = await fetch(`/api/sales/${saleId}`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Error al cargar los detalles de la venta')
      }

      const data = await response.json()
      console.log('✅ Venta cargada:', data.sale)
      return data.sale
    } catch (error) {
      console.error('❌ Error cargando venta:', error)
      showError('Error al cargar la venta', error instanceof Error ? error.message : 'Error desconocido')
      return null
    } finally {
      setLoading(false)
    }
  }, [showError])

  // Función principal que combina cargar y imprimir
  const printTicket = useCallback(async (saleId: string) => {
    try {
      console.log('🖨️ Iniciando impresión de ticket para venta:', saleId)
      
      // Cargar los datos de la venta
      const sale = await fetchSaleForTicket(saleId)
      
      if (!sale) {
        throw new Error('No se pudieron cargar los datos de la venta')
      }
      
      // Generar el HTML del ticket
      const ticketHTML = generateTicketHTML(sale)
      
      // MÉTODO 1: Intentar usar iframe (más confiable, no requiere pop-ups)
      try {
        // Crear iframe oculto
        const printFrame = document.createElement('iframe')
        printFrame.style.position = 'fixed'
        printFrame.style.right = '0'
        printFrame.style.bottom = '0'
        printFrame.style.width = '0'
        printFrame.style.height = '0'
        printFrame.style.border = 'none'
        
        document.body.appendChild(printFrame)
        
        // Escribir contenido en el iframe
        const frameDoc = printFrame.contentWindow?.document
        if (!frameDoc) {
          throw new Error('No se pudo acceder al documento del iframe')
        }
        
        frameDoc.open()
        frameDoc.write(ticketHTML)
        frameDoc.close()
        
        // Esperar a que cargue e imprimir
        printFrame.onload = () => {
          setTimeout(() => {
            try {
              printFrame.contentWindow?.focus()
              printFrame.contentWindow?.print()
              
              // Remover iframe después de imprimir
              setTimeout(() => {
                document.body.removeChild(printFrame)
              }, 1000)
              
              showSuccess('Ticket enviado a imprimir', `Ticket ${sale.folio} listo para imprimir`)
              console.log('✅ Ticket enviado a impresora (método iframe)')
            } catch (printError) {
              console.error('Error al imprimir desde iframe:', printError)
              // Si falla, intentar método alternativo
              tryPopupMethod(sale, ticketHTML)
            }
          }, 250)
        }
      } catch (iframeError) {
        console.warn('Método iframe falló, intentando con pop-up:', iframeError)
        // Si el iframe falla, intentar con ventana pop-up
        tryPopupMethod(sale, ticketHTML)
      }
      
    } catch (error) {
      console.error('❌ Error al imprimir ticket:', error)
      showError(
        'Error al imprimir ticket',
        error instanceof Error ? error.message : 'Error desconocido al imprimir'
      )
      throw error
    }
  }, [fetchSaleForTicket, showError, showSuccess])

  // Método alternativo con ventana pop-up
  const tryPopupMethod = useCallback((sale: TicketSale, ticketHTML: string) => {
    try {
      const printWindow = window.open('', '_blank', 'width=800,height=600')
      
      if (!printWindow) {
        // Si los pop-ups están bloqueados, mostrar alternativa
        showWarning(
          'Pop-ups bloqueados',
          'Por favor, permite pop-ups para imprimir tickets. Usa el botón de descarga como alternativa.'
        )
        // Ofrecer descarga del ticket como alternativa
        downloadTicketAsHTML(sale, ticketHTML)
        return
      }

      printWindow.document.write(ticketHTML)
      printWindow.document.close()
      
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print()
        }, 250)
      }

      showSuccess('Ticket enviado a imprimir', `Ticket ${sale.folio} listo para imprimir`)
      console.log('✅ Ticket enviado a impresora (método pop-up)')
    } catch (error) {
      console.error('Error con método pop-up:', error)
      showError('Error al abrir ventana de impresión', 'Intenta permitir pop-ups en tu navegador')
    }
  }, [showError, showSuccess, showWarning])

  // Método alternativo: descargar como HTML
  const downloadTicketAsHTML = useCallback((sale: TicketSale, ticketHTML: string) => {
    const blob = new Blob([ticketHTML], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ticket-${sale.folio}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    showSuccess('Ticket descargado', 'Abre el archivo HTML y presiona Ctrl+P para imprimir')
  }, [showSuccess])

  const sendViaWhatsApp = useCallback(async (saleId: string) => {
    try {
      // Cargar los datos de la venta
      const sale = await fetchSaleForTicket(saleId)
      
      if (!sale) {
        throw new Error('No se pudieron cargar los datos de la venta')
      }
      
      if (!sale.customer?.phone) {
        showWarning('Sin teléfono', 'El cliente no tiene número de teléfono registrado')
        return
      }

      const message = `🧾 *TICKET DE COMPRA*
🏪 FERRETERÍA

📋 Folio: ${sale.folio}
👤 Cliente: ${sale.customer.name}
💰 Total: $${sale.total.toFixed(2)}
📅 Fecha: ${new Date(sale.createdAt).toLocaleDateString('es-MX')}

${sale.saleItems.map(item => 
  `• ${item.quantity}x ${item.product.name} - $${item.total.toFixed(2)}`
).join('\n')}

${sale.delivery ? `🚚 Entrega: ${sale.delivery.address1}, ${sale.delivery.city}` : ''}

¡Gracias por su compra! 🙏`

      const phone = sale.customer.phone.replace(/\D/g, '')
      const whatsappUrl = `https://wa.me/52${phone}?text=${encodeURIComponent(message)}`
      window.open(whatsappUrl, '_blank')
      
      showSuccess('WhatsApp abierto', 'El mensaje del ticket está listo para enviar')
    } catch (error) {
      console.error('Error al preparar WhatsApp:', error)
      showError('Error al preparar mensaje de WhatsApp')
    }
  }, [fetchSaleForTicket, showError, showSuccess, showWarning])

  return {
    loading,
    fetchSaleForTicket,
    printTicket,
    sendViaWhatsApp
  }
}

// Función auxiliar para generar HTML del ticket
const generateTicketHTML = (sale: TicketSale): string => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Ticket - ${sale.folio}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Courier New', monospace;
      font-size: 12px;
      line-height: 1.4;
      margin: 0;
      padding: 20px;
      max-width: 80mm;
      background: white;
    }
    .header {
      text-align: center;
      border-bottom: 2px dashed #000;
      padding-bottom: 10px;
      margin-bottom: 15px;
    }
    .header h1 {
      font-size: 18px;
      margin-bottom: 5px;
    }
    .header p {
      font-size: 10px;
      margin: 2px 0;
    }
    .section {
      border-bottom: 1px dashed #000;
      padding: 10px 0;
      margin-bottom: 10px;
    }
    .row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 3px;
      font-size: 11px;
    }
    .items h3 {
      font-size: 12px;
      margin-bottom: 8px;
      text-align: center;
    }
    .item {
      margin-bottom: 8px;
    }
    .item-name {
      font-weight: bold;
      margin-bottom: 2px;
    }
    .item-detail {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
    }
    .totals {
      padding: 10px 0;
    }
    .total-row {
      font-weight: bold;
      font-size: 13px;
      border-top: 2px solid #000;
      padding-top: 5px;
      margin-top: 5px;
    }
    .footer {
      text-align: center;
      margin-top: 15px;
      font-size: 10px;
      border-top: 2px dashed #000;
      padding-top: 10px;
    }
    .footer p {
      margin: 3px 0;
    }
    @media print {
      body { 
        margin: 0; 
        padding: 10px; 
      }
      @page {
        size: 80mm auto;
        margin: 0;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>FERRETERÍA</h1>
    <p>Dirección de la empresa</p>
    <p>Tel: (xxx) xxx-xxxx</p>
    <p>RFC: XXXXX-XXX</p>
  </div>
  
  <div class="section">
    <div class="row"><span>Folio:</span><span><strong>${sale.folio}</strong></span></div>
    <div class="row"><span>Fecha:</span><span>${new Date(sale.createdAt).toLocaleString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}</span></div>
    <div class="row"><span>Vendedor:</span><span>${sale.user.name}</span></div>
    ${sale.customer ? `<div class="row"><span>Cliente:</span><span>${sale.customer.name}</span></div>` : ''}
    ${sale.customer?.rfc ? `<div class="row"><span>RFC:</span><span>${sale.customer.rfc}</span></div>` : ''}
    <div class="row"><span>Pago:</span><span>${sale.paymentMethod}</span></div>
    <div class="row"><span>Entrega:</span><span>${sale.deliveryType}</span></div>
  </div>
  
  <div class="items section">
    <h3>═══ PRODUCTOS ═══</h3>
    ${sale.saleItems.map(item => `
      <div class="item">
        <div class="item-name">${item.product.name}</div>
        <div class="item-detail">
          <span>${item.quantity} x $${item.unitPrice.toFixed(2)}</span>
          <span><strong>$${item.total.toFixed(2)}</strong></span>
        </div>
        ${item.product.description ? `<div style="font-size: 9px; color: #666; margin-top: 2px;">${item.product.description}</div>` : ''}
      </div>
    `).join('')}
  </div>
  
  <div class="totals">
    <div class="row"><span>Subtotal:</span><span>$${sale.subtotal.toFixed(2)}</span></div>
    <div class="row"><span>IVA (16%):</span><span>$${sale.tax.toFixed(2)}</span></div>
    ${sale.delivery && sale.delivery.fee > 0 ? `<div class="row"><span>Envío:</span><span>$${sale.delivery.fee.toFixed(2)}</span></div>` : ''}
    <div class="row total-row"><span>TOTAL:</span><span>$${sale.total.toFixed(2)}</span></div>
    ${sale.paidAmount ? `
      <div class="row" style="margin-top: 5px;"><span>Efectivo:</span><span>$${sale.paidAmount.toFixed(2)}</span></div>
      ${sale.changeAmount ? `<div class="row"><span>Cambio:</span><span>$${sale.changeAmount.toFixed(2)}</span></div>` : ''}
    ` : ''}
  </div>
  
  ${sale.delivery ? `
  <div class="section">
    <h3 style="font-size: 12px; margin-bottom: 5px;">DIRECCIÓN DE ENTREGA</h3>
    <div style="font-size: 10px;">
      <div>${sale.delivery.address1}</div>
      ${sale.delivery.address2 ? `<div>${sale.delivery.address2}</div>` : ''}
      <div>${sale.delivery.city}, ${sale.delivery.state}</div>
      ${sale.delivery.postalCode ? `<div>CP: ${sale.delivery.postalCode}</div>` : ''}
      ${sale.delivery.notes ? `<div style="margin-top: 5px; font-style: italic;">Notas: ${sale.delivery.notes}</div>` : ''}
    </div>
  </div>
  ` : ''}
  
  <div class="footer">
    <p><strong>¡Gracias por su compra!</strong></p>
    <p>Conserve este ticket como comprobante</p>
    ${sale.notes ? `<p style="margin-top: 8px; font-style: italic;">${sale.notes}</p>` : ''}
    <p style="margin-top: 10px;">════════════════════</p>
    <p>www.ferreteria.com</p>
  </div>
  
  <script>
    // Auto-imprimir cuando la página esté completamente cargada
    window.onload = function() {
      // Pequeño delay para asegurar que todo esté renderizado
      setTimeout(function() {
        window.print();
      }, 100);
    };
  </script>
</body>
</html>
  `
}
