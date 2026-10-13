import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { ProfileView } from '@/components/account/ProfileView';
import { userHasPassword } from '@/lib/legacy-auth';
import { getUserRow, toAddress, toNotification } from '@/server/data';
import { getSessionUser } from '@/server/session';

export const metadata: Metadata = { title: 'My Profile', robots: { index: false } };

export default async function ProfilePage() {
  const user = await getSessionUser();
  if (!user) redirect('/login?next=/profile');
  const [row, hasPassword] = await Promise.all([getUserRow(user.id), userHasPassword(user.id)]);
  const notifications = (row?.notifications ?? []).map(toNotification).reverse().slice(0, 20);
  return (
    <ProfileView
      addresses={(row?.shippingAddresses ?? []).map(toAddress)}
      notifications={notifications}
      hasPassword={hasPassword}
      memberSince={row?.createdAt ? new Date(row.createdAt).toISOString() : null}
    />
  );
}
