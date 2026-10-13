/**
 * One-time, safe-to-rerun migration for accounts created by the old backend.
 *
 *   npm run auth:migrate
 *
 * For every existing user it copies the bcrypt hash / Google id into Better
 * Auth's `accounts` collection (nothing on the user document is removed) and
 * creates the indexes Better Auth's collections need. Old users can also just
 * log in without this — they are migrated on first sign-in — but running it
 * once up front is cleaner.
 */
import { config } from 'dotenv';

// Same files Next.js reads, same precedence: .env.local wins over .env.
config({ path: ['.env.local', '.env'] });

const { mongoClient, mongoDb } = await import('../src/lib/db');
const { ensureLegacyAccounts } = await import('../src/lib/legacy-auth');

const users = await mongoDb.collection('users').find({}, { projection: { _id: 1 } }).toArray();
let done = 0;
for (const user of users) {
  await ensureLegacyAccounts({ id: user._id.toHexString() });
  done++;
}

await mongoDb.collection('sessions').createIndex({ token: 1 }, { unique: true });
await mongoDb.collection('sessions').createIndex({ userId: 1 });
await mongoDb.collection('sessions').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
await mongoDb.collection('accounts').createIndex({ userId: 1 });
await mongoDb.collection('accounts').createIndex({ providerId: 1, accountId: 1 });
await mongoDb.collection('verifications').createIndex({ identifier: 1 });
await mongoDb.collection('verifications').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const accounts = await mongoDb.collection('accounts').countDocuments();
console.log(`Checked ${done} users · ${accounts} sign-in accounts now exist · indexes ready.`);
await mongoClient.close();
