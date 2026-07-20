// app/branches/manchester/page.tsx
// Manchester branch OFFICE page. Static route, takes precedence over the
// dynamic [slug] neighbourhood route.
import type { Metadata } from 'next';
import BranchOffice from '@/components/branches/BranchOffice';
import Footer from '@/components/layout/Footer';
import { CITY_CONTENT } from '@/lib/branches';

const BASE = 'https://www.houseoflettings.uk';
const c = CITY_CONTENT.Manchester;

export const metadata: Metadata = {
  title: c.seoTitle,
  description: c.seoDescription,
  alternates: { canonical: `${BASE}/branches/manchester` },
  openGraph: {
    title: c.seoTitle,
    description: c.seoDescription,
    url: `${BASE}/branches/manchester`,
    siteName: 'House of Lettings',
    images: [{ url: '/images/heropage-og.jpg', width: 1200, height: 630, alt: 'House of Lettings Manchester branch' }],
    locale: 'en_GB',
    type: 'website',
  },
};

export default function ManchesterBranchPage() {
  return (<><BranchOffice city="Manchester" /><Footer /></>);
}
