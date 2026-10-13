import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Gamepad2, Mic2, Music4, SlidersHorizontal } from 'lucide-react';
import { Reveal } from '@/components/ui';
import { getT } from '@/i18n/server';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Level Up TN was founded by audiophiles who believe exceptional sound should be accessible to everyone in Tunisia.',
  alternates: { canonical: '/about' },
};

export default async function AboutPage() {
  const t = await getT();
  const stats = [
    { value: '1+', label: t.about.stat_years },
    { value: '5+', label: t.about.stat_brands },
    { value: '20+', label: t.about.stat_happy },
  ];
  const team = [
    { role: 'Audio Engineer', name: 'Founder & Lead', Icon: SlidersHorizontal },
    { role: 'Sound Engineer', name: 'Product Expert', Icon: Mic2 },
    { role: 'Competitive Gamer', name: 'Gaming Specialist', Icon: Gamepad2 },
    { role: 'Musician', name: 'Music & Stage', Icon: Music4 },
  ];

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="grid-lines pointer-events-none absolute inset-0" aria-hidden />
        <div className="shell relative grid gap-12 py-20 lg:grid-cols-[1.2fr_0.8fr] lg:py-28">
          <div>
            <p className="eyebrow">{t.about.tag}</p>
            <h1 className="display mt-5 text-6xl uppercase sm:text-8xl">{t.about.title}</h1>
            <div className="mt-8 grid max-w-xl gap-5 text-lg leading-relaxed text-soft">
              <p>{t.about.p1}</p>
              <p>{t.about.p2}</p>
            </div>
          </div>
          <dl className="grid content-end gap-4">
            {stats.map((stat) => (
              <div key={stat.label} className="card flex items-baseline justify-between gap-6 p-7">
                <dt className="text-sm text-soft">{stat.label}</dt>
                <dd className="display text-6xl text-gradient">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="border-y border-line bg-surface py-20">
        <div className="shell">
          <p className="eyebrow">{t.about.team_tag}</p>
          <h2 className="display mt-4 text-5xl uppercase sm:text-6xl">{t.about.team_title}</h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {team.map(({ role, name, Icon }, i) => (
              <Reveal key={role} delay={i * 60}>
                <div className="rounded-3xl border border-line bg-bg p-7">
                  <span className="flex size-14 items-center justify-center rounded-2xl bg-brand-500/12 text-brand-500"><Icon size={24} /></span>
                  <p className="display mt-8 text-2xl">{name}</p>
                  <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-faint">{role}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="shell py-24 text-center">
        <blockquote className="display mx-auto max-w-4xl text-[clamp(2.4rem,7vw,5.5rem)] uppercase">
          {t.about.quote}
          <br />
          <span className="text-gradient">{t.about.quote_highlight}&rdquo;</span>
        </blockquote>
        <p className="mt-6 font-mono text-sm text-faint">{t.about.quote_author}</p>
      </section>

      <section className="shell pb-8">
        <div className="relative overflow-hidden rounded-[2rem] bg-brand-600 px-6 py-16 text-center text-white sm:px-16">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.22),transparent_45%)]" aria-hidden />
          <div className="relative">
            <span className="tag bg-white/15 text-white dark:text-white">{t.about.cta_tag}</span>
            <h2 className="display mt-5 text-5xl uppercase sm:text-6xl">{t.about.cta_title} <span className="text-brand-200">{t.about.cta_highlight}</span></h2>
            <p className="mx-auto mt-4 max-w-md text-white/75">{t.about.cta_sub}</p>
            <Link href="/shop" className="btn btn-lg mt-8 bg-white text-brand-700 hover:bg-brand-50">{t.about.cta_btn} <ArrowRight size={17} /></Link>
          </div>
        </div>
      </section>
    </>
  );
}
