// app/branches/leeds/page.tsx
// Leeds branch OFFICE page. This static route takes precedence over the
// dynamic [slug] neighbourhood route, so /branches/leeds renders the office
// page while /branches/headingley etc. still render the area pages.
import type { Metadata } from 'next';
import BranchOffice from '@/components/branches/BranchOffice';
import { CITY_CONTENT } from '@/lib/branches';

const BASE = 'https://www.houseoflettings.uk';
const c = CITY_CONTENT.Leeds;

export const metadata: Metadata = {
  title: c.seoTitle,
  description: c.seoDescription,
  alternates: { canonical: `${BASE}/branches/leeds` },
  openGraph: {
    title: c.seoTitle,
    description: c.seoDescription,
    url: `${BASE}/branches/leeds`,
    siteName: 'House of Lettings',
    images: [{ url: '/images/heropage-og.jpg', width: 1200, height: 630, alt: 'House of Lettings Leeds branch' }],
    locale: 'en_GB',
    type: 'website',
  },
};

export default function LeedsBranchPage() {
  return <BranchOffice city="Leeds" />;
}
