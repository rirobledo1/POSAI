import { useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'

export interface QuotationItem {
  id?: string
  productId: string
  productName: string
  description?: string
  quantity: number
  unitPrice: number
  discount: number
  subtotal: number
  product?: {
    id: string
    name: string
    sku?: string
    price: number
  }
}

export interface Quotation {
  id: string
  quotationNumber: string
  customerId: string
  companyId: string
  branchId?: string
  userId: string
  
  subtotal: number
  discount: number
  discountPercent: number
  tax: number
  total: number
  
  validUntil: string
  status: 'DRAFT' | 'SENT' | 'VIEWED' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'CONVERTED' | 'CANCELLED'
  
  notes?: string
  termsConditions?: string
  
  sentVia: string[]
  sentAt?: string
  emailSentAt?: string
  whatsappSentAt?: string
  
  viewedAt?: string
  viewCount: number
  
  convertedToSaleId?: string
  convertedAt?: string
  
  createdAt: string
  updatedAt: string
  
  customer: {
    id: string
    name: string
    email?: string
    phone?: string
    rfc?: string
  }
  
  company: {
    id: string
    name: string
  }
  
  branch?: {
    id: string
    name: string
  }
  
  createdBy: {
    id: string
    name: string
    email: string
  }
  
  items: QuotationItem[]
  
  sale?: {
    id: string
    saleNumber: string
    total: number
    status: string
  }
}

export interface CreateQuotationData {
  customerId: string
  companyId: string
  branchId: string
  items: Array<{
    productId: string
    description: string
    quantity: number
    price: number
    discount?: number
    notes?: string
  }>
  discountPercent?: number
  discount?: number
  notes?: string
  paymentTerms?: string
  deliveryTime?: string
  validDays?: number
}

export const useQuotations = () => {
  const [loading, setLoading] = useState(false)
  const { data: session } = useSession()

  // Listar cotizaciones
  const fetchQuotations = useCallback(async (params: {
    page?: number
    limit?: number
    companyId?: string
    branchId?: string
    status?: string
    customerId?: string
  } = {}) => {
    setLoading(true)
    try {
      const searchParams = new URLSearchParams()
      
      if (params.page) searchParams.set('page', params.page.toString())
      if (params.limit) searchParams.set('limit', params.limit.toString())
      if (params.companyId) searchParams.set('companyId', params.companyId)
      if (params.branchId) searchParams.set('branchId', params.branchId)
      if (params.status) searchParams.set('status', params.status)
      if (params.customerId) searchParams.set('customerId', params.customerId)

      const response = await fetch(`/api/quotations?${searchParams}`)
      
      if (!response.ok) {
        throw new Error('Error al cargar cotizaciones')
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching quotations:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  // Obtener una cotización por ID
  const fetchQuotationById = useCallback(async (id: string): Promise<Quotation> => {
    setLoading(true)
    try {
      const response = await fetch(`/api/quotations/${id}`)
      
      if (!response.ok) {
        throw new Error('Error al cargar cotización')
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching quotation:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  // Crear nueva cotización
  const createQuotation = useCallback(async (data: CreateQuotationData): Promise<Quotation> => {
    setLoading(true)
    try {
      const response = await fetch('/api/quotations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al crear cotización')
      }

      return result
    } catch (error) {
      console.error('Error creating quotation:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  // Actualizar cotización
  const updateQuotation = useCallback(async (id: string, data: Partial<CreateQuotationData>): Promise<Quotation> => {
    setLoading(true)
    try {
      const response = await fetch(`/api/quotations/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al actualizar cotización')
      }

      return result
    } catch (error) {
      console.error('Error updating quotation:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  // Eliminar/Cancelar cotización
  const deleteQuotation = useCallback(async (id: string): Promise<void> => {
    setLoading(true)
    try {
      const response = await fetch(`/api/quotations/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Error al cancelar cotización')
      }
    } catch (error) {
      console.error('Error deleting quotation:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  // Enviar por email
  const sendByEmail = useCallback(async (id: string, email?: string): Promise<void> => {
    setLoading(true)
    try {
      const response = await fetch(`/api/quotations/${id}/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al enviar cotización por email')
      }

      return result
    } catch (error) {
      console.error('Error sending email:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  // Enviar por WhatsApp
  const sendByWhatsApp = useCallback(async (id: string, phone?: string, mode?: 'manual' | 'auto'): Promise<any> => {
    setLoading(true)
    try {
      const response = await fetch(`/api/quotations/${id}/send-whatsapp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phone, mode })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al enviar cotización por WhatsApp')
      }

      return result
    } catch (error) {
      console.error('Error sending WhatsApp:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  // Convertir a venta
  const convertToSale = useCallback(async (id: string, paymentData?: {
    paymentMethod?: string
    paymentStatus?: string
  }): Promise<any> => {
    setLoading(true)
    try {
      const response = await fetch(`/api/quotations/${id}/convert-to-sale`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentData || {})
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al convertir cotización a venta')
      }

      return result
    } catch (error) {
      console.error('Error converting to sale:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  // Descargar PDF
  const downloadPDF = useCallback(async (id: string, quotationNumber: string): Promise<void> => {
    setLoading(true)
    try {
      const response = await fetch(`/api/quotations/${id}/pdf`)
      
      if (!response.ok) {
        throw new Error('Error al generar PDF')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Cotizacion-${quotationNumber}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading PDF:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    fetchQuotations,
    fetchQuotationById,
    createQuotation,
    updateQuotation,
    deleteQuotation,
    sendByEmail,
    sendByWhatsApp,
    convertToSale,
    downloadPDF
  }
}
