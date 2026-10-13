'use client';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { toggleWishlist as toggleWishlistAction } from '@/server/actions/account';
import { useT } from '@/i18n/client';
import type { SessionUser, Settings } from '@/lib/types';

type AppContextValue = {
  user: SessionUser | null;
  settings: Settings;
  googleEnabled: boolean;
  wishlist: ReadonlySet<string>;
  /** Optimistic toggle; asks guests to log in. */
  toggleWishlist: (productId: string) => Promise<void>;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({
  user,
  settings,
  googleEnabled,
  wishlistIds,
  children,
}: {
  user: SessionUser | null;
  settings: Settings;
  googleEnabled: boolean;
  wishlistIds: string[];
  children: ReactNode;
}) {
  const t = useT();
  const [wishlist, setWishlist] = useState(() => new Set(wishlistIds));

  const toggleWishlist = useCallback(
    async (productId: string) => {
      if (!user) {
        toast.error(t.ui.product.login_to_wishlist);
        return;
      }
      const flip = (set: Set<string>) => {
        const next = new Set(set);
        if (next.has(productId)) next.delete(productId);
        else next.add(productId);
        return next;
      };
      setWishlist(flip);
      const result = await toggleWishlistAction(productId);
      if (!result.ok) {
        setWishlist(flip); // roll back
        toast.error(result.message);
      }
    },
    [user, t],
  );

  const value = useMemo(() => ({ user, settings, googleEnabled, wishlist, toggleWishlist }), [user, settings, googleEnabled, wishlist, toggleWishlist]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw new Error('useApp must be used inside <AppProvider>');
  return value;
}
