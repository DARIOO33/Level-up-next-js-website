import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

const PRIVATE = ['/admin', '/checkout', '/cart', '/profile', '/orders', '/wishlist', '/login', '/forgot-password', '/reset-password', '/review/', '/compare'];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // The same private pages exist under the French prefix.
        disallow: ['/api/', ...PRIVATE, ...PRIVATE.map((path) => `/fr${path}`)],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
