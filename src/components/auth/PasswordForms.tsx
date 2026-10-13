'use client';
import { useState, useTransition } from 'react';
import Link from '@/components/Link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle2, KeyRound, MailCheck } from 'lucide-react';
import { Field, Spinner } from '@/components/ui';
import { authClient } from '@/lib/auth-client';
import { useLocalePath, useT } from '@/i18n/client';
import { EMAIL_RE } from '@/lib/utils';

export function ForgotPassword() {
  const t = useT();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [pending, start] = useTransition();

  const submit = () =>
    start(async () => {
      if (!EMAIL_RE.test(email.trim())) return void toast.error(t.checkout.invalid_email);
      const { error } = await authClient.requestPasswordReset({ email: email.trim(), redirectTo: '/reset-password' });
      // Rate limiting is the only failure we surface; otherwise the answer is the same whether or not the account exists.
      if (error?.status === 429) return void toast.error(error.message ?? t.common.error);
      setSent(true);
    });

  return (
    <div className="shell flex min-h-[calc(100dvh-9rem)] max-w-md items-center py-12">
      <div className="card w-full p-7 sm:p-9">
        {sent ? (
          <div className="text-center">
            <MailCheck size={48} className="mx-auto text-brand-500" />
            <h1 className="display mt-5 text-3xl uppercase">{t.forgot_password.sent_title}</h1>
            <p className="mt-3 text-sm text-soft">{t.forgot_password.sent_sub}</p>
            <p className="mt-2 text-xs text-faint">{t.forgot_password.sent_hint}</p>
            <Link href="/login" className="btn btn-outline mt-7">{t.forgot_password.back}</Link>
          </div>
        ) : (
          <>
            <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-soft hover:text-ink"><ArrowLeft size={14} /> {t.forgot_password.back}</Link>
            <h1 className="display mt-5 text-3xl uppercase">{t.forgot_password.title}</h1>
            <p className="mt-2 text-sm text-soft">{t.forgot_password.sub}</p>
            <form className="mt-7 grid gap-4" onSubmit={(e) => { e.preventDefault(); submit(); }} noValidate>
              <Field label={t.forgot_password.email}><input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" autoFocus /></Field>
              <button type="submit" disabled={pending} className="btn btn-primary btn-lg">{pending ? <><Spinner /> {t.forgot_password.sending}</> : t.forgot_password.send}</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export function ResetPassword({ token }: { token: string }) {
  const t = useT();
  const router = useRouter();
  const to = useLocalePath();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();

  const submit = () =>
    start(async () => {
      if (password.length < 6) return void toast.error(t.profile.err_min_length);
      if (password !== confirm) return void toast.error(t.profile.err_mismatch);
      const { error } = await authClient.resetPassword({ newPassword: password, token });
      if (error) return void toast.error(error.message ?? t.common.error);
      setDone(true);
      setTimeout(() => router.push(to('/login')), 2200);
    });

  return (
    <div className="shell flex min-h-[calc(100dvh-9rem)] max-w-md items-center py-12">
      <div className="card w-full p-7 sm:p-9">
        {done ? (
          <div className="text-center">
            <CheckCircle2 size={48} className="mx-auto text-emerald-500" />
            <h1 className="display mt-5 text-3xl uppercase">{t.reset_password.done_title}</h1>
            <p className="mt-3 text-sm text-soft">{t.reset_password.done_sub}</p>
          </div>
        ) : !token ? (
          <div className="text-center">
            <KeyRound size={44} className="mx-auto text-faint" />
            <p className="mt-5 text-sm text-soft">Reset link is invalid or has already been used.</p>
            <Link href="/forgot-password" className="btn btn-outline mt-6">{t.forgot_password.send}</Link>
          </div>
        ) : (
          <>
            <h1 className="display text-3xl uppercase">{t.reset_password.title}</h1>
            <p className="mt-2 text-sm text-soft">{t.reset_password.sub}</p>
            <form className="mt-7 grid gap-4" onSubmit={(e) => { e.preventDefault(); submit(); }} noValidate>
              <Field label={t.reset_password.new_password}><input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" autoFocus /></Field>
              <Field label={t.reset_password.confirm_password}><input className="input" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" /></Field>
              <button type="submit" disabled={pending} className="btn btn-primary btn-lg">{pending ? <><Spinner /> {t.reset_password.submitting}</> : t.reset_password.submit}</button>
            </form>
            <p className="mt-6 text-center text-sm text-soft">{t.reset_password.remember} <Link href="/login" className="font-semibold text-brand-600 hover:underline dark:text-brand-300">{t.reset_password.sign_in}</Link></p>
          </>
        )}
      </div>
    </div>
  );
}
