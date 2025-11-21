'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect, useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import CategoryImportManager from '@/components/categories/CategoryImportManager';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function CategoriesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === 'loading') {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
    </div>;
  }

  if (!session) {
    redirect('/login');
  }

  // Solo ADMIN puede gestionar categorías
  if (session.user.role !== 'ADMIN') {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Acceso Denegado</h1>
        <p className="text-gray-600">Solo los administradores pueden gestionar categorías.</p>
      </div>
    </div>;
  }

  const handleImportComplete = () => {
    // Podrías agregar aquí lógica para refrescar datos o mostrar notificaciones
    console.log('Importación de categorías completada');
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Botón Volver a Configuración */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/settings')}
                  className="flex items-center gap-2"
                >
                  <ArrowLeftIcon className="w-4 h-4" />
                  Volver a Configuración
                </Button>
                
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-semibold">
                    Gestión de Categorías
                  </h1>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contenido principal */}
        <CategoryImportManager onImportComplete={handleImportComplete} />
      </div>
    </MainLayout>
  );
}