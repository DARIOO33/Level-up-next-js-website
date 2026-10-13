import type { Metadata } from 'next';
import Link from '@/components/Link';
import { LinkIcon } from 'lucide-react';
import { ReviewForm } from '@/components/content/ReviewForm';
import { getT } from '@/i18n/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/server/session';

export const metadata: Metadata = { title: 'Leave a review', robots: { index: false } };

export default async function ReviewPage({ params }: PageProps<'/review/[token]'>) {
  const { token } = await params;
  const [t, user] = await Promise.all([getT(), getSessionUser()]);
  const review = token.length >= 16 ? await db.orm.storereviews.where({ token }).first() : null;

  if (!review) {
    return (
      <div className="shell flex min-h-[60dvh] max-w-md flex-col items-center justify-center py-16 text-center">
        <span className="flex size-16 items-center justify-center rounded-3xl bg-raised text-faint"><LinkIcon size={26} /></span>
        <h1 className="display mt-6 text-3xl uppercase">{t.ui.review.invalid_title}</h1>
        <p className="mt-3 text-soft">{t.ui.review.invalid_sub}</p>
        <Link href="/" className="btn btn-outline mt-8">{t.ui.common.go_home}</Link>
      </div>
    );
  }
  return <ReviewForm token={token} productName={review.productName ?? ''} defaultName={user?.name ?? ''} />;
}
