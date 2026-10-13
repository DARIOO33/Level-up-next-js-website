'use server';

import { after } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/db';
import {
  sendAdminContactEmail,
  sendAdminNewOrderEmail,
  sendAdminNewReviewEmail,
  sendOrderConfirmationEmail,
  sendOrderOtpEmail,
  sendSubscriberOtpEmail,
} from '@/lib/email';
import type { ActionResult, Coupon, Order, OrderCustomer, Review } from '@/lib/types';
import { EMAIL_RE, PHONE_RE } from '@/lib/utils';
import {
  findProductRow,
  getAdminEmails,
  getOrder,
  getSettings,
  getUserByEmail,
  logActivity,
  newId,
  toCoupon,
  toOrder,
  toReview,
} from '../data';
import { consumeCode, generateCode, peekCode, rateLimit, storeCode } from '../guard';
import { ActionError, fail, getSessionUser, isAdmin, ok, requireUser, run } from '../session';

/* eslint-disable @typescript-eslint/no-explicit-any */
const round3 = (value: number) => parseFloat(value.toFixed(3));

// ── Coupons ─────────────────────────────────────────────────────────────────

async function findUsableCoupon(codeInput: string, orderAmount?: number): Promise<Coupon> {
  const code = String(codeInput ?? '').trim().toUpperCase();
  if (!code) throw new ActionError('Coupon code is required');
  const row = await db.orm.coupons.where({ code }).first();
  const coupon = row ? toCoupon(row) : null;
  if (!coupon || !coupon.isActive) throw new ActionError('Invalid or inactive coupon code');
  if (coupon.expiresAt && new Date() > new Date(coupon.expiresAt)) throw new ActionError('This coupon has expired');
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) throw new ActionError('This coupon has reached its usage limit');
  if (orderAmount !== undefined && orderAmount < coupon.minOrderAmount)
    throw new ActionError(`Minimum order of ${coupon.minOrderAmount} TND required for this coupon`);
  return coupon;
}

const discountFor = (coupon: Coupon, amount: number) =>
  coupon.type === 'percent' ? Math.min(amount * (coupon.value / 100), amount) : Math.min(coupon.value, amount);

export type CouponPreview = { code: string; type: 'percent' | 'fixed'; value: number; discount: number; minOrderAmount: number };

/** Public: check a code against the current cart total. */
export async function validateCoupon(code: string, orderAmount: number): Promise<ActionResult<CouponPreview>> {
  return run(async () => {
    await rateLimit('coupon', 30, 15 * 60, 'Too many attempts. Please try again later.');
    const amount = Number(orderAmount) || 0;
    const coupon = await findUsableCoupon(code, amount);
    return ok({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      discount: round3(discountFor(coupon, amount)),
      minOrderAmount: coupon.minOrderAmount,
    });
  });
}

// ── Orders ──────────────────────────────────────────────────────────────────

const customerSchema = z.object({
  fullname: z.string().trim().min(1, 'Name is required').max(100),
  email: z.string().trim().regex(EMAIL_RE, 'Please use a valid email address'),
  phone: z.string().trim().regex(PHONE_RE, 'Invalid phone number'),
  address: z.string().trim().min(1, 'Address is required').max(300),
});
const itemsSchema = z
  .array(z.object({ product: z.string().min(1), variantID: z.string().min(1), quantity: z.number().int().min(1).max(99) }))
  .min(1)
  .max(50);

type ResolvedItem = { product: string; variantID: string; quantity: number; productName: string; variantName: string; variantImage: string | null };
type PendingOrder = { customer: OrderCustomer; items: ResolvedItem[]; totalAmount: number; couponCode: string | null };

/** Re-prices the cart from the database — client prices are never trusted. */
async function resolveItems(items: z.infer<typeof itemsSchema>) {
  const resolved: ResolvedItem[] = [];
  let totalAmount = 0;
  for (const item of items) {
    const product = await findProductRow(item.product);
    if (!product) throw new ActionError(`Product not found: ${item.product}`);
    const variant = (product.variants ?? []).find((v: any) => String(v._id) === item.variantID);
    if (!variant) throw new ActionError(`Variant not found: ${item.variantID}`);
    if (Number(variant.stock) < item.quantity) throw new ActionError(`Insufficient stock for variant: ${variant.title}`);
    totalAmount += item.quantity * Number(variant.price);
    resolved.push({
      product: String(product._id),
      variantID: item.variantID,
      quantity: item.quantity,
      productName: product.name,
      variantName: variant.title,
      variantImage: variant.image || product.images?.[0] || null,
    });
  }
  return { resolved, totalAmount };
}

async function persistOrder(pending: PendingOrder): Promise<Order> {
  let finalAmount = pending.totalAmount;
  let couponCode: string | null = null;
  if (pending.couponCode) {
    // An invalid/expired coupon at this point is silently ignored, as before.
    const coupon = await findUsableCoupon(pending.couponCode, pending.totalAmount).catch(() => null);
    if (coupon) {
      finalAmount = Math.max(0, pending.totalAmount - discountFor(coupon, pending.totalAmount));
      couponCode = coupon.code;
      await db.orm.coupons.where({ code: coupon.code }).update((c) => [c.usedCount.inc(1)]);
    }
  }
  const row = await db.orm.orders.create({
    customer: pending.customer,
    items: pending.items.map((item) => ({ _id: newId(), ...item })),
    totalAmount: round3(finalAmount),
    couponCode,
    status: 'pending',
  });
  return toOrder(row);
}

function notifyNewOrder(order: Order) {
  // Emails go out after the response so checkout never waits on SMTP.
  after(async () => {
    await sendOrderConfirmationEmail({ to: order.customer.email, name: order.customer.fullname, order });
    const admins = await getAdminEmails().catch(() => []);
    await Promise.allSettled(admins.map((a) => sendAdminNewOrderEmail({ to: a.email, order })));
  });
}

export type PlaceOrderInput = { customer: OrderCustomer; items: { product: string; variantID: string; quantity: number }[]; couponCode?: string | null };
export type PlaceOrderResult = { status: 'created'; orderId: string } | { status: 'otp_required' };

/**
 * Signed-in customers get their order immediately. Guests confirm their email
 * with a 6-digit code first; an email that already has an account must log in.
 */
export async function placeOrder(input: PlaceOrderInput): Promise<ActionResult<PlaceOrderResult>> {
  return run<PlaceOrderResult>(async () => {
    const settings = await getSettings();
    if (settings.deliveryPaused)
      return fail(settings.deliveryNotice || 'Delivery is temporarily paused. Please check back later.', 'delivery_paused');

    const customer = customerSchema.safeParse(input?.customer);
    const items = itemsSchema.safeParse(input?.items);
    if (!customer.success) return fail(`Validation failed: ${customer.error.issues[0]?.message}`);
    if (!items.success) return fail('Customer info and at least one item are required');

    await rateLimit('order', 20, 15 * 60, 'Too many requests, please slow down.');
    const { resolved, totalAmount } = await resolveItems(items.data);
    const pending: PendingOrder = { customer: customer.data, items: resolved, totalAmount, couponCode: input.couponCode?.trim().toUpperCase() || null };

    const user = await getSessionUser();
    if (user) {
      const order = await persistOrder(pending);
      await db.orm.users.where({ _id: user.id }).update((u) => [
        u.orders.push(order.id),
        u.notifications.push({
          _id: newId(),
          title: 'Order Confirmed',
          message: `Your order #${order.id.slice(0, 8)} has been placed successfully.`,
          type: 'order',
          isRead: false,
          link: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ]);
      await logActivity(customer.data.fullname, 'User Action', `New order #${order.id.slice(0, 8)} — ${resolved[0].productName}`);
      notifyNewOrder(order);
      revalidatePath('/orders');
      return ok({ status: 'created', orderId: order.id });
    }

    if (await getUserByEmail(customer.data.email)) {
      return fail(
        'An account with this email already exists. Please log in to place your order, or use a different email address.',
        'email_exists',
      );
    }

    const code = generateCode(6);
    await storeCode<PendingOrder>('guest-order', customer.data.email, code, 10 * 60, pending);
    await sendOrderOtpEmail({ to: customer.data.email, name: customer.data.fullname, otp: code, orderItems: resolved, totalAmount });
    return ok({ status: 'otp_required' }, 'A verification code has been sent to your email. Please enter it to confirm your order.');
  });
}

export async function verifyGuestOrder(email: string, otp: string): Promise<ActionResult<{ orderId: string }>> {
  return run(async () => {
    if (!email || !otp) return fail('Email and OTP are required');
    await rateLimit('order-otp', 5, 15 * 60, 'Too many verification attempts. Please try again later.');
    const pending = await consumeCode<PendingOrder>('guest-order', email, otp, {
      missing: 'No pending order for this email. Please start checkout again.',
      expired: 'OTP has expired. Please start checkout again.',
      invalid: 'Invalid verification code.',
    });
    if (!pending) return fail('No pending order for this email. Please start checkout again.');

    const order = await persistOrder(pending);
    await logActivity(pending.customer.fullname, 'User Action', `New guest order #${order.id.slice(0, 8)} — ${pending.items[0].productName}`);
    notifyNewOrder(order);
    return ok({ orderId: order.id });
  });
}

export async function resendGuestOrderOtp(email: string): Promise<ActionResult> {
  return run(async () => {
    if (!email) return fail('Email is required');
    await rateLimit('order-otp-resend', 3, 10 * 60, 'Too many resend requests. Please wait before trying again.');
    const entry = await peekCode<PendingOrder>('guest-order', email);
    if (!entry?.payload) return fail('No pending order found. Please start checkout again.');
    const code = generateCode(6);
    await storeCode('guest-order', email, code, 10 * 60, entry.payload);
    await sendOrderOtpEmail({
      to: email,
      name: entry.payload.customer.fullname,
      otp: code,
      orderItems: entry.payload.items,
      totalAmount: entry.payload.totalAmount,
    });
    return ok(undefined, 'A new code has been sent.');
  });
}

/** Review entries for one order — lets /orders show "Leave review" buttons. */
export async function getOrderReviews(orderId: string): Promise<ActionResult<Pick<Review, 'productName' | 'token' | 'isApproved' | 'comment' | 'rating'>[]>> {
  return run(async () => {
    const user = await requireUser();
    const order = await getOrder(orderId);
    if (!order) return fail('Order not found');
    if (!isAdmin(user) && order.customer.email.toLowerCase() !== user.email.toLowerCase())
      return fail('You do not have permission to view these reviews');
    const rows = await db.orm.storereviews.where({ orderId }).all();
    return ok(rows.map(toReview).map(({ productName, token, isApproved, comment, rating }) => ({ productName, token, isApproved, comment, rating })));
  });
}

// ── Review form (one-time token links) ──────────────────────────────────────

export async function submitReviewByToken(
  token: string,
  input: { name?: string; rating: number; comment: string; showName: boolean },
): Promise<ActionResult> {
  return run(async () => {
    const rating = Number(input?.rating);
    const comment = String(input?.comment ?? '').trim();
    if (!rating || rating < 1 || rating > 5) return fail('Rating must be between 1 and 5');
    if (!comment) return fail('Comment is required');
    if (comment.length > 500) return fail('Comment must be 500 characters or fewer');
    if (!token || token.length < 16) return fail('This review link is invalid or has already been used.');

    const row = await db.orm.storereviews.where({ token }).first();
    if (!row) return fail('This review link is invalid or has already been used.');

    const updated = await db.orm.storereviews.where({ _id: row._id }).update({
      name: input.showName ? String(input.name ?? '').trim().slice(0, 60) || 'Anonymous' : null,
      showName: Boolean(input.showName),
      rating: Math.round(rating),
      comment,
      source: 'website',
      token: null, // one-time use
    });

    if (updated) {
      const review = toReview(updated);
      after(async () => {
        const admins = await getAdminEmails().catch(() => []);
        await Promise.allSettled(admins.map((a) => sendAdminNewReviewEmail({ to: a.email, review })));
      });
    }
    return ok(undefined, 'Thank you for your review!');
  });
}

// ── Contact form ────────────────────────────────────────────────────────────

export async function submitContact(input: { name: string; email: string; message: string }): Promise<ActionResult> {
  return run(async () => {
    const name = String(input?.name ?? '').trim();
    const email = String(input?.email ?? '').trim().toLowerCase();
    const message = String(input?.message ?? '').trim();
    if (!name || !email || !message) return fail('Name, email and message are required');
    if (!EMAIL_RE.test(email)) return fail('Please enter a valid email address');
    if (message.length < 10) return fail('Message must be at least 10 characters');
    if (name.length > 100 || message.length > 2000) return fail('Message is too long');

    await rateLimit('contact', 3, 60 * 60, 'Too many messages sent. Please wait before sending another.');
    const contact = await db.orm.contactmessages.create({ name, email, message, isRead: false });
    after(async () => {
      const admins = await getAdminEmails().catch(() => []);
      await Promise.allSettled(admins.map((a) => sendAdminContactEmail({ to: a.email, contact })));
    });
    return ok(undefined, "Message received. We'll reply within 24 hours.");
  });
}

// ── Newsletter (email → 4-digit code) ───────────────────────────────────────

export async function subscribeNewsletter(emailInput: string): Promise<ActionResult> {
  return run(async () => {
    const email = String(emailInput ?? '').trim();
    if (!EMAIL_RE.test(email)) return fail('Please enter a valid email.');
    await rateLimit('newsletter', 5, 10 * 60, 'Too many requests. Please try again later.');

    const otp = generateCode(4);
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000);
    const existing = await db.orm.subscribers.where({ email }).first();
    if (existing) await db.orm.subscribers.where({ _id: existing._id }).update({ otp, otpExpires, isVerified: false });
    else await db.orm.subscribers.create({ email, otp, otpExpires, isVerified: false });

    await sendSubscriberOtpEmail({ to: email, otp });
    return ok(undefined, 'OTP sent to email');
  });
}

export async function verifyNewsletter(emailInput: string, otp: string): Promise<ActionResult> {
  return run(async () => {
    const email = String(emailInput ?? '').trim();
    if (!email || !otp) return fail('Email and OTP required');
    await rateLimit('newsletter-verify', 8, 10 * 60, 'Too many attempts. Please try again later.');
    const subscriber = await db.orm.subscribers.where({ email }).first();
    if (!subscriber) return fail('Subscriber not found');
    if (subscriber.otp !== String(otp).trim()) return fail('Invalid OTP');
    if (!subscriber.otpExpires || new Date(subscriber.otpExpires) < new Date()) return fail('OTP expired');
    await db.orm.subscribers.where({ _id: subscriber._id }).update({ isVerified: true, otp: null, otpExpires: null });
    return ok(undefined, 'Email verified & subscribed successfully');
  });
}

/** Public order tracking — exposes only what the old `/track` endpoint did (no email, phone or address). */
export async function trackOrder(orderId: string): Promise<ActionResult<Pick<Order, 'id' | 'status' | 'items' | 'totalAmount' | 'createdAt' | 'updatedAt'> & { fullname: string }>> {
  return run(async () => {
    const order = await getOrder(String(orderId ?? '').trim().toLowerCase());
    if (!order) return fail('Order not found');
    const { id, status, items, totalAmount, createdAt, updatedAt } = order;
    return ok({ id, status, items, totalAmount, createdAt, updatedAt, fullname: order.customer.fullname });
  });
}
