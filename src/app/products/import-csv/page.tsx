/**
 * Página para importación masiva de productos via CSV
 * Sistema completamente independiente del módulo de productos existente
 */

import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import MainLayout from '@/components/layout/MainLayout';
import CSVImportManager from '@/components/products/CSVImportManager';

export const metadata: Metadata = {
  title: 'Importación CSV - Productos | FerreAI',
  description: 'Importación masiva de productos desde archivo CSV',
};

export default async function ImportCSVPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  // Solo ADMIN y ALMACEN pueden importar productos
  if (!['ADMIN', 'ALMACEN'].includes(session.user.role)) {
    redirect('/dashboard');
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6">
        <CSVImportManager />
      </div>
    </MainLayout>
  );
}
