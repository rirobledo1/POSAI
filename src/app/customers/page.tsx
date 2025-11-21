'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import MainLayout from '@/components/layout/MainLayout'
import CustomerManagerOptimized from '@/components/dashboard/CustomerManagerOptimized'

export default function CustomersPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Detectar si viene desde el POS con parámetros
  const shouldCreate = searchParams.get('create') === 'true'
  const returnTo = searchParams.get('returnTo')
  const initialName = searchParams.get('name')

  if (!session) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-gray-500">Cargando...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="p-6">
        <CustomerManagerOptimized 
          shouldCreate={shouldCreate}
          returnTo={returnTo}
          initialName={initialName}
        />
      </div>
    </MainLayout>
  )
}
