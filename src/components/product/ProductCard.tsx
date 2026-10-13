'use client';
import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Check, Eye, GitCompareArrows, Heart, Plus, Zap } from 'lucide-react';
import { fill } from '@/i18n';
import { useT } from '@/i18n/client';
import type { Product } from '@/lib/types';
import { cn, formatPrice, img, inStock, minPrice, productPath, totalStock } from '@/lib/utils';
import { useCartStore, useCompareStore, useHydrated } from '@/store';
import { useApp } from '../app-context';
import { QuickView } from './QuickView';

export function ProductCard({ product, eager }: { product: Product; eager?: boolean }) {
  const t = useT();
  const { wishlist, toggleWishlist } = useApp();
  const addItem = useCartStore((s) => s.addItem);
  const openDrawer = useCartStore((s) => s.openDrawer);
  const hydrated = useHydrated();
  const compareIds = useCompareStore((s) => s.ids);
  const toggleCompare = useCompareStore((s) => s.toggle);

  // Start on the first variant that can actually be bought.
  const firstAvailable = Math.max(0, product.variants.findIndex((v) => v.stock > 0));
  const [selected, setSelected] = useState(firstAvailable);
  const [added, setAdded] = useState(false);
  const [quickView, setQuickView] = useState(false);

  const variant = product.variants[selected];
  const available = inStock(product);
  const stock = totalStock(product);
  const saved = wishlist.has(product.id);
  const comparing = hydrated && compareIds.includes(product.id);
  const href = productPath(product);
  const image = variant?.image || product.images[0];

  const add = () => {
    if (!variant || variant.stock === 0) return;
    addItem(product, variant, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
    toast.success(fill(t.ui.product.added_toast, { name: product.name }), { action: { label: t.nav.cart, onClick: openDrawer } });
  };

  const compare = () => {
    const result = toggleCompare(product.id);
    if (result === 'full') toast.error(t.ui.product.compare_full);
    else if (result === 'added') toast.success(t.ui.product.compare_added);
  };

  return (
    <article className="card card-hover group flex h-full flex-col overflow-hidden" itemScope itemType="https://schema.org/Product">
      <meta itemProp="name" content={product.name} />
      <div className="stage relative aspect-square overflow-hidden">
        <Link href={href} className="block size-full" aria-label={product.name}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={img(image, 640)}
            alt={product.name}
            loading={eager ? 'eager' : 'lazy'}
            decoding="async"
            itemProp="image"
            className={cn('size-full object-cover transition duration-700 group-hover:scale-[1.06]', !available && 'opacity-50 grayscale')}
          />
        </Link>

        <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {product.featured && <span className="tag bg-brand-500 text-white dark:text-white"><Zap size={10} /> {t.ui.product.featured}</span>}
          {!available && <span className="tag bg-ink text-bg dark:text-bg">{t.shop.out_of_stock}</span>}
        </div>

        <div className="absolute right-3 top-3 flex flex-col gap-1.5">
          <button
            onClick={() => toggleWishlist(product.id)}
            aria-label={saved ? t.ui.product.wishlist_remove : t.ui.product.wishlist_add}
            aria-pressed={saved}
            className={cn('flex size-9 items-center justify-center rounded-full border border-line bg-surface/90 backdrop-blur transition hover:scale-110', saved ? 'text-red-500' : 'text-soft opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100')}
          >
            <Heart size={15} fill={saved ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={compare}
            aria-label={comparing ? t.ui.product.compare_remove : t.ui.product.compare}
            aria-pressed={comparing}
            className={cn('flex size-9 items-center justify-center rounded-full border border-line bg-surface/90 backdrop-blur transition hover:scale-110', comparing ? 'text-brand-500' : 'text-soft opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100')}
          >
            <GitCompareArrows size={15} />
          </button>
        </div>

        <button
          onClick={() => setQuickView(true)}
          className="absolute inset-x-3 bottom-3 hidden h-10 translate-y-3 items-center justify-center gap-2 rounded-full bg-surface/95 text-xs font-semibold opacity-0 shadow-lg backdrop-blur transition duration-300 hover:bg-surface group-hover:translate-y-0 group-hover:opacity-100 focus-visible:translate-y-0 focus-visible:opacity-100 sm:flex"
        >
          <Eye size={14} /> {t.ui.product.quick_view}
        </button>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-faint">{product.subCategory || product.category}</p>
        <Link href={href} className="mt-1.5 line-clamp-2 text-[15px] font-semibold leading-snug transition hover:text-brand-500 dark:hover:text-brand-300">
          {product.name}
        </Link>

        {product.variants.length > 1 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {product.variants.slice(0, 3).map((v, i) => (
              <button
                key={v.id}
                onClick={() => v.stock > 0 && setSelected(i)}
                disabled={v.stock === 0}
                title={v.title}
                className={cn(
                  'max-w-28 truncate rounded-full border px-2.5 py-1 text-[11px] transition',
                  i === selected ? 'border-brand-500 bg-brand-500/10 text-ink' : 'border-line text-soft hover:border-line-strong',
                  v.stock === 0 && 'cursor-not-allowed line-through opacity-40',
                )}
              >
                {v.title}
              </button>
            ))}
            {product.variants.length > 3 && (
              <button onClick={() => setQuickView(true)} className="rounded-full border border-dashed border-line px-2.5 py-1 text-[11px] text-faint hover:text-ink">
                {fill(t.ui.product.more_variants, { count: product.variants.length - 3 })}
              </button>
            )}
          </div>
        )}

        <div className="mt-auto flex items-end justify-between gap-3 pt-5" itemProp="offers" itemScope itemType="https://schema.org/Offer">
          <meta itemProp="priceCurrency" content="TND" />
          <meta itemProp="price" content={String(variant ? variant.price : minPrice(product))} />
          <link itemProp="availability" href={available ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'} />
          <div>
            <p className="price text-xl leading-none">
              {formatPrice(variant ? variant.price : minPrice(product))} <span className="text-xs text-faint">TND</span>
            </p>
            <p className={cn('mt-1.5 flex items-center gap-1.5 text-[11px]', available ? 'text-signal' : 'text-faint')}>
              <span className="size-1.5 rounded-full bg-current" />
              {available ? `${stock} ${t.shop.stock}` : t.shop.out_of_stock}
            </p>
          </div>
          <button
            onClick={add}
            disabled={!variant || variant.stock === 0}
            aria-label={`${t.shop.add_cart} — ${product.name}`}
            className={cn('flex size-11 shrink-0 items-center justify-center rounded-full text-white transition', added ? 'bg-emerald-500' : 'bg-brand-500 hover:scale-110 hover:bg-brand-400', 'disabled:bg-raised disabled:text-faint disabled:hover:scale-100')}
          >
            {added ? <Check size={18} /> : <Plus size={18} />}
          </button>
        </div>
      </div>

      {quickView && <QuickView product={product} onClose={() => setQuickView(false)} />}
    </article>
  );
}

export function ProductGrid({ products, className }: { products: Product[]; className?: string }) {
  return (
    <div className={cn('grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4', className)}>
      {products.map((product, i) => (
        <ProductCard key={product.id} product={product} eager={i < 4} />
      ))}
    </div>
  );
}
