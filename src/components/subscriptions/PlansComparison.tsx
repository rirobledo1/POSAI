'use client'

import { useState, useEffect } from 'react'
import { PlanCard } from './PlanCard'
import { CheckoutModal } from './CheckoutModal'
import { Card, CardContent } from '@/components/ui/card'
import { useNotifications } from '@/components/ui/NotificationProvider'

interface Plan {
  id: string
  code: string
  name: string
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
  features: any
  trialDays: number
  isPopular: boolean
  isCurrent: boolean
}

export function PlansComparison() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('annual')
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [showCheckout, setShowCheckout] = useState(false)
  const [currentBillingPeriod, setCurrentBillingPeriod] = useState<'monthly' | 'annual'>('monthly')
  const [hasAnnualSubscription, setHasAnnualSubscription] = useState(false)
  const { showError } = useNotifications()

  useEffect(() => {
    loadPlans()
  }, [])

  const loadPlans = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/subscriptions/plans')
      if (!response.ok) throw new Error('Error al cargar planes')
      
      const data = await response.json()
      setPlans(data.plans)
      setCurrentBillingPeriod(data.currentBillingPeriod || 'monthly')
      setHasAnnualSubscription(data.hasAnnualSubscription || false)
      
      // Si tiene suscripción anual, mantener el toggle en anual
      if (data.hasAnnualSubscription) {
        setBillingPeriod('annual')
      }
    } catch (error) {
      console.error('Error:', error)
      showError('Error', 'No se pudieron cargar los planes')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectPlan = (plan: Plan) => {
    // Validar si el plan está permitido según el billing period actual
    const currentBillingPeriod = plans.find(p => p.isCurrent)?.isCurrent 
      ? (plans[0]?.isCurrent ? 'current' : 'monthly') // Obtener el período actual
      : 'monthly'

    setSelectedPlan(plan)
    setShowCheckout(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando planes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">
          Elige el plan perfecto para tu negocio
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Comienza gratis y escala cuando lo necesites. Sin contratos, cancela cuando quieras.
        </p>
      </div>

      {/* Toggle Mensual/Anual */}
      <Card className="max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                billingPeriod === 'monthly'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Mensual
            </button>
            <button
              onClick={() => setBillingPeriod('annual')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors relative ${
                billingPeriod === 'annual'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Anual
              <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                -16%
              </span>
            </button>
          </div>
          {billingPeriod === 'annual' && (
            <p className="text-center text-sm text-green-600 mt-3 font-medium">
              🎉 Ahorra un 16% con el pago anual
            </p>
          )}
        </CardContent>
      </Card>

      {/* Grid de Planes - 2x2 en desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 lg:gap-8 max-w-6xl mx-auto px-4">
        {plans.map((plan) => {
          // Calcular si es el plan actual considerando el plan Y el período de facturación
          const isCurrentPlanAndPeriod = plan.isCurrent && currentBillingPeriod === billingPeriod
          
          return (
            <PlanCard
              key={plan.id}
              name={plan.name}
              code={plan.code}
              description={plan.description}
              monthlyPrice={plan.monthlyPrice}
              annualPrice={plan.annualPrice}
              annualDiscountPercent={plan.annualDiscountPercent}
              limits={plan.limits}
              features={plan.features}
              isPopular={plan.isPopular}
              isCurrent={isCurrentPlanAndPeriod}
              billingPeriod={billingPeriod}
              onSelect={() => handleSelectPlan(plan)}
              disabled={plan.code === 'FREE' && plans.some(p => p.isCurrent && p.code !== 'FREE')}
            />
          )
        })}
      </div>

      {/* FAQ / Info adicional */}
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4">¿Preguntas frecuentes?</h3>
            <div className="space-y-4 text-sm text-gray-600">
              <div>
                <p className="font-medium text-gray-900">¿Puedo cambiar de plan en cualquier momento?</p>
                <p>Sí, puedes actualizar o degradar tu plan cuando lo necesites.</p>
              </div>
              <div>
                <p className="font-medium text-gray-900">¿Qué pasa si supero los límites de mi plan?</p>
                <p>Te notificaremos antes de alcanzar los límites. Puedes actualizar tu plan en cualquier momento.</p>
              </div>
              <div>
                <p className="font-medium text-gray-900">¿Los precios incluyen IVA?</p>
                <p>Los precios mostrados son más IVA (16%).</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal de Checkout */}
      {showCheckout && selectedPlan && (
        <CheckoutModal
          plan={selectedPlan}
          billingPeriod={billingPeriod}
          onClose={() => {
            setShowCheckout(false)
            setSelectedPlan(null)
          }}
          onSuccess={() => {
            setShowCheckout(false)
            setSelectedPlan(null)
            loadPlans() // Recargar para actualizar plan actual
          }}
        />
      )}
    </div>
  )
}
