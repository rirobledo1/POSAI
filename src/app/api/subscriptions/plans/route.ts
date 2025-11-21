import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/subscriptions/plans - Obtener todos los planes disponibles
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener todos los planes activos
    const plans = await prisma.planConfig.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        displayOrder: 'asc'
      }
    })

    // Obtener suscripción actual del usuario
    let currentSubscription = null
    if (session.user.companyId) {
      currentSubscription = await prisma.subscription.findUnique({
        where: {
          companyId: session.user.companyId
        }
      })
    }

    // Formatear respuesta
    const formattedPlans = plans.map(plan => ({
      id: plan.id,
      code: plan.planCode,
      name: plan.planName,
      description: plan.description,
      // Precios en MXN (principal)
      monthlyPriceMxn: Number(plan.monthlyPriceMxn),
      annualPriceMxn: Number(plan.annualPriceMxn),
      // Precios en USD (para referencia)
      monthlyPriceUsd: Number(plan.monthlyPriceUsd),
      annualPriceUsd: Number(plan.annualPriceUsd),
      // Mantener compatibilidad con código existente
      monthlyPrice: Number(plan.monthlyPriceMxn),
      annualPrice: Number(plan.annualPriceMxn),
      annualDiscountPercent: plan.annualDiscountPercent,
      limits: {
        branches: plan.maxBranches,
        users: plan.maxUsers,
        products: plan.maxProducts,
        storageMb: plan.maxStorageMb
      },
      features: plan.features as any,
      trialDays: plan.trialDays,
      isPopular: plan.isPopular,
      isCurrent: currentSubscription?.planType === plan.planCode
    }))

    return NextResponse.json({
      plans: formattedPlans,
      currentPlan: currentSubscription?.planType || 'FREE',
      currentBillingPeriod: currentSubscription?.billingPeriod || 'monthly',
      trialEndsAt: currentSubscription?.trialEndsAt?.toISOString(),
      hasAnnualSubscription: currentSubscription?.billingPeriod === 'annual'
    })

  } catch (error) {
    console.error('Error fetching plans:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
