import Image from 'next/image';
import Link from '@/components/Link';
import { cn } from '@/lib/utils';

/** Both artworks are rendered and swapped with CSS, so the right one shows before hydration. */
export function Logo({ className, height = 40 }: { className?: string; height?: number }) {
  // The PNGs are trimmed to the artwork (≈5:1), so `height` is the visible height of the lockup.
  const width = Math.round(height * 5.05);
  return (
    <Link href="/" aria-label="Level Up TN — home" className={cn('inline-flex shrink-0 items-center', className)}>
      <Image src="/logo.png" alt="Level Up TN" width={width} height={height} preload className="block h-auto max-w-[52vw] dark:hidden" style={{ width, height: 'auto' }} />
      <Image src="/logodark.png" alt="Level Up TN" width={width} height={height} preload className="hidden h-auto max-w-[52vw] dark:block" style={{ width, height: 'auto' }} />
    </Link>
  );
}
