import type { MetadataRoute } from 'next';
import { localizePath } from '@/i18n';
import { BRAND_PAGES } from '@/lib/brands';
import { SITE_URL } from '@/lib/site';
import { getProducts } from '@/server/data';

export const dynamic = 'force-dynamic';

type Entry = MetadataRoute.Sitemap[number];

/** Next writes these values into the XML as-is, so a raw `&` (common in image URLs) breaks the whole file. */
const xml = (value: string) => value.replace(/&(?!(?:amp|lt|gt|quot|apos);)/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Every page exists twice — English at the bare path, French under /fr — and each entry names both versions. */
function bilingual(path: string, rest: Omit<Entry, 'url' | 'alternates'>): Entry[] {
  const en = xml(`${SITE_URL}${path}`);
  const fr = xml(`${SITE_URL}${localizePath(path || '/', 'fr')}`);
  const alternates = { languages: { en, fr, 'x-default': en } };
  return [{ url: en, ...rest, alternates }, { url: fr, ...rest, alternates }];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // No `lastModified` on these: a date that changes on every request teaches Google to ignore the field.
  const page = (path: string, priority: number, changeFrequency: 'daily' | 'weekly' | 'monthly' | 'yearly') => bilingual(path, { changeFrequency, priority });

  const products = await getProducts().catch(() => []);
  return [
    ...page('', 1, 'daily'),
    ...page('/shop', 0.9, 'daily'),
    ...page('/shop?cat=iems', 0.8, 'daily'),
    ...page('/shop?cat=accessories', 0.7, 'weekly'),
    ...Object.keys(BRAND_PAGES).flatMap((slug) => page(`/brands/${slug}`, 0.8, 'weekly')),
    ...page('/reviews', 0.6, 'weekly'),
    ...page('/about', 0.5, 'monthly'),
    ...page('/contact', 0.5, 'monthly'),
    ...page('/return-policy', 0.4, 'yearly'),
    ...page('/privacy-policy', 0.3, 'yearly'),
    ...page('/terms', 0.3, 'yearly'),
    ...products.flatMap((p) =>
      bilingual(`/product/${p.slug || p.id}`, {
        lastModified: p.updatedAt || p.createdAt ? new Date((p.updatedAt || p.createdAt)!) : undefined,
        images: p.images.filter((src) => src.startsWith('http')).slice(0, 5).map(xml),
        changeFrequency: 'weekly',
        priority: p.featured ? 0.9 : 0.8,
      }),
    ),
  ];
}
