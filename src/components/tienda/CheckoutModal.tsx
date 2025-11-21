// src/components/tienda/CheckoutModal.tsx
'use client'

import { useState, useEffect } from 'react'
import { X, User, Mail, Phone, MapPin, Loader2, Download, Send, CheckCircle, LogIn, UserPlus, UserX } from 'lucide-react'
import { useStoreAuthStore } from '@/store/storeAuthStore'
import StoreAuthModal from './StoreAuthModal'
import toast from 'react-hot-toast'

interface StoreConfig {
  company: {
    id: string
    name: string
    slug: string
    phone?: string
    email?: string
    logo?: string
    currency: string
    taxRate: number
  }
  store: {
    enabled: boolean
    url: string
    features: {
      canQuote: boolean
      canBuy: boolean
      hasPayment: boolean
      paymentMode: string
    }
  }
}

interface CustomerData {
  name: string
  email: string
  phone: string
  address?: string
}

interface OrderResult {
  success: boolean
  order?: {
    id: string
    orderNumber: string
    type: string
    totals: {
      subtotal: number
      tax: number
      total: number
    }
  }
  message?: string
  error?: string
}

type PaymentMethodType = 'CASH_ON_DELIVERY' | 'STRIPE'
type CheckoutMode = 'select' | 'guest' | 'auth' | 'form'

interface CheckoutModalProps {
  config: StoreConfig
  slug: string
  type: 'QUOTE' | 'SALE'
  items: any[]
  total: number
  onClose: () => void
  onSuccess: () => void
}

export default function CheckoutModal({
  config,
  slug,
  type,
  items,
  total,
  onClose,
  onSuccess
}: CheckoutModalProps) {
  const { isAuthenticated, customer: authCustomer, token } = useStoreAuthStore()
  
  // Estado del flujo
  const [checkoutMode, setCheckoutMode] = useState<CheckoutMode>(
    isAuthenticated ? 'form' : 'select'
  )
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  
  // Datos del formulario
  const [customer, setCustomer] = useState<CustomerData>({
    name: authCustomer?.name || '',
    email: authCustomer?.email || '',
    phone: authCustomer?.phone || '',
    address: ''
  })
  const [notes, setNotes] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('CASH_ON_DELIVERY')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [orderResult, setOrderResult] = useState<OrderResult | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [sendingEmail, setSendingEmail] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  // Actualizar datos si el usuario inicia sesión
  useEffect(() => {
    if (isAuthenticated && authCustomer) {
      setCustomer({
        name: authCustomer.name,
        email: authCustomer.email,
        phone: authCustomer.phone || '',
        address: authCustomer.defaultAddress 
          ? `${authCustomer.defaultAddress.street}, ${authCustomer.defaultAddress.colony || ''} ${authCustomer.defaultAddress.city}, ${authCustomer.defaultAddress.state} ${authCustomer.defaultAddress.postalCode || ''}`
          : ''
      })
      setCheckoutMode('form')
    }
  }, [isAuthenticated, authCustomer])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!customer.name.trim()) {
      newErrors.name = 'El nombre es requerido'
    }
    
    if (!customer.email.trim()) {
      newErrors.email = 'El email es requerido'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
      newErrors.email = 'Email inválido'
    }
    
    if (!customer.phone.trim()) {
      newErrors.phone = 'El teléfono es requerido'
    } else if (!/^[\d\s\-\+\(\)]{10,}$/.test(customer.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Teléfono inválido (mínimo 10 dígitos)'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }

      // Agregar token si está autenticado
      if (isAuthenticated && token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`/api/tienda/${slug}/orders`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          type,
          customer,
          items: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price
          })),
          notes,
          paymentMethod: type === 'SALE' ? paymentMethod : undefined
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al procesar la orden')
      }

      setOrderResult(result)
      setSuccess(true)
      
      toast.success(
        type === 'QUOTE' 
          ? '¡Cotización enviada!' 
          : '¡Orden creada!'
      )

    } catch (error) {
      console.error('Error:', error)
      toast.error(error instanceof Error ? error.message : 'Error al procesar')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = () => {
    if (!orderResult?.order?.id) return
    
    const url = `/api/tienda/${slug}/orders/${orderResult.order.id}/pdf`
    window.open(url, '_blank')
    toast.success('Descargando PDF...')
  }

  const handleSendEmail = async () => {
    if (!orderResult?.order?.id || sendingEmail) return
    
    setSendingEmail(true)
    
    try {
      const response = await fetch(`/api/tienda/${slug}/orders/${orderResult.order.id}/send-email`, {
        method: 'POST'
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Error al enviar email')
      }
      
      setEmailSent(true)
      toast.success('Email enviado exitosamente')
    } catch (error) {
      console.error('Error:', error)
      toast.error(error instanceof Error ? error.message : 'Error al enviar email')
    } finally {
      setSendingEmail(false)
    }
  }

  const handleAuthSuccess = () => {
    setShowAuthModal(false)
    // Los datos se actualizan automáticamente por el useEffect
  }

  // Vista de selección de modo
  if (checkoutMode === 'select') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
          {/* Header */}
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="text-lg font-bold">
              {type === 'QUOTE' ? '📝 Solicitar Cotización' : '🛒 Completar Compra'}
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Opciones */}
          <div className="p-4 space-y-3">
            <p className="text-gray-600 text-center mb-4">
              ¿Cómo deseas continuar?
            </p>

            {/* Iniciar sesión */}
            <button
              onClick={() => {
                setAuthMode('login')
                setShowAuthModal(true)
              }}
              className="w-full flex items-center gap-3 p-4 border-2 border-blue-500 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <LogIn className="h-5 w-5 text-white" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-blue-700">Iniciar sesión</div>
                <div className="text-sm text-blue-600">
                  Accede a tu cuenta y datos guardados
                </div>
              </div>
            </button>

            {/* Crear cuenta */}
            <button
              onClick={() => {
                setAuthMode('register')
                setShowAuthModal(true)
              }}
              className="w-full flex items-center gap-3 p-4 border-2 border-green-500 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <UserPlus className="h-5 w-5 text-white" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-green-700">Crear cuenta</div>
                <div className="text-sm text-green-600">
                  Guarda tus datos para futuras compras
                </div>
              </div>
            </button>

            {/* Continuar como invitado */}
            <button
              onClick={() => setCheckoutMode('form')}
              className="w-full flex items-center gap-3 p-4 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 bg-gray-400 rounded-full flex items-center justify-center">
                <UserX className="h-5 w-5 text-white" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-gray-700">Continuar como invitado</div>
                <div className="text-sm text-gray-500">
                  Sin crear cuenta
                </div>
              </div>
            </button>
          </div>

          {/* Footer */}
          <div className="p-4 border-t">
            <button
              onClick={onClose}
              className="w-full py-2 text-gray-600 hover:text-gray-800 text-sm"
            >
              Cancelar
            </button>
          </div>
        </div>

        {/* Modal de autenticación */}
        {showAuthModal && (
          <StoreAuthModal
            slug={slug}
            onClose={() => setShowAuthModal(false)}
            onSuccess={handleAuthSuccess}
            initialMode={authMode}
          />
        )}
      </div>
    )
  }

  // Vista de éxito
  if (success && orderResult) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {type === 'QUOTE' ? '¡Cotización Enviada!' : '¡Orden Creada!'}
          </h2>
          
          <p className="text-gray-600 mb-4">
            {type === 'QUOTE' 
              ? 'Nos pondremos en contacto contigo pronto con la cotización detallada.'
              : 'Tu orden ha sido registrada. Te contactaremos para coordinar el pago y la entrega.'
            }
          </p>

          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-500 mb-1">Número de orden</p>
            <p className="text-lg font-bold text-blue-600">
              {orderResult.order?.orderNumber}
            </p>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-600 mb-2">Total</p>
            <p className="text-2xl font-bold text-blue-600">
              ${orderResult.order?.totals.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </p>
          </div>

          {/* Botones de PDF y Email */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              onClick={handleDownloadPDF}
              className="flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              <Download className="h-4 w-4" />
              Descargar PDF
            </button>
            
            <button
              onClick={handleSendEmail}
              disabled={sendingEmail || emailSent}
              className={`flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-colors ${
                emailSent
                  ? 'bg-green-100 text-green-700'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              } disabled:opacity-50`}
            >
              {sendingEmail ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : emailSent ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Enviado
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Enviar Email
                </>
              )}
            </button>
          </div>

          {config.company.phone && (
            <p className="text-sm text-gray-500 mb-4">
              ¿Tienes preguntas? Llámanos al{' '}
              <a href={`tel:${config.company.phone}`} className="text-blue-600 font-medium">
                {config.company.phone}
              </a>
            </p>
          )}

          <button
            onClick={onSuccess}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700"
          >
            Continuar comprando
          </button>
        </div>
      </div>
    )
  }

  // Vista del formulario
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white">
          <div>
            <h2 className="text-lg font-bold">
              {type === 'QUOTE' ? '📝 Solicitar Cotización' : '🛒 Completar Compra'}
            </h2>
            {isAuthenticated && (
              <p className="text-sm text-green-600">
                ✓ Sesión iniciada como {authCustomer?.name}
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Resumen */}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-600 mb-1">
              {items.length} producto(s) en tu carrito
            </p>
            <p className="text-xl font-bold text-blue-600">
              Total: ${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </p>
          </div>

          {/* Datos del cliente */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Tus datos de contacto</h3>
            
            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <User className="inline h-4 w-4 mr-1" />
                Nombre completo *
              </label>
              <input
                type="text"
                value={customer.name}
                onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Tu nombre"
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Mail className="inline h-4 w-4 mr-1" />
                Correo electrónico *
              </label>
              <input
                type="email"
                value={customer.email}
                onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                disabled={isAuthenticated}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                } ${isAuthenticated ? 'bg-gray-100' : ''}`}
                placeholder="tu@email.com"
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            {/* Teléfono */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Phone className="inline h-4 w-4 mr-1" />
                Teléfono / WhatsApp *
              </label>
              <input
                type="tel"
                value={customer.phone}
                onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.phone ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="664 123 4567"
              />
              {errors.phone && (
                <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
              )}
            </div>

            {/* Dirección */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <MapPin className="inline h-4 w-4 mr-1" />
                Dirección <span className="text-gray-400">(opcional)</span>
              </label>
              <textarea
                value={customer.address}
                onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Calle, número, colonia, ciudad..."
                rows={2}
              />
            </div>

            {/* Notas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas adicionales <span className="text-gray-400">(opcional)</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Especificaciones, preferencias de entrega, etc."
                rows={2}
              />
            </div>
          </div>

          {/* Método de pago - Solo para compras */}
          {type === 'SALE' && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">Método de pago</h3>
              
              <div className="space-y-2">
                <label 
                  className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    paymentMethod === 'CASH_ON_DELIVERY' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="CASH_ON_DELIVERY"
                    checked={paymentMethod === 'CASH_ON_DELIVERY'}
                    onChange={() => setPaymentMethod('CASH_ON_DELIVERY')}
                    className="text-blue-600"
                  />
                  <div>
                    <div className="font-medium text-gray-900">💵 Pago contra entrega</div>
                    <div className="text-sm text-gray-500">Paga cuando recibas tu pedido</div>
                  </div>
                </label>

                <label 
                  className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    paymentMethod === 'STRIPE' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 hover:bg-gray-50'
                  } ${!config.store.features.hasPayment ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="STRIPE"
                    checked={paymentMethod === 'STRIPE'}
                    onChange={() => setPaymentMethod('STRIPE')}
                    disabled={!config.store.features.hasPayment}
                    className="text-blue-600"
                  />
                  <div>
                    <div className="font-medium text-gray-900">💳 Pago con tarjeta</div>
                    <div className="text-sm text-gray-500">
                      {config.store.features.hasPayment 
                        ? 'Pago seguro con tarjeta de crédito/débito' 
                        : 'Próximamente disponible'
                      }
                    </div>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Botones */}
          <div className="space-y-2 pt-2">
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
                type === 'QUOTE'
                  ? 'bg-gray-600 hover:bg-gray-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              } disabled:opacity-50`}
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Procesando...
                </>
              ) : type === 'QUOTE' ? (
                '📝 Enviar Solicitud de Cotización'
              ) : (
                '🛒 Confirmar Compra'
              )}
            </button>

            {!isAuthenticated && (
              <button
                type="button"
                onClick={() => setCheckoutMode('select')}
                className="w-full py-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                ← Volver a opciones de cuenta
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 text-gray-600 hover:text-gray-800 text-sm"
            >
              Cancelar
            </button>
          </div>

          {/* Nota de privacidad */}
          <p className="text-xs text-gray-500 text-center">
            Tus datos serán usados únicamente para procesar tu {type === 'QUOTE' ? 'cotización' : 'pedido'}.
          </p>
        </form>
      </div>
    </div>
  )
}
