'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowUp, GitCompareArrows, X } from 'lucide-react';
import { fill } from '@/i18n';
import { useT } from '@/i18n/client';
import { cn } from '@/lib/utils';
import { useCompareStore, useHydrated } from '@/store';

/** Compare pill + back-to-top button, bottom of the viewport. */
export function Floating() {
  const t = useT();
  const pathname = usePathname();
  const hydrated = useHydrated();
  const { ids, clear } = useCompareStore();
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 700);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const showCompare = hydrated && ids.length > 0 && pathname !== '/compare' && !pathname.startsWith('/admin') && !pathname.startsWith('/checkout');

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-40 flex items-end justify-between gap-3 px-5">
      <div className={cn('pointer-events-auto flex items-center gap-1 rounded-full border border-line-strong bg-surface/95 p-1 shadow-2xl backdrop-blur transition', showCompare ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0')}>
        <Link href="/compare" className="btn btn-primary btn-sm" tabIndex={showCompare ? 0 : -1}>
          <GitCompareArrows size={14} /> {fill(t.ui.compare.bar, { count: ids.length })}
        </Link>
        <button onClick={clear} className="icon-btn size-9" aria-label={t.ui.compare.clear} tabIndex={showCompare ? 0 : -1}><X size={15} /></button>
      </div>
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label={t.ui.common.top}
        tabIndex={showTop ? 0 : -1}
        className={cn('pointer-events-auto flex size-11 items-center justify-center rounded-full border border-line-strong bg-surface/95 text-soft shadow-xl backdrop-blur transition hover:text-ink', showTop ? 'opacity-100' : 'pointer-events-none translate-y-4 opacity-0')}
      >
        <ArrowUp size={17} />
      </button>
    </div>
  );
}
