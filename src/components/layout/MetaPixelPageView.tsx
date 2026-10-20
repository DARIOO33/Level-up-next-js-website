'use client';
import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { track } from '@/lib/meta-pixel';

/** Fires a PageView on every client-side route change (the noscript fallback covers the first load). */
export function MetaPixelPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const last = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;
    const url = searchParams?.size ? `${pathname}?${searchParams}` : pathname;
    if (last.current === url) return;
    last.current = url;
    track('PageView');
  }, [pathname, searchParams]);

  return null;
}
