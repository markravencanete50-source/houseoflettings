// app/landlord-registration/forms/page.tsx
// Server wrapper for the two post-agreement forms (Authorised Representative and
// Bank Details & AML). Navbar/Footer render outside Suspense so they hydrate
// consistently; the inner client reads id/token/party/doc from the URL.
import type { Metadata } from 'next';
import { Suspense } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import FormsClient from './FormsClient';

export const metadata: Metadata = {
  title: 'Complete your landlord form | House of Lettings',
  description: 'Complete and sign your House of Lettings landlord form.',
  robots: { index: false, follow: false },
};

export default function LandlordFormsPage() {
  return (
    <>
      <Navbar />
      <Suspense fallback={
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 36, height: 36, border: '3px solid #e4e9f2', borderTopColor: '#c0392b', borderRadius: '50%', animation: 'lfrot .8s linear infinite' }} />
          <style>{`@keyframes lfrot{to{transform:rotate(360deg)}}`}</style>
        </div>
      }>
        <FormsClient />
      </Suspense>
      <Footer />
    </>
  );
}
