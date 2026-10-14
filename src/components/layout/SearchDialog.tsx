'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from '@/components/Link';
import { useRouter } from 'next/navigation';
import { ArrowRight, CornerDownLeft, Search } from 'lucide-react';
import { getSearchIndex } from '@/server/actions/catalog';
import { useLocalePath, useT } from '@/i18n/client';
import type { Product } from '@/lib/types';
import { cn, formatPrice, img, minPrice, productPath } from '@/lib/utils';
import { Equalizer, Modal } from '../ui';

let indexCache: Product[] | null = null;

/** ⌘K / Ctrl+K search over the whole catalogue (loaded once, filtered instantly in the browser). */
export function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useT();
  const router = useRouter();
  const to = useLocalePath();
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState<Product[] | null>(indexCache);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActive(0);
    setTimeout(() => inputRef.current?.focus(), 30);
    if (!indexCache) {
      getSearchIndex().then((list) => {
        indexCache = list;
        setIndex(list);
      });
    }
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!index) return [];
    if (!q) return index.filter((p) => p.featured).slice(0, 5);
    const words = q.split(/\s+/);
    return index
      .filter((p) => {
        const hay = `${p.name} ${p.subCategory ?? ''} ${p.category} ${p.description} ${p.descriptionFr}`.toLowerCase();
        return words.every((w) => hay.includes(w));
      })
      .slice(0, 7);
  }, [index, query]);

  const go = (href: string) => {
    onClose();
    router.push(to(href));
  };

  return (
    <Modal open={open} onClose={onClose} size="md">
      <div className="flex items-center gap-3 border-b border-line px-5">
        <Search size={18} className="shrink-0 text-faint" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setActive(0); }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
            if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
            if (e.key === 'Enter') {
              e.preventDefault();
              if (results[active]) go(productPath(results[active]));
              else if (query.trim()) go(`/shop?search=${encodeURIComponent(query.trim())}`);
            }
          }}
          placeholder={t.ui.nav.search_placeholder}
          className="h-14 w-full bg-transparent text-[15px] outline-none placeholder:text-faint"
          aria-label={t.ui.nav.search}
        />
        <kbd className="hidden rounded-md border border-line px-1.5 py-0.5 font-mono text-[10px] text-faint sm:block">ESC</kbd>
      </div>

      <div className="p-2">
        {!index ? (
          <div className="flex justify-center py-10"><Equalizer /></div>
        ) : results.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-soft">{query ? t.ui.nav.search_empty : t.ui.nav.search_hint}</p>
        ) : (
          <ul>
            {results.map((p, i) => (
              <li key={p.id}>
                <Link
                  href={productPath(p)}
                  onClick={onClose}
                  onMouseEnter={() => setActive(i)}
                  className={cn('flex items-center gap-3 rounded-2xl p-2.5 transition', i === active && 'bg-raised')}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img(p.images[0], 120)} alt="" className="stage size-12 shrink-0 rounded-xl object-cover" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{p.name}</span>
                    <span className="block truncate font-mono text-[11px] uppercase tracking-wider text-faint">{p.subCategory || p.category}</span>
                  </span>
                  <span className="price text-sm text-brand-500 dark:text-brand-300">{formatPrice(minPrice(p))} TND</span>
                  {i === active && <CornerDownLeft size={14} className="text-faint" />}
                </Link>
              </li>
            ))}
          </ul>
        )}
        {query.trim() && (
          <button onClick={() => go(`/shop?search=${encodeURIComponent(query.trim())}`)} className="mt-1 flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm text-soft transition hover:bg-raised hover:text-ink">
            {t.ui.nav.search_all} <ArrowRight size={14} />
          </button>
        )}
      </div>
    </Modal>
  );
}
