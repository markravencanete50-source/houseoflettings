// app/landlord-registration/joint/page.tsx
// Server wrapper for the joint (second) landlord completion page, reached from
// the secure link in the invite email.
import type { Metadata } from 'next';
import { Suspense } from 'react';
import JointLandlordClient from './JointLandlordClient';

export const metadata: Metadata = {
  title: 'Complete your joint landlord details | House of Lettings',
  description: 'Add your details, documents and signature as a joint landlord.',
  robots: { index: false, follow: false },
};

export default function JointLandlordPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#0a162f' }} />}>
      <JointLandlordClient />
    </Suspense>
  );
}
