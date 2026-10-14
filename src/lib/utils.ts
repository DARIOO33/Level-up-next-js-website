import { clsx, type ClassValue } from 'clsx';
import type { Product } from './types';

export const cn = (...inputs: ClassValue[]) => clsx(inputs);

/** Prices are stored in TND with up to 3 decimals (millimes); trailing zeros are dropped. */
export function formatPrice(value: number) {
  const rounded = Math.round((value + Number.EPSILON) * 1000) / 1000;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
}

/**
 * Dates are always shown in the shop's time zone. Without a fixed zone the server
 * (usually UTC) and the visitor's browser format the same instant differently,
 * which breaks hydration on every page that shows a date.
 */
const TIME_ZONE = 'Africa/Tunis';

export function formatDate(iso: string | null | undefined, locale = 'en-GB') {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric', timeZone: TIME_ZONE });
}

export function formatDateTime(iso: string | null | undefined, locale = 'en-GB') {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(locale, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: TIME_ZONE });
}

/** The Tunis calendar day of a moment, as `YYYY-MM-DD` (sortable as a string). */
export const tunisDay = (date: string | Date = new Date()) => new Date(date).toLocaleDateString('en-CA', { timeZone: TIME_ZONE });

/** URL segment for a product page (slug preferred; legacy Mongo id fallback). */
export const productPath = (p: Pick<Product, 'slug' | 'id'>) => `/product/${p.slug || p.id}`;

export const minPrice = (p: Pick<Product, 'variants'>) => (p.variants.length ? Math.min(...p.variants.map((v) => v.price)) : 0);
export const maxPrice = (p: Pick<Product, 'variants'>) => (p.variants.length ? Math.max(...p.variants.map((v) => v.price)) : 0);
export const totalStock = (p: Pick<Product, 'variants'>) => p.variants.reduce((sum, v) => sum + v.stock, 0);
export const inStock = (p: Pick<Product, 'variants'>) => p.variants.some((v) => v.stock > 0);

export const shortId = (id: string) => id.slice(0, 8).toUpperCase();

/** URL-safe slug from a product name. */
export function slugify(value: string) {
  const s = value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return s || 'product';
}

export const isObjectId = (value: string) => /^[a-f0-9]{24}$/i.test(value);

/** Cloudinary can resize on the fly; other hosts are returned untouched. */
export function img(url: string | null | undefined, width = 800) {
  if (!url) return '';
  if (url.includes('res.cloudinary.com') && url.includes('/upload/') && !url.includes('/upload/f_auto')) {
    return url.replace('/upload/', `/upload/f_auto,q_auto,w_${width}/`);
  }
  return url;
}

export const EMAIL_RE = /^\S+@\S+\.\S+$/;
/** Same rule the old order schema enforced. */
export const PHONE_RE = /^\+?[0-9]{8,15}$/;
/** Tunisian mobile/landline in international form — what the checkout form asks for. */
export const TN_PHONE_RE = /^\+216[234579]\d{7}$/;
