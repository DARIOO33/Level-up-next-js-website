'use client';
import { useEffect, useState, useTransition } from 'react';
import Link from '@/components/Link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Bell, ChevronRight, Heart, LayoutDashboard, ListOrdered, LogOut, MapPin, Pencil, Plus, ShieldCheck, Star, Trash2 } from 'lucide-react';
import { PlaceFields, type Place } from '@/components/AddressFields';
import { Field, Spinner } from '@/components/ui';
import { deleteAddress, markNotificationsRead, notePasswordChanged, saveAddress, setDefaultAddress, updateName } from '@/server/actions/account';
import { authClient } from '@/lib/auth-client';
import { useLocale, useLocalePath, useT } from '@/i18n/client';
import type { Address, Notification } from '@/lib/types';
import { cn, formatDate, formatDateTime } from '@/lib/utils';
import { useApp } from '../app-context';

const emptyAddress = { label: 'Home', fullname: '', phone: '+216', street: '' };

export function ProfileView({ addresses: initial, notifications, hasPassword, memberSince }: { addresses: Address[]; notifications: Notification[]; hasPassword: boolean; memberSince: string | null }) {
  const t = useT();
  const locale = useLocale() === 'fr' ? 'fr-FR' : 'en-GB';
  const router = useRouter();
  const to = useLocalePath();
  const { user } = useApp();
  const [pending, start] = useTransition();

  const [name, setName] = useState(user?.name ?? '');
  const [pass, setPass] = useState({ current: '', next: '', confirm: '' });
  const [addresses, setAddresses] = useState(initial);
  const [editing, setEditing] = useState<string | 'new' | null>(null);
  const [addr, setAddr] = useState(emptyAddress);
  const [place, setPlace] = useState<Place>({ governorate: '', city: '', postalCode: '' });
  const unread = notifications.filter((n) => !n.isRead).length;

  // Opening the page counts as reading the notifications.
  useEffect(() => {
    if (unread > 0) markNotificationsRead();
  }, [unread]);

  if (!user) return null;
  const isAdmin = user.role === 'admin' || user.role === 'owner';

  const saveName = () =>
    start(async () => {
      const result = await updateName(name);
      if (!result.ok) return void toast.error(result.message);
      toast.success(t.ui.account.name_updated);
      router.refresh();
    });

  const changePassword = () =>
    start(async () => {
      if (!pass.current) return void toast.error(t.profile.err_current_required);
      if (!pass.next) return void toast.error(t.profile.err_new_required);
      if (pass.next.length < 6) return void toast.error(t.profile.err_min_length);
      if (pass.next !== pass.confirm) return void toast.error(t.profile.err_mismatch);
      if (pass.next === pass.current) return void toast.error(t.profile.err_same);
      const { error } = await authClient.changePassword({ currentPassword: pass.current, newPassword: pass.next, revokeOtherSessions: true });
      if (error) return void toast.error(error.code === 'INVALID_PASSWORD' ? 'Current password is incorrect' : error.message ?? t.common.error);
      await notePasswordChanged();
      toast.success(t.profile.success_updated);
      await authClient.signOut();
      router.push(to('/login'));
      router.refresh();
    });

  const logout = async () => {
    await authClient.signOut();
    router.push(to('/'));
    router.refresh();
  };

  const openForm = (address?: Address) => {
    if (address) {
      setEditing(address.id);
      setAddr({ label: address.label, fullname: address.fullname, phone: address.phone || '+216', street: address.address });
      setPlace({ governorate: address.governorate, city: address.city, postalCode: address.postalCode });
    } else {
      setEditing('new');
      setAddr({ ...emptyAddress, fullname: user.name, phone: user.phoneNumber || '+216' });
      setPlace({ governorate: '', city: '', postalCode: '' });
    }
  };

  const submitAddress = () =>
    start(async () => {
      if (!addr.fullname.trim() || !place.governorate || !place.city || addr.phone.replace(/\s/g, '').length < 8) return void toast.error(t.checkout.required);
      const result = await saveAddress(
        { label: addr.label, fullname: addr.fullname, phone: addr.phone.replace(/\s/g, ''), address: addr.street, ...place },
        editing === 'new' ? undefined : editing ?? undefined,
      );
      if (!result.ok) return void toast.error(result.message);
      setAddresses(result.data);
      setEditing(null);
      toast.success(t.ui.account.address_saved);
    });

  const mutateAddress = (action: (id: string) => ReturnType<typeof deleteAddress>, id: string, message: string) =>
    start(async () => {
      const result = await action(id);
      if (!result.ok) return void toast.error(result.message);
      setAddresses(result.data);
      toast.success(message);
    });

  return (
    <div className="shell max-w-5xl pb-10 pt-10 lg:pt-14">
      <header className="flex flex-wrap items-center gap-5">
        {user.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.avatar} alt="" referrerPolicy="no-referrer" className="size-20 rounded-full object-cover" />
        ) : (
          <span className="flex size-20 items-center justify-center rounded-full bg-brand-500 text-3xl font-bold text-white">{user.name[0]?.toUpperCase()}</span>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="display truncate text-4xl sm:text-5xl">{user.name}</h1>
          <p className="mt-1 truncate text-sm text-soft">{user.email}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {user.role !== 'user' && <span className="tag"><ShieldCheck size={10} /> {user.role}</span>}
            {!hasPassword && <span className="tag">{t.profile.google_badge}</span>}
            {memberSince && <span className="font-mono text-[11px] text-faint">{formatDate(memberSince, locale)}</span>}
          </div>
        </div>
        <button onClick={logout} className="btn btn-outline"><LogOut size={15} /> {t.ui.account.sign_out}</button>
      </header>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { href: '/orders', Icon: ListOrdered, title: t.profile.my_orders, sub: t.profile.my_orders_sub },
          { href: '/wishlist', Icon: Heart, title: t.profile.my_wishlist, sub: t.profile.my_wishlist_sub },
          ...(isAdmin ? [{ href: '/admin', Icon: LayoutDashboard, title: t.nav.admin, sub: t.ui.account.admin }] : []),
        ].map(({ href, Icon, title, sub }) => (
          <Link key={href} href={href} className="card card-hover flex items-center gap-4 p-5">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-brand-500/12 text-brand-500"><Icon size={19} /></span>
            <span className="min-w-0 flex-1"><span className="block font-semibold">{title}</span><span className="block truncate text-xs text-soft">{sub}</span></span>
            <ChevronRight size={17} className="text-faint" />
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Name */}
        <section className="card p-6 sm:p-7">
          <h2 className="label">{t.profile.display_name}</h2>
          <form className="mt-2 grid gap-4" onSubmit={(e) => { e.preventDefault(); saveName(); }}>
            <Field label={t.profile.full_name}><input className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" /></Field>
            <button type="submit" disabled={pending || !name.trim() || name.trim() === user.name} className="btn btn-primary justify-self-start">{t.profile.save_name}</button>
          </form>
        </section>

        {/* Password */}
        <section className="card p-6 sm:p-7">
          <h2 className="label">{t.profile.password_section}</h2>
          {hasPassword ? (
            <form className="mt-2 grid gap-4" onSubmit={(e) => { e.preventDefault(); changePassword(); }}>
              <Field label={t.profile.current_password}><input className="input" type="password" value={pass.current} onChange={(e) => setPass((p) => ({ ...p, current: e.target.value }))} autoComplete="current-password" /></Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t.profile.new_password}><input className="input" type="password" value={pass.next} onChange={(e) => setPass((p) => ({ ...p, next: e.target.value }))} autoComplete="new-password" /></Field>
                <Field label={t.profile.confirm_password}><input className="input" type="password" value={pass.confirm} onChange={(e) => setPass((p) => ({ ...p, confirm: e.target.value }))} autoComplete="new-password" /></Field>
              </div>
              <p className="text-xs text-faint">{t.profile.after_change}</p>
              <button type="submit" disabled={pending} className="btn btn-outline justify-self-start">{t.profile.update_password}</button>
            </form>
          ) : (
            <p className="mt-2 rounded-2xl bg-raised p-4 text-sm text-soft">{t.profile.google_password}</p>
          )}
        </section>
      </div>

      {/* Addresses */}
      <section id="addresses" className="card mt-6 scroll-mt-24 p-6 sm:p-7">
        <div className="flex items-center justify-between gap-4">
          <h2 className="flex items-center gap-2 font-semibold"><MapPin size={17} className="text-brand-500" /> {t.ui.account.addresses}</h2>
          {editing === null && <button onClick={() => openForm()} className="btn btn-outline btn-sm"><Plus size={14} /> {t.ui.account.add_address}</button>}
        </div>

        {editing !== null ? (
          <form className="mt-6 grid gap-4" onSubmit={(e) => { e.preventDefault(); submitAddress(); }}>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label={t.ui.account.label}><input className="input" value={addr.label} onChange={(e) => setAddr((a) => ({ ...a, label: e.target.value }))} placeholder={t.ui.account.label_placeholder} /></Field>
              <Field label={t.checkout.fullname}><input className="input" value={addr.fullname} onChange={(e) => setAddr((a) => ({ ...a, fullname: e.target.value }))} /></Field>
              <Field label={t.checkout.phone}><input className="input font-mono" type="tel" value={addr.phone} onChange={(e) => setAddr((a) => ({ ...a, phone: e.target.value }))} /></Field>
            </div>
            <PlaceFields value={place} onChange={setPlace} />
            <Field label={t.ui.checkout.street}><input className="input" value={addr.street} onChange={(e) => setAddr((a) => ({ ...a, street: e.target.value }))} /></Field>
            <div className="flex gap-2">
              <button type="submit" disabled={pending} className="btn btn-primary">{pending ? <><Spinner /> {t.ui.account.saving}</> : t.ui.account.save}</button>
              <button type="button" onClick={() => setEditing(null)} className="btn btn-ghost">{t.ui.account.cancel}</button>
            </div>
          </form>
        ) : addresses.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-line p-8 text-center">
            <p className="text-sm text-soft">{t.ui.account.no_addresses}</p>
            <button onClick={() => openForm()} className="btn btn-primary btn-sm mt-4"><Plus size={14} /> {t.ui.account.add_first}</button>
          </div>
        ) : (
          <ul className="mt-6 grid gap-3 md:grid-cols-2">
            {addresses.map((a) => (
              <li key={a.id} className={cn('rounded-2xl border p-5', a.isDefault ? 'border-brand-500/60 bg-brand-500/[0.06]' : 'border-line')}>
                <div className="flex items-center justify-between gap-3">
                  <p className="flex items-center gap-2 font-semibold">{a.label}{a.isDefault && <span className="tag"><Star size={9} /> {t.ui.account.default}</span>}</p>
                  <div className="flex">
                    <button onClick={() => openForm(a)} className="icon-btn size-9" aria-label={`${t.ui.account.edit} ${a.label}`}><Pencil size={14} /></button>
                    <button onClick={() => mutateAddress(deleteAddress, a.id, t.ui.account.address_removed)} disabled={pending} className="icon-btn size-9 hover:text-red-500" aria-label={`${t.ui.account.delete} ${a.label}`}><Trash2 size={14} /></button>
                  </div>
                </div>
                <p className="mt-2 text-sm text-soft">{a.fullname} · <span className="font-mono text-xs">{a.phone}</span></p>
                <p className="mt-1 text-sm text-soft">{[a.address, `${a.city} ${a.postalCode}`.trim(), a.governorate].filter(Boolean).join(', ')}</p>
                {!a.isDefault && <button onClick={() => mutateAddress(setDefaultAddress, a.id, t.ui.account.default_updated)} disabled={pending} className="mt-3 text-xs font-semibold text-brand-600 hover:underline dark:text-brand-300">{t.ui.account.set_default}</button>}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Notifications */}
      <section className="card mt-6 p-6 sm:p-7">
        <h2 className="flex items-center gap-2 font-semibold"><Bell size={17} className="text-brand-500" /> {t.ui.account.notifications}{unread > 0 && <span className="rounded-full bg-brand-500 px-2 py-0.5 font-mono text-[10px] text-white">{unread}</span>}</h2>
        {notifications.length === 0 ? (
          <p className="mt-4 text-sm text-soft">{t.ui.account.no_notifications}</p>
        ) : (
          <ul className="mt-4 divide-y divide-line">
            {notifications.map((n) => (
              <li key={n.id} className="flex items-start gap-3 py-3.5">
                <span className={cn('mt-1.5 size-2 shrink-0 rounded-full', n.isRead ? 'bg-line-strong' : 'bg-brand-500')} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="text-sm text-soft">{n.message}</p>
                </div>
                <time className="shrink-0 font-mono text-[11px] text-faint">{formatDateTime(n.createdAt, locale)}</time>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
