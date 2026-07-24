'use client';
// components/dashboard/LandlordAssignForm.tsx
// Standalone "assign this property to a landlord" feature, used in the Manage
// portal. Kept OUT of the Post/Edit Property form (that's the public advert).
// Saves landlordId/landlordName onto the property via /api/staff/properties.
import { useEffect, useState } from 'react';
import type { Property } from '@/lib/types';

type Landlord = { uid: string; name: string; email: string };

export default function LandlordAssignForm({
  property, authedFetch, onSaved,
}: {
  property: Property;
  authedFetch: (path: string, init?: RequestInit) => Promise<Response>;
  onSaved?: () => void;
}) {
  const [landlordId, setLandlordId] = useState(property.landlordId || '');
  const [options, setOptions] = useState<Landlord[]>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    authedFetch('/api/staff/landlords').then(r => (r.ok ? r.json() : null)).then(j => { if (j?.landlords) setOptions(j.landlords); }).catch(() => {});
  }, [authedFetch]);

  const known = options.some(l => l.uid === landlordId);

  const save = async () => {
    setSaving(true); setMsg('');
    try {
      const sel = options.find(l => l.uid === landlordId);
      const res = await authedFetch('/api/staff/properties', { method: 'PATCH', body: JSON.stringify({ id: property.id, landlordId, landlordName: sel?.name || (landlordId ? ((property as any).landlordName || '') : '') }) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.message || `HTTP ${res.status}`);
      setMsg(landlordId ? 'Saved — this property now shows in that landlord’s portal.' : 'Saved — this property is now unassigned (public listing only).');
      onSaved?.();
    } catch (e: any) { setMsg(e.message || 'Could not save.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="dash-card">
      <p style={{ color: 'var(--gray-600)', margin: '0 0 6px', fontSize: 14 }}>
        Who owns <strong>{property.location || property.title}</strong>. Only the chosen landlord sees this property (and its account, tenancy and applications) in their portal.
      </p>
      <label className="form-label" style={{ display: 'block', marginTop: 14 }}>Assign to landlord</label>
      <select
        value={landlordId}
        onChange={e => setLandlordId(e.target.value)}
        style={{ width: '100%', maxWidth: 520, padding: '11px 13px', border: '1.5px solid var(--gray-200)', borderRadius: 8, fontSize: 14, background: '#fff', marginTop: 6 }}
      >
        <option value="">— No landlord (public listing only) —</option>
        {landlordId && !known && <option value={landlordId}>{(property as any).landlordName || 'Currently assigned'} — unrecognised, reassign</option>}
        {options.map(l => <option key={l.uid} value={l.uid}>{l.name || l.email}{l.email ? ` (${l.email})` : ''}</option>)}
      </select>
      <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 6, maxWidth: 520 }}>
        A wrong assignment here is what makes a property show under the wrong account. Pick the real landlord, or “No landlord”.
      </div>
      {msg && <div style={{ margin: '14px 0 0', fontSize: 13, background: '#eef4ff', border: '1px solid #cdddfb', color: '#1e40af', borderRadius: 8, padding: '10px 12px', maxWidth: 520 }}>{msg}</div>}
      <div style={{ marginTop: 16 }}>
        <button onClick={save} disabled={saving} style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '11px 20px', fontSize: 14, fontWeight: 700, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Saving…' : 'Save landlord'}
        </button>
      </div>
    </div>
  );
}
