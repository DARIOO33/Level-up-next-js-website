'use client';
import { useState, useTransition } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { subscribeNewsletter, verifyNewsletter } from '@/server/actions/store';
import { fill } from '@/i18n';
import { useT } from '@/i18n/client';
import { Spinner } from '../ui';

/** Email → 4-digit code → subscribed. Same two-step flow as before. */
export function Newsletter() {
  const t = useT();
  const [step, setStep] = useState<'email' | 'otp' | 'done'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [pending, start] = useTransition();

  const subscribe = () =>
    start(async () => {
      setError('');
      const result = await subscribeNewsletter(email);
      if (result.ok) setStep('otp');
      else setError(result.message);
    });

  const verify = () =>
    start(async () => {
      setError('');
      const result = await verifyNewsletter(email, otp);
      if (result.ok) setStep('done');
      else setError(result.message);
    });

  if (step === 'done') {
    return (
      <p className="flex items-center gap-2 rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400">
        <Check size={16} /> {t.ui.footer.subscribed}
      </p>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (step === 'email') subscribe();
        else verify();
      }}
    >
      {step === 'otp' && <p className="mb-3 text-xs text-soft">{fill(t.ui.footer.code_sent, { email })}</p>}
      <div className="flex gap-2">
        {step === 'email' ? (
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t.footer.newsletter_placeholder} className="input" aria-label={t.checkout.email} />
        ) : (
          <input inputMode="numeric" maxLength={4} required value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} placeholder={t.ui.footer.code_placeholder} className="input font-mono tracking-[0.4em]" aria-label={t.ui.footer.code_placeholder} autoFocus />
        )}
        <button type="submit" disabled={pending} className="btn btn-primary h-12 shrink-0 px-5">
          {pending ? <Spinner /> : step === 'email' ? <>{t.footer.newsletter_btn} <ArrowRight size={15} /></> : t.ui.footer.verify}
        </button>
      </div>
      {step === 'otp' && (
        <button type="button" onClick={subscribe} disabled={pending} className="mt-2 text-xs text-faint underline-offset-4 hover:text-ink hover:underline">{t.ui.footer.resend}</button>
      )}
      {error && <p className="field-error" role="alert">{error}</p>}
    </form>
  );
}
