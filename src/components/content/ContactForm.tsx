'use client';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { CheckCircle2, Send } from 'lucide-react';
import { Field, Spinner } from '@/components/ui';
import { submitContact } from '@/server/actions/store';
import { useT } from '@/i18n/client';
import { useApp } from '../app-context';

export function ContactForm() {
  const t = useT();
  const { user } = useApp();
  const [form, setForm] = useState({ name: user?.name ?? '', email: user?.email ?? '', message: '' });
  const [sent, setSent] = useState(false);
  const [pending, start] = useTransition();
  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = () =>
    start(async () => {
      if (!form.name.trim() || !form.email.trim() || !form.message.trim()) return void toast.error(t.contact.fill_fields);
      const result = await submitContact(form);
      if (!result.ok) return void toast.error(result.message);
      setSent(true);
    });

  if (sent) {
    return (
      <div className="card flex flex-col items-center justify-center p-12 text-center">
        <CheckCircle2 size={52} className="text-emerald-500" />
        <h2 className="display mt-5 text-3xl uppercase">{t.contact.success_title}</h2>
        <p className="mt-2 text-soft">{t.contact.success}</p>
        <button onClick={() => { setSent(false); setForm((f) => ({ ...f, message: '' })); }} className="btn btn-outline mt-7">{t.contact.send_another}</button>
      </div>
    );
  }

  return (
    <form className="card grid gap-5 p-6 sm:p-8" onSubmit={(e) => { e.preventDefault(); submit(); }} noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={t.contact.name}><input className="input" value={form.name} onChange={set('name')} maxLength={100} autoComplete="name" /></Field>
        <Field label={t.contact.email}><input className="input" type="email" value={form.email} onChange={set('email')} autoComplete="email" placeholder="john@example.com" /></Field>
      </div>
      <Field label={t.contact.message} hint={`${form.message.length}/2000`}>
        <textarea className="input" rows={7} maxLength={2000} value={form.message} onChange={set('message')} />
      </Field>
      <button type="submit" disabled={pending} className="btn btn-primary btn-lg justify-self-start">
        {pending ? <><Spinner /> {t.contact.sending}</> : <><Send size={16} /> {t.contact.send}</>}
      </button>
    </form>
  );
}
