import { Suspense } from 'react';
import type { Metadata } from 'next';
import { ShopClient } from '@/components/shop/ShopClient';
import type { Locale } from '@/i18n';
import { localizedMetadata } from '@/i18n/server';
import { getProducts, getSettings } from '@/server/data';

type Copy = { title: string; description: string };

const SHOP_META: Record<Locale, Copy> = {
  en: {
    title: 'Shop IEMs & Audio Accessories in Tunisia',
    description: 'Browse every IEM, cable, ear tip and DAC we carry. KZ, 7Hz, Moondrop, Simgot and more — free delivery across Tunisia.',
  },
  fr: {
    title: 'Boutique IEM & accessoires audio en Tunisie',
    description: 'Tous nos IEM, câbles, embouts et DAC. KZ, 7Hz, Moondrop, Simgot et plus — livraison gratuite partout en Tunisie.',
  },
};

// The two category views are landing pages in their own right (and are listed in the sitemap).
const CATEGORY_META: Record<string, Record<Locale, Copy>> = {
  iems: {
    en: {
      title: 'IEM Tunisie — In-Ear Monitors for Gaming & Music',
      description: 'All our IEMs (in-ear monitors) in Tunisia: KZ, 7Hz, Moondrop and more, for gaming and music. Compare prices in TND — free delivery, cash on delivery.',
    },
    fr: {
      title: 'IEM Tunisie — Écouteurs intra-auriculaires gaming & musique',
      description: 'Tous nos IEM (écouteurs intra-auriculaires) en Tunisie : KZ, 7Hz, Moondrop et plus, pour le gaming et la musique. Prix en TND — livraison gratuite, paiement à la livraison.',
    },
  },
  accessories: {
    en: {
      title: 'IEM Accessories in Tunisia — Cables, Ear Tips & DACs',
      description: 'IEM cables, ear tips, cases and USB-C DAC dongles in Tunisia. Free delivery across the country, cash on delivery.',
    },
    fr: {
      title: 'Accessoires IEM en Tunisie — Câbles, embouts & DAC',
      description: 'Câbles pour IEM, embouts, étuis et DAC USB-C en Tunisie. Livraison gratuite dans tout le pays, paiement à la livraison.',
    },
  },
};

export async function generateMetadata({ searchParams }: PageProps<'/shop'>): Promise<Metadata> {
  const { cat, sub, brand, search } = await searchParams;
  // Any further filter is a variation of the same list: it keeps the plain /shop canonical.
  if (typeof cat === 'string' && !sub && !brand && !search && CATEGORY_META[cat]) return localizedMetadata(`/shop?cat=${cat}`, CATEGORY_META[cat]);
  return localizedMetadata('/shop', SHOP_META);
}

export default async function ShopPage() {
  const [products, settings] = await Promise.all([getProducts(), getSettings()]);
  return (
    <Suspense>
      <ShopClient products={products} brands={settings.brands} />
    </Suspense>
  );
}
