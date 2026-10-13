'use client';
import Link from '@/components/Link';
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { fill, plural } from '@/i18n';
import { useT } from '@/i18n/client';
import { formatPrice, img } from '@/lib/utils';
import { cartCount, cartTotal, useCartStore } from '@/store';
import { Modal } from '../ui';

export function CartDrawer() {
  const t = useT();
  const { items, drawerOpen, closeDrawer, updateQty, removeItem } = useCartStore();
  const count = cartCount(items);

  return (
    <Modal open={drawerOpen} onClose={closeDrawer} side title={`${t.ui.cart.drawer_title}${count ? ` · ${count}` : ''}`}>
      {items.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center gap-4 px-8 py-20 text-center">
          <div className="flex size-16 items-center justify-center rounded-3xl bg-brand-500/10 text-brand-500"><ShoppingBag size={26} /></div>
          <p className="display text-2xl">{t.cart.empty}</p>
          <p className="text-sm text-soft">{t.cart.empty_sub}</p>
          <Link href="/shop" onClick={closeDrawer} className="btn btn-primary mt-2">{t.cart.browse}</Link>
        </div>
      ) : (
        <div className="flex min-h-full flex-col">
          <ul className="flex-1 divide-y divide-line px-6">
            {items.map((item) => (
              <li key={`${item.productId}-${item.variantId}`} className="flex gap-4 py-5">
                <Link href={`/product/${item.productSlug || item.productId}`} onClick={closeDrawer} className="stage size-20 shrink-0 overflow-hidden rounded-2xl border border-line">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img(item.image, 200)} alt={item.name} className="size-full object-cover" />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link href={`/product/${item.productSlug || item.productId}`} onClick={closeDrawer} className="line-clamp-2 text-sm font-medium leading-snug hover:text-brand-400">{item.name}</Link>
                  <p className="mt-0.5 truncate font-mono text-[11px] uppercase tracking-wider text-faint">{item.variantName}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="inline-flex items-center rounded-full border border-line">
                      <button className="flex size-8 items-center justify-center text-soft hover:text-ink" onClick={() => updateQty(item.productId, item.variantId, item.quantity - 1)} aria-label="Decrease quantity"><Minus size={13} /></button>
                      <span className="w-6 text-center font-mono text-xs">{item.quantity}</span>
                      <button className="flex size-8 items-center justify-center text-soft hover:text-ink" onClick={() => updateQty(item.productId, item.variantId, item.quantity + 1)} aria-label="Increase quantity"><Plus size={13} /></button>
                    </div>
                    <span className="price text-sm">{formatPrice(item.price * item.quantity)} TND</span>
                  </div>
                </div>
                <button onClick={() => removeItem(item.productId, item.variantId)} className="self-start p-1 text-faint transition hover:text-red-500" aria-label={t.cart.remove}><Trash2 size={15} /></button>
              </li>
            ))}
          </ul>
          <div className="sticky bottom-0 border-t border-line bg-surface px-6 pb-6 pt-5">
            <div className="flex items-center justify-between text-sm text-soft">
              <span>{t.cart.shipping}</span>
              <span className="font-mono text-xs uppercase tracking-wider text-signal">{t.cart.shipping_free}</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-sm text-soft">{t.cart.total} · {plural(t.ui.cart.item_one, t.ui.cart.item_other, count)}</span>
              <span className="price text-2xl">{formatPrice(cartTotal(items))} <span className="text-sm text-faint">TND</span></span>
            </div>
            <Link href="/checkout" onClick={closeDrawer} className="btn btn-primary btn-lg mt-4 w-full">{t.cart.checkout}</Link>
            <Link href="/cart" onClick={closeDrawer} className="btn btn-ghost mt-1 w-full">{t.ui.cart.view_cart}</Link>
            <p className="mt-2 text-center text-xs text-faint">{fill(t.ui.cart.cod, {})}</p>
          </div>
        </div>
      )}
    </Modal>
  );
}
