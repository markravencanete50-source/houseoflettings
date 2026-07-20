'use client';
// components/dashboard/RentReviewPropertyManager.tsx
// Shared admin/staff panel for managing the rent-review property catalogue, so
// the office can add/edit the properties shown on the rent-review form without a
// code change. Talks to /api/staff/rent-review-properties via the caller's
// authedFetch (Bearer token or session cookie).
import { useState, useEffect } from 'react';

type ManagedProperty = {
  id: string;
  address: string;
  postcode?: string;
  currentRent?: string;
  proposedRent?: string;
  effectiveDate?: string;
  active?: boolean;
};

type Fetcher = (path: string, init?: RequestInit) => Promise<Response>;

/** Minimal shape of a portfolio listing used for the prefill picker. */
type PortfolioProperty = {
  id?: string;
  title: string;
  location: string;
  price: number;
};

const EMPTY = { address: '', currentRent: '', proposedRent: '', effectiveDate: '' };

export default function RentReviewPropertyManager({
  authedFetch,
  portfolio = [],
}: {
  authedFetch: Fetcher;
  portfolio?: PortfolioProperty[];
}) {
  const [list, setList] = useState<ManagedProperty[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [q, setQ] = useState('');

  const load = () =>
    authedFetch('/api/staff/rent-review-properties')
      .then(r => r.json())
      .then(d => setList(Array.isArray(d.properties) ? d.properties : []))
      .catch(() => setErr('Could not load properties.'))
      .finally(() => setLoaded(true));

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const reset = () => { setEditId(null); setForm(EMPTY); setErr(''); };

  const submit = async () => {
    if (!form.address.trim()) { setErr('A property address is required.'); return; }
    setBusy(true); setErr('');
    try {
      const path = '/api/staff/rent-review-properties';
      const res = editId
        ? await authedFetch(path, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editId, ...form }) })
        : await authedFetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error();
      reset();
      await load();
    } catch { setErr('Could not save the property. Please try again.'); }
    setBusy(false);
  };

  const remove = async (p: ManagedProperty) => {
    if (!confirm(`Remove "${p.address}" from the rent-review list?`)) return;
    const prev = list;
    setList(l => l.filter(x => x.id !== p.id));
    const res = await authedFetch(`/api/staff/rent-review-properties?id=${encodeURIComponent(p.id)}`, { method: 'DELETE' });
    if (!res.ok) { setList(prev); alert('Could not remove the property.'); }
  };

  const toggle = async (p: ManagedProperty) => {
    const active = !(p.active !== false);
    setList(l => l.map(x => x.id === p.id ? { ...x, active } : x));
    const res = await authedFetch('/api/staff/rent-review-properties', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: p.id, active }) });
    if (!res.ok) { setList(l => l.map(x => x.id === p.id ? { ...x, active: !active } : x)); alert('Could not update the property.'); }
  };

  const startEdit = (p: ManagedProperty) => {
    setEditId(p.id);
    setForm({ address: p.address, currentRent: p.currentRent || '', proposedRent: p.proposedRent || '', effectiveDate: p.effectiveDate || '' });
    setErr('');
  };

  const filtered = list.filter(p => `${p.address} ${p.postcode || ''}`.toLowerCase().includes(q.toLowerCase()));
  const input: React.CSSProperties = { padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 13.5, fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' };
  const btn = (bg: string): React.CSSProperties => ({ padding: '9px 16px', background: bg, color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' });

  return (
    <div className="dash-card" style={{ padding: 20, marginBottom: 22 }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)', marginBottom: 4 }}>Rent-review property list</div>
      <p style={{ fontSize: 12.5, color: 'var(--gray-500)', margin: '0 0 16px' }}>
        Properties added here appear in the rent-review form&rsquo;s picker (alongside the built-in catalogue). Set the current/proposed rent and effective date so they pre-fill for the tenant. No code change needed.
      </p>

      {portfolio.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray-500)' }}>Prefill from a listed property (optional)</label>
          <select
            style={{ ...input, maxWidth: 480, cursor: 'pointer', display: 'block', marginTop: 2 }}
            value=""
            onChange={e => {
              const p = portfolio.find(x => (x.id || x.title) === e.target.value);
              if (!p) return;
              const address = [p.title, p.location].filter(Boolean).join(', ');
              setForm(f => ({
                ...f,
                address,
                currentRent: Number.isFinite(p.price) && p.price > 0 ? String(p.price) : f.currentRent,
              }));
              setErr('');
            }}
          >
            <option value="">— Select a property to auto-fill address &amp; current rent —</option>
            {portfolio.map(p => (
              <option key={p.id || p.title} value={p.id || p.title}>
                {p.title} · {p.location} · £{p.price?.toLocaleString('en-GB')}/mo
              </option>
            ))}
          </select>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: 8, alignItems: 'end' }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray-500)' }}>Property address</label>
          <input style={input} placeholder="e.g. 12 Example Road, Leeds LS1 1AB" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray-500)' }}>Current rent</label>
          <input style={input} placeholder="950" value={form.currentRent} onChange={e => setForm(f => ({ ...f, currentRent: e.target.value }))} />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray-500)' }}>Proposed rent</label>
          <input style={input} placeholder="975" value={form.proposedRent} onChange={e => setForm(f => ({ ...f, proposedRent: e.target.value }))} />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray-500)' }}>Effective date</label>
          <input type="date" style={input} value={form.effectiveDate} onChange={e => setForm(f => ({ ...f, effectiveDate: e.target.value }))} />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button style={btn('#2563eb')} onClick={submit} disabled={busy}>{busy ? 'Saving…' : editId ? 'Update' : 'Add'}</button>
          {editId && <button style={{ ...btn('#6b7280') }} onClick={reset} disabled={busy}>Cancel</button>}
        </div>
      </div>
      {err && <p style={{ color: '#dc2626', fontSize: 12.5, margin: '8px 0 0', fontWeight: 600 }}>{err}</p>}

      <div style={{ marginTop: 18 }}>
        <input style={{ ...input, maxWidth: 280 }} placeholder="Filter added properties…" value={q} onChange={e => setQ(e.target.value)} />
      </div>

      <div style={{ marginTop: 12, border: '1px solid #eef0f5', borderRadius: 10, overflow: 'hidden' }}>
        <table className="data-table" style={{ margin: 0 }}>
          <thead><tr><th>Address</th><th>Postcode</th><th>Current → Proposed</th><th>Effective</th><th>Active</th><th>Actions</th></tr></thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id}>
                <td style={{ fontSize: 13, fontWeight: 600 }}>{p.address}</td>
                <td style={{ fontSize: 12.5, color: 'var(--gray-600)' }}>{p.postcode || '-'}</td>
                <td style={{ fontSize: 12.5 }}>{p.currentRent ? `£${p.currentRent}` : '-'}{p.proposedRent ? ` → £${p.proposedRent}` : ''}</td>
                <td style={{ fontSize: 12.5, color: 'var(--gray-600)' }}>{p.effectiveDate || '-'}</td>
                <td>
                  <button onClick={() => toggle(p)} style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: '1px solid', ...(p.active !== false ? { background: '#e8f5e9', color: '#2e7d32', borderColor: '#a5d6a7' } : { background: '#fce4ec', color: '#c62828', borderColor: '#f7b6b6' }) }}>
                    {p.active !== false ? 'Active' : 'Hidden'}
                  </button>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => startEdit(p)} style={{ padding: '4px 10px', background: 'transparent', border: '1px solid #1565c0', color: '#1565c0', borderRadius: 4, fontSize: 11, cursor: 'pointer' }}>Edit</button>
                    <button onClick={() => remove(p)} style={{ padding: '4px 10px', background: 'transparent', border: '1px solid #c62828', color: '#c62828', borderRadius: 4, fontSize: 11, cursor: 'pointer' }}>Remove</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loaded ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--gray-400)', fontSize: 13 }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--gray-400)', fontSize: 13 }}>No properties added yet. The built-in catalogue still shows on the form.</div>
        ) : null}
      </div>
    </div>
  );
}
