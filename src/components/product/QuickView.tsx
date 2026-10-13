'use client';
import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { ArrowRight, Minus, Plus, ShoppingBag } from 'lucide-react';
import { fill } from '@/i18n';
import { useT } from '@/i18n/client';
import type { Product } from '@/lib/types';
import { cn, formatPrice, img, productPath } from '@/lib/utils';
import { useCartStore } from '@/store';
import { Modal } from '../ui';

export function QuickView({ product, onClose }: { product: Product; onClose: () => void }) {
  const t = useT();
  const addItem = useCartStore((s) => s.addItem);
  const openDrawer = useCartStore((s) => s.openDrawer);
  const [selected, setSelected] = useState(Math.max(0, product.variants.findIndex((v) => v.stock > 0)));
  const [quantity, setQuantity] = useState(1);
  const [imageIndex, setImageIndex] = useState(-1); // -1 = follow the selected variant

  const variant = product.variants[selected];
  const gallery = [...new Set([...product.images, ...product.variants.map((v) => v.image)].filter(Boolean))];
  const image = imageIndex >= 0 ? gallery[imageIndex] : variant?.image || gallery[0];
  const specs = Object.entries(product.specifications).slice(0, 4);

  const add = () => {
    if (!variant || variant.stock === 0) return;
    addItem(product, variant, quantity);
    toast.success(fill(t.ui.product.added_toast, { name: product.name }));
    onClose();
    openDrawer();
  };

  return (
    <Modal open onClose={onClose} size="xl" title={t.ui.product.quick_view}>
      <div className="grid gap-8 p-6 md:grid-cols-2">
        <div>
          <div className="stage aspect-square overflow-hidden rounded-3xl border border-line">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img(image, 900)} alt={product.name} className="size-full object-cover" />
          </div>
          {gallery.length > 1 && (
            <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
              {gallery.map((src, i) => (
                <button key={src} onClick={() => setImageIndex(i)} className={cn('stage size-16 shrink-0 overflow-hidden rounded-2xl border transition', image === src ? 'border-brand-500' : 'border-line opacity-70 hover:opacity-100')} aria-label={`Image ${i + 1}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img(src, 160)} alt="" className="size-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-faint">{product.subCategory || product.category}</p>
          <h3 className="display mt-2 text-3xl">{product.name}</h3>
          <p className="price mt-4 text-3xl text-brand-600 dark:text-brand-300">
            {formatPrice(variant?.price ?? 0)} <span className="text-sm text-faint">TND</span>
          </p>
          {product.description && <p className="mt-4 line-clamp-4 text-sm leading-relaxed text-soft">{product.description}</p>}

          {product.variants.length > 0 && (
            <div className="mt-6">
              <p className="label">{t.shop.variants}</p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v, i) => (
                  <button
                    key={v.id}
                    onClick={() => { if (v.stock > 0) { setSelected(i); setImageIndex(-1); setQuantity(1); } }}
                    disabled={v.stock === 0}
                    className={cn('rounded-full border px-4 py-2 text-sm transition', i === selected ? 'border-brand-500 bg-brand-500/10' : 'border-line text-soft hover:border-line-strong', v.stock === 0 && 'cursor-not-allowed line-through opacity-40')}
                  >
                    {v.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          {specs.length > 0 && (
            <dl className="mt-6 grid grid-cols-2 gap-2">
              {specs.map(([key, value]) => (
                <div key={key} className="rounded-2xl bg-raised px-3.5 py-2.5">
                  <dt className="font-mono text-[10px] uppercase tracking-wider text-faint">{key}</dt>
                  <dd className="mt-0.5 truncate text-sm font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          )}

          <div className="mt-auto flex items-center gap-3 pt-8">
            <div className="inline-flex h-12 items-center rounded-full border border-line">
              <button className="flex size-11 items-center justify-center text-soft hover:text-ink" onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="Decrease quantity"><Minus size={15} /></button>
              <span className="w-7 text-center font-mono text-sm">{quantity}</span>
              <button className="flex size-11 items-center justify-center text-soft hover:text-ink" onClick={() => setQuantity((q) => Math.min(variant?.stock ?? 1, q + 1))} aria-label="Increase quantity"><Plus size={15} /></button>
            </div>
            <button onClick={add} disabled={!variant || variant.stock === 0} className="btn btn-primary h-12 flex-1">
              <ShoppingBag size={16} /> {variant && variant.stock > 0 ? t.shop.add_cart : t.shop.out_of_stock}
            </button>
          </div>
          <Link href={productPath(product)} onClick={onClose} className="mt-3 inline-flex items-center justify-center gap-1.5 text-sm text-soft hover:text-ink">
            {t.ui.product.view_full} <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </Modal>
  );
}
