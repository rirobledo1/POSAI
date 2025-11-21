'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect, useSearchParams } from 'next/navigation';
import ProductsManagerOptimized from '@/components/products/ProductsManagerOptimized';
import MainLayout from '@/components/layout/MainLayout'; // Import por defecto

export default function ProductsPage() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  
  // Extraer parámetros de URL
  const editProductId = searchParams.get('edit');
  const createProduct = searchParams.get('create') === 'true';
  const returnTo = searchParams.get('returnTo');
  const initialName = searchParams.get('name');

  if (status === 'loading') {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
    </div>;
  }

  if (!session) {
    redirect('/login');
  }

  // ADMIN, VENDEDOR y ALMACEN pueden gestionar productos
  if (!['ADMIN', 'VENDEDOR', 'ALMACEN'].includes(session.user.role)) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Acceso Denegado</h1>
        <p className="text-gray-600">No tienes permisos para gestionar productos.</p>
      </div>
    </div>;
  }

  return (
    <MainLayout>
      <div className="p-6">

        <ProductsManagerOptimized 
          editProductId={editProductId || undefined}
          createProduct={createProduct}
          returnTo={returnTo || undefined}
          initialName={initialName || undefined}
        />
      </div>
    </MainLayout>
  );
}