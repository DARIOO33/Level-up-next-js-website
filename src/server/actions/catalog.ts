'use server';

import type { Product } from '@/lib/types';
import { getProducts, getProductsByIds } from '../data';

/** The whole (small) catalogue, fetched once when the search dialog first opens. */
export async function getSearchIndex(): Promise<Product[]> {
  return getProducts().catch(() => []);
}

/** Products for the compare table / recently-viewed strip, in the order requested. */
export async function getProductsForIds(ids: string[]): Promise<Product[]> {
  if (!Array.isArray(ids)) return [];
  return getProductsByIds(ids.slice(0, 12).map(String)).catch(() => []);
}
