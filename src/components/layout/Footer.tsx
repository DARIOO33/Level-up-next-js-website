import Link from '@/components/Link';
import { getT } from '@/i18n/server';
import { BRAND_GUIDES, SOCIALS } from '@/lib/constants';
import { SUPPORT_EMAIL } from '@/lib/site';
import { Logo } from './Logo';
import { Newsletter } from './Newsletter';

export async function Footer() {
  const t = await getT();
  const columns = [
    {
      title: t.footer.shop,
      links: [
        { href: '/shop?cat=iems', label: t.ui.nav.iems },
        { href: '/shop?cat=accessories', label: t.ui.nav.accessories },
        ...BRAND_GUIDES.map((b) => ({ href: `/brands/${b.slug}`, label: b.name })),
        { href: '/compare', label: t.ui.nav.compare },
      ],
    },
    {
      title: t.footer.company,
      links: [
        { href: '/about', label: t.footer.about },
        { href: '/contact', label: t.footer.contact },
        { href: '/reviews', label: t.ui.nav.reviews },
        { href: '/orders/track', label: t.ui.footer.track },
      ],
    },
    {
      title: t.footer.legal,
      links: [
        { href: '/privacy-policy', label: t.footer.privacy },
        { href: '/terms', label: t.footer.terms },
        { href: '/return-policy', label: t.ui.footer.returns },
      ],
    },
  ];

  return (
    <footer className="mt-24 border-t border-line bg-surface">
      <div className="shell grid gap-12 py-16 lg:grid-cols-[1.3fr_2fr]">
        <div className="max-w-sm">
          <Logo height={52} />
          <p className="mt-4 text-sm leading-relaxed text-soft">{t.footer.tagline}</p>
          <div className="mt-8">
            <p className="display text-xl">{t.footer.newsletter_title}</p>
            <p className="mb-4 mt-1 text-sm text-soft">{t.footer.newsletter_sub}</p>
            <Newsletter />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {columns.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <p className="eyebrow mb-4">{column.title}</p>
              <ul className="grid gap-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-soft transition hover:text-ink">{link.label}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>
      <div className="border-t border-line">
        <div className="shell flex flex-col items-center justify-between gap-3 py-6 text-xs text-faint sm:flex-row">
          <p>© {new Date().getFullYear()} Level Up TN. {t.footer.rights}</p>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
            {SOCIALS.map((s) => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className="transition hover:text-ink">{s.label}</a>
            ))}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="transition hover:text-ink">{SUPPORT_EMAIL}</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
