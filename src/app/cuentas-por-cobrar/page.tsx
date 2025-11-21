'use client'

import { useState, useEffect } from 'react'
import MainLayout from '@/components/layout/MainLayout'
import RouteProtector from '@/components/layout/RouteProtector'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  Clock,
  Search,
  Filter,
  Download,
  Eye,
  CreditCard,
  Users,
  Calendar,
  FileText
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useNotifications } from '@/components/ui/NotificationProvider'
import ApplyPaymentModal from '@/components/payments/ApplyPaymentModal'
import PaymentHistoryModal from '@/components/payments/PaymentHistoryModal'
import AccountStatementModal from '@/components/payments/AccountStatementModal'

interface CustomerWithDebt {
  id: string
  name: string
  email?: string
  phone?: string
  currentDebt: number
  creditLimit: number
  availableCredit: number
  pendingSales: number
  overdueSales: number
}

export default function CuentasPorCobrarPage() {
  const { showSuccess, showError } = useNotifications()
  
  // Estados
  const [loading, setLoading] = useState(true)
  const [customers, setCustomers] = useState<CustomerWithDebt[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'overdue' | 'high-debt'>('all')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [showStatementModal, setShowStatementModal] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithDebt | null>(null)
  
  // Métricas
  const [metrics, setMetrics] = useState({
    totalDebt: 0,
    totalOverdue: 0,
    totalCustomers: 0,
    averageDebt: 0
  })

  // Cargar datos
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Obtener todos los clientes con crédito
      const response = await fetch('/api/customers?active=true')
      const result = await response.json()
      
      if (response.ok) {
        // La API puede retornar { customers: [...] } o directamente [...]
        const data = Array.isArray(result) ? result : (result.customers || [])
        
        console.log('📊 Clientes recibidos:', data.length)
        
        // Filtrar solo clientes con deuda
        const customersWithDebt = data
          .filter((c: any) => parseFloat(c.currentDebt || 0) > 0)
          .map((c: any) => ({
            id: c.id,
            name: c.name,
            email: c.email,
            phone: c.phone,
            currentDebt: parseFloat(c.currentDebt || 0),
            creditLimit: parseFloat(c.creditLimit || 0),
            availableCredit: Math.max(0, parseFloat(c.creditLimit || 0) - parseFloat(c.currentDebt || 0)),
            pendingSales: 0, // Se calculará después
            overdueSales: 0  // Se calculará después
          }))
        
        console.log('💰 Clientes con deuda:', customersWithDebt.length)
        setCustomers(customersWithDebt)
        
        // Calcular métricas
        const totalDebt = customersWithDebt.reduce((sum: number, c: CustomerWithDebt) => sum + c.currentDebt, 0)
        const totalCustomers = customersWithDebt.length
        const averageDebt = totalCustomers > 0 ? totalDebt / totalCustomers : 0
        
        setMetrics({
          totalDebt,
          totalOverdue: 0, // TODO: calcular con ventas vencidas
          totalCustomers,
          averageDebt
        })
      }
    } catch (error) {
      console.error('Error cargando datos:', error)
      showError('Error', 'No se pudieron cargar los datos')
    } finally {
      setLoading(false)
    }
  }

  // Filtrar clientes
  const filteredCustomers = customers
    .filter(c => {
      // Filtro de búsqueda
      const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           c.phone?.includes(searchTerm)
      
      if (!matchesSearch) return false
      
      // Filtro por tipo
      if (filterType === 'overdue') return c.overdueSales > 0
      if (filterType === 'high-debt') return c.currentDebt > c.creditLimit * 0.8
      
      return true
    })
    .sort((a, b) => b.currentDebt - a.currentDebt) // Ordenar por deuda mayor

  return (
    <RouteProtector allowedRoles={['ADMIN', 'VENDEDOR']}>
      <MainLayout>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Cuentas por Cobrar</h1>
              <p className="text-gray-500 mt-1">Gestiona los pagos y créditos de tus clientes</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={loadData}>
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>

          {/* Métricas principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total por Cobrar */}
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total por Cobrar
                </CardTitle>
                <DollarSign className="h-5 w-5 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(metrics.totalDebt)}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  De {metrics.totalCustomers} clientes
                </p>
              </CardContent>
            </Card>

            {/* Cartera Vencida */}
            <Card className="border-l-4 border-l-red-500">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Cartera Vencida
                </CardTitle>
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(metrics.totalOverdue)}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Pagos atrasados
                </p>
              </CardContent>
            </Card>

            {/* Clientes con Crédito */}
            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Clientes Activos
                </CardTitle>
                <Users className="h-5 w-5 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {metrics.totalCustomers}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Con saldo pendiente
                </p>
              </CardContent>
            </Card>

            {/* Promedio de Deuda */}
            <Card className="border-l-4 border-l-orange-500">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Deuda Promedio
                </CardTitle>
                <TrendingUp className="h-5 w-5 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(metrics.averageDebt)}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Por cliente
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filtros y búsqueda */}
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row gap-4">
                {/* Búsqueda */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar cliente..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Filtros */}
                <div className="flex gap-2">
                  <Button
                    variant={filterType === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterType('all')}
                  >
                    Todos
                  </Button>
                  <Button
                    variant={filterType === 'overdue' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterType('overdue')}
                  >
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    Vencidos
                  </Button>
                  <Button
                    variant={filterType === 'high-debt' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterType('high-debt')}
                  >
                    <Clock className="h-4 w-4 mr-1" />
                    Alto Crédito
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
              ) : filteredCustomers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No hay clientes con deuda</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredCustomers.map((customer) => (
                    <div
                      key={customer.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      {/* Info del cliente */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-600 font-semibold">
                              {customer.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{customer.name}</h3>
                            <p className="text-sm text-gray-500">
                              {customer.email || customer.phone || 'Sin contacto'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Información de crédito */}
                      <div className="flex items-center gap-6 mr-6">
                        {/* Deuda actual */}
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Debe</p>
                          <p className="text-lg font-bold text-red-600">
                            {formatCurrency(customer.currentDebt)}
                          </p>
                        </div>

                        {/* Límite de crédito */}
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Límite</p>
                          <p className="text-sm font-medium text-gray-700">
                            {formatCurrency(customer.creditLimit)}
                          </p>
                        </div>

                        {/* Uso de crédito */}
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Uso</p>
                          <Badge 
                            variant={
                              customer.currentDebt / customer.creditLimit > 0.8 
                                ? 'destructive' 
                                : customer.currentDebt / customer.creditLimit > 0.5
                                ? 'default'
                                : 'secondary'
                            }
                          >
                            {Math.round((customer.currentDebt / customer.creditLimit) * 100)}%
                          </Badge>
                        </div>
                      </div>

                      {/* Acciones */}
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedCustomer(customer)
                            setShowHistoryModal(true)
                          }}
                          title="Ver historial de pagos"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedCustomer(customer)
                            setShowStatementModal(true)
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => {
                            setSelectedCustomer(customer)
                            setShowPaymentModal(true)
                          }}
                        >
                          <CreditCard className="h-4 w-4 mr-1" />
                          Aplicar Pago
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Modales */}
        {selectedCustomer && (
          <>
            <ApplyPaymentModal
              isOpen={showPaymentModal}
              onClose={() => {
                setShowPaymentModal(false)
                setSelectedCustomer(null)
              }}
              customer={{
                id: selectedCustomer.id,
                name: selectedCustomer.name,
                currentDebt: selectedCustomer.currentDebt
              }}
              onSuccess={() => {
                // Recargar datos después de aplicar pago
                loadData()
                setShowPaymentModal(false)
                setSelectedCustomer(null)
              }}
            />

            <PaymentHistoryModal
              isOpen={showHistoryModal}
              onClose={() => {
                setShowHistoryModal(false)
                setSelectedCustomer(null)
              }}
              customer={{
                id: selectedCustomer.id,
                name: selectedCustomer.name
              }}
            />

            <AccountStatementModal
              isOpen={showStatementModal}
              onClose={() => {
                setShowStatementModal(false)
                setSelectedCustomer(null)
              }}
              customerId={selectedCustomer.id}
              customerName={selectedCustomer.name}
              onApplyPayment={(customer) => {
                setSelectedCustomer({
                  ...selectedCustomer,
                  currentDebt: customer.currentDebt,
                  creditLimit: customer.creditLimit,
                  availableCredit: customer.availableCredit
                })
                setShowStatementModal(false)
                setShowPaymentModal(true)
              }}
            />
          </>
        )}
      </MainLayout>
    </RouteProtector>
  )
}
