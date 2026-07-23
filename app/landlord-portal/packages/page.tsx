'use client';
// app/landlord-portal/packages/page.tsx
// In-portal package comparison. Self-contained (reads BUNDLES); highlights the
// landlord's current package via ?current=<packageId>. Keeps landlords inside
// the portal instead of sending them to the public /pricing page. Prices are
// read live from lib/bundles.ts.
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BUNDLES } from '@/lib/bundles';

export default function PortalPackagesPage() {
  const [current, setCurrent] = useState('');
  const [backHref, setBackHref] = useState('/landlord-portal?tab=properties');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setCurrent(params.get('current') || '');
    const propertyId = params.get('propertyId') || '';
    if (propertyId) setBackHref(`/landlord-portal/property/${encodeURIComponent(propertyId)}`);
  }, []);

  return (
    <main className="lpk">
      <section className="lpk-hero">
        <div className="lpk-wrap">
          <Link href={backHref} className="lpk-back">← Back to my property</Link>
          <div className="lpk-eyebrow">📦 Packages</div>
          <h1 className="lpk-title">Compare packages</h1>
          <p className="lpk-lead">
            Every service we offer, side by side. Your current package is highlighted. To switch, just contact your
            local team and we&apos;ll take care of it.
          </p>
        </div>
      </section>

      <section className="lpk-wrap lpk-body">
        <div className="lpk-grid">
          {BUNDLES.map(b => {
            const isCurrent = current ? b.id === current : false;
            return (
              <div key={b.id} className={`lpk-card${isCurrent ? ' current' : ''}`}>
                {isCurrent && <span className="lpk-cur-badge">Your current package</span>}
                <div className="lpk-kind">{b.kind}</div>
                <h3 className="lpk-name">{b.label}{b.badge && <span className="lpk-pop">{b.badge}</span>}</h3>
                <div className="lpk-fee">
                  {b.mgmtFee
                    ? <><b>{b.mgmtFee}</b> management fees <span className="lpk-plus">+</span> <b>{b.setupFee}</b> set up fees</>
                    : <><b>{b.setupFee}</b> set up fees <span className="lpk-muted">· no management fees</span></>}
                </div>
                <p className="lpk-blurb">{b.blurb}</p>
                <div className="lpk-incl-title">What&apos;s included</div>
                {b.groups.map(g => (
                  <div key={g.heading} className="lpk-incl-group">
                    <div className="lpk-incl-h">{g.heading}</div>
                    <ul className="lpk-incl-ul">{g.items.map(it => <li key={it}>{it}</li>)}</ul>
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        <div className="lpk-note">
          <div className="lpk-note-h">Want to change your package?</div>
          <p>Contact your local Leeds &amp; Manchester team and we&apos;ll arrange it for you.</p>
          <div className="lpk-note-actions">
            <a href="tel:01617681758" className="lpk-btn">📞 0161 768 1758</a>
            <a href="mailto:info@houseoflettings.co.uk" className="lpk-btn ghost">✉️ info@houseoflettings.co.uk</a>
          </div>
        </div>
      </section>

      <style>{`
        .lpk { margin-top: -72px; min-height: 100vh; background: #f4f6fb; font-family: 'Poppins', sans-serif; color: #0a162f; }
        .lpk-wrap { max-width: 1080px; margin: 0 auto; padding-left: 28px; padding-right: 28px; }
        .lpk-hero { background: linear-gradient(135deg,#0a162f,#14294f 60%,#c0392b 200%); color: #fff; }
        .lpk-hero .lpk-wrap { padding-top: 26px; padding-bottom: 30px; }
        .lpk-back { color: rgba(255,255,255,.75); font-size: 13px; font-weight: 600; text-decoration: none; }
        .lpk-back:hover { color: #fff; }
        .lpk-eyebrow { font-size: 11px; letter-spacing: .18em; text-transform: uppercase; opacity: .65; margin-top: 16px; }
        .lpk-title { font-size: 26px; font-weight: 800; margin: 6px 0 10px; letter-spacing: -.5px; }
        .lpk-lead { color: rgba(255,255,255,.6); font-size: 14px; line-height: 1.7; max-width: 560px; margin: 0; }
        .lpk-body { padding-top: 26px; padding-bottom: 60px; }
        .lpk-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 18px; }
        .lpk-card { position: relative; background: #fff; border: 1px solid #e9edf5; border-radius: 16px; padding: 22px; box-shadow: 0 8px 24px rgba(37,99,235,.07); }
        .lpk-card.current { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,.15), 0 16px 36px rgba(37,99,235,.18); }
        .lpk-cur-badge { position: absolute; top: -11px; left: 20px; background: #2563eb; color: #fff; font-size: 10.5px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; padding: 4px 12px; border-radius: 20px; }
        .lpk-kind { font-size: 10.5px; font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase; color: #94a3b8; }
        .lpk-name { font-size: 18px; font-weight: 800; margin: 7px 0 6px; }
        .lpk-pop { font-size: 10px; font-weight: 700; background: #c0392b; color: #fff; padding: 2px 8px; border-radius: 20px; margin-left: 8px; text-transform: uppercase; }
        .lpk-fee { font-size: 13.5px; color: #48546e; margin-bottom: 10px; }
        .lpk-fee b { color: var(--price-green-ink, #166534); font-weight: 700; }
        .lpk-plus, .lpk-muted { color: #9aa4b2; font-weight: 400; }
        .lpk-blurb { font-size: 13px; color: #6b7280; line-height: 1.6; margin: 0 0 14px; }
        .lpk-incl-title { font-size: 11.5px; font-weight: 700; color: #8a94a3; text-transform: uppercase; letter-spacing: .04em; margin: 0 0 8px; }
        .lpk-incl-group { margin-bottom: 10px; }
        .lpk-incl-h { font-size: 12.5px; font-weight: 700; color: #15803d; margin-bottom: 3px; }
        .lpk-incl-ul { margin: 0; padding-left: 16px; }
        .lpk-incl-ul li { font-size: 12.5px; color: #374151; line-height: 1.55; margin-bottom: 2px; }
        .lpk-note { margin-top: 26px; background: #fff; border: 1px solid #e9edf5; border-radius: 16px; padding: 22px; }
        .lpk-note-h { font-size: 15px; font-weight: 800; color: #0a162f; margin-bottom: 4px; }
        .lpk-note p { font-size: 13.5px; color: #6b7280; margin: 0 0 14px; }
        .lpk-note-actions { display: flex; flex-wrap: wrap; gap: 10px; }
        .lpk-btn { display: inline-flex; align-items: center; gap: 7px; background: #0a162f; color: #fff; text-decoration: none; font-size: 13.5px; font-weight: 700; padding: 11px 18px; border-radius: 10px; }
        .lpk-btn.ghost { background: #fff; color: #0a162f; border: 1px solid #d9dfec; }
        /* ── DARK MODE (driven by the portal layout's data-portal-theme) ── */
        :root[data-portal-theme="dark"] .lpk { background: #0a1120; color: #e6ebf3; }
        :root[data-portal-theme="dark"] .lpk-card,
        :root[data-portal-theme="dark"] .lpk-note { background: #13203a; border-color: #22314c; }
        :root[data-portal-theme="dark"] .lpk-card.current { border-color: #2563eb; }
        :root[data-portal-theme="dark"] .lpk-name,
        :root[data-portal-theme="dark"] .lpk-note-h { color: #eef3fa; }
        :root[data-portal-theme="dark"] .lpk-blurb,
        :root[data-portal-theme="dark"] .lpk-incl-ul li,
        :root[data-portal-theme="dark"] .lpk-note p { color: #93a3b8; }
        :root[data-portal-theme="dark"] .lpk-fee { color: #aebcd0; }
        :root[data-portal-theme="dark"] .lpk-fee b { color: #4ade80; }
        :root[data-portal-theme="dark"] .lpk-btn.ghost { background: #13203a; color: #eef3fa; border-color: #2b3c58; }

        @media (max-width: 900px) { .lpk-grid { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 640px) {
          .lpk-grid { grid-template-columns: 1fr; }
          .lpk-wrap { padding-left: 18px; padding-right: 18px; }
        }
      `}</style>
    </main>
  );
}
