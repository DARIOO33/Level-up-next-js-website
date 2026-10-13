import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

/** Both artworks are rendered and swapped with CSS, so the right one shows before hydration. */
export function Logo({ className, height = 34 }: { className?: string; height?: number }) {
  const width = Math.round(height * 2.6);
  return (
    <Link href="/" aria-label="Level Up TN — home" className={cn('inline-flex shrink-0 items-center', className)}>
      <Image src="/logo.png" alt="Level Up TN" width={width} height={height} preload className="block h-auto dark:hidden" style={{ width, height: 'auto' }} />
      <Image src="/logodark.png" alt="Level Up TN" width={width} height={height} preload className="hidden h-auto dark:block" style={{ width, height: 'auto' }} />
    </Link>
  );
}
