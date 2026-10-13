'use client';
import { useEffect, useState } from 'react';
import { getProductsForIds } from '@/server/actions/catalog';
import { useT } from '@/i18n/client';
import type { Product } from '@/lib/types';
import { useRecentStore } from '@/store';
import { ProductGrid } from '../product/ProductCard';

/** Last products this browser looked at. Renders nothing until there are some. */
export function RecentlyViewed({ excludeId }: { excludeId?: string }) {
  const t = useT();
  const ids = useRecentStore((s) => s.ids);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const wanted = ids.filter((id) => id !== excludeId).slice(0, 4);
    if (!wanted.length) return setProducts([]);
    let alive = true;
    getProductsForIds(wanted).then((list) => alive && setProducts(list));
    return () => {
      alive = false;
    };
  }, [ids, excludeId]);

  if (!products.length) return null;
  return (
    <section className="shell py-16">
      <h2 className="display mb-8 text-3xl sm:text-4xl">{t.ui.home.recently_viewed}</h2>
      <ProductGrid products={products} />
    </section>
  );
}
