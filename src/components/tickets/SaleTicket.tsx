'use client'

import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Printer, Download, MessageCircle, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SaleTicketProps {
  sale: {
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
    customer?: {
      name: string
      email?: string
      phone?: string
    }
    user: {
      name: string
    }
    saleItems?: Array<{
      quantity: number
      unitPrice: number
      total: number
      product: {
        name: string
      }
    }>
  }
  company?: {
    name: string
    address?: string
    phone?: string
    email?: string
    rfc?: string
  }
  showActions?: boolean
  onPrint?: () => void
  onWhatsApp?: () => void
  onEmail?: () => void
}

export default function SaleTicket({ 
  sale, 
  company,
  showActions = true,
  onPrint,
  onWhatsApp, 
  onEmail 
}: SaleTicketProps) {
  
  const defaultCompany = {
    name: "FERRETERÍA",
    address: "Dirección de la empresa",
    phone: "Tel: (xxx) xxx-xxxx",
    email: "contacto@ferreteria.com",
    rfc: "RFC: XXXXXXXXXX"
  }

  const companyInfo = { ...defaultCompany, ...company }

  const handlePrint = () => {
    if (onPrint) {
      onPrint()
    } else {
      // Usar window.print() por defecto
      window.print()
    }
  }

  const handleWhatsApp = () => {
    if (onWhatsApp) {
      onWhatsApp()
    } else if (sale.customer?.phone) {
      // Crear mensaje básico para WhatsApp
      const message = `🧾 TICKET DE COMPRA
${companyInfo.name}

📋 Folio: ${sale.folio}
👤 Cliente: ${sale.customer.name}
💰 Total: ${formatCurrency(sale.total)}
📅 Fecha: ${format(new Date(sale.createdAt), 'dd/MM/yyyy HH:mm', { locale: es })}

¡Gracias por su compra! 🙏`

      const phone = sale.customer.phone.replace(/\D/g, '')
      const whatsappUrl = `https://wa.me/52${phone}?text=${encodeURIComponent(message)}`
      window.open(whatsappUrl, '_blank')
    }
  }

  return (
    <div className="max-w-sm mx-auto bg-white">
      {/* Acciones de impresión - solo se muestran en pantalla */}
      {showActions && (
        <div className="flex gap-2 mb-4 print:hidden">
          <Button 
            onClick={handlePrint}
            size="sm"
            variant="outline"
          >
            <Printer className="w-4 h-4 mr-2" />
            Imprimir
          </Button>
          
          {sale.customer?.phone && (
            <Button 
              onClick={handleWhatsApp}
              size="sm"
              variant="outline"
              className="bg-green-50 hover:bg-green-100 text-green-700"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              WhatsApp
            </Button>
          )}
          
          {sale.customer?.email && onEmail && (
            <Button 
              onClick={onEmail}
              size="sm"
              variant="outline"
              className="bg-blue-50 hover:bg-blue-100 text-blue-700"
            >
              <Mail className="w-4 h-4 mr-2" />
              Email
            </Button>
          )}
        </div>
      )}

      {/* Ticket imprimible */}
      <div className="ticket-content bg-white p-4 border border-gray-300 text-black font-mono text-sm">
        {/* Header */}
        <div className="text-center border-b border-gray-300 pb-3 mb-3">
          <h1 className="text-lg font-bold">{companyInfo.name}</h1>
          <p className="text-xs mt-1">{companyInfo.address}</p>
          <p className="text-xs">{companyInfo.phone}</p>
          <p className="text-xs">{companyInfo.email}</p>
          <p className="text-xs">{companyInfo.rfc}</p>
        </div>

        {/* Información de la venta */}
        <div className="border-b border-gray-300 pb-3 mb-3">
          <div className="flex justify-between">
            <span>Folio:</span>
            <span className="font-bold">{sale.folio}</span>
          </div>
          <div className="flex justify-between">
            <span>Fecha:</span>
            <span>{format(new Date(sale.createdAt), 'dd/MM/yyyy HH:mm', { locale: es })}</span>
          </div>
          <div className="flex justify-between">
            <span>Vendedor:</span>
            <span>{sale.user.name}</span>
          </div>
          {sale.customer && (
            <div className="flex justify-between">
              <span>Cliente:</span>
              <span>{sale.customer.name}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Pago:</span>
            <span>{sale.paymentMethod}</span>
          </div>
          <div className="flex justify-between">
            <span>Entrega:</span>
            <span>{sale.deliveryType}</span>
          </div>
        </div>

        {/* Items de la venta */}
        {sale.saleItems && sale.saleItems.length > 0 && (
          <div className="border-b border-gray-300 pb-3 mb-3">
            <h3 className="font-bold mb-2">PRODUCTOS</h3>
            {sale.saleItems.map((item, index) => (
              <div key={index} className="mb-2">
                <div className="flex justify-between">
                  <span className="text-xs">{item.product.name}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>{item.quantity} x {formatCurrency(item.unitPrice)}</span>
                  <span>{formatCurrency(item.total)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Totales */}
        <div className="border-b border-gray-300 pb-3 mb-3">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{formatCurrency(sale.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Impuestos:</span>
            <span>{formatCurrency(sale.tax)}</span>
          </div>
          {sale.delivery && sale.delivery.fee > 0 && (
            <div className="flex justify-between">
              <span>Costo envío:</span>
              <span>{formatCurrency(sale.delivery.fee)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg border-t border-gray-300 pt-1">
            <span>TOTAL:</span>
            <span>{formatCurrency(sale.total)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs">
          <p>¡Gracias por su compra!</p>
          <p className="mt-2">Conserve este ticket</p>
          {sale.notes && (
            <p className="mt-2 text-xs text-gray-600">
              {sale.notes}
            </p>
          )}
        </div>
      </div>

      {/* CSS para impresión */}
      <style jsx>{`
        @media print {
          .print\\:hidden {
            display: none !important;
          }
          .ticket-content {
            box-shadow: none !important;
            border: none !important;
            max-width: 80mm;
            font-size: 12px;
            line-height: 1.2;
          }
          body {
            margin: 0;
            padding: 0;
          }
        }
      `}</style>
    </div>
  )
}