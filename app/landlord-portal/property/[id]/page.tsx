'use client';
// app/landlord-portal/property/[id]/page.tsx
// Full property page (routed, not a modal). Cookie-authenticated like the rest of
// the portal: fetches the scoped overview, finds this property by id, and shows
// its money, package + inclusions, applications and maintenance.
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import PropertyDetailView, { type PDProp, type PDApplication, type PDMaintenance } from '@/components/landlord/PropertyDetailView';

export default function LandlordPropertyPage() {
  const params = useParams();
  const router = useRouter();
  const id = decodeURIComponent(String(params?.id || ''));

  const [loading, setLoading] = useState(true);
  const [prop, setProp] = useState<PDProp | null>(null);
  const [applications, setApplications] = useState<PDApplication[]>([]);
  const [maintenance, setMaintenance] = useState<PDMaintenance[]>([]);

  useEffect(() => {
    (async () => {
      const me = await fetch('/api/landlord/me', { credentials: 'include' }).then(r => r.json()).catch(() => ({ user: null }));
      if (!me.user) { router.replace('/landlord-login'); return; }
      const ov = await fetch('/api/landlord/overview', { credentials: 'include' }).then(r => r.ok ? r.json() : null).catch(() => null);
      if (ov) {
        const p: PDProp | undefined = (ov.properties || []).find((x: PDProp) => x.id === id);
        setProp(p || null);
        setApplications(ov.applications || []);
        setMaintenance(ov.maintenance || []);
      }
      setLoading(false);
    })();
  }, [id, router]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a162f', flexDirection: 'column', gap: 16 }}>
        <div className="lpp-spin" />
        <div style={{ color: 'rgba(255,255,255,.6)', fontFamily: 'Poppins, sans-serif', fontSize: 14 }}>Loading property…</div>
        <style>{`.lpp-spin{width:40px;height:40px;border:3px solid rgba(255,255,255,.15);border-top-color:#c0392b;border-radius:50%;animation:lpp .8s linear infinite}@keyframes lpp{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (!prop) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f6fb', fontFamily: 'Poppins, sans-serif', padding: 20 }}>
        <div style={{ textAlign: 'center', maxWidth: 420 }}>
          <div style={{ fontSize: 46, marginBottom: 12 }}>🏠</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0a162f', margin: '0 0 10px' }}>Property not found</h1>
          <p style={{ color: '#6b7280', fontSize: 15, margin: '0 0 22px' }}>We couldn't find this property on your account.</p>
          <Link href="/landlord-portal?tab=properties" style={{ display: 'inline-block', background: '#0a162f', color: '#fff', textDecoration: 'none', fontWeight: 700, padding: '13px 28px', borderRadius: 10, fontSize: 14 }}>Back to my properties</Link>
        </div>
      </div>
    );
  }

  return <PropertyDetailView prop={prop} applications={applications} maintenance={maintenance} />;
}
