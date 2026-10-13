import type { MetadataRoute } from 'next';
import { BRAND_PAGES } from '@/lib/brands';
import { SITE_URL } from '@/lib/site';
import { getProducts } from '@/server/data';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // No `lastModified` on these: a date that changes on every request teaches Google to ignore the field.
  const page = (path: string, priority: number, changeFrequency: 'daily' | 'weekly' | 'monthly' | 'yearly') => ({ url: `${SITE_URL}${path}`, changeFrequency, priority });

  const products = await getProducts().catch(() => []);
  return [
    page('', 1, 'daily'),
    page('/shop', 0.9, 'daily'),
    page('/shop?cat=iems', 0.8, 'daily'),
    page('/shop?cat=accessories', 0.7, 'weekly'),
    ...Object.keys(BRAND_PAGES).map((slug) => page(`/brands/${slug}`, 0.8, 'weekly')),
    page('/reviews', 0.6, 'weekly'),
    page('/about', 0.5, 'monthly'),
    page('/contact', 0.5, 'monthly'),
    page('/return-policy', 0.4, 'yearly'),
    page('/privacy-policy', 0.3, 'yearly'),
    page('/terms', 0.3, 'yearly'),
    ...products.map((p) => ({
      url: `${SITE_URL}/product/${p.slug || p.id}`,
      lastModified: p.updatedAt || p.createdAt ? new Date((p.updatedAt || p.createdAt)!) : undefined,
      images: p.images.filter((src) => src.startsWith('http')).slice(0, 5),
      changeFrequency: 'weekly' as const,
      priority: p.featured ? 0.9 : 0.8,
    })),
  ];
}
