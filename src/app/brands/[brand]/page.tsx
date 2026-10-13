import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, Check } from 'lucide-react';
import { ProductGrid } from '@/components/product/ProductCard';
import { Reveal } from '@/components/ui';
import { BRAND_PAGES } from '@/lib/brands';
import { formatPrice } from '@/lib/utils';
import { getProducts } from '@/server/data';

export async function generateMetadata({ params }: PageProps<'/brands/[brand]'>): Promise<Metadata> {
  const { brand } = await params;
  return BRAND_PAGES[brand.toLowerCase()]?.metadata ?? { title: 'Brand not found', robots: { index: false } };
}

export default async function BrandPage({ params }: PageProps<'/brands/[brand]'>) {
  const { brand: key } = await params;
  const entry = BRAND_PAGES[key.toLowerCase()];
  if (!entry) notFound();
  const { brand } = entry;
  const accent = brand.accentColor ?? '#7c3aff';
  const products = (await getProducts()).filter((p) => p.name.toLowerCase().includes(brand.name.toLowerCase()) || p.subCategory?.toLowerCase() === brand.slug.toLowerCase());

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: brand.faq.map((item) => ({ '@type': 'Question', name: item.q, acceptedAnswer: { '@type': 'Answer', text: item.a } })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema).replace(/</g, '\\u003c') }} />

      {/* Hero — keeps each brand's own accent colour */}
      <section className="relative overflow-hidden text-white" style={{ background: brand.heroGradient ?? 'linear-gradient(135deg, #1a0533 0%, #0d0d1a 50%, #050508 100%)' }}>
        <div className="pointer-events-none absolute -right-24 -top-24 size-[480px] rounded-full opacity-40 blur-[120px]" style={{ background: accent }} aria-hidden />
        <div className="shell relative py-24 lg:py-32">
          <p className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em]" style={{ color: accent }}>
            <span className="h-px w-6 bg-current" /> Brand guide
          </p>
          <h1 className="display mt-6 text-[clamp(3.5rem,11vw,9rem)] uppercase">{brand.name}</h1>
          <p className="mt-5 max-w-2xl text-lg text-white/70">{brand.tagline}</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <a href="#products" className="btn btn-lg text-black" style={{ background: accent }}>Shop {brand.name} <ArrowRight size={17} /></a>
            <a href="#faq" className="btn btn-lg border border-white/25 text-white hover:bg-white/10">FAQ</a>
          </div>
        </div>
      </section>

      {/* About + highlights */}
      <section className="shell grid gap-12 py-20 lg:grid-cols-2 lg:py-28">
        <Reveal>
          <h2 className="display text-4xl uppercase sm:text-5xl">{brand.name} in Tunisia</h2>
          <div className="mt-6 grid gap-4 text-[15px] leading-relaxed text-soft">
            {brand.description.map((paragraph) => <p key={paragraph.slice(0, 40)}>{paragraph}</p>)}
          </div>
        </Reveal>
        <div className="grid gap-3">
          {brand.highlights.map((item, i) => (
            <Reveal key={item.title} delay={i * 50}>
              <div className="card flex gap-4 p-5">
                <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full text-black" style={{ background: accent }}><Check size={15} /></span>
                <div>
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-soft">{item.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Products */}
      <section id="products" className="scroll-mt-24 border-y border-line bg-surface py-20">
        <div className="shell">
          <h2 className="display text-4xl uppercase sm:text-5xl">Shop {brand.name} in Tunisia</h2>
          <p className="mt-3 text-soft">All {brand.name} products available for delivery across Tunisia. Free shipping included.</p>
          <div className="mt-10">
            {products.length > 0 ? (
              <ProductGrid products={products} />
            ) : (
              <div className="rounded-3xl border border-dashed border-line p-12 text-center text-soft">
                No {brand.name} products listed yet — <Link href="/shop" className="font-semibold text-brand-600 hover:underline dark:text-brand-300">check the full shop</Link>.
              </div>
            )}
          </div>
          {products.length > 0 && (
            <Link href={`/shop?brand=${encodeURIComponent(brand.slug)}`} className="btn btn-outline mt-8">View all {brand.name} products <ArrowRight size={15} /></Link>
          )}
        </div>
      </section>

      {/* Top models */}
      {brand.topModels && brand.topModels.length > 0 && (
        <section className="shell py-20">
          <h2 className="display text-4xl uppercase sm:text-5xl">Top {brand.name} models</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {brand.topModels.map((model) => (
              <article key={model.name} className="card card-hover flex flex-col p-6">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="display text-2xl">{model.name}</h3>
                  {model.badge && <span className="tag shrink-0">{model.badge}</span>}
                </div>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-soft">{model.desc}</p>
                {model.tags && <div className="mt-4 flex flex-wrap gap-1.5">{model.tags.map((tag) => <span key={tag} className="chip">{tag}</span>)}</div>}
                {model.price ? <p className="price mt-5 text-2xl">{formatPrice(model.price)} <span className="text-xs text-faint">TND</span></p> : null}
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Comparison */}
      {brand.comparison && (
        <section className="shell pb-20">
          <h2 className="display text-4xl uppercase sm:text-5xl">{brand.name} model comparison</h2>
          <div className="card mt-10 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-line">
                  {brand.comparison.headers.map((header) => <th key={header} scope="col" className="px-5 py-4 font-mono text-[11px] font-medium uppercase tracking-wider text-faint">{header}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {brand.comparison.rows.map((row) => (
                  <tr key={row[0]}>
                    {row.map((cell, i) => <td key={i} className={i === 0 ? 'px-5 py-4 font-semibold' : 'px-5 py-4 text-soft'}>{cell || '—'}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* FAQ */}
      <section id="faq" className="shell max-w-3xl scroll-mt-24 pb-10">
        <h2 className="display text-4xl uppercase sm:text-5xl">Common questions</h2>
        <div className="mt-8 grid gap-3">
          {brand.faq.map((item) => (
            <details key={item.q} className="card group p-6 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex list-none items-center justify-between gap-4 font-semibold">
                {item.q}
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-line text-lg leading-none text-soft transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-4 text-sm leading-relaxed text-soft">{item.a}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
