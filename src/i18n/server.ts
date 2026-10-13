import { cache } from 'react';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { DEFAULT_LOCALE, LOCALE_COOKIE, LOCALE_HEADER, getDictionary, isLocale, localizePath, type Locale } from './index';

/**
 * The language of this request. Pages get it from their URL (`/fr/...` is French,
 * the proxy passes it on as a header); anything the proxy does not see, such as
 * API routes, falls back to the visitor's saved choice.
 */
export const getLocale = cache(async (): Promise<Locale> => {
  const fromUrl = (await headers()).get(LOCALE_HEADER);
  if (isLocale(fromUrl)) return fromUrl;
  const saved = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(saved) ? saved : DEFAULT_LOCALE;
});

export const getT = cache(async () => getDictionary(await getLocale()));

/**
 * Canonical + hreflang for an indexable page: each language is its own canonical
 * URL and points at the other one. `path` is the English path, e.g. `/shop?cat=iems`.
 */
export async function alternatesFor(path: string) {
  const locale = await getLocale();
  return {
    canonical: localizePath(path, locale),
    languages: { en: path, fr: localizePath(path, 'fr'), 'x-default': path },
  };
}

/** Title + description in the request's language, with the canonical/hreflang set for `path`. */
export async function localizedMetadata(path: string, copy: Record<Locale, { title: string; description: string }>) {
  const [locale, alternates] = await Promise.all([getLocale(), alternatesFor(path)]);
  return { ...copy[locale], alternates };
}

/** `redirect()` that stays in the visitor's language. */
export async function localRedirect(path: string): Promise<never> {
  redirect(localizePath(path, await getLocale()));
}
