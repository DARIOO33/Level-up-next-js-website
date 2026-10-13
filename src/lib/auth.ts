import { createHmac, timingSafeEqual } from 'node:crypto';
import { betterAuth } from 'better-auth';
import { APIError, createAuthMiddleware } from 'better-auth/api';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { nextCookies } from 'better-auth/next-js';
import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';
import { mongoClient, mongoDb } from './db';
import { ensureLegacyAccounts } from './legacy-auth';
import { sendPasswordChangedEmail, sendPasswordResetEmail, sendWelcomeEmail } from './email';
import { SITE_URL } from './site';

const secret = process.env.BETTER_AUTH_SECRET ?? 'dev-only-secret-change-me-in-production-please';

/**
 * Registration is gated behind an emailed OTP (same flow as the old site), so
 * the public `/api/auth/sign-up/email` endpoint must not create accounts on its
 * own. The register server action signs the email with this proof once the OTP
 * checks out; requests without it are rejected.
 */
export const SIGNUP_PROOF_HEADER = 'x-levelup-signup-proof';
export function signupProof(email: string) {
  return createHmac('sha256', secret).update(`signup:${email.trim().toLowerCase()}`).digest('hex');
}
function hasValidSignupProof(email: unknown, proof: string | null | undefined) {
  if (typeof email !== 'string' || !proof) return false;
  const expected = Buffer.from(signupProof(email));
  const given = Buffer.from(proof);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

const google =
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? { google: { clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET } }
    : undefined;

export const googleEnabled = Boolean(google);

export const auth = betterAuth({
  appName: 'Level Up TN',
  baseURL: process.env.BETTER_AUTH_URL ?? SITE_URL,
  secret,
  // No multi-document transactions: they need a replica set, and nothing here depends on them.
  database: mongodbAdapter(mongoDb, { client: mongoClient, transaction: false }),

  // Better Auth runs directly on the existing `users` collection.
  user: {
    modelName: 'users',
    fields: { image: 'avatar' },
    additionalFields: {
      role: { type: 'string', defaultValue: 'user', input: false },
      phoneNumber: { type: 'string', required: false },
      authProvider: { type: 'string', defaultValue: 'local', input: false },
    },
  },
  session: { modelName: 'sessions', expiresIn: 60 * 60 * 24 * 30, updateAge: 60 * 60 * 24 },
  account: {
    modelName: 'accounts',
    // An old email/password user who clicks "Continue with Google" lands on the same account.
    accountLinking: { enabled: true, trustedProviders: ['google'] },
  },
  verification: { modelName: 'verifications' },

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
    autoSignIn: true,
    // bcrypt, exactly like the old backend — existing hashes keep working.
    password: {
      hash: (password) => bcrypt.hash(password, 10),
      verify: ({ hash, password }) => bcrypt.compare(password, hash),
    },
    resetPasswordTokenExpiresIn: 30 * 60,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, token }) => {
      await sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        resetUrl: `${SITE_URL}/reset-password?token=${token}`,
      });
    },
    onPasswordReset: async ({ user }) => {
      await mongoDb.collection('users').updateOne({ email: user.email }, { $set: { passwordChangedAt: new Date() } });
      sendPasswordChangedEmail({ to: user.email, name: user.name }).catch(() => {});
    },
  },

  socialProviders: google,

  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path === '/sign-up/email') {
        if (!hasValidSignupProof(ctx.body?.email, ctx.headers?.get(SIGNUP_PROOF_HEADER))) {
          throw new APIError('FORBIDDEN', { message: 'Please verify your email address first.' });
        }
        return;
      }
      if ((ctx.path === '/sign-in/email' || ctx.path === '/request-password-reset') && typeof ctx.body?.email === 'string') {
        await ensureLegacyAccounts({ email: ctx.body.email });
      }
    }),
  },

  databaseHooks: {
    user: {
      create: {
        after: async (user, ctx) => {
          const viaGoogle = Boolean(ctx?.path?.startsWith('/callback/'));
          const users = mongoDb.collection('users');
          const created = await users.findOne({ email: user.email });
          if (!created) return;

          // Same defaults Mongoose used to write, plus any guest orders placed with this email.
          const guestOrders = await mongoDb
            .collection('orders')
            .find({ 'customer.email': user.email })
            .project({ _id: 1 })
            .toArray();
          await users.updateOne(
            { _id: created._id },
            {
              $set: {
                authProvider: viaGoogle ? 'google' : 'local',
                role: created.role ?? 'user',
                orders: guestOrders.map((o) => o._id),
                wishlist: created.wishlist ?? [],
                notifications: created.notifications ?? [],
                shippingAddresses: created.shippingAddresses ?? [],
                tokenVersion: created.tokenVersion ?? 0,
                ...(viaGoogle ? { emailVerified: true } : {}),
              },
            },
          );
          sendWelcomeEmail({ to: user.email, name: user.name, isGoogle: viaGoogle }).catch(() => {});
        },
      },
    },
    account: {
      create: {
        after: async (account) => {
          // Keep the legacy `googleId` field in sync for accounts that link Google.
          if (account.providerId === 'google') {
            await mongoDb
              .collection('users')
              .updateOne({ _id: toObjectId(account.userId) }, { $set: { googleId: account.accountId } })
              .catch(() => {});
          }
        },
      },
    },
  },

  // nextCookies must stay last.
  plugins: [nextCookies()],
});

function toObjectId(id: unknown) {
  return typeof id === 'string' && ObjectId.isValid(id) ? new ObjectId(id) : (id as ObjectId);
}

export type AuthSession = typeof auth.$Infer.Session;
