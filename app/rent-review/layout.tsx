// app/rent-review/layout.tsx
// Server layout for the rent-review routes. The pages are client components (so
// they can't export metadata), so page-level SEO + JSON-LD structured data
// lives here. Deliberately NO canonical is set here: this layout also wraps the
// /rent-review/apply form, and a shared canonical would wrongly point the form
// at the overview.
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Rent Reviews Explained, Fair & Transparent | House of Lettings',
  description:
    'How House of Lettings handles annual rent reviews for tenants, market-based, evidence-led and decided online with no cold calls. See the simple 4-step process.',
  openGraph: {
    title: 'Rent Reviews, Fair & Transparent | House of Lettings',
    description:
      'Annual rent reviews for tenants in Leeds and Manchester, benchmarked against the local market, with the evidence shown and the decision made online.',
    url: 'https://www.houseoflettings.uk/rent-review',
    siteName: 'House of Lettings',
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Rent Reviews, Fair & Transparent | House of Lettings',
    description:
      'Annual rent reviews for tenants, benchmarked against the local market, with the evidence shown and the decision made online.',
  },
};

// Breadcrumb so search + answer engines place the page in the site tree.
const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.houseoflettings.uk/' },
    { '@type': 'ListItem', position: 2, name: 'Rent Review', item: 'https://www.houseoflettings.uk/rent-review' },
  ],
};

// FAQ structured data — the same 5 questions shown on the page. FAQ rich
// results were deprecated in 2026, so this is for answer engines (AI Overviews,
// LLM answers) and semantics, not blue-link stars. Answers kept concise.
const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Why is my rent being reviewed?',
      acceptedAnswer: { '@type': 'Answer', text: 'Your rent is checked once a year, usually at renewal, against local market evidence so it stays fair on both sides, with the reasoning shown to you and the decision made online.' },
    },
    {
      '@type': 'Question',
      name: 'Does a review always mean my rent goes up?',
      acceptedAnswer: { '@type': 'Answer', text: 'No. Depending on the local market the proposed rent may rise modestly or stay the same. Whatever the outcome, we show you the evidence behind it.' },
    },
    {
      '@type': 'Question',
      name: 'What if I don’t agree with the proposed rent?',
      acceptedAnswer: { '@type': 'Answer', text: 'Choose “I’d like to discuss the rent”, tell us the figure you feel is fair and why, and your property manager will talk it through with you before anything is finalised.' },
    },
    {
      '@type': 'Question',
      name: 'How often do rent reviews happen?',
      acceptedAnswer: { '@type': 'Answer', text: 'Typically every 12 months, in line with your tenancy renewal. We always contact you in good time rather than springing it on you.' },
    },
    {
      '@type': 'Question',
      name: 'Why do you ask for documents again?',
      acceptedAnswer: { '@type': 'Answer', text: 'A renewal is a good moment to refresh your referencing. Recent bank statements, payslips and ID confirm your circumstances are up to date, and you can upload everything securely online in a few minutes.' },
    },
  ],
};

export default function RentReviewLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      {children}
    </>
  );
}
