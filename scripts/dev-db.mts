/**
 * Local preview database: boots an in-memory MongoDB 8 replica set on port 27018
 * and fills it with documents shaped exactly like the old Mongoose backend wrote
 * them. Nothing here touches your real database.
 *
 *   npm run dev:db          (leave it running, then `npm run dev` in another terminal)
 *
 * Demo logins:  owner@levelup.tn / owner123   ·   client@levelup.tn / client123
 */
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { MongoClient, ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';

const PORT = Number(process.env.DEV_DB_PORT ?? 27018);
const replSet = await MongoMemoryReplSet.create({
  replSet: { count: 1, name: 'rs0' },
  instanceOpts: [{ port: PORT }],
  binary: { version: '8.0.4' },
});
const uri = `mongodb://127.0.0.1:${PORT}/levelup?replicaSet=rs0&directConnection=true`;
const client = new MongoClient(uri);
await client.connect();
const db = client.db('levelup');

/** Tiny inline artwork so the preview needs no image host. */
const art = (label: string, hue: number) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600"><defs><radialGradient id="g" cx="50%" cy="38%" r="70%"><stop offset="0" stop-color="hsl(${hue} 85% 62%)"/><stop offset="1" stop-color="hsl(${hue + 30} 60% 12%)"/></radialGradient></defs><rect width="600" height="600" fill="url(#g)"/><g fill="none" stroke="rgba(255,255,255,.55)" stroke-width="10"><path d="M210 250c0-70 60-110 120-90s80 80 60 140-50 90-90 120-80 10-100-40-0-90 10-130z"/><circle cx="300" cy="290" r="46"/><path d="M390 200c60-40 110 0 110 70v150" stroke-linecap="round"/></g><text x="300" y="540" text-anchor="middle" font-family="monospace" font-size="26" fill="rgba(255,255,255,.8)" letter-spacing="4">${label}</text></svg>`,
  )}`;

const now = Date.now();
const daysAgo = (d: number) => new Date(now - d * 86_400_000);
const stamp = (d: number) => ({ createdAt: daysAgo(d), updatedAt: daysAgo(d), __v: 0 });

const product = (o: { name: string; slug?: string; category: string; sub: string; featured?: boolean; hue: number; desc: string; variants: [string, number, number][]; specs?: Record<string, string>; age: number }) => ({
  _id: new ObjectId(),
  name: o.name,
  ...(o.slug ? { slug: o.slug } : {}),
  description: o.desc,
  featured: Boolean(o.featured),
  category: o.category,
  subCategory: o.sub,
  images: [art(o.name.toUpperCase().slice(0, 18), o.hue), art('DETAIL', o.hue + 40)],
  variants: o.variants.map(([title, price, stock], i) => ({ _id: new ObjectId(), title, price, stock, image: art(title.toUpperCase().slice(0, 18), o.hue + i * 25) })),
  specifications: o.specs ?? {},
  stockWatchers: [],
  ...stamp(o.age),
});

const products = [
  product({ name: 'KZ ZSN Pro X', slug: 'kz-zsn-pro-x', category: 'iems', sub: 'KZ', featured: true, hue: 265, age: 3, desc: 'Hybrid 1BA + 1DD IEM with an energetic V-shaped tuning. A favourite first IEM for gaming and pop.', variants: [['Black, no mic', 69, 12], ['Black, with mic', 75, 4], ['Gold, with mic', 75, 0]], specs: { Driver: '1BA + 1DD hybrid', Impedance: '25Ω', Sensitivity: '112dB', Connector: '0.75mm 2-pin', Cable: '1.2m silver-plated' } }),
  product({ name: '7Hz x Crinacle Zero: 2', slug: '7hz-zero-2', category: 'iems', sub: '7HZ', featured: true, hue: 170, age: 6, desc: 'Refined collaboration IEM tuned for smooth, natural sound with improved bass response.', variants: [['Silver', 159, 6], ['Blue', 159, 2], ['Orange', 159, 3]], specs: { Driver: '10mm dynamic', Impedance: '32Ω', Sensitivity: '108dB', Connector: '0.78mm 2-pin', Signature: 'Neutral-warm' } }),
  product({ name: 'Moondrop Chu II', slug: 'moondrop-chu-2', category: 'iems', sub: 'Moondrop', featured: true, hue: 300, age: 9, desc: 'Budget benchmark with detachable cable and Moondrop’s VDSF target tuning.', variants: [['Standard', 95, 9]], specs: { Driver: '10mm Al-Mg dynamic', Impedance: '18Ω', Sensitivity: '119dB', Connector: '0.78mm 2-pin', Signature: 'Neutral' } }),
  product({ name: 'Simgot EW200', slug: 'simgot-ew200', category: 'iems', sub: 'Simgot', featured: true, hue: 30, age: 12, desc: 'Full-metal shell and SCP diaphragm — bright, detailed and wide.', variants: [['Mirror silver', 189, 5]], specs: { Driver: '10mm SCP dynamic', Impedance: '16Ω', Sensitivity: '126dB', Connector: '0.78mm 2-pin', Signature: 'Bright-neutral' } }),
  product({ name: 'KZ Castor Pro', slug: 'kz-castor-pro', category: 'iems', sub: 'KZ', hue: 220, age: 15, desc: 'Dual dynamic drivers with four tuning switches.', variants: [['Harman', 89, 0], ['Bass improved', 89, 0]], specs: { Driver: '2DD', Impedance: '31–35Ω', Connector: '0.75mm 2-pin' } }),
  product({ name: 'Truthear Hola', category: 'iems', sub: 'Truthear', hue: 200, age: 20, desc: 'Warm, easy-going single dynamic driver IEM. (This demo product has no slug, like older products in your database.)', variants: [['Black', 85, 7]], specs: { Driver: '11mm PU+LCP dynamic', Impedance: '28Ω' } }),
  product({ name: 'Upgrade Cable 8-core', slug: 'upgrade-cable-8-core', category: 'accessories', sub: 'cables', hue: 250, age: 18, desc: 'Silver-plated 8-core upgrade cable.', variants: [['0.75mm 2-pin · 3.5mm', 35, 14], ['0.78mm 2-pin · 4.4mm', 39, 8]] }),
  product({ name: 'Memory Foam Ear Tips (3 pairs)', slug: 'memory-foam-tips', category: 'accessories', sub: 'ear-tips', hue: 140, age: 22, desc: 'Slow-rebound foam tips for better isolation and bass.', variants: [['S', 12, 20], ['M', 12, 25], ['L', 12, 11]] }),
  product({ name: 'USB-C DAC Dongle', slug: 'usb-c-dac-dongle', category: 'accessories', sub: 'dac', hue: 280, age: 25, desc: 'Pocket DAC/amp, 32-bit/384kHz.', variants: [['3.5mm', 59, 6]], specs: { Chip: 'CX31993', Output: '60mW @ 32Ω' } }),
];
await db.collection('products').insertMany(products);

const pw = (plain: string) => bcrypt.hashSync(plain, 10);
const owner = { _id: new ObjectId(), name: 'Dario (owner)', email: 'owner@levelup.tn', password: pw('owner123'), authProvider: 'local', role: 'owner', orders: [], wishlist: [], notifications: [], shippingAddresses: [], tokenVersion: 0, ...stamp(200) };
const clientId = new ObjectId();
const orderIds = [new ObjectId(), new ObjectId(), new ObjectId(), new ObjectId()];
const clientUser = {
  _id: clientId, name: 'Amine Ben Salah', email: 'client@levelup.tn', phoneNumber: '+21620123456', password: pw('client123'), authProvider: 'local', role: 'user',
  orders: [orderIds[0], orderIds[1]], wishlist: [products[1]._id],
  notifications: [{ _id: new ObjectId(), title: 'Order Confirmed', message: 'Your order has been placed successfully.', type: 'order', isRead: false, createdAt: daysAgo(2), updatedAt: daysAgo(2) }],
  shippingAddresses: [{ _id: new ObjectId(), label: 'Home', fullname: 'Amine Ben Salah', phone: '+21620123456', address: '12 Rue de Marseille', governorate: 'Tunis', city: 'Bab Bhar', postalCode: '1000', isDefault: true }],
  tokenVersion: 0, ...stamp(90),
};
await db.collection('users').insertMany([owner, clientUser]);

const line = (p: (typeof products)[number], v = 0, quantity = 1) => ({ _id: new ObjectId(), product: p._id, variantID: p.variants[v]._id.toString(), quantity, productName: p.name, variantName: p.variants[v].title, variantImage: p.variants[v].image });
const customer = { fullname: 'Amine Ben Salah', email: 'client@levelup.tn', phone: '+21620123456', address: '12 Rue de Marseille Bab Bhar 1000 Tunis' };
await db.collection('orders').insertMany([
  { _id: orderIds[0], customer, items: [line(products[0]), line(products[6])], totalAmount: 104, couponCode: null, status: 'delivered', ...stamp(14) },
  { _id: orderIds[1], customer, items: [line(products[1], 1)], totalAmount: 159, couponCode: null, status: 'shipped', ...stamp(2) },
  { _id: orderIds[2], customer: { fullname: 'Guest Sarra', email: 'sarra@example.com', phone: '+21655111222', address: 'Sousse' }, items: [line(products[2])], totalAmount: 95, couponCode: 'WELCOME10', status: 'pending', ...stamp(0) },
  { _id: orderIds[3], customer: { fullname: 'Guest Mehdi', email: 'mehdi@example.com', phone: '+21698333444', address: 'Sfax' }, items: [line(products[3])], totalAmount: 189, couponCode: null, status: 'cancelled', ...stamp(5) },
]);

await db.collection('storereviews').insertMany([
  { name: 'Yassine', showName: true, rating: 5, comment: 'Arrived in two days, sealed box. The ZSN Pro X is unreal for the price — footsteps in Valorant are crystal clear.', source: 'website', productName: 'KZ ZSN Pro X', productId: products[0]._id, orderId: null, token: null, isApproved: true, ...stamp(10) },
  { name: 'Ines', showName: true, rating: 5, comment: 'Best customer service I have had from a Tunisian shop. They helped me pick between two IEMs on Instagram.', source: 'instagram', productName: null, productId: null, orderId: null, token: null, isApproved: true, ...stamp(20) },
  { name: null, showName: false, rating: 4, comment: 'Zero 2 is smooth and comfortable. Cable could be better but the sound is excellent.', source: 'website', productName: '7Hz x Crinacle Zero: 2', productId: products[1]._id, orderId: null, token: null, isApproved: true, ...stamp(30) },
  { name: 'Khalil', showName: true, rating: 5, comment: 'Livraison rapide et produit authentique. Je recommande !', source: 'facebook', productName: 'Moondrop Chu II', productId: products[2]._id, orderId: null, token: null, isApproved: true, ...stamp(40) },
  { name: 'Pending review', showName: true, rating: 3, comment: 'Waiting for approval in the admin panel.', source: 'website', productName: 'Simgot EW200', productId: products[3]._id, orderId: null, token: null, isApproved: false, ...stamp(1) },
  // A shipped order's one-time review link, as created by the admin flow:
  { showName: true, rating: null, comment: null, source: 'website', productName: products[1].name, productId: products[1]._id, orderId: orderIds[1], token: 'demo-review-token-0123456789abcdef0123456789abcdef', isApproved: false, ...stamp(2) },
]);

await db.collection('coupons').insertOne({ code: 'WELCOME10', type: 'percent', value: 10, minOrderAmount: 50, maxUses: null, usedCount: 1, expiresAt: null, isActive: true, ...stamp(60) });
await db.collection('sitesettings').insertOne({ brands: ['KZ', '7HZ', 'Moondrop', 'Simgot', 'Truthear', 'LETSHUOER', 'TinHiFi', 'Kinera', 'FiiO', 'Tangzu', 'BLON', 'Kiwi Ears', 'CCA'], deliveryPaused: false, deliveryNotice: '', ...stamp(100) });
await db.collection('activities').insertMany([
  { user: 'Dario (owner)', label: 'Admin Action', content: 'Added new product: "KZ ZSN Pro X"', ...stamp(3) },
  { user: 'Amine Ben Salah', label: 'User Action', content: 'New order #demo — 7Hz x Crinacle Zero: 2', ...stamp(2) },
]);
await db.collection('contactmessages').insertOne({ name: 'Rania', email: 'rania@example.com', message: 'Hello, do you have the Moondrop Aria in stock?', isRead: false, ...stamp(1) });
await db.collection('subscribers').insertOne({ email: 'fan@example.com', isVerified: true, otp: null, otpExpires: null, __v: 0 });

// The indexes Mongoose had created.
await db.collection('users').createIndex({ email: 1 }, { unique: true });
await db.collection('products').createIndex({ slug: 1 }, { unique: true, sparse: true });
await db.collection('coupons').createIndex({ code: 1 }, { unique: true });
await db.collection('subscribers').createIndex({ email: 1 }, { unique: true });

await client.close();
console.log(`\n  Preview database ready (in memory)\n  DATABASE_URL="${uri}"\n\n  owner@levelup.tn / owner123    client@levelup.tn / client123\n  Coupon: WELCOME10   ·   Review link: /review/demo-review-token-0123456789abcdef0123456789abcdef\n\n  Ctrl+C to stop.\n`);

const stop = async () => {
  await replSet.stop();
  process.exit(0);
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
setInterval(() => {}, 1 << 30);
