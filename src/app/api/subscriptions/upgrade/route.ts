import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/subscriptions/upgrade - Actualizar plan (con pago dummy)
export async function POST(request: NextRequest) {
  try {
    console.log('🎯 Upgrade request received')
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.companyId) {
      console.log('❌ No session or companyId')
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { companyId, role } = session.user
    console.log('👤 User:', session.user.email, 'Role:', role, 'Company:', companyId)

    // Solo ADMIN puede cambiar el plan
    if (role !== 'ADMIN') {
      console.log('❌ Not admin')
      return NextResponse.json(
        { error: 'Solo administradores pueden cambiar el plan' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { planCode, billingPeriod, paymentMethod, cardData } = body
    console.log('📦 Request body:', { planCode, billingPeriod })

    // Validar que billingPeriod sea correcto
    if (!['monthly', 'annual'].includes(billingPeriod)) {
      return NextResponse.json(
        { error: 'billingPeriod debe ser "monthly" o "annual"' },
        { status: 400 }
      )
    }

    // 1. Obtener configuración del plan
    console.log('🔍 Looking for plan:', planCode)
    const planConfig = await prisma.planConfig.findUnique({
      where: { planCode }
    })

    if (!planConfig) {
      console.log('❌ Plan not found:', planCode)
      return NextResponse.json(
        { error: 'Plan no encontrado' },
        { status: 404 }
      )
    }

    console.log('✅ Plan found:', planConfig.planName)
    console.log('📊 Plan prices:', {
      monthly: planConfig.monthlyPriceMxn,
      annual: planConfig.annualPriceMxn
    })

    // 2. Calcular monto (usar los campos correctos con MXN)
    let amount: number
    
    if (billingPeriod === 'monthly') {
      amount = Number(planConfig.monthlyPriceMxn) || 0
    } else {
      amount = Number(planConfig.annualPriceMxn) || 0
    }
    
    console.log('💰 Calculated amount:', amount)

    // Validar que el monto sea válido
    if (isNaN(amount) || amount < 0) {
      console.error('❌ Invalid amount:', amount)
      return NextResponse.json(
        { error: 'Precio del plan no configurado correctamente' },
        { status: 500 }
      )
    }

    // 3. Obtener o crear suscripción
    console.log('🔍 Looking for existing subscription...')
    let subscription = await prisma.subscription.findUnique({
      where: { companyId }
    })

    const periodEnd = billingPeriod === 'monthly'
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)

    if (!subscription) {
      console.log('📝 Creating new subscription...')
      subscription = await prisma.subscription.create({
        data: {
          companyId,
          planType: planCode,
          billingPeriod: billingPeriod,
          maxBranches: planConfig.maxBranches,
          maxUsers: planConfig.maxUsers,
          maxProducts: planConfig.maxProducts,
          maxStorageMb: planConfig.maxStorageMb,
          status: 'active',
          currentPeriodStart: new Date(),
          currentPeriodEnd: periodEnd
        }
      })
      console.log('✅ Subscription created:', subscription.id)
    } else {
      console.log('📝 Updating existing subscription:', subscription.id)
      subscription = await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          planType: planCode,
          billingPeriod: billingPeriod,
          maxBranches: planConfig.maxBranches,
          maxUsers: planConfig.maxUsers,
          maxProducts: planConfig.maxProducts,
          maxStorageMb: planConfig.maxStorageMb,
          status: 'active',
          currentPeriodStart: new Date(),
          currentPeriodEnd: periodEnd
        }
      })
      console.log('✅ Subscription updated')
    }

    // 4. Registrar pago en historial
    console.log('💳 Creating payment history...')
    console.log('💳 Payment data:', {
      subscriptionId: subscription.id,
      companyId,
      amount,
      planCode,
      billingPeriod
    })

    await prisma.paymentHistory.create({
      data: {
        subscription: {
          connect: { id: subscription.id }
        },
        company: {
          connect: { id: companyId }
        },
        amount,
        currency: 'MXN',
        billingPeriod,
        planCode,
        status: 'completed',
        paymentMethod: paymentMethod || 'card',
        cardLast4: cardData?.last4,
        cardBrand: cardData?.brand || 'Tarjeta',
        paymentDate: new Date()
      }
    })
    console.log('✅ Payment history created')

    // 5. Actualizar tabla companies
    console.log('🏢 Updating company...')
    await prisma.company.update({
      where: { id: companyId },
      data: {
        plan: planCode as any,
        maxBranches: planConfig.maxBranches,
        maxUsers: planConfig.maxUsers,
        maxProducts: planConfig.maxProducts
      }
    })
    console.log('✅ Company updated')

    console.log('🎉 Upgrade completed successfully!')

    return NextResponse.json({
      success: true,
      message: `Plan actualizado a ${planConfig.planName}`,
      subscription: {
        planType: subscription.planType,
        planName: planConfig.planName,
        billingPeriod: subscription.billingPeriod,
        amount,
        maxBranches: subscription.maxBranches,
        maxUsers: subscription.maxUsers,
        currentPeriodEnd: subscription.currentPeriodEnd
      }
    })

  } catch (error: any) {
    console.error('❌ Error upgrading subscription:', error)
    console.error('Error details:', error.message)
    console.error('Error stack:', error.stack)
    
    return NextResponse.json(
      { 
        error: 'Error al procesar el cambio de plan',
        details: error.message,
        type: error.constructor.name
      },
      { status: 500 }
    )
  }
}
