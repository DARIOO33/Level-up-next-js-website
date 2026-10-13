import { Suspense } from 'react';
import type { Metadata } from 'next';
import { ShopClient } from '@/components/shop/ShopClient';
import { getProducts, getSettings } from '@/server/data';

const SHOP_META: Metadata = {
  title: 'Shop IEMs & Audio Accessories in Tunisia',
  description: 'Browse every IEM, cable, ear tip and DAC we carry. KZ, 7Hz, Moondrop, Simgot and more — free delivery across Tunisia.',
  alternates: { canonical: '/shop' },
};

// The two category views are landing pages in their own right (and are listed in the sitemap).
const CATEGORY_META: Record<string, Metadata> = {
  iems: {
    title: 'IEM Tunisie — In-Ear Monitors for Gaming & Music',
    description: 'All our IEMs (in-ear monitors) in Tunisia: KZ, 7Hz, Moondrop and more, for gaming and music. Compare prices in TND — free delivery, cash on delivery.',
    alternates: { canonical: '/shop?cat=iems' },
  },
  accessories: {
    title: 'IEM Accessories in Tunisia — Cables, Ear Tips & DACs',
    description: 'IEM cables, ear tips, cases and USB-C DAC dongles in Tunisia. Free delivery across the country, cash on delivery.',
    alternates: { canonical: '/shop?cat=accessories' },
  },
};

export async function generateMetadata({ searchParams }: PageProps<'/shop'>): Promise<Metadata> {
  const { cat, sub, brand, search } = await searchParams;
  // Any further filter is a variation of the same list: it keeps the plain /shop canonical.
  if (typeof cat === 'string' && !sub && !brand && !search && CATEGORY_META[cat]) return CATEGORY_META[cat];
  return SHOP_META;
}

export default async function ShopPage() {
  const [products, settings] = await Promise.all([getProducts(), getSettings()]);
  return (
    <Suspense>
      <ShopClient products={products} brands={settings.brands} />
    </Suspense>
  );
}
