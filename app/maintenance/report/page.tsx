'use client';
// app/maintenance/report/page.tsx
// Public maintenance report page. The form itself lives in the shared
// components/maintenance/MaintenanceReportForm (also used inside the landlord
// portal); this page just supplies the public chrome (navbar, hero, footer).
import { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import MaintenanceReportForm from '@/components/maintenance/MaintenanceReportForm';

export default function MaintenanceReportPage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <main style={{ background: '#f3f4f6', minHeight: '100vh', fontFamily: "'Poppins', sans-serif" }}>
      <Navbar />

      {!submitted && (
        <section style={{ background: 'linear-gradient(135deg, #0a1628 0%, #0f2044 100%)', paddingTop: 'calc(72px + 40px)', paddingBottom: 40, textAlign: 'center' }}>
          <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 20px' }}>
            <span style={{ display: 'inline-block', background: 'rgba(37,99,235,0.2)', border: '1px solid rgba(37,99,235,0.5)', borderRadius: 999, padding: '5px 16px', fontSize: 11, fontWeight: 700, color: '#93c5fd', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>
              Maintenance Request
            </span>
            <h1 style={{ fontSize: 'clamp(1.5rem, 5vw, 2.6rem)', fontWeight: 800, color: '#fff', marginBottom: 12, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              Report a Maintenance Issue
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 1.7, maxWidth: 520, margin: '0 auto' }}>
              Something broken or not working in your property? Tell us what&apos;s wrong, add a few photos, and our team will sort it out.
            </p>
          </div>
        </section>
      )}

      <section style={{ padding: submitted ? 'calc(72px + 40px) 16px 60px' : '32px 16px 80px' }}>
        <MaintenanceReportForm onSubmittedChange={setSubmitted} />
      </section>
      <Footer />
    </main>
  );
}
