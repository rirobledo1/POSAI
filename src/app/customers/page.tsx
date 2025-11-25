import React from 'react';
import CustomersPageClient from './CustomersPageClient';

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const shouldCreate = params.create === 'true';
  const returnTo = typeof params.returnTo === 'string' ? params.returnTo : null;
  const initialName = typeof params.name === 'string' ? params.name : null;

  return (
    <CustomersPageClient
      shouldCreate={shouldCreate}
      returnTo={returnTo}
      initialName={initialName}
    />
  );
}

