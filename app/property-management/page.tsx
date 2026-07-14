// app/property-management/page.tsx
// Server component: SEO metadata + FAQPage JSON-LD, then the client page.
import type { Metadata } from 'next';
import PropertyManagementClient from './PropertyManagementClient';

export const metadata: Metadata = {
  title: 'Property Management in Leeds & Manchester | House of Lettings',
  description:
    "Fully managed lettings in Leeds and Manchester: tenant finding, rent collection, maintenance, and full Renters' Rights Act 2025 compliance. One fixed fee, no hidden charges.",
  alternates: {
    canonical: 'https://www.houseoflettings.uk/property-management',
  },
};

const faqs = [
  {
    q: 'How much does full property management cost?',
    a: 'Our fully managed service is typically 10-14% of monthly rent (inc. VAT). We are transparent, with no hidden fees, no renewal charges, and no mark-ups on maintenance.',
  },
  {
    q: 'Can I switch to House of Lettings from another agent?',
    a: 'Yes. We handle the transfer from your current agent, including notifying tenants and updating payment details. Most switches complete within 5-10 working days.',
  },
  {
    q: 'What happens if my property is empty (void period)?',
    a: 'We proactively market your property from 2 months before any tenancy ends to minimise void periods. We also advise on realistic market rents to keep your property competitive.',
  },
  {
    q: "How do you handle the Renters' Rights Act changes?",
    a: "We are fully up to date with the Renters' Rights Act 2025 (in force from 1 May 2026). We handle all Section 13 rent increase notices, provide the required Information Sheet to tenants, manage Section 8 proceedings, and ensure your tenancy agreements comply with the new periodic tenancy rules.",
  },
  {
    q: 'Who carries out maintenance and repairs?',
    a: 'We have a network of vetted local tradespeople across Leeds and Manchester. For works under an agreed threshold (typically £250), we instruct repairs immediately without waiting for approval, keeping your tenants happy and your property in good condition.',
  },
  {
    q: 'How are rental payments handled?',
    a: 'Rent is collected from tenants and transferred directly to your nominated bank account, usually within 1-3 working days of receipt. You also receive a monthly statement with a full breakdown.',
  },
  {
    q: 'Do you handle deposit protection?',
    a: 'Yes. All deposits are registered with a government-approved deposit protection scheme (DPS or TDS) within 30 days of receipt, as legally required. We manage the full end-of-tenancy deposit return or dispute process on your behalf.',
  },
  {
    q: 'What certifications do you handle?',
    a: 'We arrange and track all mandatory safety certificates: Gas Safety Record (annual), Electrical Installation Condition Report (EICR) every 5 years, Energy Performance Certificate (EPC), and where applicable, Legionella Risk Assessment and PAT testing for furnished properties.',
  },
];

export default function PropertyManagementPage() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <PropertyManagementClient />
    </>
  );
}
