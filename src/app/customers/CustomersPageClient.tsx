'use client';

import { useSession } from 'next-auth/react';
import MainLayout from '@/components/layout/MainLayout';
import CustomerManagerOptimized from '@/components/dashboard/CustomerManagerOptimized';

interface CustomersPageClientProps {
    shouldCreate: boolean;
    returnTo: string | null;
    initialName: string | null;
}

export default function CustomersPageClient({
    shouldCreate,
    returnTo,
    initialName,
}: CustomersPageClientProps) {
    const { data: session } = useSession();

    if (!session) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                        <p className="text-gray-500">Cargando...</p>
                    </div>
                </div>
            </MainLayout>
        );
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
    );
}
