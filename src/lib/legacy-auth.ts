import { ObjectId } from 'mongodb';
import { mongoDb } from './db';

/**
 * Bridges accounts created by the old Express/JWT backend into Better Auth.
 *
 * The old backend kept the bcrypt hash on `users.password` and the Google id on
 * `users.googleId`. Better Auth reads credentials from the `accounts`
 * collection instead, so the first time an old user shows up we copy what is
 * needed over. Nothing on the user document is modified or removed, and the
 * hash is copied as-is (Better Auth is configured to verify bcrypt).
 */
export async function ensureLegacyAccounts(filter: { email?: string; id?: string }) {
  const users = mongoDb.collection('users');
  const accounts = mongoDb.collection('accounts');

  const query = filter.id && ObjectId.isValid(filter.id)
    ? { _id: new ObjectId(filter.id) }
    : filter.email
      ? { email: { $regex: `^${escapeRegex(filter.email.trim())}$`, $options: 'i' } }
      : null;
  if (!query) return;

  const user = await users.findOne(query);
  if (!user) return;

  // Better Auth looks emails up in lowercase; the old schema never normalised
  // them. Lowercase the stored address when that cannot collide with another user.
  const lower = String(user.email ?? '').toLowerCase();
  if (lower && lower !== user.email) {
    const clash = await users.findOne({ email: lower, _id: { $ne: user._id } });
    if (!clash) await users.updateOne({ _id: user._id }, { $set: { email: lower } });
  }

  const now = new Date();
  const existing = await accounts.find({ userId: user._id }).project({ providerId: 1 }).toArray();
  const has = (providerId: string) => existing.some((a) => a.providerId === providerId);

  if (typeof user.password === 'string' && user.password && !has('credential')) {
    await accounts.insertOne({
      accountId: user._id.toHexString(),
      providerId: 'credential',
      userId: user._id,
      password: user.password,
      createdAt: now,
      updatedAt: now,
    });
  }

  if (typeof user.googleId === 'string' && user.googleId && !has('google')) {
    await accounts.insertOne({
      accountId: user.googleId,
      providerId: 'google',
      userId: user._id,
      createdAt: now,
      updatedAt: now,
    });
  }

  // Old accounts were all OTP-verified at registration (or came from Google).
  if (user.emailVerified !== true) {
    await users.updateOne({ _id: user._id }, { $set: { emailVerified: true } });
  }
}

/** Whether this account has a password it can change (Google-only accounts do not). */
export async function userHasPassword(userId: string) {
  if (!ObjectId.isValid(userId)) return false;
  await ensureLegacyAccounts({ id: userId });
  const account = await mongoDb.collection('accounts').findOne({ userId: new ObjectId(userId), providerId: 'credential' });
  return Boolean(account?.password);
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
