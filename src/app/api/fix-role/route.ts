// API temporal para corregir rol de usuario
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const userId = session.user.id
    const userEmail = session.user.email

    // Actualizar rol a ADMIN
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        role: 'ADMIN'
      }
    })

    console.log(`✅ Rol actualizado para ${userEmail}: ${updatedUser.role}`)

    return NextResponse.json({
      success: true,
      message: 'Rol actualizado exitosamente a ADMIN',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role
      }
    })

  } catch (error) {
    console.error('Error actualizando rol:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
