import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Clock, PackageCheck, PackageX, RotateCcw, ShieldCheck, Truck } from 'lucide-react';
import { getT } from '@/i18n/server';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Return Policy',
  description: 'Simple, transparent returns for all IEM orders in Tunisia. 15-day return window, free replacement for defects and wrong items.',
  alternates: { canonical: '/return-policy' },
  openGraph: { title: 'Return Policy | Level Up TN', url: `${SITE_URL}/return-policy`, type: 'article' },
};

const CONDITION_ICONS = [PackageX, RotateCcw, PackageCheck];
const NOTE_ICONS = [ShieldCheck, Truck, Clock];

export default async function ReturnPolicyPage() {
  const t = await getT();
  const p = t.return_policy;
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: p.faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema).replace(/</g, '\\u003c') }} />
      <section className="relative overflow-hidden">
        <div className="grid-lines pointer-events-none absolute inset-0" aria-hidden />
        <div className="shell relative py-20 text-center lg:py-28">
          <p className="eyebrow mx-auto">{p.hero_tag}</p>
          <h1 className="display mt-5 text-6xl uppercase sm:text-8xl">{p.hero_title}</h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-soft">{p.hero_sub}</p>
        </div>
      </section>

      <section className="shell pb-20">
        <p className="eyebrow">{p.conditions_tag}</p>
        <h2 className="display mt-4 text-4xl uppercase sm:text-5xl">{p.conditions_title}</h2>
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {p.conditions.map((condition, i) => {
            const Icon = CONDITION_ICONS[i] ?? RotateCcw;
            return (
              <article key={condition.tag} className="card flex flex-col p-7">
                <div className="flex items-center justify-between">
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-500/12 text-brand-500"><Icon size={22} /></span>
                  <span className="font-mono text-[11px] uppercase tracking-wider text-faint">{condition.tag}</span>
                </div>
                <h3 className="display mt-6 text-2xl">{condition.title}</h3>
                <ul className="mt-4 grid flex-1 content-start gap-2.5">
                  {condition.items.map((item) => (
                    <li key={item} className="flex gap-3 text-sm leading-relaxed text-soft"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand-500" />{item}</li>
                  ))}
                </ul>
                <p className="mt-6 rounded-2xl bg-brand-500/10 px-4 py-3 text-sm font-medium text-brand-700 dark:text-brand-200">{condition.note}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="border-y border-line bg-surface py-20">
        <div className="shell">
          <p className="eyebrow">{p.notes_tag}</p>
          <h2 className="display mt-4 text-4xl uppercase sm:text-5xl">{p.notes_title}</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {p.notes.map((note, i) => {
              const Icon = NOTE_ICONS[i] ?? ShieldCheck;
              return (
                <div key={note.title} className="rounded-3xl border border-line bg-bg p-7">
                  <Icon size={22} className="text-brand-500" />
                  <h3 className="mt-5 font-semibold">{note.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-soft">{note.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="shell grid gap-12 py-20 lg:grid-cols-2">
        <div>
          <p className="eyebrow">{p.faq_tag}</p>
          <h2 className="display mt-4 text-4xl uppercase sm:text-5xl">{p.faq_title}</h2>
          <div className="mt-8 grid gap-3">
            {p.faqs.map((faq) => (
              <details key={faq.q} className="card group p-6 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex list-none items-center justify-between gap-4 font-semibold">
                  {faq.q}
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-line text-lg leading-none text-soft transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-4 text-sm leading-relaxed text-soft">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
        <div className="h-fit rounded-[2rem] bg-brand-600 p-9 text-white lg:sticky lg:top-24">
          <span className="tag bg-white/15 text-white dark:text-white">{p.trust_tag}</span>
          <h2 className="display mt-5 text-4xl uppercase">{p.trust_title} <span className="text-brand-200">{p.trust_highlight}</span></h2>
          <p className="mt-4 leading-relaxed text-white/80">{p.trust_text}</p>
          <Link href="/contact" className="btn btn-lg mt-8 bg-white text-brand-700 hover:bg-brand-50">{p.trust_btn} <ArrowRight size={17} /></Link>
        </div>
      </section>
    </>
  );
}
