import Image from 'next/image';
import Link from '@/components/Link';
import { cn } from '@/lib/utils';

/**
 * Horizontal lockup for headers: the brand mark beside the wordmark. The mark is
 * the same in both themes; the wordmark follows the text colour (Off White on
 * dark, Core Black-violet on light). Wordmark per the brand guide: Arial 800, wide tracking.
 */
export function Logo({ className, height = 34 }: { className?: string; height?: number }) {
  const markWidth = Math.round(height * (512 / 721));
  return (
    <Link href="/" aria-label="Level Up TN — home" className={cn('inline-flex shrink-0 items-center', className)} style={{ gap: Math.round(height * 0.32) }}>
      <Image src="/brand-mark.png" alt="" width={markWidth} height={height} preload className="block" style={{ width: markWidth, height }} />
      <span className="wordmark" style={{ fontSize: Math.round(height * 0.5) }}>LEVEL UP</span>
    </Link>
  );
}
