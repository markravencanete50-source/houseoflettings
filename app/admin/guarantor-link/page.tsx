'use client';
// app/admin/guarantor-link/page.tsx
// Admin-only tool: pre-fill the "proposed let" details and generate a
// shareable guarantor-form link. The guarantor opens the link with those
// fields locked, and only completes their own section.
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { useAuth } from '@/hooks/useAuth';

const inputStyle: React.CSSProperties = {
  width: '100%', background: '#fff', border: '1.5px solid #d1d5db', borderRadius: 8,
  color: '#111827', fontSize: 15, padding: '12px 14px', outline: 'none', boxSizing: 'border-box',
};
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 };

export default function GuarantorLinkPage() {
  const { profile, loading: authLoading } = useAuth();
  const router = useRouter();

  const [propertyAddress, setPropertyAddress] = useState('');
  const [rent, setRent] = useState('');
  const [deposit, setDeposit] = useState('');
  const [parking, setParking] = useState('No');
  const [start, setStart] = useState('');
  const [term, setTerm] = useState('12');
  const [link, setLink] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!authLoading && (!profile || profile.role !== 'admin')) router.push('/admin-login');
  }, [profile, authLoading, router]);

  if (authLoading || !profile || profile.role !== 'admin') {
    return (
      <main style={{ background: '#0a1628', minHeight: '100vh' }}>
        <Navbar />
        <p style={{ color: '#fff', textAlign: 'center', paddingTop: 160 }}>Loading…</p>
      </main>
    );
  }

  const generate = () => {
    const params = new URLSearchParams();
    if (propertyAddress.trim()) params.set('p', propertyAddress.trim());
    if (rent.trim()) params.set('rent', rent.trim());
    if (deposit.trim()) params.set('dep', deposit.trim());
    if (parking) params.set('park', parking);
    if (start) params.set('start', start);
    if (term.trim()) params.set('term', term.trim());
    params.set('lock', '1');
    setLink(`${window.location.origin}/guarantor?${params.toString()}`);
    setCopied(false);
  };

  const copy = async () => {
    try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  };

  return (
    <main style={{ background: '#f3f4f6', minHeight: '100vh', fontFamily: "'Poppins', sans-serif" }}>
      <Navbar />
      <section style={{ background: 'linear-gradient(135deg, #0a1628 0%, #0f2044 100%)', paddingTop: 'calc(72px + 36px)', paddingBottom: 32, textAlign: 'center' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 20px' }}>
          <span style={{ display: 'inline-block', background: 'rgba(37,99,235,0.2)', border: '1px solid rgba(37,99,235,0.5)', borderRadius: 999, padding: '5px 16px', fontSize: 11, fontWeight: 700, color: '#93c5fd', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>Admin</span>
          <h1 style={{ fontSize: 'clamp(1.4rem, 4vw, 2.2rem)', fontWeight: 800, color: '#fff', marginBottom: 8 }}>Generate Guarantor Link</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>Fill the proposed-let details, then send the generated link to the guarantor. Those fields will be locked on their form.</p>
        </div>
      </section>

      <section style={{ padding: '28px 16px 80px' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px rgba(0,0,0,0.07)', padding: '32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>Property Address</label>
            <input style={inputStyle} value={propertyAddress} onChange={e => setPropertyAddress(e.target.value)} placeholder="e.g. 12 Oak Street, Leeds, LS1 1AA" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div><label style={labelStyle}>Rent (£ pcm)</label><input style={inputStyle} value={rent} onChange={e => setRent(e.target.value)} placeholder="e.g. 850" /></div>
            <div><label style={labelStyle}>Deposit (£)</label><input style={inputStyle} value={deposit} onChange={e => setDeposit(e.target.value)} placeholder="e.g. 980" /></div>
            <div>
              <label style={labelStyle}>Parking included in rent?</label>
              <select style={inputStyle} value={parking} onChange={e => setParking(e.target.value)}>
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>
            <div><label style={labelStyle}>Initial Lease Term (months)</label><input type="number" min={1} style={inputStyle} value={term} onChange={e => setTerm(e.target.value)} placeholder="e.g. 12" /></div>
            <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>Proposed Tenancy Start Date</label><input type="date" style={inputStyle} value={start} onChange={e => setStart(e.target.value)} /></div>
          </div>

          <button onClick={generate} style={{ marginTop: 4, padding: '13px 24px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            Generate Guarantor Link
          </button>

          {link && (
            <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 10, padding: '16px 18px' }}>
              <label style={{ ...labelStyle, color: '#15803d' }}>✅ Shareable link — send this to the guarantor</label>
              <input readOnly value={link} onFocus={e => e.target.select()} style={{ ...inputStyle, fontSize: 13, background: '#fff' }} />
              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button onClick={copy} style={{ padding: '10px 18px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  {copied ? '✓ Copied' : 'Copy link'}
                </button>
                <a href={link} target="_blank" rel="noopener noreferrer" style={{ padding: '10px 18px', background: '#fff', color: '#2563eb', border: '1.5px solid #2563eb', borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                  Preview
                </a>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
