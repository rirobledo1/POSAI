'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import MainLayout from '@/components/layout/MainLayout'
import RouteProtector from '@/components/layout/RouteProtector'
import { SettingsOverview } from '@/components/settings/SettingsOverview'
import CompanyConfigurationManager from '@/components/settings/CompanyConfigurationManager'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CogIcon, UserGroupIcon, BuildingOfficeIcon, TagIcon, CreditCardIcon } from '@heroicons/react/24/outline'
import { Badge } from '@/components/ui/badge'

interface SystemStats {
  activeUsers: number
  totalCategories: number
  totalProducts: number
}

interface SubscriptionInfo {
  planType: string
  isInTrial: boolean
  daysRemaining: number
}

export default function SettingsPage() {
  const router = useRouter()
  const [stats, setStats] = useState<SystemStats>({
    activeUsers: 0,
    totalCategories: 0,
    totalProducts: 0
  })
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo>({
    planType: 'FREE',
    isInTrial: false,
    daysRemaining: 0
  })
  const [loading, setLoading] = useState(true)
  const [showCompanyConfig, setShowCompanyConfig] = useState(false)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Obtener stats
        const statsResponse = await fetch('/api/settings/stats')
        if (statsResponse.ok) {
          const data = await statsResponse.json()
          setStats({
            activeUsers: data.activeUsers || 0,
            totalCategories: data.totalCategories || 0,
            totalProducts: data.totalProducts || 0
          })
        }

        // Obtener info de suscripción
        const subResponse = await fetch('/api/subscriptions/status')
        if (subResponse.ok) {
          const data = await subResponse.json()
          setSubscriptionInfo({
            planType: data.planType || 'FREE',
            isInTrial: data.isInTrial || false,
            daysRemaining: data.daysRemaining || 0
          })
        }
      } catch (error) {
        console.error('Error loading stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  return (
    <RouteProtector allowedRoles={['ADMIN']}>
      <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate flex items-center gap-3">
              <CogIcon className="h-8 w-8 text-blue-600" />
              Configuración del Sistema
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Gestiona usuarios, empresa, categorías y configuraciones generales
            </p>
          </div>
          <div className="mt-4 flex gap-2 md:mt-0 md:ml-4">
            <Badge variant="default" className="flex items-center gap-1">
              <CogIcon className="h-4 w-4" />
              Admin Panel
            </Badge>
          </div>
        </div>

        {/* Quick Access Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Suscripción - Estilo dinámico según plan */}
          <Card 
            className={`hover:shadow-lg transition-all cursor-pointer relative overflow-hidden ${
              subscriptionInfo.planType === 'FREE'
                ? 'border-2 border-orange-400 bg-gradient-to-br from-orange-50 to-red-50 animate-pulse'
                : subscriptionInfo.planType === 'PRO'
                ? 'border-2 border-blue-400 bg-gradient-to-br from-blue-50 to-indigo-50'
                : 'border-2 border-purple-400 bg-gradient-to-br from-purple-50 to-pink-50'
            }`}
            onClick={() => router.push('/settings/subscription')}
          >
            {/* Badge superior */}
            <div className="absolute top-2 right-2">
              {subscriptionInfo.planType === 'FREE' ? (
                <Badge className="bg-orange-600 hover:bg-orange-700 text-white animate-bounce">
                  ⚡ ¡Actualiza!
                </Badge>
              ) : (
                <Badge className="bg-green-600 hover:bg-green-700 text-white">
                  ✔ Activo
                </Badge>
              )}
            </div>

            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-6">
              <CardTitle className={`text-sm font-medium ${
                subscriptionInfo.planType === 'FREE' ? 'text-orange-900' : 'text-gray-900'
              }`}>
                Suscripción
              </CardTitle>
              <CreditCardIcon className={`h-5 w-5 ${
                subscriptionInfo.planType === 'FREE' ? 'text-orange-600' : 'text-blue-600'
              }`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">
                {subscriptionInfo.planType === 'FREE' ? '🆓' : 
                 subscriptionInfo.planType === 'PRO' ? '💳' : '👑'}
              </div>
              <div className={`text-lg font-bold mb-1 ${
                subscriptionInfo.planType === 'FREE' ? 'text-orange-700' : 'text-blue-700'
              }`}>
                Plan {subscriptionInfo.planType}
              </div>
              
              {subscriptionInfo.planType === 'FREE' && subscriptionInfo.isInTrial && (
                <p className="text-xs text-orange-600 font-medium mb-2">
                  ⏰ {subscriptionInfo.daysRemaining} días restantes de prueba
                </p>
              )}
              
              <p className={`text-sm font-medium mt-2 ${
                subscriptionInfo.planType === 'FREE' ? 'text-orange-600' : 'text-blue-600'
              }`}>
                {subscriptionInfo.planType === 'FREE' ? '⬆ Mejorar plan ahora' : '📊 Gestionar suscripción'}
              </p>
            </CardContent>
          </Card>

          {/* Gestión de Usuarios */}
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gestión de Usuarios</CardTitle>
              <UserGroupIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '...' : stats.activeUsers}
              </div>
              <p className="text-xs text-muted-foreground">Usuarios activos</p>
              <p className="text-sm text-blue-600 mt-2">Administrar usuarios y roles</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Configuración de Empresa</CardTitle>
              <BuildingOfficeIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">⚙️</div>
              <p className="text-xs text-muted-foreground">Personalizar</p>
              <p className="text-sm text-gray-600 mt-2 mb-3">Datos y configuración general</p>
              <Button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowCompanyConfig(!showCompanyConfig)
                }}
                variant="outline"
                size="sm"
                className="w-full flex items-center gap-2"
              >
                <BuildingOfficeIcon className="h-4 w-4" />
                {showCompanyConfig ? 'Ocultar Config' : 'Configurar Empresa'}
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Categorías de Productos</CardTitle>
              <TagIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '...' : stats.totalCategories}
              </div>
              <p className="text-xs text-muted-foreground">Categorías activas</p>
              <p className="text-sm text-gray-600 mt-2 mb-3">Organizar catálogo de productos</p>
              <Button
                onClick={(e) => {
                  e.stopPropagation()
                  router.push('/categorias')
                }}
                variant="outline"
                size="sm"
                className="w-full flex items-center gap-2"
              >
                <TagIcon className="h-4 w-4" />
                Importar CSV
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Company Configuration */}
        {showCompanyConfig && (
          <div className="mt-6">
            <CompanyConfigurationManager />
          </div>
        )}

        {/* Main Content */}
        <SettingsOverview />
      </div>
    </MainLayout>
    </RouteProtector>
  )
}
