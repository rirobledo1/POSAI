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
  creditLimit: number // Cambiar de Decimal a number
  currentDebt: number  // Cambiar de Decimal a number
  active: boolean
  createdAt: Date
  updatedAt: Date
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
          currentDebt: 8750,
          active: true,
          createdAt: new Date('2024-03-10'),
          updatedAt: new Date('2024-11-29'),
          totalPurchases: 45300.25,
          lastPurchase: '2024-11-25'
        }
      ]
      setCustomers(mockCustomers)
      setFilteredCustomers(mockCustomers)
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

  // Handle customer creation/editing
  const handleSaveCustomer = async (customer: any) => {
    try {
      const method = editingCustomer ? 'PUT' : 'POST'
      const url = editingCustomer ? `/api/customers/${editingCustomer.id}` : '/api/customers'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(customer)
      })

      if (!response.ok) throw new Error('Error al guardar cliente')
      
      await fetchCustomers() // Refresh list
      setIsModalOpen(false)
      setEditingCustomer(null)
    } catch (error) {
      console.error('Error saving customer:', error)
      alert('Error al guardar cliente')
    }
  }

  // Handle payment functions
  const handlePayment = (customer: CustomerWithStats) => {
    setPaymentCustomer(customer)
    setIsPaymentModalOpen(true)
  }

  const handlePaymentSuccess = async () => {
    // Refresh the customer list to show updated debt
    await fetchCustomers()
  }

  const handleViewHistory = (customer: CustomerWithStats) => {
    setHistoryCustomer(customer)
    setIsHistoryModalOpen(true)
  }

  const handlePaymentSuccess = () => {
    fetchCustomers()
    setIsPaymentModalOpen(false)
    setPaymentCustomer(null)
  }

  // Handle customer deletion
  const handleDeleteCustomer = async (customerId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este cliente?')) return
    
    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Error al eliminar cliente')
      
      await fetchCustomers() // Refresh list
    } catch (error) {
      console.error('Error deleting customer:', error)
      alert('Error al eliminar cliente')
    }
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount)
  }

  useEffect(() => {
    fetchCustomers()
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="border rounded-lg p-4">
            <div className="space-y-2">
              <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with search and add button */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar por nombre, email o teléfono..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          onClick={() => {
            setEditingCustomer(null)
            setIsModalOpen(true)
          }}
          className="flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Nuevo Cliente
        </Button>
      </div>

      {/* Customers list */}
      <div className="grid gap-4">
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
                    <Badge variant={customer.active ? 'success' : 'error'}>
                      {customer.active ? 'Activo' : 'Inactivo'}
                    </Badge>
                    {customer.currentDebt > 0 && (
                      <Badge variant="warning">
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
                        {customer.email}
                      </div>
                    )}
                    {customer.phone && (
                      <div className="flex items-center gap-2">
                        <PhoneIcon className="h-4 w-4" />
                        {customer.phone}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Límite de crédito:</span>
                      {formatCurrency(customer.creditLimit)}
                    </div>
                  </div>

                  {/* Address */}
                  {customer.address && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Dirección:</span> {customer.address}
                    </div>
                  )}

                  {/* Purchase stats */}
                  {customer.totalPurchases && (
                    <div className="flex gap-6 text-sm text-gray-600">
                      <span>
                        <span className="font-medium">Total compras:</span> {formatCurrency(customer.totalPurchases)}
                      </span>
                      {customer.lastPurchase && (
                        <span>
                          <span className="font-medium">Última compra:</span> {new Date(customer.lastPurchase).toLocaleDateString('es-MX')}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 ml-4">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingCustomer(customer)
                        setIsModalOpen(true)
                      }}
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteCustomer(customer.id)}
                    >
                      <TrashIcon className="h-4 w-4 text-red-500" />
                    </Button>
                    {/* Historial siempre disponible */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewHistory(customer)}
                      className="text-blue-600 border-blue-300 hover:bg-blue-50"
                    >
                      <ClockIcon className="h-4 w-4" />
                      Historial
                    </Button>
                  </div>
                  
                  {/* Payment actions - only show if customer has debt */}
                  {customer.currentDebt > 0 && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePayment(customer)}
                        className="text-green-600 border-green-300 hover:bg-green-50"
                      >
                        <BanknotesIcon className="h-4 w-4" />
                        Pagar
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Customer Modal */}
      <CustomerModal
        customer={editingCustomer}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingCustomer(null)
        }}
        onSave={handleSaveCustomer}
      />

      {/* Payment Modal */}
      {paymentCustomer && (
        <PaymentModal
          customer={paymentCustomer}
          isOpen={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false)
            setPaymentCustomer(null)
          }}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {/* Payment History Modal */}
      {historyCustomer && (
        <PaymentHistory
          customerId={historyCustomer.id}
          customerName={historyCustomer.name}
          isOpen={isHistoryModalOpen}
          onClose={() => {
            setIsHistoryModalOpen(false)
            setHistoryCustomer(null)
          }}
        />
      )}
    </div>
  )
}
