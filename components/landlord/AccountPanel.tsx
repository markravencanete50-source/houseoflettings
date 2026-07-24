'use client';
// components/landlord/AccountPanel.tsx
// The "Account" tab for a property, presented as a landlord STATEMENT (modelled
// on a letting-agent CRM statement): an accounts-overview strip, then Received
// (rent in) and Paid out (money out) sections with sub-totals, and a statement
// balance — over a selectable period. All figures come from the bank-account
// sheet via /api/landlord/ledger (scoped to the caller's own property). Dormant
// until the sheet is connected; shows a friendly note otherwise.
import { useState, useEffect, useCallback } from 'react';
import { auth as fbAuth } from '@/lib/firebase';

type Txn = { date: string; description: string; amount: number; category?: string; group?: 'received' | 'deduction' | 'payment' };
type Ledger = { configured: boolean; error?: boolean; unmatched?: boolean; transactions: Txn[]; totals: { moneyIn: number; moneyOut: number; net: number } };

async function authedFetch(path: string) {
  const headers: Record<string, string> = {};
  const u = fbAuth?.currentUser;
  if (u) { try { headers['Authorization'] = `Bearer ${await u.getIdToken()}`; } catch { /* cookie */ } }
  return fetch(path, { headers, credentials: 'same-origin' });
}

const money = (n: number) => `${n < 0 ? '-' : ''}£${Math.abs(n).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const iso = (d: Date) => d.toISOString().slice(0, 10);
const prettyDay = (s: string) => {
  const d = new Date(`${s}T00:00:00`);
  return isNaN(d.getTime()) ? s : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function AccountPanel({
  propertyId, postcode, propertyLabel, rent = 0, mgmtPct = 0, tenancyStart, tenancyEnd,
}: {
  propertyId: string;
  postcode?: string;
  propertyLabel?: string;
  rent?: number;
  mgmtPct?: number;
  tenancyStart?: string;
  tenancyEnd?: string;
}) {
  const now = new Date();
  const year = now.getFullYear();
  const [from, setFrom] = useState(`${year}-01-01`);
  const [to, setTo] = useState(iso(now));
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Ledger | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (propertyId) qs.set('id', propertyId); else if (postcode) qs.set('postcode', postcode);
      if (from) qs.set('from', from);
      if (to) qs.set('to', to);
      const res = await authedFetch(`/api/landlord/ledger?${qs.toString()}`);
      setData(res.ok ? await res.json() : null);
    } catch { setData(null); }
    setLoading(false);
  }, [propertyId, postcode, from, to]);
  useEffect(() => { load(); }, [load]);

  const preset = (which: 'ytd' | 'last-year' | '12m' | 'all') => {
    const t = new Date();
    if (which === 'ytd') { setFrom(`${t.getFullYear()}-01-01`); setTo(iso(t)); }
    else if (which === 'last-year') { setFrom(`${t.getFullYear() - 1}-01-01`); setTo(`${t.getFullYear() - 1}-12-31`); }
    else if (which === '12m') { const s = new Date(t); s.setFullYear(s.getFullYear() - 1); setFrom(iso(s)); setTo(iso(t)); }
    else { setFrom('2000-01-01'); setTo(iso(t)); }
  };

  const t = data?.totals;
  const monthlyMgmt = rent && mgmtPct ? Math.round((rent * mgmtPct) / 100) : 0;
  const netMonthly = rent ? Math.max(0, Math.round(rent - monthlyMgmt)) : 0;
  // Landlord statement model: rent is collected FOR the landlord (received), the
  // agent's fees + repairs are deductions, and money paid out to the landlord is
  // a payment. Balance held for the landlord = received − deductions − payments.
  const txns = data?.transactions || [];
  const received = txns.filter(x => x.group === 'received');
  const deductions = txns.filter(x => x.group === 'deduction');
  const payments = txns.filter(x => x.group === 'payment');
  const receivedTotal = received.reduce((s, x) => s + Math.abs(x.amount), 0);
  const deductionTotal = deductions.reduce((s, x) => s + Math.abs(x.amount), 0);
  const paymentTotal = payments.reduce((s, x) => s + Math.abs(x.amount), 0);
  const balance = receivedTotal - deductionTotal - paymentTotal;

  const periodPicker = (
    <div className="ac-period">
      <div className="ac-presets">
        {[['ytd', 'This year'], ['last-year', 'Last year'], ['12m', 'Last 12 months'], ['all', 'All time']].map(([k, label]) => (
          <button key={k} type="button" className="ac-preset" onClick={() => preset(k as any)}>{label}</button>
        ))}
      </div>
      <div className="ac-dates">
        <label>From <input type="date" value={from} max={to} onChange={e => setFrom(e.target.value)} /></label>
        <label>To <input type="date" value={to} min={from} onChange={e => setTo(e.target.value)} /></label>
      </div>
    </div>
  );

  return (
    <div className="ac">
      {periodPicker}

      {loading ? (
        <div className="ac-loading">Loading your statement…</div>
      ) : data?.unmatched ? (
        <div className="ac-note">We don&apos;t have a postcode or full address on file for this property yet, so we can&apos;t match your account records to it. Please contact your agent to add the property&apos;s postcode.</div>
      ) : !data || data.configured === false ? (
        <div className="ac-note">Your live account statement isn&apos;t connected yet. Once it is, your money in and out for this property will appear here automatically.</div>
      ) : data.error ? (
        <div className="ac-note ac-note--warn">We couldn&apos;t load your figures just now. Please try again shortly.</div>
      ) : (
        <>
          {/* Statement header */}
          <div className="ac-stmt-head">
            <div>
              <div className="ac-stmt-rel">Statement for</div>
              <div className="ac-stmt-prop">{propertyLabel || 'This property'}</div>
            </div>
            <div className="ac-stmt-date">{prettyDay(from)} – {prettyDay(to)}</div>
          </div>

          {/* Accounts overview */}
          <div className="ac-cards">
            <div className="ac-card in">
              <div className="ac-card-l">Rent received <span>collected for you</span></div>
              <div className="ac-card-v">{money(receivedTotal)}</div>
            </div>
            <div className="ac-card out">
              <div className="ac-card-l">Deductions <span>fees &amp; repairs</span></div>
              <div className="ac-card-v">{money(deductionTotal)}</div>
            </div>
            <div className="ac-card net">
              <div className="ac-card-l">Paid to you <span>this period</span></div>
              <div className="ac-card-v">{money(paymentTotal)}</div>
            </div>
          </div>

          {(rent > 0 || tenancyStart) && (
            <div className="ac-terms">
              {rent > 0 && <span><b>Rent</b> {money(rent)}/mo</span>}
              {mgmtPct > 0 && <span><b>Management fee</b> {money(monthlyMgmt)}/mo ({mgmtPct}%)</span>}
              {rent > 0 && <span><b>Net to you</b> {money(netMonthly)}/mo</span>}
              {(tenancyStart || tenancyEnd) && <span><b>Tenancy</b> {tenancyStart || '—'}{tenancyEnd ? ` → ${tenancyEnd}` : ''}</span>}
            </div>
          )}

          <p className="ac-sub">The tenant pays their rent to House of Lettings; we take the management fee (and any agreed costs), then pay the balance to you. Figures refresh automatically when your account is updated.</p>

          {/* Received */}
          <div className="ac-sec-h">Received <span>{received.length}</span></div>
          {received.length === 0 ? (
            <div className="ac-empty">No rent received for this property in this period.</div>
          ) : (
            <div className="ac-table-wrap">
              <table className="ac-table">
                <thead><tr><th>Date</th><th>Description</th><th style={{ textAlign: 'right' }}>Amount</th></tr></thead>
                <tbody>
                  {received.map((x, i) => (
                    <tr key={i}>
                      <td style={{ whiteSpace: 'nowrap' }}>{x.date || '—'}</td>
                      <td>{x.description || '—'}</td>
                      <td style={{ textAlign: 'right', color: '#15803d', fontWeight: 600 }}>{money(Math.abs(x.amount))}</td>
                    </tr>
                  ))}
                  <tr className="ac-total-row"><td /><td style={{ textAlign: 'right', fontWeight: 700 }}>Total received</td><td style={{ textAlign: 'right', fontWeight: 800 }}>{money(receivedTotal)}</td></tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Deductions (management fee, maintenance, other charges) */}
          <div className="ac-sec-h">Deductions <span>{deductions.length}</span></div>
          {deductions.length === 0 ? (
            <div className="ac-empty">No deductions for this property in this period.</div>
          ) : (
            <div className="ac-table-wrap">
              <table className="ac-table">
                <thead><tr><th>Date</th><th>Description</th><th style={{ textAlign: 'right' }}>Amount</th></tr></thead>
                <tbody>
                  {deductions.map((x, i) => (
                    <tr key={i}>
                      <td style={{ whiteSpace: 'nowrap' }}>{x.date || '—'}</td>
                      <td>{x.description || '—'}{x.category === 'maintenance' ? ' · maintenance' : ''}</td>
                      <td style={{ textAlign: 'right', color: '#c62828', fontWeight: 600 }}>{money(Math.abs(x.amount))}</td>
                    </tr>
                  ))}
                  <tr className="ac-total-row"><td /><td style={{ textAlign: 'right', fontWeight: 700 }}>Total deductions</td><td style={{ textAlign: 'right', fontWeight: 800 }}>{money(deductionTotal)}</td></tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Payments to the landlord */}
          <div className="ac-sec-h">Payments to you <span>{payments.length}</span></div>
          {payments.length === 0 ? (
            <div className="ac-empty">No payments made to you in this period.</div>
          ) : (
            <div className="ac-table-wrap">
              <table className="ac-table">
                <thead><tr><th>Date</th><th>Description</th><th style={{ textAlign: 'right' }}>Amount</th></tr></thead>
                <tbody>
                  {payments.map((x, i) => (
                    <tr key={i}>
                      <td style={{ whiteSpace: 'nowrap' }}>{x.date || '—'}</td>
                      <td>{x.description || '—'}</td>
                      <td style={{ textAlign: 'right', color: '#0a162f', fontWeight: 600 }}>{money(Math.abs(x.amount))}</td>
                    </tr>
                  ))}
                  <tr className="ac-total-row"><td /><td style={{ textAlign: 'right', fontWeight: 700 }}>Total paid to you</td><td style={{ textAlign: 'right', fontWeight: 800 }}>{money(paymentTotal)}</td></tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Summary */}
          <div className="ac-summary">
            <div><span>Rent received</span><b>{money(receivedTotal)}</b></div>
            <div><span>Less deductions</span><b style={{ color: '#c62828' }}>-{money(deductionTotal)}</b></div>
            <div><span>Less paid to you</span><b>-{money(paymentTotal)}</b></div>
            <div><span>Balance held for you</span><b>{money(balance)}</b></div>
          </div>
          <p className="ac-disc">This statement is a running record of transactions on your account for this property. “Balance held for you” is rent received less deductions and payments already made to you. Contact your agent with any query.</p>
        </>
      )}

      <style>{`
        .ac-loading, .ac-note { font-size: 14px; color: #6b7280; padding: 16px 0; line-height: 1.6; }
        .ac-note { background: #eef4ff; color: #1e40af; border: 1px solid #cdddfb; border-radius: 12px; padding: 16px 18px; }
        .ac-note--warn { background: #fdecea; color: #b3261e; border-color: #f6bcb6; }

        .ac-period { display: flex; justify-content: space-between; align-items: center; gap: 14px; flex-wrap: wrap; margin-bottom: 18px; }
        .ac-presets { display: flex; gap: 8px; flex-wrap: wrap; }
        .ac-preset { background: #fff; border: 1px solid #e2e7f0; border-radius: 8px; padding: 7px 12px; font-size: 12.5px; font-weight: 600; color: #374151; cursor: pointer; }
        .ac-preset:hover { border-color: #2563eb; color: #2563eb; }
        .ac-dates { display: flex; gap: 10px; flex-wrap: wrap; }
        .ac-dates label { font-size: 12px; color: #6b7280; display: inline-flex; align-items: center; gap: 6px; }
        .ac-dates input { border: 1px solid #e2e7f0; border-radius: 8px; padding: 6px 9px; font-size: 13px; color: #0a162f; background: #fff; }

        .ac-stmt-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 14px; flex-wrap: wrap; padding: 14px 16px; background: #f6f8fc; border: 1px solid #e9edf5; border-radius: 12px; margin-bottom: 16px; }
        .ac-stmt-rel { font-size: 11px; text-transform: uppercase; letter-spacing: .06em; color: #8a94a3; }
        .ac-stmt-prop { font-size: 15px; font-weight: 800; color: #0a162f; margin-top: 2px; }
        .ac-stmt-date { font-size: 13px; font-weight: 600; color: #475569; }

        .ac-cards { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; }
        .ac-card { background: #fff; border: 1px solid #e9edf5; border-radius: 16px; padding: 20px; }
        .ac-card.in { border-top: 3px solid #2e7d32; }
        .ac-card.out { border-top: 3px solid #ef6c00; }
        .ac-card.net { border-top: 3px solid #2563eb; }
        .ac-card-l { font-size: 12px; color: #6b7280; font-weight: 600; }
        .ac-card-l span { display: block; font-size: 10.5px; color: #9aa4b2; font-weight: 500; margin-top: 2px; }
        .ac-card-v { font-size: 24px; font-weight: 800; color: #0a162f; margin-top: 8px; letter-spacing: -.5px; }

        .ac-terms { display: flex; flex-wrap: wrap; gap: 8px 20px; margin: 14px 2px 0; font-size: 13px; color: #475569; }
        .ac-terms b { color: #0a162f; }
        .ac-sub { font-size: 12px; color: #9aa4b2; margin: 12px 2px 4px; line-height: 1.6; }

        .ac-sec-h { font-size: 15px; font-weight: 800; color: #0a162f; margin: 22px 0 10px; display: flex; align-items: center; gap: 10px; }
        .ac-sec-h span { font-size: 11.5px; font-weight: 700; color: #64748b; background: #eef2f7; padding: 2px 9px; border-radius: 20px; }
        .ac-empty { background: #fff; border: 1px dashed #d9dfec; border-radius: 14px; padding: 18px; text-align: center; color: #8a94a3; font-size: 13.5px; }
        .ac-table-wrap { background: #fff; border: 1px solid #e9edf5; border-radius: 14px; overflow: hidden; overflow-x: auto; }
        .ac-table { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 420px; }
        .ac-table th { text-align: left; padding: 11px 16px; font-size: 11px; text-transform: uppercase; letter-spacing: .5px; color: #9aa4b2; background: #f8fafc; border-bottom: 1px solid #eef1f6; font-weight: 700; }
        .ac-table td { padding: 11px 16px; border-bottom: 1px solid #f4f6fa; color: #0a162f; vertical-align: top; }
        .ac-table tr:last-child td { border-bottom: none; }
        .ac-total-row td { background: #f8fafc; color: #0a162f; }

        .ac-summary { margin-top: 20px; border: 1px solid #e9edf5; border-radius: 14px; overflow: hidden; background: #fff; }
        .ac-summary div { display: flex; justify-content: space-between; padding: 12px 18px; border-bottom: 1px solid #f2f4f9; font-size: 14px; color: #475569; }
        .ac-summary div:last-child { border-bottom: none; }
        .ac-summary b { color: #0a162f; }
        .ac-disc { font-size: 11.5px; color: #9aa4b2; margin: 12px 2px 0; line-height: 1.6; }

        :root[data-portal-theme="dark"] .ac-preset, :root[data-portal-theme="dark"] .ac-dates input,
        :root[data-portal-theme="dark"] .ac-card, :root[data-portal-theme="dark"] .ac-empty,
        :root[data-portal-theme="dark"] .ac-table-wrap, :root[data-portal-theme="dark"] .ac-summary,
        :root[data-portal-theme="dark"] .ac-stmt-head { background: #13203a; border-color: #22314c; }
        :root[data-portal-theme="dark"] .ac-preset, :root[data-portal-theme="dark"] .ac-dates input { color: #dbe3ee; }
        :root[data-portal-theme="dark"] .ac-card-v, :root[data-portal-theme="dark"] .ac-sec-h,
        :root[data-portal-theme="dark"] .ac-stmt-prop, :root[data-portal-theme="dark"] .ac-summary b,
        :root[data-portal-theme="dark"] .ac-terms b { color: #eef3fa; }
        :root[data-portal-theme="dark"] .ac-table td, :root[data-portal-theme="dark"] .ac-total-row td { color: #dbe3ee; border-color: #1e2c45; }
        :root[data-portal-theme="dark"] .ac-table th, :root[data-portal-theme="dark"] .ac-total-row td { background: #101c30; color: #93a3b8; border-color: #22314c; }
        :root[data-portal-theme="dark"] .ac-summary div { border-color: #1e2c45; color: #93a3b8; }
        :root[data-portal-theme="dark"] .ac-note { background: #101f38; color: #93b4f5; border-color: #24406c; }
        :root[data-portal-theme="dark"] .ac-loading, :root[data-portal-theme="dark"] .ac-empty { color: #93a3b8; }

        @media (max-width: 640px) { .ac-cards { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
