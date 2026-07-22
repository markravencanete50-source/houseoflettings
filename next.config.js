// The Content-Security-Policy is set per-request in middleware.ts (it needs a
// per-request nonce for Next's inline scripts). Everything else lives here.
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()' },
  // Cut window.opener ties to any popup/tab we open (allow-popups keeps
  // outbound target="_blank" links working) and refuse Flash/PDF cross-domain
  // policy probing.
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
  { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
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
      {
        // The sign-agreement flow was merged into Landlord Registration.
        // Query strings are preserved, so old emailed re-issue links
        // (?agreementId=&token=) still land on the merged form.
        source: '/landlord-agreement',
        destination: '/landlord-registration/apply',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
