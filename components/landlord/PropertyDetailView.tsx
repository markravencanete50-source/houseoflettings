'use client';
// components/landlord/PropertyDetailView.tsx
// Full property view for the landlord portal. A left-hand nav panel (mirroring
// the dashboard sidebar) lets the landlord switch between Overview (money in/
// out), their package, tenant applications and maintenance for THIS property.
// Rendered as a page (not a modal) at /landlord-portal/property/[id].
import { useState } from 'react';
import Link from 'next/link';
import { findBundle } from '@/lib/agreementContent';

export type PDProp = { id: string; label: string; postcode?: string; city?: string; type?: string; bedrooms?: string; bathrooms?: string; furnishing?: string; rent?: string; occupancy?: string; availableFrom?: string; tenancyStart?: string; packageId?: string; packageLabel?: string };
export type PDApplication = { id: string; fullName: string; propertyAddress: string; postcode?: string; rent: string; leaseTerm: string; status: string; submittedAt: string | null };
export type PDMaintenance = { id: string; fullName: string; propertyAddress: string; postcode?: string; issueDescription: string; status: string; submittedAt: string | null };

type Tab = 'overview' | 'package' | 'applications' | 'maintenance';

const fmtDate = (s: string | null) => s ? new Date(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const MAINT_META: Record<string, { label: string; bg: string; color: string }> = {
  'open': { label: 'Open', bg: '#fff3e0', color: '#ef6c00' },
  'in-progress': { label: 'In progress', bg: '#e3f2fd', color: '#1565c0' },
  'resolved': { label: 'Resolved', bg: '#e8f5e9', color: '#2e7d32' },
  'cancelled': { label: 'Cancelled', bg: '#f3f4f6', color: '#6b7280' },
};

export default function PropertyDetailView({ prop, applications, maintenance }: { prop: PDProp; applications: PDApplication[]; maintenance: PDMaintenance[] }) {
  const [tab, setTab] = useState<Tab>('overview');

  const rent = parseFloat(String(prop.rent || '').replace(/[^\d.]/g, '')) || 0;
  const bundle = findBundle(prop.packageId || prop.packageLabel || '');
  const mgmtPct = bundle?.mgmtFee ? (parseFloat(String(bundle.mgmtFee).replace(/[^\d.]/g, '')) || 0) : 0;
  const monthlyMgmt = Math.round(rent * mgmtPct / 100);
  const netMonthly = Math.max(0, Math.round(rent - monthlyMgmt));
  const money = (n: number) => `£${n.toLocaleString('en-GB')}`;

  const apps = applications.filter(a => a.postcode && prop.postcode && a.postcode === prop.postcode);
  const maint = maintenance.filter(m => m.postcode && prop.postcode && m.postcode === prop.postcode);
  const openMaint = maint.filter(m => m.status === 'open' || m.status === 'in-progress').length;

  const NAV: { id: Tab; icon: string; label: string; count?: number; dot?: boolean }[] = [
    { id: 'overview', icon: '📊', label: 'Overview' },
    { id: 'package', icon: '📦', label: 'Your package' },
    { id: 'applications', icon: '👥', label: 'Applications', count: apps.length },
    { id: 'maintenance', icon: '🔧', label: 'Maintenance', count: maint.length, dot: openMaint > 0 },
  ];

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

      <div className="pd-shell">
        {/* LEFT PANEL */}
        <aside className="pd-nav" aria-label="Property sections">
          {NAV.map(item => (
            <button key={item.id} className={`pd-nav-item${tab === item.id ? ' on' : ''}`} onClick={() => setTab(item.id)}>
              <span className="pd-nav-ico" aria-hidden>{item.icon}</span>
              <span className="pd-nav-lbl">{item.label}</span>
              {typeof item.count === 'number' && <span className="pd-nav-count">{item.count}</span>}
              {item.dot && <span className="pd-nav-dot" title={`${openMaint} open`} aria-label={`${openMaint} open`} />}
            </button>
          ))}
        </aside>

        {/* CONTENT */}
        <div className="pd-content">
          {tab === 'overview' && (
            <>
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

              {/* At a glance — quick jumps into the other sections */}
              <div className="pd-glance">
                <button className="pd-glance-card" onClick={() => setTab('package')}>
                  <div className="pd-glance-lbl">Your package</div>
                  <div className="pd-glance-val">{bundle?.label || prop.packageLabel || '—'}</div>
                  <div className="pd-glance-go">View package →</div>
                </button>
                <button className="pd-glance-card" onClick={() => setTab('applications')}>
                  <div className="pd-glance-lbl">Tenant applications</div>
                  <div className="pd-glance-val">{apps.length}</div>
                  <div className="pd-glance-go">View applications →</div>
                </button>
                <button className="pd-glance-card" onClick={() => setTab('maintenance')}>
                  <div className="pd-glance-lbl">Maintenance{openMaint > 0 && <span className="pd-glance-dot" />}</div>
                  <div className="pd-glance-val">{maint.length}</div>
                  <div className="pd-glance-go">{openMaint > 0 ? `${openMaint} open →` : 'View requests →'}</div>
                </button>
              </div>
            </>
          )}

          {tab === 'package' && (
            <div className="pd-section">
              <h3 className="pd-h">Your package</h3>
              {bundle ? (
                <div className="pd-pkg">
                  <div className="pd-pkg-name">{bundle.label}{bundle.badge && <span className="pd-pkg-badge">{bundle.badge}</span>}</div>
                  <div className="pd-pkg-fee">{bundle.mgmtFee ? `${bundle.mgmtFee} management` : 'No management fee'} · {bundle.setupFee} set up</div>
                  <div className="pd-incl-title">What&apos;s included</div>
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
          )}

          {tab === 'applications' && (
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
          )}

          {tab === 'maintenance' && (
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
              <Link href="/maintenance" className="pd-report">+ Report maintenance for this property</Link>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .pd-page { min-height: 100vh; background: #f4f6fb; font-family: 'Poppins', sans-serif; color: #0a162f; }
        .pd-hero { background: linear-gradient(135deg,#0a162f,#14294f 60%,#c0392b 200%); color: #fff; }
        .pd-hero-inner { max-width: 1040px; margin: 0 auto; padding: 26px 28px 30px; }
        .pd-back { color: rgba(255,255,255,.75); font-size: 13px; font-weight: 600; text-decoration: none; }
        .pd-back:hover { color: #fff; }
        .pd-eyebrow { font-size: 11px; letter-spacing: .18em; text-transform: uppercase; opacity: .65; margin-top: 16px; }
        .pd-title { font-size: 26px; font-weight: 800; margin: 6px 0 12px; letter-spacing: -.5px; }
        .pd-meta { display: flex; flex-wrap: wrap; gap: 7px; }
        .pd-meta span { background: rgba(255,255,255,.14); font-size: 12px; padding: 4px 11px; border-radius: 20px; text-transform: capitalize; }

        /* Two-column shell: left nav panel + content */
        .pd-shell { max-width: 1040px; margin: 0 auto; padding: 26px 28px 60px; display: grid; grid-template-columns: 232px 1fr; gap: 26px; align-items: start; }
        .pd-nav { position: sticky; top: 20px; display: flex; flex-direction: column; gap: 4px; background: #fff; border: 1px solid #e9edf5; border-radius: 16px; padding: 10px; }
        .pd-nav-item { display: flex; align-items: center; gap: 11px; width: 100%; text-align: left; background: none; border: none; cursor: pointer; padding: 11px 13px; border-radius: 10px; font-family: 'Poppins', sans-serif; font-size: 13.5px; font-weight: 600; color: #5b6470; transition: background .15s, color .15s; }
        .pd-nav-item:hover { background: #f4f6fb; color: #0a162f; }
        .pd-nav-item.on { background: #0a162f; color: #fff; }
        .pd-nav-ico { font-size: 15px; line-height: 1; }
        .pd-nav-lbl { flex: 1; }
        .pd-nav-count { font-size: 11px; font-weight: 700; background: #eef2f7; color: #64748b; padding: 2px 8px; border-radius: 20px; }
        .pd-nav-item.on .pd-nav-count { background: rgba(255,255,255,.2); color: #fff; }
        .pd-nav-dot { width: 8px; height: 8px; border-radius: 50%; background: #ef6c00; flex: 0 0 auto; }
        .pd-content { min-width: 0; }

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

        /* Overview "at a glance" quick-jump cards */
        .pd-glance { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; margin-top: 22px; }
        .pd-glance-card { text-align: left; background: #fff; border: 1px solid #e9edf5; border-radius: 16px; padding: 18px; cursor: pointer; font-family: 'Poppins', sans-serif; transition: border-color .15s, box-shadow .15s, transform .15s; }
        .pd-glance-card:hover { border-color: #c7d2e6; box-shadow: 0 10px 24px rgba(10,22,47,.08); transform: translateY(-2px); }
        .pd-glance-lbl { font-size: 12px; font-weight: 600; color: #6b7280; display: flex; align-items: center; gap: 6px; }
        .pd-glance-dot { width: 7px; height: 7px; border-radius: 50%; background: #ef6c00; display: inline-block; }
        .pd-glance-val { font-size: 20px; font-weight: 800; color: #0a162f; margin: 6px 0 8px; letter-spacing: -.3px; }
        .pd-glance-go { font-size: 12.5px; font-weight: 700; color: #2563eb; }

        .pd-section { }
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

        @media (max-width: 820px) {
          .pd-shell { grid-template-columns: 1fr; padding: 16px 18px 48px; gap: 16px; }
          .pd-nav { position: static; flex-direction: row; overflow-x: auto; padding: 8px; gap: 6px; -webkit-overflow-scrolling: touch; }
          .pd-nav-item { white-space: nowrap; padding: 9px 13px; }
          .pd-nav-lbl { flex: 0 0 auto; }
          .pd-hero-inner { padding-left: 18px; padding-right: 18px; }
        }
        @media (max-width: 640px) { .pd-money, .pd-glance { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
