// src/app/tienda/[slug]/checkout/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useCartStore } from '@/store/cartStore'
import { 
  ArrowLeft, 
  CreditCard, 
  Truck, 
  Package, 
  FileText, 
  ShoppingBag,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'

interface Company {
  id: string
  name: string
  slug: string
  logo?: string
  allowOnlineQuotes: boolean
  allowOnlineSales: boolean
  taxRate: number
}

type OrderType = 'QUOTE' | 'SALE'
type PaymentMethod = 'STRIPE' | 'CASH_ON_DELIVERY'

export default function CheckoutPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  
  // Store
  const { items, getTotalPrice, clearCart } = useCartStore()
  
  // Estados
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  // Tipo de orden y método de pago
  const [orderType, setOrderType] = useState<OrderType>('QUOTE')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH_ON_DELIVERY')
  
  // Datos del cliente
  const [customer, setCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  })
  
  const [notes, setNotes] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)

  // Cargar datos de la empresa
  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const res = await fetch(`/api/public/store/${slug}`)
        if (res.ok) {
          const data = await res.json()
          setCompany(data)
          
          // Si no permite ventas, forzar cotización
          if (!data.allowOnlineSales) {
            setOrderType('QUOTE')
          }
        }
      } catch (error) {
        console.error('Error fetching company:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCompany()
  }, [slug])

  // Si el carrito está vacío, redirigir
  useEffect(() => {
    if (!loading && items.length === 0) {
      router.push(`/tienda/${slug}`)
    }
  }, [items, loading, slug, router])

  // Calcular totales
  const subtotal = getTotalPrice()
  const taxRate = company?.taxRate ? Number(company.taxRate) / 100 : 0.16
  const tax = subtotal * taxRate
  const total = subtotal + tax

  // Validar formulario
  const isFormValid = () => {
    return (
      customer.name.trim() !== '' &&
      customer.email.trim() !== '' &&
      customer.phone.trim() !== '' &&
      acceptTerms
    )
  }

  // Enviar orden
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isFormValid()) {
      toast.error('Por favor completa todos los campos requeridos')
      return
    }

    setSubmitting(true)

    try {
      const orderData = {
        companySlug: slug,
        type: orderType,
        paymentMethod: orderType === 'SALE' ? paymentMethod : undefined,
        customer: {
          name: customer.name.trim(),
          email: customer.email.trim().toLowerCase(),
          phone: customer.phone.trim(),
          address: orderType === 'SALE' && paymentMethod === 'CASH_ON_DELIVERY' 
            ? customer.address.trim() 
            : undefined
        },
        items: items.map(item => ({
          productId: item.productId,
          productName: item.productName,
          price: item.price,
          quantity: item.quantity
        })),
        notes: notes.trim() || undefined
      }

      const res = await fetch('/api/public/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Error al procesar la orden')
      }

      // Si requiere pago con Stripe
      if (data.requiresPayment) {
        // TODO: Integrar con Stripe PaymentForm
        // Por ahora, simular pago exitoso
        toast.success('Procesando pago...')
        
        // Aquí irá la integración con Stripe
        // const { paymentIntent } = await createPaymentIntent(data.paymentData)
        // await confirmPayment(paymentIntent)
        
        // Por ahora, redirigir a confirmación
        clearCart()
        router.push(`/tienda/${slug}/confirmacion?order=${data.order.orderNumber}&type=sale`)
        return
      }

      // Orden sin pago (cotización o contra entrega)
      toast.success(data.message)
      clearCart()
      
      const confirmationType = orderType === 'QUOTE' ? 'quote' : 'cod' // cod = cash on delivery
      router.push(`/tienda/${slug}/confirmacion?order=${data.order.orderNumber}&type=${confirmationType}`)

    } catch (error: any) {
      console.error('Error submitting order:', error)
      toast.error(error.message || 'Error al procesar la orden')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Checkout</h1>
              <p className="text-sm text-gray-500">{company?.name}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Columna izquierda - Formulario */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Tipo de orden */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-4">¿Qué deseas hacer?</h2>
                <div className="grid grid-cols-2 gap-4">
                  {/* Cotización */}
                  {company?.allowOnlineQuotes && (
                    <button
                      type="button"
                      onClick={() => setOrderType('QUOTE')}
                      className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2
                        ${orderType === 'QUOTE' 
                          ? 'border-blue-600 bg-blue-50' 
                          : 'border-gray-200 hover:border-blue-300'
                        }`}
                    >
                      <FileText className={`w-8 h-8 ${orderType === 'QUOTE' ? 'text-blue-600' : 'text-gray-400'}`} />
                      <span className={`font-medium ${orderType === 'QUOTE' ? 'text-blue-700' : 'text-gray-700'}`}>
                        Solicitar Cotización
                      </span>
                      <span className="text-xs text-gray-500">Sin compromiso</span>
                    </button>
                  )}
                  
                  {/* Venta */}
                  {company?.allowOnlineSales && (
                    <button
                      type="button"
                      onClick={() => setOrderType('SALE')}
                      className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2
                        ${orderType === 'SALE' 
                          ? 'border-green-600 bg-green-50' 
                          : 'border-gray-200 hover:border-green-300'
                        }`}
                    >
                      <ShoppingBag className={`w-8 h-8 ${orderType === 'SALE' ? 'text-green-600' : 'text-gray-400'}`} />
                      <span className={`font-medium ${orderType === 'SALE' ? 'text-green-700' : 'text-gray-700'}`}>
                        Comprar Ahora
                      </span>
                      <span className="text-xs text-gray-500">Entrega a domicilio</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Método de pago (solo para ventas) */}
              {orderType === 'SALE' && (
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h2 className="text-lg font-semibold mb-4">Método de Pago</h2>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Contra entrega */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('CASH_ON_DELIVERY')}
                      className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2
                        ${paymentMethod === 'CASH_ON_DELIVERY' 
                          ? 'border-green-600 bg-green-50' 
                          : 'border-gray-200 hover:border-green-300'
                        }`}
                    >
                      <Truck className={`w-8 h-8 ${paymentMethod === 'CASH_ON_DELIVERY' ? 'text-green-600' : 'text-gray-400'}`} />
                      <span className={`font-medium ${paymentMethod === 'CASH_ON_DELIVERY' ? 'text-green-700' : 'text-gray-700'}`}>
                        Contra Entrega
                      </span>
                      <span className="text-xs text-gray-500">Paga al recibir</span>
                    </button>
                    
                    {/* Tarjeta/Stripe */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('STRIPE')}
                      className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2
                        ${paymentMethod === 'STRIPE' 
                          ? 'border-blue-600 bg-blue-50' 
                          : 'border-gray-200 hover:border-blue-300'
                        }`}
                    >
                      <CreditCard className={`w-8 h-8 ${paymentMethod === 'STRIPE' ? 'text-blue-600' : 'text-gray-400'}`} />
                      <span className={`font-medium ${paymentMethod === 'STRIPE' ? 'text-blue-700' : 'text-gray-700'}`}>
                        Tarjeta
                      </span>
                      <span className="text-xs text-gray-500">Pago seguro</span>
                    </button>
                  </div>
                  
                  {paymentMethod === 'CASH_ON_DELIVERY' && (
                    <div className="mt-4 p-3 bg-yellow-50 rounded-lg flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-yellow-700">
                        El pago se realizará al momento de la entrega. Un asesor te contactará para confirmar tu pedido.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Datos del cliente */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-4">Tus Datos</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre completo *
                    </label>
                    <input
                      type="text"
                      value={customer.name}
                      onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Tu nombre"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={customer.email}
                        onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="tu@email.com"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Teléfono *
                      </label>
                      <input
                        type="tel"
                        value={customer.phone}
                        onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="664 123 4567"
                        required
                      />
                    </div>
                  </div>

                  {/* Dirección (solo para contra entrega) */}
                  {orderType === 'SALE' && paymentMethod === 'CASH_ON_DELIVERY' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Dirección de entrega *
                      </label>
                      <textarea
                        value={customer.address}
                        onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Calle, número, colonia, ciudad, CP"
                        rows={3}
                        required
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notas adicionales
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Instrucciones especiales, referencias, etc."
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              {/* Términos */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600">
                    Acepto los términos y condiciones de compra. 
                    {orderType === 'QUOTE' 
                      ? ' Entiendo que esto es una solicitud de cotización sin compromiso.'
                      : ' Entiendo que mi pedido será procesado y me contactarán para confirmar.'
                    }
                  </span>
                </label>
              </div>
            </div>

            {/* Columna derecha - Resumen */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl p-6 shadow-sm sticky top-24">
                <h2 className="text-lg font-semibold mb-4">Resumen</h2>
                
                {/* Productos */}
                <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
                  {items.map((item) => (
                    <div key={item.productId} className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {item.productName} x{item.quantity}
                      </span>
                      <span className="font-medium">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">IVA ({(taxRate * 100).toFixed(0)}%)</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>Total</span>
                    <span className="text-blue-600">${total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Botón de enviar */}
                <button
                  type="submit"
                  disabled={!isFormValid() || submitting}
                  className={`w-full mt-6 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2
                    ${isFormValid() && !submitting
                      ? orderType === 'QUOTE'
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Procesando...
                    </>
                  ) : orderType === 'QUOTE' ? (
                    <>
                      <FileText className="w-5 h-5" />
                      Solicitar Cotización
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      {paymentMethod === 'STRIPE' ? 'Pagar Ahora' : 'Confirmar Pedido'}
                    </>
                  )}
                </button>

                {/* Info adicional */}
                <div className="mt-4 text-xs text-gray-500 text-center">
                  {orderType === 'QUOTE' ? (
                    <p>Te enviaremos la cotización por email</p>
                  ) : paymentMethod === 'CASH_ON_DELIVERY' ? (
                    <p>Un asesor te contactará para confirmar</p>
                  ) : (
                    <p>Pago seguro con encriptación SSL</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
