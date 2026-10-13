import type { Metadata } from 'next';
import { CheckoutView } from '@/components/checkout/CheckoutView';
import { getAddresses } from '@/server/data';
import { getSessionUser } from '@/server/session';

export const metadata: Metadata = { title: 'Checkout', robots: { index: false } };

export default async function CheckoutPage() {
  const user = await getSessionUser();
  const addresses = user ? await getAddresses(user.id) : [];
  return <CheckoutView addresses={addresses} />;
}
