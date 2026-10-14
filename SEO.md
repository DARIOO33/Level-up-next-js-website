# SEO guide — Level Up TN

Target: people in Tunisia (gamers, music lovers) searching for IEMs.
Main searches: `iem`, `iem tunisie`, `kz iem`, `kz tunisie`, `in ear monitor`, `<model> prix tunisie`.

## 1. What the site already does

| Page | Aimed at |
|---|---|
| `/` | `iem tunisie`, `in ear monitor` |
| `/shop?cat=iems` | `iem tunisie`, `iems tunisie` (category landing page) |
| `/fr/...` (French version of all of the above) | `écouteurs intra-auriculaires tunisie`, `iem tunisie prix`, `kz tunisie` |
| `/brands/kz`, `/brands/7hz`, `/brands/moondrop` | `kz tunisie`, `kz iem`, `7hz tunisie`, … |
| `/product/<slug>` | `<model> tunisie`, `<model> prix` |

Also in place: `sitemap.xml` (pages, products, product images), `robots.txt`, one canonical URL per page, and
structured data (Organization, WebSite, Product with price/stock/reviews, Breadcrumb, FAQ).

## 2. Set up Google Search Console (once)

1. Go to <https://search.google.com/search-console> and click **Add property**.
2. Choose **Domain** and enter `levelup-store.tn`. This covers `www`, non-`www`, http and https together.
3. Google shows a `TXT` record. Add it at your domain registrar (DNS settings), wait a few minutes, click **Verify**.
   - Alternative without DNS: choose **URL prefix** `https://www.levelup-store.tn`, pick the **HTML tag** method,
     copy only the `content="…"` value into the `GOOGLE_SITE_VERIFICATION` variable on Vercel, redeploy, then verify.
4. Open **Sitemaps**, enter `sitemap.xml`, click **Submit**. Status should become **Success** within a day.
5. A few days later, open **Settings → Crawl stats** to confirm Google is fetching pages without errors.

## 3. Get the important pages indexed (first week)

Paste each URL into the search bar at the top (**URL inspection**) and click **Request indexing**:

- `https://www.levelup-store.tn/`
- `https://www.levelup-store.tn/shop?cat=iems`
- `https://www.levelup-store.tn/brands/kz`
- your 5 best-selling product pages

Google allows about 10 requests a day. Everything else is picked up from the sitemap.

## 4. Weekly routine (15 minutes)

### Performance → Search results
- Set **Country: Tunisia** and **Date: last 28 days**. Tick **Average position** and **Average CTR**.
- **Queries tab**: this is the real list of what people type. Look for three things:
  - *Position 5–20 with many impressions*: you are close. Put that exact phrase in the page's title, first
    paragraph and one heading.
  - *Position 1–5 with CTR under 3%*: people see you but don't click. Rewrite the title/description to be more
    concrete (price in TND, "livraison gratuite", "paiement à la livraison").
  - *Queries you have no page for* (for example `meilleur iem gaming`): write a page for it (see section 6).
- **Pages tab**: click a page, then switch back to **Queries** to see which searches that page ranks for.

### Indexing → Pages
- **Indexed** should grow to roughly the number of URLs in the sitemap.
- Reasons you can ignore: *Excluded by noindex* and *Blocked by robots.txt* for `/login`, `/cart`, `/checkout`,
  `/orders`, `/profile`, `/admin`. Those are blocked on purpose.
- Reasons to act on:
  - *Crawled – currently not indexed* on a product: the description is too thin. Write 150+ words of your own
    text (sound signature, who it is for, gaming vs music, what is in the box).
  - *Duplicate without user-selected canonical*: tell me which URL; it means two URLs show the same content.
  - *Not found (404)*: an old link. If the product moved, I can add a redirect.

### Shopping → Product snippets / Merchant listings
- Lists every product page whose price/stock data Google read. Fix anything under **Invalid**.
- Warnings about optional fields (for example `gtin`) can be left.

### Experience → Core Web Vitals
- Needs a few weeks of real visitors before it shows data. Aim for **Good** on mobile.
- The usual cause of "Poor" is heavy product photos: upload images under about 300 KB.

### Links
- **Top linking sites** shows who links to you. More Tunisian sites linking to you = better ranking.

## 5. Things to do outside the code

1. **Fix the non-www redirect.** `https://levelup-store.tn` currently redirects to `www` with a *temporary* (307)
   redirect. In Vercel → Project → Settings → Domains, edit `levelup-store.tn` and set it to redirect to
   `www.levelup-store.tn` with **308 Permanent**. Temporary redirects pass ranking signals less reliably.
2. **Google Business Profile** (<https://business.google.com>): create a profile for Level Up TN as an online
   store serving Tunisia. It is what shows on the right side when someone searches the store name.
3. **Product descriptions**: unique text per product, in your own words, never copied from the manufacturer or
   AliExpress. Mention the use case ("gaming", "FPS", "musique", "basses") naturally.
4. **Product photos**: give each a descriptive file name before uploading (`kz-castor-black.jpg`).
5. **Backlinks**: link the site from your Instagram, Facebook and TikTok bios, and ask Tunisian tech/gaming
   pages, Discord servers and Facebook groups to link to a specific page (a product or the KZ guide).
6. **Reviews**: keep sending the review link after delivery. Product pages with reviews are eligible to show star ratings in Google.

## 6. Content worth adding

Each of these is a page that can rank for a search nobody in Tunisia is answering well:

- A guide in French: *Meilleur IEM pour le gaming en Tunisie (2026)*.
- *IEM c'est quoi ? Guide du débutant* (answers `iem`, `in ear monitor`, `c'est quoi un iem`).
- *KZ : quel modèle choisir ?* — comparison of the KZ models you stock, with prices.
- More brand pages when you stock them (CCA, TRN, Simgot, Truthear).

## 7. French and English versions

Every page exists at two addresses: English at the plain URL and French under `/fr`
(`/shop` and `/fr/shop`, `/brands/kz` and `/fr/brands/kz`, …). Each one tells Google about the other
(hreflang), and the sitemap lists both.

- In Search Console, request indexing for `https://www.levelup-store.tn/fr`,
  `/fr/shop?cat=iems` and `/fr/brands/kz` as well (section 3).
- In **Performance**, add the filter **Page → URLs containing `/fr`** to see how the French pages do on their own.
- Each product has an English and a French description in the admin panel (Products → Edit). The French one is
  what `/fr/product/...` shows, in the page text, the Google snippet and the structured data. Left empty, the
  French page falls back to the English text — then it looks like a copy of the English page and Google often
  indexes only one of the two. Fill in the French description for every product, starting with the best sellers.
- Specs work the same way: under each spec there is a French name and value. Common names (Driver, Impedance,
  Sensitivity, Cable, …) are translated automatically, so usually only values with words in them need French.
- The three brand guides are fully translated in `src/lib/brands-fr.ts`. If you edit a guide in
  `src/lib/brands.ts`, update the French one too.

## 8. What not to expect

- New sites take 2–8 weeks to settle in Google. Positions move a lot during that time.
- The `keywords` meta tag has no effect on Google. Titles, headings, real text and links do.
- Ranking first for the single word `iem` worldwide is unrealistic; `iem tunisie` and `kz tunisie` are achievable
  because few local sites compete.
