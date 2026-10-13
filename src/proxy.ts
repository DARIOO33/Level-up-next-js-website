import { NextResponse, type NextRequest } from 'next/server';
import { LOCALE_COOKIE, LOCALE_HEADER, hasFrenchPrefix, stripLocale } from '@/i18n/config';

const YEAR = 60 * 60 * 24 * 365;

/**
 * Language routing. English is served at the bare path and French under `/fr`,
 * so search engines can index both. `/fr/shop` renders the same `/shop` route:
 * the prefix is stripped here and handed to the app as a request header.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const saved = request.cookies.get(LOCALE_COOKIE)?.value;
  const requestHeaders = new Headers(request.headers);

  if (hasFrenchPrefix(pathname)) {
    requestHeaders.set(LOCALE_HEADER, 'fr');
    const url = request.nextUrl.clone();
    url.pathname = stripLocale(pathname);
    const response = NextResponse.rewrite(url, { request: { headers: requestHeaders } });
    if (saved !== 'fr') response.cookies.set(LOCALE_COOKIE, 'fr', { path: '/', maxAge: YEAR, sameSite: 'lax' });
    return response;
  }

  // A visitor who chose French keeps it on links that carry no prefix (emails, redirects, old bookmarks).
  // Crawlers send no cookie, so the bare URL always stays the English page for them.
  if (saved === 'fr' && (request.method === 'GET' || request.method === 'HEAD')) {
    const url = request.nextUrl.clone();
    url.pathname = pathname === '/' ? '/fr' : `/fr${pathname}`;
    return NextResponse.redirect(url);
  }

  requestHeaders.set(LOCALE_HEADER, 'en');
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  // Pages only: no API routes, Next internals, generated images or static files.
  matcher: ['/((?!api/|_next/|opengraph-image|.*\\.(?:png|jpe?g|gif|svg|ico|webp|avif|txt|xml|json|js|css|map|woff2?)$).*)'],
};
