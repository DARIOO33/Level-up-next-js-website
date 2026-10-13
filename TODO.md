# Level Up TN — to do before going live

Real values go in `.env.local` (your machine) and in the hosting provider's
environment-variable settings (live site). Never put real values in `.env.example`.

## 1. Fill in `.env.local`

Already set: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_SITE_URL`.

- [ ] `GMAIL_USER`, `GMAIL_APP_PASSWORD` — order emails, password-reset and verification codes
      (without them no emails are sent; codes only appear in the server log)
- [ ] `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — product image uploads in the admin panel
- [ ] `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` — "Sign in with Google"
      (the secret is new; get it from the same OAuth client in Google Cloud Console)
- [ ] Optional: `NEXT_PUBLIC_INSTAGRAM_URL`, `NEXT_PUBLIC_FACEBOOK_URL`, `NEXT_PUBLIC_TIKTOK_URL`, `GOOGLE_SITE_VERIFICATION`

## 2. Prepare existing accounts

- [ ] Run `npm run auth:migrate` once (only adds an `accounts` collection and indexes; safe to re-run)

## 3. Test locally (`npm run dev`, http://localhost:3000)

This is the live database: test orders and edits are real, delete them afterwards.

- [ ] Log in with the owner account and open `/admin`
- [ ] Add or edit a product with an image (tests Cloudinary)
- [ ] Place a test order and check the confirmation email arrives (tests Gmail)
- [ ] Try "forgot password"
- [ ] Try Google sign-in
- [ ] Delete the test order / test product

## 4. Deploy

- [ ] Commit the code, create a GitHub repo and push to it (no remote is set up yet)
- [ ] Pick a host that runs Node (Vercel is the simplest for Next.js); build command `npm run build`
- [ ] Copy every variable from `.env.local` into the host's settings, changing
      `BETTER_AUTH_URL` and `NEXT_PUBLIC_SITE_URL` to the real domain (`https://`, no trailing slash)
- [ ] Add the redirect URI in Google Cloud Console: `https://your-domain/api/auth/callback/google`
      (and `http://localhost:3000/api/auth/callback/google` for local Google sign-in)
- [ ] Allow the host in MongoDB Atlas → Network Access (for Vercel usually `0.0.0.0/0`)
- [ ] Check the deployed site, then point the domain at the new host
- [ ] Switch off the old backend and frontend

After the switch everyone signs in once more (old sessions don't carry over); carts in customers' browsers do.
