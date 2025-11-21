import { useState, useCallback } from 'react'
import { useNotifications } from '@/contexts/NotificationContext'

export interface Sale {
  id: string
  folio: string
  total: number
  status: string
  createdAt: string
  deliveryType?: string
  deliveryFee?: number
  deliveryStatus?: string
  deliveryAddress?: string
  deliveryNeighborhood?: string
  deliveryCity?: string
  deliveryReference?: string
  customer?: {
    id: string
    name: string
  }
  user: {
    id: string
    name: string
  }
  saleItems: Array<{
    id: string
    quantity: number
    unitPrice: number
    total: number
    product: {
      id: string
      name: string
    }
  }>
}

export interface SaleCancellation {
  id: string
  saleId: string
  cancellationType: 'FULL' | 'PARTIAL'
  reason: string
  refundAmount: number
  cancelledAt: string
  notes?: string
  sale: {
    folio: string
    total: number
    createdAt: string
  }
  cancelledByUser: {
    id: string
    name: string
    email: string
  }
}

export const useSales = () => {
  const [loading, setLoading] = useState(false)
  const { showError, showSuccess } = useNotifications()

  const fetchSales = useCallback(async (params: {
    page?: number
    limit?: number
    status?: string
    startDate?: string
    endDate?: string
  } = {}) => {
    setLoading(true)
    try {
      const searchParams = new URLSearchParams()
      
      if (params.page) searchParams.set('page', params.page.toString())
      if (params.limit) searchParams.set('limit', params.limit.toString())
      if (params.status) searchParams.set('status', params.status)
      if (params.startDate) searchParams.set('startDate', params.startDate)
      if (params.endDate) searchParams.set('endDate', params.endDate)

      const url = `/api/sales?${searchParams}`
      console.log('🌐 Fetching from URL:', url)
      
      const response = await fetch(url)
      console.log('📡 Response status:', response.status, response.statusText)
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()))
      
      if (!response.ok) {
        let errorData = ''
        try {
          errorData = await response.text()
        } catch (textError) {
          console.error('❌ Error reading response text:', textError)
          errorData = 'No se pudo leer el error de la respuesta'
        }
        
        console.error('❌ Error en API de ventas:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          url: url
        })
        throw new Error(`Error al cargar ventas: ${response.status} - ${errorData || response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Error al cargar ventas')
      throw error
    } finally {
      setLoading(false)
    }
  }, [showError])

  const fetchSaleById = useCallback(async (saleId: string): Promise<Sale> => {
    setLoading(true)
    try {
      const response = await fetch(`/api/sales/${saleId}`)
      
      if (!response.ok) {
        throw new Error('Error al cargar la venta')
      }

      const data = await response.json()
      return data.data
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Error al cargar la venta')
      throw error
    } finally {
      setLoading(false)
    }
  }, [showError])

  const cancelSale = useCallback(async (params: {
    saleId: string
    cancellationType: 'FULL' | 'PARTIAL'
    reason: string
    refundAmount: number
    notes?: string
  }) => {
    setLoading(true)
    try {
      const response = await fetch('/api/sales/cancellation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al cancelar la venta')
      }

      showSuccess(data.message || 'Venta cancelada exitosamente')
      return data.data
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Error al cancelar la venta')
      throw error
    } finally {
      setLoading(false)
    }
  }, [showError, showSuccess])

  const fetchCancellations = useCallback(async (params: {
    saleId?: string
    limit?: number
    offset?: number
  } = {}): Promise<{ cancellations: SaleCancellation[], pagination: any }> => {
    setLoading(true)
    try {
      const searchParams = new URLSearchParams()
      
      if (params.saleId) searchParams.set('saleId', params.saleId)
      if (params.limit) searchParams.set('limit', params.limit.toString())
      if (params.offset) searchParams.set('offset', params.offset.toString())

      const response = await fetch(`/api/sales/cancellation?${searchParams}`)
      
      if (!response.ok) {
        throw new Error('Error al cargar cancelaciones')
      }

      const data = await response.json()
      return data.data
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Error al cargar cancelaciones')
      throw error
    } finally {
      setLoading(false)
    }
  }, [showError])

  return {
    loading,
    fetchSales,
    fetchSaleById,
    cancelSale,
    fetchCancellations
  }
}