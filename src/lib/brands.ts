import type { Metadata } from 'next';
import { SITE_URL } from './site';

// Brand guide content, carried over verbatim from the old /brands/* pages.

export type BrandGuide = {
  slug: string;
  name: string;
  tagline: string;
  heroGradient?: string;
  accentColor?: string;
  description: string[];
  highlights: { title: string; desc: string }[];
  topModels?: { name: string; badge?: string; desc: string; tags?: string[]; price?: number }[];
  comparison?: { headers: string[]; rows: string[][] };
  faq: { q: string; a: string }[];
};

const kzMetadata: Metadata = {
  title: { absolute: 'KZ Tunisie – KZ IEMs & In-Ear Monitors in Tunisia | Level Up TN' },
  description:
    'Buy authentic KZ IEMs in Tunisia. KZ ZEX Pro, KZ ZS10 Pro, KZ DQ6, KZ EDX Pro and more — free shipping across Tunisia in 24–48h. Shop KZ Tunisie at Level Up TN.',
  keywords: [
    'KZ Tunisia', 'KZ Tunisie', 'KZ IEM Tunisia', 'buy KZ Tunisia',
    'KZ ZS10 Pro Tunisia', 'KZ ZEX Pro Tunisia', 'KZ EDX Pro Tunisia',
    'budget IEM Tunisia', 'chi-fi IEM Tunisia', 'سماعات KZ تونس',
    'écouteurs KZ tunisie', 'in-ear monitors Tunisia', 'best IEM under 100 TND',
  ],
  openGraph: {
    title: 'KZ IEMs in Tunisia – Best In-Ear Monitors | Level Up TN',
    description:
      'Shop KZ IEMs in Tunisia. Authentic products, free delivery, best prices. KZ ZS10 Pro, ZEX Pro, EDX Pro and more.',
    url: `${SITE_URL}/brands/kz`,
    siteName: 'Level Up TN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KZ IEMs in Tunisia | Level Up TN',
    description: 'Authentic KZ IEMs with free shipping across Tunisia. Shop now at Level Up TN.',
  },
  alternates: { canonical: `${SITE_URL}/brands/kz` },
};

const kzBrand: BrandGuide = {
  slug: 'KZ',
  name: 'KZ',
  tagline: 'Knowledge Zenith — Legendary Budget IEMs Available in Tunisia',
  heroGradient: 'linear-gradient(135deg, #0a0014 0%, #120020 40%, #050508 100%)',
  accentColor: '#7c3aff',
  description: [
    'KZ (Knowledge Zenith) is one of the most popular IEM brands in the world, known for delivering exceptional sound quality at budget-friendly prices. Founded in China, KZ has become the go-to brand for audiophiles who want top-tier performance without breaking the bank.',
    'At Level Up TN, we stock a curated selection of KZ in-ear monitors available for delivery across all of Tunisia — from Tunis and Sfax to Sousse and beyond. Whether you\'re a first-time IEM buyer or an experienced audiophile, KZ has a model for you.',
    'KZ IEMs are a favorite among Tunisian music lovers, gamers, and professionals who need reliable, high-fidelity sound on a budget. All products are 100% authentic and come with full warranty support.',
  ],
  highlights: [
    {
      title: 'Exceptional Value for Money',
      desc: 'KZ IEMs consistently outperform earphones 2–3× their price, making them the best budget audiophile pick in Tunisia.',
    },
    {
      title: 'Multiple Driver Configurations',
      desc: 'From single dynamic drivers to hybrid DD+BA+EST setups — KZ covers every sound signature preference.',
    },
    {
      title: 'Detachable 2-Pin Cables',
      desc: 'Most KZ models feature a 0.75mm or 0.78mm 2-pin connector, making cable upgrades easy and affordable.',
    },
    {
      title: 'Wide Soundstage & Detail Retrieval',
      desc: 'KZ IEMs are tuned for an engaging V-shaped sound that suits gaming, pop, hip-hop, and electronic music.',
    },
    {
      title: '100% Authentic at Level Up TN',
      desc: 'We only sell verified authentic KZ products. No fakes, no clones — guaranteed.',
    },
  ],
  topModels: [
    {
      name: 'KZ ZS10 Pro X',
      badge: 'Best Seller',
      desc: 'An upgraded version of the legendary ZS10 series with improved tuning, stronger bass control, and refined highs for a more balanced sound.',
      tags: ['4BA + 1DD', 'Hybrid', 'Upgraded Tuning', 'Detachable Cable'],
      price: 149,
    },
    {
      name: 'KZ ZSN Pro 2',
      badge: 'Staff Pick',
      desc: 'A refined evolution of the ZSN line offering better clarity, improved driver balance, and a more natural sound signature for everyday listening.',
      tags: ['1DD + 1BA', 'Hybrid', 'Balanced Sound', 'Improved Version'],
      price: 125,
    },
    {
      name: 'KZ ZSN Pro X',
      badge: 'Best Value',
      desc: 'Popular hybrid IEM known for its punchy bass and energetic V-shaped sound. Great choice for casual listening and beginners.',
      tags: ['1DD + 1BA', 'V-Shaped', 'Bass Boost', 'Entry Level'],
      price: 90,
    }
  ],
  comparison: {
    headers: ['Model', 'Drivers', 'Sound Signature', 'Best For', 'Price (TND)'],
    rows: [
      ['KZ EDX Pro', '1 DD', 'Warm / Bass', 'Beginners, casual listening', '65+'],
      ['KZ ZSN Pro X', '1 DD + 1 BA', 'V-shaped', 'Pop, Hip-hop, Gaming', '90+'],
      ['KZ ZS10 Pro X', '4 BA + 1 DD', 'V-shaped / Detail', 'Music enthusiasts, gaming', '149+'],
      ['KZ ZEX Pro', '1 DD + 1 BA + 1 EST', 'Crisp / Balanced', 'Audiophiles, classical, treble lovers', ''],
      ['KZ PR2', '1 Planar', 'Flat / Analytical', 'Mixing, monitoring, detail lovers', ''],
    ],
  },
  faq: [
    {
      q: 'Are KZ IEMs good quality?',
      a: 'Yes — KZ IEMs consistently punch above their price class. Models like the ZS10 Pro and ZEX Pro are widely praised by audiophile reviewers worldwide. They offer excellent detail, wide soundstage, and good build quality for the price.',
    },
    {
      q: 'Are KZ IEMs good for gaming?',
      a: 'Absolutely. KZ\'s V-shaped tuning with emphasized bass and treble is ideal for gaming. The wide soundstage helps with positional audio, and the detail retrieval makes it easy to hear footsteps and environmental cues in games.',
    },
    {
      q: 'Are KZ IEMs good for stage / monitoring use?',
      a: 'KZ IEMs can be used on stage for monitoring, especially models with more neutral tuning like the PR2. However, for professional stage monitoring, a more neutral IEM (like Moondrop or 7Hz) may be preferred. KZ excels more for casual and enthusiast listening.',
    },
    {
      q: 'Do you ship KZ IEMs in Tunisia?',
      a: 'Yes! Level Up TN ships KZ IEMs to all cities in Tunisia including Tunis, Sfax, Sousse, Monastir, Bizerte, Gabes, and beyond. Delivery takes 24–48 hours and is completely free of charge.',
    },
    {
      q: 'Are KZ IEMs sold at Level Up TN authentic?',
      a: 'Yes, 100%. We source directly from authorized distributors. Every KZ product sold at Level Up TN is genuine and comes with the original packaging and accessories.',
    },
    {
      q: 'Which KZ IEM should I buy as a beginner in Tunisia?',
      a: 'We recommend the KZ EDX Pro as a starting point — excellent sound, comfortable fit, and very affordable. If you want to step up, the KZ ZS10 Pro is a legendary all-rounder that suits nearly every music genre.',
    },
  ],
};

const sevenHzMetadata: Metadata = {
  title: { absolute: '7Hz Tunisie – 7Hz IEMs & In-Ear Monitors in Tunisia | Level Up TN' },
  description:
    'Buy authentic 7Hz IEMs in Tunisia. 7Hz Timeless, Salnotes Dioko, Salnotes Zero — free shipping across Tunisia in 24–48h. Shop 7Hz Tunisie at Level Up TN.',
  keywords: [
    '7Hz Tunisia', '7Hz Tunisie', '7Hz IEM Tunisia', 'buy 7Hz Tunisia',
    '7Hz Timeless Tunisia', '7Hz Dioko Tunisia', '7Hz Zero Tunisia',
    'planar IEM Tunisia', 'flat diaphragm IEM Tunisia', 'سماعات 7Hz تونس',
    'écouteurs 7Hz tunisie', 'best planar IEM Tunisia', 'audiophile IEM Tunisia',
  ],
  openGraph: {
    title: '7Hz IEMs in Tunisia – Best In-Ear Monitors | Level Up TN',
    description:
      'Shop 7Hz IEMs in Tunisia. Timeless, Dioko, Zero — planar precision, free delivery, best prices.',
    url: `${SITE_URL}/brands/7hz`,
    siteName: 'Level Up TN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '7Hz IEMs in Tunisia | Level Up TN',
    description: 'Authentic 7Hz IEMs with free shipping across Tunisia. Shop now at Level Up TN.',
  },
  alternates: { canonical: `${SITE_URL}/brands/7hz` },
};

const sevenHzBrand: BrandGuide = {
  slug: '7HZ',
  name: '7Hz',
  tagline: 'Planar Precision. Audiophile Performance. Delivered Across Tunisia.',
  heroGradient: 'linear-gradient(135deg, #000d0a 0%, #001a10 40%, #050508 100%)',
  accentColor: '#00c896',
  description: [
    '7Hz is a rapidly rising Chinese audio brand that has captured the audiophile world\'s attention with their flat-diaphragm (planar) IEMs. Known for sub-bass extension, lightning-fast transients, and exceptional technical performance, 7Hz IEMs are engineered for listeners who demand the absolute best in resolution and control.',
    'The 7Hz Timeless, released in 2021, sent shockwaves through the audiophile community — delivering planar performance that rivaled IEMs at 5× the price. Since then, 7Hz has continued to innovate with the Dioko and Salnotes Zero, expanding accessibility without compromising on quality.',
    'Level Up TN is proud to offer 7Hz IEMs with free delivery across all of Tunisia. Whether you\'re a musician, audio engineer, or enthusiast, 7Hz brings planar magic to your ears at accessible prices.',
  ],
  highlights: [
    {
      title: 'Planar Magnetic Drivers',
      desc: '7Hz uses flat diaphragm planar magnetic technology for ultra-fast transient response, deep sub-bass, and microscopic detail retrieval.',
    },
    {
      title: 'Technical Excellence',
      desc: 'Planar IEMs excel at layering, separation, and imaging — letting you hear every instrument in a mix with surgical precision.',
    },
    {
      title: 'Extended Sub-Bass',
      desc: 'Unlike conventional dynamic drivers, planar drivers reach deep into the lowest frequencies without distortion, giving bass that you feel as much as hear.',
    },
    {
      title: 'Studio-Grade Accuracy',
      desc: '7Hz IEMs are favored by audio engineers and producers for mixing and mastering because of their flat, controlled frequency response.',
    },
    {
      title: 'Premium Materials',
      desc: 'CNC-machined aluminum housings and medical-grade resin shells make 7Hz IEMs both beautiful and durable.',
    },
  ],
  topModels: [
    {
      name: '7Hz x Crinacle Zero: 2',
      badge: 'Best Budget',
      desc: 'A refined collaboration IEM tuned for smooth, natural sound with improved bass response and better overall balance compared to the original Zero. Excellent entry-level audiophile choice.',
      tags: ['Single DD', 'Neutral Warm', 'Budget King', 'Crinacle Tuning'],
      price: 159,
    }
  ],
  comparison: {
    headers: ['Model', 'Driver Type', 'Sound Signature', 'Best For', 'Price (TND)'],
    rows: [
      ['7Hz Salnotes Zero', 'Dynamic Driver', 'Neutral / Balanced', 'Casual listening, neutrality lovers', ''],
      ['7Hz Salnotes Dioko', '13.2mm Planar', 'Warm-Neutral', 'Gaming, first planar, versatile use', ''],
      ['7Hz Timeless', '14.2mm Planar', 'Technical / Flat', 'Audiophiles, studio, mixing', ''],
      ['7Hz Timeless AE', '14.2mm Planar+', 'Refined / Smooth', 'Flagship listening, reference', ''],
    ],
  },
  faq: [
    {
      q: 'Are 7Hz IEMs good?',
      a: '7Hz is one of the most respected IEM brands among audiophiles worldwide. Their planar IEMs — especially the Timeless — have won numerous awards and are frequently recommended by top reviewers like Resolve, Crinacle, and DMS. For technical performance and detail retrieval, 7Hz is outstanding.',
    },
    {
      q: 'Are 7Hz IEMs good for gaming?',
      a: 'Yes, especially the Salnotes Dioko. Planar IEMs have exceptional imaging and soundstage, which translates directly to pinpoint positional accuracy in games. You\'ll hear footsteps, gunshots, and environmental cues with precision that most dynamic driver IEMs can\'t match.',
    },
    {
      q: 'Are 7Hz IEMs good for stage / monitoring use?',
      a: 'Yes — 7Hz planars are excellent for stage monitoring and studio work. Their flat frequency response and controlled sound make them ideal for audio professionals who need accurate reference playback. The Timeless in particular is used by many musicians and producers for in-ear monitoring.',
    },
    {
      q: 'Do you ship 7Hz IEMs in Tunisia?',
      a: 'Yes! Level Up TN ships 7Hz IEMs to all cities in Tunisia including Tunis, Sfax, Sousse, Monastir, Bizerte, Gabes, and more. Delivery takes 24–48 hours and shipping is completely free.',
    },
    {
      q: 'What is a planar magnetic IEM and is it better?',
      a: 'A planar magnetic IEM uses a flat, thin diaphragm with conductive traces driven by magnets on both sides. This design provides faster response, deeper sub-bass extension, and lower distortion compared to conventional dynamic drivers. For detail retrieval and technical performance, planars are generally superior — though they often require more power to drive.',
    },
    {
      q: 'Which 7Hz IEM should I start with?',
      a: 'If you\'re new to planar IEMs, start with the Salnotes Dioko — it offers planar-grade technical performance at an accessible price with a forgiving, warm tuning. If you\'re ready to go all-in, the Timeless is a world-class performer that will impress even experienced audiophiles.',
    },
  ],
};

const moondropMetadata: Metadata = {
  title: { absolute: 'Moondrop Tunisie – Moondrop IEMs & In-Ear Monitors in Tunisia | Level Up TN' },
  description:
    'Buy authentic Moondrop IEMs in Tunisia. Moondrop Aria, Starfield, Blessing 3, Variations — free shipping across Tunisia in 24–48h. Shop Moondrop Tunisie at Level Up TN.',
  keywords: [
    'Moondrop Tunisia', 'Moondrop Tunisie', 'Moondrop IEM Tunisia', 'buy Moondrop Tunisia',
    'Moondrop Aria Tunisia', 'Moondrop Starfield Tunisia', 'Moondrop Blessing Tunisia',
    'best neutral IEM Tunisia', 'audiophile IEM Tunisia', 'سماعات Moondrop تونس',
    'écouteurs Moondrop tunisie', 'Harman tuned IEM Tunisia', 'reference IEM Tunisia',
  ],
  openGraph: {
    title: 'Moondrop IEMs in Tunisia – Best In-Ear Monitors | Level Up TN',
    description:
      'Shop Moondrop IEMs in Tunisia. Aria, Starfield, Blessing 3 — free delivery, best prices, authentic products.',
    url: `${SITE_URL}/brands/moondrop`,
    siteName: 'Level Up TN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Moondrop IEMs in Tunisia | Level Up TN',
    description: 'Authentic Moondrop IEMs with free shipping across Tunisia. Shop now at Level Up TN.',
  },
  alternates: { canonical: `${SITE_URL}/brands/moondrop` },
};

const moondropBrand: BrandGuide = {
  slug: 'Moondrop',
  name: 'Moondrop',
  tagline: 'Reference-Grade Tuning. Harman Perfection. Available in Tunisia.',
  heroGradient: 'linear-gradient(135deg, #000a1a 0%, #001020 40%, #050508 100%)',
  accentColor: '#3a8fff',
  description: [
    'Moondrop is a Chinese audiophile IEM brand that has earned a devoted global following for its meticulously Harman-tuned sound signatures. Founded in 2015, Moondrop rapidly became a reference name in the audiophile community, with products praised for their technical performance and natural tonality.',
    'Moondrop IEMs are the choice of professional musicians, content creators, audio engineers, and serious music listeners in Tunisia. Their tuning philosophy focuses on reference accuracy — making instruments and vocals sound as natural and lifelike as possible.',
    'Level Up TN brings the full Moondrop lineup to Tunisian audiophiles. From the entry-level SSP to the flagship Blessing 3 and Variations, we have the right Moondrop IEM for every budget and use case — with free delivery anywhere in Tunisia.',
  ],
  highlights: [
    {
      title: 'Harman-Target Tuning',
      desc: 'Moondrop uses the scientifically validated Harman in-ear target as a tuning reference, resulting in accurate, natural-sounding IEMs loved by music purists.',
    },
    {
      title: 'Premium Build Quality',
      desc: 'From zinc alloy shells to resin bodies, Moondrop IEMs are built to last — with a premium feel that rivals IEMs costing far more.',
    },
    {
      title: 'Ideal for Mixing & Monitoring',
      desc: 'The flat, neutral frequency response of Moondrop IEMs makes them excellent tools for studio work, podcasting, and content creation.',
    },
    {
      title: 'Anime Aesthetic',
      desc: 'Moondrop pairs audiophile performance with distinctive anime-inspired artwork on packaging and accessories — a brand with real personality.',
    },
    {
      title: 'Broad Price Range',
      desc: 'Moondrop covers entry-level (SSP, Quarks), mid-range (Aria, Starfield), and flagship (Blessing 3, Variations, S8) tiers.',
    },
  ],
  topModels: [
    {
      name: 'Moondrop Aria',
      badge: 'Most Popular',
      desc: 'The benchmark mid-range IEM. The Aria features a single LCP dynamic driver with a Harman-tuned response. Smooth, detailed, and comfortable for hours of listening.',
      tags: ['Single DD', 'Harman Tuned', 'All-Day Comfort', 'Studio Ready'],
      price: 189,
    },
    {
      name: 'Moondrop Starfield',
      badge: 'Fan Favorite',
      desc: 'A beautifully crafted carbon fiber body housing a carbon nanotube dynamic driver. The Starfield offers a slightly warmer take on Moondrop\'s house sound with breathtaking aesthetics.',
      tags: ['Carbon DD', 'Warm-Neutral', 'Premium Build', 'Music & Gaming'],
      price: 229,
    },
    {
      name: 'Moondrop Blessing 3',
      badge: 'Flagship',
      desc: 'Moondrop\'s flagship tribrid IEM with 1DD + 4BA + 1 planar driver. Reference-grade clarity and extension across the entire frequency range.',
      tags: ['Tribrid', '6 Drivers', 'Reference', 'Audiophile'],
      price: 799,
    },
  ],
  comparison: {
    headers: ['Model', 'Drivers', 'Sound Signature', 'Best For', 'Price (TND)'],
    rows: [
      ['Moondrop Quarks DSP', '1 DD + DSP', 'Balanced / Neutral', 'USB-C users, beginners', '89+'],
      ['Moondrop SSP', '1 DD', 'Neutral-Bright', 'Treble lovers, detail seekers', '129+'],
      ['Moondrop Aria', '1 DD (LCP)', 'Harman Neutral', 'All-day listening, studio', '189+'],
      ['Moondrop Starfield', '1 DD (CNT)', 'Warm-Neutral', 'Music, gaming, aesthetics', '229+'],
      ['Moondrop Kato', '1 DD (Ultra)', 'Natural / Detailed', 'Serious audiophiles', '399+'],
      ['Moondrop Blessing 3', '1DD+4BA+1Planar', 'Reference', 'Flagship, studio, mastering', '799+'],
    ],
  },
  faq: [
    {
      q: 'Are Moondrop IEMs good?',
      a: 'Moondrop is widely considered one of the best IEM brands in the world. Their commitment to Harman-target tuning and premium build quality has earned them countless awards and a dedicated global fanbase. For neutral, reference-grade sound, Moondrop is the top recommendation at every price point.',
    },
    {
      q: 'Are Moondrop IEMs good for gaming?',
      a: 'Moondrop IEMs can be used for gaming, especially if you prefer accurate positional audio over bass-heavy sound. Models like the Aria provide excellent imaging and soundstage. However, if you primarily game and want more bass impact, a V-shaped IEM like KZ or 7Hz Salnotes Dioko might suit you better.',
    },
    {
      q: 'Are Moondrop IEMs good for stage / professional monitoring?',
      a: 'Yes — this is where Moondrop excels. The flat, Harman-tuned response of Moondrop IEMs makes them excellent for stage monitoring, studio recording, mixing, and mastering. Musicians and audio engineers consistently choose Moondrop for professional applications.',
    },
    {
      q: 'Do you ship Moondrop IEMs in Tunisia?',
      a: 'Absolutely. Level Up TN ships Moondrop IEMs to every city in Tunisia — Tunis, Sfax, Sousse, Monastir, Bizerte, Gabes, Gafsa, and everywhere else. Delivery takes 24–48 hours and shipping is completely free.',
    },
    {
      q: 'What is Harman tuning and why does it matter?',
      a: 'The Harman target is a scientifically researched frequency response curve that most listeners prefer for in-ear headphones. IEMs tuned to this target sound natural, balanced, and accurate across all music genres. Moondrop follows this target closely, which is why their IEMs are loved by audiophiles and professionals worldwide.',
    },
    {
      q: 'Which Moondrop IEM should I buy first?',
      a: 'For most Tunisian buyers, we recommend starting with the Moondrop Aria. It delivers reference-grade sound at a mid-range price, is extremely comfortable, and works great for music, podcasts, movies, and casual gaming. If budget allows, the Starfield is also a fantastic all-rounder with stunning looks.',
    },
  ],
};

export const BRAND_PAGES: Record<string, { metadata: Metadata; brand: BrandGuide }> = {
  'kz': { metadata: kzMetadata, brand: kzBrand },
  '7hz': { metadata: sevenHzMetadata, brand: sevenHzBrand },
  'moondrop': { metadata: moondropMetadata, brand: moondropBrand },
};
