'use client';
// components/dashboard/ServicePricingEditor.tsx
// Admin-only tool to create a PRIVATE, ONE-TIME registration link with custom
// prices for a single landlord. It writes ONLY to pricingQuotes/{id} — it never
// touches the public prices, so the main registration form and the pricing page
// always keep the standard prices from lib/bundles. The link works exactly once:
// after the landlord completes their registration it is consumed and can't be
// used again (enforced server-side in /api/service-pricing/quote + the
// landlord-registration route).
import { useState } from 'react';
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
  // The table starts BLANK every time — blank = keep that package's standard
  // price. We never pre-load a global override (there is none to leak).
  const [ov, setOv] = useState<Overrides>({});
  // Which services appear on THIS link. Every service is ticked by default, so
  // by default the link behaves exactly like the standard form (all services
  // shown). Unticking a service hides it from this one link only.
  const [included, setIncluded] = useState<Record<string, boolean>>(
    () => Object.fromEntries(BUNDLES.map(b => [b.id, true])),
  );
  const [linkLabel, setLinkLabel] = useState('');
  const [linking, setLinking] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkMsg, setLinkMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const set = (id: string, field: 'setupFee' | 'mgmtFee', value: string) =>
    setOv(o => ({ ...o, [id]: { ...o[id], [field]: value } }));

  const toggleIncluded = (id: string) => setIncluded(m => ({ ...m, [id]: !m[id] }));
  const includedIds = BUNDLES.filter(b => included[b.id]).map(b => b.id);
  const allIncluded = includedIds.length === BUNDLES.length;
  const setAllIncluded = (on: boolean) =>
    setIncluded(Object.fromEntries(BUNDLES.map(b => [b.id, on])));

  // Only the fields the admin actually filled in (blank = standard price).
  const collectOverrides = (): Overrides => {
    const clean: Overrides = {};
    for (const b of BUNDLES) {
      const e: any = {};
      const s = ov[b.id]?.setupFee?.trim();
      const m = ov[b.id]?.mgmtFee?.trim();
      if (s) e.setupFee = s;
      if (m) e.mgmtFee = m;
      if (e.setupFee || e.mgmtFee) clean[b.id] = e;
    }
    return clean;
  };

  // Create the private, one-time link carrying these prices for ONE landlord.
  const generateLink = async () => {
    const clean = collectOverrides();
    if (includedIds.length === 0) {
      setLinkMsg({ ok: false, text: 'Tick at least one service to appear on the link.' });
      return;
    }
    // A link must be bespoke in some way: custom prices, a limited service set,
    // or both. All prices blank AND every service ticked = nothing special.
    if (Object.keys(clean).length === 0 && allIncluded) {
      setLinkMsg({ ok: false, text: 'Set at least one custom price, or untick a service to hide it from this link, before creating the link.' });
      return;
    }
    // Only send `services` when it is a real restriction (some unticked).
    const services = allIncluded ? undefined : includedIds;
    setLinking(true); setLinkMsg(null); setLinkUrl(''); setCopied(false);
    const res = await authedFetch('/api/service-pricing/quote', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ overrides: clean, label: linkLabel.trim(), ...(services ? { services } : {}) }),
    });
    const j = await res.json().catch(() => ({}));
    setLinking(false);
    if (res.ok && j.url) {
      setLinkUrl(j.url);
      const only = allIncluded ? '' : ` They will only see: ${includedIds.map(id => BUNDLES.find(b => b.id === id)?.label).filter(Boolean).join(', ')}.`;
      setLinkMsg({ ok: true, text: `Link ready. Send it to this one landlord.${only} The public form keeps the standard prices and every service, and the link stops working once they complete their registration.` });
    } else {
      setLinkMsg({ ok: false, text: j.message || 'Could not create the link.' });
    }
  };

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(linkUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch { /* clipboard blocked — the field is selectable as a fallback */ }
  };

  const inp: React.CSSProperties = { width: '100%', border: '1px solid var(--gray-200)', borderRadius: 6, padding: '8px 10px', fontSize: 14, boxSizing: 'border-box' };
  const lbl: React.CSSProperties = { fontSize: 11.5, fontWeight: 600, color: 'var(--gray-500)', marginBottom: 4 };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', marginBottom: 6 }}>
        <h1 className="dash-section-title" style={{ margin: 0 }}>Custom price link</h1>
        <button onClick={onClose} style={{ background: 'none', border: '1px solid var(--gray-200)', borderRadius: 8, padding: '9px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', color: 'var(--gray-600)' }}>← Back to registrations</button>
      </div>
      <p style={{ color: 'var(--gray-600)', margin: '8px 0 8px', fontSize: 15, lineHeight: 1.55 }}>
        Set special prices for <strong>one landlord</strong> and generate a private link to send them.
        Leave a price box blank to keep that package&apos;s standard price (shown greyed inside it), and
        <strong> untick a service</strong> to hide it from this one link so the landlord only sees the services you choose.
      </p>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '12px 14px', margin: '0 0 22px', fontSize: 13.5, color: '#1e40af', lineHeight: 1.5 }}>
        <span style={{ fontSize: 18, lineHeight: 1 }}>🔒</span>
        <span>
          This <strong>never changes the public form</strong> — your main registration form and pricing page always show the standard prices and every service.
          The ticks and prices here apply to this one link only. Each link is <strong>single use</strong>: once that landlord completes their registration it stops working.
        </span>
      </div>

      <div className="dash-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead><tr>
            <th style={{ width: 88, textAlign: 'center' }}>
              On link
              <div style={{ fontWeight: 400, fontSize: 10.5, color: 'var(--gray-400)', marginTop: 2 }}>
                <button type="button" onClick={() => setAllIncluded(!allIncluded)} style={{ background: 'none', border: 'none', padding: 0, color: 'var(--logo-blue)', cursor: 'pointer', fontSize: 10.5, textDecoration: 'underline' }}>
                  {allIncluded ? 'clear all' : 'select all'}
                </button>
              </div>
            </th>
            <th>Package</th><th>Standard price</th><th style={{ width: 160 }}>Custom set-up fee</th><th style={{ width: 160 }}>Custom management %</th>
          </tr></thead>
          <tbody>
            {BUNDLES.map(b => {
              const on = included[b.id];
              return (
              <tr key={b.id} style={on ? undefined : { opacity: 0.55 }}>
                <td style={{ textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => toggleIncluded(b.id)}
                    aria-label={`Show ${b.label} on this link`}
                    style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#0f766e' }}
                  />
                </td>
                <td style={{ fontWeight: 600 }}>{b.label}<div style={{ fontSize: 12, color: 'var(--gray-400)', fontWeight: 400 }}>{b.kind}</div></td>
                <td style={{ color: 'var(--gray-500)', fontSize: 13 }}>{b.setupFee}{b.mgmtFee ? ` · ${b.mgmtFee}` : ' · no mgmt fee'}</td>
                <td>
                  <div style={lbl}>e.g. £199</div>
                  <input style={inp} placeholder={b.setupFee} value={ov[b.id]?.setupFee ?? ''} onChange={e => set(b.id, 'setupFee', e.target.value)} disabled={!on} />
                </td>
                <td>
                  {b.mgmtFee ? (
                    <>
                      <div style={lbl}>e.g. 10%</div>
                      <input style={inp} placeholder={b.mgmtFee} value={ov[b.id]?.mgmtFee ?? ''} onChange={e => set(b.id, 'mgmtFee', e.target.value)} disabled={!on} />
                    </>
                  ) : <span style={{ color: 'var(--gray-300)', fontSize: 13 }}>—</span>}
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p style={{ fontSize: 12.5, color: 'var(--gray-400)', marginTop: 12 }}>
        You can type just the number — &quot;199&quot; becomes &quot;£199&quot;, &quot;10&quot; becomes &quot;10%&quot;.
        {!allIncluded && <> Only <strong style={{ color: 'var(--gray-600)' }}>{includedIds.length}</strong> of {BUNDLES.length} services will appear on this link.</>}
      </p>

      {/* ---- Generate the private, one-time link ---- */}
      <div className="dash-card" style={{ marginTop: 24, background: 'var(--gray-50, #f8fafc)', border: '1px solid var(--gray-200)' }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 240px', minWidth: 0 }}>
            <div style={lbl}>Landlord name / reference <span style={{ fontWeight: 400 }}>(optional — only you see it)</span></div>
            <input style={inp} placeholder="e.g. John Smith, 12 Oak Road" value={linkLabel} onChange={e => setLinkLabel(e.target.value)} />
          </div>
          <button onClick={generateLink} disabled={linking} style={{ background: '#0f766e', color: '#fff', border: 'none', borderRadius: 8, padding: '11px 22px', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: linking ? 0.7 : 1, whiteSpace: 'nowrap' }}>
            {linking ? 'Creating…' : 'Generate landlord link'}
          </button>
        </div>

        {linkMsg && (
          <div style={{ marginTop: 14, fontSize: 13.5, fontWeight: 600, color: linkMsg.ok ? '#15803d' : '#b3261e', lineHeight: 1.5 }}>
            {linkMsg.ok ? '✅' : '⚠️'} {linkMsg.text}
          </div>
        )}

        {linkUrl && (
          <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <input readOnly value={linkUrl} onFocus={e => e.currentTarget.select()} style={{ ...inp, flex: '1 1 320px', minWidth: 0, fontFamily: 'monospace', fontSize: 13, background: '#fff' }} />
            <button onClick={copyLink} style={{ background: copied ? '#15803d' : '#1f2937', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {copied ? '✓ Copied' : 'Copy link'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
