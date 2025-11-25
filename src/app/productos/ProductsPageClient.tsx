'use client';

import { redirect } from 'next/navigation';
import { useSession } from 'next-auth/react';
import ProductsManagerOptimized from '@/components/products/ProductsManagerOptimized';
import MainLayout from '@/components/layout/MainLayout';

interface ProductsPageClientProps {
    editProductId: string | null;
    createProduct: boolean;
    returnTo: string | null;
    initialName: string | null;
}

export default function ProductsPageClient({
    editProductId,
    createProduct,
    returnTo,
    initialName,
}: ProductsPageClientProps) {
    const { data: session, status } = useSession();

    if (status === 'loading') {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!session) {
        redirect('/login');
    }

    // ADMIN, VENDEDOR y ALMACEN pueden gestionar productos
    if (!['ADMIN', 'VENDEDOR', 'ALMACEN'].includes(session.user.role)) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Acceso Denegado</h1>
                    <p className="text-gray-600">No tienes permisos para gestionar productos.</p>
                </div>
            </div>
        );
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
