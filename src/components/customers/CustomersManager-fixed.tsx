'use client'

import { useState, useEffect } from 'react'
import { CustomerModal } from './CustomerModal'
import { PaymentModal, PaymentHistory } from './PaymentComponents'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  UserIcon,
  CreditCardIcon,
  PhoneIcon,
  EnvelopeIcon,
  BanknotesIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

interface CustomerWithStats {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  creditLimit: number
  currentDebt: number
  active: boolean
  createdAt: string
  updatedAt: string
  totalPurchases?: number
  lastPurchase?: string
}

export function CustomersManager() {
  const [customers, setCustomers] = useState<CustomerWithStats[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<CustomerWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<CustomerWithStats | null>(null)
  
  // Payment modal states
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [paymentCustomer, setPaymentCustomer] = useState<CustomerWithStats | null>(null)
  
  // Payment history modal states
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  const [historyCustomer, setHistoryCustomer] = useState<CustomerWithStats | null>(null)

  // Fetch customers from API
  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/customers')
      if (!response.ok) throw new Error('Error al cargar clientes')
      const data = await response.json()
      
      // Verificar si la respuesta tiene el formato nuevo de la API
      const customersArray = data.success ? data.customers : data
      
      // Asegurar que sea un array
      if (Array.isArray(customersArray)) {
        setCustomers(customersArray)
        setFilteredCustomers(customersArray)
      } else {
        console.error('La respuesta de la API no contiene un array de clientes:', data)
        setCustomers([])
        setFilteredCustomers([])
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
      // Establecer arrays vacíos en caso de error
      setCustomers([])
      setFilteredCustomers([])
    } finally {
      setLoading(false)
    }
  }

  // Search functionality
  const handleSearch = (term: string) => {
    setSearchTerm(term)
    if (!term) {
      setFilteredCustomers(customers)
    } else {
      const filtered = customers.filter(customer =>
        customer.name.toLowerCase().includes(term.toLowerCase()) ||
        customer.email?.toLowerCase().includes(term.toLowerCase()) ||
        customer.phone?.includes(term)
      )
      setFilteredCustomers(filtered)
    }
  }

  const handleAddCustomer = () => {
    setEditingCustomer(null)
    setIsModalOpen(true)
  }

  const handleEditCustomer = (customer: CustomerWithStats) => {
    setEditingCustomer(customer)
    setIsModalOpen(true)
  }

  const handleDeleteCustomer = async (customerId: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este cliente?')) {
      return
    }

    try {
      const response = await fetch(`/api/customers?id=${customerId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Error al eliminar cliente')
      }

      await fetchCustomers()
    } catch (error) {
      console.error('Error deleting customer:', error)
      alert('Error al eliminar el cliente')
    }
  }

  const handleSaveCustomer = async (customerData: any) => {
    try {
      const method = editingCustomer ? 'PUT' : 'POST'
      const body = editingCustomer 
        ? { ...customerData, id: editingCustomer.id }
        : customerData

      const response = await fetch('/api/customers', {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        throw new Error(`Error al ${editingCustomer ? 'actualizar' : 'crear'} cliente`)
      }

      await fetchCustomers()
      setIsModalOpen(false)
    } catch (error) {
      console.error('Error saving customer:', error)
      alert(`Error al ${editingCustomer ? 'actualizar' : 'crear'} el cliente`)
    }
  }

  const handlePayment = (customer: CustomerWithStats) => {
    setPaymentCustomer(customer)
    setIsPaymentModalOpen(true)
  }

  const handleViewHistory = (customer: CustomerWithStats) => {
    setHistoryCustomer(customer)
    setIsHistoryModalOpen(true)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  useEffect(() => {
    fetchCustomers()
  }, [])

  useEffect(() => {
    handleSearch(searchTerm)
  }, [customers, searchTerm])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Cargando clientes...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with search and add button */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            type="text"
            placeholder="Buscar por nombre, email o teléfono..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={handleAddCustomer} className="flex items-center gap-2">
          <PlusIcon className="h-4 w-4" />
          Agregar Cliente
        </Button>
      </div>

      {/* Customers list */}
      <div className="space-y-4">
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <UserIcon className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <p className="text-lg font-medium">No se encontraron clientes</p>
            <p className="text-sm">
              {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Comienza agregando tu primer cliente'}
            </p>
          </div>
        ) : (
          filteredCustomers.map((customer) => (
            <div key={customer.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1 space-y-3">
                  {/* Name and status */}
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-900">{customer.name}</h3>
                    <Badge variant={customer.active ? 'default' : 'secondary'}>
                      {customer.active ? 'Activo' : 'Inactivo'}
                    </Badge>
                    {customer.currentDebt > 0 && (
                      <Badge variant="destructive">
                        <CreditCardIcon className="h-4 w-4 mr-1" />
                        Adeudo: {formatCurrency(customer.currentDebt)}
                      </Badge>
                    )}
                  </div>

                  {/* Contact info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                    {customer.email && (
                      <div className="flex items-center gap-2">
                        <EnvelopeIcon className="h-4 w-4" />
                        <span>{customer.email}</span>
                      </div>
                    )}
                    {customer.phone && (
                      <div className="flex items-center gap-2">
                        <PhoneIcon className="h-4 w-4" />
                        <span>{customer.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Credit info */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-blue-600">
                      <CreditCardIcon className="h-4 w-4" />
                      <span>Límite: {formatCurrency(customer.creditLimit)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-green-600">
                      <BanknotesIcon className="h-4 w-4" />
                      <span>Compras: {formatCurrency(customer.totalPurchases || 0)}</span>
                    </div>
                    {customer.lastPurchase && (
                      <div className="flex items-center gap-2 text-gray-500">
                        <ClockIcon className="h-4 w-4" />
                        <span>Última: {formatDate(customer.lastPurchase)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-4">
                  {customer.currentDebt > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePayment(customer)}
                    >
                      <BanknotesIcon className="h-4 w-4 mr-1" />
                      Pago
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewHistory(customer)}
                  >
                    <ClockIcon className="h-4 w-4 mr-1" />
                    Historial
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditCustomer(customer)}
                  >
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteCustomer(customer.id)}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modals */}
      <CustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveCustomer}
        customer={editingCustomer}
      />

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        customer={paymentCustomer}
        onPaymentComplete={fetchCustomers}
      />

      <PaymentHistory
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        customer={historyCustomer}
      />
    </div>
  )
}
