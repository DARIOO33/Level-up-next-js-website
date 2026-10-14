import type { Metadata } from 'next';
import Link from '@/components/Link';
import { ArrowRight, Award, BadgeCheck, Cable, Check, Headphones, Quote, Shield, Truck, Usb, X, Zap } from 'lucide-react';
import { RecentlyViewed } from '@/components/home/RecentlyViewed';
import { Tuner } from '@/components/home/Tuner';
import { ProductGrid } from '@/components/product/ProductCard';
import { Reveal, Stars } from '@/components/ui';
import { alternatesFor, getT } from '@/i18n/server';
import { getApprovedReviews, getProducts, getSettings } from '@/server/data';

export async function generateMetadata(): Promise<Metadata> {
  return { alternates: await alternatesFor('/') };
}

const FEATURE_ICONS = [Headphones, Zap, Shield, Award];
const PERK_ICONS = [Truck, BadgeCheck, Award, Headphones];

export default async function HomePage() {
  const [t, products, reviews, settings] = await Promise.all([getT(), getProducts(), getApprovedReviews(), getSettings()]);
  const featured = products.filter((p) => p.featured);
  const marquee = reviews.filter((r) => r.comment).slice(0, 8);
  const brands = [...settings.brands, ...settings.brands];

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div className="grid-lines pointer-events-none absolute inset-0" aria-hidden />
        <div className="pointer-events-none absolute -top-40 left-1/2 size-[720px] -translate-x-1/2 rounded-full bg-brand-500/20 blur-[140px]" aria-hidden />
        <div className="shell relative grid grid-cols-[minmax(0,1fr)] items-center gap-12 pb-20 pt-14 lg:grid-cols-[1.05fr_0.95fr] lg:pb-28 lg:pt-20">
          <div className="animate-rise">
            <p className="eyebrow">{t.hero.badge}</p>
            <h1 className="display mt-6 text-[clamp(3.4rem,9.5vw,7.5rem)] uppercase">
              {t.hero.headline1}
              <br />
              <span className="text-gradient">{t.hero.headline2}</span>
            </h1>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-soft sm:text-lg">{t.hero.sub}</p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link href="/shop" className="btn btn-primary btn-lg">{t.hero.cta_shop} <ArrowRight size={17} /></Link>
              <a href="#featured" className="btn btn-outline btn-lg">{t.hero.cta_explore}</a>
            </div>
            <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.16em] text-faint">{t.ui.home.kicker}</p>

            <dl className="mt-12 grid max-w-md grid-cols-3 gap-6 border-t border-line pt-8">
              {[
                { value: `${products.length}+`, label: t.hero.stat_products },
                { value: '4', label: t.hero.stat_drivers },
                { value: `${reviews.length}+`, label: t.hero.stat_reviews },
              ].map((stat) => (
                <div key={stat.label}>
                  <dd className="display text-4xl sm:text-5xl">{stat.value}</dd>
                  <dt className="mt-1.5 text-xs text-faint">{stat.label}</dt>
                </div>
              ))}
            </dl>
          </div>

          <div className="animate-rise [animation-delay:120ms]">
            <Tuner className="shadow-[0_40px_120px_-40px_var(--glow)]" />
          </div>
        </div>
      </section>

      {/* ── Brand ticker ── */}
      <div className="relative overflow-hidden border-y border-line py-5" aria-label="Brands we carry">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-bg to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-bg to-transparent" />
        <div className="flex w-max animate-marquee items-center gap-12 pr-12 hover:[animation-play-state:paused]">
          {brands.map((brand, i) => (
            <Link key={`${brand}-${i}`} href={`/shop?brand=${encodeURIComponent(brand)}`} aria-hidden={i >= settings.brands.length} tabIndex={i >= settings.brands.length ? -1 : 0} className="display flex shrink-0 items-center gap-12 text-2xl uppercase text-faint/70 transition hover:text-ink">
              {brand}
              <span className="size-1.5 rounded-full bg-brand-500/60" />
            </Link>
          ))}
        </div>
      </div>

      {/* ── Featured ── */}
      <section id="featured" className="shell scroll-mt-24 py-20 lg:py-28">
        <Reveal className="mb-12 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow">{t.home.collection_tag}</p>
            <h2 className="display mt-4 text-5xl uppercase sm:text-6xl">{t.shop.title}</h2>
            <p className="mt-3 text-soft">{t.shop.subtitle}</p>
          </div>
          <Link href="/shop" className="btn btn-outline">{t.home.view_all} <ArrowRight size={15} /></Link>
        </Reveal>
        {featured.length > 0 ? (
          <Reveal><ProductGrid products={featured} /></Reveal>
        ) : (
          <div className="card flex flex-col items-center px-6 py-20 text-center text-soft">
            <Headphones size={36} className="mb-4 text-brand-500" />
            <p>{t.ui.home.featured_empty}</p>
          </div>
        )}
      </section>

      {/* ── Categories ── */}
      <section className="shell pb-20 lg:pb-28">
        <Reveal className="mb-12">
          <p className="eyebrow">{t.ui.home.categories_tag}</p>
          <h2 className="display mt-4 text-5xl uppercase sm:text-6xl">{t.ui.home.categories_title}</h2>
        </Reveal>
        <div className="grid gap-5 md:grid-cols-2">
          <Reveal>
            <Link href="/shop?cat=iems" className="group relative flex h-80 flex-col justify-end overflow-hidden rounded-[2rem] bg-[#0f0a1f] p-8 text-white md:h-full md:min-h-[440px]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(124,58,237,0.55),transparent_60%)] transition duration-700 group-hover:scale-110" aria-hidden />
              <div className="absolute right-[-8%] top-[-12%] size-80 rounded-full border border-white/10 transition duration-700 group-hover:scale-110" aria-hidden />
              <div className="absolute right-[4%] top-[2%] size-52 rounded-full border border-white/15 transition duration-700 group-hover:scale-125" aria-hidden />
              <div className="absolute right-[14%] top-[14%] size-24 rounded-full bg-brand-500 shadow-[0_0_80px_rgba(124,58,237,0.9)]" aria-hidden />
              <div className="relative">
                <span className="tag bg-white/10 text-white dark:text-white">{t.ui.home.cat_iems_tag}</span>
                <h3 className="display mt-4 text-6xl uppercase sm:text-7xl">IEMs</h3>
                <p className="mt-2 text-sm text-white/60">{t.ui.home.cat_iems_sub}</p>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold">
                  {t.ui.home.cat_iems_cta} <ArrowRight size={15} className="transition group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          </Reveal>
          <div className="grid gap-5">
            {[
              { href: '/shop?cat=accessories', title: t.ui.home.cat_acc_title, sub: t.ui.home.cat_acc_sub, cta: t.ui.home.cat_acc_cta, Icon: Cable },
              { href: '/shop?cat=accessories&sub=dac', title: t.ui.home.cat_dac_title, sub: t.ui.home.cat_dac_sub, cta: t.ui.home.cat_dac_cta, Icon: Usb },
            ].map(({ href, title, sub, cta, Icon }, i) => (
              <Reveal key={href} delay={80 + i * 60}>
                <Link href={href} className="card card-hover group relative flex h-52 flex-col justify-end overflow-hidden p-8">
                  <Icon size={120} strokeWidth={0.8} className="absolute -right-4 -top-4 text-brand-500/15 transition duration-500 group-hover:rotate-6 group-hover:text-brand-500/30" aria-hidden />
                  <h3 className="display text-4xl uppercase">{title}</h3>
                  <p className="mt-1 text-sm text-soft">{sub}</p>
                  <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-600 dark:text-brand-300">
                    {cta} <ArrowRight size={15} className="transition group-hover:translate-x-1" />
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── IEM education ── */}
      <section className="border-y border-line bg-surface py-20 lg:py-28">
        <div className="shell">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">{t.ui.home.edu_tag}</p>
            <h2 className="display mt-4 text-4xl uppercase sm:text-5xl">{t.ui.home.edu_title}</h2>
            <p className="mt-4 text-soft">{t.ui.home.edu_sub}</p>
          </Reveal>
          <div className="mt-12 grid gap-5 lg:grid-cols-2">
            <Reveal>
              <div className="h-full rounded-3xl border border-line bg-bg p-8">
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-faint">{t.ui.home.edu_earbuds}</p>
                <ul className="mt-6 grid gap-4">
                  {t.ui.home.earbuds_points.map((point) => (
                    <li key={point} className="flex items-start gap-3 text-sm text-soft">
                      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-red-500/15 text-red-500"><X size={12} /></span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
            <Reveal delay={80}>
              <div className="relative h-full overflow-hidden rounded-3xl border border-brand-500/40 bg-brand-500/[0.07] p-8">
                <div className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-brand-500/25 blur-3xl" aria-hidden />
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-brand-600 dark:text-brand-300">{t.ui.home.edu_iems}</p>
                <ul className="relative mt-6 grid gap-4">
                  {t.ui.home.iem_points.map((point) => (
                    <li key={point} className="flex items-start gap-3 text-sm">
                      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white"><Check size={12} /></span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
          <Reveal className="mt-5 grid grid-cols-2 gap-5 lg:grid-cols-4">
            {t.ui.home.edu_stats.map((stat) => (
              <div key={stat.label} className="rounded-3xl border border-line bg-bg p-6">
                <p className="display text-4xl text-gradient">{stat.value}</p>
                <p className="mt-2 text-xs leading-relaxed text-soft">{stat.label}</p>
              </div>
            ))}
          </Reveal>
          <Reveal className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-3">
            {t.ui.home.perks.map((perk, i) => {
              const Icon = PERK_ICONS[i] ?? Check;
              return (
                <span key={perk} className="flex items-center gap-2 text-sm text-soft"><Icon size={16} className="text-brand-500" /> {perk}</span>
              );
            })}
          </Reveal>
        </div>
      </section>

      {/* ── Why us ── */}
      <section className="shell py-20 lg:py-28">
        <Reveal className="mb-12">
          <p className="eyebrow">{t.home.why_tag}</p>
          <h2 className="display mt-4 text-5xl uppercase sm:text-6xl">{t.home.why_title}</h2>
        </Reveal>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {t.home.features.map((feature, i) => {
            const Icon = FEATURE_ICONS[i] ?? Award;
            return (
              <Reveal key={feature.title} delay={i * 60}>
                <div className="card card-hover h-full p-7">
                  <div className="mb-10 flex items-center justify-between">
                    <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-500/12 text-brand-500"><Icon size={22} /></span>
                    <span className="font-mono text-xs text-faint">0{i + 1}</span>
                  </div>
                  <h3 className="display text-2xl">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-soft">{feature.desc}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ── Reviews marquee ── */}
      {marquee.length > 0 && (
        <section className="overflow-hidden pb-20 lg:pb-28">
          <Reveal className="shell mb-12 flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="eyebrow">{t.home.testimonials_tag}</p>
              <h2 className="display mt-4 text-5xl uppercase sm:text-6xl">{t.reviews.title}</h2>
              <p className="mt-3 text-soft">{t.reviews.subtitle}</p>
            </div>
            <Link href="/reviews" className="btn btn-outline">{t.home.all_reviews} <ArrowRight size={15} /></Link>
          </Reveal>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-bg to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-bg to-transparent" />
            <div className="flex w-max animate-marquee gap-5 pr-5 hover:[animation-play-state:paused]">
              {[...marquee, ...marquee].map((review, i) => (
                <figure key={`${review.id}-${i}`} aria-hidden={i >= marquee.length} className="card flex w-80 shrink-0 flex-col gap-4 p-6">
                  <div className="flex items-center justify-between">
                    <Stars value={review.rating ?? 0} />
                    <span className="tag">{review.source}</span>
                  </div>
                  <Quote size={18} className="text-brand-500/40" />
                  <blockquote className="line-clamp-4 text-sm leading-relaxed text-soft">{review.comment}</blockquote>
                  <figcaption className="mt-auto text-xs">
                    <span className="font-semibold">{review.showName && review.name ? review.name : t.home.anonymous}</span>
                    {review.productName && <span className="text-faint"> · {review.productName}</span>}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      <RecentlyViewed />

      {/* ── CTA ── */}
      <section className="shell pb-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] bg-brand-600 px-6 py-20 text-center text-white sm:px-16">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.22),transparent_45%),radial-gradient(circle_at_85%_90%,rgba(36,0,104,0.7),transparent_55%)]" aria-hidden />
            <div className="relative">
              <span className="tag bg-white/15 text-white dark:text-white">{t.home.cta_tag}</span>
              <h2 className="display mt-6 text-[clamp(2.6rem,7vw,5.5rem)] uppercase">
                {t.home.cta_title} <span className="text-brand-200">{t.home.cta_highlight}</span>
              </h2>
              <p className="mx-auto mt-5 max-w-md text-white/75">{t.home.cta_sub}</p>
              <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
                <Link href="/shop" className="btn btn-lg bg-white text-brand-700 hover:bg-brand-50">{t.home.cta_btn} <ArrowRight size={17} /></Link>
                <Link href="/about" className="btn btn-lg border border-white/30 text-white hover:bg-white/10">{t.ui.home.learn_about}</Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
