export const GOVERNORATES = [
  'Tunis', 'Ariana', 'Ben Arous', 'Mannouba', 'Nabeul', 'Zaghouan', 'Bizerte', 'Beja',
  'Jendouba', 'Kef', 'Siliana', 'Sousse', 'Monastir', 'Mahdia', 'Sfax', 'Kairouan',
  'Kasserine', 'Sidi Bouzid', 'Gabes', 'Medenine', 'Tataouine', 'Gafsa', 'Tozeur', 'Kebili',
] as const;

export const CATEGORIES = ['iems', 'accessories'] as const;
export const CATEGORY_LABELS: Record<string, string> = { iems: 'IEMs', accessories: 'Accessories' };

export const ACCESSORY_SUBS = ['cables', 'ear-tips', 'bags', 'cleaning', 'dac', 'other'] as const;
export type AccessorySub = (typeof ACCESSORY_SUBS)[number];

/** Short positioning line for the brands in the mega menu. */
export const BRAND_NOTES: Record<string, string> = {
  KZ: 'Budget kings',
  '7HZ': 'Value flagships',
  Moondrop: 'Audiophile reference',
  Simgot: 'Hybrid drivers',
  Truthear: 'Creator collab',
  LETSHUOER: 'Planar & EST',
  TinHiFi: 'Warm & smooth',
};

/** Brands that have a dedicated guide page. */
export const BRAND_GUIDES = [
  { slug: 'kz', name: 'KZ' },
  { slug: '7hz', name: '7Hz' },
  { slug: 'moondrop', name: 'Moondrop' },
];

/** Social links are optional: set the NEXT_PUBLIC_*_URL variables and they appear in the footer. */
export const SOCIALS = [
  { label: 'Instagram', href: process.env.NEXT_PUBLIC_INSTAGRAM_URL },
  { label: 'Facebook', href: process.env.NEXT_PUBLIC_FACEBOOK_URL },
  { label: 'TikTok', href: process.env.NEXT_PUBLIC_TIKTOK_URL },
].filter((s): s is { label: string; href: string } => Boolean(s.href));
