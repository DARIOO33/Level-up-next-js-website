'use client';
import { useState, useTransition } from 'react';
import Link from '@/components/Link';
import { toast } from 'sonner';
import { CheckCircle2, Star } from 'lucide-react';
import { Field, Spinner } from '@/components/ui';
import { submitReviewByToken } from '@/server/actions/store';
import { fill } from '@/i18n';
import { useT } from '@/i18n/client';
import { cn } from '@/lib/utils';

export function ReviewForm({ token, productName, defaultName }: { token: string; productName: string; defaultName: string }) {
  const t = useT();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [name, setName] = useState(defaultName);
  const [showName, setShowName] = useState(true);
  const [comment, setComment] = useState('');
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();

  const submit = () =>
    start(async () => {
      if (!rating) return void toast.error(t.ui.review.pick_rating);
      if (!comment.trim()) return void toast.error(t.checkout.required);
      const result = await submitReviewByToken(token, { name, rating, comment, showName });
      if (!result.ok) return void toast.error(result.message);
      setDone(true);
    });

  if (done) {
    return (
      <div className="shell flex min-h-[60dvh] max-w-md flex-col items-center justify-center py-16 text-center">
        <CheckCircle2 size={56} className="text-emerald-500" />
        <h1 className="display mt-6 text-4xl uppercase">{t.ui.review.thanks_title}</h1>
        <p className="mt-3 text-soft">{t.ui.review.thanks_sub}</p>
        <Link href="/shop" className="btn btn-primary mt-8">{t.checkout.continue}</Link>
      </div>
    );
  }

  return (
    <div className="shell max-w-xl py-14">
      <p className="eyebrow">{t.ui.review.tag}</p>
      <h1 className="display mt-4 text-5xl uppercase">{t.ui.review.title}</h1>
      <p className="mt-3 text-soft">{fill(t.ui.review.sub, { product: productName || t.ui.review.product_fallback })}</p>

      <form className="card mt-8 grid gap-6 p-6 sm:p-8" onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <fieldset>
          <legend className="label">{t.ui.review.rating}</legend>
          <div className="flex gap-1.5" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setRating(n)} onMouseEnter={() => setHover(n)} aria-label={`${n} / 5`} aria-pressed={rating === n} className="rounded-xl p-1 transition hover:scale-110">
                <Star size={36} strokeWidth={1.5} className={cn('transition', n <= (hover || rating) ? 'fill-amber-400 text-amber-400' : 'text-faint/50')} />
              </button>
            ))}
          </div>
        </fieldset>
        <Field label={t.ui.review.comment} hint={`${comment.length}/500`}>
          <textarea className="input" rows={5} maxLength={500} value={comment} onChange={(e) => setComment(e.target.value)} placeholder={t.ui.review.comment_placeholder} />
        </Field>
        <Field label={t.ui.review.name}>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} disabled={!showName} autoComplete="name" />
        </Field>
        <label className="flex items-center gap-3 text-sm text-soft">
          <input type="checkbox" checked={showName} onChange={(e) => setShowName(e.target.checked)} className="size-4 accent-brand-500" />
          {t.ui.review.show_name}
        </label>
        <button type="submit" disabled={pending} className="btn btn-primary btn-lg">{pending ? <><Spinner /> {t.ui.review.submitting}</> : t.ui.review.submit}</button>
      </form>
    </div>
  );
}
