'use client';
// components/dashboard/ApplicationAssign.tsx
// Inline staff control on a tenant application: assign it to a property (so it
// reaches that landlord's portal) and move it along the landlord-visible stage
// pipeline. PATCHes /api/staff/applications and reports the saved fields back.
import { useEffect, useState } from 'react';
import { APPLICATION_PIPELINE, TERMINAL_STAGES } from '@/lib/applicationStages';

type Prop = { id: string; location?: string; title?: string; landlordId?: string; landlordName?: string };

const sel: React.CSSProperties = { padding: '6px 8px', borderRadius: 6, fontSize: 12, border: '1px solid var(--gray-200)', background: '#fff', maxWidth: 220 };

export default function ApplicationAssign({
  authedFetch, application, onUpdated,
}: {
  authedFetch: (path: string, init?: RequestInit) => Promise<Response>;
  application: { id: string; propertyId?: string; stage?: string };
  onUpdated: (fields: Record<string, any>) => void;
}) {
  const [props, setProps] = useState<Prop[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await authedFetch('/api/staff/properties');
        if (res.ok) { const j = await res.json(); setProps(Array.isArray(j.properties) ? j.properties : []); }
      } catch { /* leave empty */ }
    })();
  }, [authedFetch]);

  const patch = async (fields: Record<string, any>) => {
    setBusy(true);
    onUpdated(fields); // optimistic
    try {
      const res = await authedFetch('/api/staff/applications', { method: 'PATCH', body: JSON.stringify({ id: application.id, ...fields }) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (e) {
      console.error('application update failed:', e);
      alert('Could not save. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const onProperty = (id: string) => {
    const p = props.find(x => x.id === id);
    patch({ propertyId: id, landlordId: p?.landlordId || '', propertyAddress: p?.location || p?.title || '' });
  };

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }} onClick={e => e.stopPropagation()}>
      <select value={application.propertyId || ''} disabled={busy} onChange={e => onProperty(e.target.value)} style={sel} title="Assign to property">
        <option value="">— Assign property —</option>
        {props.map(p => <option key={p.id} value={p.id}>{(p.location || p.title || p.id).slice(0, 40)}{p.landlordName ? ` · ${p.landlordName}` : ''}</option>)}
      </select>
      <select value={application.stage || 'new'} disabled={busy} onChange={e => patch({ stage: e.target.value })} style={sel} title="Stage (landlord sees this)">
        {APPLICATION_PIPELINE.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
        {TERMINAL_STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
      </select>
    </div>
  );
}
