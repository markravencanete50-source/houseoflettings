// app/landlords/page.tsx: Landlords server wrapper (SEO metadata + FAQ structured data).
// The interactive redesign lives in ./LandlordsClient.
import type { Metadata } from 'next';
import LandlordsClient from './LandlordsClient';
import { landlordFaqs } from './landlordFaqs';

export const metadata: Metadata = {
  title: 'Landlord Services & Lettings Packages | House of Lettings, Leeds & Manchester',
  description:
    'Letting agents for landlords in Leeds and Manchester. Tenant find from £399, fully managed from 6% of rent, all inclusive of VAT with no hidden fees. Free valuations, full compliance and rent collection on a rolling monthly contract.',
  alternates: { canonical: 'https://www.houseoflettings.uk/landlords' },
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: landlordFaqs.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
};

export default function LandlordsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <LandlordsClient />
    </>
  );
}
