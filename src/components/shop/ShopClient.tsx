'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from '@/components/Link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, Search, SearchX, SlidersHorizontal, X } from 'lucide-react';
import { ProductGrid } from '@/components/product/ProductCard';
import { EmptyState } from '@/components/ui';
import { fill, plural } from '@/i18n';
import { useT } from '@/i18n/client';
import { ACCESSORY_SUBS, CATEGORY_LABELS } from '@/lib/constants';
import type { Product } from '@/lib/types';
import { cn, inStock, minPrice } from '@/lib/utils';

const PAGE_SIZE = 12;
type Sort = 'new' | 'price_asc' | 'price_desc';

/** Brand match: by sub-category first, then by name — exactly how the old shop filtered. */
const matchesBrand = (p: Product, brand: string) => {
  const b = brand.toLowerCase();
  return p.subCategory?.toLowerCase() === b || p.name.toLowerCase().includes(b);
};

export function ShopClient({ products, brands }: { products: Product[]; brands: string[] }) {
  const t = useT();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const cat = params.get('cat') ?? '';
  const sub = params.get('sub') ?? '';
  const brand = params.get('brand') ?? '';
  const urlSearch = params.get('search') ?? '';

  const [search, setSearch] = useState(urlSearch);
  const [sort, setSort] = useState<Sort>('new');
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => setSearch(urlSearch), [urlSearch]);

  /** Filters live in the URL so every view is shareable. */
  const setParams = (next: Record<string, string | null>) => {
    const sp = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) sp.set(key, value);
      else sp.delete(key);
    }
    const qs = sp.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const filtered = useMemo(() => {
    let list = products;
    if (cat) list = list.filter((p) => p.category === cat);
    if (sub) list = list.filter((p) => p.subCategory === sub);
    if (brand) list = list.filter((p) => matchesBrand(p, brand));
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((p) => `${p.name} ${p.subCategory ?? ''} ${p.description} ${p.descriptionFr}`.toLowerCase().includes(q));
    if (onlyInStock) list = list.filter(inStock);

    return [...list].sort((a, b) => {
      // Sold-out products always sink to the bottom.
      const stockDelta = Number(inStock(b)) - Number(inStock(a));
      if (stockDelta) return stockDelta;
      if (sort === 'price_asc') return minPrice(a) - minPrice(b);
      if (sort === 'price_desc') return minPrice(b) - minPrice(a);
      return (b.createdAt ?? '').localeCompare(a.createdAt ?? '');
    });
  }, [products, cat, sub, brand, search, sort, onlyInStock]);

  // Back to page 1 whenever the result set changes.
  const filterKey = `${cat}|${sub}|${brand}|${search}|${sort}|${onlyInStock}`;
  useEffect(() => setPage(1), [filterKey]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const visible = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const hasFilters = Boolean(cat || sub || brand || search || onlyInStock);

  const heading = brand || (sub ? (t.ui.sub as Record<string, string>)[sub] ?? sub : cat ? CATEGORY_LABELS[cat] ?? cat : t.shop.title);
  // Only offer brands that actually have products.
  const liveBrands = brands.filter((b) => products.some((p) => p.category === 'iems' && matchesBrand(p, b)));
  const liveSubs = ACCESSORY_SUBS.filter((s) => products.some((p) => p.subCategory === s));

  const goToPage = (n: number) => {
    setPage(n);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="shell pb-10 pt-10 lg:pt-14">
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-faint">
        <Link href="/" className="hover:text-ink">{t.ui.common.home}</Link>
        <span>/</span>
        <Link href="/shop" className={cn('hover:text-ink', !hasFilters && 'text-ink')}>{t.nav.shop}</Link>
        {cat && (<><span>/</span><span className="text-ink">{CATEGORY_LABELS[cat] ?? cat}</span></>)}
      </nav>

      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="display text-5xl uppercase sm:text-7xl">{heading}</h1>
          <p className="mt-3 text-soft">{hasFilters ? plural(t.ui.shop.result_one, t.ui.shop.result_other, filtered.length) : t.shop.subtitle}</p>
        </div>
      </header>

      {/* Category tabs */}
      <div className="no-scrollbar -mx-4 mt-8 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <button onClick={() => setParams({ cat: null, sub: null, brand: null })} className={cn('chip h-10 shrink-0 px-4 text-sm', !cat && !brand && !sub && 'chip-active')}>{t.shop.filter_all}</button>
        <button onClick={() => setParams({ cat: 'iems', sub: null, brand: null })} className={cn('chip h-10 shrink-0 px-4 text-sm', cat === 'iems' && !brand && 'chip-active')}>{t.ui.nav.iems}</button>
        <button onClick={() => setParams({ cat: 'accessories', sub: null, brand: null })} className={cn('chip h-10 shrink-0 px-4 text-sm', cat === 'accessories' && !sub && 'chip-active')}>{t.ui.nav.accessories}</button>
        <span className="mx-1 w-px shrink-0 self-stretch bg-line" />
        {cat === 'accessories'
          ? liveSubs.map((s) => (
              <button key={s} onClick={() => setParams({ cat: 'accessories', sub: sub === s ? null : s, brand: null })} className={cn('chip h-10 shrink-0 px-4 text-sm', sub === s && 'chip-active')}>{t.ui.sub[s]}</button>
            ))
          : liveBrands.map((b) => (
              <button key={b} onClick={() => setParams({ brand: brand === b ? null : b, sub: null, cat: null })} className={cn('chip h-10 shrink-0 px-4 text-sm', brand.toLowerCase() === b.toLowerCase() && 'chip-active')}>{b}</button>
            ))}
      </div>

      {/* Toolbar */}
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-faint" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.shop.search} aria-label={t.shop.search} className="input pl-11 pr-10" />
          {search && (
            <button onClick={() => { setSearch(''); if (urlSearch) setParams({ search: null }); }} className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-faint hover:text-ink" aria-label={t.ui.shop.clear}><X size={15} /></button>
          )}
        </div>
        <label className="chip h-12 shrink-0 cursor-pointer gap-2.5 px-4 text-sm">
          <input type="checkbox" checked={onlyInStock} onChange={(e) => setOnlyInStock(e.target.checked)} className="size-4 accent-brand-500" />
          {t.ui.shop.in_stock_only}
        </label>
        <div className="relative shrink-0 sm:w-56">
          <SlidersHorizontal size={15} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-faint" />
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="input pl-11" aria-label="Sort">
            <option value="new">{t.shop.sort_new}</option>
            <option value="price_asc">{t.shop.sort_price_asc}</option>
            <option value="price_desc">{t.shop.sort_price_desc}</option>
          </select>
        </div>
      </div>

      <div className="mt-8">
        {visible.length === 0 ? (
          <EmptyState icon={<SearchX size={26} />} title={t.shop.no_products} sub={t.ui.shop.empty_sub}>
            {hasFilters && (
              <button onClick={() => { setSearch(''); setOnlyInStock(false); router.replace(pathname, { scroll: false }); }} className="btn btn-outline">{t.ui.shop.clear}</button>
            )}
          </EmptyState>
        ) : (
          <ProductGrid products={visible} />
        )}
      </div>

      {totalPages > 1 && (
        <nav className="mt-12 flex flex-col items-center gap-4" aria-label="Pagination">
          <div className="flex items-center gap-1.5">
            <button onClick={() => goToPage(current - 1)} disabled={current === 1} className="icon-btn border border-line disabled:opacity-40" aria-label={t.ui.shop.prev}><ChevronLeft size={17} /></button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((n) => n === 1 || n === totalPages || Math.abs(n - current) <= 1)
              .map((n, i, list) => (
                <span key={n} className="flex items-center gap-1.5">
                  {i > 0 && n - list[i - 1] > 1 && <span className="px-1 text-faint">…</span>}
                  <button onClick={() => goToPage(n)} aria-current={n === current ? 'page' : undefined} className={cn('size-10 rounded-full font-mono text-sm transition', n === current ? 'bg-brand-500 text-white' : 'text-soft hover:bg-raised')}>{n}</button>
                </span>
              ))}
            <button onClick={() => goToPage(current + 1)} disabled={current === totalPages} className="icon-btn border border-line disabled:opacity-40" aria-label={t.ui.shop.next}><ChevronRight size={17} /></button>
          </div>
          <p className="font-mono text-xs text-faint">
            {fill(t.ui.shop.showing, { from: (current - 1) * PAGE_SIZE + 1, to: Math.min(current * PAGE_SIZE, filtered.length), total: filtered.length })}
          </p>
        </nav>
      )}
    </div>
  );
}
