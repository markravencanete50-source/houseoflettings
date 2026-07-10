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
