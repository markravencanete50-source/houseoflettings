'use client';
// components/dashboard/TenancyDetailsForm.tsx
// Standalone editor for a property's tenancy/deposit/guarantor/account details
// shown to the landlord in their portal. Kept SEPARATE from posting/editing the
// listing (PropertyForm) — this is its own feature, reached from Manage portal.
// Saves the tenancy fields onto the property doc via /api/staff/properties.
import { useState } from 'react';
import type { Property } from '@/lib/types';
import TenancyFields from '@/components/property/TenancyFields';
import { TENANCY_KEYS } from '@/lib/tenancyFields';

export default function TenancyDetailsForm({
  property, authedFetch, onSaved,
}: {
  property: Property;
  authedFetch: (path: string, init?: RequestInit) => Promise<Response>;
  onSaved?: () => void;
}) {
  const [tenancy, setTenancy] = useState<Record<string, any>>(() => {
    const init: Record<string, any> = {};
    for (const k of TENANCY_KEYS) { const v = (property as any)?.[k]; if (v !== undefined) init[k] = v; }
    return init;
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const set = (k: string, v: any) => setTenancy(s => ({ ...s, [k]: v }));

  const save = async () => {
    setSaving(true); setMsg('');
    try {
      const res = await authedFetch('/api/staff/properties', { method: 'PATCH', body: JSON.stringify({ id: property.id, ...tenancy }) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.message || `HTTP ${res.status}`);
      setMsg('Saved — the landlord sees this in their portal.');
      onSaved?.();
    } catch (e: any) { setMsg(e.message || 'Could not save.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="dash-card">
      <p style={{ color: 'var(--gray-600)', margin: '0 0 18px', fontSize: 14 }}>
        Tenancy, guarantor, contract, deposit and account details for <strong>{property.location || property.title}</strong>. These appear in the landlord&rsquo;s portal. Leave anything not applicable blank.
      </p>
      <TenancyFields value={tenancy} onChange={set} />
      {msg && <div style={{ margin: '4px 0 14px', fontSize: 13, background: '#eef4ff', border: '1px solid #cdddfb', color: '#1e40af', borderRadius: 8, padding: '10px 12px' }}>{msg}</div>}
      <button onClick={save} disabled={saving} style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '11px 20px', fontSize: 14, fontWeight: 700, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.7 : 1 }}>
        {saving ? 'Saving…' : 'Save tenancy details'}
      </button>
    </div>
  );
}
