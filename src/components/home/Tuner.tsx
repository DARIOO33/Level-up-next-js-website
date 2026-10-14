'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useT } from '@/i18n/client';
import { cn } from '@/lib/utils';

/**
 * Interactive frequency-response sketch: pick a sound signature and the curve
 * morphs to show what it boosts. Illustrative shapes, not measurements.
 */
const SIGNATURES = {
  neutral: [0, 0, 0, 0, 1, 0, -1],
  vshape: [7, 6, 0, -3, 1, 6, 5],
  warm: [5, 5, 3, 0, -1, -3, -5],
  bright: [-2, -1, 0, 0, 4, 7, 6],
  bass: [10, 8, 2, -1, 0, 1, -1],
} as const;
type Signature = keyof typeof SIGNATURES;
const ORDER: Signature[] = ['neutral', 'vshape', 'warm', 'bright', 'bass'];

const W = 600;
const H = 300;
const PAD = { l: 14, r: 14, t: 26, b: 44 };
const FREQS = [20, 60, 250, 1000, 3000, 8000, 16000];
const TICKS = [20, 100, 1000, 10000, 20000];
const x = (hz: number) => PAD.l + ((Math.log10(hz) - Math.log10(20)) / (Math.log10(20000) - Math.log10(20))) * (W - PAD.l - PAD.r);
const y = (db: number) => PAD.t + ((12 - db) / 24) * (H - PAD.t - PAD.b);

/** Smooth path through the points (Catmull-Rom converted to cubic Béziers). */
function smooth(points: [number, number][]) {
  let d = `M ${points[0][0]} ${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    d += ` C ${p1[0] + (p2[0] - p0[0]) / 6} ${p1[1] + (p2[1] - p0[1]) / 6}, ${p2[0] - (p3[0] - p1[0]) / 6} ${p2[1] - (p3[1] - p1[1]) / 6}, ${p2[0]} ${p2[1]}`;
  }
  return d;
}

export function Tuner({ className }: { className?: string }) {
  const t = useT();
  const [signature, setSignature] = useState<Signature>('vshape');
  const [values, setValues] = useState<number[]>([...SIGNATURES.vshape]);
  const current = useRef(values);
  const frame = useRef(0);

  useEffect(() => {
    const from = current.current;
    const to = SIGNATURES[signature];
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const started = performance.now();
    cancelAnimationFrame(frame.current);
    const tick = (now: number) => {
      const p = reduced ? 1 : Math.min(1, (now - started) / 520);
      const eased = 1 - Math.pow(1 - p, 3);
      const next = from.map((v, i) => v + (to[i] - v) * eased);
      current.current = next;
      setValues(next);
      if (p < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [signature]);

  const { line, area } = useMemo(() => {
    const points = FREQS.map((hz, i) => [x(hz), y(values[i])] as [number, number]);
    const path = smooth(points);
    const base = H - PAD.b;
    return { line: path, area: `${path} L ${points[points.length - 1][0]} ${base} L ${points[0][0]} ${base} Z` };
  }, [values]);

  const copy = t.ui.home.signatures[signature];
  const bandWidth = (W - PAD.l - PAD.r) / t.ui.home.bands.length;

  return (
    <div className={cn('card overflow-hidden', className)}>
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-faint">{t.ui.home.tuning_tag}</p>
        <p className="font-mono text-[11px] text-faint">20Hz — 20kHz</p>
      </div>

      <div className="px-3 pt-3">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`${copy.name}: ${copy.desc}`}>
          <defs>
            <linearGradient id="tuner-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.38" />
              <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="tuner-line" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#c4b5fd" />
              <stop offset="55%" stopColor="#7c3aed" />
              <stop offset="100%" stopColor="#c4b5fd" />
            </linearGradient>
          </defs>

          {[-6, 0, 6].map((db) => (
            <line key={db} x1={PAD.l} x2={W - PAD.r} y1={y(db)} y2={y(db)} stroke="var(--line)" strokeDasharray={db === 0 ? undefined : '3 6'} />
          ))}
          {TICKS.map((hz) => (
            <g key={hz}>
              <line x1={x(hz)} x2={x(hz)} y1={PAD.t} y2={H - PAD.b} stroke="var(--line)" />
              <text x={x(hz)} y={PAD.t - 9} textAnchor={hz === 20 ? 'start' : hz === 20000 ? 'end' : 'middle'} fontSize="10" fill="var(--faint)" fontFamily="var(--font-geist-mono)">
                {hz >= 1000 ? `${hz / 1000}k` : hz}
              </text>
            </g>
          ))}

          <path d={area} fill="url(#tuner-fill)" />
          <path d={line} fill="none" stroke="url(#tuner-line)" strokeWidth="3" strokeLinecap="round" />
          {FREQS.map((hz, i) => (
            <circle key={hz} cx={x(hz)} cy={y(values[i])} r="4" fill="var(--surface)" stroke="#7c3aed" strokeWidth="2" />
          ))}

          {t.ui.home.bands.map((band, i) => (
            <text key={band} x={PAD.l + bandWidth * (i + 0.5)} y={H - 16} textAnchor="middle" fontSize="10" letterSpacing="1" fill="var(--faint)" fontFamily="var(--font-geist-mono)">
              {band.toUpperCase()}
            </text>
          ))}
        </svg>
      </div>

      <div className="border-t border-line p-5">
        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1" role="tablist" aria-label={t.ui.home.tuning_tag}>
          {ORDER.map((key) => (
            <button key={key} role="tab" aria-selected={signature === key} onClick={() => setSignature(key)} className={cn('chip shrink-0', signature === key && 'chip-active')}>
              {t.ui.home.signatures[key].name}
            </button>
          ))}
        </div>
        <p className="mt-4 min-h-[4.5rem] text-sm leading-relaxed text-soft" aria-live="polite">{copy.desc}</p>
      </div>
    </div>
  );
}
