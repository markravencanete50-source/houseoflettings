'use client';
// components/landlord/PropertyDetailView.tsx
// Full property view for the landlord portal — money in/out, current package +
// inclusions, and the tenant applications + maintenance scoped to this property.
// Rendered as a page (not a modal) at /landlord-portal/property/[id].
import Link from 'next/link';
import { findBundle } from '@/lib/agreementContent';

export type PDProp = { id: string; label: string; postcode?: string; city?: string; type?: string; bedrooms?: string; bathrooms?: string; furnishing?: string; rent?: string; occupancy?: string; availableFrom?: string; tenancyStart?: string; packageId?: string; packageLabel?: string };
export type PDApplication = { id: string; fullName: string; propertyAddress: string; postcode?: string; rent: string; leaseTerm: string; status: string; submittedAt: string | null };
export type PDMaintenance = { id: string; fullName: string; propertyAddress: string; postcode?: string; issueDescription: string; status: string; submittedAt: string | null };

const fmtDate = (s: string | null) => s ? new Date(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const MAINT_META: Record<string, { label: string; bg: string; color: string }> = {
  'open': { label: 'Open', bg: '#fff3e0', color: '#ef6c00' },
  'in-progress': { label: 'In progress', bg: '#e3f2fd', color: '#1565c0' },
  'resolved': { label: 'Resolved', bg: '#e8f5e9', color: '#2e7d32' },
  'cancelled': { label: 'Cancelled', bg: '#f3f4f6', color: '#6b7280' },
};

function Recap({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return <div className="pd-recap" style={last ? { borderBottom: 'none' } : undefined}><span>{label}</span><span>{value}</span></div>;
}

export default function PropertyDetailView({ prop, applications, maintenance }: { prop: PDProp; applications: PDApplication[]; maintenance: PDMaintenance[] }) {
  const rent = parseFloat(String(prop.rent || '').replace(/[^\d.]/g, '')) || 0;
  const bundle = findBundle(prop.packageId || prop.packageLabel || '');
  const mgmtPct = bundle?.mgmtFee ? (parseFloat(String(bundle.mgmtFee).replace(/[^\d.]/g, '')) || 0) : 0;
  const monthlyMgmt = Math.round(rent * mgmtPct / 100);
  const netMonthly = Math.max(0, Math.round(rent - monthlyMgmt));
  const money = (n: number) => `£${n.toLocaleString('en-GB')}`;

  const apps = applications.filter(a => a.postcode && prop.postcode && a.postcode === prop.postcode);
  const maint = maintenance.filter(m => m.postcode && prop.postcode && m.postcode === prop.postcode);
  const openMaint = maint.filter(m => m.status === 'open' || m.status === 'in-progress').length;

  return (
    <div className="pd-page">
      <div className="pd-hero">
        <div className="pd-hero-inner">
          <Link href="/landlord-portal?tab=properties" className="pd-back">← Back to my properties</Link>
          <div className="pd-eyebrow">🏠 Property</div>
          <h1 className="pd-title">{prop.label}</h1>
          <div className="pd-meta">
            {prop.type && <span>{prop.type}</span>}
            {prop.bedrooms && <span>{prop.bedrooms} bed</span>}
            {prop.bathrooms && <span>{prop.bathrooms} bath</span>}
            {prop.furnishing && <span>{prop.furnishing}</span>}
            {prop.occupancy && <span>{prop.occupancy}</span>}
          </div>
        </div>
      </div>

      <div className="pd-body">
        <div className="pd-money">
          <div className="pd-money-card in">
            <div className="pd-money-label">Money in <span>rent / month</span></div>
            <div className="pd-money-val">{money(rent)}</div>
            <div className="pd-money-sub">{money(rent * 12)} / year</div>
          </div>
          <div className="pd-money-card out">
            <div className="pd-money-label">Money out <span>management fee</span></div>
            <div className="pd-money-val">{money(monthlyMgmt)}</div>
            <div className="pd-money-sub">{mgmtPct ? `${mgmtPct}% of rent` : 'no management fee'}</div>
          </div>
          <div className="pd-money-card net">
            <div className="pd-money-label">Net to you <span>est. / month</span></div>
            <div className="pd-money-val">{money(netMonthly)}</div>
            <div className="pd-money-sub">{money(netMonthly * 12)} / year</div>
          </div>
        </div>
        <p className="pd-note">Figures are estimates based on your expected rent and package — not a statement of account.</p>

        <div className="pd-section">
          <h3 className="pd-h">Your package</h3>
          {bundle ? (
            <div className="pd-pkg">
              <div className="pd-pkg-name">{bundle.label}{bundle.badge && <span className="pd-pkg-badge">{bundle.badge}</span>}</div>
              <div className="pd-pkg-fee">{bundle.mgmtFee ? `${bundle.mgmtFee} management` : 'No management fee'} · {bundle.setupFee} set up</div>
              <div className="pd-incl-title">What's included</div>
              {bundle.groups.map(g => (
                <div key={g.heading} className="pd-incl-group">
                  <div className="pd-incl-h">{g.heading}</div>
                  <ul className="pd-incl-ul">{g.items.map(it => <li key={it}>{it}</li>)}</ul>
                </div>
              ))}
            </div>
          ) : <div className="pd-empty">Package: {prop.packageLabel || '—'}</div>}
          <a href="/pricing" className="pd-pkg-cta">Compare or change your package →</a>
        </div>

        <div className="pd-section">
          <h3 className="pd-h">Tenant applications <span className="pd-count">{apps.length}</span></h3>
          {apps.length === 0 ? <div className="pd-empty">No applications for this property yet.</div> : (
            <div className="pd-list">
              {apps.map(a => (
                <div key={a.id} className="pd-row">
                  <div><div className="pd-row-t">{a.fullName || 'Applicant'}</div><div className="pd-row-s">{a.leaseTerm || ''}{a.rent ? ` · ${a.rent}` : ''}</div></div>
                  <div style={{ textAlign: 'right' }}><span className="pd-badge">{a.status}</span><div className="pd-row-s">{fmtDate(a.submittedAt)}</div></div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pd-section">
          <h3 className="pd-h">Maintenance <span className="pd-count">{maint.length}{openMaint ? ` · ${openMaint} open` : ''}</span></h3>
          {maint.length === 0 ? <div className="pd-empty">No maintenance requests for this property. 🎉</div> : (
            <div className="pd-list">
              {maint.map(m => {
                const meta = MAINT_META[m.status] || MAINT_META['open'];
                return (
                  <div key={m.id} className="pd-row">
                    <div style={{ minWidth: 0 }}><div className="pd-row-t" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.issueDescription}</div><div className="pd-row-s">{m.fullName}</div></div>
                    <div style={{ textAlign: 'right' }}><span className="pd-badge" style={{ background: meta.bg, color: meta.color }}>{meta.label}</span><div className="pd-row-s">{fmtDate(m.submittedAt)}</div></div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <Link href="/maintenance" className="pd-report">+ Report maintenance for this property</Link>
      </div>

      <style>{`
        .pd-page { min-height: 100vh; background: #f4f6fb; font-family: 'Poppins', sans-serif; color: #0a162f; }
        .pd-hero { background: linear-gradient(135deg,#0a162f,#14294f 60%,#c0392b 200%); color: #fff; }
        .pd-hero-inner { max-width: 820px; margin: 0 auto; padding: 26px 28px 30px; }
        .pd-back { color: rgba(255,255,255,.75); font-size: 13px; font-weight: 600; text-decoration: none; }
        .pd-back:hover { color: #fff; }
        .pd-eyebrow { font-size: 11px; letter-spacing: .18em; text-transform: uppercase; opacity: .65; margin-top: 16px; }
        .pd-title { font-size: 26px; font-weight: 800; margin: 6px 0 12px; letter-spacing: -.5px; }
        .pd-meta { display: flex; flex-wrap: wrap; gap: 7px; }
        .pd-meta span { background: rgba(255,255,255,.14); font-size: 12px; padding: 4px 11px; border-radius: 20px; text-transform: capitalize; }
        .pd-body { max-width: 820px; margin: 0 auto; padding: 26px 28px 60px; }
        .pd-recap { display: flex; justify-content: space-between; gap: 16px; padding: 11px 0; border-bottom: 1px solid #f0f2f7; font-size: 14px; }
        .pd-recap span:first-child { color: #8a94a3; }
        .pd-recap span:last-child { color: #0a162f; font-weight: 600; text-align: right; }
        .pd-money { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; }
        .pd-money-card { background: #fff; border: 1px solid #e9edf5; border-radius: 16px; padding: 20px; }
        .pd-money-card.in { border-top: 3px solid #2e7d32; }
        .pd-money-card.out { border-top: 3px solid #ef6c00; }
        .pd-money-card.net { border-top: 3px solid #2563eb; }
        .pd-money-label { font-size: 12px; color: #6b7280; font-weight: 600; }
        .pd-money-label span { display: block; font-size: 10.5px; color: #9aa4b2; font-weight: 500; margin-top: 2px; }
        .pd-money-val { font-size: 28px; font-weight: 800; color: #0a162f; margin: 8px 0 2px; letter-spacing: -.5px; }
        .pd-money-sub { font-size: 12px; color: #8a94a3; }
        .pd-note { font-size: 12px; color: #9aa4b2; margin: 12px 2px 0; }
        .pd-section { margin-top: 28px; }
        .pd-h { font-size: 16px; font-weight: 800; color: #0a162f; margin: 0 0 14px; display: flex; align-items: center; gap: 10px; }
        .pd-count { font-size: 11.5px; font-weight: 700; color: #64748b; background: #eef2f7; padding: 2px 9px; border-radius: 20px; }
        .pd-pkg { background: #fff; border: 1px solid #e9edf5; border-radius: 16px; padding: 22px; }
        .pd-pkg-name { font-size: 17px; font-weight: 800; color: #0a162f; }
        .pd-pkg-badge { font-size: 10px; font-weight: 700; background: #c0392b; color: #fff; padding: 2px 8px; border-radius: 20px; margin-left: 8px; text-transform: uppercase; }
        .pd-pkg-fee { font-size: 13px; color: #6b7280; margin-top: 3px; }
        .pd-incl-title { font-size: 12px; font-weight: 700; color: #8a94a3; text-transform: uppercase; letter-spacing: .04em; margin: 18px 0 10px; }
        .pd-incl-group { margin-bottom: 12px; }
        .pd-incl-h { font-size: 13px; font-weight: 700; color: #15803d; margin-bottom: 4px; }
        .pd-incl-ul { margin: 0; padding-left: 18px; }
        .pd-incl-ul li { font-size: 13px; color: #374151; line-height: 1.6; margin-bottom: 2px; }
        .pd-pkg-cta { display: inline-block; margin-top: 8px; color: #c0392b; font-weight: 700; font-size: 13px; text-decoration: none; }
        .pd-list { background: #fff; border: 1px solid #e9edf5; border-radius: 16px; overflow: hidden; }
        .pd-row { display: flex; justify-content: space-between; gap: 14px; align-items: center; padding: 14px 18px; border-bottom: 1px solid #f2f4f9; }
        .pd-row:last-child { border-bottom: none; }
        .pd-row-t { font-weight: 600; font-size: 14px; color: #0a162f; }
        .pd-row-s { font-size: 12px; color: #9aa4b2; margin-top: 2px; }
        .pd-badge { display: inline-block; padding: 4px 11px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: capitalize; background: #fff3e0; color: #ef6c00; }
        .pd-empty { background: #fff; border: 1px dashed #d9dfec; border-radius: 14px; padding: 22px; text-align: center; color: #8a94a3; font-size: 14px; }
        .pd-report { display: inline-block; margin-top: 26px; color: #2563eb; font-weight: 700; font-size: 14px; text-decoration: none; }
        @media (max-width: 640px) { .pd-money { grid-template-columns: 1fr; } .pd-hero-inner, .pd-body { padding-left: 18px; padding-right: 18px; } }
      `}</style>
    </div>
  );
}
