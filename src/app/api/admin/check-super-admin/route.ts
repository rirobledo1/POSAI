import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/check-super-admin - Verificar si el usuario es super admin
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ isSuperAdmin: false })
    }

    // Verificar si existe en la tabla super_admins
    const superAdmin = await prisma.superAdmin.findUnique({
      where: { userId: session.user.id }
    })

    return NextResponse.json({ 
      isSuperAdmin: !!superAdmin,
      permissions: superAdmin?.permissions || null
    })

  } catch (error) {
    console.error('Error checking super admin:', error)
    return NextResponse.json({ isSuperAdmin: false })
  }
}
