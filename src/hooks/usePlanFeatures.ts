// Hook para verificar características del plan de suscripción
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { getPlanFeatures, hasPlanFeature, type PlanType } from '@/lib/plan-features'

export function usePlanFeatures() {
  const { data: session } = useSession()
  const [plan, setPlan] = useState<PlanType>('FREE')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPlanInfo = async () => {
      try {
        const response = await fetch('/api/company/info')
        if (response.ok) {
          const data = await response.json()
          setPlan(data.plan as PlanType)
        }
      } catch (error) {
        console.error('Error fetching plan info:', error)
      } finally {
        setLoading(false)
      }
    }

    if (session?.user?.companyId) {
      fetchPlanInfo()
    } else {
      setLoading(false)
    }
  }, [session?.user?.companyId])

  const features = getPlanFeatures(plan)

  const hasFeature = (feature: keyof typeof features) => {
    return hasPlanFeature(plan, feature)
  }

  return {
    plan,
    features,
    hasFeature,
    loading,
    // Shortcuts para características comunes
    canQuoteOnline: features.quotationOnline,
    canQuoteWhatsApp: features.quotationWhatsApp,
    canUseOnlineStore: features.onlineStore,
    canProcessOnlinePayments: features.onlinePayments,
  }
}
