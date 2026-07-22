// app/landlord-registration/joint/page.tsx
// Server wrapper for the joint (second) landlord completion page, reached from
// the secure link in the invite email. Navbar/Footer are rendered OUTSIDE the
// Suspense boundary so they hydrate consistently — only the searchParams-driven
// inner content suspends.
import type { Metadata } from 'next';
import { Suspense } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import JointLandlordClient from './JointLandlordClient';

export const metadata: Metadata = {
  title: 'Complete your joint landlord details | House of Lettings',
  description: 'Add your details, documents and signature as a joint landlord.',
  robots: { index: false, follow: false },
};

export default function JointLandlordPage() {
  return (
    <>
      <Navbar />
      <Suspense fallback={
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 36, height: 36, border: '3px solid #e4e9f2', borderTopColor: '#c0392b', borderRadius: '50%', animation: 'jlrot .8s linear infinite' }} />
          <style>{`@keyframes jlrot{to{transform:rotate(360deg)}}`}</style>
        </div>
      }>
        <JointLandlordClient />
      </Suspense>
      <Footer />
    </>
  );
}
