import type { Metadata } from 'next';
import Link from '@/components/Link';
import { Package } from 'lucide-react';
import { OrdersList } from '@/components/orders/OrdersList';
import { EmptyState } from '@/components/ui';
import { plural } from '@/i18n';
import { getT, localRedirect } from '@/i18n/server';
import { getOrdersForUser } from '@/server/data';
import { getSessionUser } from '@/server/session';

export const metadata: Metadata = { title: 'My Orders', robots: { index: false } };

export default async function OrdersPage() {
  const user = await getSessionUser();
  if (!user) return localRedirect('/login?next=/orders');
  const [t, orders] = await Promise.all([getT(), getOrdersForUser(user.id)]);

  return (
    <div className="shell max-w-4xl pb-10 pt-10 lg:pt-14">
      <h1 className="display text-5xl uppercase sm:text-7xl">{t.orders.title}</h1>
      <p className="mt-3 text-soft">{plural(t.orders.count_one, t.orders.count_other, orders.length)}</p>
      <div className="mt-10">
        {orders.length === 0 ? (
          <EmptyState icon={<Package size={26} />} title={t.orders.empty} sub={t.orders.empty_sub}>
            <Link href="/shop" className="btn btn-primary">{t.orders.browse}</Link>
          </EmptyState>
        ) : (
          <OrdersList orders={orders} />
        )}
      </div>
    </div>
  );
}
