'use client';
// components/landlord/TenancyOverview.tsx
// The Gnomen-style tenancy summary shown to a landlord on their property page:
// tenancy details, guarantor, contract, deposit and an accounts overview (no
// agent "quick actions"). Reads the staff-entered tenancy fields off the
// property; the landlord balance comes live from the bank-sheet ledger. Uses the
// pd-* classes defined in PropertyDetailView.

type T = Record<string, any>;

const money = (v: any): string => {
  if (v === undefined || v === null || String(v).trim() === '') return '—';
  const n = Number(String(v).replace(/[^0-9.\-]/g, ''));
  return Number.isFinite(n) ? `£${n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : String(v);
};
const val = (v: any): string => (v === undefined || v === null || String(v).trim() === '' ? '—' : String(v));
const bool = (v: any): string => (v === true ? 'Yes' : 'No');
// yyyy-mm-dd → "24 Jul 2026"; leaves anything else (or empty) as-is/em-dash.
const fmtDate = (v: any): string => {
  const s = String(v ?? '').trim();
  if (!s) return '—';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(`${s}T00:00:00`);
  return isNaN(d.getTime()) ? s : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

function Card({ title, rows }: { title: string; rows: [string, string][] }) {
  const shown = rows.filter(([, v]) => v !== undefined);
  if (!shown.length) return null;
  return (
    <div className="pd-section" style={{ marginTop: 22 }}>
      <h3 className="pd-h">{title}</h3>
      <div className="pd-recap-card">
        {shown.map(([k, v], i) => (
          <div key={k} className="pd-recap" style={i === shown.length - 1 ? { borderBottom: 'none' } : undefined}>
            <span>{k}</span><span>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TenancyOverview({
  t, propertyLabel, landlordName, rentFallback, mgmtPct, monthlyMgmt, netMonthly, furnishing, occupancy, serviceFallback, ledgerNet,
}: {
  t: T;
  propertyLabel: string;
  landlordName?: string;
  rentFallback: number;         // listing/registration rent when no explicit tenancy rent
  mgmtPct: number;
  monthlyMgmt: number;
  netMonthly: number;
  furnishing?: string;
  occupancy?: string;
  serviceFallback?: string;     // package label
  ledgerNet: number | null;     // landlord balance for this tenancy (from the sheet)
}) {
  const feePct = t.managementFeePct || (mgmtPct || '');
  const feeAmount = t.managementFeePct
    ? (rentFallback && Number(t.managementFeePct) ? Math.round((rentFallback * Number(t.managementFeePct)) / 100) : undefined)
    : monthlyMgmt;
  const feeText = feePct
    ? `${money(feeAmount ?? 0)}${feePct ? ` (${feePct}%)` : ''}${t.managementFeeVat ? ' + VAT' : ''}`
    : (monthlyMgmt ? `${money(monthlyMgmt)} (${mgmtPct}%)` : '—');

  const depositStatus = t.depositAmount
    ? `${money(t.depositAmount)} held${t.depositHeldBy ? ` by ${t.depositHeldBy}` : ''}`
    : '—';

  return (
    <>
      {/* Accounts overview — mirrors Gnomen's right-hand panel */}
      <div className="pd-section" style={{ marginTop: 22 }}>
        <h3 className="pd-h">Accounts overview</h3>
        <div className="pd-recap-card">
          <div className="pd-recap"><span>Rent outstanding</span><span>{money(t.rentOutstanding || 0)}</span></div>
          <div className="pd-recap"><span>Rent due on</span><span>{t.rentDueOn ? fmtDate(t.rentDueOn) : '—'}{t.rentFrequency ? ` (every ${t.rentFrequency})` : ''}</span></div>
          <div className="pd-recap"><span>Deposit status</span><span>{depositStatus}</span></div>
          <div className="pd-recap"><span>Landlord balance for this tenancy</span><span>{ledgerNet === null ? '—' : money(ledgerNet)}</span></div>
          <div className="pd-recap" style={{ borderBottom: 'none' }}><span>Landlord float balance</span><span>{money(t.floatBalance || 0)}</span></div>
        </div>
        <p className="pd-note" style={{ marginTop: 8 }}>Landlord balance is your live figure from the account records. See the Account tab for the full statement.</p>
      </div>

      <Card title="Tenancy details" rows={[
        ['Property', propertyLabel],
        ['Landlord', val(landlordName)],
        ['Type', val(t.tenancyType || serviceFallback)],
        ['Flag', val(t.flag)],
        ['Unique payment reference', val(t.uniquePaymentReference)],
        ['Tenant', val(t.tenantName)],
        ['Other tenants', val(t.otherTenants)],
        ['Rent', rentFallback ? `${money(rentFallback)} / month` : '—'],
        ['Management fee', feeText],
        ['Net to you', rentFallback ? `${money(netMonthly)} / month` : '—'],
        ['Automatic statement', t.automaticStatement === undefined ? '—' : bool(t.automaticStatement)],
        ['Email statement to', val(t.emailStatementTo)],
        ['Furnishing', val(furnishing)],
        ['Status', val(occupancy)],
      ]} />

      <Card title="Guarantor" rows={[
        ['Guarantor', val(t.guarantorName)],
        ['Guarantor address', val(t.guarantorAddress)],
        ['Guarantor contact', val(t.guarantorContact)],
        ['Guarantor email', val(t.guarantorEmail)],
      ].filter(([, v]) => v !== '—').length ? [
        ['Guarantor', val(t.guarantorName)],
        ['Guarantor address', val(t.guarantorAddress)],
        ['Guarantor contact', val(t.guarantorContact)],
        ['Guarantor email', val(t.guarantorEmail)],
      ] : []} />

      <Card title="Contract" rows={[
        ['Contract period', (t.contractStart || t.contractEnd) ? `${fmtDate(t.contractStart)} → ${fmtDate(t.contractEnd)}` : '—'],
        ['Renewal status', val(t.renewalStatus)],
        ['Date to vacate', fmtDate(t.dateToVacate)],
        ['Contract end action', val(t.contractEndAction)],
      ]} />

      <Card title="Deposit" rows={[
        ['Deposit protection reference', val(t.depositProtectionRef)],
        ['Deposit amount', t.depositAmount ? money(t.depositAmount) : '—'],
        ['Deposit held by', val(t.depositHeldBy)],
        ['Deposit due to be returned', val(t.depositDueToBeReturned)],
        ['Deposit paid directly', t.depositPaidDirectly === undefined ? '—' : bool(t.depositPaidDirectly)],
      ]} />

      {(t.propertyManager || t.branch || t.tenancyCreatedBy) && (
        <p className="pd-note" style={{ marginTop: 16 }}>
          {[t.propertyManager && `Property manager: ${t.propertyManager}`, t.branch && `Branch: ${t.branch}`, t.tenancyCreatedBy && `Tenancy created by: ${t.tenancyCreatedBy}`].filter(Boolean).join('  ·  ')}
        </p>
      )}
    </>
  );
}
