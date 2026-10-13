import type { Metadata } from 'next';
import { localRedirect } from '@/i18n/server';
import { AdminPanel } from '@/components/admin/AdminPanel';
import { db } from '@/lib/db';
import type { AdminUser, Role } from '@/lib/types';
import { getActivity, getAllOrders, getAllReviews, getCoupons, getMessages, getProducts, getSettings } from '@/server/data';
import { getSessionUser, isAdmin } from '@/server/session';

export const metadata: Metadata = { title: 'Admin Panel', robots: { index: false, follow: false } };

export default async function AdminPage() {
  const me = await getSessionUser();
  if (!me) return localRedirect('/login?next=/admin');
  if (!isAdmin(me)) return localRedirect('/');

  const [orders, products, reviews, activity, coupons, messages, settings, userRows] = await Promise.all([
    getAllOrders(),
    getProducts(),
    getAllReviews(),
    getActivity(),
    getCoupons(),
    getMessages(),
    getSettings(),
    db.orm.users.all(),
  ]);

  // Order counts go by email, so guest orders placed before sign-up are included.
  const orderCount = new Map<string, number>();
  for (const order of orders) {
    const email = order.customer.email.toLowerCase();
    orderCount.set(email, (orderCount.get(email) ?? 0) + 1);
  }
  const users: AdminUser[] = userRows
    .map((u) => ({
      id: String(u._id),
      name: u.name,
      email: u.email,
      role: (u.role ?? 'user') as Role,
      avatar: u.avatar ?? null,
      phoneNumber: u.phoneNumber ?? null,
      authProvider: u.authProvider ?? 'local',
      createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : null,
      orderCount: orderCount.get(u.email.toLowerCase()) ?? 0,
    }))
    .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));

  return <AdminPanel me={me} orders={orders} products={products} reviews={reviews} activity={activity} coupons={coupons} messages={messages} settings={settings} users={users} />;
}
