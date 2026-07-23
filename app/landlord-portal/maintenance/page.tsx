'use client';
// app/landlord-portal/maintenance/page.tsx
// In-portal maintenance reporting. Uses the SAME form component as the public
// page, wrapped in portal chrome and pre-filled with the landlord's details
// (from /api/landlord/me) and the property (from ?address=&postcode=). Stays
// inside the landlord login rather than sending them to the public site.
import { useEffect, useState } from 'react';
import Link from 'next/link';
import MaintenanceReportForm, { type MaintenancePrefill } from '@/components/maintenance/MaintenanceReportForm';

export default function PortalMaintenancePage() {
  const [loading, setLoading] = useState(true);
  const [prefill, setPrefill] = useState<MaintenancePrefill>({});
  const [submitted, setSubmitted] = useState(false);
  const [backHref, setBackHref] = useState('/landlord-portal?tab=properties');

  useEffect(() => {
    (async () => {
      const me = await fetch('/api/landlord/me', { credentials: 'include' }).then(r => r.json()).catch(() => ({ user: null }));
      const params = new URLSearchParams(window.location.search);
      const address = params.get('address') || '';
      const postcode = params.get('postcode') || '';
      const propertyId = params.get('propertyId') || '';
      if (propertyId) setBackHref(`/landlord-portal/property/${encodeURIComponent(propertyId)}`);
      setPrefill({
        fullName: me?.user?.name || '',
        email: me?.user?.email || '',
        contactNumber: me?.user?.phone || '',
        addressLine1: address,
        postcode,
      });
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a162f', flexDirection: 'column', gap: 16 }}>
        <div className="lpm-spin" />
        <div style={{ color: 'rgba(255,255,255,.6)', fontFamily: 'Poppins, sans-serif', fontSize: 14 }}>Loading…</div>
        <style>{`.lpm-spin{width:40px;height:40px;border:3px solid rgba(255,255,255,.15);border-top-color:#c0392b;border-radius:50%;animation:lpm .8s linear infinite}@keyframes lpm{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <main style={{ background: '#f4f6fb', minHeight: '100vh', fontFamily: "'Poppins', sans-serif" }}>
      {!submitted && (
        <section style={{ background: 'linear-gradient(135deg,#0a162f,#14294f 60%,#c0392b 200%)', color: '#fff' }}>
          <div style={{ maxWidth: 720, margin: '0 auto', padding: '26px 20px 30px' }}>
            <Link href={backHref} style={{ color: 'rgba(255,255,255,.75)', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>← Back to my property</Link>
            <div style={{ fontSize: 11, letterSpacing: '.18em', textTransform: 'uppercase', opacity: .65, marginTop: 16 }}>🔧 Maintenance</div>
            <h1 style={{ fontSize: 26, fontWeight: 800, margin: '6px 0 10px', letterSpacing: '-.5px' }}>Report a maintenance issue</h1>
            <p style={{ color: 'rgba(255,255,255,.6)', fontSize: 14, lineHeight: 1.7, maxWidth: 520, margin: 0 }}>
              Tell us what&apos;s wrong, add a few photos, and your local team will arrange the repair. Your details are filled in for you.
            </p>
          </div>
        </section>
      )}
      <section style={{ padding: submitted ? '40px 16px 60px' : '28px 16px 70px' }}>
        <MaintenanceReportForm prefill={prefill} onSubmittedChange={setSubmitted} />
        {submitted && (
          <div style={{ textAlign: 'center', marginTop: 22 }}>
            <Link href={backHref} style={{ display: 'inline-block', background: '#0a162f', color: '#fff', textDecoration: 'none', fontWeight: 700, padding: '12px 26px', borderRadius: 10, fontSize: 14 }}>← Back to my property</Link>
          </div>
        )}
      </section>
    </main>
  );
}
