// app/layout.tsx
import type { Metadata } from 'next';
import ReactDOM from 'react-dom';
import { AuthProvider } from '@/hooks/useAuth';
import CookieBanner from '@/components/CookieBanner';
import './globals.css';

// The whole codebase references the literal family names 'Poppins' and
// 'Barlow Condensed' in hundreds of inline styles, so the fonts must be
// registered under those exact names. We load them via preconnect + preinit
// (parallel, non-chained — faster than a CSS @import) rather than next/font,
// which only exposes hashed family names. Barlow is trimmed to the single
// weight (700) actually used by the hero.
const GOOGLE_FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&family=Barlow+Condensed:wght@700&display=swap';

export const metadata: Metadata = {
  title: 'House of Lettings | Letting Agents in Leeds & Manchester',
  description:
    'Award-winning letting agents in Leeds and Manchester. Transparent pricing from £499. Free valuations, full property management, and tenant find services. No hidden fees.',
  metadataBase: new URL('https://www.houseoflettings.uk'),
  openGraph: {
    title: 'House of Lettings | Letting Agents in Leeds & Manchester',
    description:
      'Transparent pricing. No hidden fees. Free valuation from local experts in Leeds & Manchester.',
    url: 'https://www.houseoflettings.uk',
    siteName: 'House of Lettings',
    images: [
      {
        url: '/images/heropage-og.jpg',
        width: 1200,
        height: 630,
        alt: 'House of Lettings: Letting Agents in Leeds & Manchester',
      },
    ],
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'House of Lettings | Letting Agents in Leeds & Manchester',
    description: 'Transparent pricing. No hidden fees. Free valuation from local experts.',
    images: ['/images/heropage-og.jpg'],
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
};

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'RealEstateAgent',
  name: 'House of Lettings',
  url: 'https://www.houseoflettings.uk',
  logo: 'https://www.houseoflettings.uk/images/logo_HOL_tight.png',
  image: 'https://www.houseoflettings.uk/images/logo_HOL_tight.png',
  description:
    'Letting agents in Leeds and Manchester. Transparent pricing, free valuations, full property management and tenant find services.',
  areaServed: ['Leeds', 'Manchester'],
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Leeds',
    addressRegion: 'West Yorkshire',
    addressCountry: 'GB',
  },
  priceRange: '££',
  sameAs: [],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Preload the hero background so it starts downloading before CSS is parsed (helps LCP).
  // ReactDOM.preload injects the <link> into <head> during SSR without a body DOM node,
  // avoiding hydration structure mismatches. The hero is a static ~52KB WebP background
  // (not next/image) — preloading the raw file is the fastest path to the LCP paint.
  ReactDOM.preload('/images/heropage.webp', { as: 'image', fetchPriority: 'high' });
  // Open the font-CDN connections early and load the stylesheet in parallel.
  ReactDOM.preconnect('https://fonts.googleapis.com');
  ReactDOM.preconnect('https://fonts.gstatic.com', { crossOrigin: 'anonymous' });
  ReactDOM.preinit(GOOGLE_FONTS_HREF, { as: 'style' });

  return (
    <html lang="en">
      <body style={{ paddingTop: '72px' }}>
        <AuthProvider>
          {children}
        </AuthProvider>
        <CookieBanner />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
      </body>
    </html>
  );
}
