'use client';
import { useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { Modal } from '@/components/ui';
import { cn } from '@/lib/utils';

export const PAGE_SIZE = 25;

export function Toolbar({ search, onSearch, placeholder, children }: { search: string; onSearch: (value: string) => void; placeholder: string; children?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-col gap-2 sm:flex-row">
      <div className="relative flex-1">
        <Search size={15} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-faint" />
        <input value={search} onChange={(e) => onSearch(e.target.value)} placeholder={placeholder} aria-label={placeholder} className="input h-11 pl-10" />
      </div>
      {children}
    </div>
  );
}

export function Select<T extends string>({ value, onChange, options, label }: { value: T; onChange: (value: T) => void; options: { value: T; label: string }[]; label: string }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value as T)} aria-label={label} className="input h-11 sm:w-48">
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

export function Table({ head, children, empty }: { head: string[]; children: ReactNode; empty?: boolean }) {
  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-line">
            {head.map((h, i) => <th key={i} scope="col" className="whitespace-nowrap px-4 py-3 font-mono text-[10px] font-medium uppercase tracking-widest text-faint">{h}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
      {empty && <p className="px-4 py-12 text-center text-sm text-faint">Nothing to show.</p>}
    </div>
  );
}

export const Td = ({ children, className }: { children?: ReactNode; className?: string }) => <td className={cn('px-4 py-3 align-middle', className)}>{children}</td>;

export function Pager({ page, total, onPage }: { page: number; total: number; onPage: (page: number) => void }) {
  const pages = Math.ceil(total / PAGE_SIZE);
  if (pages <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-between font-mono text-xs text-faint">
      <span>{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}</span>
      <div className="flex items-center gap-1">
        <button className="icon-btn size-9 border border-line disabled:opacity-40" disabled={page === 1} onClick={() => onPage(page - 1)} aria-label="Previous page"><ChevronLeft size={15} /></button>
        <span className="px-2">{page} / {pages}</span>
        <button className="icon-btn size-9 border border-line disabled:opacity-40" disabled={page === pages} onClick={() => onPage(page + 1)} aria-label="Next page"><ChevronRight size={15} /></button>
      </div>
    </div>
  );
}

/** Page index that snaps back to 1 whenever the filter key changes. */
export function usePage(filterKey: string) {
  const [state, setState] = useState({ page: 1, key: filterKey });
  const page = state.key === filterKey ? state.page : 1;
  return [page, (next: number) => setState({ page: next, key: filterKey })] as const;
}

export function Confirm({ open, title, body, confirmLabel = 'Confirm', cancelLabel = 'Cancel', danger, busy, onConfirm, onCancel, onClose, children }: { open: boolean; title: string; body?: string; confirmLabel?: string; cancelLabel?: string; danger?: boolean; busy?: boolean; onConfirm: () => void; /** Secondary button; defaults to closing the dialog. */ onCancel?: () => void; onClose: () => void; children?: ReactNode }) {
  return (
    <Modal open={open} onClose={onClose} size="sm" title={title}>
      <div className="p-6">
        {body && <p className="text-sm text-soft">{body}</p>}
        {children}
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onCancel ?? onClose} disabled={busy} className="btn btn-ghost">{cancelLabel}</button>
          <button onClick={onConfirm} disabled={busy} className={cn('btn', danger ? 'bg-red-500 text-white hover:bg-red-600' : 'btn-primary')}>{confirmLabel}</button>
        </div>
      </div>
    </Modal>
  );
}

export function IconAction({ label, onClick, disabled, danger, children }: { label: string; onClick: () => void; disabled?: boolean; danger?: boolean; children: ReactNode }) {
  return (
    <button onClick={onClick} disabled={disabled} aria-label={label} title={label} className={cn('icon-btn size-9 disabled:opacity-40', danger && 'hover:bg-red-500/10 hover:text-red-500')}>
      {children}
    </button>
  );
}
