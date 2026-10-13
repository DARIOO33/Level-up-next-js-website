import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { PackageSearch } from 'lucide-react';
import { getT } from '@/i18n/server';
import { isObjectId } from '@/lib/utils';

export const metadata: Metadata = { title: 'Track an order', description: 'Follow your Level Up TN order from confirmation to delivery.' };

export default async function TrackPage({ searchParams }: PageProps<'/orders/track'>) {
  const t = await getT();
  const { id, error } = await searchParams;

  async function track(formData: FormData) {
    'use server';
    const value = String(formData.get('id') ?? '').trim().replace(/^#/, '').toLowerCase();
    redirect(isObjectId(value) ? `/orders/${value}` : `/orders/track?error=1&id=${encodeURIComponent(value.slice(0, 40))}`);
  }

  return (
    <div className="shell flex min-h-[60dvh] max-w-xl flex-col justify-center py-16 text-center">
      <span className="mx-auto flex size-16 items-center justify-center rounded-3xl bg-brand-500/12 text-brand-500"><PackageSearch size={28} /></span>
      <p className="eyebrow mx-auto mt-6">{t.ui.orders.track_tag}</p>
      <h1 className="display mt-4 text-5xl uppercase">{t.ui.orders.track_title}</h1>
      <p className="mt-3 text-soft">{t.ui.orders.track_sub}</p>
      <form action={track} className="mt-8 flex gap-2">
        <input name="id" required defaultValue={typeof id === 'string' ? id : ''} placeholder={t.ui.orders.track_placeholder} aria-label={t.ui.orders.track_placeholder} className="input font-mono" autoComplete="off" />
        <button type="submit" className="btn btn-primary h-12 shrink-0 px-6">{t.ui.orders.track_btn}</button>
      </form>
      {error && <p className="field-error" role="alert">{t.ui.orders.not_found}</p>}
    </div>
  );
}
