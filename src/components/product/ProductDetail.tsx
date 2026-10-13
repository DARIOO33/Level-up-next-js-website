'use client';
import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { BadgeCheck, Banknote, Bell, BellRing, Check, GitCompareArrows, Heart, Minus, Plus, RotateCcw, Share2, ShoppingBag, Truck } from 'lucide-react';
import { getNotifyStatus, toggleNotify } from '@/server/actions/account';
import { fill, plural } from '@/i18n';
import { useLocale, useT } from '@/i18n/client';
import type { Product, Review } from '@/lib/types';
import { cn, formatDate, formatPrice, img } from '@/lib/utils';
import { useCartStore, useCompareStore, useHydrated, useRecentStore } from '@/store';
import { useApp } from '../app-context';
import { Spinner, Stars } from '../ui';

export function ProductDetail({ product, reviews, reviewCount, reviewAvg }: { product: Product; reviews: Review[]; reviewCount: number; reviewAvg: number | null }) {
  const t = useT();
  const locale = useLocale();
  const { user, wishlist, toggleWishlist } = useApp();
  const addItem = useCartStore((s) => s.addItem);
  const openDrawer = useCartStore((s) => s.openDrawer);
  const pushRecent = useRecentStore((s) => s.push);
  const hydrated = useHydrated();
  const compareIds = useCompareStore((s) => s.ids);
  const toggleCompare = useCompareStore((s) => s.toggle);

  const [selected, setSelected] = useState(Math.max(0, product.variants.findIndex((v) => v.stock > 0)));
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const [watching, setWatching] = useState<boolean | null>(null);
  const [notifyPending, startNotify] = useTransition();

  const variant = product.variants[selected];
  const soldOut = !variant || variant.stock === 0;
  const gallery = [...new Set([...product.images, ...product.variants.map((v) => v.image)].filter(Boolean))];
  const image = activeImage ?? variant?.image ?? gallery[0];
  const saved = wishlist.has(product.id);
  const comparing = hydrated && compareIds.includes(product.id);
  const specs = Object.entries(product.specifications);
  const key = product.slug || product.id;

  useEffect(() => pushRecent(product.id), [product.id, pushRecent]);

  // Is this customer already waiting for this variant?
  useEffect(() => {
    setWatching(null);
    if (!user || !variant || variant.stock > 0) return;
    let alive = true;
    getNotifyStatus(key, variant.id).then((r) => alive && setWatching(r.ok ? r.data.isWatching : false));
    return () => {
      alive = false;
    };
  }, [user, key, variant]);

  const add = () => {
    if (soldOut) return;
    addItem(product, variant, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
    toast.success(fill(t.ui.product.added_toast, { name: product.name }), { action: { label: t.nav.cart, onClick: openDrawer } });
  };

  const notify = () => {
    if (!user) return toast.error(t.ui.product.login_to_notify);
    startNotify(async () => {
      const result = await toggleNotify(key, variant?.id);
      if (!result.ok) return void toast.error(result.message);
      setWatching(result.data.isWatching);
      toast.success(result.message ?? '');
    });
  };

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: product.name, url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success(t.ui.product.link_copied);
      }
    } catch {
      /* share sheet dismissed */
    }
  };

  const compare = () => {
    const result = toggleCompare(product.id);
    if (result === 'full') toast.error(t.ui.product.compare_full);
    else if (result === 'added') toast.success(t.ui.product.compare_added);
  };

  return (
    <div className="shell pt-8 lg:pt-12">
      <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-faint">
        <Link href="/" className="hover:text-ink">{t.ui.common.home}</Link>
        <span>/</span>
        <Link href="/shop" className="hover:text-ink">{t.nav.shop}</Link>
        {product.subCategory && (
          <>
            <span>/</span>
            <Link href={product.category === 'iems' ? `/shop?brand=${encodeURIComponent(product.subCategory)}` : `/shop?cat=accessories&sub=${product.subCategory}`} className="hover:text-ink">{product.subCategory}</Link>
          </>
        )}
      </nav>

      <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        {/* Gallery */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="stage relative aspect-square overflow-hidden rounded-[2rem] border border-line">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img key={image} src={img(image, 1200)} alt={product.name} fetchPriority="high" className={cn('size-full animate-fade object-cover', soldOut && 'opacity-60 grayscale')} />
            {product.featured && <span className="tag absolute left-5 top-5 bg-brand-500 text-white dark:text-white">{t.ui.product.featured}</span>}
          </div>
          {gallery.length > 1 && (
            <div className="no-scrollbar mt-3 flex gap-3 overflow-x-auto pb-1">
              {gallery.map((src, i) => (
                <button key={src} onClick={() => setActiveImage(src)} aria-label={`Image ${i + 1}`} aria-current={image === src} className={cn('stage size-20 shrink-0 overflow-hidden rounded-2xl border-2 transition', image === src ? 'border-brand-500' : 'border-transparent opacity-60 hover:opacity-100')}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img(src, 200)} alt="" loading="lazy" className="size-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Buy box */}
        <div>
          <p className="eyebrow">{product.subCategory || product.category}</p>
          <h1 className="display mt-4 text-4xl sm:text-5xl">{product.name}</h1>

          {reviewCount > 0 && reviewAvg && (
            <a href="#reviews" className="mt-4 inline-flex items-center gap-2 text-sm text-soft hover:text-ink">
              <Stars value={reviewAvg} />
              <span className="font-mono font-medium text-ink">{reviewAvg}</span>
              <span>({plural(t.ui.product.review_one, t.ui.product.review_other, reviewCount)})</span>
            </a>
          )}

          <div className="mt-6 flex items-end gap-4">
            <p className="price text-5xl">{formatPrice(variant?.price ?? 0)} <span className="text-lg text-faint">TND</span></p>
            <p className={cn('mb-1.5 flex items-center gap-1.5 text-sm', soldOut ? 'text-faint' : 'text-signal')}>
              <span className="size-2 rounded-full bg-current" />
              {soldOut ? t.shop.out_of_stock : variant.stock <= 3 ? fill(t.ui.product.low_stock, { count: variant.stock }) : `${variant.stock} ${t.shop.stock}`}
            </p>
          </div>

          {product.variants.length > 0 && (
            <div className="mt-8">
              <p className="label">{t.shop.variants}</p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v, i) => (
                  <button
                    key={v.id}
                    onClick={() => { setSelected(i); setActiveImage(null); setQuantity(1); }}
                    aria-pressed={i === selected}
                    className={cn('rounded-2xl border px-4 py-2.5 text-left text-sm transition', i === selected ? 'border-brand-500 bg-brand-500/10' : 'border-line hover:border-line-strong', v.stock === 0 && 'opacity-55')}
                  >
                    <span className={cn('block font-medium', v.stock === 0 && 'line-through')}>{v.title}</span>
                    <span className="price block text-xs text-faint">{v.stock === 0 ? t.shop.out_of_stock : `${formatPrice(v.price)} TND`}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {soldOut ? (
              <button onClick={notify} disabled={notifyPending || (Boolean(user) && watching === null)} className={cn('btn btn-lg flex-1', watching ? 'btn-outline' : 'btn-primary')}>
                {notifyPending || (user && watching === null) ? <Spinner /> : watching ? <BellRing size={17} /> : <Bell size={17} />}
                {watching ? t.ui.product.notifying : t.ui.product.notify_me}
              </button>
            ) : (
              <>
                <div className="inline-flex h-13 items-center rounded-full border border-line">
                  <button className="flex size-12 items-center justify-center text-soft hover:text-ink" onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="Decrease quantity"><Minus size={16} /></button>
                  <span className="w-8 text-center font-mono" aria-live="polite">{quantity}</span>
                  <button className="flex size-12 items-center justify-center text-soft hover:text-ink" onClick={() => setQuantity((q) => Math.min(variant.stock, q + 1))} aria-label="Increase quantity"><Plus size={16} /></button>
                </div>
                <button onClick={add} className={cn('btn btn-lg flex-1', added ? 'bg-emerald-500 text-white' : 'btn-primary')}>
                  {added ? <Check size={18} /> : <ShoppingBag size={18} />} {added ? t.ui.product.added : t.shop.add_cart}
                </button>
              </>
            )}
            <button onClick={() => toggleWishlist(product.id)} aria-pressed={saved} aria-label={saved ? t.ui.product.wishlist_remove : t.ui.product.wishlist_add} className={cn('icon-btn size-13 border border-line', saved && 'border-red-500/40 text-red-500')}>
              <Heart size={19} fill={saved ? 'currentColor' : 'none'} />
            </button>
          </div>

          <div className="mt-4 flex gap-2">
            <button onClick={compare} className={cn('btn btn-ghost btn-sm', comparing && 'text-brand-500')}><GitCompareArrows size={15} /> {comparing ? t.ui.product.compare_remove : t.ui.product.compare}</button>
            <button onClick={share} className="btn btn-ghost btn-sm"><Share2 size={15} /> {t.shop.share}</button>
          </div>

          <ul className="mt-8 grid grid-cols-2 gap-3">
            {[
              { Icon: Truck, text: t.ui.product.delivery_note },
              { Icon: Banknote, text: t.ui.product.cod_note },
              { Icon: RotateCcw, text: t.ui.product.return_note },
              { Icon: BadgeCheck, text: t.ui.product.authentic_note },
            ].map(({ Icon, text }) => (
              <li key={text} className="flex items-center gap-3 rounded-2xl border border-line px-4 py-3 text-xs text-soft">
                <Icon size={17} className="shrink-0 text-brand-500" /> {text}
              </li>
            ))}
          </ul>

          {product.description && (
            <section className="mt-10">
              <h2 className="label">{t.ui.product.description}</h2>
              <p className="whitespace-pre-line text-[15px] leading-relaxed text-soft">{product.description}</p>
            </section>
          )}

          {specs.length > 0 && (
            <section className="mt-10">
              <h2 className="label">{t.shop.specs}</h2>
              <dl className="overflow-hidden rounded-3xl border border-line">
                {specs.map(([name, value], i) => (
                  <div key={name} className={cn('grid grid-cols-[minmax(7rem,38%)_1fr] gap-4 px-5 py-3.5 text-sm', i % 2 === 1 && 'bg-raised/60')}>
                    <dt className="font-mono text-[11px] uppercase tracking-wider text-faint">{name}</dt>
                    <dd className="font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
        </div>
      </div>

      {/* Reviews */}
      <section id="reviews" className="mt-20 scroll-mt-24">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <h2 className="display text-3xl uppercase sm:text-4xl">{t.shop.reviews}</h2>
          {reviewAvg && (
            <p className="flex items-center gap-3 text-sm text-soft">
              <Stars value={reviewAvg} size={16} />
              <span><span className="font-mono text-lg font-medium text-ink">{reviewAvg}</span> / 5 · {plural(t.ui.product.review_one, t.ui.product.review_other, reviewCount)}</span>
            </p>
          )}
        </div>
        {reviews.length === 0 ? (
          <div className="card px-6 py-12 text-center">
            <p className="font-medium">{t.ui.product.no_reviews}</p>
            <p className="mt-1 text-sm text-soft">{t.ui.product.no_reviews_sub}</p>
          </div>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {reviews.map((review) => {
              const name = review.showName && review.name ? review.name : t.ui.product.anonymous;
              return (
                <li key={review.id} className="card p-6">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-full bg-brand-500/15 font-semibold text-brand-600 dark:text-brand-300">{review.showName && review.name ? name[0].toUpperCase() : '?'}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{name}</p>
                      <p className="font-mono text-[11px] text-faint">{formatDate(review.createdAt, locale === 'fr' ? 'fr-FR' : 'en-GB')}</p>
                    </div>
                    <Stars value={review.rating ?? 0} />
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-soft">{review.comment}</p>
                  {review.source !== 'website' && <span className="tag mt-4">{review.source}</span>}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
