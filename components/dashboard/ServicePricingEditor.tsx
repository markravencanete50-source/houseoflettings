'use client';
// components/dashboard/ServicePricingEditor.tsx
// Admin-only editor for the landlord-registration service prices. Overrides each
// bundle's setup fee and management % (stored in settings/servicePricing) which
// then apply on the registration form, the pricing page and the agreement.
// Blank = use the default shown as the placeholder.
import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { BUNDLES } from '@/lib/bundles';

type Overrides = Record<string, { setupFee?: string; mgmtFee?: string }>;

async function authedFetch(path: string, init?: RequestInit) {
  const headers: Record<string, string> = { ...(init?.headers as Record<string, string> || {}) };
  const u = auth?.currentUser;
  if (u) { try { headers['Authorization'] = `Bearer ${await u.getIdToken()}`; } catch { /* cookie */ } }
  return fetch(path, { ...init, headers, credentials: 'same-origin' });
}

export default function ServicePricingEditor({ onClose }: { onClose: () => void }) {
  const [ov, setOv] = useState<Overrides>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    fetch('/api/service-pricing', { credentials: 'same-origin' })
      .then(r => r.json()).then(j => setOv(j.overrides || {}))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const set = (id: string, field: 'setupFee' | 'mgmtFee', value: string) =>
    setOv(o => ({ ...o, [id]: { ...o[id], [field]: value } }));

  const save = async () => {
    setSaving(true); setMsg(null);
    // Send only fields the admin actually filled in.
    const clean: Overrides = {};
    for (const b of BUNDLES) {
      const e: any = {};
      const s = ov[b.id]?.setupFee?.trim();
      const m = ov[b.id]?.mgmtFee?.trim();
      if (s) e.setupFee = s;
      if (m) e.mgmtFee = m;
      if (e.setupFee || e.mgmtFee) clean[b.id] = e;
    }
    const res = await authedFetch('/api/service-pricing', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ overrides: clean }),
    });
    const j = await res.json().catch(() => ({}));
    setSaving(false);
    if (res.ok) { setOv(j.overrides || clean); setMsg({ ok: true, text: 'Pricing saved. New registrations use these prices immediately.' }); }
    else setMsg({ ok: false, text: j.message || 'Could not save.' });
  };

  const inp: React.CSSProperties = { width: '100%', border: '1px solid var(--gray-200)', borderRadius: 6, padding: '8px 10px', fontSize: 14, boxSizing: 'border-box' };
  const lbl: React.CSSProperties = { fontSize: 11.5, fontWeight: 600, color: 'var(--gray-500)', marginBottom: 4 };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', marginBottom: 6 }}>
        <h1 className="dash-section-title" style={{ margin: 0 }}>Service Pricing</h1>
        <button onClick={onClose} style={{ background: 'none', border: '1px solid var(--gray-200)', borderRadius: 8, padding: '9px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', color: 'var(--gray-600)' }}>← Back to registrations</button>
      </div>
      <p style={{ color: 'var(--gray-600)', margin: '8px 0 22px', fontSize: 15 }}>
        Change the set-up fee and management % for each package. Leave a box blank to keep the default (shown greyed inside it).
        Changes apply to <strong>new registrations, the registration form and the pricing page</strong> straight away — existing signed agreements keep their agreed figures in their PDFs.
      </p>

      {msg && <div className="dash-card" style={{ marginBottom: 16, background: msg.ok ? '#e8f5e9' : '#fdecea', color: msg.ok ? '#2e7d32' : '#b3261e', border: 'none' }}>{msg.ok ? '✅' : '⚠️'} {msg.text}</div>}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
      ) : (
        <>
          <div className="dash-card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="data-table">
              <thead><tr><th>Package</th><th>Default</th><th style={{ width: 160 }}>Set-up fee</th><th style={{ width: 160 }}>Management %</th></tr></thead>
              <tbody>
                {BUNDLES.map(b => (
                  <tr key={b.id}>
                    <td style={{ fontWeight: 600 }}>{b.label}<div style={{ fontSize: 12, color: 'var(--gray-400)', fontWeight: 400 }}>{b.kind}</div></td>
                    <td style={{ color: 'var(--gray-500)', fontSize: 13 }}>{b.setupFee}{b.mgmtFee ? ` · ${b.mgmtFee}` : ' · no mgmt fee'}</td>
                    <td>
                      <div style={lbl}>e.g. £199</div>
                      <input style={inp} placeholder={b.setupFee} value={ov[b.id]?.setupFee ?? ''} onChange={e => set(b.id, 'setupFee', e.target.value)} />
                    </td>
                    <td>
                      {b.mgmtFee ? (
                        <>
                          <div style={lbl}>e.g. 10%</div>
                          <input style={inp} placeholder={b.mgmtFee} value={ov[b.id]?.mgmtFee ?? ''} onChange={e => set(b.id, 'mgmtFee', e.target.value)} />
                        </>
                      ) : <span style={{ color: 'var(--gray-300)', fontSize: 13 }}>—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
            <button onClick={save} disabled={saving} style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '11px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Saving…' : 'Save pricing'}
            </button>
          </div>
          <p style={{ fontSize: 12.5, color: 'var(--gray-400)', marginTop: 12 }}>You can type just the number — "199" becomes "£199", "10" becomes "10%".</p>
        </>
      )}
    </div>
  );
}
