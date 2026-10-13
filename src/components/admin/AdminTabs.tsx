'use client';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowDown, ArrowUp, Check, CheckCheck, Crown, Hourglass, Mail, Plus, Send, Shield, Trash2, User as UserIcon, X } from 'lucide-react';
import { Field, Spinner, Stars } from '@/components/ui';
import {
  createCoupon, createReview, deleteCoupon, deleteMessage, deleteReview, getAudience, markMessageRead,
  sendCampaign, setCouponActive, setReviewApproved, updateSettings, updateUserRole,
} from '@/server/actions/admin';
import type { Activity, ActionResult, AdminUser, Audience, ContactMessage, Coupon, Review, Role, SessionUser, Settings } from '@/lib/types';
import { cn, formatDate, formatDateTime } from '@/lib/utils';
import { Confirm, IconAction, Select, Table, Td, Toolbar } from './shared';

/** Runs an admin action, toasts the outcome and refreshes the server data. */
function useAdminAction() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const act = <T,>(action: () => Promise<ActionResult<T>>, success?: string | ((data: T) => string), after?: (data: T) => void) =>
    start(async () => {
      const result = await action();
      if (!result.ok) return void toast.error(result.message);
      const message = typeof success === 'function' ? success(result.data) : success ?? result.message;
      if (message) toast.success(message);
      after?.(result.data);
      router.refresh();
    });
  return { pending, act };
}

// ── Users ───────────────────────────────────────────────────────────────────

const ROLE_ICON = { user: UserIcon, admin: Shield, owner: Crown };
const ROLE_TONE = { user: 'text-soft bg-raised', admin: 'text-blue-500 bg-blue-500/12', owner: 'text-amber-500 bg-amber-500/12' };

export function UsersTab({ users, me }: { users: AdminUser[]; me: SessionUser }) {
  const { pending, act } = useAdminAction();
  const [search, setSearch] = useState('');
  const filtered = users.filter((u) => `${u.name} ${u.email}`.toLowerCase().includes(search.trim().toLowerCase()));

  return (
    <>
      <Toolbar search={search} onSearch={setSearch} placeholder="Search by name or email…" />
      <Table head={['User', 'Joined', 'Orders', 'Sign-in', 'Role', 'Change role']} empty={filtered.length === 0}>
        {filtered.map((u) => {
          const Icon = ROLE_ICON[u.role] ?? UserIcon;
          const locked = u.id === me.id || (u.role === 'owner' && me.role !== 'owner');
          return (
            <tr key={u.id} className="transition hover:bg-raised/50">
              <Td>
                <p className="max-w-56 truncate font-medium">{u.name}{u.id === me.id && <span className="ml-2 text-xs text-faint">(you)</span>}</p>
                <p className="max-w-56 truncate text-xs text-faint">{u.email}</p>
              </Td>
              <Td className="whitespace-nowrap font-mono text-xs text-faint">{formatDate(u.createdAt)}</Td>
              <Td className="font-mono text-xs">{u.orderCount}</Td>
              <Td className="text-xs text-soft">{u.authProvider}</Td>
              <Td><span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider', ROLE_TONE[u.role])}><Icon size={11} /> {u.role}</span></Td>
              <Td>
                <select
                  value={u.role}
                  disabled={locked || pending}
                  aria-label={`Role for ${u.name}`}
                  onChange={(e) => act(() => updateUserRole(u.id, e.target.value as Role), 'Role updated')}
                  className="input h-9 w-28 rounded-xl px-3 text-xs"
                >
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                  {/* Only an owner can hand out the owner role. */}
                  {(me.role === 'owner' || u.role === 'owner') && <option value="owner">owner</option>}
                </select>
              </Td>
            </tr>
          );
        })}
      </Table>
      <p className="mt-3 text-xs text-faint">
        {users.length} users
        {me.role === 'owner' ? ' · As owner you can assign any role, including owner.' : ' · As admin you can promote users to admin only.'}
      </p>
    </>
  );
}

// ── Reviews ─────────────────────────────────────────────────────────────────

const emptyManual = { name: '', rating: 5, comment: '', source: 'manual', productName: '', showName: true };

export function ReviewsTab({ reviews }: { reviews: Review[] }) {
  const { pending, act } = useAdminAction();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'approved' | 'pending' | 'waiting'>('all');
  const [rating, setRating] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [manual, setManual] = useState(emptyManual);
  const [toDelete, setToDelete] = useState<Review | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return reviews.filter((r) => {
      if (status === 'approved' && !r.isApproved) return false;
      if (status === 'pending' && (r.isApproved || r.token)) return false;
      if (status === 'waiting' && !r.token) return false;
      if (rating !== 'all' && String(r.rating) !== rating) return false;
      if (!q) return true;
      return `${r.name ?? ''} ${r.comment ?? ''} ${r.productName ?? ''}`.toLowerCase().includes(q);
    });
  }, [reviews, search, status, rating]);

  return (
    <>
      <Toolbar search={search} onSearch={setSearch} placeholder="Search by name, product or comment…">
        <Select label="Status" value={status} onChange={setStatus} options={[{ value: 'all', label: 'All' }, { value: 'approved', label: 'Approved' }, { value: 'pending', label: 'Awaiting approval' }, { value: 'waiting', label: 'Waiting for customer' }]} />
        <Select label="Rating" value={rating} onChange={setRating} options={[{ value: 'all', label: 'All ratings' }, ...['5', '4', '3', '2', '1'].map((n) => ({ value: n, label: `${n} ★` }))]} />
        <button onClick={() => setFormOpen((o) => !o)} className="btn btn-primary shrink-0"><Plus size={16} /> Add review</button>
      </Toolbar>

      {formOpen && (
        <form
          className="card mb-4 grid gap-4 p-6"
          onSubmit={(e) => {
            e.preventDefault();
            act(() => createReview(manual), 'Review added', () => { setManual(emptyManual); setFormOpen(false); });
          }}
        >
          <p className="text-sm text-soft">Import a review from Instagram, a DM, or in person. It is published immediately.</p>
          <div className="grid gap-4 sm:grid-cols-4">
            <Field label="Customer name"><input className="input h-11" value={manual.name} onChange={(e) => setManual((m) => ({ ...m, name: e.target.value }))} placeholder="Anonymous" /></Field>
            <Field label="Product (optional)"><input className="input h-11" value={manual.productName} onChange={(e) => setManual((m) => ({ ...m, productName: e.target.value }))} /></Field>
            <Field label="Source">
              <select className="input h-11" value={manual.source} onChange={(e) => setManual((m) => ({ ...m, source: e.target.value }))}>
                {['manual', 'instagram', 'tiktok', 'facebook', 'website'].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Rating">
              <select className="input h-11" value={manual.rating} onChange={(e) => setManual((m) => ({ ...m, rating: Number(e.target.value) }))}>
                {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} ★</option>)}
              </select>
            </Field>
          </div>
          <Field label="Review text"><textarea className="input" rows={3} maxLength={500} value={manual.comment} onChange={(e) => setManual((m) => ({ ...m, comment: e.target.value }))} placeholder="Customer's review text…" /></Field>
          <div className="flex items-center justify-between gap-4">
            <label className="flex items-center gap-2 text-sm text-soft"><input type="checkbox" checked={manual.showName} onChange={(e) => setManual((m) => ({ ...m, showName: e.target.checked }))} className="size-4 accent-brand-500" /> Show the name publicly</label>
            <button type="submit" disabled={pending || !manual.comment.trim()} className="btn btn-primary">Publish review</button>
          </div>
        </form>
      )}

      <Table head={['Reviewer', 'Rating', 'Comment', 'Product', 'Date', 'Status', '']} empty={filtered.length === 0}>
        {filtered.map((r) => (
          <tr key={r.id} className="transition hover:bg-raised/50">
            <Td>
              <p className="max-w-36 truncate font-medium">{r.name || 'Anonymous'}</p>
              <p className="text-xs text-faint">{r.source}{!r.showName && ' · name hidden'}</p>
            </Td>
            <Td>{r.rating ? <Stars value={r.rating} size={12} /> : <span className="text-faint">—</span>}</Td>
            <Td className="max-w-72 text-xs text-soft"><span className="line-clamp-2">{r.comment || '—'}</span></Td>
            <Td className="max-w-40 truncate text-xs">{r.productName || '—'}</Td>
            <Td className="whitespace-nowrap font-mono text-xs text-faint">{formatDate(r.createdAt)}</Td>
            <Td>
              {r.token ? (
                <span className="inline-flex items-center gap-1.5 text-xs text-faint"><Hourglass size={12} /> waiting for customer</span>
              ) : r.isApproved ? (
                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-500"><Check size={13} /> approved</span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs text-amber-500"><Hourglass size={12} /> awaiting approval</span>
              )}
            </Td>
            <Td>
              <div className="flex justify-end gap-1">
                {!r.token && (
                  <button onClick={() => act(() => setReviewApproved(r.id, !r.isApproved), r.isApproved ? 'Review hidden' : 'Review approved')} disabled={pending} className={cn('btn btn-sm', r.isApproved ? 'btn-ghost' : 'btn-primary')}>
                    {r.isApproved ? 'Unapprove' : 'Approve'}
                  </button>
                )}
                <IconAction label="Delete review" danger onClick={() => setToDelete(r)}><Trash2 size={15} /></IconAction>
              </div>
            </Td>
          </tr>
        ))}
      </Table>
      <Confirm open={Boolean(toDelete)} danger title="Delete review" body="This review will be permanently removed." confirmLabel="Delete" busy={pending} onConfirm={() => toDelete && act(() => deleteReview(toDelete.id), 'Review deleted', () => setToDelete(null))} onClose={() => setToDelete(null)} />
    </>
  );
}

// ── Activity ────────────────────────────────────────────────────────────────

export function ActivityTab({ activity }: { activity: Activity[] }) {
  const [search, setSearch] = useState('');
  const [label, setLabel] = useState<'all' | 'Admin Action' | 'User Action'>('all');
  const filtered = activity.filter((a) => {
    if (label !== 'all' && a.label !== label) return false;
    const q = search.trim().toLowerCase();
    return !q || `${a.content} ${a.user}`.toLowerCase().includes(q);
  });
  return (
    <>
      <Toolbar search={search} onSearch={setSearch} placeholder="Search activity…">
        <Select label="Type" value={label} onChange={setLabel} options={[{ value: 'all', label: 'All actions' }, { value: 'Admin Action', label: 'Admin actions' }, { value: 'User Action', label: 'User actions' }]} />
      </Toolbar>
      <ul className="card divide-y divide-line">
        {filtered.length === 0 && <li className="px-4 py-12 text-center text-sm text-faint">Nothing to show.</li>}
        {filtered.map((a) => (
          <li key={a.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3.5">
            <span className={cn('size-2 shrink-0 rounded-full', a.label === 'Admin Action' ? 'bg-brand-500' : 'bg-signal')} title={a.label} />
            <p className="min-w-0 flex-1 text-sm">{a.content}</p>
            <span className="text-xs text-soft">{a.user}</span>
            <time className="font-mono text-[11px] text-faint">{formatDateTime(a.createdAt)}</time>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-faint">Showing the latest 100 entries.</p>
    </>
  );
}

// ── Marketing ───────────────────────────────────────────────────────────────

const emptyCampaign = { subject: '', headline: '', body: '', ctaLabel: 'SHOP NOW', ctaUrl: '', productImageUrl: '', targetGroup: 'all' };

export function MarketingTab() {
  const { pending, act } = useAdminAction();
  const [audience, setAudience] = useState<Audience | null>(null);
  const [campaign, setCampaign] = useState(emptyCampaign);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const set = (key: keyof typeof campaign) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setCampaign((c) => ({ ...c, [key]: e.target.value }));

  useEffect(() => {
    getAudience().then((r) => r.ok && setAudience(r.data));
  }, []);

  const groups = [
    { value: 'all', label: 'Everyone', count: audience?.totalCount },
    { value: 'registered', label: 'All registered', count: audience?.registeredCount },
    { value: 'guests', label: 'Guests only', count: audience?.guestCount },
    { value: 'subscribers', label: 'Subscribers only', count: audience?.subscriberCount },
    { value: 'no_orders', label: 'No orders yet', count: audience?.noOrdersCount },
    { value: 'single_order', label: 'Single order', count: audience?.singleOrderCount },
    { value: 'returning', label: '2–4 orders', count: audience?.returningCount },
    { value: 'loyal', label: '5+ orders', count: audience?.loyalCount },
  ];
  const target = groups.find((g) => g.value === campaign.targetGroup);
  const ready = campaign.subject.trim() && campaign.headline.trim() && campaign.body.trim();

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <form className="card grid gap-5 p-6" onSubmit={(e) => { e.preventDefault(); if (ready) setConfirmOpen(true); }}>
        <h2 className="display flex items-center gap-2 text-2xl"><Mail size={20} className="text-brand-500" /> New campaign</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email subject"><input className="input h-11" value={campaign.subject} onChange={set('subject')} placeholder="New drop: KZ ZSN Pro X is here!" /></Field>
          <Field label="Headline"><input className="input h-11" value={campaign.headline} onChange={set('headline')} placeholder="New Drop Available Now" /></Field>
          <Field label="Button label"><input className="input h-11" value={campaign.ctaLabel} onChange={set('ctaLabel')} placeholder="SHOP NOW" /></Field>
          <Field label="Button link"><input className="input h-11" value={campaign.ctaUrl} onChange={set('ctaUrl')} placeholder="/shop or https://…" /></Field>
          <Field label="Product image URL (optional)" className="sm:col-span-2"><input className="input h-11" value={campaign.productImageUrl} onChange={set('productImageUrl')} placeholder="https://…/product.jpg" /></Field>
        </div>
        <Field label="Message"><textarea className="input" rows={6} value={campaign.body} onChange={set('body')} placeholder="Write your message here. You can use line breaks for paragraphs." /></Field>
        <fieldset>
          <legend className="label">Audience</legend>
          <div className="flex flex-wrap gap-2">
            {groups.map((g) => (
              <button type="button" key={g.value} onClick={() => setCampaign((c) => ({ ...c, targetGroup: g.value }))} aria-pressed={campaign.targetGroup === g.value} className={cn('chip h-9', campaign.targetGroup === g.value && 'chip-active')}>
                {g.label}{g.count !== undefined && <span className="font-mono opacity-70">{g.count}</span>}
              </button>
            ))}
          </div>
        </fieldset>
        <button type="submit" disabled={pending || !ready} className="btn btn-primary btn-lg justify-self-start">{pending ? <Spinner /> : <Send size={16} />} Send to {target?.count ?? '…'} recipient{target?.count === 1 ? '' : 's'}</button>
      </form>

      <aside className="grid h-fit gap-3">
        <h2 className="display text-2xl">Audience</h2>
        {!audience ? (
          <div className="skeleton h-64" />
        ) : (
          <dl className="card divide-y divide-line">
            {[
              ['Total reach', audience.totalCount],
              ['Registered users', audience.registeredCount],
              ['Guest customers', audience.guestCount],
              ['Newsletter subscribers', audience.subscriberCount],
              ['No orders yet', audience.noOrdersCount],
              ['Single order', audience.singleOrderCount],
              ['2–4 orders', audience.returningCount],
              ['5+ orders', audience.loyalCount],
            ].map(([label, value], i) => (
              <div key={label} className={cn('flex items-center justify-between px-5 py-3 text-sm', i === 0 && 'font-semibold')}>
                <dt className={i === 0 ? '' : 'text-soft'}>{label}</dt>
                <dd className="font-mono">{value}</dd>
              </div>
            ))}
          </dl>
        )}
        <p className="text-xs text-faint">Emails are sent one by one in the background through your Gmail account.</p>
      </aside>

      <Confirm
        open={confirmOpen}
        title="Send campaign"
        body={`"${campaign.subject}" will be emailed to ${target?.count ?? 0} recipient(s) (${target?.label}). This cannot be undone.`}
        confirmLabel="Send now"
        busy={pending}
        onConfirm={() => { setConfirmOpen(false); act(() => sendCampaign(campaign), undefined, () => setCampaign(emptyCampaign)); }}
        onClose={() => setConfirmOpen(false)}
      />
    </div>
  );
}

// ── Coupons ─────────────────────────────────────────────────────────────────

const emptyCoupon = { code: '', type: 'percent' as 'percent' | 'fixed', value: '', minOrderAmount: '', maxUses: '', expiresAt: '' };

export function CouponsTab({ coupons }: { coupons: Coupon[] }) {
  const { pending, act } = useAdminAction();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyCoupon);
  const [toDelete, setToDelete] = useState<Coupon | null>(null);
  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const save = () =>
    act(
      () => createCoupon({ code: form.code, type: form.type, value: Number(form.value), minOrderAmount: Number(form.minOrderAmount || 0), maxUses: form.maxUses ? Number(form.maxUses) : null, expiresAt: form.expiresAt || null }),
      'Coupon created',
      () => { setForm(emptyCoupon); setOpen(false); },
    );

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-soft">{coupons.length} coupon{coupons.length === 1 ? '' : 's'}</p>
        <button onClick={() => setOpen((o) => !o)} className="btn btn-primary"><Plus size={16} /> New coupon</button>
      </div>

      {open && (
        <form className="card mb-4 grid gap-4 p-6 sm:grid-cols-3 lg:grid-cols-6" onSubmit={(e) => { e.preventDefault(); save(); }}>
          <Field label="Code"><input className="input h-11 font-mono uppercase" value={form.code} onChange={set('code')} placeholder="SUMMER10" required /></Field>
          <Field label="Type">
            <select className="input h-11" value={form.type} onChange={set('type')}>
              <option value="percent">% Percent</option>
              <option value="fixed">TND Fixed</option>
            </select>
          </Field>
          <Field label={form.type === 'percent' ? 'Value (%)' : 'Value (TND)'}><input className="input h-11 font-mono" type="number" min="0" step="any" value={form.value} onChange={set('value')} placeholder={form.type === 'percent' ? '10' : '5'} required /></Field>
          <Field label="Min. order (TND)"><input className="input h-11 font-mono" type="number" min="0" value={form.minOrderAmount} onChange={set('minOrderAmount')} placeholder="0" /></Field>
          <Field label="Max uses"><input className="input h-11 font-mono" type="number" min="1" value={form.maxUses} onChange={set('maxUses')} placeholder="Unlimited" /></Field>
          <Field label="Expires"><input className="input h-11" type="date" value={form.expiresAt} onChange={set('expiresAt')} /></Field>
          <div className="flex gap-2 sm:col-span-3 lg:col-span-6">
            <button type="submit" disabled={pending} className="btn btn-primary">Create coupon</button>
            <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost">Cancel</button>
          </div>
        </form>
      )}

      <Table head={['Code', 'Discount', 'Min. order', 'Used', 'Expires', 'Active', '']} empty={coupons.length === 0}>
        {coupons.map((c) => {
          const expired = Boolean(c.expiresAt && new Date(c.expiresAt) < new Date());
          return (
            <tr key={c.id} className="transition hover:bg-raised/50">
              <Td className="font-mono font-semibold">{c.code}</Td>
              <Td className="price">{c.type === 'percent' ? `${c.value}%` : `${c.value} TND`}</Td>
              <Td className="font-mono text-xs text-soft">{c.minOrderAmount ? `${c.minOrderAmount} TND` : '—'}</Td>
              <Td className="font-mono text-xs">{c.usedCount}{c.maxUses !== null ? ` / ${c.maxUses}` : ''}</Td>
              <Td className={cn('whitespace-nowrap font-mono text-xs', expired ? 'text-red-500' : 'text-faint')}>{c.expiresAt ? `${formatDate(c.expiresAt)}${expired ? ' (expired)' : ''}` : 'never'}</Td>
              <Td>
                <button role="switch" aria-checked={c.isActive} aria-label={`${c.code} active`} disabled={pending} onClick={() => act(() => setCouponActive(c.id, !c.isActive), c.isActive ? 'Coupon disabled' : 'Coupon enabled')} className={cn('relative h-6 w-11 rounded-full transition', c.isActive ? 'bg-brand-500' : 'bg-line-strong')}>
                  <span className={cn('absolute top-0.5 size-5 rounded-full bg-white transition-all', c.isActive ? 'left-[22px]' : 'left-0.5')} />
                </button>
              </Td>
              <Td><div className="flex justify-end"><IconAction label={`Delete ${c.code}`} danger onClick={() => setToDelete(c)}><Trash2 size={15} /></IconAction></div></Td>
            </tr>
          );
        })}
      </Table>
      <Confirm open={Boolean(toDelete)} danger title="Delete coupon" body={`Coupon ${toDelete?.code} will stop working immediately.`} confirmLabel="Delete" busy={pending} onConfirm={() => toDelete && act(() => deleteCoupon(toDelete.id), 'Coupon deleted', () => setToDelete(null))} onClose={() => setToDelete(null)} />
    </>
  );
}

// ── Messages ────────────────────────────────────────────────────────────────

export function MessagesTab({ messages }: { messages: ContactMessage[] }) {
  const { pending, act } = useAdminAction();
  const [toDelete, setToDelete] = useState<ContactMessage | null>(null);
  if (messages.length === 0) return <p className="card px-4 py-16 text-center text-sm text-faint">No messages yet.</p>;
  return (
    <>
      <ul className="grid gap-3">
        {messages.map((m) => (
          <li key={m.id} className={cn('card p-6', !m.isRead && 'border-brand-500/50')}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="flex items-center gap-2 font-semibold">{!m.isRead && <span className="size-2 rounded-full bg-brand-500" aria-label="Unread" />}{m.name}</p>
                <a href={`mailto:${m.email}`} className="text-sm text-brand-600 hover:underline dark:text-brand-300">{m.email}</a>
              </div>
              <div className="flex items-center gap-1">
                <time className="mr-2 font-mono text-[11px] text-faint">{formatDateTime(m.createdAt)}</time>
                {!m.isRead && <IconAction label="Mark as read" disabled={pending} onClick={() => act(() => markMessageRead(m.id), 'Marked as read')}><CheckCheck size={16} /></IconAction>}
                <IconAction label="Delete message" danger onClick={() => setToDelete(m)}><Trash2 size={15} /></IconAction>
              </div>
            </div>
            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-soft">{m.message}</p>
            <a href={`mailto:${m.email}?subject=${encodeURIComponent('Re: your message to Level Up TN')}`} className="btn btn-outline btn-sm mt-4"><Mail size={14} /> Reply by email</a>
          </li>
        ))}
      </ul>
      <Confirm open={Boolean(toDelete)} danger title="Delete message" body={`The message from ${toDelete?.name} will be permanently removed.`} confirmLabel="Delete" busy={pending} onConfirm={() => toDelete && act(() => deleteMessage(toDelete.id), 'Message deleted', () => setToDelete(null))} onClose={() => setToDelete(null)} />
    </>
  );
}

// ── Settings ────────────────────────────────────────────────────────────────

export function SettingsTab({ settings }: { settings: Settings }) {
  const { pending, act } = useAdminAction();
  const [brands, setBrands] = useState(settings.brands);
  const [newBrand, setNewBrand] = useState('');
  const [paused, setPaused] = useState(settings.deliveryPaused);
  const [notice, setNotice] = useState(settings.deliveryNotice);
  const dirty = paused !== settings.deliveryPaused || notice !== settings.deliveryNotice || brands.join('|') !== settings.brands.join('|');

  const addBrand = () => {
    const value = newBrand.trim();
    if (!value) return;
    if (brands.some((b) => b.toLowerCase() === value.toLowerCase())) return void toast.error('That brand is already in the list');
    setBrands([...brands, value]);
    setNewBrand('');
  };
  const move = (index: number, direction: -1 | 1) => {
    const next = [...brands];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setBrands(next);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="card p-6">
        <h2 className="display text-2xl">Delivery</h2>
        <p className="mt-1 text-sm text-soft">Pausing delivery shows a banner on every page and blocks new orders.</p>
        <label className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-line p-4">
          <span>
            <span className="block font-medium">Pause delivery</span>
            <span className={cn('text-xs', paused ? 'text-amber-500' : 'text-signal')}>{paused ? 'Orders are currently blocked' : 'Orders are open'}</span>
          </span>
          <button type="button" role="switch" aria-checked={paused} onClick={() => setPaused((p) => !p)} className={cn('relative h-7 w-12 shrink-0 rounded-full transition', paused ? 'bg-amber-500' : 'bg-line-strong')}>
            <span className={cn('absolute top-0.5 size-6 rounded-full bg-white transition-all', paused ? 'left-[22px]' : 'left-0.5')} />
          </button>
        </label>
        <Field label="Notice shown to customers" hint={`${notice.length}/300`} className="mt-5">
          <textarea className="input" rows={3} maxLength={300} value={notice} onChange={(e) => setNotice(e.target.value)} placeholder="e.g. We're restocking — delivery will resume shortly. Thank you for your patience!" />
        </Field>
      </section>

      <section className="card p-6">
        <h2 className="display text-2xl">Brands</h2>
        <p className="mt-1 text-sm text-soft">Shown in the home page ticker, the shop filters and the menu, in this order.</p>
        <form className="mt-6 flex gap-2" onSubmit={(e) => { e.preventDefault(); addBrand(); }}>
          <input className="input h-11" value={newBrand} onChange={(e) => setNewBrand(e.target.value)} placeholder="Brand name (e.g. Truthear)…" aria-label="New brand" />
          <button type="submit" className="btn btn-outline h-11 shrink-0"><Plus size={15} /> Add</button>
        </form>
        <ul className="mt-4 grid max-h-96 gap-1.5 overflow-y-auto pr-1">
          {brands.map((brand, i) => (
            <li key={brand} className="flex items-center gap-1 rounded-xl border border-line py-1 pl-4 pr-1">
              <span className="w-6 font-mono text-[11px] text-faint">{i + 1}</span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{brand}</span>
              <IconAction label={`Move ${brand} up`} disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp size={14} /></IconAction>
              <IconAction label={`Move ${brand} down`} disabled={i === brands.length - 1} onClick={() => move(i, 1)}><ArrowDown size={14} /></IconAction>
              <IconAction label={`Remove ${brand}`} danger onClick={() => setBrands(brands.filter((_, x) => x !== i))}><X size={14} /></IconAction>
            </li>
          ))}
        </ul>
      </section>

      <div className="lg:col-span-2">
        <button onClick={() => act(() => updateSettings({ brands, deliveryPaused: paused, deliveryNotice: notice }), 'Settings saved')} disabled={pending || !dirty} className="btn btn-primary btn-lg">
          {pending ? <><Spinner /> Saving…</> : 'Save settings'}
        </button>
      </div>
    </div>
  );
}
