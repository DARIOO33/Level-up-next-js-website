import Link from '@/components/Link';
import type { ReactNode } from 'react';

type Section = { title: string; body: string[]; link?: { label: string; href: string } };

/** Shared layout for the privacy policy and terms pages. */
export function LegalPage({ tag, title, updated, intro, sections, footer }: { tag: string; title: string; updated: string; intro: string; sections: Section[]; footer: ReactNode }) {
  return (
    <div className="shell grid gap-12 pb-10 pt-10 lg:grid-cols-[260px_minmax(0,1fr)] lg:pt-16">
      <aside className="hidden lg:block">
        <nav className="sticky top-24 grid gap-1" aria-label="On this page">
          {sections.map((section, i) => (
            <a key={section.title} href={`#section-${i + 1}`} className="rounded-xl px-3 py-2 text-sm text-soft transition hover:bg-raised hover:text-ink">{section.title}</a>
          ))}
        </nav>
      </aside>
      <article className="max-w-3xl">
        <p className="eyebrow">{tag}</p>
        <h1 className="display mt-4 text-5xl uppercase sm:text-6xl">{title}</h1>
        <p className="mt-3 font-mono text-xs text-faint">{updated}</p>
        <p className="mt-8 rounded-3xl border border-line bg-surface p-6 text-[15px] leading-relaxed text-soft">{intro}</p>
        <div className="mt-10 grid gap-10">
          {sections.map((section, i) => (
            <section key={section.title} id={`section-${i + 1}`} className="scroll-mt-24">
              <h2 className="display text-2xl">{section.title}</h2>
              <ul className="mt-4 grid gap-3">
                {section.body.map((line) => (
                  <li key={line.slice(0, 48)} className="flex gap-3 text-[15px] leading-relaxed text-soft">
                    <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-brand-500" />
                    {line}
                  </li>
                ))}
              </ul>
              {section.link && <Link href={section.link.href} className="mt-4 inline-block text-sm font-semibold text-brand-600 hover:underline dark:text-brand-300">{section.link.label} →</Link>}
            </section>
          ))}
        </div>
        <div className="hairline my-10" />
        <p className="text-sm text-soft">{footer}</p>
      </article>
    </div>
  );
}
