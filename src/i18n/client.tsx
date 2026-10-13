'use client';
import { createContext, useCallback, useContext, type ReactNode } from 'react';
import { DEFAULT_LOCALE, LOCALE_COOKIE, localizePath, stripLocale, type Dict, type Locale } from './index';

const I18nContext = createContext<{ locale: Locale; t: Dict } | null>(null);

export function I18nProvider({ locale, dict, children }: { locale: Locale; dict: Dict; children: ReactNode }) {
  return <I18nContext.Provider value={{ locale, t: dict }}>{children}</I18nContext.Provider>;
}

function useI18n() {
  const value = useContext(I18nContext);
  if (!value) throw new Error('useT must be used inside <I18nProvider>');
  return value;
}

/** The dictionary for the active language: `const t = useT(); t.cart.title`. */
export const useT = () => useI18n().t;
export const useLocale = () => useI18n().locale;

/** `const to = useLocalePath(); router.push(to('/shop'))` — adds `/fr` on the French site. Safe outside the provider. */
export function useLocalePath() {
  const locale = useContext(I18nContext)?.locale ?? DEFAULT_LOCALE;
  return useCallback((path: string) => localizePath(path, locale), [locale]);
}

export function useSwitchLocale() {
  const { locale } = useI18n();
  return () => {
    const next: Locale = locale === 'en' ? 'fr' : 'en';
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    // The old site kept the choice in localStorage under this key; keep it in sync.
    try {
      localStorage.setItem('i18nextLng', next);
    } catch {}
    // Each language has its own URL. A full load is needed: the shared layout (nav, footer, <html lang>) changes too.
    const { pathname, search, hash } = window.location;
    window.location.assign(localizePath(`${stripLocale(pathname)}${search}${hash}`, next));
  };
}
