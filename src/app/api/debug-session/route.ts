// API temporal para debuggear la sesión del usuario SOLO_LECTURA
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    const debugInfo = {
      timestamp: new Date().toISOString(),
      session: session ? {
        user: {
          id: session.user?.id,
          email: session.user?.email,
          name: session.user?.name,
          role: session.user?.role,
          isActive: session.user?.isActive
        },
        expires: session.expires
      } : null,
      hasSession: !!session,
      hasUser: !!session?.user,
      hasUserId: !!session?.user?.id,
      userRole: session?.user?.role || null
    }
    
    console.log('🔍 Debug session info:', debugInfo)
    
    return NextResponse.json({
      debug: debugInfo,
      canAccessDashboard: !!(session?.user?.id),
      message: session?.user?.id 
        ? `✅ Usuario autenticado: ${session.user.role}` 
        : '❌ No hay sesión activa'
    })
    
  } catch (error) {
    console.error('Error debugging session:', error)
    return NextResponse.json({ 
      error: 'Error al obtener información de sesión',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
