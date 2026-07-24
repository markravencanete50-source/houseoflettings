'use client';
// components/dashboard/LedgerManager.tsx
// Per-property internal ledger: staff record money that isn't in the bank Google
// Sheet (adjustments, one-off fees, credits, manual payments). These merge into
// the landlord's Account statement alongside the live Sheet lines — the Sheet is
// never touched. POSTs/DELETEs /api/staff/ledger.
import { useEffect, useState, useMemo } from 'react';
import { LEDGER_TYPES, defaultDirection } from '@/lib/ledgerEntries';

type Entry = { id: string; date?: string; type?: string; direction?: string; amount?: number; description?: string; reference?: string };

const money = (n: number) => `${n < 0 ? '-' : ''}£${Math.abs(n).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const iso = (d: Date) => d.toISOString().slice(0, 10);
const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 10px', border: '1.5px solid var(--gray-200)', borderRadius: 8, fontSize: 13, background: '#fff' };

export default function LedgerManager({
  authedFetch, property, onClose,
}: {
  authedFetch: (path: string, init?: RequestInit) => Promise<Response>;
  property: { id: string; label: string; landlordId?: string };
  onClose: () => void;
}) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [date, setDate] = useState(iso(new Date()));
  const [type, setType] = useState('rent_in');
  const [direction, setDirection] = useState<'in' | 'out'>('in');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [reference, setReference] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await authedFetch(`/api/staff/ledger?propertyId=${encodeURIComponent(property.id)}`);
      const j = await res.json().catch(() => ({}));
      setEntries(res.ok ? (j.entries || []) : []);
    } catch { setEntries([]); }
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [property.id]);

  const onType = (t: string) => { setType(t); setDirection(defaultDirection(t)); };

  const totals = useMemo(() => {
    let inn = 0, out = 0;
    for (const e of entries) { const a = Math.abs(Number(e.amount) || 0); if (e.direction === 'in') inn += a; else out += a; }
    return { inn, out, net: inn - out };
  }, [entries]);

  const add = async () => {
    setError('');
    if (!(Number(amount) > 0)) { setError('Enter an amount greater than zero.'); return; }
    setSaving(true);
    try {
      const res = await authedFetch('/api/staff/ledger', { method: 'POST', body: JSON.stringify({
        propertyId: property.id, landlordId: property.landlordId || '', propertyLabel: property.label,
        date, type, direction, amount: Number(amount), description, reference,
      }) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.message || `HTTP ${res.status}`);
      setAmount(''); setDescription(''); setReference('');
      await load();
    } catch (e: any) { setError(e.message || 'Could not add the entry.'); }
    finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this entry?')) return;
    setEntries(es => es.filter(e => e.id !== id));
    try { await authedFetch(`/api/staff/ledger?id=${encodeURIComponent(id)}`, { method: 'DELETE' }); } catch { load(); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 4000, background: 'rgba(10,22,47,.55)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 20, overflowY: 'auto' }} onClick={() => !saving && onClose()}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 640, background: '#fff', borderRadius: 16, padding: '24px 26px', margin: '24px 0', boxShadow: '0 30px 80px rgba(0,0,0,.4)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div>
            <h2 style={{ margin: '0 0 3px', fontSize: 18, fontWeight: 800, color: '#0a162f' }}>Account entries</h2>
            <p style={{ margin: 0, fontSize: 12.5, color: '#6b7280' }}>{property.label}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#9aa4b2', lineHeight: 1 }}>×</button>
        </div>
        <p style={{ fontSize: 12.5, color: '#9aa4b2', margin: '10px 0 16px', lineHeight: 1.5 }}>
          These merge into the landlord&rsquo;s statement alongside the bank sheet. Use for anything not already in the sheet.
        </p>

        {error && <div style={{ background: '#fdecea', color: '#b3261e', padding: '9px 12px', borderRadius: 8, fontSize: 13, marginBottom: 12 }}>⚠️ {error}</div>}

        {/* Add form */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 10, alignItems: 'end', background: '#f8fafc', border: '1px solid #eef1f6', borderRadius: 12, padding: 14 }}>
          <div><label style={{ fontSize: 11.5, color: '#6b7280', fontWeight: 600 }}>Date</label><input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} /></div>
          <div><label style={{ fontSize: 11.5, color: '#6b7280', fontWeight: 600 }}>Type</label><select value={type} onChange={e => onType(e.target.value)} style={inputStyle}>{LEDGER_TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}</select></div>
          <div><label style={{ fontSize: 11.5, color: '#6b7280', fontWeight: 600 }}>Direction</label><select value={direction} onChange={e => setDirection(e.target.value as any)} style={inputStyle}><option value="in">Money in</option><option value="out">Money out</option></select></div>
          <div><label style={{ fontSize: 11.5, color: '#6b7280', fontWeight: 600 }}>Amount £</label><input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" style={inputStyle} /></div>
          <div style={{ gridColumn: '1 / -1' }}><label style={{ fontSize: 11.5, color: '#6b7280', fontWeight: 600 }}>Description</label><input value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Gas safety certificate" style={inputStyle} /></div>
          <div><label style={{ fontSize: 11.5, color: '#6b7280', fontWeight: 600 }}>Reference</label><input value={reference} onChange={e => setReference(e.target.value)} style={inputStyle} /></div>
          <div><button onClick={add} disabled={saving} style={{ width: '100%', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 14px', fontSize: 13, fontWeight: 700, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.7 : 1 }}>{saving ? 'Adding…' : 'Add entry'}</button></div>
        </div>

        {/* List */}
        <div style={{ marginTop: 16 }}>
          {loading ? (
            <div style={{ padding: 20, textAlign: 'center', color: '#9aa4b2', fontSize: 13 }}>Loading…</div>
          ) : entries.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: '#9aa4b2', fontSize: 13, border: '1px dashed #d9dfec', borderRadius: 12 }}>No manual entries yet.</div>
          ) : (
            <div style={{ border: '1px solid #eef1f6', borderRadius: 12, overflow: 'hidden' }}>
              {entries.map(e => (
                <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderBottom: '1px solid #f4f6fa', fontSize: 13 }}>
                  <span style={{ color: '#6b7280', whiteSpace: 'nowrap', width: 88 }}>{e.date || '—'}</span>
                  <span style={{ flex: 1, minWidth: 0, color: '#0a162f' }}>{[LEDGER_TYPES.find(t => t.key === e.type)?.label || e.type, e.description].filter(Boolean).join(' — ')}</span>
                  <span style={{ fontWeight: 700, color: e.direction === 'in' ? '#15803d' : '#c62828', whiteSpace: 'nowrap' }}>{e.direction === 'in' ? '' : '-'}{money(Math.abs(Number(e.amount) || 0)).replace('-', '')}</span>
                  <button onClick={() => remove(e.id)} title="Delete" style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#c62828' }}>✕</button>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 18, padding: '10px 14px', background: '#f8fafc', fontSize: 13, fontWeight: 700, color: '#0a162f' }}>
                <span style={{ color: '#15803d' }}>In {money(totals.inn)}</span>
                <span style={{ color: '#c62828' }}>Out {money(totals.out)}</span>
                <span>Net {money(totals.net)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
