// app/pricing/layout.tsx
// Server layout for /pricing. The page itself is a client component (it can't
// export metadata), so page-specific SEO — title, description, canonical and
// JSON-LD structured data — lives here.
import type { Metadata } from 'next';
import { BUNDLES } from '@/lib/bundles';
import { PRICING_FAQ } from '@/lib/pricingMatrix';

export const metadata: Metadata = {
  title: 'Landlord Pricing & Fees | House of Lettings, Leeds & Manchester',
  description:
    'Clear landlord pricing from House of Lettings. Tenant Find from £399 and full Management from 6% of rent, all inclusive of VAT with no hidden fees. Compare every package side by side.',
  alternates: { canonical: '/pricing' },
  openGraph: {
    title: 'Landlord Pricing & Fees | House of Lettings',
    description:
      'Tenant Find and Management packages for landlords in Leeds and Manchester. Transparent, VAT-inclusive pricing with no hidden fees.',
    url: 'https://www.houseoflettings.uk/pricing',
    siteName: 'House of Lettings',
    images: [
      { url: '/images/heropage-og.jpg', width: 1200, height: 630, alt: 'House of Lettings landlord pricing' },
    ],
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Landlord Pricing & Fees | House of Lettings',
    description:
      'Transparent, VAT-inclusive landlord pricing. Tenant Find and Management packages in Leeds and Manchester.',
    images: ['/images/heropage-og.jpg'],
  },
};

// FAQPage rich result, driven by the same FAQ shown on the page.
const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: PRICING_FAQ.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
};

// Offer catalogue for the five packages, so search engines understand the
// products and their starting prices.
const offerCatalogSchema = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Landlord letting and property management packages',
  serviceType: 'Residential letting and property management',
  areaServed: ['Leeds', 'Manchester'],
  provider: {
    '@type': 'RealEstateAgent',
    name: 'House of Lettings',
    url: 'https://www.houseoflettings.uk',
  },
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Landlord packages',
    itemListElement: BUNDLES.map((b) => ({
      '@type': 'Offer',
      name: b.label,
      category: b.kind,
      priceCurrency: 'GBP',
      price: b.setupFee.replace(/[^0-9.]/g, ''),
      description: b.mgmtFee ? `${b.mgmtFee} of monthly rent ongoing, plus a ${b.setupFee} one time fee. Inclusive of VAT.` : `${b.setupFee} one time fee, no ongoing fee. Inclusive of VAT.`,
    })),
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(offerCatalogSchema) }} />
      {children}
    </>
  );
}
