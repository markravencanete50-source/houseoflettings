const isDev = process.env.NODE_ENV === 'development';

// Content-Security-Policy — every external origin the site actually uses.
// script: Next.js inline bootstrap ('unsafe-inline') + Google Maps Places.
// style/font: Google Fonts (loaded via <link>/@import by convention).
// img: Cloudinary, Unsplash, Firebase Storage, Google Maps tiles.
// connect: Firebase Auth/Firestore/Storage (*.googleapis.com), direct-to-Cloudinary uploads.
// frame: Google Maps embeds + the landlord-matching valuation widget.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} https://maps.googleapis.com https://maps.gstatic.com`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://res.cloudinary.com https://images.unsplash.com https://*.googleapis.com https://*.gstatic.com https://*.ggpht.com https://*.googleusercontent.com",
  "media-src 'self' blob: https://res.cloudinary.com",
  `connect-src 'self' https://*.googleapis.com https://api.cloudinary.com https://res.cloudinary.com${isDev ? ' ws:' : ''}`,
  'frame-src https://www.google.com https://landlord-matching.vercel.app',
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  'upgrade-insecure-requests',
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()' },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'images.unsplash.com',
      'firebasestorage.googleapis.com',
      'res.cloudinary.com',
    ],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60 * 60 * 24 * 7,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        // Keep the team/admin area out of search engines entirely.
        source: '/(admin-login|login|admin|dashboard)/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
      {
        source: '/(admin-login|login|admin|dashboard)',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/properties',
        destination: '/listings',
        permanent: true,
      },
      {
        source: '/properties/:path*',
        destination: '/listings',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
