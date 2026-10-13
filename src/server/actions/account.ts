'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { localRedirect } from '@/i18n/server';
import { auth, SIGNUP_PROOF_HEADER, signupProof } from '@/lib/auth';
import { db, mongoDb } from '@/lib/db';
import { sendOtpEmail, sendPasswordChangedEmail } from '@/lib/email';
import type { ActionResult, Address } from '@/lib/types';
import { EMAIL_RE, PHONE_RE } from '@/lib/utils';
import { findProductRow, getAddresses, getUserByEmail, getUserRow, newId, toAddress } from '../data';
import { consumeCode, generateCode, rateLimit, storeCode } from '../guard';
import { fail, ok, requireUser, run } from '../session';

/* eslint-disable @typescript-eslint/no-explicit-any */


// ── Registration (email → OTP → account) ────────────────────────────────────

export async function sendSignupOtp(emailInput: string): Promise<ActionResult> {
  return run(async () => {
    const email = String(emailInput ?? '').trim().toLowerCase();
    if (!EMAIL_RE.test(email)) return fail('Please enter a valid email address');
    await rateLimit('signup-otp', 3, 5 * 60, 'Too many OTP requests, please try again later.');
    if (await getUserByEmail(email)) return fail('Email is already registered', 'email_exists');

    const code = generateCode(6);
    await storeCode('signup-otp', email, code, 10 * 60);
    await sendOtpEmail({ to: email, name: email.split('@')[0], otp: code });
    return ok(undefined, 'OTP sent to your email address');
  });
}

const registerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80),
  email: z.string().trim().toLowerCase().regex(EMAIL_RE, 'Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128),
  phoneNumber: z.string().trim().regex(PHONE_RE, 'Invalid phone number').optional().or(z.literal('')),
  otp: z.string().trim().length(6, 'Enter the 6-digit code'),
});

/**
 * On success this redirects to the "add your first address" step instead of
 * returning: the new session cookie re-renders /login, which would otherwise
 * send the now signed-in user straight to `next` and skip that step.
 */
export async function registerWithOtp(input: z.input<typeof registerSchema>, next = '/'): Promise<ActionResult> {
  return run(async () => {
    const parsed = registerSchema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'All fields including OTP are required');
    const { name, email, password, phoneNumber, otp } = parsed.data;

    await rateLimit('signup-verify', 10, 15 * 60, 'Too many verification attempts. Please try again later.');
    await consumeCode('signup-otp', email, otp, {
      missing: 'OTP expired or not found. Please request a new one.',
      expired: 'OTP has expired. Please request a new one.',
      invalid: 'Invalid OTP',
    });

    const requestHeaders = new Headers(await headers());
    requestHeaders.set(SIGNUP_PROOF_HEADER, signupProof(email));
    try {
      // Creates the user + credential account and signs them in (cookies are set by the nextCookies plugin).
      await auth.api.signUpEmail({
        body: { name, email, password, ...(phoneNumber ? { phoneNumber } : {}) },
        headers: requestHeaders,
      });
    } catch (error: any) {
      return fail(error?.body?.message ?? error?.message ?? 'Registration failed');
    }
    await mongoDb.collection('users').updateOne({ email }, { $set: { emailVerified: true } });
    const safeNext = typeof next === 'string' && next.startsWith('/') && !next.startsWith('//') ? next : '/';
    return localRedirect(`/login?step=address&next=${encodeURIComponent(safeNext)}`);
  });
}

// ── Profile ─────────────────────────────────────────────────────────────────

export async function updateName(nameInput: string): Promise<ActionResult> {
  return run(async () => {
    const user = await requireUser();
    const name = String(nameInput ?? '').trim();
    if (!name) return fail('Name cannot be empty');
    if (name.length > 80) return fail('Name is too long');
    await db.orm.users.where({ _id: user.id }).update({ name });
    revalidatePath('/', 'layout');
    return ok(undefined, 'Profile updated successfully');
  });
}

/** Called right after Better Auth changed the password: stamp it and email the owner. */
export async function notePasswordChanged(): Promise<ActionResult> {
  return run(async () => {
    const user = await requireUser();
    await db.orm.users.where({ _id: user.id }).update({ passwordChangedAt: new Date() });
    sendPasswordChangedEmail({ to: user.email, name: user.name }).catch(() => {});
    return ok();
  });
}

// ── Shipping addresses ──────────────────────────────────────────────────────

const addressSchema = z.object({
  label: z.string().trim().max(40).optional(),
  fullname: z.string().trim().min(1).max(80),
  phone: z.string().trim().min(6).max(20),
  address: z.string().trim().max(200).optional(),
  governorate: z.string().trim().min(1).max(60),
  city: z.string().trim().min(1).max(80),
  postalCode: z.string().trim().max(12).optional(),
  isDefault: z.boolean().optional(),
});
export type AddressInput = z.input<typeof addressSchema>;

async function writeAddresses(userId: string, list: Address[]) {
  await db.orm.users.where({ _id: userId }).update({
    shippingAddresses: list.map((a) => ({
      _id: newId(a.id),
      label: a.label,
      fullname: a.fullname,
      phone: a.phone,
      address: a.address,
      governorate: a.governorate,
      city: a.city,
      postalCode: a.postalCode,
      isDefault: a.isDefault,
    })),
  });
  revalidatePath('/profile');
  return list;
}

export async function listAddresses(): Promise<ActionResult<Address[]>> {
  return run(async () => ok(await getAddresses((await requireUser()).id)));
}

export async function saveAddress(input: AddressInput, addressId?: string): Promise<ActionResult<Address[]>> {
  return run(async () => {
    const user = await requireUser();
    const parsed = addressSchema.safeParse(input);
    if (!parsed.success) return fail('Full name, phone number, governorate and city are required');
    const data = parsed.data;
    let list = await getAddresses(user.id);

    if (addressId) {
      if (!list.some((a) => a.id === addressId)) return fail('Address not found');
      if (data.isDefault) list = list.map((a) => ({ ...a, isDefault: false }));
      list = list.map((a) =>
        a.id === addressId
          ? {
              ...a,
              label: data.label || a.label,
              fullname: data.fullname,
              phone: data.phone,
              address: data.address ?? '',
              governorate: data.governorate,
              city: data.city,
              postalCode: data.postalCode ?? '',
              isDefault: data.isDefault ?? a.isDefault,
            }
          : a,
      );
    } else {
      // The first address becomes the default automatically.
      const makeDefault = Boolean(data.isDefault) || list.length === 0;
      if (makeDefault) list = list.map((a) => ({ ...a, isDefault: false }));
      list.push(
        toAddress({
          _id: newId(),
          ...data,
          label: data.label || 'Home',
          isDefault: makeDefault,
        }),
      );
    }
    return ok(await writeAddresses(user.id, list));
  });
}

export async function deleteAddress(addressId: string): Promise<ActionResult<Address[]>> {
  return run(async () => {
    const user = await requireUser();
    const list = await getAddresses(user.id);
    const target = list.find((a) => a.id === addressId);
    if (!target) return fail('Address not found');
    const rest = list.filter((a) => a.id !== addressId);
    if (target.isDefault && rest.length) rest[0] = { ...rest[0], isDefault: true };
    return ok(await writeAddresses(user.id, rest));
  });
}

export async function setDefaultAddress(addressId: string): Promise<ActionResult<Address[]>> {
  return run(async () => {
    const user = await requireUser();
    const list = await getAddresses(user.id);
    if (!list.some((a) => a.id === addressId)) return fail('Address not found');
    return ok(await writeAddresses(user.id, list.map((a) => ({ ...a, isDefault: a.id === addressId }))));
  });
}

// ── Wishlist ────────────────────────────────────────────────────────────────

export async function toggleWishlist(productParam: string): Promise<ActionResult<{ inWishlist: boolean }>> {
  return run(async () => {
    const user = await requireUser();
    const product = await findProductRow(productParam);
    if (!product) return fail('Product not found');
    const productId = String(product._id);
    const row = await getUserRow(user.id);
    const has = (row?.wishlist ?? []).map(String).includes(productId);
    await db.orm.users
      .where({ _id: user.id })
      .update((u) => [has ? u.wishlist.pull(productId) : u.wishlist.addToSet(productId)]);
    revalidatePath('/wishlist');
    return ok({ inWishlist: !has }, has ? 'Removed from wishlist' : 'Added to wishlist');
  });
}

// ── Back-in-stock alerts ────────────────────────────────────────────────────
// A customer watches a product as a whole: they are told when any of its variants
// comes back. Only the user id is stored on the product — never an email.

const isWatcher = (w: any, userId: string) => String(w.userId) === userId;

export async function getNotifyStatus(productParam: string): Promise<ActionResult<{ isWatching: boolean }>> {
  return run(async () => {
    const user = await requireUser();
    const product = await findProductRow(productParam);
    if (!product) return fail('Product not found');
    return ok({ isWatching: (product.stockWatchers ?? []).some((w: any) => isWatcher(w, user.id)) });
  });
}

export async function toggleNotify(productParam: string): Promise<ActionResult<{ isWatching: boolean }>> {
  return run<{ isWatching: boolean }>(async () => {
    const user = await requireUser();
    const product = await findProductRow(productParam);
    if (!product) return fail('Product not found');
    const watchers: any[] = product.stockWatchers ?? [];
    const productId = String(product._id);

    if (watchers.some((w) => isWatcher(w, user.id))) {
      await db.orm.products.where({ _id: productId }).update({
        stockWatchers: watchers
          .filter((w) => !isWatcher(w, user.id))
          .map((w) => ({ _id: newId(String(w._id)), userId: String(w.userId), variantId: w.variantId ?? null })),
      });
      return ok({ isWatching: false }, 'Notification removed');
    }

    await db.orm.products
      .where({ _id: productId })
      .update((p) => [p.stockWatchers.push({ _id: newId(), userId: user.id, variantId: null })]);
    return ok({ isWatching: true }, "We'll notify you when this is back in stock!");
  });
}

// ── Notifications ───────────────────────────────────────────────────────────

export async function markNotificationsRead(): Promise<ActionResult> {
  return run(async () => {
    const user = await requireUser();
    const row = await getUserRow(user.id);
    const list: any[] = row?.notifications ?? [];
    if (!list.some((n) => !n.isRead)) return ok();
    await db.orm.users.where({ _id: user.id }).update({
      notifications: list.map((n) => ({
        _id: newId(String(n._id)),
        title: n.title,
        message: n.message,
        type: n.type ?? 'info',
        isRead: true,
        link: n.link ?? null,
        createdAt: n.createdAt ?? null,
        updatedAt: new Date(),
      })),
    });
    revalidatePath('/profile');
    return ok();
  });
}
