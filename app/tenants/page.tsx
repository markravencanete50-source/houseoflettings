// app/tenants/page.tsx - Server component: SEO metadata + FAQPage JSON-LD.
// The interactive UI lives in TenantsClient (redesign frames 1e / 1g).
import type { Metadata } from 'next';
import TenantsClient from './TenantsClient';
import { TENANT_FAQS } from './faqs';

export const metadata: Metadata = {
  title: 'Renting in Leeds & Manchester | No Tenant Fees | House of Lettings',
  description:
    'Find your next home with House of Lettings. No agency fees, no viewing fees, and no long forms. Send an enquiry, book a viewing, and move in across Leeds and Manchester.',
  alternates: { canonical: 'https://www.houseoflettings.uk/tenants' },
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: TENANT_FAQS.map((faq) => ({
    '@type': 'Question',
    name: faq.q,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.a,
    },
  })),
};

export default function TenantsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <TenantsClient />
    </>
  );
}
