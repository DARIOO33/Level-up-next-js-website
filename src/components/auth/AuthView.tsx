'use client';
import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Eye, EyeOff, MailCheck, MapPin } from 'lucide-react';
import { PlaceFields, type Place } from '@/components/AddressFields';
import { Tuner } from '@/components/home/Tuner';
import { Field, OtpInput, Spinner } from '@/components/ui';
import { registerWithOtp, saveAddress, sendSignupOtp } from '@/server/actions/account';
import { authClient } from '@/lib/auth-client';
import { fill } from '@/i18n';
import { useT } from '@/i18n/client';
import { EMAIL_RE, PHONE_RE } from '@/lib/utils';
import { useApp } from '../app-context';

type Mode = 'login' | 'register';
type Step = 'form' | 'otp' | 'address';

export function AuthView({ next, initialMode, onboarding = null }: { next: string; initialMode: Mode; onboarding?: { name: string; phone: string | null } | null }) {
  const t = useT();
  const router = useRouter();
  const { googleEnabled } = useApp();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [formStep, setStep] = useState<Step>('form');
  // Signed in and sent back here by the register action: only the address step is left.
  const step: Step = onboarding ? 'address' : formStep;
  const [form, setForm] = useState({ name: '', email: '', password: '', phoneNumber: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [pending, start] = useTransition();
  const [address, setAddress] = useState({ label: 'Home', phone: onboarding?.phone || '+216', street: '' });
  const [place, setPlace] = useState<Place>({ governorate: '', city: '', postalCode: '' });

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const done = () => {
    router.push(next);
    router.refresh();
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (mode === 'register' && !form.name.trim()) e.name = t.checkout.required;
    if (!EMAIL_RE.test(form.email.trim())) e.email = t.checkout.invalid_email;
    if (form.password.length < 6) e.password = t.profile.err_min_length;
    if (mode === 'register' && form.phoneNumber.trim() && !PHONE_RE.test(form.phoneNumber.trim())) e.phoneNumber = t.checkout.invalid_phone;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = () => {
    if (!validate()) return;
    start(async () => {
      if (mode === 'login') {
        const { error } = await authClient.signIn.email({ email: form.email.trim(), password: form.password });
        if (error) return void toast.error(error.status === 429 ? error.message ?? t.common.error : t.ui.auth.invalid);
        toast.success(t.ui.auth.welcome_back);
        return done();
      }
      const result = await sendSignupOtp(form.email);
      if (!result.ok) return void toast.error(result.message);
      setOtp('');
      setStep('otp');
      toast.success(t.ui.auth.code_sent);
    });
  };

  const verify = (code = otp) =>
    start(async () => {
      if (code.length !== 6) return;
      setAddress((a) => ({ ...a, phone: form.phoneNumber.trim() || '+216' }));
      // Redirects to the address step on success, so only failures come back here.
      const result = await registerWithOtp({ ...form, otp: code }, next);
      if (result && !result.ok) {
        setOtp('');
        toast.error(result.message);
      }
    });

  const resend = () =>
    start(async () => {
      const result = await sendSignupOtp(form.email);
      if (result.ok) toast.success(t.ui.auth.code_sent);
      else toast.error(result.message);
    });

  const saveFirstAddress = () =>
    start(async () => {
      if (!place.governorate || !place.city || address.phone.replace(/\s/g, '').length < 8) return void toast.error(t.checkout.required);
      const result = await saveAddress({ label: address.label, fullname: form.name.trim() || onboarding?.name || '', phone: address.phone.replace(/\s/g, ''), address: address.street, ...place, isDefault: true });
      if (!result.ok) return void toast.error(result.message);
      done();
    });

  const google = () => {
    if (!googleEnabled) return void toast.error(t.ui.auth.google_unavailable);
    start(async () => {
      await authClient.signIn.social({ provider: 'google', callbackURL: next, newUserCallbackURL: '/profile' });
    });
  };

  return (
    <div className="shell grid min-h-[calc(100dvh-9rem)] items-center gap-12 py-12 lg:grid-cols-2">
      {/* Brand panel */}
      <div className="hidden lg:block">
        <p className="eyebrow">Level Up TN</p>
        <h2 className="display mt-5 text-6xl uppercase">{t.ui.auth.side_title}</h2>
        <p className="mt-4 max-w-md text-soft">{t.ui.auth.side_sub}</p>
        <Tuner className="mt-10 max-w-lg" />
      </div>

      <div className="mx-auto w-full max-w-md">
        <div className="card p-7 sm:p-9">
          {step === 'address' ? (
            <>
              <span className="flex size-14 items-center justify-center rounded-2xl bg-brand-500/12 text-brand-500"><MapPin size={24} /></span>
              <h1 className="display mt-5 text-3xl uppercase">{t.ui.auth.address_title}</h1>
              <p className="mt-2 text-sm text-soft">{t.ui.auth.address_sub}</p>
              <form className="mt-7 grid gap-4" onSubmit={(e) => { e.preventDefault(); saveFirstAddress(); }}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={t.ui.account.label}><input className="input" value={address.label} onChange={(e) => setAddress((a) => ({ ...a, label: e.target.value }))} placeholder={t.ui.account.label_placeholder} /></Field>
                  <Field label={t.checkout.phone}><input className="input font-mono" type="tel" value={address.phone} onChange={(e) => setAddress((a) => ({ ...a, phone: e.target.value }))} /></Field>
                </div>
                <PlaceFields value={place} onChange={setPlace} />
                <Field label={t.ui.checkout.street}><input className="input" value={address.street} onChange={(e) => setAddress((a) => ({ ...a, street: e.target.value }))} /></Field>
                <button type="submit" disabled={pending} className="btn btn-primary btn-lg mt-2">{pending ? <Spinner /> : t.ui.auth.save_continue}</button>
                <button type="button" onClick={done} className="btn btn-ghost">{t.ui.auth.skip}</button>
              </form>
            </>
          ) : step === 'otp' ? (
            <div className="text-center">
              <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-brand-500/12 text-brand-500"><MailCheck size={24} /></span>
              <h1 className="display mt-5 text-3xl uppercase">{t.ui.auth.otp_title}</h1>
              <p className="mt-2 text-sm text-soft">{fill(t.ui.auth.otp_sub, { email: form.email.trim() })}</p>
              <div className="mt-8"><OtpInput value={otp} onChange={setOtp} onComplete={verify} /></div>
              <button onClick={() => verify()} disabled={pending || otp.length !== 6} className="btn btn-primary btn-lg mt-8 w-full">{pending ? <Spinner /> : t.ui.auth.verify_create}</button>
              <div className="mt-5 flex items-center justify-between text-sm">
                <button onClick={() => setStep('form')} className="inline-flex items-center gap-1.5 text-soft hover:text-ink"><ArrowLeft size={14} /> {t.ui.auth.back}</button>
                <button onClick={resend} disabled={pending} className="text-brand-600 hover:underline dark:text-brand-300">{t.ui.auth.resend}</button>
              </div>
            </div>
          ) : (
            <>
              <h1 className="display text-4xl uppercase">{mode === 'login' ? t.auth.login_title : t.auth.register_title}</h1>
              <p className="mt-2 text-sm text-soft">{mode === 'login' ? t.auth.login_sub : t.auth.register_sub}</p>

              <div className="mt-7 grid grid-cols-2 rounded-full bg-raised p-1" role="tablist">
                {(['login', 'register'] as const).map((m) => (
                  <button key={m} role="tab" aria-selected={mode === m} onClick={() => { setMode(m); setErrors({}); }} className={`h-10 rounded-full text-sm font-semibold transition ${mode === m ? 'bg-surface text-ink shadow-sm' : 'text-soft'}`}>
                    {m === 'login' ? t.auth.login_link : t.auth.register_link}
                  </button>
                ))}
              </div>

              <form className="mt-6 grid gap-4" onSubmit={(e) => { e.preventDefault(); submit(); }} noValidate>
                {mode === 'register' && (
                  <Field label={t.auth.name} error={errors.name}><input className="input" value={form.name} onChange={set('name')} autoComplete="name" /></Field>
                )}
                <Field label={t.auth.email} error={errors.email}><input className="input" type="email" value={form.email} onChange={set('email')} autoComplete="email" /></Field>
                {mode === 'register' && (
                  <Field label={t.auth.phone} error={errors.phoneNumber}><input className="input font-mono" type="tel" value={form.phoneNumber} onChange={set('phoneNumber')} autoComplete="tel" placeholder="+21620123456" /></Field>
                )}
                <Field label={t.auth.password} error={errors.password}>
                  <span className="relative block">
                    <input className="input pr-12" type={showPassword ? 'text' : 'password'} value={form.password} onChange={set('password')} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
                    <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-1.5 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full text-faint hover:text-ink" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </span>
                </Field>
                {mode === 'login' && (
                  <Link href="/forgot-password" className="-mt-1 justify-self-end text-xs text-soft hover:text-ink">{t.ui.auth.forgot}</Link>
                )}
                <button type="submit" disabled={pending} className="btn btn-primary btn-lg mt-1">
                  {pending ? <><Spinner /> {mode === 'login' ? t.auth.logging_in : t.auth.registering}</> : mode === 'login' ? t.auth.login_btn : t.auth.register_btn}
                </button>
              </form>

              {googleEnabled && (
                <>
                  <div className="my-6 flex items-center gap-4 text-xs uppercase tracking-widest text-faint"><span className="hairline" />{t.ui.auth.or}<span className="hairline" /></div>
                  <button onClick={google} disabled={pending} className="btn btn-outline btn-lg w-full">
                    <svg viewBox="0 0 24 24" className="size-[18px]" aria-hidden><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" /><path fill="#FBBC05" d="M5.84 14.09a6.6 6.6 0 0 1 0-4.18V7.07H2.18a11 11 0 0 0 0 9.86l3.66-2.84z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" /></svg>
                    {t.ui.auth.google}
                  </button>
                </>
              )}

              <p className="mt-6 text-center text-sm text-soft">
                {mode === 'login' ? t.auth.no_account : t.auth.has_account}{' '}
                <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="font-semibold text-brand-600 hover:underline dark:text-brand-300">
                  {mode === 'login' ? t.auth.register_link : t.auth.login_link}
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
