'use client';
import { useEffect } from 'react';
import Link from '@/components/Link';
import { RotateCcw, TriangleAlert } from 'lucide-react';
import { useT } from '@/i18n/client';

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useT();
  useEffect(() => console.error(error), [error]);
  return (
    <div className="shell flex min-h-[65dvh] flex-col items-center justify-center py-20 text-center">
      <span className="flex size-16 items-center justify-center rounded-3xl bg-red-500/10 text-red-500"><TriangleAlert size={28} /></span>
      <h1 className="display mt-6 text-4xl uppercase">{t.ui.common.error_title}</h1>
      <p className="mt-3 max-w-sm text-soft">{t.ui.common.error_sub}</p>
      {error.digest && <p className="mt-2 font-mono text-[11px] text-faint">ref: {error.digest}</p>}
      <div className="mt-8 flex gap-3">
        <button onClick={reset} className="btn btn-primary"><RotateCcw size={15} /> {t.ui.common.retry}</button>
        <Link href="/" className="btn btn-outline">{t.ui.common.go_home}</Link>
      </div>
    </div>
  );
}
