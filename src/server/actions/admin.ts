'use server';

import { after } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db, mongoDb } from '@/lib/db';
import { sendMarketingEmail, sendOrderStatusEmail, sendRestockEmail, sendReviewRequestEmail } from '@/lib/email';
import { SITE_URL } from '@/lib/site';
import { ORDER_STATUSES, type ActionResult, type Audience, type Coupon, type Order, type OrderStatus, type Product, type Review, type Role, type Settings } from '@/lib/types';
import { isObjectId, slugify } from '@/lib/utils';
import {
  DEFAULT_BRANDS,
  findProductRow,
  getOrder,
  getSettings,
  getUserByEmail,
  getUserRow,
  logActivity,
  newId,
  oid,
  toCoupon,
  toOrder,
  toProduct,
  toReview,
} from '../data';
import { createReviewTokens } from '../reviews';
import { fail, ok, requireAdmin, run } from '../session';

/* eslint-disable @typescript-eslint/no-explicit-any */
const refresh = () => revalidatePath('/', 'layout');

// ── Products ────────────────────────────────────────────────────────────────

const productSchema = z.object({
  name: z.string().trim().min(1, 'Name and category are required').max(160),
  slug: z.string().trim().max(120).optional(),
  description: z.string().trim().max(5000).optional(),
  featured: z.boolean().optional(),
  category: z.enum(['iems', 'accessories']),
  subCategory: z.string().trim().max(60).optional(),
  images: z.array(z.string().trim().min(1)).min(1, 'At least one image is required').max(20),
  variants: z
    .array(
      z.object({
        id: z.string().optional(),
        title: z.string().trim().min(1, 'Each variant must have title, price, stock, and image'),
        price: z.number().min(0, 'Price and stock cannot be negative'),
        stock: z.number().int().min(0, 'Price and stock cannot be negative'),
        image: z.string().trim().min(1, 'Each variant must have title, price, stock, and image'),
      }),
    )
    .min(1, 'At least one variant is required')
    .max(40),
  specifications: z.record(z.string(), z.string()).optional(),
});
export type ProductInput = z.input<typeof productSchema>;

/** Slugs stay manual (never auto-generated); a clash gets a numeric suffix. */
async function uniqueSlug(raw: string, excludeId?: string) {
  const base = slugify(raw.replace(/\s+/g, '-'));
  let slug = base;
  for (let n = 2; ; n++) {
    const existing = await db.orm.products.where({ slug }).first();
    if (!existing || String(existing._id) === excludeId) return slug;
    slug = `${base}-${n}`;
  }
}

/** Mongo forbids dots and leading `$` in keys — specs are stored as a plain sub-document, as before. */
const cleanSpecs = (specs?: Record<string, string>) =>
  Object.fromEntries(
    Object.entries(specs ?? {})
      .map(([k, v]) => [k.trim().replace(/\./g, '․').replace(/^\$+/, ''), String(v).trim()] as const)
      .filter(([k]) => k),
  );

export async function createProduct(input: ProductInput): Promise<ActionResult<Product>> {
  return run(async () => {
    const admin = await requireAdmin();
    const parsed = productSchema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Invalid product');
    const data = parsed.data;
    const slug = data.slug ? await uniqueSlug(data.slug) : null;

    const row = await db.orm.products.create({
      name: data.name,
      description: data.description ?? '',
      featured: data.featured ?? false,
      category: data.category,
      subCategory: data.subCategory || null,
      images: data.images,
      variants: data.variants.map((v) => ({ _id: newId(), title: v.title, price: v.price, stock: v.stock, image: v.image })),
      specifications: cleanSpecs(data.specifications),
      stockWatchers: [],
      // `slug` has a unique sparse index: leave the field out entirely when there is none.
      ...(slug ? { slug } : {}),
    } as any);
    await logActivity(admin.name, 'Admin Action', `Added new product: "${data.name}"`);
    refresh();
    return ok(toProduct(row));
  });
}

export async function updateProduct(param: string, input: ProductInput, notifyWatchers = false): Promise<ActionResult<Product>> {
  return run(async () => {
    const admin = await requireAdmin();
    const parsed = productSchema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Invalid update fields');
    const data = parsed.data;
    const current = await findProductRow(param);
    if (!current) return fail('Product not found');
    const productId = String(current._id);

    // Snapshot stock before the change so we know which variants came back.
    const oldById = new Map<string, number>();
    const oldByTitle = new Map<string, { id: string; stock: number }>();
    for (const v of current.variants ?? []) {
      oldById.set(String(v._id), Number(v.stock));
      oldByTitle.set(String(v.title).trim().toLowerCase(), { id: String(v._id), stock: Number(v.stock) });
    }

    // Variants keep their id when the admin edits them, so carts and orders keep pointing at the right one.
    const variants = data.variants.map((v) => ({
      id: v.id && isObjectId(v.id) && oldById.has(v.id) ? v.id : newId(),
      title: v.title,
      price: v.price,
      stock: v.stock,
      image: v.image,
    }));

    const slug = data.slug ? await uniqueSlug(data.slug, productId) : null;
    const updated = await db.orm.products.where({ _id: productId }).update({
      name: data.name,
      description: data.description ?? '',
      featured: data.featured ?? false,
      category: data.category,
      subCategory: data.subCategory || null,
      images: data.images,
      variants: variants.map((v) => ({ _id: newId(v.id), title: v.title, price: v.price, stock: v.stock, image: v.image })),
      specifications: cleanSpecs(data.specifications),
      ...(slug ? { slug } : {}),
    });
    if (!updated) return fail('Product not found');

    // Restock emails, only when the admin opted in. Customers watch the product as a whole,
    // so everyone waiting hears about any variant that went from 0 back to being available.
    const restocked = variants.filter((v) => {
      if (v.stock <= 0) return false;
      const oldStock = oldById.has(v.id) ? oldById.get(v.id) : oldByTitle.get(v.title.trim().toLowerCase())?.stock;
      return oldStock === 0;
    });

    const watcherIds = watcherUserIds(current);
    if (notifyWatchers && restocked.length && watcherIds.length) {
      for (const userId of watcherIds) {
        const user = await getUserRow(userId);
        if (!user) continue;
        await sendRestockEmail({
          to: user.email,
          name: user.name,
          productName: data.name,
          variantTitle: restocked.map((v) => v.title).join(' · '),
          productPath: updated.slug || productId,
        });
      }
      await db.orm.products.where({ _id: productId }).update({ stockWatchers: [] });
    }

    await logActivity(admin.name, 'Admin Action', `Updated product: "${data.name}"${notifyWatchers ? ' — watchers notified' : ''}`);
    refresh();
    return ok(toProduct(updated));
  });
}

export async function deleteProduct(param: string): Promise<ActionResult> {
  return run(async () => {
    const admin = await requireAdmin();
    const product = await findProductRow(param);
    if (!product) return fail('Product not found');
    await db.orm.products.where({ _id: String(product._id) }).delete();
    await logActivity(admin.name, 'Admin Action', `Deleted product: "${product.name}"`);
    refresh();
    return ok(undefined, 'Product deleted successfully');
  });
}

/** One entry per customer, whatever variant an older record may still mention. */
const watcherUserIds = (product: any): string[] => [...new Set<string>((product.stockWatchers ?? []).map((w: any) => String(w.userId)))];

export type WatcherSummary = { totalWatchers: number; outOfStockVariantIds: string[] };

/** How many customers wait for this product, and which variants are out of stock. Counts only — no personal data. */
export async function getWatchersSummary(param: string): Promise<ActionResult<WatcherSummary>> {
  return run(async () => {
    await requireAdmin();
    const product = await findProductRow(param);
    if (!product) return fail('Product not found');
    return ok({
      totalWatchers: watcherUserIds(product).length,
      outOfStockVariantIds: (product.variants ?? []).filter((v: any) => Number(v.stock) === 0).map((v: any) => String(v._id)),
    });
  });
}

// ── Orders ──────────────────────────────────────────────────────────────────

/**
 * Status change, optional customer email, and the review-request flow:
 *   shipped   → review tokens are created (guests get the links by email)
 *   delivered → registered customers are pointed at /orders, guests get links again
 */
export async function updateOrderStatus(orderId: string, newStatus: OrderStatus, notifyClient: boolean): Promise<ActionResult<Order>> {
  return run(async () => {
    const admin = await requireAdmin();
    if (!ORDER_STATUSES.includes(newStatus)) return fail(`Status must be one of: ${ORDER_STATUSES.join(', ')}`);
    const before = await getOrder(orderId);
    if (!before) return fail('Order not found');
    const oldStatus = before.status;

    const row = await db.orm.orders.where({ _id: orderId }).update({ status: newStatus });
    if (!row) return fail('Order not found');
    const order = toOrder(row);

    const becameShipped = newStatus === 'shipped' && oldStatus !== 'shipped';
    const becameDelivered = newStatus === 'delivered' && oldStatus !== 'delivered';
    const reviewEmails: { productName: string; reviewUrl: string; isLoggedIn: boolean }[] = [];

    if (becameShipped || becameDelivered) {
      try {
        const registered = await getUserByEmail(order.customer.email);
        if (registered) {
          const existing = await mongoDb.collection('storereviews').countDocuments({ orderId: oid(order.id) });
          if (becameShipped || existing === 0) await createReviewTokens(order);
          if (becameDelivered) {
            reviewEmails.push({ productName: order.items.map((i) => i.productName).join(', '), reviewUrl: `${SITE_URL}/orders`, isLoggedIn: true });
          }
        } else {
          const tokens = await createReviewTokens(order);
          for (const { productName, token } of tokens) {
            reviewEmails.push({ productName, reviewUrl: `${SITE_URL}/review/${token}`, isLoggedIn: false });
          }
        }
      } catch (error) {
        console.error('[REVIEW REQUEST] Failed:', (error as Error).message);
      }
    }

    // Status email first, review requests after it — all once the response is sent.
    after(async () => {
      if (notifyClient) {
        await sendOrderStatusEmail({ to: order.customer.email, name: order.customer.fullname, order, oldStatus });
      }
      for (const email of reviewEmails) {
        await sendReviewRequestEmail({ to: order.customer.email, name: order.customer.fullname, ...email });
      }
    });

    await logActivity(
      admin.name,
      'Admin Action',
      `Order #${order.id.slice(0, 8)} status: [${oldStatus}] → [${order.status}]${notifyClient ? ' — client notified' : ''}`,
    );
    refresh();
    return ok(order);
  });
}

// ── Reviews ─────────────────────────────────────────────────────────────────

const REVIEW_SOURCES = ['website', 'instagram', 'tiktok', 'facebook', 'manual'];

export async function createReview(input: { name?: string; rating: number; comment: string; source?: string; productName?: string; showName?: boolean }): Promise<ActionResult<Review>> {
  return run(async () => {
    await requireAdmin();
    const rating = Number(input?.rating);
    const comment = String(input?.comment ?? '').trim();
    if (!rating || rating < 1 || rating > 5) return fail('Rating must be between 1 and 5');
    if (!comment) return fail('Comment is required');
    const row = await db.orm.storereviews.create({
      name: String(input.name ?? '').trim().slice(0, 60) || 'Anonymous',
      showName: input.showName !== false,
      rating,
      comment: comment.slice(0, 500),
      source: REVIEW_SOURCES.includes(input.source ?? '') ? input.source! : 'manual',
      productName: String(input.productName ?? '').trim() || null,
      productId: null,
      orderId: null,
      isApproved: true,
      token: null,
    });
    refresh();
    return ok(toReview(row));
  });
}

export async function setReviewApproved(reviewId: string, isApproved: boolean): Promise<ActionResult<Review>> {
  return run(async () => {
    await requireAdmin();
    if (!isObjectId(reviewId)) return fail('Review not found');
    const row = await db.orm.storereviews.where({ _id: reviewId }).update({ isApproved });
    if (!row) return fail('Review not found');
    refresh();
    return ok(toReview(row));
  });
}

export async function deleteReview(reviewId: string): Promise<ActionResult> {
  return run(async () => {
    await requireAdmin();
    if (!isObjectId(reviewId)) return fail('Review not found');
    await db.orm.storereviews.where({ _id: reviewId }).delete();
    refresh();
    return ok(undefined, 'Review deleted');
  });
}

// ── Coupons ─────────────────────────────────────────────────────────────────

export async function createCoupon(input: { code: string; type: 'percent' | 'fixed'; value: number; minOrderAmount?: number; maxUses?: number | null; expiresAt?: string | null }): Promise<ActionResult<Coupon>> {
  return run(async () => {
    await requireAdmin();
    const code = String(input?.code ?? '').trim().toUpperCase();
    const value = Number(input?.value);
    if (!code || !value || value < 0) return fail('Code and value are required');
    if (input.type === 'percent' && value > 100) return fail('A percent coupon cannot exceed 100');
    if (await db.orm.coupons.where({ code }).first()) return fail('code is already in use');
    const row = await db.orm.coupons.create({
      code,
      type: input.type === 'fixed' ? 'fixed' : 'percent',
      value,
      minOrderAmount: Math.max(0, Number(input.minOrderAmount) || 0),
      maxUses: input.maxUses ? Math.max(1, Math.floor(Number(input.maxUses))) : null,
      usedCount: 0,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      isActive: true,
    });
    refresh();
    return ok(toCoupon(row));
  });
}

export async function setCouponActive(couponId: string, isActive: boolean): Promise<ActionResult<Coupon>> {
  return run(async () => {
    await requireAdmin();
    if (!isObjectId(couponId)) return fail('Coupon not found');
    const row = await db.orm.coupons.where({ _id: couponId }).update({ isActive });
    if (!row) return fail('Coupon not found');
    refresh();
    return ok(toCoupon(row));
  });
}

export async function deleteCoupon(couponId: string): Promise<ActionResult> {
  return run(async () => {
    await requireAdmin();
    if (!isObjectId(couponId)) return fail('Coupon not found');
    await db.orm.coupons.where({ _id: couponId }).delete();
    refresh();
    return ok(undefined, 'Coupon deleted');
  });
}

// ── Contact messages ────────────────────────────────────────────────────────

export async function markMessageRead(messageId: string): Promise<ActionResult> {
  return run(async () => {
    await requireAdmin();
    if (!isObjectId(messageId)) return fail('Message not found');
    await db.orm.contactmessages.where({ _id: messageId }).update({ isRead: true });
    refresh();
    return ok();
  });
}

export async function deleteMessage(messageId: string): Promise<ActionResult> {
  return run(async () => {
    await requireAdmin();
    if (!isObjectId(messageId)) return fail('Message not found');
    await db.orm.contactmessages.where({ _id: messageId }).delete();
    refresh();
    return ok(undefined, 'Deleted');
  });
}

// ── Site settings ───────────────────────────────────────────────────────────

export async function updateSettings(input: Partial<Settings>): Promise<ActionResult<Settings>> {
  return run(async () => {
    await requireAdmin();
    const { brands, deliveryPaused, deliveryNotice } = input ?? {};
    if (brands !== undefined) {
      if (!Array.isArray(brands)) return fail('brands must be an array');
      if (brands.length > 100) return fail('Too many brands');
      if (brands.some((b) => typeof b !== 'string' || !b.trim())) return fail('All brands must be non-empty strings');
    }
    if (deliveryPaused !== undefined && typeof deliveryPaused !== 'boolean') return fail('deliveryPaused must be a boolean');
    if (deliveryNotice !== undefined && (typeof deliveryNotice !== 'string' || deliveryNotice.length > 300))
      return fail('deliveryNotice must be a string of 300 characters or fewer');

    const existing = await db.orm.sitesettings.first();
    if (!existing) {
      await db.orm.sitesettings.create({
        brands: brands?.map((b) => b.trim()) ?? DEFAULT_BRANDS,
        deliveryPaused: deliveryPaused ?? false,
        deliveryNotice: deliveryNotice?.trim() ?? '',
      });
    } else {
      await db.orm.sitesettings.where({ _id: existing._id }).update({
        ...(brands !== undefined ? { brands: brands.map((b) => b.trim()) } : {}),
        ...(deliveryPaused !== undefined ? { deliveryPaused } : {}),
        ...(deliveryNotice !== undefined ? { deliveryNotice: deliveryNotice.trim() } : {}),
      });
    }
    refresh();
    const row = await db.orm.sitesettings.first();
    return ok({
      brands: row?.brands?.length ? [...row.brands] : DEFAULT_BRANDS,
      deliveryPaused: row?.deliveryPaused === true,
      deliveryNotice: row?.deliveryNotice ?? '',
    });
  });
}

// ── Users ───────────────────────────────────────────────────────────────────

export async function updateUserRole(userId: string, newRole: Role): Promise<ActionResult> {
  return run(async () => {
    const me = await requireAdmin();
    if (!['user', 'admin', 'owner'].includes(newRole)) return fail('Invalid role provided');
    if (newRole === 'owner' && me.role !== 'owner') return fail('Only an owner can grant the owner role');
    if (userId === me.id) return fail("You can't change your own role");
    const target = await getUserRow(userId);
    if (!target) return fail('User not found');
    const oldRole = target.role ?? 'user';
    if (oldRole === 'owner' && me.role !== 'owner') return fail("Only an owner can modify another owner's role");
    if (oldRole === newRole) return fail(`User already has the '${newRole}' role`);
    await db.orm.users.where({ _id: userId }).update({ role: newRole });
    await logActivity(me.name, 'Admin Action', `Role for ${target.email} updated from '${oldRole}' to '${newRole}'`);
    refresh();
    return ok(undefined, `Role for ${target.email} updated from '${oldRole}' to '${newRole}'`);
  });
}

// ── Marketing ───────────────────────────────────────────────────────────────

type Recipient = { email: string; name: string };
type Segments = { audience: Audience; pick: (group: string) => Recipient[] };

/** Order counts are matched by email, because guest → account linking is not always reflected on the user. */
async function buildSegments(): Promise<Segments> {
  const [users, orders, subscribers] = await Promise.all([
    db.orm.users.where({ role: 'user' }).all(),
    db.orm.orders.all(),
    db.orm.subscribers.where({ isVerified: true }).all(),
  ]);

  const orderCount = new Map<string, number>();
  const guestNames = new Map<string, string>();
  for (const order of orders) {
    const email = order.customer?.email?.toLowerCase();
    if (!email) continue;
    orderCount.set(email, (orderCount.get(email) ?? 0) + 1);
    if (!guestNames.has(email)) guestNames.set(email, order.customer?.fullname || 'Customer');
  }

  const registered = users.map((u) => ({ email: u.email, name: u.name, count: orderCount.get(u.email.toLowerCase()) ?? 0 }));
  const registeredEmails = new Set(registered.map((u) => u.email.toLowerCase()));
  const guests: Recipient[] = [...guestNames].filter(([email]) => !registeredEmails.has(email)).map(([email, name]) => ({ email, name }));
  const guestEmails = new Set(guests.map((g) => g.email));
  const subscriberOnly: Recipient[] = [];
  for (const s of subscribers) {
    const email = s.email.toLowerCase();
    if (!registeredEmails.has(email) && !subscriberOnly.some((x) => x.email.toLowerCase() === email)) subscriberOnly.push({ email: s.email, name: 'Subscriber' });
  }

  const by = (test: (count: number) => boolean) => registered.filter((u) => test(u.count));
  const audience: Audience = {
    registeredCount: registered.length,
    guestCount: guests.length,
    subscriberCount: subscriberOnly.length,
    totalCount: registered.length + guests.length + subscriberOnly.length,
    noOrdersCount: by((c) => c === 0).length,
    singleOrderCount: by((c) => c === 1).length,
    returningCount: by((c) => c >= 2 && c <= 4).length,
    loyalCount: by((c) => c >= 5).length,
  };

  const pick = (group: string): Recipient[] => {
    switch (group) {
      case 'registered': return registered;
      case 'guests': return guests;
      case 'subscribers': return subscriberOnly;
      case 'no_orders': return by((c) => c === 0);
      case 'single_order': return by((c) => c === 1);
      case 'returning': return by((c) => c >= 2 && c <= 4);
      case 'loyal': return by((c) => c >= 5);
      default: return [...registered, ...guests, ...subscriberOnly.filter((s) => !guestEmails.has(s.email.toLowerCase()))];
    }
  };
  return { audience, pick };
}

export async function getAudience(): Promise<ActionResult<Audience>> {
  return run(async () => {
    await requireAdmin();
    return ok((await buildSegments()).audience);
  });
}

const MARKETING_GROUPS = ['all', 'registered', 'guests', 'subscribers', 'no_orders', 'single_order', 'returning', 'loyal'];

export async function sendCampaign(input: { subject: string; headline: string; body: string; ctaLabel?: string; ctaUrl?: string; productImageUrl?: string; targetGroup?: string }): Promise<ActionResult<{ recipientCount: number }>> {
  return run(async () => {
    const admin = await requireAdmin();
    const subject = String(input?.subject ?? '').trim();
    const headline = String(input?.headline ?? '').trim();
    const body = String(input?.body ?? '').trim();
    const targetGroup = input?.targetGroup ?? 'all';
    if (!subject) return fail('Email subject is required');
    if (!headline) return fail('Headline is required');
    if (!body) return fail('Email body is required');
    if (!MARKETING_GROUPS.includes(targetGroup)) return fail('Invalid target group');

    const recipients = (await buildSegments()).pick(targetGroup);
    if (!recipients.length) return fail('No recipients found for this audience segment');

    const email = { subject, headline, body, ctaLabel: input.ctaLabel, ctaUrl: input.ctaUrl, productImageUrl: input.productImageUrl };
    // Sent in the background, one at a time, so Gmail's rate limits are respected.
    after(async () => {
      let sent = 0;
      let failed = 0;
      for (const r of recipients) {
        try {
          await sendMarketingEmail({ to: r.email, name: r.name, ...email });
          sent++;
        } catch (error) {
          failed++;
          console.error(`[MARKETING] Failed → ${r.email}: ${(error as Error).message}`);
        }
        await new Promise((resolve) => setTimeout(resolve, 150));
      }
      console.log(`[MARKETING] "${subject}" complete — ${sent} sent, ${failed} failed`);
    });

    await logActivity(admin.name, 'Admin Action', `Sent campaign "${subject}" to ${recipients.length} recipient${recipients.length === 1 ? '' : 's'} (${targetGroup})`);
    return ok(
      { recipientCount: recipients.length },
      `Campaign queued for ${recipients.length} recipient${recipients.length !== 1 ? 's' : ''}. Emails are being sent in the background.`,
    );
  });
}
