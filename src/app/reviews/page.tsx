import type { Metadata } from 'next';
import { MessageSquareQuote } from 'lucide-react';
import { EmptyState, Stars } from '@/components/ui';
import { fill } from '@/i18n';
import { getLocale, getT, localizedMetadata } from '@/i18n/server';
import { formatDate } from '@/lib/utils';
import { getApprovedReviews } from '@/server/data';

export async function generateMetadata(): Promise<Metadata> {
  return localizedMetadata('/reviews', {
    en: { title: 'Customer Reviews', description: "Real reviews from Level Up TN customers across Tunisia — IEMs, delivery and service." },
    fr: { title: "Avis clients", description: "Les vrais avis des clients Level Up TN partout en Tunisie — IEM, livraison et service." },
  });
}

export default async function ReviewsPage() {
  const [t, lang, all] = await Promise.all([getT(), getLocale(), getApprovedReviews()]);
  const reviews = all.filter((r) => r.rating && r.comment);
  const average = reviews.length ? Math.round((reviews.reduce((s, r) => s + (r.rating ?? 0), 0) / reviews.length) * 10) / 10 : 0;
  const distribution = [5, 4, 3, 2, 1].map((stars) => ({ stars, count: reviews.filter((r) => Math.round(r.rating ?? 0) === stars).length }));

  return (
    <div className="shell pb-10 pt-10 lg:pt-14">
      <p className="eyebrow">{t.home.testimonials_tag}</p>
      <h1 className="display mt-4 text-5xl uppercase sm:text-7xl">{t.reviews.title}</h1>
      <p className="mt-3 text-soft">{t.reviews.subtitle}</p>

      {reviews.length === 0 ? (
        <div className="mt-10"><EmptyState icon={<MessageSquareQuote size={26} />} title={t.ui.reviews.empty} /></div>
      ) : (
        <div className="mt-10 grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="card h-fit p-7 lg:sticky lg:top-24">
            <p className="label">{t.ui.reviews.average}</p>
            <p className="display text-7xl">{average.toFixed(1)}</p>
            <Stars value={average} size={18} className="mt-2" />
            <p className="mt-2 text-sm text-soft">{fill(t.ui.reviews.based_on, { count: reviews.length })}</p>
            <ul className="mt-6 grid gap-2">
              {distribution.map(({ stars, count }) => (
                <li key={stars} className="flex items-center gap-3 font-mono text-xs text-soft">
                  <span className="w-3">{stars}</span>
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-raised"><span className="block h-full rounded-full bg-amber-400" style={{ width: `${(count / reviews.length) * 100}%` }} /></span>
                  <span className="w-6 text-right">{count}</span>
                </li>
              ))}
            </ul>
          </aside>
          <ul className="columns-1 gap-5 md:columns-2 [&>li]:mb-5 [&>li]:break-inside-avoid">
            {reviews.map((review) => (
              <li key={review.id} className="card p-6">
                <div className="flex items-center justify-between gap-3">
                  <Stars value={review.rating ?? 0} />
                  <span className="tag">{review.source}</span>
                </div>
                <p className="mt-4 text-[15px] leading-relaxed text-soft">{review.comment}</p>
                <p className="mt-5 flex flex-wrap items-baseline gap-x-2 text-sm">
                  <span className="font-semibold">{review.showName && review.name ? review.name : t.home.anonymous}</span>
                  {review.productName && <span className="text-faint">· {review.productName}</span>}
                  <span className="ml-auto font-mono text-[11px] text-faint">{formatDate(review.createdAt, lang === 'fr' ? 'fr-FR' : 'en-GB')}</span>
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
