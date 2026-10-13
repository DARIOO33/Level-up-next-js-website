import { baseEn } from './base-en';
import { baseFr } from './base-fr';
import { uiEn } from './ui-en';
import { uiFr } from './ui-fr';

export const LOCALES = ['en', 'fr'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';
export const LOCALE_COOKIE = 'lang';

const en = { ...baseEn, ui: uiEn };
export type Dict = typeof en;

const fr: Dict = { ...(baseFr as typeof baseEn), ui: uiFr };

const dictionaries: Record<Locale, Dict> = { en, fr };

export const isLocale = (value: unknown): value is Locale => LOCALES.includes(value as Locale);
export const getDictionary = (locale: Locale): Dict => dictionaries[locale] ?? en;

/** `fill('Only {{count}} left', { count: 2 })` → 'Only 2 left'. */
export function fill(template: string, vars: Record<string, string | number>) {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => String(vars[key] ?? ''));
}

/** Picks the `_one` / `_other` form, then fills in the count. */
export function plural(one: string, other: string, count: number) {
  return fill(count === 1 ? one : other, { count });
}
