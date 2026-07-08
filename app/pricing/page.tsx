'use client';
// app/pricing/page.tsx
import { useState, useEffect, useCallback, Fragment } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import PostcodeLookup, { type AddressResult } from '@/components/PostcodeLookup';
import { BUNDLES } from '@/lib/bundles';
import { MATRIX_SECTIONS, TOTAL_SERVICES, PRICING_FAQ } from '@/lib/pricingMatrix';

const PACKAGES = BUNDLES;
const VISIBLE_ROWS = 7;   // rows shown per matrix section before "Show more"
const HOT = 3;            // Full Management column index (Most Popular)

function TickIcon() {
  return (
    <i className="pr-tick" aria-hidden>
      <svg viewBox="0 0 24 24"><polyline points="4 13 10 19 20 6" /></svg>
    </i>
  );
}
function DashIcon() {
  return (
    <i className="pr-dash" aria-hidden>
      <svg viewBox="0 0 24 24"><line x1="6" y1="12" x2="18" y2="12" /></svg>
    </i>
  );
}

export default function PricingPage() {
  const [active, setActive] = useState(HOT);
  const [showModal, setShowModal] = useState(false);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    postcode: '', addressLine1: '', propertyAddress: '', numberOfProperties: '', startDate: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const pkg = PACKAGES[active];

  // Lock body scroll when modal open
  useEffect(() => {
    document.body.style.overflow = showModal ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [showModal]);

  const openModalFor = (i: number) => { setActive(i); setShowModal(true); };

  const handleAddressSelect = useCallback((data: AddressResult) => {
    setFormData(p => ({
      ...p,
      postcode: data.postcode || p.postcode,
      addressLine1: data.street || p.addressLine1,
    }));
    setError('');
  }, []);

  const handleSubmit = async () => {
    setError('');
    const required = ['firstName','lastName','email','phone','postcode','addressLine1','numberOfProperties','startDate'];
    for (const f of required) {
      if (!formData[f as keyof typeof formData].trim()) {
        setError('Please fill in all fields.');
        return;
      }
    }
    // Compose the full property address from the postcode + first line so the
    // backend and confirmation emails keep working unchanged.
    const propertyAddress = [formData.addressLine1, formData.postcode].filter(Boolean).join(', ');
    setSubmitting(true);
    try {
      const res = await fetch('/api/get-started', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, propertyAddress, selectedPackage: pkg.label }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Something went wrong');
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSubmitted(false);
    setError('');
    setFormData({ firstName: '', lastName: '', email: '', phone: '', postcode: '', addressLine1: '', propertyAddress: '', numberOfProperties: '', startDate: '' });
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px',
    background: '#fff',
    border: '1.5px solid #e5e7eb',
    borderRadius: 8, color: '#111827', fontSize: 14,
    fontFamily: "'Poppins', sans-serif",
    outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 13, fontWeight: 500,
    color: '#374151', marginBottom: 6,
    fontFamily: "'Poppins', sans-serif",
  };

  return (
    <>
      <Navbar />

      <style>{`
        .pr-scope, .pr-scope * { font-family: 'Poppins', sans-serif; box-sizing: border-box; }
        .pr-eyebrow { display:inline-block; font-size:12px; font-weight:700; letter-spacing:.14em;
          text-transform:uppercase; color:#2563eb; margin-bottom:12px; }
        .pr-head { max-width:760px; margin:0 auto 30px; text-align:center; }
        .pr-head h2 { font-size:clamp(24px,3vw,34px); font-weight:700; color:#0f1f3d; margin:0 0 10px; line-height:1.15; }
        .pr-head p { color:#6b7280; font-size:15px; line-height:1.65; margin:0; }

        /* ---------- Trust strip ---------- */
        .pr-trust { max-width:1120px; margin:-52px auto 0; padding:0 5%; position:relative; z-index:3; }
        .pr-trust-in { background:#fff; border:1px solid #e5e7eb; border-radius:14px;
          box-shadow:0 14px 34px -20px rgba(15,31,61,.28);
          display:grid; grid-template-columns:repeat(4,1fr); }
        .pr-trust-in div { padding:16px 18px; text-align:center; border-left:1px solid #eef1f5; }
        .pr-trust-in div:first-child { border-left:0; }
        .pr-trust-in .k { font-size:14px; font-weight:700; color:#0f1f3d; display:block; margin-bottom:2px; }
        .pr-trust-in .v { font-size:12px; color:#6b7280; }
        @media(max-width:720px){
          .pr-trust-in { grid-template-columns:repeat(2,1fr); }
          .pr-trust-in div:nth-child(odd){ border-left:0; }
          .pr-trust-in div:nth-child(3),.pr-trust-in div:nth-child(4){ border-top:1px solid #eef1f5; }
        }

        /* ---------- Chooser cards ---------- */
        .pr-chooser { max-width:1200px; margin:56px auto 0; padding:0 5%; }
        .pr-chooser-grid { display:grid; grid-template-columns:repeat(5,1fr); gap:16px; align-items:stretch; }
        .pr-pick { position:relative; background:#fff; border:1px solid #e5e7eb; border-radius:14px;
          padding:24px 20px 22px; display:flex; flex-direction:column;
          box-shadow:0 12px 30px -24px rgba(15,31,61,.3); transition:transform .15s ease, box-shadow .15s ease; }
        .pr-pick:hover { transform:translateY(-3px); box-shadow:0 22px 42px -24px rgba(15,31,61,.38); }
        .pr-pick.pr-featured { border:2px solid #2563eb; box-shadow:0 22px 46px -22px rgba(37,99,235,.5); }
        .pr-flag { position:absolute; top:-11px; left:50%; transform:translateX(-50%);
          background:#2563eb; color:#fff; font-size:10px; font-weight:800; letter-spacing:.1em;
          text-transform:uppercase; padding:4px 12px; border-radius:999px; white-space:nowrap; }
        .pr-kind { font-size:10.5px; font-weight:700; letter-spacing:.12em; text-transform:uppercase;
          color:#4a90d9; margin-bottom:8px; }
        .pr-pname { font-size:19px; font-weight:800; line-height:1.15; color:#0f1f3d; margin-bottom:10px; min-height:44px; }
        .pr-pprice { font-size:24px; font-weight:800; color:#2563eb; line-height:1; }
        .pr-pprice span { font-size:12.5px; font-weight:500; color:#9ca3af; }
        .pr-pongoing { font-size:12.5px; font-weight:700; color:#4a90d9; margin:4px 0 14px; }
        .pr-pongoing.pr-none { color:#9ca3af; font-weight:600; }
        .pr-best { font-size:12.5px; font-weight:600; color:#374151; padding:10px 12px; background:#f2f5fb;
          border-radius:9px; margin-bottom:12px; line-height:1.4; }
        .pr-best b { color:#2563eb; font-weight:800; }
        .pr-desc { font-size:12.8px; color:#6b7280; line-height:1.55; flex:1 1 auto; margin-bottom:14px; }
        .pr-tag { display:inline-flex; align-items:center; gap:7px; font-size:11.5px; font-weight:600;
          color:#0f1f3d; background:#e7f6ee; border-radius:8px; padding:6px 10px; align-self:flex-start; margin-bottom:16px; }
        .pr-tag svg { width:13px; height:13px; stroke:#16a34a; stroke-width:2.6; fill:none; flex:none; }
        .pr-pick-btn { display:block; width:100%; text-align:center; padding:12px 14px; border-radius:8px;
          background:#2563eb; color:#fff; border:none; cursor:pointer; font-size:13px; font-weight:700;
          letter-spacing:.03em; text-transform:uppercase; transition:background .18s ease; }
        .pr-pick-btn:hover { background:#1e40af; }
        .pr-pick.pr-featured .pr-pick-btn { background:#2563eb; }
        .pr-pick-link { margin-top:10px; text-align:center; font-size:12px; font-weight:700; color:#2563eb;
          text-decoration:none; }
        .pr-pick-link:hover { text-decoration:underline; }
        @media(max-width:1000px){ .pr-chooser-grid{ grid-template-columns:repeat(2,1fr);} .pr-pick.pr-featured{ order:-1;} .pr-pname{min-height:0;} }
        @media(max-width:540px){ .pr-chooser-grid{ grid-template-columns:1fr;} }

        /* ---------- Comparison matrix ---------- */
        .pr-wrap { max-width:1120px; margin:64px auto 0; padding:0 5%; }
        .pr-matrix-card { background:#fff; border:1px solid #e5e7eb; border-radius:14px;
          box-shadow:0 18px 40px -22px rgba(15,31,61,.3); overflow:hidden; }
        .pr-scroll-hint { display:none; font-size:12px; color:#6b7280; text-align:center; padding:10px 16px 0; }
        .pr-scroller { overflow-x:auto; -webkit-overflow-scrolling:touch; }
        .pr-scroller::-webkit-scrollbar { height:9px; }
        .pr-scroller::-webkit-scrollbar-thumb { background:#dbe2ea; border-radius:5px; }
        .pr-table { border-collapse:separate; border-spacing:0; width:100%; min-width:calc(300px + 5*150px); }
        .pr-table th, .pr-table td { padding:0; }
        .pr-svc, .pr-corner { position:sticky; left:0; z-index:3; background:#fff; }
        .pr-table thead th { position:sticky; top:0; z-index:4; background:#0f1f3d; }
        .pr-table thead th.pr-corner { z-index:5; background:#0f1f3d; }
        .pr-pkg { width:150px; min-width:150px; vertical-align:bottom; padding:16px 10px 15px; text-align:center;
          color:#fff; border-left:1px solid rgba(255,255,255,.08); }
        .pr-badge { display:inline-block; font-size:9.5px; font-weight:800; letter-spacing:.1em; text-transform:uppercase;
          background:#2563eb; color:#fff; border-radius:999px; padding:3px 10px; margin-bottom:8px; }
        .pr-badge.pr-ghost { visibility:hidden; }
        .pr-name { font-size:14.5px; font-weight:700; line-height:1.2; display:block; margin-bottom:9px; }
        .pr-price { font-size:20px; font-weight:800; letter-spacing:-.01em; }
        .pr-per { display:block; font-size:10.5px; font-weight:500; color:#AFC6CC; margin-top:2px; }
        .pr-ongoing { display:block; font-size:11px; font-weight:700; color:#AFC6CC; margin-top:5px; padding-top:5px;
          border-top:1px solid rgba(255,255,255,.1); }
        .pr-ongoing.pr-rec { color:#7db4f0; }
        .pr-corner { vertical-align:bottom; text-align:left; padding:16px 18px 15px; color:#fff;
          min-width:300px; width:300px; }
        .pr-corner-t { font-size:16px; font-weight:700; display:block; }
        .pr-corner-s { font-size:11px; color:#AFC6CC; font-weight:400; }
        /* Fee summary rows */
        .pr-fee-row td { border-top:1px solid #e5e7eb; }
        .pr-fee-label { font-weight:700 !important; color:#0f1f3d !important; font-size:11.5px !important;
          text-transform:uppercase; letter-spacing:.05em; background:#e8f0fb !important; }
        .pr-fee-cell { width:150px; min-width:150px; text-align:center; font-weight:800; color:#0f1f3d;
          font-size:16px; padding:12px 0; border-left:1px solid #e5e7eb; background:#f0f6ff; }
        .pr-fee-onetime .pr-fee-label { background:#dbe8fb !important; }
        .pr-fee-onetime .pr-fee-cell { background:#e8f0fb; }
        .pr-fee-ongoing .pr-fee-cell { color:#2563eb; }
        .pr-fee-cell.pr-hot { background:#d6e6ff !important; }
        thead th.pr-hot { background:#1c3a63 !important; }
        .pr-hot { background:#eff5ff !important; }
        .pr-band td { background:#1a2c49; color:#fff; font-weight:700; font-size:11.5px; letter-spacing:.1em;
          text-transform:uppercase; padding:9px 18px; position:sticky; left:0; }
        .pr-band td span { position:sticky; left:18px; }
        .pr-svc { font-size:13px; padding:9px 18px; min-width:300px; width:300px; border-top:1px solid #eef1f5; color:#374151; }
        .pr-feat:nth-child(even) .pr-svc { background:#f6f9fc; }
        .pr-mark { width:150px; min-width:150px; text-align:center; border-top:1px solid #eef1f5;
          border-left:1px solid #eef1f5; font-size:0; padding:7px 0; }
        .pr-feat:nth-child(even) .pr-mark { background:#fafcfe; }
        .pr-feat:nth-child(even) .pr-mark.pr-hot { background:#e6f0ff !important; }
        .pr-tick, .pr-dash { display:inline-flex; width:22px; height:22px; border-radius:50%;
          align-items:center; justify-content:center; vertical-align:middle; }
        .pr-tick { background:#e7f6ee; }
        .pr-tick svg { width:12px; height:12px; stroke:#16a34a; stroke-width:3; fill:none; stroke-linecap:round; stroke-linejoin:round; }
        .pr-dash { background:#eef1f5; }
        .pr-dash svg { width:11px; height:11px; stroke:#b6c0cf; stroke-width:3; fill:none; stroke-linecap:round; }
        .pr-more-row td { border-top:1px solid #eef1f5; padding:0; background:#fff; position:sticky; left:0; }
        .pr-more-btn { width:100%; border:0; background:transparent; cursor:pointer; font-size:12.5px; font-weight:700;
          color:#2563eb; padding:11px 18px; text-align:left; display:flex; align-items:center; gap:9px; }
        .pr-more-btn:hover { background:#f2f5fb; }
        .pr-chev { display:inline-block; width:8px; height:8px; border-right:2px solid #2563eb;
          border-bottom:2px solid #2563eb; transform:rotate(45deg) translateY(-1px); transition:transform .15s ease; }
        .pr-chev.up { transform:rotate(-135deg) translateY(-1px); }
        .pr-cta-row td { padding:16px 10px 20px; text-align:center; border-top:2px solid #eef1f5; background:#fff; }
        .pr-cta-row td:first-child { position:sticky; left:0; background:#fff; }
        .pr-btn { display:inline-block; font-size:12px; font-weight:700; padding:9px 16px; border-radius:8px;
          border:1.5px solid #2563eb; color:#2563eb; background:transparent; transition:all .15s ease;
          white-space:nowrap; cursor:pointer; text-transform:uppercase; letter-spacing:.02em; }
        .pr-btn:hover { background:#2563eb; color:#fff; }
        .pr-btn.pr-solid { background:#2563eb; color:#fff; }
        .pr-btn.pr-solid:hover { background:#1e40af; }
        .pr-legend { display:flex; gap:22px; justify-content:center; flex-wrap:wrap; padding:16px 16px 6px;
          font-size:12.5px; color:#5b6e74; }
        .pr-legend span { display:inline-flex; align-items:center; gap:7px; }
        @media(max-width:720px){ .pr-scroll-hint{ display:block; } }

        /* ---------- How fees work ---------- */
        .pr-fees { max-width:1120px; margin:44px auto 0; padding:0 5%; }
        .pr-fees-in { background:#f2f5f9; border:1px solid #e5e7eb; border-radius:14px; padding:30px 28px;
          display:grid; grid-template-columns:repeat(3,1fr); gap:26px; }
        .pr-fees-in h3 { font-size:15.5px; font-weight:700; color:#0f1f3d; margin:0 0 6px; display:flex; align-items:center; gap:9px; }
        .pr-fees-in h3 .n { font-size:11px; font-weight:800; color:#2563eb; background:#fff; border:1px solid #dbe2ea;
          width:24px; height:24px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; flex:none; }
        .pr-fees-in p { font-size:13.5px; color:#6b7280; margin:0; line-height:1.6; }
        @media(max-width:820px){ .pr-fees-in{ grid-template-columns:1fr; gap:18px; } }

        /* ---------- Additional services band ---------- */
        .pr-addl { max-width:1120px; margin:48px auto 0; padding:0 5%; }
        .pr-addl-in { background:linear-gradient(120deg,#2563eb 0%,#0f1f3d 100%); border-radius:16px;
          padding:40px 36px; display:flex; flex-wrap:wrap; gap:24px; align-items:center; justify-content:space-between; }
        .pr-addl-in .pr-eyebrow { color:#9dc3ff; }
        .pr-addl-in h2 { color:#fff; font-size:clamp(22px,3vw,30px); font-weight:800; margin:0 0 8px; max-width:600px; line-height:1.15; }
        .pr-addl-in p { color:#d3e2f7; font-size:14px; line-height:1.6; margin:0; max-width:600px; }
        .pr-addl-btn { flex:none; display:inline-flex; align-items:center; gap:10px; background:#fff; color:#0f1f3d;
          font-size:14.5px; font-weight:800; padding:16px 28px; border-radius:10px; text-decoration:none;
          box-shadow:0 12px 24px -12px rgba(0,0,0,.4); transition:transform .15s ease, box-shadow .15s ease; white-space:nowrap; }
        .pr-addl-btn:hover { transform:translateY(-2px); box-shadow:0 18px 30px -12px rgba(0,0,0,.5); }

        /* ---------- FAQ ---------- */
        .pr-faq-wrap { max-width:1000px; margin:0 auto; }
        .pr-faq { display:grid; grid-template-columns:repeat(auto-fit,minmax(320px,1fr)); gap:28px; }
        .pr-faq div { border-left:3px solid #2563eb; padding-left:20px; }
        .pr-faq h3 { font-size:16px; font-weight:700; color:#0f1f3d; margin:0 0 8px; }
        .pr-faq p { font-size:14px; color:#6b7280; line-height:1.7; margin:0; }

        .pr-fine { max-width:1000px; margin:28px auto 0; padding:0 5%; font-size:12px; color:#9ca3af;
          text-align:center; line-height:1.7; }
      `}</style>

      <div className="pr-scope">

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section style={{
        paddingTop: 130, paddingBottom: 96,
        background: '#0f1f3d', position: 'relative', overflow: 'hidden', textAlign: 'center',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url(/images/Background_of_the_services.webp)',
          backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat',
        }} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(5,12,30,0.9)' }} />
        <div style={{ position: 'relative', zIndex: 1, padding: '0 5%' }}>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 4, textTransform: 'uppercase', color: '#4a90d9', marginBottom: 16 }}>
            Landlord Packages &amp; Fees
          </div>
          <h1 style={{ fontSize: 'clamp(34px, 5vw, 60px)', fontWeight: 800, color: '#fff', margin: '0 0 18px', lineHeight: 1.06 }}>
            Clear pricing, every service side by side
          </h1>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.62)', maxWidth: 620, margin: '0 auto', lineHeight: 1.7, fontWeight: 300 }}>
            From simply finding the right tenant to fully managing your property, choose the level of support that suits you.
            No hidden fees, no surprises — and you can upgrade whenever you&apos;re ready.
          </p>
        </div>
      </section>

      {/* ── TRUST STRIP ─────────────────────────────────────── */}
      <section className="pr-trust" aria-label="Why landlords choose House of Lettings">
        <div className="pr-trust-in">
          <div><span className="k">Inclusive of VAT</span><span className="v">The price you see is the price you pay</span></div>
          <div><span className="k">No tenant fees</span><span className="v">Fully Tenant Fees Act 2019 compliant</span></div>
          <div><span className="k">Deposit protected</span><span className="v">Held in a Government-approved scheme</span></div>
          <div><span className="k">Leeds &amp; Manchester</span><span className="v">Local teams who know your market</span></div>
        </div>
      </section>

      {/* ── CHOOSER: which package is right for you? ─────────── */}
      <section className="pr-chooser" aria-label="Which package is right for you">
        <div className="pr-head">
          <span className="pr-eyebrow">Where do you fit?</span>
          <h2>Which package is right for you?</h2>
          <p>It comes down to one question: how much do you want to handle yourself? The more you take on, the less you pay us. Here&apos;s who each package is built for.</p>
        </div>
        <div className="pr-chooser-grid">
          {PACKAGES.map((p, i) => (
            <article key={p.id} className={`pr-pick${i === HOT ? ' pr-featured' : ''}`}>
              {p.badge && <span className="pr-flag">{p.badge}</span>}
              <span className="pr-kind">{p.kind}</span>
              <div className="pr-pname">{p.label}</div>
              <div className="pr-pprice">{p.setupFee} <span>one-time</span></div>
              <div className={`pr-pongoing${p.mgmtFee ? '' : ' pr-none'}`}>{p.ongoing}</div>
              <div className="pr-best">For <b>{p.bestForLead}</b> {p.bestForRest}</div>
              <p className="pr-desc">{p.blurb}</p>
              <span className="pr-tag">
                <svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" /></svg> {p.youWe}
              </span>
              <button type="button" className="pr-pick-btn" onClick={() => openModalFor(i)}>Get Started</button>
              <a className="pr-pick-link" href="#compare">See what&apos;s included ↓</a>
            </article>
          ))}
        </div>
      </section>

      {/* ── COMPARISON MATRIX ───────────────────────────────── */}
      <section className="pr-wrap" id="compare">
        <div className="pr-head">
          <span className="pr-eyebrow">Compare Packages</span>
          <h2>Every service, side by side</h2>
          <p>Two tenant-find options and three management tiers. Every package includes a full tenant-find service — management adds ongoing rent, compliance and maintenance support.</p>
        </div>

        <div className="pr-matrix-card">
          <p className="pr-scroll-hint">Swipe across to compare all five packages →</p>
          <div className="pr-scroller" role="region" aria-label="Package comparison table" tabIndex={0}>
            <table className="pr-table">
              <thead>
                <tr>
                  <th className="pr-corner" scope="col">
                    <span className="pr-corner-t">Services</span>
                    <span className="pr-corner-s">{TOTAL_SERVICES} across every package · inc. VAT</span>
                  </th>
                  {PACKAGES.map((p, i) => (
                    <th key={p.id} className={`pr-pkg${i === HOT ? ' pr-hot' : ''}`} scope="col">
                      <span className={`pr-badge${p.badge ? '' : ' pr-ghost'}`}>{p.badge || '·'}</span>
                      <span className="pr-name">{p.label}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Fee summary rows */}
                <tr className="pr-fee-row pr-fee-onetime">
                  <td className="pr-svc pr-fee-label">One-Time Fee</td>
                  {PACKAGES.map((p, i) => (
                    <td key={p.id} className={`pr-fee-cell${i === HOT ? ' pr-hot' : ''}`}>{p.setupFee}</td>
                  ))}
                </tr>
                <tr className="pr-fee-row pr-fee-ongoing">
                  <td className="pr-svc pr-fee-label">Ongoing Fee</td>
                  {PACKAGES.map((p, i) => (
                    <td key={p.id} className={`pr-fee-cell${i === HOT ? ' pr-hot' : ''}`}>{p.mgmtFee || '—'}</td>
                  ))}
                </tr>
                {MATRIX_SECTIONS.map((section, s) => {
                  const isOpen = !!expanded[s];
                  const rows = isOpen ? section.rows : section.rows.slice(0, VISIBLE_ROWS);
                  const hidden = section.rows.length - VISIBLE_ROWS;
                  return (
                    <Fragment key={section.title}>
                      <tr className="pr-band"><td colSpan={6}><span>{section.title}</span></td></tr>
                      {rows.map((row) => {
                        const [label, ...marks] = row;
                        return (
                          <tr key={label as string} className="pr-feat">
                            <td className="pr-svc">{label}</td>
                            {marks.map((m, c) => (
                              <td key={c} className={`pr-mark${c === HOT ? ' pr-hot' : ''}`}>
                                {m ? <TickIcon /> : <DashIcon />}
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                      {hidden > 0 && (
                        <tr className="pr-more-row">
                          <td colSpan={6}>
                            <button className="pr-more-btn" type="button" aria-expanded={isOpen}
                              onClick={() => setExpanded(e => ({ ...e, [s]: !e[s] }))}>
                              <span className={`pr-chev${isOpen ? ' up' : ''}`} aria-hidden />
                              {isOpen ? 'Show less' : `Show ${hidden} more service${hidden > 1 ? 's' : ''}`}
                            </button>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
                <tr className="pr-cta-row">
                  <td></td>
                  {PACKAGES.map((p, i) => (
                    <td key={p.id} className={i === HOT ? 'pr-hot' : ''}>
                      <button className={`pr-btn${i === HOT ? ' pr-solid' : ''}`} onClick={() => openModalFor(i)}>
                        {i === HOT ? 'Choose Full' : 'Get Started'}
                      </button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <div className="pr-legend">
            <span><i className="pr-tick"><svg viewBox="0 0 24 24"><polyline points="4 13 10 19 20 6" /></svg></i> Included</span>
            <span><i className="pr-dash"><svg viewBox="0 0 24 24"><line x1="6" y1="12" x2="18" y2="12" /></svg></i> Not included</span>
          </div>
        </div>
      </section>

      {/* ── HOW OUR FEES WORK ───────────────────────────────── */}
      <section className="pr-fees" aria-label="How our fees work">
        <div className="pr-fees-in">
          <div>
            <h3><span className="n">1</span> Charged on rent collected</h3>
            <p>Management percentages apply only to the monthly rent we actually collect on your behalf — nothing when the property is empty.</p>
          </div>
          <div>
            <h3><span className="n">2</span> All prices include VAT</h3>
            <p>Every figure on this page is VAT-inclusive, so what you compare is what you pay. Optional extras are also shown inclusive of VAT.</p>
          </div>
          <div>
            <h3><span className="n">3</span> No long tie-ins</h3>
            <p>Tenant-find packages are one-time with no ongoing commitment. Management runs on a rolling monthly basis — upgrade or adjust any time.</p>
          </div>
        </div>
      </section>

      {/* ── ADDITIONAL SERVICES ROUTE BAND ──────────────────── */}
      <section className="pr-addl" aria-label="Additional services">
        <div className="pr-addl-in">
          <div>
            <span className="pr-eyebrow">More than just packages</span>
            <h2>Need something à la carte?</h2>
            <p>Gas &amp; electrical certificates, inventories &amp; handovers, professional photography, referencing, mid-tenancy inspections and rent protection — order any service individually, with or without a package.</p>
          </div>
          <Link href="/additional-services" className="pr-addl-btn">Browse Additional Services →</Link>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────── */}
      <section style={{ background: '#f7f8fa', padding: '80px 5%', marginTop: 64, borderTop: '1px solid #e5e7eb' }}>
        <div className="pr-faq-wrap">
          <div className="pr-head">
            <span className="pr-eyebrow">Common Questions</span>
            <h2>Everything you need to know</h2>
          </div>
          <div className="pr-faq">
            {PRICING_FAQ.map(faq => (
              <div key={faq.q}>
                <h3>{faq.q}</h3>
                <p>{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="pr-fine">
          All fees quoted are inclusive of VAT/IPT where applicable. Management percentages are charged on rent collected each month.
          Under the Tenant Fees Act 2019 we do not charge tenants for referencing, admin or renewals. &ldquo;From&rdquo; prices are starting
          rates; optional-extra pricing may vary by property type and is confirmed in your written quotation. House of Lettings — Leeds &amp; Manchester.
        </p>
      </section>

      {/* ── CTA ─────────────────────────────────────────────── */}
      <section style={{
        background: '#0f1f3d', padding: '80px 5%',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 40, flexWrap: 'wrap',
      }}>
        <div>
          <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 'clamp(24px,3vw,42px)', fontWeight: 700, color: '#fff', marginBottom: 12 }}>
            Not sure which package is right for you?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 16, fontWeight: 300, margin: 0, fontFamily: "'Poppins', sans-serif" }}>
            Book a free, no-obligation valuation and we&apos;ll recommend the best fit for your goals.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <Link href="/book-valuation" style={{
            padding: '16px 36px', background: '#2563eb', color: '#fff', borderRadius: 6, fontSize: 14, fontWeight: 700,
            letterSpacing: '0.5px', textTransform: 'uppercase', textDecoration: 'none', fontFamily: "'Poppins', sans-serif", whiteSpace: 'nowrap',
          }}>Book a Free Valuation</Link>
          <Link href="/landlord-registration" style={{
            padding: '16px 36px', background: 'transparent', color: '#fff',
            border: '1px solid rgba(255,255,255,0.3)', borderRadius: 6, fontSize: 14,
            fontWeight: 500, letterSpacing: '0.5px', textTransform: 'uppercase',
            textDecoration: 'none', fontFamily: "'Poppins', sans-serif", whiteSpace: 'nowrap',
          }}>Register as a Landlord</Link>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────── */}
      <footer style={{ background: '#050a12', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '48px 5%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
          <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 20, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 7, height: 7, background: '#2563eb', borderRadius: '50%', display: 'inline-block' }} />
            House of Lettings
          </div>
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13, margin: 0, fontFamily: "'Poppins', sans-serif" }}>
            © {new Date().getFullYear()} House of Lettings Ltd. All rights reserved.
          </p>
          <div style={{ display: 'flex', gap: 24 }}>
            <Link href="/additional-services" style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, textDecoration: 'none' }}>Additional Services</Link>
            <Link href="/cookie-policy" style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, textDecoration: 'none' }}>Cookie Policy</Link>
            <Link href="/terms" style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, textDecoration: 'none' }}>Terms</Link>
            <Link href="/" style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, textDecoration: 'none' }}>Home</Link>
          </div>
        </div>
      </footer>

      </div>{/* /pr-scope */}

      {/* ── GET STARTED MODAL ────────────────────────────────── */}
      {showModal && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px', animation: 'fadeIn 0.2s ease',
          }}
        >
          <style>{`
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes slideUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
            .gs-input:focus { border-color: #2563eb !important; }
            .gs-input::placeholder { color: #9ca3af; }
            .gs-input option { background: #fff; color: #111; }
          `}</style>

          <div style={{
            background: '#fff', borderRadius: 16, width: '100%', maxWidth: 540,
            maxHeight: '90vh', overflowY: 'auto', animation: 'slideUp 0.25s ease',
            scrollbarWidth: 'none', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}>
            {/* Modal header */}
            <div style={{ padding: '24px 28px 0', position: 'relative' }}>
              <button
                onClick={closeModal}
                style={{
                  position: 'absolute', top: 20, right: 20, background: '#f3f4f6', border: 'none',
                  color: '#6b7280', width: 32, height: 32, borderRadius: '50%', fontSize: 16, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
                }}
              >✕</button>

              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, background: '#1a3c5e',
                borderRadius: 20, padding: '5px 14px', marginBottom: 14,
              }}>
                <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: 12, fontWeight: 700, color: '#fff', letterSpacing: 0.5 }}>{pkg.label}</span>
              </div>

              <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 26, fontWeight: 700, color: '#111827', margin: '0 0 6px' }}>Get Started</h2>
              <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: 13, color: '#6b7280', margin: '0 0 20px' }}>Fill in your details and we&apos;ll be in touch within 24-48 hours.</p>

              <div style={{
                background: '#f8f9ff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '14px 18px',
                marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 8,
              }}>
                {['Takes less than two minutes', 'We&apos;ll match you with the right package', 'No commitment until you speak to us'].map((text, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ color: '#2563eb', fontSize: 14, fontWeight: 700 }}>✓</span>
                    <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: 13, color: '#374151' }}
                      dangerouslySetInnerHTML={{ __html: text }} />
                  </div>
                ))}
              </div>

              <h3 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 15, fontWeight: 600, color: '#111827', margin: '0 0 16px' }}>Your details</h3>
            </div>

            {/* Modal body */}
            <div style={{ padding: '0 28px 28px' }}>
              {submitted ? (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
                  <h3 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 12 }}>Registration Received!</h3>
                  <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: 14, color: '#6b7280', lineHeight: 1.7, marginBottom: 28 }}>
                    We&apos;ve sent a confirmation to <strong style={{ color: '#111' }}>{formData.email}</strong>.<br />
                    A member of our team will be in touch shortly.
                  </p>
                  <button
                    onClick={closeModal}
                    style={{ padding: '12px 32px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'Poppins', sans-serif" }}
                  >Close</button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div>
                      <label style={labelStyle}>First Name</label>
                      <input className="gs-input" style={inputStyle} placeholder="John"
                        value={formData.firstName} onChange={e => setFormData(p => ({ ...p, firstName: e.target.value }))} />
                    </div>
                    <div>
                      <label style={labelStyle}>Last Name</label>
                      <input className="gs-input" style={inputStyle} placeholder="Smith"
                        value={formData.lastName} onChange={e => setFormData(p => ({ ...p, lastName: e.target.value }))} />
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>Email Address</label>
                    <input className="gs-input" type="email" style={inputStyle} placeholder="john@example.com"
                      value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} />
                  </div>

                  <div>
                    <label style={labelStyle}>Phone Number</label>
                    <input className="gs-input" type="tel" style={inputStyle} placeholder="+44 7700 000000"
                      value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} />
                  </div>

                  <div>
                    <label style={labelStyle}>What Property Do You Own? Enter Postcode</label>
                    <PostcodeLookup
                      postcode={formData.postcode}
                      onPostcodeChange={(v) => setFormData(p => ({ ...p, postcode: v }))}
                      onSelect={handleAddressSelect}
                      inputClassName="gs-input"
                      inputStyle={inputStyle}
                      placeholder="e.g. LS1 1AA"
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>First Line of Address</label>
                    <input className="gs-input" style={inputStyle} placeholder="e.g. 12 Oak Street"
                      value={formData.addressLine1} onChange={e => setFormData(p => ({ ...p, addressLine1: e.target.value }))} />
                  </div>

                  <div>
                    <label style={labelStyle}>How Many Properties to Manage?</label>
                    <select className="gs-input" style={inputStyle}
                      value={formData.numberOfProperties} onChange={e => setFormData(p => ({ ...p, numberOfProperties: e.target.value }))}>
                      <option value="">Select number of properties</option>
                      <option value="1">1 property</option>
                      <option value="2">2 properties</option>
                      <option value="3">3 properties</option>
                      <option value="4">4 properties</option>
                      <option value="5+">5 or more</option>
                    </select>
                  </div>

                  <div>
                    <label style={labelStyle}>When Do You Want to Register?</label>
                    <input className="gs-input" type="date" style={{ ...inputStyle, colorScheme: 'light' }}
                      value={formData.startDate} min={new Date().toISOString().split('T')[0]}
                      onChange={e => setFormData(p => ({ ...p, startDate: e.target.value }))} />
                  </div>

                  {error && (
                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '12px 16px', color: '#dc2626', fontSize: 13, fontFamily: "'Poppins', sans-serif" }}>{error}</div>
                  )}

                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    style={{
                      width: '100%', padding: '14px 24px', background: submitting ? '#93c5fd' : '#2563eb',
                      color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, letterSpacing: '0.5px',
                      textTransform: 'uppercase', cursor: submitting ? 'wait' : 'pointer', fontFamily: "'Poppins', sans-serif",
                      transition: 'background 0.2s', marginTop: 4,
                    }}
                  >
                    {submitting ? 'Submitting...' : 'Submit Registration'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
