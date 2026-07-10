// app/additional-services/layout.tsx
// Server layout for /additional-services. The page is a client component (it
// can't export metadata), so page-specific SEO — title, description, canonical
// and JSON-LD — lives here.
import type { Metadata } from 'next';
import { SERVICE_CATEGORIES } from '@/lib/additionalServices';
import { CartProvider } from '@/components/services/CartProvider';

export const metadata: Metadata = {
  title: 'Additional Landlord Services & Prices | House of Lettings',
  description:
    'Order individual landlord services from House of Lettings: inventories and handovers, professional photography, referencing, gas and electrical certificates, inspections and more. Transparent prices, inclusive of VAT.',
  alternates: { canonical: '/additional-services' },
  openGraph: {
    title: 'Additional Landlord Services & Prices | House of Lettings',
    description:
      'Order any letting service individually, with or without a management package. Transparent, VAT-inclusive prices in Leeds and Manchester.',
    url: 'https://www.houseoflettings.uk/additional-services',
    siteName: 'House of Lettings',
    images: [
      { url: '/images/heropage-og.jpg', width: 1200, height: 630, alt: 'House of Lettings additional services' },
    ],
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Additional Landlord Services & Prices | House of Lettings',
    description: 'Order any letting service individually. Transparent, VAT-inclusive prices in Leeds and Manchester.',
    images: ['/images/heropage-og.jpg'],
  },
};

// Offer catalogue so search engines understand the individual services on offer.
const offerCatalogSchema = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Additional landlord services',
  serviceType: 'Residential lettings services',
  areaServed: ['Leeds', 'Manchester'],
  provider: {
    '@type': 'RealEstateAgent',
    name: 'House of Lettings',
    url: 'https://www.houseoflettings.uk',
  },
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'A la carte services',
    itemListElement: SERVICE_CATEGORIES.flatMap((cat) =>
      cat.services.map((s) => ({
        '@type': 'Offer',
        name: s.name,
        category: cat.title,
        priceCurrency: 'GBP',
        price: (s.price.match(/[\d.,]+/)?.[0] || '').replace(/,/g, ''),
        description: s.tagline,
      }))
    ),
  },
};

export default function AdditionalServicesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(offerCatalogSchema) }} />
      <CartProvider>{children}</CartProvider>
    </>
  );
}
