'use client';
import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Star, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHydrated } from '@/store';

/** Five stars; `value` may be fractional (rounded for display). */
export function Stars({ value, size = 14, className }: { value: number; size?: number; className?: string }) {
  const rounded = Math.round(value);
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)} role="img" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={size} strokeWidth={1.6} className={n <= rounded ? 'fill-amber-400 text-amber-400' : 'text-faint/50'} />
      ))}
    </span>
  );
}

/** Loader drawn as a tiny equaliser — the site's signature motif. */
export function Equalizer({ className, bars = 4 }: { className?: string; bars?: number }) {
  return (
    <span className={cn('inline-flex h-4 items-end gap-[3px]', className)} aria-hidden>
      {Array.from({ length: bars }, (_, i) => (
        <span key={i} className="eq-bar h-full" style={{ animationDelay: `${i * 0.14}s` }} />
      ))}
    </span>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <span className={cn('inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent', className)} role="status" aria-label="Loading" />;
}

/** Fades content up the first time it scrolls into view. */
export function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('is-visible');
          observer.disconnect();
        }
      },
      { threshold: 0.08 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={ref} className={cn('reveal', className)} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

export function Modal({
  open,
  onClose,
  children,
  title,
  size = 'md',
  side,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Render as a drawer pinned to the right edge instead of a centred dialog. */
  side?: boolean;
}) {
  const hydrated = useHydrated();
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open || !hydrated) return null;
  const widths = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' };
  return createPortal(
    <div className={cn('fixed inset-0 z-[100] flex', side ? 'justify-end' : 'items-end justify-center p-0 sm:items-center sm:p-6')}>
      <button aria-label="Close" className="absolute inset-0 animate-fade bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'relative flex w-full flex-col border-line bg-surface shadow-2xl',
          side
            ? 'h-full max-w-md animate-fade border-l'
            : cn('max-h-[92dvh] animate-rise rounded-t-3xl border sm:rounded-3xl', widths[size]),
        )}
      >
        {title && (
          <div className="flex shrink-0 items-center justify-between gap-4 border-b border-line px-6 py-4">
            <h2 className="display text-xl">{title}</h2>
            <button onClick={onClose} className="icon-btn -mr-2" aria-label="Close">
              <X size={18} />
            </button>
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

/** Row of single-digit boxes with paste support and auto-advance. */
export function OtpInput({ length = 6, value, onChange, onComplete }: { length?: number; value: string; onChange: (value: string) => void; onComplete?: (value: string) => void }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? '');

  const commit = (next: string) => {
    const clean = next.replace(/\D/g, '').slice(0, length);
    onChange(clean);
    if (clean.length === length) onComplete?.(clean);
    refs.current[Math.min(clean.length, length - 1)]?.focus();
  };

  return (
    <div className="flex justify-center gap-2" onPaste={(e) => { e.preventDefault(); commit(e.clipboardData.getData('text')); }}>
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          value={digit}
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          autoFocus={i === 0}
          aria-label={`Digit ${i + 1}`}
          className="input h-14 w-11 px-0 text-center font-mono text-xl sm:w-12"
          onChange={(e) => {
            const d = e.target.value.replace(/\D/g, '').slice(-1);
            if (!d) return;
            commit(value.slice(0, i) + d + value.slice(i + 1));
          }}
          onKeyDown={(e) => {
            if (e.key === 'Backspace') {
              e.preventDefault();
              if (value[i]) onChange(value.slice(0, i) + value.slice(i + 1));
              else if (i > 0) {
                onChange(value.slice(0, i - 1) + value.slice(i));
                refs.current[i - 1]?.focus();
              }
            }
            if (e.key === 'ArrowLeft') refs.current[i - 1]?.focus();
            if (e.key === 'ArrowRight') refs.current[i + 1]?.focus();
          }}
        />
      ))}
    </div>
  );
}

export function Field({ label, error, hint, children, className }: { label: string; error?: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn('block', className)}>
      <span className="label">{label}</span>
      {children}
      {error ? <span className="field-error block">{error}</span> : hint ? <span className="mt-1.5 block text-xs text-faint">{hint}</span> : null}
    </label>
  );
}

export function EmptyState({ icon, title, sub, children }: { icon?: ReactNode; title: string; sub?: string; children?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center px-6 py-16 text-center">
      {icon && <div className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-500">{icon}</div>}
      <p className="display text-2xl">{title}</p>
      {sub && <p className="mt-2 max-w-sm text-sm text-soft">{sub}</p>}
      {children && <div className="mt-6">{children}</div>}
    </div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  processing: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  shipped: 'bg-violet-500/15 text-violet-600 dark:text-violet-300',
  delivered: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  cancelled: 'bg-red-500/15 text-red-600 dark:text-red-400',
  returned: 'bg-orange-500/15 text-orange-600 dark:text-orange-400',
};

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider', STATUS_STYLES[status] ?? STATUS_STYLES.pending)}>
      <span className="size-1.5 rounded-full bg-current" />
      {label ?? status}
    </span>
  );
}
