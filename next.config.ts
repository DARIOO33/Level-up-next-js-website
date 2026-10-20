import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Every page reads the session/language cookie and live stock, so the app renders
  // on demand. (Cache Components can be adopted later; nothing here depends on it.)
  cacheComponents: false,
  // The Prisma 8 runtime and the MongoDB driver are plain Node packages — keep them out of the bundle.
  serverExternalPackages: ['mongodb', '@prisma/orm-mongo', '@prisma/orm-family-mongo', '@prisma/orm-target-mongo', '@prisma/orm-framework'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          // Same policy as the old site. Product images may come from any https host.
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // connect.facebook.net: Meta Pixel (fbevents.js) + its beacon/worker scripts.
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://connect.facebook.net",
              "style-src 'self' 'unsafe-inline'",
              "font-src 'self' data:",
              "img-src 'self' data: blob: https: http://localhost:*",
              "connect-src 'self' https://www.facebook.com https://*.facebook.com https://*.facebook.net" + (process.env.NODE_ENV === 'development' ? ' ws: wss:' : ''),
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
