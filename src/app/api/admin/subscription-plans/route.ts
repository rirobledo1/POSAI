import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/subscription-plans - Obtener todos los planes (solo super admin)
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar si es super admin
    const superAdmin = await prisma.superAdmin.findUnique({
      where: { userId: session.user.id }
    })

    if (!superAdmin) {
      return NextResponse.json({ 
        error: 'Acceso denegado. Solo super administradores.' 
      }, { status: 403 })
    }

    // Obtener todos los planes
    const plans = await prisma.planConfig.findMany({
      orderBy: {
        displayOrder: 'asc'
      }
    })

    return NextResponse.json({
      plans: plans.map(plan => ({
        id: plan.id,
        planCode: plan.planCode,
        planName: plan.planName,
        description: plan.description,
        monthlyPriceMxn: Number(plan.monthlyPriceMxn),
        annualPriceMxn: Number(plan.annualPriceMxn),
        monthlyPriceUsd: Number(plan.monthlyPriceUsd),
        annualPriceUsd: Number(plan.annualPriceUsd),
        annualDiscountPercent: plan.annualDiscountPercent,
        maxBranches: plan.maxBranches,
        maxUsers: plan.maxUsers,
        maxProducts: plan.maxProducts,
        maxStorageMb: plan.maxStorageMb,
        features: plan.features,
        trialDays: plan.trialDays,
        displayOrder: plan.displayOrder,
        isActive: plan.isActive,
        isPopular: plan.isPopular,
        createdAt: plan.createdAt.toISOString(),
        updatedAt: plan.updatedAt.toISOString()
      }))
    })

  } catch (error) {
    console.error('Error fetching plans:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/subscription-plans - Actualizar un plan (solo super admin)
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar si es super admin
    const superAdmin = await prisma.superAdmin.findUnique({
      where: { userId: session.user.id }
    })

    if (!superAdmin) {
      return NextResponse.json({ 
        error: 'Acceso denegado. Solo super administradores.' 
      }, { status: 403 })
    }

    const body = await request.json()
    const { 
      id,
      planName,
      description,
      monthlyPriceMxn,
      annualPriceMxn,
      monthlyPriceUsd,
      annualPriceUsd,
      annualDiscountPercent,
      maxBranches,
      maxUsers,
      maxProducts,
      maxStorageMb,
      features,
      trialDays,
      displayOrder,
      isActive,
      isPopular
    } = body

    if (!id) {
      return NextResponse.json({ error: 'ID del plan requerido' }, { status: 400 })
    }

    // Actualizar el plan
    const updatedPlan = await prisma.planConfig.update({
      where: { id },
      data: {
        planName,
        description,
        monthlyPriceMxn,
        annualPriceMxn,
        monthlyPriceUsd,
        annualPriceUsd,
        annualDiscountPercent,
        maxBranches,
        maxUsers,
        maxProducts,
        maxStorageMb,
        features,
        trialDays,
        displayOrder,
        isActive,
        isPopular
      }
    })

    return NextResponse.json({
      message: 'Plan actualizado exitosamente',
      plan: {
        id: updatedPlan.id,
        planCode: updatedPlan.planCode,
        planName: updatedPlan.planName,
        monthlyPriceMxn: Number(updatedPlan.monthlyPriceMxn),
        annualPriceMxn: Number(updatedPlan.annualPriceMxn)
      }
    })

  } catch (error) {
    console.error('Error updating plan:', error)
    return NextResponse.json(
      { error: 'Error al actualizar el plan' },
      { status: 500 }
    )
  }
}
