import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque, Geist, Geist_Mono } from 'next/font/google';
import { PackageX } from 'lucide-react';
import { Floating } from '@/components/layout/Floating';
import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';
import { Providers } from '@/components/layout/Providers';
import { getDictionary } from '@/i18n';
import { getLocale } from '@/i18n/server';
import { googleEnabled } from '@/lib/auth';
import { SITE_NAME, SITE_URL } from '@/lib/site';
import { DEFAULT_BRANDS, getSettings, getWishlistIds } from '@/server/data';
import { getSessionUser } from '@/server/session';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'], display: 'swap' });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'], display: 'swap' });
const bricolage = Bricolage_Grotesque({ variable: '--font-bricolage', subsets: ['latin'], display: 'swap', axes: ['wdth', 'opsz'] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `IEM Tunisie — KZ, 7Hz & Moondrop In-Ear Monitors | ${SITE_NAME}`, template: `%s | ${SITE_NAME}` },
  description:
    'Buy IEMs in Tunisia (IEM Tunisie): KZ, 7Hz and Moondrop in-ear monitors for gaming and music, plus cables, ear tips and DACs. Authentic products, free delivery in 24–72h, cash on delivery.',
  keywords: [
    'IEM', 'IEM Tunisie', 'IEMs Tunisie', 'KZ Tunisie', 'KZ IEM', 'in ear monitor', 'in ear monitor Tunisie',
    'écouteurs intra-auriculaires Tunisie', 'écouteurs gaming Tunisie', 'KZ', 'KZ earphones Tunisia', 'CCA', 'TRN', 'Moondrop', '7Hz', 'Kinera',
    'Truthear', 'Simgot', 'Letshuoer', 'Kiwi Ears', 'Tangzu', 'BLON', 'Tin HiFi',
    'HIDIZS', 'FiiO', 'Shanling', 'IEM Tunisia', 'in-ear monitors Tunisia',
    'earphones Tunisia', 'audiophile Tunisia', 'chi-fi IEM', 'budget IEM', 'best IEM',
    'wired earphones', 'DAC dongle Tunisia', 'ear tips', 'IEM cable',
    'سماعات تونس', 'سماعات IEM', 'casque audio tunisie', 'écouteurs tunisie',
    'Level Up TN', 'leveluptn',
  ],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: 'Electronics & Audio',
  verification: process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : undefined,
  openGraph: {
    type: 'website',
    locale: 'en_US',
    alternateLocale: ['fr_FR', 'ar_TN'],
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `IEM Tunisie — KZ, 7Hz & Moondrop In-Ear Monitors | ${SITE_NAME}`,
    description: 'IEMs and in-ear monitors in Tunisia for gamers and music lovers. KZ, 7Hz, Moondrop and more — free delivery, cash on delivery.',
  },
  twitter: {
    card: 'summary_large_image',
    title: `IEM Tunisie — KZ, 7Hz & Moondrop | ${SITE_NAME}`,
    description: 'IEMs and in-ear monitors in Tunisia for gamers and music lovers. Free delivery, cash on delivery.',
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 } },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#08070d' },
    { media: '(prefers-color-scheme: light)', color: '#f7f6fc' },
  ],
};

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  description: 'Online store for IEMs (in-ear monitors) and audio accessories in Tunisia.',
  areaServed: { '@type': 'Country', name: 'Tunisia' },
  contactPoint: { '@type': 'ContactPoint', contactType: 'customer service', availableLanguage: ['English', 'French', 'Arabic'] },
};

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  url: SITE_URL,
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/shop?search={search_term_string}` },
    'query-input': 'required name=search_term_string',
  },
};

export default async function RootLayout({ children }: LayoutProps<'/'>) {
  const [locale, user, settings] = await Promise.all([
    getLocale(),
    getSessionUser(),
    // The shell still renders if the database is unreachable.
    getSettings().catch(() => ({ brands: DEFAULT_BRANDS, deliveryPaused: false, deliveryNotice: '' })),
  ]);
  const wishlistIds = user ? await getWishlistIds(user.id).catch(() => []) : [];
  const dict = getDictionary(locale);

  return (
    <html lang={locale} data-scroll-behavior="smooth" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} ${bricolage.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema).replace(/</g, '\\u003c') }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema).replace(/</g, '\\u003c') }} />
        <Providers locale={locale} dict={dict} user={user} settings={settings} googleEnabled={googleEnabled} wishlistIds={wishlistIds}>
          <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-full focus:bg-brand-500 focus:px-4 focus:py-2 focus:text-sm focus:text-white">Skip to content</a>
          {settings.deliveryPaused && (
            <div role="status" className="flex items-center justify-center gap-2.5 border-b border-amber-500/25 bg-amber-500/10 px-4 py-2.5 text-center font-mono text-xs text-amber-600 dark:text-amber-400">
              <span className="size-1.5 shrink-0 animate-pulse rounded-full bg-current" />
              <PackageX size={14} className="shrink-0" />
              {settings.deliveryNotice || dict.ui.checkout.paused_default}
            </div>
          )}
          <Navbar />
          <main id="main" className="flex-1">{children}</main>
          <Footer />
          <Floating />
        </Providers>
      </body>
    </html>
  );
}
