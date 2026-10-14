'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from '@/components/Link';
import { toast } from 'sonner';
import { GitCompareArrows, ShoppingBag, X } from 'lucide-react';
import { EmptyState, Equalizer } from '@/components/ui';
import { getProductsForIds } from '@/server/actions/catalog';
import { fill } from '@/i18n';
import { useLocale, useT } from '@/i18n/client';
import { CATEGORY_LABELS } from '@/lib/constants';
import { productCopy } from '@/lib/product-copy';
import type { Product } from '@/lib/types';
import { cn, formatPrice, img, inStock, maxPrice, minPrice, productPath, totalStock } from '@/lib/utils';
import { useCartStore, useCompareStore, useHydrated } from '@/store';

/** Spec-for-spec table for up to three products picked with the compare button. */
export function CompareView() {
  const t = useT();
  const locale = useLocale();
  const hydrated = useHydrated();
  const { ids, remove, clear } = useCompareStore();
  const addItem = useCartStore((s) => s.addItem);
  const [products, setProducts] = useState<Product[] | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    if (!ids.length) return setProducts([]);
    let alive = true;
    getProductsForIds(ids).then((list) => alive && setProducts(list));
    return () => {
      alive = false;
    };
  }, [ids, hydrated]);

  // Every spec any of the products has, in first-seen order, keyed by its English name so the rows line up.
  const specRows = useMemo(() => {
    const labels = new Map<string, string>();
    const values = new Map<string, Map<string, string>>();
    for (const p of products ?? []) {
      const byKey = new Map<string, string>();
      for (const [key, name, value] of productCopy(p, locale).specs) {
        if (!labels.has(key)) labels.set(key, name);
        byKey.set(key, value);
      }
      values.set(p.id, byKey);
    }
    return [...labels].map(([key, label]) => ({ key, label, valueOf: (p: Product) => values.get(p.id)?.get(key) }));
  }, [products, locale]);
  const cheapest = products?.length ? Math.min(...products.map(minPrice)) : 0;

  const rows: { label: string; render: (p: Product) => React.ReactNode }[] = [
    {
      label: t.ui.compare.price,
      render: (p) => (
        <span className={cn('price text-lg', products!.length > 1 && minPrice(p) === cheapest && 'text-signal')}>
          {formatPrice(minPrice(p))}{maxPrice(p) !== minPrice(p) ? `–${formatPrice(maxPrice(p))}` : ''} TND
        </span>
      ),
    },
    { label: t.ui.compare.availability, render: (p) => (inStock(p) ? <span className="text-signal">{totalStock(p)} {t.shop.stock}</span> : <span className="text-faint">{t.shop.out_of_stock}</span>) },
    { label: t.ui.compare.category, render: (p) => CATEGORY_LABELS[p.category] ?? p.category },
    { label: t.ui.compare.brand, render: (p) => p.subCategory ?? '—' },
    { label: t.ui.compare.variants, render: (p) => p.variants.map((v) => v.title).join(' · ') },
    ...specRows.map(({ label, valueOf }) => ({ label, render: (p: Product) => valueOf(p) ?? <span className="text-faint">—</span> })),
  ];

  return (
    <div className="shell pb-10 pt-10 lg:pt-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">{t.ui.compare.tag}</p>
          <h1 className="display mt-4 text-5xl uppercase sm:text-7xl">{t.ui.compare.title}</h1>
          <p className="mt-3 text-soft">{t.ui.compare.sub}</p>
        </div>
        {products && products.length > 0 && <button onClick={clear} className="btn btn-outline btn-sm">{t.ui.compare.clear}</button>}
      </div>

      <div className="mt-10">
        {products === null ? (
          <div className="flex justify-center py-24"><Equalizer /></div>
        ) : products.length === 0 ? (
          <EmptyState icon={<GitCompareArrows size={26} />} title={t.ui.compare.empty} sub={t.ui.compare.empty_sub}>
            <Link href="/shop" className="btn btn-primary">{t.cart.browse}</Link>
          </EmptyState>
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[560px] table-fixed text-sm">
              <thead>
                <tr>
                  <th className="w-36 sm:w-44" />
                  {products.map((p) => (
                    <th key={p.id} scope="col" className="border-l border-line p-5 text-left align-top font-normal">
                      <div className="relative">
                        <button onClick={() => remove(p.id)} className="absolute -right-2 -top-2 flex size-8 items-center justify-center rounded-full bg-surface text-faint shadow ring-1 ring-line hover:text-red-500" aria-label={`${t.ui.compare.remove} ${p.name}`}><X size={14} /></button>
                        <Link href={productPath(p)} className="stage block aspect-square overflow-hidden rounded-2xl border border-line">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={img(p.images[0], 400)} alt={p.name} className="size-full object-cover" />
                        </Link>
                        <Link href={productPath(p)} className="mt-4 block font-semibold leading-snug hover:text-brand-500 dark:hover:text-brand-300">{p.name}</Link>
                        <button
                          disabled={!inStock(p)}
                          onClick={() => {
                            const variant = p.variants.find((v) => v.stock > 0);
                            if (!variant) return;
                            addItem(p, variant, 1);
                            toast.success(fill(t.ui.product.added_toast, { name: p.name }));
                          }}
                          className="btn btn-primary btn-sm mt-4 w-full"
                        >
                          <ShoppingBag size={14} /> {inStock(p) ? t.shop.add_cart : t.shop.out_of_stock}
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={row.label} className={cn('border-t border-line', i % 2 === 0 && 'bg-raised/40')}>
                    <th scope="row" className="px-5 py-4 text-left font-mono text-[11px] font-medium uppercase tracking-wider text-faint">{row.label}</th>
                    {products.map((p) => <td key={p.id} className="border-l border-line px-5 py-4 align-top">{row.render(p)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
