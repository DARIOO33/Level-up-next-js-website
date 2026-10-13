'use client';
import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, Product, Variant } from '@/lib/types';

// ── Cart ────────────────────────────────────────────────────────────────────
// Same localStorage key and item shape as the old site, so carts people already
// have in their browser carry over.
type CartState = {
  items: CartItem[];
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  addItem: (product: Pick<Product, 'id' | 'slug' | 'name' | 'images'>, variant: Variant, quantity?: number) => void;
  removeItem: (productId: string, variantId: string) => void;
  updateQty: (productId: string, variantId: string, quantity: number) => void;
  clear: () => void;
};

const same = (i: CartItem, productId: string, variantId: string) => i.productId === productId && i.variantId === variantId;

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      drawerOpen: false,
      openDrawer: () => set({ drawerOpen: true }),
      closeDrawer: () => set({ drawerOpen: false }),
      addItem: (product, variant, quantity = 1) => {
        const items = get().items;
        if (items.some((i) => same(i, product.id, variant.id))) {
          set({
            items: items.map((i) =>
              same(i, product.id, variant.id) ? { ...i, quantity: i.quantity + quantity, productSlug: product.slug || i.productSlug } : i,
            ),
          });
          return;
        }
        set({
          items: [
            ...items,
            {
              productId: product.id,
              productSlug: product.slug || null,
              variantId: variant.id,
              name: product.name,
              variantName: variant.title,
              price: variant.price,
              image: variant.image || product.images[0] || '',
              quantity,
            },
          ],
        });
      },
      removeItem: (productId, variantId) => set({ items: get().items.filter((i) => !same(i, productId, variantId)) }),
      updateQty: (productId, variantId, quantity) => {
        if (quantity < 1) return get().removeItem(productId, variantId);
        set({ items: get().items.map((i) => (same(i, productId, variantId) ? { ...i, quantity: Math.min(99, quantity) } : i)) });
      },
      clear: () => set({ items: [] }),
    }),
    { name: 'levelup-cart', partialize: (state) => ({ items: state.items }) },
  ),
);

export const cartTotal = (items: CartItem[]) => items.reduce((sum, i) => sum + i.price * i.quantity, 0);
export const cartCount = (items: CartItem[]) => items.reduce((sum, i) => sum + i.quantity, 0);

// ── Compare (up to 3 products) ──────────────────────────────────────────────
type CompareState = { ids: string[]; toggle: (id: string) => 'added' | 'removed' | 'full'; remove: (id: string) => void; clear: () => void };

export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle: (id) => {
        const ids = get().ids;
        if (ids.includes(id)) {
          set({ ids: ids.filter((x) => x !== id) });
          return 'removed';
        }
        if (ids.length >= 3) return 'full';
        set({ ids: [...ids, id] });
        return 'added';
      },
      remove: (id) => set({ ids: get().ids.filter((x) => x !== id) }),
      clear: () => set({ ids: [] }),
    }),
    { name: 'levelup-compare' },
  ),
);

// ── Recently viewed ─────────────────────────────────────────────────────────
type RecentState = { ids: string[]; push: (id: string) => void };

export const useRecentStore = create<RecentState>()(
  persist(
    (set, get) => ({
      ids: [],
      push: (id) => set({ ids: [id, ...get().ids.filter((x) => x !== id)].slice(0, 8) }),
    }),
    { name: 'levelup-recent' },
  ),
);

/** Persisted stores are only known after mount; render placeholders until then to keep hydration clean. */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
