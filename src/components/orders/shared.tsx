'use client';
import { Check, CircleDashed, PackageCheck, Truck, XCircle, Undo2, Cog } from 'lucide-react';
import { StatusBadge } from '@/components/ui';
import { useT } from '@/i18n/client';
import type { OrderStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

export const STATUS_STEPS: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered'];
const STEP_ICONS = { pending: CircleDashed, processing: Cog, shipped: Truck, delivered: PackageCheck };

export function useStatusLabel() {
  const t = useT();
  return (status: string) =>
    ({
      pending: t.orders.status_pending,
      processing: t.orders.status_processing,
      shipped: t.orders.status_shipped,
      delivered: t.orders.status_delivered,
      cancelled: t.orders.status_cancelled,
      returned: t.ui.orders.status_returned,
    })[status] ?? status;
}

export function OrderStatusBadge({ status }: { status: string }) {
  const label = useStatusLabel();
  return <StatusBadge status={status} label={label(status)} />;
}

/** Horizontal progress: pending → processing → shipped → delivered. Cancelled/returned replace the bar. */
export function StatusTracker({ status }: { status: OrderStatus }) {
  const t = useT();
  const label = useStatusLabel();
  if (status === 'cancelled' || status === 'returned') {
    const Icon = status === 'cancelled' ? XCircle : Undo2;
    return (
      <p className={cn('flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium', status === 'cancelled' ? 'bg-red-500/10 text-red-500' : 'bg-orange-500/10 text-orange-500')}>
        <Icon size={16} /> {status === 'cancelled' ? t.orders.cancelled : t.ui.orders.returned}
      </p>
    );
  }
  const current = STATUS_STEPS.indexOf(status);
  return (
    <ol className="flex items-start">
      {STATUS_STEPS.map((step, i) => {
        const Icon = STEP_ICONS[step as keyof typeof STEP_ICONS];
        const done = i < current;
        const active = i === current;
        return (
          <li key={step} className="flex flex-1 items-start last:flex-none" aria-current={active ? 'step' : undefined}>
            <div className="flex flex-col items-center gap-2">
              <span className={cn('flex size-9 items-center justify-center rounded-full border-2 transition', done ? 'border-brand-500 bg-brand-500 text-white' : active ? 'border-brand-500 bg-brand-500/15 text-brand-500' : 'border-line text-faint')}>
                {done ? <Check size={15} /> : <Icon size={15} />}
              </span>
              <span className={cn('whitespace-nowrap font-mono text-[10px] uppercase tracking-wider', done || active ? 'text-ink' : 'text-faint')}>{label(step)}</span>
            </div>
            {i < STATUS_STEPS.length - 1 && <span className={cn('mx-2 mt-[17px] h-0.5 flex-1 rounded-full', i < current ? 'bg-brand-500' : 'bg-line')} />}
          </li>
        );
      })}
    </ol>
  );
}
