import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/subscriptions/status - Obtener estado de suscripción
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { companyId } = session.user

    // Obtener suscripción
    const subscription = await prisma.subscription.findUnique({
      where: { companyId }
    })

    if (!subscription) {
      return NextResponse.json({
        isInTrial: false,
        daysRemaining: 0,
        planType: 'FREE',
        trialEndsAt: null
      })
    }

    // Calcular días restantes de trial
    let isInTrial = false
    let daysRemaining = 0

    if (subscription.trialEndsAt && subscription.planType === 'FREE') {
      const now = new Date()
      const trialEnd = new Date(subscription.trialEndsAt)
      
      if (trialEnd > now) {
        isInTrial = true
        const diffTime = trialEnd.getTime() - now.getTime()
        daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      }
    }

    return NextResponse.json({
      isInTrial,
      daysRemaining,
      planType: subscription.planType,
      billingPeriod: subscription.billingPeriod,
      trialEndsAt: subscription.trialEndsAt?.toISOString() || null,
      currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() || null,
      status: subscription.status,
      limits: {
        branches: subscription.maxBranches,
        users: subscription.maxUsers,
        products: subscription.maxProducts,
        storageMb: subscription.maxStorageMb
      }
    })

  } catch (error) {
    console.error('Error fetching subscription status:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
