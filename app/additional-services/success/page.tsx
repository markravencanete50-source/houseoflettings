'use client';
// app/additional-services/success/page.tsx
import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';

// The site-standard CTA size, matching components/layout/ServiceHero.module.css
// (.btn). Every call-to-action is this size.
const CTA_STYLE: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9,
  boxSizing: 'border-box', minHeight: 48, lineHeight: 1.2,
  padding: '14px 28px', border: '1.5px solid transparent', borderRadius: 9,
  fontFamily: "'Poppins', sans-serif", fontSize: 13.5, fontWeight: 700,
  letterSpacing: '.02em', textTransform: 'uppercase', textDecoration: 'none',
};

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
            <Link href="/additional-services" style={{ ...CTA_STYLE, background: '#2563eb', color: '#fff' }}>Order more services</Link>
            <Link href="/" style={{ ...CTA_STYLE, background: 'transparent', color: '#0a162f', borderColor: '#dbe2ea' }}>Back to home</Link>
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
