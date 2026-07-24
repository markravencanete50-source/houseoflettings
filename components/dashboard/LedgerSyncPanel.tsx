'use client';
// components/dashboard/LedgerSyncPanel.tsx
// Admin view for the bank-sheet → ledger mirror: reconciliation (does the mirror
// account for every sheet row?) and the unassigned queue (rows whose address
// didn't match a property, resolved by picking a property). Talks to
// /api/staff/ledger-sync. The sheet is never modified.
import { useEffect, useState, useCallback } from 'react';

type Recon = {
  configured: boolean;
  sheet: { count: number; in: number; out: number };
  ledger: { count: number; in: number; out: number };
  unassigned: { count: number; in: number; out: number };
  balanced: boolean;
};
type Row = { id: string; date: string; amount: number; description: string; address: string };
type Prop = { id: string; location?: string; title?: string; landlordName?: string };

const money = (n: number) => `£${Math.abs(n).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function LedgerSyncPanel({ authedFetch }: { authedFetch: (path: string, init?: RequestInit) => Promise<Response> }) {
  const [recon, setRecon] = useState<Recon | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [props, setProps] = useState<Prop[]>([]);
  const [assign, setAssign] = useState<Record<string, string>>({});   // rowId → propertyId
  const [applyAll, setApplyAll] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await authedFetch('/api/staff/ledger-sync');
      const j = await res.json().catch(() => ({}));
      if (res.ok) { setRecon(j.reconciliation || null); setRows(j.unassigned || []); }
      else setMsg(j.message || 'Could not load.');
    } catch { setMsg('Network error.'); }
  }, [authedFetch]);

  useEffect(() => {
    load();
    authedFetch('/api/staff/properties').then(r => r.ok ? r.json() : null).then(j => { if (j?.properties) setProps(j.properties); }).catch(() => {});
  }, [load, authedFetch]);

  const runSync = async () => {
    setBusy('sync'); setMsg('');
    try {
      const res = await authedFetch('/api/staff/ledger-sync', { method: 'POST', body: JSON.stringify({ action: 'sync' }) });
      const j = await res.json().catch(() => ({}));
      setMsg(res.ok ? (j.configured === false ? 'Bank sheet not connected.' : `Imported ${j.imported}, already in ledger ${j.skipped}, unassigned ${j.unassigned}.`) : (j.message || 'Sync failed.'));
      await load();
    } finally { setBusy(null); }
  };

  const resolve = async (row: Row) => {
    const propertyId = assign[row.id];
    if (!propertyId) { setMsg('Pick a property for that row first.'); return; }
    setBusy(row.id); setMsg('');
    try {
      const res = await authedFetch('/api/staff/ledger-sync', { method: 'POST', body: JSON.stringify({ action: 'resolve', id: row.id, propertyId, applyToAddress: !!applyAll[row.id] }) });
      const j = await res.json().catch(() => ({}));
      setMsg(res.ok ? `Assigned ${j.resolved} row${j.resolved === 1 ? '' : 's'}.` : (j.message || 'Could not assign.'));
      await load();
    } finally { setBusy(null); }
  };

  const card: React.CSSProperties = { background: '#fff', border: '1px solid #e9edf5', borderRadius: 16, padding: 20 };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
        <h1 className="dash-section-title" style={{ margin: 0 }}>Bank sync &amp; reconciliation</h1>
        <button onClick={runSync} disabled={!!busy} style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 16px', fontSize: 13, fontWeight: 700, cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.7 : 1 }}>
          {busy === 'sync' ? 'Syncing…' : '↻ Run sync now'}
        </button>
      </div>
      <p style={{ color: 'var(--gray-600)', margin: '8px 0 20px', fontSize: 14 }}>
        The bank Google Sheet is mirrored into the ledger (read-only on the sheet). Reconciliation confirms every row is accounted for before any cutover; unmatched rows are resolved below.
      </p>

      {msg && <div style={{ marginBottom: 16, fontSize: 13, background: '#eef4ff', border: '1px solid #cdddfb', color: '#1e40af', borderRadius: 8, padding: '10px 12px' }}>{msg}</div>}

      {recon && recon.configured === false && (
        <div style={{ ...card, color: '#b45309' }}>The bank sheet isn’t connected (LANDLORD_LEDGER_SHEET_ID not set), so there’s nothing to reconcile yet.</div>
      )}

      {recon && recon.configured !== false && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16, marginBottom: 12 }}>
            <div style={{ ...card }}>
              <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 700 }}>Bank sheet rows</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#0a162f', margin: '6px 0 4px' }}>{recon.sheet.count}</div>
              <div style={{ fontSize: 12.5, color: '#64748b' }}>in {money(recon.sheet.in)} · out {money(recon.sheet.out)}</div>
            </div>
            <div style={{ ...card }}>
              <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 700 }}>Mirrored to ledger</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#0a162f', margin: '6px 0 4px' }}>{recon.ledger.count}</div>
              <div style={{ fontSize: 12.5, color: '#64748b' }}>in {money(recon.ledger.in)} · out {money(recon.ledger.out)}</div>
            </div>
            <div style={{ ...card, borderColor: recon.unassigned.count ? '#fcd9a5' : '#e9edf5' }}>
              <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 700 }}>Unassigned (queue)</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: recon.unassigned.count ? '#b45309' : '#0a162f', margin: '6px 0 4px' }}>{recon.unassigned.count}</div>
              <div style={{ fontSize: 12.5, color: '#64748b' }}>in {money(recon.unassigned.in)} · out {money(recon.unassigned.out)}</div>
            </div>
          </div>
          <div style={{ marginBottom: 24, fontSize: 13.5, fontWeight: 700, color: recon.balanced ? '#2e7d32' : '#b45309' }}>
            {recon.balanced ? '✓ Balanced — every sheet row is either mirrored or queued.' : '⚠ Not balanced yet — run the sync, then clear the queue below.'}
          </div>
        </>
      )}

      <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0a162f', margin: '0 0 12px' }}>Unassigned queue ({rows.length})</h2>
      {rows.length === 0 ? (
        <div style={{ ...card, textAlign: 'center', color: '#9aa4b2' }}>Nothing to assign — every matched row is in the ledger. 🎉</div>
      ) : (
        <div className="dash-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table">
            <thead><tr><th>Date</th><th>Description</th><th>Address</th><th>Amount</th><th>Assign to property</th><th></th></tr></thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id}>
                  <td style={{ whiteSpace: 'nowrap', fontSize: 13 }}>{r.date || '—'}</td>
                  <td style={{ fontSize: 13, color: 'var(--gray-600)' }}>{r.description || '—'}</td>
                  <td style={{ fontSize: 12.5, color: 'var(--gray-600)', maxWidth: 220 }}>{r.address || '—'}</td>
                  <td style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', color: r.amount >= 0 ? '#15803d' : '#c62828' }}>{r.amount >= 0 ? '' : '-'}{money(r.amount)}</td>
                  <td>
                    <select value={assign[r.id] || ''} onChange={e => setAssign(a => ({ ...a, [r.id]: e.target.value }))} style={{ padding: '6px 8px', borderRadius: 6, fontSize: 12, border: '1px solid var(--gray-200)', maxWidth: 220 }}>
                      <option value="">— Select —</option>
                      {props.map(p => <option key={p.id} value={p.id}>{(p.location || p.title || p.id).slice(0, 44)}</option>)}
                    </select>
                    <label style={{ display: 'block', fontSize: 11, color: 'var(--gray-400)', marginTop: 4 }}>
                      <input type="checkbox" checked={!!applyAll[r.id]} onChange={e => setApplyAll(a => ({ ...a, [r.id]: e.target.checked }))} /> all rows with this address
                    </label>
                  </td>
                  <td><button onClick={() => resolve(r)} disabled={busy === r.id} style={{ background: '#0a162f', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 12.5, fontWeight: 700, cursor: busy ? 'default' : 'pointer', opacity: busy === r.id ? 0.6 : 1 }}>{busy === r.id ? '…' : 'Assign'}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
