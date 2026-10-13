import { cache } from 'react';
import { ObjectId } from 'mongodb';
import { MongoFieldFilter } from '@prisma/orm-mongo/query-ast/execution';
import { db } from '@/lib/db';
import { isObjectId } from '@/lib/utils';
import type {
  Activity,
  Address,
  ContactMessage,
  Coupon,
  Notification,
  Order,
  OrderStatus,
  Product,
  Review,
  Settings,
} from '@/lib/types';

/**
 * Read side of the data layer: Prisma rows in, plain serialisable objects out.
 *
 * Two things the mappers normalise:
 *  - `_id` → `id`, at the top level and inside embedded documents.
 *  - fields old documents may simply not have (Mongoose defaults were applied
 *    in memory, not written), so every optional value gets its old default.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = Record<string, any>;

const iso = (value: unknown) => (value ? new Date(value as string | Date).toISOString() : null);
const id = (value: unknown) => (value == null ? '' : String(value));
const idOrNull = (value: unknown) => (value == null ? null : String(value));

/** ObjectId for the few raw-driver calls. */
export const oid = (value: string) => new ObjectId(value);
/** Fresh id for an embedded document (variants, addresses, order lines…) — stored as a real ObjectId, like Mongoose did. */
export const newId = (existing?: string) => (existing && isObjectId(existing) ? existing : new ObjectId().toHexString());

export const DEFAULT_BRANDS = [
  'KZ', '7HZ', 'Moondrop', 'Simgot', 'Truthear', 'LETSHUOER',
  'TinHiFi', 'Kinera', 'FiiO', 'Shanling', 'HIDIZS', 'Tangzu',
  'BLON', 'Kiwi Ears', 'CCA', 'Tripowin', 'Nicehck',
];

// ── Mappers ─────────────────────────────────────────────────────────────────

export function toProduct(row: Row): Product {
  const specs: Record<string, string> = {};
  if (row.specifications && typeof row.specifications === 'object') {
    for (const [key, value] of Object.entries(row.specifications)) specs[key] = String(value ?? '');
  }
  return {
    id: id(row._id),
    slug: row.slug || null,
    name: row.name ?? '',
    description: row.description ?? '',
    featured: row.featured === true,
    category: row.category ?? 'iems',
    subCategory: row.subCategory || null,
    images: Array.isArray(row.images) ? row.images.filter(Boolean) : [],
    variants: (row.variants ?? []).map((v: Row) => ({
      id: id(v._id),
      title: v.title ?? '',
      price: Number(v.price ?? 0),
      stock: Number(v.stock ?? 0),
      image: v.image ?? '',
    })),
    specifications: specs,
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  };
}

export function toOrder(row: Row): Order {
  return {
    id: id(row._id),
    customer: {
      fullname: row.customer?.fullname ?? '',
      email: row.customer?.email ?? '',
      phone: row.customer?.phone ?? '',
      address: row.customer?.address ?? '',
    },
    items: (row.items ?? []).map((item: Row) => ({
      id: id(item._id),
      product: id(item.product),
      variantID: id(item.variantID),
      quantity: Number(item.quantity ?? 1),
      productName: item.productName ?? '',
      variantName: item.variantName ?? '',
      variantImage: item.variantImage ?? null,
    })),
    totalAmount: Number(row.totalAmount ?? 0),
    couponCode: row.couponCode ?? null,
    status: (row.status ?? 'pending') as OrderStatus,
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  };
}

export function toReview(row: Row): Review {
  return {
    id: id(row._id),
    name: row.name ?? null,
    showName: row.showName !== false,
    rating: row.rating == null ? null : Number(row.rating),
    comment: row.comment ?? null,
    source: row.source ?? 'website',
    productName: row.productName ?? null,
    productId: idOrNull(row.productId),
    orderId: idOrNull(row.orderId),
    token: row.token ?? null,
    isApproved: row.isApproved === true,
    createdAt: iso(row.createdAt),
  };
}

export function toCoupon(row: Row): Coupon {
  return {
    id: id(row._id),
    code: row.code ?? '',
    type: row.type === 'fixed' ? 'fixed' : 'percent',
    value: Number(row.value ?? 0),
    minOrderAmount: Number(row.minOrderAmount ?? 0),
    maxUses: row.maxUses == null ? null : Number(row.maxUses),
    usedCount: Number(row.usedCount ?? 0),
    expiresAt: iso(row.expiresAt),
    isActive: row.isActive !== false,
    createdAt: iso(row.createdAt),
  };
}

export const toActivity = (row: Row): Activity => ({
  id: id(row._id),
  user: row.user ?? '',
  label: row.label ?? '',
  content: row.content ?? '',
  createdAt: iso(row.createdAt),
});

export const toMessage = (row: Row): ContactMessage => ({
  id: id(row._id),
  name: row.name ?? '',
  email: row.email ?? '',
  message: row.message ?? '',
  isRead: row.isRead === true,
  createdAt: iso(row.createdAt),
});

export const toAddress = (row: Row): Address => ({
  id: id(row._id),
  label: row.label || 'Home',
  fullname: row.fullname ?? '',
  phone: row.phone ?? '',
  address: row.address ?? '',
  governorate: row.governorate ?? '',
  city: row.city ?? '',
  postalCode: row.postalCode ?? '',
  isDefault: row.isDefault === true,
});

export const toNotification = (row: Row): Notification => ({
  id: id(row._id),
  title: row.title ?? '',
  message: row.message ?? '',
  type: row.type ?? 'info',
  isRead: row.isRead === true,
  link: row.link ?? null,
  createdAt: iso(row.createdAt),
});

const byNewest = <T extends { createdAt: string | null }>(a: T, b: T) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '');

// ── Products ────────────────────────────────────────────────────────────────

/** All products, newest first. The catalogue is small, so pages filter in memory (as the old site did). */
export const getProducts = cache(async (): Promise<Product[]> => {
  const rows = await db.orm.products.all();
  return rows.map(toProduct).sort(byNewest);
});

/** Raw product row by slug, falling back to a Mongo id — the same lookup order the old API used. */
export async function findProductRow(param: string): Promise<Row | null> {
  let key = String(param ?? '').trim();
  if (!key) return null;
  try {
    key = decodeURIComponent(key);
  } catch {
    /* keep the raw value */
  }
  const bySlug = await db.orm.products.where({ slug: key.toLowerCase() }).first();
  if (bySlug) return bySlug;
  if (isObjectId(key)) return db.orm.products.where({ _id: key.toLowerCase() }).first();
  return null;
}

export const getProduct = cache(async (param: string): Promise<Product | null> => {
  const row = await findProductRow(param);
  return row ? toProduct(row) : null;
});

export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  const valid = [...new Set(ids.filter(isObjectId))];
  if (!valid.length) return [];
  const rows = await db.orm.products.where(MongoFieldFilter.in('_id', valid)).all();
  const map = new Map(rows.map((r) => [id(r._id), toProduct(r)]));
  return valid.map((v) => map.get(v)).filter((p): p is Product => Boolean(p));
}

// ── Settings ────────────────────────────────────────────────────────────────

export const getSettings = cache(async (): Promise<Settings> => {
  const row = await db.orm.sitesettings.first();
  return {
    brands: row?.brands?.length ? [...row.brands] : DEFAULT_BRANDS,
    deliveryPaused: row?.deliveryPaused === true,
    deliveryNotice: row?.deliveryNotice ?? '',
  };
});

// ── Reviews ─────────────────────────────────────────────────────────────────

export const getApprovedReviews = cache(async (): Promise<Review[]> => {
  const rows = await db.orm.storereviews.where({ isApproved: true }).all();
  return rows.map(toReview).sort(byNewest);
});

export async function getProductReviews(productId: string) {
  if (!isObjectId(productId)) return { reviews: [] as Review[], count: 0, avg: null as number | null };
  const rows = await db.orm.storereviews.where({ productId, isApproved: true }).all();
  const reviews = rows
    .map(toReview)
    .filter((r) => r.rating != null && r.comment != null)
    .sort(byNewest);
  const count = reviews.length;
  const avg = count ? Math.round((reviews.reduce((sum, r) => sum + (r.rating ?? 0), 0) / count) * 10) / 10 : null;
  return { reviews, count, avg };
}

export async function getAllReviews(): Promise<Review[]> {
  return (await db.orm.storereviews.all()).map(toReview).sort(byNewest);
}

// ── Orders ──────────────────────────────────────────────────────────────────

export async function getOrder(orderId: string): Promise<Order | null> {
  if (!isObjectId(orderId)) return null;
  const row = await db.orm.orders.where({ _id: orderId }).first();
  return row ? toOrder(row) : null;
}

export async function getAllOrders(): Promise<Order[]> {
  return (await db.orm.orders.all()).map(toOrder).sort(byNewest);
}

/**
 * A customer's orders: the ones linked on their user document plus any placed
 * as a guest with the same email (those get linked on the way, like before).
 */
export async function getOrdersForUser(userId: string): Promise<Order[]> {
  const user = await getUserRow(userId);
  if (!user) return [];
  const linkedIds: string[] = (user.orders ?? []).map(id);
  const [linked, byEmail] = await Promise.all([
    linkedIds.length ? db.orm.orders.where(MongoFieldFilter.in('_id', linkedIds)).all() : Promise.resolve([]),
    db.orm.orders.where(MongoFieldFilter.eq('customer.email', user.email)).all(),
  ]);

  const unlinked = byEmail.filter((o) => !linkedIds.includes(id(o._id)));
  if (unlinked.length) {
    await db.orm.users
      .where({ _id: userId })
      .update((u) => unlinked.map((o) => u.orders.addToSet(id(o._id))));
  }

  const seen = new Set<string>();
  return [...linked, ...byEmail]
    .map(toOrder)
    .filter((o) => (seen.has(o.id) ? false : (seen.add(o.id), true)))
    .sort(byNewest);
}

// ── Users ───────────────────────────────────────────────────────────────────

export async function getUserRow(userId: string): Promise<Row | null> {
  if (!isObjectId(userId)) return null;
  return db.orm.users.where({ _id: userId }).first();
}

export async function getUserByEmail(email: string): Promise<Row | null> {
  const value = email.trim();
  return (
    (await db.orm.users.where({ email: value }).first()) ??
    (value !== value.toLowerCase() ? await db.orm.users.where({ email: value.toLowerCase() }).first() : null)
  );
}

export async function getAddresses(userId: string): Promise<Address[]> {
  const user = await getUserRow(userId);
  return (user?.shippingAddresses ?? []).map(toAddress);
}

export async function getWishlistIds(userId: string): Promise<string[]> {
  const user = await getUserRow(userId);
  return (user?.wishlist ?? []).map(id);
}

/** Admins and owners receive the store notification emails. */
export async function getAdminEmails(): Promise<{ name: string; email: string }[]> {
  const rows = await db.orm.users.where(MongoFieldFilter.in('role', ['admin', 'owner'])).all();
  return rows.map((r) => ({ name: r.name, email: r.email }));
}

// ── Admin lists ─────────────────────────────────────────────────────────────

export async function getCoupons(): Promise<Coupon[]> {
  return (await db.orm.coupons.all()).map(toCoupon).sort(byNewest);
}

export async function getActivity(): Promise<Activity[]> {
  const rows = await db.orm.activities.orderBy({ createdAt: -1 }).limit(100).all();
  return rows.map(toActivity);
}

export async function getMessages(): Promise<ContactMessage[]> {
  return (await db.orm.contactmessages.all()).map(toMessage).sort(byNewest);
}

export async function logActivity(user: string, label: 'Admin Action' | 'User Action', content: string) {
  await db.orm.activities.create({ user: user || 'Unknown', label, content }).catch(() => {});
}
