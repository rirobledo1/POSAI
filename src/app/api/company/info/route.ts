// src/app/api/company/info/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/company/info
 * Obtener información básica de la empresa del usuario
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener el usuario con su empresa
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        companyId: true,
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
            plan: true,
            onlineStoreEnabled: true,
            onlineStoreUrl: true,
            allowOnlineQuotes: true,
            allowOnlineSales: true
          }
        }
      }
    })

    if (!user?.company) {
      return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 })
    }

    return NextResponse.json({
      id: user.company.id,
      name: user.company.name,
      slug: user.company.slug,
      plan: user.company.plan,
      onlineStoreEnabled: user.company.onlineStoreEnabled,
      onlineStoreUrl: user.company.onlineStoreUrl,
      allowOnlineQuotes: user.company.allowOnlineQuotes,
      allowOnlineSales: user.company.allowOnlineSales
    })

  } catch (error) {
    console.error('Error fetching company info:', error)
    return NextResponse.json(
      { error: 'Error al obtener información de la empresa' },
      { status: 500 }
    )
  }
}
