import { createHash, randomInt } from 'node:crypto';
import { headers } from 'next/headers';
import { mongoDb } from '@/lib/db';
import { ActionError } from './session';

// ── Rate limiting ───────────────────────────────────────────────────────────
// Fixed-window counters kept in memory, keyed by action + client IP. On a
// single Node server this matches the old express-rate-limit behaviour; on
// serverless each instance counts on its own, so OTP checks below also carry
// their own attempt cap in the database.
const windows = new Map<string, { count: number; resetAt: number }>();

export async function rateLimit(action: string, max: number, windowSeconds: number, message: string) {
  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'local';
  const key = `${action}:${ip}`;
  const now = Date.now();
  const entry = windows.get(key);
  if (!entry || entry.resetAt < now) {
    windows.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    if (windows.size > 5000) for (const [k, v] of windows) if (v.resetAt < now) windows.delete(k);
    return;
  }
  entry.count += 1;
  if (entry.count > max) throw new ActionError(message, 'rate_limited');
}

// ── One-time codes ──────────────────────────────────────────────────────────
// Stored in Better Auth's `verifications` collection (hashed), so codes survive
// restarts and work across instances — the old backend kept them in a Map.

const MAX_ATTEMPTS = 5;
const hash = (code: string) => createHash('sha256').update(code).digest('hex');
const key = (kind: string, email: string) => `${kind}:${email.trim().toLowerCase()}`;

export function generateCode(length = 6) {
  return Array.from({ length }, () => randomInt(0, 10)).join('');
}

export async function storeCode<T>(kind: string, email: string, code: string, ttlSeconds: number, payload?: T) {
  const now = new Date();
  await mongoDb.collection('verifications').updateOne(
    { identifier: key(kind, email) },
    {
      $set: {
        value: JSON.stringify({ hash: hash(code), attempts: 0, payload: payload ?? null }),
        expiresAt: new Date(now.getTime() + ttlSeconds * 1000),
        updatedAt: now,
      },
      $setOnInsert: { createdAt: now },
    },
    { upsert: true },
  );
}

export async function peekCode<T>(kind: string, email: string): Promise<{ payload: T | null } | null> {
  const doc = await mongoDb.collection('verifications').findOne({ identifier: key(kind, email) });
  if (!doc || new Date(doc.expiresAt).getTime() < Date.now()) return null;
  return { payload: JSON.parse(doc.value).payload as T | null };
}

/** Checks a code and consumes it on success. Throws an ActionError with the reason otherwise. */
export async function consumeCode<T>(kind: string, email: string, code: string, messages: { missing: string; expired: string; invalid: string }) {
  const collection = mongoDb.collection('verifications');
  const identifier = key(kind, email);
  const doc = await collection.findOne({ identifier });
  if (!doc) throw new ActionError(messages.missing);
  if (new Date(doc.expiresAt).getTime() < Date.now()) {
    await collection.deleteOne({ _id: doc._id });
    throw new ActionError(messages.expired);
  }
  const stored = JSON.parse(doc.value) as { hash: string; attempts: number; payload: T | null };
  if (stored.hash !== hash(String(code).trim())) {
    if (stored.attempts + 1 >= MAX_ATTEMPTS) {
      await collection.deleteOne({ _id: doc._id });
      throw new ActionError('Too many incorrect attempts. Please request a new code.');
    }
    await collection.updateOne({ _id: doc._id }, { $set: { value: JSON.stringify({ ...stored, attempts: stored.attempts + 1 }) } });
    throw new ActionError(messages.invalid);
  }
  await collection.deleteOne({ _id: doc._id });
  return stored.payload;
}
