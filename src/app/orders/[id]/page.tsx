import type { Metadata } from 'next';
import Link from '@/components/Link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { OrderStatusBadge, StatusTracker } from '@/components/orders/shared';
import { fill } from '@/i18n';
import { getLocale, getT } from '@/i18n/server';
import { formatDate, formatDateTime, formatPrice, img, shortId } from '@/lib/utils';
import { getOrder } from '@/server/data';

export const metadata: Metadata = { title: 'Order tracking', robots: { index: false } };

/**
 * Public tracking page (linked from the confirmation email). Anyone holding the
 * order id can see it, so it only shows what the old `/track` endpoint exposed:
 * status, first name, items and total — never the email, phone or address.
 */
export default async function OrderTrackingPage({ params }: PageProps<'/orders/[id]'>) {
  const { id } = await params;
  const [order, t, lang] = await Promise.all([getOrder(id.toLowerCase()), getT(), getLocale()]);
  if (!order) notFound();
  const locale = lang === 'fr' ? 'fr-FR' : 'en-GB';

  return (
    <div className="shell max-w-3xl pb-10 pt-10 lg:pt-14">
      <Link href="/orders/track" className="inline-flex items-center gap-1.5 text-sm text-soft hover:text-ink"><ArrowLeft size={14} /> {t.ui.orders.track_title}</Link>
      <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">{t.ui.orders.track_tag}</p>
          <h1 className="display mt-3 text-5xl uppercase">#{shortId(order.id)}</h1>
          <p className="mt-2 text-sm text-soft">{fill(t.ui.orders.hello, { name: order.customer.fullname.split(' ')[0] })} · {fill(t.ui.orders.placed, { date: formatDate(order.createdAt, locale) })}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <section className="card mt-8 p-6 sm:p-8">
        <StatusTracker status={order.status} />
        <p className="mt-6 font-mono text-[11px] text-faint">{fill(t.ui.orders.updated, { date: formatDateTime(order.updatedAt, locale) })}</p>
      </section>

      <section className="card mt-6 p-6 sm:p-8">
        <h2 className="label">{t.orders.items}</h2>
        <ul className="divide-y divide-line">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center gap-4 py-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img(item.variantImage, 140)} alt="" className="stage size-16 rounded-2xl border border-line object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{item.productName}</p>
                <p className="font-mono text-[11px] text-faint">{item.variantName} × {item.quantity}</p>
              </div>
            </li>
          ))}
        </ul>
        <div className="hairline my-4" />
        <div className="flex items-baseline justify-between">
          <span className="font-semibold">{t.cart.total}</span>
          <span className="price text-2xl">{formatPrice(order.totalAmount)} <span className="text-sm text-faint">TND</span></span>
        </div>
      </section>
    </div>
  );
}
