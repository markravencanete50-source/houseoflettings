// app/landlord-registration/apply/page.tsx
// Server wrapper: SEO metadata + Suspense, then the interactive registration
// wizard (which now includes reviewing and e-signing the management agreement,
// merged in from the old /landlord-agreement flow).
import type { Metadata } from 'next';
import { Suspense } from 'react';
import RegistrationFormClient from './RegistrationFormClient';

export const metadata: Metadata = {
  title: 'Landlord Registration | House of Lettings',
  description:
    'Register your property with House of Lettings: tell us about you and your property, choose your service, review the Residential Lettings & Management Agreement and sign online. Free to register.',
  alternates: { canonical: 'https://www.houseoflettings.uk/landlord-registration/apply' },
};

export default function LandlordRegistrationApplyPage() {
  return (
    <Suspense fallback={null}>
      <RegistrationFormClient />
    </Suspense>
  );
}
