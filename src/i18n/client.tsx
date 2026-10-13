'use client';
import { createContext, useContext, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { LOCALE_COOKIE, type Dict, type Locale } from './index';

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

export function useSwitchLocale() {
  const router = useRouter();
  const { locale } = useI18n();
  return () => {
    const next: Locale = locale === 'en' ? 'fr' : 'en';
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    // The old site kept the choice in localStorage under this key; keep it in sync.
    try {
      localStorage.setItem('i18nextLng', next);
    } catch {}
    router.refresh();
  };
}
