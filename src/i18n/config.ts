// Dependency-free locale settings, shared by the proxy, the server and the client.

export const LOCALES = ['en', 'fr'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';
export const LOCALE_COOKIE = 'lang';
/** Set by the proxy on every page request: the language the URL asks for. */
export const LOCALE_HEADER = 'x-levelup-locale';

export const isLocale = (value: unknown): value is Locale => LOCALES.includes(value as Locale);

/** English lives at the bare path, French under `/fr`. */
export const hasFrenchPrefix = (path: string) => /^\/fr(?=\/|\?|#|$)/.test(path);

/** `/fr/shop?cat=iems` → `/shop?cat=iems`; anything else is returned untouched. */
export function stripLocale(path: string): string {
  if (!hasFrenchPrefix(path)) return path;
  const rest = path.slice(3);
  return rest.startsWith('/') ? rest : `/${rest}`;
}

/** `localizePath('/shop', 'fr')` → `/fr/shop`. External URLs, anchors and API paths pass through. */
export function localizePath(path: string, locale: Locale): string {
  if (!path.startsWith('/') || path.startsWith('//') || path.startsWith('/api/')) return path;
  const bare = stripLocale(path);
  if (locale !== 'fr') return bare;
  return bare === '/' ? '/fr' : bare.startsWith('/?') || bare.startsWith('/#') ? `/fr${bare.slice(1)}` : `/fr${bare}`;
}
