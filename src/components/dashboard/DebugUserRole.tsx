'use client'

import { useSession } from 'next-auth/react'
import { Card, CardContent } from '@/components/ui/card'

export function DebugUserRole() {
  const { data: session, status } = useSession()
  
  return (
    <Card className="mb-4 border-red-200 bg-red-50">
      <CardContent className="p-4">
        <h3 className="font-bold text-red-800 mb-2">🔍 DEBUG - Información de Sesión</h3>
        <div className="text-sm space-y-1">
          <p><strong>Status:</strong> {status}</p>
          <p><strong>Session exists:</strong> {session ? 'Sí' : 'No'}</p>
          <p><strong>User:</strong> {JSON.stringify(session?.user, null, 2)}</p>
          <p><strong>Role from session:</strong> {session?.user?.role}</p>
          <p><strong>Role type:</strong> {typeof session?.user?.role}</p>
          <p><strong>Default role:</strong> {session?.user?.role || 'SOLO_LECTURA'}</p>
        </div>
      </CardContent>
    </Card>
  )
}
