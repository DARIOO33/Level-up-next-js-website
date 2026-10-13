'use client';
import { useEffect, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Banknote, CheckCircle2, MailCheck, MapPin, PackageX, ShoppingBag, Tag, UserRound, X } from 'lucide-react';
import { PlaceFields, type Place } from '@/components/AddressFields';
import { EmptyState, Equalizer, Field, OtpInput, Spinner } from '@/components/ui';
import { registerWithOtp, sendSignupOtp } from '@/server/actions/account';
import { placeOrder, resendGuestOrderOtp, validateCoupon, verifyGuestOrder, type CouponPreview } from '@/server/actions/store';
import { fill } from '@/i18n';
import { useT } from '@/i18n/client';
import type { Address } from '@/lib/types';
import { EMAIL_RE, TN_PHONE_RE, cn, formatPrice, img, shortId } from '@/lib/utils';
import { cartTotal, useCartStore, useHydrated } from '@/store';
import { useApp } from '../app-context';

type Step = 'form' | 'otp' | 'success';
type Errors = Partial<Record<'fullname' | 'email' | 'phone' | 'governorate' | 'city', string>>;

export function CheckoutView({ addresses }: { addresses: Address[] }) {
  const t = useT();
  const router = useRouter();
  const hydrated = useHydrated();
  const { user, settings } = useApp();
  const { items, clear } = useCartStore();

  const defaultAddress = addresses.find((a) => a.isDefault) ?? addresses[0];
  const [addressId, setAddressId] = useState<string | 'new'>(defaultAddress?.id ?? 'new');
  const [form, setForm] = useState({
    fullname: defaultAddress?.fullname || user?.name || '',
    email: user?.email ?? '',
    phone: defaultAddress?.phone || user?.phoneNumber || '+216',
    street: defaultAddress?.address ?? '',
  });
  const [place, setPlace] = useState<Place>({ governorate: defaultAddress?.governorate ?? '', city: defaultAddress?.city ?? '', postalCode: defaultAddress?.postalCode ?? '' });
  const [errors, setErrors] = useState<Errors>({});
  const [step, setStep] = useState<Step>('form');
  const [otp, setOtp] = useState('');
  const [orderId, setOrderId] = useState('');
  const [emailConflict, setEmailConflict] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [coupon, setCoupon] = useState<CouponPreview | null>(null);
  const [couponError, setCouponError] = useState('');
  const [pending, start] = useTransition();
  const [couponPending, startCoupon] = useTransition();
  const [cooldown, setCooldown] = useState(0);

  const subtotal = cartTotal(items);
  const total = coupon ? Math.max(0, subtotal - coupon.discount) : subtotal;
  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value }));

  // A coupon is priced against the cart it was applied to; re-check when the cart changes.
  useEffect(() => {
    if (!coupon) return;
    validateCoupon(coupon.code, subtotal).then((r) => {
      if (r.ok) setCoupon(r.data);
      else {
        setCoupon(null);
        setCouponError(r.message);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtotal]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const pickAddress = (id: string | 'new') => {
    setAddressId(id);
    const a = addresses.find((x) => x.id === id);
    if (!a) return;
    setForm((f) => ({ ...f, fullname: a.fullname || f.fullname, phone: a.phone || f.phone, street: a.address }));
    setPlace({ governorate: a.governorate, city: a.city, postalCode: a.postalCode });
  };

  const validate = () => {
    const e: Errors = {};
    if (!form.fullname.trim()) e.fullname = t.checkout.required;
    if (!EMAIL_RE.test(form.email.trim())) e.email = t.checkout.invalid_email;
    if (!TN_PHONE_RE.test(form.phone.replace(/\s/g, ''))) e.phone = t.checkout.invalid_phone;
    if (!place.governorate) e.governorate = t.checkout.required;
    if (!place.city) e.city = t.checkout.required;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const applyCoupon = () =>
    startCoupon(async () => {
      if (!couponCode.trim()) return;
      setCouponError('');
      const result = await validateCoupon(couponCode, subtotal);
      if (result.ok) setCoupon(result.data);
      else {
        setCoupon(null);
        setCouponError(result.message);
      }
    });

  const submit = () => {
    if (settings.deliveryPaused) return void toast.error(settings.deliveryNotice || t.ui.checkout.paused_default);
    if (!validate()) return;
    setEmailConflict(false);
    start(async () => {
      // Same single-line address format the old checkout stored.
      const address = `${form.street.trim()} ${place.city} ${place.postalCode} ${place.governorate}`.replace(/\s+/g, ' ').trim();
      const result = await placeOrder({
        customer: { fullname: form.fullname.trim(), email: form.email.trim(), phone: form.phone.replace(/\s/g, ''), address },
        items: items.map((i) => ({ product: i.productSlug || i.productId, variantID: i.variantId, quantity: i.quantity })),
        couponCode: coupon?.code,
      });
      if (!result.ok) {
        if (result.code === 'email_exists') setEmailConflict(true);
        else toast.error(result.message);
        return;
      }
      if (result.data.status === 'otp_required') {
        setStep('otp');
        setOtp('');
        setCooldown(45);
        toast.success(t.ui.checkout.code_sent);
      } else {
        setOrderId(result.data.orderId);
        clear();
        setStep('success');
        router.refresh();
      }
      window.scrollTo({ top: 0 });
    });
  };

  const verify = (code = otp) =>
    start(async () => {
      if (code.length !== 6) return;
      const result = await verifyGuestOrder(form.email.trim(), code);
      if (!result.ok) {
        setOtp('');
        return void toast.error(result.message);
      }
      setOrderId(result.data.orderId);
      clear();
      setStep('success');
      window.scrollTo({ top: 0 });
    });

  const resend = () =>
    start(async () => {
      const result = await resendGuestOrderOtp(form.email.trim());
      if (result.ok) {
        setCooldown(45);
        toast.success(result.message ?? '');
      } else toast.error(result.message);
    });

  // ── Success ──
  if (step === 'success') {
    return (
      <div className="shell max-w-2xl py-16">
        <div className="card relative overflow-hidden p-10 text-center">
          <div className="pointer-events-none absolute -top-24 left-1/2 size-72 -translate-x-1/2 rounded-full bg-emerald-500/20 blur-3xl" aria-hidden />
          <CheckCircle2 size={56} className="relative mx-auto text-emerald-500" />
          <h1 className="display relative mt-6 text-4xl uppercase sm:text-5xl">{t.checkout.success_title}</h1>
          <p className="relative mt-3 text-soft">{t.checkout.success_sub}</p>
          {orderId && <p className="relative mt-5 inline-block rounded-full bg-raised px-4 py-1.5 font-mono text-sm">{fill(t.ui.checkout.order_number, { id: shortId(orderId) })}</p>}
          <div className="relative mt-8 flex flex-wrap justify-center gap-3">
            {orderId && <Link href={user ? '/orders' : `/orders/${orderId}`} className="btn btn-primary">{user ? t.ui.checkout.view_orders : t.ui.checkout.track} <ArrowRight size={15} /></Link>}
            <Link href="/shop" className="btn btn-outline">{t.checkout.continue}</Link>
          </div>
        </div>
        {!user && <GuestAccount name={form.fullname} email={form.email.trim()} phone={form.phone.replace(/\s/g, '')} />}
      </div>
    );
  }

  if (!hydrated) return <div className="flex justify-center py-40"><Equalizer /></div>;

  if (items.length === 0) {
    return (
      <div className="shell max-w-2xl py-16">
        <EmptyState icon={<ShoppingBag size={26} />} title={t.cart.empty} sub={t.cart.empty_sub}>
          <Link href="/shop" className="btn btn-primary">{t.cart.browse}</Link>
        </EmptyState>
      </div>
    );
  }

  // ── Guest email verification ──
  if (step === 'otp') {
    return (
      <div className="shell max-w-lg py-16">
        <div className="card p-8 text-center sm:p-10">
          <span className="mx-auto flex size-16 items-center justify-center rounded-3xl bg-brand-500/12 text-brand-500"><MailCheck size={28} /></span>
          <h1 className="display mt-6 text-3xl uppercase">{t.ui.checkout.otp_title}</h1>
          <p className="mt-3 text-sm text-soft">{fill(t.ui.checkout.otp_sub, { email: form.email.trim() })}</p>
          <div className="mt-8"><OtpInput value={otp} onChange={setOtp} onComplete={verify} /></div>
          <button onClick={() => verify()} disabled={pending || otp.length !== 6} className="btn btn-primary btn-lg mt-8 w-full">
            {pending ? <><Spinner /> {t.ui.checkout.verifying}</> : t.ui.checkout.verify}
          </button>
          <div className="mt-5 flex items-center justify-between text-sm">
            <button onClick={() => setStep('form')} className="inline-flex items-center gap-1.5 text-soft hover:text-ink"><ArrowLeft size={14} /> {t.ui.checkout.back}</button>
            <button onClick={resend} disabled={pending || cooldown > 0} className="text-brand-600 hover:underline disabled:text-faint disabled:no-underline dark:text-brand-300">
              {cooldown > 0 ? fill(t.ui.checkout.resend_in, { s: cooldown }) : t.ui.checkout.resend}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Form ──
  return (
    <div className="shell pb-10 pt-10 lg:pt-14">
      <Link href="/cart" className="inline-flex items-center gap-1.5 text-sm text-soft hover:text-ink"><ArrowLeft size={14} /> {t.cart.title}</Link>
      <h1 className="display mt-4 text-5xl uppercase sm:text-7xl">{t.checkout.title}</h1>

      {settings.deliveryPaused && (
        <div role="alert" className="mt-8 flex items-start gap-4 rounded-3xl border border-amber-500/30 bg-amber-500/10 p-6 text-amber-700 dark:text-amber-400">
          <PackageX size={22} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">{t.ui.checkout.paused_title}</p>
            <p className="mt-1 text-sm">{settings.deliveryNotice || t.ui.checkout.paused_default}</p>
          </div>
        </div>
      )}

      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px]">
        <form onSubmit={(e) => { e.preventDefault(); submit(); }} noValidate className="grid gap-6">
          {/* Contact */}
          <section className="card p-6 sm:p-8">
            <h2 className="flex items-center gap-3 text-lg font-semibold"><span className="flex size-8 items-center justify-center rounded-full bg-brand-500 font-mono text-xs text-white">1</span>{t.checkout.info}</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label={t.checkout.fullname} error={errors.fullname}><input className="input" value={form.fullname} onChange={set('fullname')} autoComplete="name" /></Field>
              <Field label={t.checkout.phone} error={errors.phone} hint={t.ui.checkout.phone_hint}><input className="input font-mono" type="tel" value={form.phone} onChange={set('phone')} autoComplete="tel" placeholder="+21620123456" /></Field>
              <Field label={t.checkout.email} error={errors.email} className="sm:col-span-2">
                <input className="input" type="email" value={form.email} onChange={(e) => { set('email')(e); setEmailConflict(false); }} disabled={Boolean(user)} autoComplete="email" />
              </Field>
            </div>
            {emailConflict && (
              <div role="alert" className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-brand-500/30 bg-brand-500/10 p-4">
                <div className="flex items-start gap-3">
                  <UserRound size={18} className="mt-0.5 shrink-0 text-brand-500" />
                  <div>
                    <p className="text-sm font-semibold">{t.ui.checkout.exists_title}</p>
                    <p className="text-xs text-soft">{t.ui.checkout.exists_sub}</p>
                  </div>
                </div>
                <Link href="/login?next=/checkout" className="btn btn-primary btn-sm">{t.ui.checkout.login_cta}</Link>
              </div>
            )}
          </section>

          {/* Delivery */}
          <section className="card p-6 sm:p-8">
            <h2 className="flex items-center gap-3 text-lg font-semibold"><span className="flex size-8 items-center justify-center rounded-full bg-brand-500 font-mono text-xs text-white">2</span>{t.checkout.address}</h2>
            {addresses.length > 0 && (
              <div className="mt-6">
                <p className="label">{t.ui.checkout.saved_addresses}</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {addresses.map((a) => (
                    <button type="button" key={a.id} onClick={() => pickAddress(a.id)} aria-pressed={addressId === a.id} className={cn('rounded-2xl border p-4 text-left transition', addressId === a.id ? 'border-brand-500 bg-brand-500/10' : 'border-line hover:border-line-strong')}>
                      <span className="flex items-center gap-2 text-sm font-semibold"><MapPin size={14} className="text-brand-500" /> {a.label}</span>
                      <span className="mt-1 block text-xs text-soft">{[a.address, a.city, a.governorate].filter(Boolean).join(', ')}</span>
                    </button>
                  ))}
                  <button type="button" onClick={() => { setAddressId('new'); setForm((f) => ({ ...f, street: '' })); setPlace({ governorate: '', city: '', postalCode: '' }); }} aria-pressed={addressId === 'new'} className={cn('rounded-2xl border border-dashed p-4 text-left text-sm transition', addressId === 'new' ? 'border-brand-500 bg-brand-500/10' : 'border-line text-soft hover:border-line-strong')}>
                    + {t.ui.checkout.new_address}
                  </button>
                </div>
              </div>
            )}
            <div className="mt-6 grid gap-4">
              <PlaceFields value={place} onChange={setPlace} errors={errors} />
              <Field label={t.ui.checkout.street}><input className="input" value={form.street} onChange={set('street')} autoComplete="street-address" /></Field>
            </div>
          </section>

          {/* Payment */}
          <section className="card p-6 sm:p-8">
            <h2 className="flex items-center gap-3 text-lg font-semibold"><span className="flex size-8 items-center justify-center rounded-full bg-brand-500 font-mono text-xs text-white">3</span>{t.ui.checkout.payment}</h2>
            <div className="mt-6 flex items-center gap-4 rounded-2xl border border-brand-500 bg-brand-500/10 p-4">
              <Banknote size={22} className="shrink-0 text-brand-500" />
              <div>
                <p className="text-sm font-semibold">{t.ui.checkout.payment_cod}</p>
                <p className="text-xs text-soft">{t.ui.checkout.payment_cod_sub}</p>
              </div>
            </div>
          </section>

          <button type="submit" disabled={pending || settings.deliveryPaused} className="btn btn-primary btn-lg w-full lg:hidden">
            {pending ? <><Spinner /> {t.checkout.placing}</> : <>{t.checkout.place_order} · {formatPrice(total)} TND</>}
          </button>
        </form>

        {/* Summary */}
        <aside className="card h-fit p-6 sm:p-7 lg:sticky lg:top-24">
          <h2 className="display text-2xl">{t.cart.summary}</h2>
          <ul className="mt-5 grid max-h-72 gap-4 overflow-y-auto pr-1">
            {items.map((item) => (
              <li key={`${item.productId}-${item.variantId}`} className="flex items-center gap-3">
                <span className="stage relative size-14 shrink-0 overflow-hidden rounded-xl border border-line">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img(item.image, 140)} alt="" className="size-full object-cover" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{item.name}</span>
                  <span className="block truncate font-mono text-[11px] text-faint">{item.variantName} × {item.quantity}</span>
                </span>
                <span className="price text-sm">{formatPrice(item.price * item.quantity)}</span>
              </li>
            ))}
          </ul>

          <div className="hairline my-5" />
          {coupon ? (
            <div className="flex items-center justify-between rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400">
              <span className="flex items-center gap-2 font-mono font-semibold"><Tag size={14} /> {coupon.code}</span>
              <button onClick={() => { setCoupon(null); setCouponCode(''); setCouponError(''); }} className="flex items-center gap-1 text-xs hover:underline"><X size={12} /> {t.ui.checkout.remove}</button>
            </div>
          ) : (
            <div>
              <label className="label" htmlFor="coupon">{t.ui.checkout.coupon}</label>
              <div className="flex gap-2">
                <input id="coupon" className="input font-mono uppercase" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), applyCoupon())} placeholder={t.ui.checkout.coupon_placeholder} />
                <button type="button" onClick={applyCoupon} disabled={couponPending || !couponCode.trim()} className="btn btn-outline h-12 shrink-0">{couponPending ? <Spinner /> : t.ui.checkout.apply}</button>
              </div>
              {couponError && <p className="field-error" role="alert">{couponError}</p>}
            </div>
          )}

          <dl className="mt-5 grid gap-3 text-sm">
            <div className="flex justify-between"><dt className="text-soft">{t.cart.subtotal}</dt><dd className="price">{formatPrice(subtotal)} TND</dd></div>
            {coupon && <div className="flex justify-between text-emerald-600 dark:text-emerald-400"><dt>{t.ui.checkout.discount}</dt><dd className="price">−{formatPrice(coupon.discount)} TND</dd></div>}
            <div className="flex justify-between"><dt className="text-soft">{t.cart.shipping}</dt><dd className="font-mono text-xs uppercase tracking-wider text-signal">{t.cart.shipping_free}</dd></div>
          </dl>
          <div className="hairline my-5" />
          <div className="flex items-baseline justify-between">
            <span className="font-semibold">{t.cart.total}</span>
            <span className="price text-3xl">{formatPrice(total)} <span className="text-sm text-faint">TND</span></span>
          </div>
          <button onClick={submit} disabled={pending || settings.deliveryPaused} className="btn btn-primary btn-lg mt-6 hidden w-full lg:inline-flex">
            {pending ? <><Spinner /> {t.checkout.placing}</> : <>{t.checkout.place_order} <ArrowRight size={17} /></>}
          </button>
        </aside>
      </div>
    </div>
  );
}

/** After a guest order: offer to turn the details just entered into an account (email code + password). */
function GuestAccount({ name, email, phone }: { name: string; email: string; phone: string }) {
  const t = useT();
  const router = useRouter();
  const [step, setStep] = useState<'prompt' | 'form' | 'otp' | 'hidden'>('prompt');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [pending, start] = useTransition();
  const validPhone = useMemo(() => (/^\+?[0-9]{8,15}$/.test(phone) ? phone : ''), [phone]);

  if (step === 'hidden') return null;

  const sendCode = () =>
    start(async () => {
      if (password.length < 6) return void toast.error(t.profile.err_min_length);
      const result = await sendSignupOtp(email);
      if (!result.ok) return void toast.error(result.message);
      setStep('otp');
      toast.success(t.ui.auth.code_sent);
    });

  const create = (code = otp) =>
    start(async () => {
      const result = await registerWithOtp({ name, email, password, phoneNumber: validPhone, otp: code });
      if (!result.ok) {
        setOtp('');
        return void toast.error(result.message);
      }
      toast.success(t.ui.checkout.account_created);
      setStep('hidden');
      router.refresh();
    });

  return (
    <div className="card mt-6 p-7">
      <div className="flex items-start gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-brand-500/12 text-brand-500"><UserRound size={20} /></span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{t.ui.checkout.guest_title}</p>
          <p className="mt-1 text-sm text-soft">{t.ui.checkout.guest_sub}</p>

          {step === 'prompt' && (
            <div className="mt-4 flex gap-2">
              <button onClick={() => setStep('form')} className="btn btn-primary btn-sm">{t.ui.checkout.create_account}</button>
              <button onClick={() => setStep('hidden')} className="btn btn-ghost btn-sm">{t.ui.checkout.no_thanks}</button>
            </div>
          )}
          {step === 'form' && (
            <form className="mt-4 flex flex-col gap-3 sm:flex-row" onSubmit={(e) => { e.preventDefault(); sendCode(); }}>
              <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t.ui.checkout.password} autoComplete="new-password" autoFocus aria-label={t.ui.checkout.password} />
              <button type="submit" disabled={pending} className="btn btn-primary h-12 shrink-0">{pending ? <Spinner /> : t.ui.checkout.create_account}</button>
            </form>
          )}
          {step === 'otp' && (
            <div className="mt-5">
              <p className="mb-4 text-sm text-soft">{fill(t.ui.auth.otp_sub, { email })}</p>
              <OtpInput value={otp} onChange={setOtp} onComplete={create} />
              <button onClick={() => create()} disabled={pending || otp.length !== 6} className="btn btn-primary mt-5 w-full">{pending ? <Spinner /> : t.ui.auth.verify_create}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
