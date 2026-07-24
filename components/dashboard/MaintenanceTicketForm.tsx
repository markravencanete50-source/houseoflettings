'use client';
// components/dashboard/MaintenanceTicketForm.tsx
// Staff/admin form to raise (or edit) a maintenance ticket against a property.
// Assigning a property links the ticket to that landlord's portal; when the job
// is completed and "Bill to landlord" is on, its cost appears as a deduction on
// the landlord's Account statement. Posts to /api/staff/maintenance.
import { useEffect, useMemo, useState } from 'react';

type Prop = { id: string; location?: string; title?: string; landlordId?: string; landlordName?: string };
type Line = { label: string; amount: string };

const CATEGORIES = ['', 'Plumbing', 'Electrical', 'Gas / boiler', 'EPC', 'Appliance', 'Roofing', 'Locks / security', 'Decoration', 'Grounds / garden', 'General', 'Other'];
const STATUSES = ['open', 'in-progress', 'resolved', 'cancelled'];

const inputStyle: React.CSSProperties = { width: '100%', padding: '9px 11px', border: '1.5px solid var(--gray-200)', borderRadius: 8, fontSize: 13.5, background: '#fff', marginTop: 4 };
const labelStyle: React.CSSProperties = { fontSize: 12.5, fontWeight: 600, color: 'var(--gray-600)' };

export default function MaintenanceTicketForm({
  authedFetch, existing, onSaved, onCancel,
}: {
  authedFetch: (path: string, init?: RequestInit) => Promise<Response>;
  existing?: Record<string, any> | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [props, setProps] = useState<Prop[]>([]);
  const [propertyId, setPropertyId] = useState<string>(existing?.propertyId || '');
  const [title, setTitle] = useState(existing?.title || '');
  const [category, setCategory] = useState(existing?.category || '');
  const [contractor, setContractor] = useState(existing?.contractor || '');
  const [issueDescription, setIssueDescription] = useState(existing?.issueDescription || '');
  const [status, setStatus] = useState(existing?.status || 'open');
  const [billToLandlord, setBillToLandlord] = useState(!!existing?.billToLandlord);
  const [manualCost, setManualCost] = useState(existing?.cost != null ? String(existing.cost) : '');
  const [lines, setLines] = useState<Line[]>(
    Array.isArray(existing?.breakdown) && existing!.breakdown.length
      ? existing!.breakdown.map((b: any) => ({ label: String(b.label || ''), amount: String(b.amount ?? '') }))
      : [],
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await authedFetch('/api/staff/properties');
        if (res.ok) { const j = await res.json(); setProps(Array.isArray(j.properties) ? j.properties : []); }
      } catch { /* picker just stays empty */ }
    })();
  }, [authedFetch]);

  const breakdownTotal = useMemo(() => lines.reduce((s, l) => s + (Number(l.amount) || 0), 0), [lines]);
  const usingBreakdown = lines.some(l => l.label.trim() && Number(l.amount) > 0);
  const cost = usingBreakdown ? breakdownTotal : (Number(manualCost) || 0);
  const selected = props.find(p => p.id === propertyId);

  const setLine = (i: number, k: keyof Line, v: string) => setLines(ls => ls.map((l, idx) => idx === i ? { ...l, [k]: v } : l));

  const submit = async () => {
    setError('');
    if (!issueDescription.trim() && !title.trim()) { setError('Add a title or description of the job.'); return; }
    if (!propertyId && !existing) { setError('Assign the ticket to a property.'); return; }
    setSaving(true);
    try {
      const payload: Record<string, any> = {
        title, category, contractor, issueDescription, status, billToLandlord,
        cost, breakdown: lines.filter(l => l.label.trim() && Number(l.amount) > 0).map(l => ({ label: l.label.trim(), amount: Number(l.amount) })),
      };
      if (selected) {
        payload.propertyId = selected.id;
        payload.landlordId = selected.landlordId || '';
        payload.propertyAddress = selected.location || selected.title || '';
        payload.propertyLabel = selected.location || selected.title || '';
      }
      const res = existing?.id
        ? await authedFetch('/api/staff/maintenance', { method: 'PATCH', body: JSON.stringify({ id: existing.id, ...payload }) })
        : await authedFetch('/api/staff/maintenance', { method: 'POST', body: JSON.stringify(payload) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.message || `HTTP ${res.status}`);
      onSaved();
    } catch (e: any) {
      setError(e.message || 'Could not save the ticket.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 4000, background: 'rgba(10,22,47,.55)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 20, overflowY: 'auto' }} onClick={() => !saving && onCancel()}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 560, background: '#fff', borderRadius: 16, padding: '26px 28px', margin: '24px 0', boxShadow: '0 30px 80px rgba(0,0,0,.4)' }}>
        <h2 style={{ margin: '0 0 4px', fontSize: 19, fontWeight: 800, color: '#0a162f' }}>{existing?.id ? 'Edit maintenance ticket' : 'New maintenance ticket'}</h2>
        <p style={{ margin: '0 0 18px', fontSize: 13, color: '#6b7280' }}>Assign it to a property; the cost reaches the landlord&rsquo;s statement when completed and billed.</p>

        {error && <div style={{ background: '#fdecea', color: '#b3261e', padding: '10px 12px', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>⚠️ {error}</div>}

        <div style={{ display: 'grid', gap: 14 }}>
          <div>
            <label style={labelStyle}>Property *</label>
            <select value={propertyId} onChange={e => setPropertyId(e.target.value)} style={inputStyle}>
              <option value="">— Select a property —</option>
              {props.map(p => <option key={p.id} value={p.id}>{p.location || p.title || p.id}</option>)}
            </select>
            {selected && !selected.landlordId && <div style={{ fontSize: 12, color: '#b45309', marginTop: 4 }}>This property has no landlord assigned, so it won&rsquo;t show on a landlord portal. Assign one in Properties first.</div>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div><label style={labelStyle}>Title</label><input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Boiler service" style={inputStyle} /></div>
            <div><label style={labelStyle}>Category</label><select value={category} onChange={e => setCategory(e.target.value)} style={inputStyle}>{CATEGORIES.map(c => <option key={c} value={c}>{c || '— Select —'}</option>)}</select></div>
          </div>

          <div><label style={labelStyle}>Description</label><textarea value={issueDescription} onChange={e => setIssueDescription(e.target.value)} rows={3} placeholder="What was done / needs doing" style={{ ...inputStyle, resize: 'vertical' }} /></div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div><label style={labelStyle}>Contractor</label><input value={contractor} onChange={e => setContractor(e.target.value)} style={inputStyle} /></div>
            <div><label style={labelStyle}>Status</label><select value={status} onChange={e => setStatus(e.target.value)} style={inputStyle}>{STATUSES.map(s => <option key={s} value={s}>{s.replace('-', ' ')}</option>)}</select></div>
          </div>

          {/* Cost + optional breakdown */}
          <div>
            <label style={labelStyle}>Cost breakdown (optional)</label>
            {lines.map((l, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                <input value={l.label} onChange={e => setLine(i, 'label', e.target.value)} placeholder="Item / labour" style={{ ...inputStyle, marginTop: 0, flex: 1 }} />
                <input type="number" step="0.01" value={l.amount} onChange={e => setLine(i, 'amount', e.target.value)} placeholder="£" style={{ ...inputStyle, marginTop: 0, width: 110 }} />
                <button type="button" onClick={() => setLines(ls => ls.filter((_, idx) => idx !== i))} style={{ border: '1px solid var(--gray-200)', background: '#fff', borderRadius: 8, padding: '0 12px', cursor: 'pointer', color: '#c62828' }}>✕</button>
              </div>
            ))}
            <button type="button" onClick={() => setLines(ls => [...ls, { label: '', amount: '' }])} style={{ marginTop: 8, background: '#eff5ff', color: '#2563eb', border: '1px solid #dbe4ff', borderRadius: 8, padding: '7px 12px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>+ Add line</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, alignItems: 'end' }}>
            <div>
              <label style={labelStyle}>Total cost {usingBreakdown && <span style={{ color: '#9aa4b2', fontWeight: 500 }}>(from breakdown)</span>}</label>
              <input type="number" step="0.01" value={usingBreakdown ? breakdownTotal.toFixed(2) : manualCost} disabled={usingBreakdown} onChange={e => setManualCost(e.target.value)} placeholder="£0.00" style={{ ...inputStyle, background: usingBreakdown ? '#f3f4f6' : '#fff' }} />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, color: '#0a162f', cursor: 'pointer', paddingBottom: 8 }}>
              <input type="checkbox" checked={billToLandlord} onChange={e => setBillToLandlord(e.target.checked)} />
              Bill to landlord (show as deduction)
            </label>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 22 }}>
          <button onClick={onCancel} disabled={saving} style={{ background: '#fff', border: '1px solid var(--gray-200)', borderRadius: 8, padding: '10px 18px', fontSize: 13.5, fontWeight: 600, color: 'var(--gray-600)', cursor: 'pointer' }}>Cancel</button>
          <button onClick={submit} disabled={saving} style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13.5, fontWeight: 700, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.7 : 1 }}>{saving ? 'Saving…' : existing?.id ? 'Save ticket' : 'Create ticket'}</button>
        </div>
      </div>
    </div>
  );
}
