'use client';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Activity as ActivityIcon, AlertTriangle, CalendarRange, Clock, DollarSign, Eye, EyeOff, LayoutDashboard, Mail,
  MessageSquare, Package, Settings as SettingsIcon, ShoppingBag, Star, Tag, User, Users,
} from 'lucide-react';
import { Modal, StatusBadge } from '@/components/ui';
import { updateOrderStatus } from '@/server/actions/admin';
import { ORDER_STATUSES, type Activity, type AdminUser, type ContactMessage, type Coupon, type Order, type OrderStatus, type Product, type Review, type SessionUser, type Settings } from '@/lib/types';
import { cn, formatDate, formatDateTime, formatPrice, img, shortId, totalStock, tunisDay } from '@/lib/utils';
import { ActivityTab, CouponsTab, MarketingTab, MessagesTab, ReviewsTab, SettingsTab, UsersTab } from './AdminTabs';
import { ProductsTab } from './ProductsTab';
import { Confirm, PAGE_SIZE, Pager, Select, Table, Td, Toolbar, usePage } from './shared';

/** What a delivery / a returned parcel costs the shop, in TND — subtracted to show net revenue (same rule as the old dashboard). */
const DELIVERY_COST = 9;
const RETURN_COST = 5;

/** The day the shop became Dario's alone — the "Dario only" switch hides everything before it. */
const SOLO_SINCE = '2026-10-14';
const SOLO_KEY = 'admin-dario-only';

const PERIODS = [
  { value: 'all', label: 'All time' },
  { value: 'today', label: 'Today' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: 'month', label: 'This month' },
  { value: 'year', label: 'This year' },
  { value: 'custom', label: 'Custom range' },
] as const;
type Period = (typeof PERIODS)[number]['value'];

/** `YYYY-MM-DD` shifted by `days`. */
const addDays = (day: string, days: number) => {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

/** First and last day (inclusive, Tunis time) a period covers; empty = open-ended. */
function periodBounds(period: Period, custom: { from: string; to: string }) {
  const today = tunisDay();
  switch (period) {
    case 'today': return { from: today, to: today };
    case '7d': return { from: addDays(today, -6), to: today };
    case '30d': return { from: addDays(today, -29), to: today };
    case 'month': return { from: `${today.slice(0, 7)}-01`, to: today };
    case 'year': return { from: `${today.slice(0, 4)}-01-01`, to: today };
    case 'custom': return custom;
    default: return { from: '', to: '' };
  }
}

const TABS = [
  { id: 'overview', label: 'Overview', Icon: LayoutDashboard },
  { id: 'orders', label: 'Orders', Icon: ShoppingBag },
  { id: 'products', label: 'Products', Icon: Package },
  { id: 'users', label: 'Users', Icon: Users },
  { id: 'reviews', label: 'Reviews', Icon: Star },
  { id: 'activity', label: 'Activity', Icon: ActivityIcon },
  { id: 'marketing', label: 'Marketing', Icon: Mail },
  { id: 'coupons', label: 'Coupons', Icon: Tag },
  { id: 'messages', label: 'Messages', Icon: MessageSquare },
  { id: 'settings', label: 'Settings', Icon: SettingsIcon },
] as const;
type TabId = (typeof TABS)[number]['id'];

type Props = {
  me: SessionUser;
  orders: Order[];
  products: Product[];
  reviews: Review[];
  activity: Activity[];
  coupons: Coupon[];
  messages: ContactMessage[];
  settings: Settings;
  users: AdminUser[];
};

export function AdminPanel(props: Props) {
  const { me, orders, products, reviews, messages } = props;
  const [tab, setTab] = useState<TabId>('overview');
  const [revenueVisible, setRevenueVisible] = useState(false);
  const [period, setPeriod] = useState<Period>('all');
  const [custom, setCustom] = useState({ from: '', to: '' });
  const [soloOnly, setSoloOnly] = useState(false);

  // The "Dario only" choice sticks between visits (read after mount so the server render matches).
  useEffect(() => {
    try {
      if (localStorage.getItem(SOLO_KEY) === '1') setSoloOnly(true);
    } catch {}
  }, []);
  const toggleSolo = () => {
    const next = !soloOnly;
    setSoloOnly(next);
    try {
      localStorage.setItem(SOLO_KEY, next ? '1' : '0');
    } catch {}
  };

  // Overview numbers only count orders inside the chosen dates. Tabs and badges always see everything.
  const bounds = periodBounds(period, custom);
  const from = soloOnly && SOLO_SINCE > bounds.from ? SOLO_SINCE : bounds.from;
  const to = bounds.to;
  const periodOrders = useMemo(
    () =>
      from || to
        ? orders.filter((o) => {
            if (!o.createdAt) return false;
            const day = tunisDay(o.createdAt);
            return (!from || day >= from) && (!to || day <= to);
          })
        : orders,
    [orders, from, to],
  );

  const delivered = periodOrders.filter((o) => o.status === 'delivered');
  const returned = periodOrders.filter((o) => o.status === 'returned');
  const netRevenue = delivered.reduce((sum, o) => sum + o.totalAmount, 0) - (delivered.length * DELIVERY_COST + returned.length * RETURN_COST);
  const pending = orders.filter((o) => o.status === 'pending').length;
  const periodPending = periodOrders.filter((o) => o.status === 'pending').length;
  const rangeLabel = from || to ? `${from ? formatDate(`${from}T12:00:00Z`) : 'Start'} → ${to ? formatDate(`${to}T12:00:00Z`) : 'today'}` : 'All time';
  const unread = messages.filter((m) => !m.isRead).length;
  const toApprove = reviews.filter((r) => !r.isApproved && r.rating != null).length;
  const lowStock = products.filter((p) => totalStock(p) <= 5).sort((a, b) => totalStock(a) - totalStock(b));
  const badges: Partial<Record<TabId, number>> = { orders: pending, messages: unread, reviews: toApprove };

  return (
    <div className="shell pb-10 pt-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">{me.role}</p>
          <h1 className="display mt-3 text-5xl uppercase sm:text-6xl">Admin Panel</h1>
        </div>
        <p className="text-sm text-soft">Signed in as <span className="font-medium text-ink">{me.name}</span></p>
      </div>

      <div className="no-scrollbar -mx-4 mt-8 flex gap-1 overflow-x-auto border-b border-line px-4 sm:mx-0 sm:px-0" role="tablist">
        {TABS.map(({ id, label, Icon }) => (
          <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={cn('relative flex shrink-0 items-center gap-2 px-4 py-3 text-sm font-medium transition', tab === id ? 'text-ink' : 'text-faint hover:text-ink')}>
            <Icon size={15} /> {label}
            {badges[id] ? <span className="rounded-full bg-brand-500 px-1.5 py-0.5 font-mono text-[10px] leading-none text-white">{badges[id]}</span> : null}
            {tab === id && <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-brand-500" />}
          </button>
        ))}
      </div>

      <div className="mt-8" role="tabpanel">
        {tab === 'overview' && (
          <div className="grid grid-cols-1 gap-8">
            <div className="grid gap-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                <Select label="Period" value={period} onChange={setPeriod} options={[...PERIODS]} />
                {period === 'custom' && (
                  <div className="flex items-center gap-2">
                    <input type="date" className="input h-11 min-w-0 flex-1 sm:w-40 sm:flex-none" value={custom.from} max={custom.to || undefined} onChange={(e) => setCustom((c) => ({ ...c, from: e.target.value }))} aria-label="From" />
                    <span className="text-faint">→</span>
                    <input type="date" className="input h-11 min-w-0 flex-1 sm:w-40 sm:flex-none" value={custom.to} min={custom.from || undefined} onChange={(e) => setCustom((c) => ({ ...c, to: e.target.value }))} aria-label="To" />
                  </div>
                )}
                <button
                  onClick={toggleSolo}
                  aria-pressed={soloOnly}
                  title={`Only count orders from ${formatDate(`${SOLO_SINCE}T12:00:00Z`)} on`}
                  className={cn('btn h-11 shrink-0', soloOnly ? 'btn-primary' : 'btn-outline')}
                >
                  <User size={15} /> Dario only
                </button>
              </div>
              <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-faint">
                <CalendarRange size={13} /> {rangeLabel}{soloOnly && ' · Dario only'}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: 'Total orders', value: String(periodOrders.length), Icon: ShoppingBag, tone: 'text-brand-500 bg-brand-500/12' },
                { label: 'Net revenue (TND)', value: formatPrice(Math.round(netRevenue)), Icon: DollarSign, tone: 'text-emerald-500 bg-emerald-500/12', hideable: true },
                { label: 'Pending', value: String(periodPending), Icon: Clock, tone: 'text-amber-500 bg-amber-500/12' },
                { label: 'Products', value: String(products.length), Icon: Package, tone: 'text-blue-500 bg-blue-500/12' },
              ].map(({ label, value, Icon, tone, hideable }) => (
                <div key={label} className="card p-6">
                  <div className="flex items-center justify-between">
                    <span className={cn('flex size-11 items-center justify-center rounded-2xl', tone)}><Icon size={19} /></span>
                    {hideable && (
                      <button onClick={() => setRevenueVisible((v) => !v)} className="icon-btn size-9" aria-label={revenueVisible ? 'Hide revenue' : 'Show revenue'} aria-pressed={revenueVisible}>
                        {revenueVisible ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    )}
                  </div>
                  <p className={cn('display mt-6 text-4xl transition', hideable && !revenueVisible && 'select-none blur-md')} aria-hidden={hideable && !revenueVisible}>{value}</p>
                  <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-faint">{label}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
              <section className="min-w-0">
                <h2 className="display mb-4 text-2xl">Recent orders</h2>
                <OrdersTable orders={periodOrders.slice(0, 6)} compact />
              </section>
              <section className="min-w-0">
                <h2 className="display mb-4 flex items-center gap-2 text-2xl"><AlertTriangle size={18} className="text-amber-500" /> Low stock</h2>
                <ul className="card divide-y divide-line">
                  {lowStock.length === 0 && <li className="p-6 text-sm text-faint">Everything is well stocked.</li>}
                  {lowStock.slice(0, 7).map((p) => (
                    <li key={p.id} className="flex items-center gap-3 p-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img(p.images[0], 100)} alt="" className="stage size-10 rounded-xl object-cover" />
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">{p.name}</span>
                      <span className={cn('font-mono text-xs', totalStock(p) === 0 ? 'text-red-500' : 'text-amber-500')}>{totalStock(p) === 0 ? 'out' : `${totalStock(p)} left`}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </div>
        )}
        {tab === 'orders' && <OrdersTable orders={orders} />}
        {tab === 'products' && <ProductsTab products={products} brands={props.settings.brands} />}
        {tab === 'users' && <UsersTab users={props.users} me={me} />}
        {tab === 'reviews' && <ReviewsTab reviews={reviews} />}
        {tab === 'activity' && <ActivityTab activity={props.activity} />}
        {tab === 'marketing' && <MarketingTab />}
        {tab === 'coupons' && <CouponsTab coupons={props.coupons} />}
        {tab === 'messages' && <MessagesTab messages={messages} />}
        {tab === 'settings' && <SettingsTab settings={props.settings} />}
      </div>
    </div>
  );
}

// ── Orders ──────────────────────────────────────────────────────────────────

function OrdersTable({ orders, compact }: { orders: Order[]; compact?: boolean }) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | OrderStatus>('all');
  const [detail, setDetail] = useState<Order | null>(null);
  const [change, setChange] = useState<{ order: Order; status: OrderStatus } | null>(null);
  const [notify, setNotify] = useState(true);
  const [pending, start] = useTransition();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (status !== 'all' && o.status !== status) return false;
      if (!q) return true;
      return o.id.includes(q) || o.customer.fullname.toLowerCase().includes(q) || o.customer.email.toLowerCase().includes(q) || o.customer.phone.includes(q);
    });
  }, [orders, search, status]);
  const [page, setPage] = usePage(`${search}|${status}`);
  const rows = compact ? filtered : filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const confirm = () => {
    if (!change) return;
    start(async () => {
      const result = await updateOrderStatus(change.order.id, change.status, notify);
      if (!result.ok) return void toast.error(result.message);
      toast.success(`Order #${shortId(change.order.id)} → ${change.status}${notify ? ' · customer notified' : ''}`);
      setChange(null);
      router.refresh();
    });
  };

  return (
    <>
      {!compact && (
        <Toolbar search={search} onSearch={setSearch} placeholder="Search by ID, name, email or phone…">
          <Select label="Status" value={status} onChange={setStatus} options={[{ value: 'all', label: 'All statuses' }, ...ORDER_STATUSES.map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1) }))]} />
        </Toolbar>
      )}
      <Table head={['Order', 'Customer', 'Items', 'Total', 'Date', 'Status', '']} empty={rows.length === 0}>
        {rows.map((o) => (
          <tr key={o.id} className="transition hover:bg-raised/50">
            <Td><button onClick={() => setDetail(o)} className="font-mono text-xs font-semibold text-brand-600 hover:underline dark:text-brand-300">#{shortId(o.id)}</button></Td>
            <Td>
              <p className="max-w-44 truncate font-medium">{o.customer.fullname}</p>
              <p className="max-w-44 truncate text-xs text-faint">{o.customer.email}</p>
            </Td>
            <Td className="max-w-52 truncate text-xs text-soft">{o.items.map((i) => `${i.productName} ×${i.quantity}`).join(', ')}</Td>
            <Td className="price whitespace-nowrap">{formatPrice(o.totalAmount)}{o.couponCode && <span className="tag ml-2">{o.couponCode}</span>}</Td>
            <Td className="whitespace-nowrap font-mono text-xs text-faint">{formatDateTime(o.createdAt)}</Td>
            <Td><StatusBadge status={o.status} /></Td>
            <Td>
              <select
                value={o.status}
                aria-label={`Change status of order ${shortId(o.id)}`}
                onChange={(e) => { setNotify(true); setChange({ order: o, status: e.target.value as OrderStatus }); }}
                className="input h-9 w-36 rounded-xl px-3 text-xs"
              >
                {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Td>
          </tr>
        ))}
      </Table>
      {!compact && <Pager page={page} total={filtered.length} onPage={setPage} />}

      <Confirm open={Boolean(change)} title="Update order status" confirmLabel={pending ? 'Saving…' : 'Update status'} busy={pending} onConfirm={confirm} onClose={() => setChange(null)}>
        {change && (
          <>
            <p className="flex flex-wrap items-center gap-2 text-sm text-soft">
              Order <span className="font-mono text-ink">#{shortId(change.order.id)}</span>
              <StatusBadge status={change.order.status} /> → <StatusBadge status={change.status} />
            </p>
            <label className="mt-5 flex items-start gap-3 rounded-2xl border border-line p-4 text-sm">
              <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} className="mt-0.5 size-4 accent-brand-500" />
              <span>
                <span className="font-medium">Email the customer about this change</span>
                <span className="block text-xs text-faint">{change.order.customer.email}</span>
              </span>
            </label>
            {change.status === 'delivered' && (
              <p className="mt-3 text-xs text-faint">A review request is sent automatically when an order is marked delivered.</p>
            )}
          </>
        )}
      </Confirm>

      <Modal open={Boolean(detail)} onClose={() => setDetail(null)} title={detail ? `Order #${shortId(detail.id)}` : ''} size="md">
        {detail && (
          <div className="grid gap-6 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <StatusBadge status={detail.status} />
              <span className="font-mono text-xs text-faint">{formatDateTime(detail.createdAt)}</span>
            </div>
            <dl className="grid gap-3 rounded-2xl bg-raised p-5 text-sm">
              {[['Name', detail.customer.fullname], ['Email', detail.customer.email], ['Phone', detail.customer.phone], ['Address', detail.customer.address], ['Order ID', detail.id]].map(([k, v]) => (
                <div key={k} className="grid grid-cols-[5rem_1fr] gap-3">
                  <dt className="font-mono text-[11px] uppercase tracking-wider text-faint">{k}</dt>
                  <dd className="break-words">{v}</dd>
                </div>
              ))}
            </dl>
            <ul className="divide-y divide-line">
              {detail.items.map((item) => (
                <li key={item.id} className="flex items-center gap-3 py-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img(item.variantImage, 100)} alt="" className="stage size-12 rounded-xl object-cover" />
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{item.productName}</span><span className="font-mono text-[11px] text-faint">{item.variantName}</span></span>
                  <span className="font-mono text-sm">×{item.quantity}</span>
                </li>
              ))}
            </ul>
            <div className="flex items-baseline justify-between border-t border-line pt-4">
              <span className="font-semibold">Total{detail.couponCode ? ` · coupon ${detail.couponCode}` : ''}</span>
              <span className="price text-2xl">{formatPrice(detail.totalAmount)} TND</span>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
