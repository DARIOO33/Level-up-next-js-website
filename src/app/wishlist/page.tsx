import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Heart } from 'lucide-react';
import { ProductGrid } from '@/components/product/ProductCard';
import { EmptyState } from '@/components/ui';
import { plural } from '@/i18n';
import { getT } from '@/i18n/server';
import { getProductsByIds, getWishlistIds } from '@/server/data';
import { getSessionUser } from '@/server/session';

export const metadata: Metadata = { title: 'My Wishlist', robots: { index: false } };

export default async function WishlistPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login?next=/wishlist');
  const [t, products] = await Promise.all([getT(), getWishlistIds(user.id).then(getProductsByIds)]);

  return (
    <div className="shell pb-10 pt-10 lg:pt-14">
      <h1 className="display text-5xl uppercase sm:text-7xl">{t.wishlist.title}</h1>
      <p className="mt-3 text-soft">{plural(t.wishlist.count_one, t.wishlist.count_other, products.length)}</p>
      <div className="mt-10">
        {products.length === 0 ? (
          <EmptyState icon={<Heart size={26} />} title={t.wishlist.empty} sub={t.wishlist.empty_sub}>
            <Link href="/shop" className="btn btn-primary">{t.wishlist.browse}</Link>
          </EmptyState>
        ) : (
          <ProductGrid products={products} />
        )}
      </div>
    </div>
  );
}
