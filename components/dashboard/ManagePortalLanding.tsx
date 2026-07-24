'use client';
// components/dashboard/ManagePortalLanding.tsx
// Entry point for the Manage portal: search any property to manage its landlord
// account, or add a property that is NOT advertised (already-rented properties
// that were never posted publicly). Added properties are status:'unlisted' — they
// never appear on the public site, only in the landlord's portal + here.
import { useEffect, useState } from 'react';
import type { Property } from '@/lib/types';

type Landlord = { uid: string; name: string; email: string };

export default function ManagePortalLanding({
  authedFetch, onSelect,
}: {
  authedFetch: (path: string, init?: RequestInit) => Promise<Response>;
  onSelect: (p: Property) => void;
}) {
  const [props, setProps] = useState<Property[]>([]);
  const [landlords, setLandlords] = useState<Landlord[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  // Add-property form
  const [address, setAddress] = useState('');
  const [rent, setRent] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('1');
  const [furnished, setFurnished] = useState('unfurnished');
  const [landlordId, setLandlordId] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const load = async () => {
    setLoading(true);
    try { const r = await authedFetch('/api/staff/properties'); const j = await r.json().catch(() => ({})); setProps(j.properties || []); } catch { /* ignore */ }
    setLoading(false);
  };
  useEffect(() => {
    load();
    authedFetch('/api/staff/landlords').then(r => r.ok ? r.json() : null).then(j => { if (j?.landlords) setLandlords(j.landlords); }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = props.filter(p => {
    const s = q.trim().toLowerCase();
    if (!s) return true;
    return (p.location || '').toLowerCase().includes(s) || (p.title || '').toLowerCase().includes(s) || ((p as any).landlordName || '').toLowerCase().includes(s);
  });

  const addProperty = async () => {
    setErr('');
    if (!address.trim()) { setErr('Enter the property address.'); return; }
    if (!(Number(rent) > 0)) { setErr('Enter the monthly rent.'); return; }
    setSaving(true);
    try {
      const sel = landlords.find(l => l.uid === landlordId);
      const body = {
        title: address.trim(), location: address.trim(), price: Number(rent),
        bedrooms: Number(bedrooms) || 0, bathrooms: Number(bathrooms) || 1,
        furnished, propertyType: 'whole', status: 'unlisted', unlisted: true,
        landlordId, landlordName: sel?.name || '',
      };
      const res = await authedFetch('/api/staff/properties', { method: 'POST', body: JSON.stringify(body) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.message || `HTTP ${res.status}`);
      onSelect({ id: j.id, ...body } as unknown as Property);
    } catch (e: any) { setErr(e.message || 'Could not add the property.'); }
    finally { setSaving(false); }
  };

  const input: React.CSSProperties = { width: '100%', padding: '10px 12px', border: '1.5px solid var(--gray-200)', borderRadius: 8, fontSize: 14, marginTop: 4, background: '#fff' };

  return (
    <div>
      <h1 className="dash-section-title" style={{ margin: 0 }}>Manage portal</h1>
      <p style={{ color: 'var(--gray-600)', margin: '8px 0 20px', fontSize: 15 }}>
        Search a property to manage its landlord account (landlord, tenancy, account, maintenance, applications) — or add a property that isn&rsquo;t advertised.
      </p>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by address or landlord…" style={{ ...input, maxWidth: 360, marginTop: 0 }} />
        <button onClick={() => setAdding(a => !a)} style={{ background: adding ? '#fff' : '#0a162f', color: adding ? '#0a162f' : '#fff', border: '1px solid #0a162f', borderRadius: 8, padding: '10px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
          {adding ? 'Cancel' : '+ Add a property (not advertised)'}
        </button>
      </div>

      {adding && (
        <div className="dash-card" style={{ marginBottom: 22 }}>
          <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 800, color: '#0a162f' }}>Add a property (not advertised)</h3>
          <p style={{ margin: '0 0 16px', fontSize: 13, color: '#6b7280' }}>For a property that&rsquo;s already rented but never posted publicly. It won&rsquo;t appear on the website — only in the landlord&rsquo;s portal and here.</p>
          {err && <div style={{ background: '#fdecea', color: '#b3261e', padding: '9px 12px', borderRadius: 8, fontSize: 13, marginBottom: 12 }}>⚠️ {err}</div>}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 14 }}>
            <div style={{ gridColumn: '1 / -1' }}><label className="form-label">Property address *</label><input value={address} onChange={e => setAddress(e.target.value)} placeholder="e.g. 12 Demo Gardens, Leeds, LS1 1AA" style={input} /></div>
            <div><label className="form-label">Monthly rent £ *</label><input type="number" value={rent} onChange={e => setRent(e.target.value)} placeholder="1100" style={input} /></div>
            <div><label className="form-label">Bedrooms</label><input type="number" value={bedrooms} onChange={e => setBedrooms(e.target.value)} style={input} /></div>
            <div><label className="form-label">Bathrooms</label><input type="number" value={bathrooms} onChange={e => setBathrooms(e.target.value)} style={input} /></div>
            <div><label className="form-label">Furnishing</label><select value={furnished} onChange={e => setFurnished(e.target.value)} style={input}><option value="unfurnished">Unfurnished</option><option value="furnished">Furnished</option><option value="part-furnished">Part-furnished</option></select></div>
            <div><label className="form-label">Landlord</label><select value={landlordId} onChange={e => setLandlordId(e.target.value)} style={input}><option value="">— Assign later —</option>{landlords.map(l => <option key={l.uid} value={l.uid}>{l.name || l.email}</option>)}</select></div>
          </div>
          <button onClick={addProperty} disabled={saving} style={{ marginTop: 16, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '11px 20px', fontSize: 14, fontWeight: 700, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.7 : 1 }}>{saving ? 'Adding…' : 'Add & manage'}</button>
        </div>
      )}

      <div className="dash-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>Loading properties…</div>
          : filtered.length === 0 ? <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>{q ? 'No properties match that search.' : 'No properties yet.'}</div>
          : (
            <table className="data-table">
              <thead><tr><th>Property</th><th>Landlord</th><th>Rent</th><th></th></tr></thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600, fontSize: 14 }}>{p.location || p.title}{(p as any).unlisted || (p as any).status === 'unlisted' ? <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, background: '#eef2f7', color: '#475569', borderRadius: 3, padding: '1px 6px' }}>NOT ADVERTISED</span> : null}</td>
                    <td style={{ fontSize: 13, color: 'var(--gray-600)' }}>{(p as any).landlordName || <span style={{ color: 'var(--gray-400)' }}>— unassigned —</span>}</td>
                    <td style={{ fontSize: 13, color: 'var(--gray-600)' }}>{p.price ? `£${p.price}` : '—'}</td>
                    <td style={{ textAlign: 'right' }}><button onClick={() => onSelect(p)} style={{ background: '#0a162f', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 14px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>⚙ Manage →</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>
    </div>
  );
}
