import { useState, useEffect } from 'react'

interface Company {
  id: string
  name: string
  businessType: string
  phone?: string
  email?: string
  address?: string
  taxId?: string
  taxRate: number
  currency: string
}

export function useCompany() {
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // 🔥 PRIORIDAD BAJA: Esperar 2 segundos antes de cargar empresa
    // Esto da prioridad a productos y clientes en el POS
    const timer = setTimeout(() => {
      console.log('🏭 Cargando información de empresa (prioridad baja)...')
      fetchCompany()
    }, 2000)
    
    return () => clearTimeout(timer)
  }, [])

  const fetchCompany = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/company')
      
      if (response.ok) {
        const data = await response.json()
        setCompany(data)
      } else if (response.status === 404) {
        // No hay empresa configurada, usar valores por defecto
        setCompany({
          id: '',
          name: 'PosAI',
          businessType: 'GENERAL',
          taxRate: 16.00,
          currency: 'MXN'
        })
      } else {
        setError('Error al cargar configuración de empresa')
      }
    } catch (err) {
      console.error('Error fetching company:', err)
      setError('Error de conexión')
      // Usar valores por defecto en caso de error
      setCompany({
        id: '',
        name: 'PosAI',
        businessType: 'GENERAL',
        taxRate: 16.00,
        currency: 'MXN'
      })
    } finally {
      setLoading(false)
    }
  }

  return {
    company,
    loading,
    error,
    refetch: fetchCompany
  }
}