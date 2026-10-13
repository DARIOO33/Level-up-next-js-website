import { Suspense } from 'react';
import type { Metadata } from 'next';
import { ShopClient } from '@/components/shop/ShopClient';
import { getProducts, getSettings } from '@/server/data';

export const metadata: Metadata = {
  title: 'Shop IEMs & Audio Accessories',
  description: 'Browse every IEM, cable, ear tip and DAC we carry. KZ, 7Hz, Moondrop, Simgot and more — free delivery across Tunisia.',
  alternates: { canonical: '/shop' },
};

export default async function ShopPage() {
  const [products, settings] = await Promise.all([getProducts(), getSettings()]);
  return (
    <Suspense>
      <ShopClient products={products} brands={settings.brands} />
    </Suspense>
  );
}
