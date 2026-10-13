'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, MapPin, Phone, Star } from 'lucide-react';
import { Equalizer } from '@/components/ui';
import { getOrderReviews } from '@/server/actions/store';
import { fill } from '@/i18n';
import { useLocale, useT } from '@/i18n/client';
import type { Order, Review } from '@/lib/types';
import { cn, formatDate, formatPrice, img, shortId } from '@/lib/utils';
import { OrderStatusBadge, StatusTracker } from './shared';

type ReviewEntry = Pick<Review, 'productName' | 'token' | 'isApproved' | 'comment' | 'rating'>;

function OrderCard({ order }: { order: Order }) {
  const t = useT();
  const locale = useLocale() === 'fr' ? 'fr-FR' : 'en-GB';
  const [open, setOpen] = useState(false);
  const [reviews, setReviews] = useState<ReviewEntry[] | null>(null);
  const [loading, setLoading] = useState(false);
  const reviewable = order.status === 'shipped' || order.status === 'delivered';

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    // Review links are only fetched once, the first time a shipped/delivered order is opened.
    if (next && reviews === null && reviewable) {
      setLoading(true);
      const result = await getOrderReviews(order.id);
      setReviews(result.ok ? result.data : []);
      setLoading(false);
    }
  };

  return (
    <li className="card overflow-hidden">
      <button onClick={toggle} aria-expanded={open} className="flex w-full flex-wrap items-center gap-x-6 gap-y-3 p-6 text-left">
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-sm font-semibold">#{shortId(order.id)}</span>
            <OrderStatusBadge status={order.status} />
          </p>
          <p className="mt-1.5 text-xs text-faint">{fill(t.ui.orders.placed, { date: formatDate(order.createdAt, locale) })}</p>
        </div>
        <div className="flex -space-x-3">
          {order.items.slice(0, 4).map((item) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={item.id} src={img(item.variantImage, 100)} alt="" className="stage size-11 rounded-xl border-2 border-surface object-cover" />
          ))}
        </div>
        <p className="price text-lg">{formatPrice(order.totalAmount)} <span className="text-xs text-faint">TND</span></p>
        <ChevronDown size={18} className={cn('text-faint transition-transform', open && 'rotate-180')} />
      </button>

      <div className="border-t border-line px-6 py-5"><StatusTracker status={order.status} /></div>

      {open && (
        <div className="animate-fade border-t border-line bg-raised/40 p-6">
          <p className="label">{t.orders.items}</p>
          <ul className="grid gap-3">
            {order.items.map((item) => {
              const pendingReview = reviews?.find((r) => r.productName === item.productName && r.token);
              const submitted = reviews?.find((r) => r.productName === item.productName && !r.token && r.rating);
              return (
                <li key={item.id} className="flex flex-wrap items-center gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img(item.variantImage, 120)} alt="" className="stage size-14 rounded-xl border border-line object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.productName}</p>
                    <p className="font-mono text-[11px] text-faint">{item.variantName} × {item.quantity}</p>
                  </div>
                  {loading && <Equalizer bars={3} className="h-3" />}
                  {!loading && pendingReview && (
                    <Link href={`/review/${pendingReview.token}`} className="btn btn-primary btn-sm"><Star size={13} /> {t.orders.leave_review}</Link>
                  )}
                  {!loading && !pendingReview && submitted && <span className="font-mono text-xs text-emerald-500">{t.orders.reviewed}</span>}
                </li>
              );
            })}
          </ul>
          <div className="mt-5 grid gap-2 text-sm text-soft sm:grid-cols-2">
            <p className="flex items-start gap-2"><MapPin size={15} className="mt-0.5 shrink-0 text-faint" /> {order.customer.address}</p>
            <p className="flex items-center gap-2"><Phone size={15} className="shrink-0 text-faint" /> <span className="font-mono text-xs">{order.customer.phone}</span></p>
          </div>
        </div>
      )}
    </li>
  );
}

export function OrdersList({ orders }: { orders: Order[] }) {
  return <ul className="grid gap-4">{orders.map((order) => <OrderCard key={order.id} order={order} />)}</ul>;
}
