// app/layout.tsx
import type { Metadata } from 'next';
import ReactDOM from 'react-dom';
import { Poppins } from 'next/font/google';
import { AuthProvider } from '@/hooks/useAuth';
import CookieBanner from '@/components/CookieBanner';
import './globals.css';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
});

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
        alt: 'House of Lettings – Letting Agents in Leeds & Manchester',
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
  // avoiding hydration structure mismatches.
  ReactDOM.preload('/images/heropage.webp', { as: 'image', fetchPriority: 'high' });

  return (
    <html lang="en" className={poppins.variable}>
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
