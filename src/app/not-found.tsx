import Link from '@/components/Link';
import { getT } from '@/i18n/server';

export default async function NotFound() {
  const t = await getT();
  return (
    <div className="shell flex min-h-[65dvh] flex-col items-center justify-center py-20 text-center">
      <p className="display text-gradient text-[clamp(6rem,22vw,14rem)]">404</p>
      <h1 className="display text-3xl uppercase sm:text-4xl">{t.ui.common.not_found_title}</h1>
      <p className="mt-3 max-w-sm text-soft">{t.ui.common.not_found_sub}</p>
      <div className="mt-8 flex gap-3">
        <Link href="/" className="btn btn-primary">{t.ui.common.go_home}</Link>
        <Link href="/shop" className="btn btn-outline">{t.nav.shop}</Link>
      </div>
    </div>
  );
}
