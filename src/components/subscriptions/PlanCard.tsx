'use client'

import { Check, X, Zap, ShoppingCart, MessageSquare, Brain, FileText, Users, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface PlanFeatures {
  // Básicas
  inventory?: boolean
  sales?: boolean
  basic_reports?: boolean
  advanced_reports?: boolean
  
  // Cotizaciones
  quotations_basic?: boolean
  quotations_online?: boolean
  quotations_whatsapp?: boolean
  quotations_inperson?: boolean
  
  // Ventas
  sales_whatsapp?: boolean
  
  // IA
  ai_sales_agents?: boolean
  ai_anomaly_detection?: boolean
  ai_theft_alerts?: boolean
  ai_demand_prediction?: boolean
  ai_smart_reports?: boolean
  ai_inventory_optimization?: boolean
  ai_price_suggestions?: boolean
  
  // Soporte y otros
  transfers?: boolean
  multi_currency?: boolean
  priority_support?: boolean
  dedicated_support?: boolean
  custom_branding?: boolean
  white_label?: boolean
  api_access?: boolean
  advanced_analytics?: boolean
  automated_notifications?: boolean
  custom_workflows?: boolean
  sla_guarantee?: boolean
  custom_integrations?: boolean
  onboarding_support?: boolean
}

interface PlanCardProps {
  name: string
  code: string
  description: string
  monthlyPrice: number
  annualPrice: number
  annualDiscountPercent: number
  limits: {
    branches: number
    users: number
    products: number | null
    storageMb: number | null
  }
  features: PlanFeatures
  isPopular?: boolean
  isCurrent?: boolean
  billingPeriod: 'monthly' | 'annual'
  onSelect: () => void
  disabled?: boolean
}

export function PlanCard({
  name,
  code,
  description,
  monthlyPrice,
  annualPrice,
  annualDiscountPercent,
  limits,
  features,
  isPopular = false,
  isCurrent = false,
  billingPeriod,
  onSelect,
  disabled = false
}: PlanCardProps) {
  
  const price = billingPeriod === 'monthly' ? monthlyPrice : annualPrice
  const originalAnnualPrice = monthlyPrice * 12
  const savings = billingPeriod === 'annual' ? originalAnnualPrice - annualPrice : 0

  const formatNumber = (num: number | null) => {
    if (num === null || num >= 999999) return 'Ilimitado'
    return num.toLocaleString('es-MX')
  }

  const formatStorage = (mb: number | null) => {
    if (mb === null || mb >= 999999) return 'Ilimitado'
    if (mb >= 1024) return `${(mb / 1024).toFixed(0)} GB`
    return `${mb} MB`
  }

  // Agrupar características por categoría
  const featureGroups = [
    {
      title: '📊 Límites',
      icon: Building2,
      features: [
        { label: `${formatNumber(limits.branches)} ${limits.branches === 1 ? 'sucursal' : 'sucursales'}`, enabled: true },
        { label: `${formatNumber(limits.users)} usuarios`, enabled: true },
        { label: `Productos ${formatNumber(limits.products)}`, enabled: true },
        { label: `Almacenamiento ${formatStorage(limits.storageMb)}`, enabled: true },
      ]
    },
    {
      title: '📋 Cotizaciones',
      icon: FileText,
      features: [
        { label: 'En línea', enabled: features.quotations_online || false },
        { label: 'Presencial', enabled: features.quotations_inperson || false },
        { label: 'Por WhatsApp', enabled: features.quotations_whatsapp || false },
      ]
    },
    {
      title: '💬 Ventas',
      icon: ShoppingCart,
      features: [
        { label: 'Ventas por WhatsApp', enabled: features.sales_whatsapp || false },
        { label: 'Multi-moneda', enabled: features.multi_currency || false },
        { label: 'Transferencias entre sucursales', enabled: features.transfers || false },
      ]
    },
    {
      title: '🤖 Inteligencia Artificial',
      icon: Brain,
      features: [
        { label: 'Agentes IA para ventas', enabled: features.ai_sales_agents || false },
        { label: 'Detección de anomalías', enabled: features.ai_anomaly_detection || false },
        { label: 'Alertas de robos/faltantes', enabled: features.ai_theft_alerts || false },
        { label: 'Predicción de demanda', enabled: features.ai_demand_prediction || false },
        { label: 'Reportes inteligentes', enabled: features.ai_smart_reports || false },
        { label: 'Optimización de inventario', enabled: features.ai_inventory_optimization || false },
        { label: 'Sugerencias de precios', enabled: features.ai_price_suggestions || false },
      ].filter(f => f.label) // Filtrar solo las características presentes
    },
    {
      title: '🎯 Soporte',
      icon: Users,
      features: [
        { label: features.dedicated_support ? 'Soporte dedicado 24/7' : features.priority_support ? 'Soporte prioritario' : 'Soporte por email', enabled: true },
        { label: 'Garantía SLA', enabled: features.sla_guarantee || false },
        { label: 'Asistencia en configuración', enabled: features.onboarding_support || false },
      ]
    },
  ]

  // Filtrar grupos que tengan al menos una característica habilitada (excepto Límites que siempre se muestra)
  const visibleGroups = featureGroups.filter((group, index) => 
    index === 0 || group.features.some(f => f.enabled)
  )

  return (
    <Card className={`relative transition-all hover:shadow-xl ${isPopular ? 'border-blue-500 border-2 shadow-lg scale-105' : ''} ${isCurrent ? 'bg-blue-50/50 border-blue-300' : ''}`}>
      {/* Badge Popular */}
      {isPopular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
          <Badge className="flex items-center gap-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-1.5 shadow-lg">
            <Zap className="h-3.5 w-3.5" />
            Más Popular
          </Badge>
        </div>
      )}

      {/* Badge Plan Actual */}
      {isCurrent && (
        <div className="absolute top-4 right-4 z-10">
          <Badge className="bg-green-600 text-white">
            ✓ Plan Actual
          </Badge>
        </div>
      )}

      <CardHeader className="text-center pb-4 pt-6">
        <CardTitle className="text-2xl font-bold">{name}</CardTitle>
        <CardDescription className="mt-2 text-base">{description}</CardDescription>
        
        <div className="mt-6">
          {price === 0 ? (
            <div className="text-4xl font-bold text-gray-900">Gratis</div>
          ) : (
            <>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-5xl font-bold text-gray-900">
                  ${price.toLocaleString('es-MX')}
                </span>
                <span className="text-gray-600 text-lg font-medium">
                  MXN
                </span>
              </div>
              <div className="text-gray-500 mt-1">
                {billingPeriod === 'monthly' ? 'por mes' : 'por año'}
              </div>
            </>
          )}
          
          {billingPeriod === 'annual' && savings > 0 && (
            <div className="mt-3">
              <div className="text-sm text-gray-500 line-through">
                ${originalAnnualPrice.toLocaleString('es-MX')} MXN/año
              </div>
              <div className="text-sm font-bold text-green-600 flex items-center justify-center gap-1">
                <span>Ahorra ${savings.toLocaleString('es-MX')} MXN</span>
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  {annualDiscountPercent}% OFF
                </Badge>
              </div>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <Button 
          onClick={onSelect}
          disabled={disabled || isCurrent}
          className={`w-full h-12 text-base font-semibold ${
            isPopular 
              ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800' 
              : ''
          }`}
          variant={isPopular ? 'default' : isCurrent ? 'secondary' : 'outline'}
        >
          {isCurrent ? '✓ Plan Actual' : disabled ? 'No Disponible' : price === 0 ? 'Comenzar Gratis' : 'Seleccionar Plan'}
        </Button>

        {/* Características agrupadas */}
        <div className="space-y-5">
          {visibleGroups.map((group, groupIndex) => {
            const IconComponent = group.icon
            const hasEnabledFeatures = group.features.some(f => f.enabled)
            
            return (
              <div key={groupIndex} className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 border-b pb-1">
                  <IconComponent className="h-4 w-4" />
                  <span>{group.title}</span>
                </div>
                <div className="space-y-2 pl-1">
                  {group.features.map((feature, featureIndex) => (
                    <div 
                      key={featureIndex} 
                      className={`flex items-start gap-2 ${!feature.enabled ? 'opacity-30' : ''}`}
                    >
                      {feature.enabled ? (
                        <Check className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-600 font-bold" />
                      ) : (
                        <X className="h-4 w-4 mt-0.5 flex-shrink-0 text-gray-300" />
                      )}
                      <span className={`text-sm ${feature.enabled ? 'text-gray-700' : 'text-gray-400'}`}>
                        {feature.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Trial info */}
        {code === 'FREE' && (
          <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800 font-semibold text-center">
              ✨ Perfecto para empezar y probar el sistema
            </p>
          </div>
        )}

        {code === 'ENTERPRISE' && (
          <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
            <p className="text-xs text-purple-800 font-semibold text-center">
              👑 Onboarding personalizado
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
