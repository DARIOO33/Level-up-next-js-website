import { cache } from 'react';
import { cookies } from 'next/headers';
import { DEFAULT_LOCALE, LOCALE_COOKIE, getDictionary, isLocale, type Locale } from './index';

/** The language is a cookie, so server components render in the right language on the first paint (no flash). */
export const getLocale = cache(async (): Promise<Locale> => {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
});

export const getT = cache(async () => getDictionary(await getLocale()));
