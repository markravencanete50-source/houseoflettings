// app/page.tsx — Homepage server wrapper (SEO metadata + structured data).
// The interactive page lives in ./HomeClient.
import type { Metadata } from 'next';
import HomeClient from './HomeClient';

export const metadata: Metadata = {
  title: 'House of Lettings | Letting Agents in Leeds & Manchester',
  description:
    'Award-winning letting agents in Leeds and Manchester. Transparent pricing from £499, free valuations, full property management and tenant find services. No hidden fees, fully Renters’ Rights Act compliant.',
  alternates: { canonical: 'https://www.houseoflettings.uk/' },
};

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'House of Lettings',
  url: 'https://www.houseoflettings.uk',
  inLanguage: 'en-GB',
  publisher: { '@type': 'RealEstateAgent', name: 'House of Lettings' },
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <HomeClient />
    </>
  );
}
