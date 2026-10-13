import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { RecentlyViewed } from '@/components/home/RecentlyViewed';
import { ProductGrid } from '@/components/product/ProductCard';
import { ProductDetail } from '@/components/product/ProductDetail';
import { localizePath, type Locale } from '@/i18n';
import { alternatesFor, getLocale, getT } from '@/i18n/server';
import { CATEGORY_LABELS } from '@/lib/constants';
import { SITE_NAME, SITE_URL } from '@/lib/site';
import type { Product, Review } from '@/lib/types';
import { inStock, maxPrice, minPrice } from '@/lib/utils';
import { getProduct, getProductReviews, getProducts } from '@/server/data';

const jsonLd = (data: unknown) => ({ __html: JSON.stringify(data).replace(/</g, '\\u003c') });

export async function generateMetadata({ params }: PageProps<'/product/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: 'Product not found', robots: { index: false } };

  const segment = product.slug || product.id;
  const price = minPrice(product);
  const brand = product.category === 'iems' ? product.subCategory : null;
  const title = `${product.name} Tunisie — Prix ${price} TND`;
  const [locale, alternates] = await Promise.all([getLocale(), alternatesFor(`/product/${segment}`)]);
  const description = (
    product.description ||
    (locale === 'fr'
      ? `Achetez ${product.name} en Tunisie chez Level Up TN. Produit authentique, livraison gratuite en 24–72h, paiement à la livraison.`
      : `Buy ${product.name} in Tunisia at Level Up TN. Authentic product, free delivery in 24–72h, cash on delivery.`)
  ).slice(0, 160);

  return {
    title,
    description,
    keywords: [product.name, `${product.name} Tunisia`, `${product.name} Tunisie`, `${product.name} prix`, ...(brand ? [`${brand} Tunisia`, `${brand} IEM`] : []), 'IEM Tunisia', 'Level Up TN'],
    alternates,
    openGraph: {
      type: 'website',
      url: alternates.canonical,
      siteName: SITE_NAME,
      title,
      description,
      images: product.images.filter((src) => src.startsWith('http')).slice(0, 4).map((url) => ({ url, alt: product.name })),
    },
    twitter: { card: 'summary_large_image', title, description },
  };
}

function productSchema(product: Product, reviews: Review[], avg: number | null, locale: Locale) {
  const url = `${SITE_URL}${localizePath(`/product/${product.slug || product.id}`, locale)}`;
  const brand = product.category === 'iems' ? product.subCategory : null;
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || undefined,
    image: product.images,
    sku: product.id,
    url,
    brand: brand ? { '@type': 'Brand', name: brand } : undefined,
    category: CATEGORY_LABELS[product.category] ?? product.category,
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'TND',
      lowPrice: minPrice(product),
      highPrice: maxPrice(product),
      offerCount: product.variants.length,
      availability: inStock(product) ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: SITE_NAME },
      offers: product.variants.map((v) => ({
        '@type': 'Offer',
        name: v.title,
        price: v.price,
        priceCurrency: 'TND',
        url,
        availability: v.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        itemCondition: 'https://schema.org/NewCondition',
        seller: { '@type': 'Organization', name: SITE_NAME },
        shippingDetails: {
          '@type': 'OfferShippingDetails',
          shippingRate: { '@type': 'MonetaryAmount', value: 0, currency: 'TND' },
          deliveryTime: {
            '@type': 'ShippingDeliveryTime',
            handlingTime: { '@type': 'QuantitativeValue', minValue: 0, maxValue: 1, unitCode: 'DAY' },
            transitTime: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 2, unitCode: 'DAY' },
          },
          shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'TN' },
        },
      })),
    },
    ...(avg && reviews.length
      ? {
          aggregateRating: { '@type': 'AggregateRating', ratingValue: avg, reviewCount: reviews.length, bestRating: 5, worstRating: 1 },
          review: reviews.slice(0, 5).map((r) => ({
            '@type': 'Review',
            reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5 },
            author: { '@type': 'Person', name: r.showName && r.name ? r.name : 'Anonymous' },
            reviewBody: r.comment,
            datePublished: r.createdAt ?? undefined,
          })),
        }
      : {}),
    ...(Object.keys(product.specifications).length
      ? { additionalProperty: Object.entries(product.specifications).map(([name, value]) => ({ '@type': 'PropertyValue', name, value })) }
      : {}),
  };
}

const breadcrumbSchema = (product: Product, locale: Locale) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: locale === 'fr' ? 'Accueil' : 'Home', item: `${SITE_URL}${localizePath('/', locale)}` },
    { '@type': 'ListItem', position: 2, name: locale === 'fr' ? 'Boutique' : 'Shop', item: `${SITE_URL}${localizePath('/shop', locale)}` },
    { '@type': 'ListItem', position: 3, name: product.name, item: `${SITE_URL}${localizePath(`/product/${product.slug || product.id}`, locale)}` },
  ],
});

export default async function ProductPage({ params }: PageProps<'/product/[slug]'>) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const [t, locale, { reviews, count, avg }, all] = await Promise.all([getT(), getLocale(), getProductReviews(product.id), getProducts()]);
  // Same brand first, then the rest of the category.
  const related = all
    .filter((p) => p.id !== product.id && p.category === product.category)
    .sort((a, b) => Number(b.subCategory === product.subCategory) - Number(a.subCategory === product.subCategory))
    .slice(0, 4);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(productSchema(product, reviews, avg, locale))} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(breadcrumbSchema(product, locale))} />
      <ProductDetail product={product} reviews={reviews} reviewCount={count} reviewAvg={avg} />
      {related.length > 0 && (
        <section className="shell py-16">
          <h2 className="display mb-8 text-3xl uppercase sm:text-4xl">{t.shop.related}</h2>
          <ProductGrid products={related} />
        </section>
      )}
      <RecentlyViewed excludeId={product.id} />
    </>
  );
}
