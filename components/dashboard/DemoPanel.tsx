'use client';
// components/dashboard/DemoPanel.tsx
// Admin demo/test harness. Seeds a landlord account (default: the owner's own)
// with sample data across every feature so the whole landlord portal can be
// driven end to end, then sign in as that account to see the result. Everything
// is tagged demo:true and can be cleared and re-run. Talks to /api/staff/demo.
import { useEffect, useState } from 'react';

const LABELS: Record<string, string> = {
  properties: 'Properties',
  tenantApplications: 'Applications',
  maintenanceRequests: 'Maintenance tickets',
  ledgerEntries: 'Account entries',
};

export default function DemoPanel({ authedFetch }: { authedFetch: (path: string, init?: RequestInit) => Promise<Response> }) {
  const [email, setEmail] = useState('');
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState<'seed' | 'clear' | null>(null);
  const [msg, setMsg] = useState('');

  const refresh = async () => {
    try {
      const res = await authedFetch('/api/staff/demo');
      const j = await res.json().catch(() => ({}));
      if (res.ok) { setCounts(j.counts || {}); if (!email && j.defaultEmail) setEmail(j.defaultEmail); }
    } catch { /* ignore */ }
  };
  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, []);

  const total = Object.values(counts).reduce((s, n) => s + (n || 0), 0);

  const run = async (action: 'seed' | 'clear') => {
    if (action === 'clear' && !confirm('Delete ALL demo data (properties, applications, maintenance, account entries)?')) return;
    setBusy(action); setMsg('');
    try {
      const res = await authedFetch('/api/staff/demo', { method: 'POST', body: JSON.stringify({ action, email }) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) { setMsg(j.message || 'Something went wrong.'); }
      else setMsg(action === 'seed' ? `Seeded demo data for ${j.email}. Open the landlord portal (signed in as that account) to see it.` : `Cleared ${j.deleted} demo records.`);
      await refresh();
    } catch { setMsg('Network error — please try again.'); }
    finally { setBusy(null); }
  };

  const box: React.CSSProperties = { background: '#fff', border: '1px solid #e9edf5', borderRadius: 16, padding: 24 };

  return (
    <div>
      <h1 className="dash-section-title">Demo / Test</h1>
      <p style={{ color: 'var(--gray-600)', margin: '8px 0 24px', fontSize: 15 }}>
        Populate a landlord account with sample data across every feature — properties &amp; tenancy details, applications with stages, billed maintenance, and a full account statement — then sign in to that landlord portal to see it live. Everything is tagged as demo and can be cleared.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 20 }}>
        <div style={box}>
          <div style={{ fontWeight: 800, color: '#0a162f', marginBottom: 12 }}>Demo landlord</div>
          <label style={{ fontSize: 12.5, color: '#6b7280', fontWeight: 600 }}>Account email</label>
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="landlord@example.com"
            style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', border: '1.5px solid #e2e7f0', borderRadius: 9, fontSize: 14, margin: '6px 0 6px' }} />
          <p style={{ fontSize: 12, color: '#9aa4b2', margin: '0 0 16px', lineHeight: 1.5 }}>
            The account must have signed in to the landlord portal at least once. Seeding also marks it as a demo account.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={() => run('seed')} disabled={!!busy || !email.trim()} style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '11px 18px', fontSize: 13.5, fontWeight: 700, cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.7 : 1 }}>
              {busy === 'seed' ? 'Seeding…' : '🌱 Seed demo data'}
            </button>
            <button onClick={() => run('clear')} disabled={!!busy} style={{ background: '#fff', color: '#c62828', border: '1px solid #f5c6c0', borderRadius: 8, padding: '11px 18px', fontSize: 13.5, fontWeight: 700, cursor: busy ? 'default' : 'pointer' }}>
              {busy === 'clear' ? 'Clearing…' : '🗑️ Clear demo data'}
            </button>
          </div>
          {msg && <div style={{ marginTop: 14, fontSize: 13, color: '#0a162f', background: '#eef4ff', border: '1px solid #cdddfb', borderRadius: 8, padding: '10px 12px', lineHeight: 1.5 }}>{msg}</div>}
        </div>

        <div style={box}>
          <div style={{ fontWeight: 800, color: '#0a162f', marginBottom: 12 }}>Current demo data ({total})</div>
          <div style={{ border: '1px solid #eef1f6', borderRadius: 12, overflow: 'hidden' }}>
            {Object.keys(LABELS).map((k, i) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 14px', borderTop: i ? '1px solid #f2f4f9' : 'none', fontSize: 14 }}>
                <span style={{ color: '#475569' }}>{LABELS[k]}</span>
                <span style={{ fontWeight: 700, color: '#0a162f' }}>{counts[k] || 0}</span>
              </div>
            ))}
          </div>
          <a href="/landlord-portal" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: 16, color: '#2563eb', fontWeight: 700, fontSize: 13.5, textDecoration: 'none' }}>
            Open the landlord portal →
          </a>
          <p style={{ fontSize: 12, color: '#9aa4b2', margin: '6px 0 0' }}>Sign in as the demo landlord to view the seeded data.</p>
        </div>
      </div>
    </div>
  );
}
