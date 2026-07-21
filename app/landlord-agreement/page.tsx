// app/landlord-agreement/page.tsx
// Server wrapper: SEO metadata + canonical, then the interactive sign form.
import type { Metadata } from 'next';
import { Suspense } from 'react';
import AgreementFormClient from './AgreementFormClient';

export const metadata: Metadata = {
  title: 'Sign Your Management Agreement | House of Lettings',
  description:
    'Review and electronically sign your Residential Lettings & Management Agreement with House of Lettings. Choose your service, accept the terms and sign online. No cost to sign.',
  alternates: { canonical: 'https://www.houseoflettings.uk/landlord-agreement' },
};

export default function LandlordAgreementPage() {
  return (
    <Suspense fallback={null}>
      <AgreementFormClient />
    </Suspense>
  );
}
