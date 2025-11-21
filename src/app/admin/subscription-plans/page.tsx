'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import MainLayout from '@/components/layout/MainLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useNotifications } from '@/components/ui/NotificationProvider'
import { EditPlanModal } from '@/components/admin/EditPlanModal'
import { 
  PencilIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'

interface Plan {
  id: string
  planCode: string
  planName: string
  description: string
  monthlyPriceMxn: number
  annualPriceMxn: number
  monthlyPriceUsd: number
  annualPriceUsd: number
  annualDiscountPercent: number
  maxBranches: number
  maxUsers: number
  maxProducts: number | null
  maxStorageMb: number | null
  features: any
  trialDays: number
  displayOrder: number
  isActive: boolean
  isPopular: boolean
  createdAt: string
  updatedAt: string
}

export default function AdminSubscriptionPlans() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { showSuccess, showError } = useNotifications()
  
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      loadPlans()
    }
  }, [status, router])

  const loadPlans = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/subscription-plans')
      
      if (response.status === 403) {
        showError('Acceso Denegado', 'No tienes permisos de super administrador')
        router.push('/dashboard')
        return
      }

      if (!response.ok) throw new Error('Error al cargar planes')
      
      const data = await response.json()
      setPlans(data.plans)
    } catch (error) {
      console.error('Error:', error)
      showError('Error', 'No se pudieron cargar los planes')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (plan: Plan) => {
    setSelectedPlan(plan)
    setIsEditing(true)
  }

  if (loading || status === 'loading') {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                  <SparklesIcon className="h-8 w-8 text-blue-600" />
                  Panel de Administración
                </h1>
                <p className="mt-2 text-lg text-gray-600">
                  Gestiona los planes de suscripción del sistema
                </p>
              </div>
              <Badge className="bg-purple-600 text-white text-sm px-4 py-2">
                👑 Super Admin
              </Badge>
            </div>
          </div>

          {/* Estadísticas Rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Total Planes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{plans.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Planes Activos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {plans.filter(p => p.isActive).length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Plan Popular</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-blue-600">
                  {plans.find(p => p.isPopular)?.planName || 'Ninguno'}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Precio Más Alto</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  ${Math.max(...plans.map(p => p.monthlyPriceMxn)).toLocaleString()} MXN
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabla de Planes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Planes de Suscripción</CardTitle>
              <CardDescription>
                Haz clic en "Editar" para modificar los precios y características
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b-2 border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Plan
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Precio Mensual
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Precio Anual
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Límites
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {plans.map((plan) => (
                      <tr key={plan.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className="flex items-center gap-2">
                                <div className="text-sm font-medium text-gray-900">
                                  {plan.planName}
                                </div>
                                {plan.isPopular && (
                                  <Badge className="bg-blue-600 text-white text-xs">
                                    ⚡ Popular
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-gray-500">{plan.planCode}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 font-semibold">
                            ${plan.monthlyPriceMxn.toLocaleString()} MXN
                          </div>
                          <div className="text-xs text-gray-500">
                            ${plan.monthlyPriceUsd.toLocaleString()} USD
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 font-semibold">
                            ${plan.annualPriceMxn.toLocaleString()} MXN
                          </div>
                          <div className="text-xs text-green-600">
                            {plan.annualDiscountPercent}% descuento
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1 text-xs text-gray-600">
                            <div className="flex items-center gap-1">
                              <BuildingOfficeIcon className="h-3 w-3" />
                              {plan.maxBranches >= 999999 ? '∞' : plan.maxBranches} sucursales
                            </div>
                            <div className="flex items-center gap-1">
                              <UserGroupIcon className="h-3 w-3" />
                              {plan.maxUsers >= 999999 ? '∞' : plan.maxUsers} usuarios
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {plan.isActive ? (
                            <Badge className="bg-green-100 text-green-800 flex items-center gap-1 w-fit">
                              <CheckCircleIcon className="h-3 w-3" />
                              Activo
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800 flex items-center gap-1 w-fit">
                              <XCircleIcon className="h-3 w-3" />
                              Inactivo
                            </Badge>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Button
                            onClick={() => handleEdit(plan)}
                            variant="outline"
                            size="sm"
                            className="inline-flex items-center gap-1"
                          >
                            <PencilIcon className="h-4 w-4" />
                            Editar
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de Edición */}
      {isEditing && selectedPlan && (
        <EditPlanModal
          plan={selectedPlan}
          onClose={() => {
            setIsEditing(false)
            setSelectedPlan(null)
          }}
          onSave={() => {
            loadPlans() // Recargar la lista
          }}
        />
      )}
    </MainLayout>
  )
}
