'use client';
// app/additional-services/success/page.tsx
import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';

function SuccessInner() {
  const params = useSearchParams();
  const ref = params.get('ref') || '';
  return (
    <div style={{ paddingTop: 96, minHeight: '100vh', background: '#f3f4f6', fontFamily: "'Poppins', sans-serif" }}>
      <div style={{ maxWidth: 620, margin: '0 auto', padding: '60px 5%' }}>
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: '48px 36px', textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#e7f6ee', color: '#16a34a', fontSize: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>✓</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0a162f', margin: '0 0 10px' }}>Thank you for ordering</h1>
          <p style={{ color: '#475569', fontSize: 15.5, lineHeight: 1.7, margin: '0 0 8px' }}>
            We&rsquo;ve emailed you a confirmation and our team has been notified. If there&rsquo;s anything we need to clarify, we&rsquo;ll get in touch. Otherwise we&rsquo;ll proceed exactly as your order sets out and confirm any &ldquo;from&rdquo; pricing before any work begins.
          </p>
          {ref && <p style={{ color: '#64748b', fontSize: 13, margin: '0 0 26px' }}>Your reference: <strong style={{ color: '#0a162f' }}>{ref}</strong></p>}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/additional-services" style={{ background: '#2563eb', color: '#fff', textDecoration: 'none', padding: '13px 26px', borderRadius: 9, fontSize: 14, fontWeight: 700 }}>Order more services</Link>
            <Link href="/" style={{ background: 'transparent', color: '#0a162f', textDecoration: 'none', padding: '13px 26px', borderRadius: 9, fontSize: 14, fontWeight: 700, border: '1.5px solid #dbe2ea' }}>Back to home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <>
      <Navbar />
      <Suspense fallback={<div style={{ paddingTop: 96 }} />}>
        <SuccessInner />
      </Suspense>
    </>
  );
}
