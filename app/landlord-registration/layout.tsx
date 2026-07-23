// app/landlord-registration/layout.tsx
// Server layout for /landlord-registration. The page itself is a client
// component (it can't export metadata), so page-level SEO lives here: title,
// description, canonical, Open Graph and Twitter. This layout also wraps the
// nested /apply, /forms and /joint routes, each of which exports its own
// metadata that overrides these defaults. The FAQ + RealEstateAgent JSON-LD is
// NOT placed here (it would leak onto those form routes); it is rendered inside
// the landing page component instead so it stays scoped to this page.
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Landlord Registration | House of Lettings, Leeds & Manchester',
  description:
    'Register your rental property with House of Lettings in minutes. Choose a management bundle, e-sign your agreement online and receive a tailored proposal within 24 to 48 hours. Free, with no obligation.',
  alternates: { canonical: '/landlord-registration' },
  openGraph: {
    title: 'Landlord Registration | House of Lettings',
    description:
      'Register your rental property in minutes. Free, no obligation, response within 24 to 48 hours across Leeds and Manchester.',
    url: 'https://www.houseoflettings.uk/landlord-registration',
    siteName: 'House of Lettings',
    images: [
      { url: '/images/heropage-og.jpg', width: 1200, height: 630, alt: 'Register your property with House of Lettings' },
    ],
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Landlord Registration | House of Lettings',
    description:
      'Register your rental property in minutes. Free, no obligation, response within 24 to 48 hours.',
    images: ['/images/heropage-og.jpg'],
  },
};

export default function LandlordRegistrationLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
