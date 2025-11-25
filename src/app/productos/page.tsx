import React from 'react';
import ProductsPageClient from './ProductsPageClient';

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Server Component - extract search params
  const params = await searchParams;
  const editProductId = typeof params.edit === 'string' ? params.edit : null;
  const createProduct = params.create === 'true';
  const returnTo = typeof params.returnTo === 'string' ? params.returnTo : null;
  const initialName = typeof params.name === 'string' ? params.name : null;

  return (
    <ProductsPageClient
      editProductId={editProductId}
      createProduct={createProduct}
      returnTo={returnTo}
      initialName={initialName}
    />
  );
}