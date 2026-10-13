import { MongoClient } from 'mongodb';
import mongo from '@prisma/orm-mongo/runtime';
import type { Contract } from '../../prisma/contract.d';
import contractJson from '../../prisma/contract.json' with { type: 'json' };

/**
 * One MongoClient for the whole process. Prisma and Better Auth both run on it,
 * so there is a single connection pool. The placeholder URL keeps `next build`
 * working without a database: nothing connects until the first query.
 */
const url = process.env.DATABASE_URL ?? process.env.MONGO_URI ?? 'mongodb://127.0.0.1:27017/levelup';

const globalForDb = globalThis as unknown as { __levelupDb?: { url: string; client: MongoClient } };

// Reused across dev hot reloads, but only while the URL is unchanged — editing
// DATABASE_URL in .env.local must not keep the old connection alive.
const cached = globalForDb.__levelupDb;
if (cached && cached.url !== url) void cached.client.close().catch(() => {});

export const mongoClient = cached?.url === url ? cached.client : new MongoClient(url);
if (process.env.NODE_ENV !== 'production') globalForDb.__levelupDb = { url, client: mongoClient };

/** Same rule Mongoose used: the database named in the URL, or `test` when there is none. */
export const dbName = process.env.DATABASE_NAME || mongoClient.db().databaseName;

/** Raw driver handle — used by Better Auth and for the few things Prisma 8's Mongo client does not cover yet (counts). */
export const mongoDb = mongoClient.db(dbName);

/** Typed Prisma 8 client. Collections are addressed by their storage name: `db.orm.products`, `db.orm.users`, … */
export const db = mongo<Contract>({ contractJson, mongoClient, dbName });
