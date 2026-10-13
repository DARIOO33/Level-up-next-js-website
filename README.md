# Level Up TN

Full-stack rebuild of the Level Up TN store: Next.js 16 (App Router, TypeScript), Tailwind CSS 4,
Prisma 8 on MongoDB, Better Auth. It replaces the old `back/` (Express) + `front/` (Next 14) pair
with one app and **runs on the existing MongoDB database unchanged**.

## Run it

```bash
npm install
cp .env.example .env.local      # fill in DATABASE_URL, BETTER_AUTH_SECRET, …
npm run dev
```

No database at hand? `npm run dev:db` starts a throwaway in-memory MongoDB with sample data in the
old Mongoose format (the bundled `.env.local` already points at it). Logins: `owner@levelup.tn` /
`owner123`, `client@levelup.tn` / `client123`.

| Command | What it does |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:emit` | Regenerate `prisma/contract.json` + `contract.d.ts` after editing `prisma/contract.prisma` |
| `npm run auth:migrate` | One-time: prepare old user accounts for Better Auth (safe to re-run) |
| `npm run dev:db` | Local preview database |

## Going live on the existing database

1. Point `DATABASE_URL` at the same database the old backend used (`MONGO_URI`). **MongoDB 8.0+ is required by Prisma 8.**
2. `npm run auth:migrate` once. It only *adds* documents (`accounts`) and indexes; nothing is removed.
3. Do **not** run `prisma db init` / `prisma db update` against production — the app never needs them,
   and they would attach schema validators to your collections.
4. Google sign-in now needs `GOOGLE_CLIENT_SECRET` and the redirect URI `<site>/api/auth/callback/google`.

## How the old data maps

`prisma/contract.prisma` mirrors the Mongoose models one-to-one: same collections (`users`, `products`,
`orders`, `coupons`, `activities`, `contactmessages`, `storereviews`, `subscribers`, `sitesettings`), same
field names, embedded documents keep their `_id`. New collections: `sessions`, `accounts`, `verifications`
(Better Auth; one-time codes live in `verifications` instead of server memory).

- **Passwords** – Better Auth is configured for bcrypt, so old hashes keep working. The hash is copied from
  `users.password` into `accounts` the first time a user signs in (or by `auth:migrate`).
- **Sessions** – the old JWT cookies are not valid here; everyone signs in once more.
- **Carts** – same `localStorage` key and shape, so carts in customers' browsers carry over.

## Layout

```
prisma/contract.prisma     data contract (schema)
src/lib/                   db client, auth, email templates, types, utils
src/server/data.ts         reads (Prisma rows → plain objects)
src/server/actions/        mutations (server actions): account, store, admin, catalog
src/app/                   routes        src/components/   UI
src/i18n/                  EN/FR copy (language is a cookie, rendered server-side)
```

Prisma 8 is a release candidate. Where its Mongo client has no API yet (counts, the OTP store) the app
uses the shared `mongodb` driver directly — see `src/lib/db.ts`.
