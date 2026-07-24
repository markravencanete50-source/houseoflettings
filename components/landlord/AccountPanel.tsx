'use client';
// components/landlord/AccountPanel.tsx
// The "Account" tab for a property: this year's money in / out / net and the
// underlying transactions, read from the bank-account sheet via
// /api/landlord/ledger (scoped to the caller's postcodes). Dormant/empty until
// the sheet is connected (env vars set) — shows a friendly note in that case.
import { useState, useEffect, useCallback } from 'react';
import { auth as fbAuth } from '@/lib/firebase';

type Txn = { date: string; description: string; amount: number };
type Ledger = { configured: boolean; error?: boolean; unmatched?: boolean; transactions: Txn[]; totals: { moneyIn: number; moneyOut: number; net: number } };

async function authedFetch(path: string) {
  const headers: Record<string, string> = {};
  const u = fbAuth?.currentUser;
  if (u) { try { headers['Authorization'] = `Bearer ${await u.getIdToken()}`; } catch { /* cookie */ } }
  return fetch(path, { headers, credentials: 'same-origin' });
}

const money = (n: number) => `${n < 0 ? '-' : ''}£${Math.abs(n).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// `propertyId` is the overview property id — the server resolves this property
// from the caller's own records and matches the sheet by postcode OR address, so
// even a property with no postcode on file still shows its figures. `postcode`
// is passed through only as a legacy fallback.
export default function AccountPanel({ propertyId, postcode }: { propertyId: string; postcode?: string }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Ledger | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = propertyId
        ? `id=${encodeURIComponent(propertyId)}`
        : `postcode=${encodeURIComponent(postcode || '')}`;
      const res = await authedFetch(`/api/landlord/ledger?${qs}`);
      setData(res.ok ? await res.json() : null);
    } catch { setData(null); }
    setLoading(false);
  }, [propertyId, postcode]);
  useEffect(() => { load(); }, [load]);

  const year = new Date().getFullYear();
  const t = data?.totals;

  return (
    <div className="ac">
      {loading ? (
        <div className="ac-loading">Loading your account…</div>
      ) : data?.unmatched ? (
        <div className="ac-note">We don&apos;t have a postcode or full address on file for this property yet, so we can&apos;t match your account records to it. Please contact your agent to add the property&apos;s postcode.</div>
      ) : !data || data.configured === false ? (
        <div className="ac-note">Your live account statement isn&apos;t connected yet. Once it is, your money in and out for this property will appear here automatically.</div>
      ) : data.error ? (
        <div className="ac-note ac-note--warn">We couldn&apos;t load your figures just now. Please try again shortly.</div>
      ) : (
        <>
          <div className="ac-cards">
            <div className="ac-card in">
              <div className="ac-card-l">Money in <span>{year} · received</span></div>
              <div className="ac-card-v">{money(t!.moneyIn)}</div>
            </div>
            <div className="ac-card out">
              <div className="ac-card-l">Money out <span>{year} · paid out</span></div>
              <div className="ac-card-v">{money(t!.moneyOut)}</div>
            </div>
            <div className="ac-card net">
              <div className="ac-card-l">Net <span>{year} · in − out</span></div>
              <div className="ac-card-v">{money(t!.net)}</div>
            </div>
          </div>
          <p className="ac-sub">Figures cover this year ({year}) for this property, from your account records. They refresh automatically when the account is updated.</p>

          <div className="ac-txn-h">Transactions <span>{data.transactions.length}</span></div>
          {data.transactions.length === 0 ? (
            <div className="ac-empty">No transactions recorded for this property in {year} yet.</div>
          ) : (
            <div className="ac-table-wrap">
              <table className="ac-table">
                <thead><tr><th>Date</th><th>Description</th><th style={{ textAlign: 'right' }}>In</th><th style={{ textAlign: 'right' }}>Out</th></tr></thead>
                <tbody>
                  {data.transactions.map((x, i) => (
                    <tr key={i}>
                      <td style={{ whiteSpace: 'nowrap' }}>{x.date || '—'}</td>
                      <td>{x.description || '—'}</td>
                      <td style={{ textAlign: 'right', color: '#15803d', fontWeight: 600 }}>{x.amount > 0 ? money(x.amount) : ''}</td>
                      <td style={{ textAlign: 'right', color: '#c62828', fontWeight: 600 }}>{x.amount < 0 ? money(-x.amount) : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <style>{`
        .ac-loading, .ac-note { font-size: 14px; color: #6b7280; padding: 16px 0; line-height: 1.6; }
        .ac-note { background: #eef4ff; color: #1e40af; border: 1px solid #cdddfb; border-radius: 12px; padding: 16px 18px; }
        .ac-note--warn { background: #fdecea; color: #b3261e; border-color: #f6bcb6; }
        .ac-cards { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; }
        .ac-card { background: #fff; border: 1px solid #e9edf5; border-radius: 16px; padding: 20px; }
        .ac-card.in { border-top: 3px solid #2e7d32; }
        .ac-card.out { border-top: 3px solid #ef6c00; }
        .ac-card.net { border-top: 3px solid #2563eb; }
        .ac-card-l { font-size: 12px; color: #6b7280; font-weight: 600; }
        .ac-card-l span { display: block; font-size: 10.5px; color: #9aa4b2; font-weight: 500; margin-top: 2px; }
        .ac-card-v { font-size: 26px; font-weight: 800; color: #0a162f; margin-top: 8px; letter-spacing: -.5px; }
        .ac-sub { font-size: 12px; color: #9aa4b2; margin: 12px 2px 0; line-height: 1.6; }
        .ac-txn-h { font-size: 15px; font-weight: 800; color: #0a162f; margin: 26px 0 12px; display: flex; align-items: center; gap: 10px; }
        .ac-txn-h span { font-size: 11.5px; font-weight: 700; color: #64748b; background: #eef2f7; padding: 2px 9px; border-radius: 20px; }
        .ac-empty { background: #fff; border: 1px dashed #d9dfec; border-radius: 14px; padding: 22px; text-align: center; color: #8a94a3; font-size: 14px; }
        .ac-table-wrap { background: #fff; border: 1px solid #e9edf5; border-radius: 14px; overflow: hidden; overflow-x: auto; }
        .ac-table { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 480px; }
        .ac-table th { text-align: left; padding: 12px 16px; font-size: 11px; text-transform: uppercase; letter-spacing: .5px; color: #9aa4b2; background: #f8fafc; border-bottom: 1px solid #eef1f6; font-weight: 700; }
        .ac-table td { padding: 12px 16px; border-bottom: 1px solid #f4f6fa; color: #0a162f; vertical-align: top; }
        .ac-table tr:last-child td { border-bottom: none; }

        :root[data-portal-theme="dark"] .ac-card, :root[data-portal-theme="dark"] .ac-empty, :root[data-portal-theme="dark"] .ac-table-wrap { background: #13203a; border-color: #22314c; }
        :root[data-portal-theme="dark"] .ac-card-v, :root[data-portal-theme="dark"] .ac-txn-h { color: #eef3fa; }
        :root[data-portal-theme="dark"] .ac-table td { color: #dbe3ee; border-color: #1e2c45; }
        :root[data-portal-theme="dark"] .ac-table th { background: #101c30; color: #93a3b8; border-color: #22314c; }
        :root[data-portal-theme="dark"] .ac-note { background: #101f38; color: #93b4f5; border-color: #24406c; }
        :root[data-portal-theme="dark"] .ac-loading, :root[data-portal-theme="dark"] .ac-empty { color: #93a3b8; }

        @media (max-width: 640px) { .ac-cards { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
