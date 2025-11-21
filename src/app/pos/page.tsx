'use client';

import POSInterface from '@/components/pos/POSInterface';
import MainLayout from '@/components/layout/MainLayout';
import RouteProtector from '@/components/layout/RouteProtector';
import { useSession } from 'next-auth/react';

export default function POSPage() {
  const { data: session } = useSession();

  return (
    <RouteProtector allowedRoles={['ADMIN', 'VENDEDOR']}>
      <MainLayout>
        <div className="p-1">

          <POSInterface />
        </div>
      </MainLayout>
    </RouteProtector>
  );
}