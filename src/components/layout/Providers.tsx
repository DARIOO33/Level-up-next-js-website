'use client';
import type { ReactNode } from 'react';
import { ThemeProvider, useTheme } from 'next-themes';
import { Toaster } from 'sonner';
import { I18nProvider } from '@/i18n/client';
import type { Dict, Locale } from '@/i18n';
import type { SessionUser, Settings } from '@/lib/types';
import { AppProvider } from '../app-context';

function ThemedToaster() {
  const { resolvedTheme } = useTheme();
  return (
    <Toaster
      position="bottom-right"
      theme={resolvedTheme === 'light' ? 'light' : 'dark'}
      toastOptions={{ style: { fontFamily: 'var(--font-manrope)', borderRadius: 16 } }}
    />
  );
}

export function Providers({
  locale,
  dict,
  user,
  settings,
  googleEnabled,
  wishlistIds,
  children,
}: {
  locale: Locale;
  dict: Dict;
  user: SessionUser | null;
  settings: Settings;
  googleEnabled: boolean;
  wishlistIds: string[];
  children: ReactNode;
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
      <I18nProvider locale={locale} dict={dict}>
        {/* Keyed by user so a login/logout resets the wishlist state. */}
        <AppProvider key={user?.id ?? 'guest'} user={user} settings={settings} googleEnabled={googleEnabled} wishlistIds={wishlistIds}>
          {children}
          <ThemedToaster />
        </AppProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
