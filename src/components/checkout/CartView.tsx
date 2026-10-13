'use client';
import Link from '@/components/Link';
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { EmptyState, Equalizer } from '@/components/ui';
import { plural } from '@/i18n';
import { useT } from '@/i18n/client';
import { formatPrice, img } from '@/lib/utils';
import { cartCount, cartTotal, useCartStore, useHydrated } from '@/store';
import { useApp } from '../app-context';

export function CartView() {
  const t = useT();
  const hydrated = useHydrated();
  const { settings } = useApp();
  const { items, updateQty, removeItem, clear } = useCartStore();
  const total = cartTotal(items);

  return (
    <div className="shell pb-10 pt-10 lg:pt-14">
      <h1 className="display text-5xl uppercase sm:text-7xl">{t.cart.title}</h1>

      {!hydrated ? (
        <div className="flex justify-center py-32"><Equalizer /></div>
      ) : items.length === 0 ? (
        <div className="mt-10">
          <EmptyState icon={<ShoppingBag size={26} />} title={t.cart.empty} sub={t.cart.empty_sub}>
            <Link href="/shop" className="btn btn-primary">{t.cart.browse} <ArrowRight size={15} /></Link>
          </EmptyState>
        </div>
      ) : (
        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div>
            <ul className="card divide-y divide-line px-6">
              {items.map((item) => {
                const href = `/product/${item.productSlug || item.productId}`;
                return (
                  <li key={`${item.productId}-${item.variantId}`} className="flex gap-5 py-6">
                    <Link href={href} className="stage size-24 shrink-0 overflow-hidden rounded-2xl border border-line sm:size-28">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img(item.image, 240)} alt={item.name} className="size-full object-cover" />
                    </Link>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <Link href={href} className="line-clamp-2 font-semibold leading-snug hover:text-brand-500 dark:hover:text-brand-300">{item.name}</Link>
                          <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-faint">{item.variantName}</p>
                        </div>
                        <button onClick={() => removeItem(item.productId, item.variantId)} className="icon-btn -mr-2 -mt-2 hover:text-red-500" aria-label={`${t.cart.remove} ${item.name}`}><Trash2 size={16} /></button>
                      </div>
                      <div className="mt-auto flex items-center justify-between pt-4">
                        <div className="inline-flex items-center rounded-full border border-line">
                          <button className="flex size-10 items-center justify-center text-soft hover:text-ink" onClick={() => updateQty(item.productId, item.variantId, item.quantity - 1)} aria-label="Decrease quantity"><Minus size={14} /></button>
                          <span className="w-7 text-center font-mono text-sm">{item.quantity}</span>
                          <button className="flex size-10 items-center justify-center text-soft hover:text-ink" onClick={() => updateQty(item.productId, item.variantId, item.quantity + 1)} aria-label="Increase quantity"><Plus size={14} /></button>
                        </div>
                        <div className="text-right">
                          <p className="price text-lg">{formatPrice(item.price * item.quantity)} TND</p>
                          {item.quantity > 1 && <p className="price text-xs text-faint">{formatPrice(item.price)} × {item.quantity}</p>}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="mt-4 flex justify-between">
              <Link href="/shop" className="btn btn-ghost btn-sm">← {t.ui.cart.continue}</Link>
              <button onClick={clear} className="btn btn-ghost btn-sm hover:text-red-500">{t.ui.cart.clear}</button>
            </div>
          </div>

          <aside className="card h-fit p-7 lg:sticky lg:top-24">
            <h2 className="display text-2xl">{t.cart.summary}</h2>
            <dl className="mt-6 grid gap-3 text-sm">
              <div className="flex justify-between"><dt className="text-soft">{t.cart.subtotal} · {plural(t.ui.cart.item_one, t.ui.cart.item_other, cartCount(items))}</dt><dd className="price">{formatPrice(total)} TND</dd></div>
              <div className="flex justify-between"><dt className="text-soft">{t.cart.shipping}</dt><dd className="font-mono text-xs uppercase tracking-wider text-signal">{t.cart.shipping_free}</dd></div>
            </dl>
            <div className="hairline my-5" />
            <div className="flex items-baseline justify-between">
              <span className="font-semibold">{t.cart.total}</span>
              <span className="price text-3xl">{formatPrice(total)} <span className="text-sm text-faint">TND</span></span>
            </div>
            {settings.deliveryPaused ? (
              <p className="mt-6 rounded-2xl bg-amber-500/10 px-4 py-3 text-sm text-amber-600 dark:text-amber-400">{settings.deliveryNotice || t.ui.checkout.paused_default}</p>
            ) : (
              <Link href="/checkout" className="btn btn-primary btn-lg mt-6 w-full">{t.cart.checkout} <ArrowRight size={17} /></Link>
            )}
            <p className="mt-3 text-center text-xs text-faint">{t.ui.cart.cod}</p>
          </aside>
        </div>
      )}
    </div>
  );
}
