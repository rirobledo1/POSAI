// Hook para generar PDF de Estado de Cuenta
import { useState } from 'react'
import { generateAccountStatementPDF } from '@/lib/pdf/accountStatement'

export function useAccountStatementPDF() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generatePDF = async (customerId: string, customerName: string) => {
    setLoading(true)
    setError(null)

    try {
      // Obtener datos del estado de cuenta
      const response = await fetch(`/api/customers/${customerId}/account-statement`)
      
      if (!response.ok) {
        throw new Error('Error al obtener datos del estado de cuenta')
      }

      const data = await response.json()

      // Obtener información de la empresa
      const companyResponse = await fetch('/api/company/settings')
      const companyData = await companyResponse.ok 
        ? await companyResponse.json() 
        : { name: 'Mi Empresa' }

      // Preparar datos para el PDF
      const pdfData = {
        company: {
          name: companyData.companyName || companyData.name || 'Mi Empresa',
          address: companyData.address || '',
          phone: companyData.phone || '',
          email: companyData.email || '',
          rfc: companyData.rfc || ''
        },
        customer: {
          name: data.customer.name,
          email: data.customer.email,
          phone: data.customer.phone,
          rfc: data.customer.rfc,
          creditLimit: parseFloat(data.customer.creditLimit.toString()),
          currentDebt: parseFloat(data.customer.currentDebt.toString()),
          availableCredit: parseFloat(data.customer.availableCredit.toString())
        },
        sales: data.creditSales || [],
        payments: data.payments || [],
        generatedAt: new Date()
      }

      // Generar PDF
      const doc = generateAccountStatementPDF(pdfData)

      // Descargar PDF
      const fileName = `estado-cuenta-${customerName.replace(/\s/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`
      doc.save(fileName)

      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al generar PDF'
      setError(errorMessage)
      console.error('Error generando PDF:', err)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  return {
    generatePDF,
    loading,
    error
  }
}
