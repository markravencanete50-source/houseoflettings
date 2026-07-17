'use client';
// app/landlords/page.tsx
import { useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ServiceHero from '@/components/layout/ServiceHero';
import RevealCards from '@/components/RevealCards';
import { BUNDLES } from '@/lib/bundles';
import { SERVICE_CATEGORIES } from '@/lib/additionalServices';
import { calculateValuation, formatCurrency } from '@/lib/valuation/valuationEngine';
import type { PropertyType } from '@/lib/valuation/marketData2026';

// The site-standard CTA size, matching components/layout/ServiceHero.module.css
// (.btn). Every call-to-action is this size, so the inline-styled buttons on
// this page stay in step with the shared hero rather than drifting.
const CTA_STYLE: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9,
  boxSizing: 'border-box', minHeight: 48,
  padding: '14px 28px', border: '1.5px solid transparent', borderRadius: 9,
  fontFamily: "'Poppins', sans-serif", fontSize: 13.5, fontWeight: 700, lineHeight: 1.2,
  letterSpacing: '.02em', textTransform: 'uppercase', textDecoration: 'none',
};

// Hero stat figures come from lib/bundles.ts rather than being typed here, so
// they can never quote a fee the pricing page disagrees with. Both are "from"
// figures: management runs 6-10% and a tenant find is £399-£699.
const LOWEST_MGMT_FEE = BUNDLES
  .filter(b => b.mgmtFee)
  .map(b => b.mgmtFee)
  .sort((a, b) => parseFloat(a) - parseFloat(b))[0];

const LOWEST_FIND_FEE = BUNDLES
  .filter(b => b.kind === 'Tenant Find')
  .map(b => b.setupFee)
  .sort((a, b) => Number(a.replace(/[^0-9.]/g, '')) - Number(b.replace(/[^0-9.]/g, '')))[0];

// ── Shared utilities for the llx* marketing sections (2026-07 handoff) ──────
// One copy of the keyframes and CTA helpers used by every Llx* section below.
// Rendered once at the top of the page. The llx-cta class makes any CTA
// full-width on phones (site convention, 600px breakpoint), and the
// reduced-motion block kills every llx animation in one place so the section
// components stay free of media queries.
function LlxShared() {
  return (
    <style>{`
      @keyframes llxPulse { 0% { box-shadow: 0 0 0 0 rgba(74,144,217,.55); } 70% { box-shadow: 0 0 0 9px rgba(74,144,217,0); } 100% { box-shadow: 0 0 0 0 rgba(74,144,217,0); } }
      @keyframes llxOrbA { 0%, 100% { transform: translate(0,0); } 50% { transform: translate(58px,40px); } }
      @keyframes llxOrbB { 0%, 100% { transform: translate(0,0); } 50% { transform: translate(-48px,-36px); } }
      @keyframes llxFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
      @keyframes llxShimmer { to { background-position: 220% center; } }
      @media (max-width: 600px) {
        .llx-cta { width: 100%; }
      }
      @media (prefers-reduced-motion: reduce) {
        [class*='llx'] { animation: none !important; transition: none !important; }
      }
    `}</style>
  );
}

const landlordFaqs = [
  {
    q: 'What legal certificates do I need before letting my property?',
    a: 'You\u2019ll need a valid Gas Safety Certificate (renewed annually if the property has gas appliances), an Electrical Installation Condition Report (EICR, renewed every 5 years), and an Energy Performance Certificate (EPC) rated E or above. Working smoke alarms on every floor and a carbon monoxide alarm in any room with a fuel burning appliance are also required by law. We arrange and track all of this for you under our managed packages.',
  },
  {
    q: 'Do I need to protect my tenant\u2019s deposit?',
    a: 'Yes, any deposit taken must be placed in a government approved tenancy deposit scheme (such as the DPS, mydeposits, or TDS) within 30 days of receiving it, and the tenant must be given the prescribed information. Failing to do this properly can prevent you from serving a valid Section 21 notice and can result in a financial penalty.',
  },
  {
    q: 'Do I need a licence to rent out my property?',
    a: 'It depends on the property and the local authority. Houses in Multiple Occupation (HMOs) above a certain size need a mandatory HMO licence, and many areas of Leeds and Manchester also fall under selective licensing schemes that apply to all rental properties in that zone. We check the licensing requirements for every property we manage and handle the application if one is needed.',
  },
  {
    q: 'How much notice do I need to give a tenant to end a tenancy?',
    a: 'For a no fault eviction under Section 21, landlords currently need to give at least 2 months\u2019 notice, and the property must be fully compliant (deposit protected, certificates served, EPC and gas safety provided) for the notice to be valid. Section 8 notices, used for rent arrears or breach of tenancy, have different notice periods depending on the grounds. Rules in this area are changing under upcoming reform, so we keep landlords updated as things shift.',
  },
  {
    q: 'Is my rental income taxable?',
    a: 'Yes, rental profit is taxable income and must be declared via Self Assessment. Mortgage interest is no longer fully deductible; instead, landlords receive a 20% tax credit on finance costs. Allowable expenses (letting agent fees, maintenance, insurance, etc.) can still be deducted from rental income before tax. We\u2019d always recommend speaking with an accountant about your specific position.',
  },
  {
    q: 'Do I need landlord insurance?',
    a: 'It\u2019s not a legal requirement, but it\u2019s strongly recommended, a standard home insurance policy typically won\u2019t cover a let property. Landlord insurance covers the building and your liability as a landlord, and can be extended with rent guarantee or legal expenses cover. We can point you toward providers who specialise in this if you don\u2019t already have a policy.',
  },
];

// Curated "what's included" highlights per package, mirroring the four shown on
// /pricing so this landlord explainer stays consistent with the pricing page.
// Indexed to BUNDLES order; the full lists live in lib/bundles.ts (groups).
// Consumed by the package carousel (LlxChooseService).
const PKG_HL: string[][] = [
  ['Advertising on major property portals', 'Full applicant referencing and Right to Rent checks', 'Tenancy agreement and deposit registration', "First month's rent and deposit collected"],
  ['Everything in Virtual Tenant Find', 'Professional photography and floor plan', 'Agent-led accompanied viewings', 'In-person tenant handover'],
  ['Includes a full tenant find', 'Monthly rent collection and monitoring', 'Arrears chasing and reminders', 'Key holding and annual income summary'],
  ['Dedicated day-to-day management team', 'Maintenance and contractor coordination', 'Compliance monitoring (Gas, EICR, EPC)', 'Check in and check out inventory'],
  ['Everything in Full Management', 'Emergency maintenance support', 'Routine inspection every 6 months', 'Rent guarantee, legal and eviction protection'],
];

// Rent Guarantee Insurance carousel — a client-supplied 7-slide educational set
// (optimised to WebP in /public/images/rent-guarantee). Ties to the rent
// guarantee cover in the Comprehensive Management package.
const RGI_SLIDES = [
  { src: '/images/rent-guarantee/rgi-1.webp', alt: '6 reasons landlords choose rent guarantee insurance' },
  { src: '/images/rent-guarantee/rgi-2.webp', alt: 'Reason 1: protects your rental income if a tenant stops paying, subject to policy terms' },
  { src: '/images/rent-guarantee/rgi-3.webp', alt: 'Reason 2: legal support and expenses for possession proceedings' },
  { src: '/images/rent-guarantee/rgi-4.webp', alt: 'Reason 3: less stress during tenant issues, with financial and legal backing' },
  { src: '/images/rent-guarantee/rgi-5.webp', alt: 'Reason 4: who should consider it, from first-time to portfolio landlords' },
  { src: '/images/rent-guarantee/rgi-6.webp', alt: 'Reason 5: read the policy carefully for eligibility, exclusions, waiting periods and claims' },
  { src: '/images/rent-guarantee/rgi-7.webp', alt: 'Is rent guarantee insurance right for you? Speak to the House of Lettings team' },
];

// ── New marketing sections (2026-07 design handoff), one component each ─────
function LlxInvestmentSmarter() {
  return (
    <section className="llx1-wrap" aria-labelledby="llx1-heading">
      <style>{`
        .llx1-wrap { position:relative; background:#fff; padding:clamp(64px,9vw,110px) clamp(20px,7%,100px); font-family:'Poppins',sans-serif; color:#0f1f3d; }
        .llx1-grid { max-width:1120px; margin:0 auto; display:grid; grid-template-columns:repeat(auto-fit,minmax(320px,1fr)); gap:clamp(36px,5vw,64px); align-items:center; }
        .llx1-eyebrow { display:inline-flex; align-items:center; gap:9px; font-size:11px; font-weight:700; letter-spacing:.18em; text-transform:uppercase; color:#2672d2; background:#eff6ff; border:1px solid #dbeafe; border-radius:999px; padding:8px 16px 8px 13px; margin-bottom:22px; }
        .llx1-dot { width:7px; height:7px; border-radius:50%; background:#2563eb; animation:llxPulse 2.4s ease-out infinite; flex:none; }
        .llx1-h2 { font-size:clamp(30px,4.2vw,52px); font-weight:800; line-height:1.08; letter-spacing:-.02em; margin:0 0 20px; color:#0f1f3d; text-wrap:balance; }
        .llx1-shimmer { background:linear-gradient(100deg,#2563eb 0%,#4a90d9 40%,#1d4ed8 70%,#4a90d9 100%); background-size:220% auto; -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent; animation:llxShimmer 6.5s linear infinite; }
        .llx1-body { font-size:15.5px; font-weight:300; color:#4b5563; line-height:1.85; margin:0 0 26px; max-width:520px; text-wrap:pretty; }
        .llx1-benefits { display:flex; flex-wrap:wrap; gap:10px; margin-bottom:32px; }
        .llx1-benefit { display:inline-flex; align-items:center; gap:7px; font-size:12.5px; font-weight:600; color:#166534; background:#f0fdf4; border:1px solid #bbf7d0; border-radius:999px; padding:7px 14px; transition:transform .25s ease, box-shadow .25s ease; }
        .llx1-benefit svg { flex:none; transition:transform .3s cubic-bezier(.34,1.56,.64,1); }
        .llx1-benefit:hover { transform:translateY(-2px); box-shadow:0 10px 20px -12px rgba(22,163,74,.45); }
        .llx1-benefit:hover svg { transform:scale(1.3); }
        .llx1-ctas { display:flex; flex-wrap:wrap; gap:12px; }
        .llx1-cta-blue { background:#2563eb; color:#fff; box-shadow:0 14px 30px -14px rgba(37,99,235,.6); transition:all .22s ease; }
        .llx1-cta-blue:hover { background:#1d4ed8; color:#fff; transform:translateY(-2px); box-shadow:0 22px 42px -14px rgba(37,99,235,.8); }
        .llx1-cta-outline { background:transparent; color:#0f1f3d; transition:all .22s ease; }
        .llx1-cta-outline:hover { background:#0f1f3d; color:#fff; transform:translateY(-2px); box-shadow:0 16px 32px -16px rgba(15,31,61,.55); }
        .llx1-panelwrap { position:relative; }
        .llx1-panel { position:relative; overflow:hidden; border-radius:20px; background:linear-gradient(160deg,#15294c 0%,#0c1a33 100%); border:1px solid rgba(255,255,255,.09); box-shadow:0 40px 80px -34px rgba(4,10,26,.6); padding:clamp(26px,3vw,36px); }
        .llx1-orb { position:absolute; width:300px; height:300px; top:-120px; right:-100px; border-radius:50%; filter:blur(60px); pointer-events:none; background:radial-gradient(circle,rgba(37,99,235,.4) 0%,transparent 70%); animation:llxOrbA 18s ease-in-out infinite; }
        .llx1-inner { position:relative; z-index:1; }
        .llx1-kicker { display:block; font-size:11px; font-weight:700; letter-spacing:.14em; text-transform:uppercase; color:#4a90d9; margin-bottom:6px; }
        .llx1-subline { display:block; font-size:12.5px; font-weight:300; color:#a9c4ea; margin-bottom:22px; }
        .llx1-stats { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
        .llx1-tile { background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.1); border-radius:14px; padding:18px 16px; transition:transform .25s ease, border-color .25s ease, box-shadow .25s ease; animation:llx1TileRise .6s ease-out backwards; }
        .llx1-tile:nth-child(1) { animation-delay:.08s; }
        .llx1-tile:nth-child(2) { animation-delay:.18s; }
        .llx1-tile:nth-child(3) { animation-delay:.28s; }
        .llx1-tile:nth-child(4) { animation-delay:.38s; }
        .llx1-tile:hover { transform:translateY(-3px); border-color:rgba(74,144,217,.5); box-shadow:0 16px 30px -18px rgba(37,99,235,.55); }
        .llx1-fig { display:block; font-size:22px; font-weight:800; color:#fff; line-height:1; margin-bottom:7px; }
        .llx1-green { color:#4ade80; }
        .llx1-accent { color:#4a90d9; }
        .llx1-lab { font-size:10.5px; font-weight:600; letter-spacing:.06em; text-transform:uppercase; color:rgba(255,255,255,.55); line-height:1.4; }
        .llx1-foot { display:flex; align-items:center; gap:10px; margin-top:20px; border-top:1px solid rgba(255,255,255,.09); padding-top:18px; }
        .llx1-greendot { width:7px; height:7px; border-radius:50%; background:#4ade80; animation:llxPulse 2.4s ease-out infinite; flex:none; }
        .llx1-foottext { font-size:12px; font-weight:500; color:rgba(255,255,255,.6); }
        .llx1-float { position:absolute; left:-14px; bottom:-16px; background:rgba(255,255,255,.97); border-radius:14px; padding:13px 18px; box-shadow:0 18px 40px -18px rgba(4,10,26,.5); animation:llxFloat 5.5s ease-in-out infinite; }
        .llx1-floatlabel { display:block; font-size:10px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:#6b7280; margin-bottom:3px; }
        .llx1-floatvalue { font-size:19px; font-weight:800; color:#16a34a; line-height:1; }
        @keyframes llx1TileRise { from { opacity:0; transform:translateY(16px); } }
        @media (max-width:480px) { .llx1-float { left:0; } }
      `}</style>
      <div className="llx1-grid">
        <div className="hol-reveal">
          <div className="llx1-eyebrow">
            <span className="llx1-dot" aria-hidden="true" />
            Highly Recommended
          </div>
          <h2 className="llx1-h2" id="llx1-heading">
            Make Your Property Investment <span className="llx1-shimmer">Smarter</span>
          </h2>
          <p className="llx1-body">
            Whether you&apos;re letting your first property or growing your portfolio, we&apos;re here to help you maximise rental income, reduce void periods, and manage your investment with confidence, all at an affordable price.
          </p>
          <div className="llx1-benefits">
            <span className="llx1-benefit">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
              Maximise rental income
            </span>
            <span className="llx1-benefit">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
              Reduce void periods
            </span>
            <span className="llx1-benefit">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
              Affordable pricing
            </span>
          </div>
          <div className="llx1-ctas">
            <Link href="/book-valuation" className="llx-cta llx1-cta-blue" style={{ ...CTA_STYLE }}>
              Book a Free Valuation
            </Link>
            <Link href="/pricing" className="llx-cta llx1-cta-outline" style={{ ...CTA_STYLE, borderColor: '#0f1f3d' }}>
              Compare Landlord Fees
            </Link>
          </div>
        </div>
        <div className="llx1-panelwrap hol-reveal" style={{ animationDelay: '140ms' }}>
          <div className="llx1-panel">
            <div className="llx1-orb" aria-hidden="true" />
            <div className="llx1-inner">
              <span className="llx1-kicker">Your Investment At a Glance</span>
              <span className="llx1-subline">Inclusive of VAT. No hidden fees, ever.</span>
              <div className="llx1-stats">
                <div className="llx1-tile">
                  <span className="llx1-fig llx1-green">Free</span>
                  <span className="llx1-lab">Rental valuation</span>
                </div>
                <div className="llx1-tile">
                  <span className="llx1-fig llx1-green">£0</span>
                  <span className="llx1-lab">Hidden fees</span>
                </div>
                <div className="llx1-tile">
                  <span className="llx1-fig">From <span className="llx1-accent">{LOWEST_MGMT_FEE}</span></span>
                  <span className="llx1-lab">Management fees</span>
                </div>
                <div className="llx1-tile">
                  <span className="llx1-fig">From <span className="llx1-accent">{LOWEST_FIND_FEE}</span></span>
                  <span className="llx1-lab">Tenant find fees</span>
                </div>
              </div>
              <div className="llx1-foot">
                <span className="llx1-greendot" aria-hidden="true" />
                <span className="llx1-foottext">Serving landlords across Leeds &amp; Manchester</span>
              </div>
            </div>
          </div>
          <div className="llx1-float">
            <span className="llx1-floatlabel">Rental Valuation</span>
            <span className="llx1-floatvalue">Free · No obligation</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function LlxWhyLandlords() {
  return (
    <section style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(168deg,#0a1730 0%,#12244a 52%,#0a1a38 100%)', padding: 'clamp(64px,9vw,110px) clamp(20px,7%,100px)' }}>
      <style>{`
        .llx2-orb-a {
          position:absolute; width:480px; height:480px; top:-160px; left:-120px;
          border-radius:50%; filter:blur(72px); pointer-events:none;
          background:radial-gradient(circle, rgba(37,99,235,.45) 0%, transparent 70%);
          animation:llxOrbA 20s ease-in-out infinite;
        }
        .llx2-orb-b {
          position:absolute; width:420px; height:420px; bottom:-180px; right:-100px;
          border-radius:50%; filter:blur(72px); pointer-events:none;
          background:radial-gradient(circle, rgba(74,144,217,.34) 0%, transparent 70%);
          animation:llxOrbB 24s ease-in-out infinite;
        }
        .llx2-h2 { text-wrap:balance; }
        .llx2-sub, .llx2-body { text-wrap:pretty; }
        .llx2-card {
          position:relative; overflow:hidden;
          background:rgba(255,255,255,.045); border:1px solid rgba(255,255,255,.11);
          border-radius:18px; padding:32px 28px;
          backdrop-filter:blur(6px); -webkit-backdrop-filter:blur(6px);
          transition:transform .3s cubic-bezier(.22,1,.36,1), box-shadow .3s ease, border-color .3s ease;
        }
        .llx2-card:hover {
          transform:translateY(-8px);
          border-color:rgba(74,144,217,.55);
          box-shadow:0 28px 50px -24px rgba(37,99,235,.5);
        }
        .llx2-card::before {
          content:''; position:absolute; top:-46px; left:50%; width:240px; height:130px;
          transform:translateX(-50%); pointer-events:none;
          background:radial-gradient(closest-side, rgba(74,144,217,.26), transparent);
          opacity:0; transition:opacity .45s ease;
        }
        .llx2-card:hover::before { opacity:1; }
        .llx2-tile {
          width:52px; height:52px; border-radius:14px;
          background:rgba(37,99,235,.16); border:1px solid rgba(74,144,217,.35);
          display:flex; align-items:center; justify-content:center; margin-bottom:20px;
          transition:transform .35s cubic-bezier(.22,1,.36,1), background .35s ease, border-color .35s ease;
        }
        .llx2-card:hover .llx2-tile {
          transform:scale(1.08) rotate(-4deg);
          background:rgba(37,99,235,.26);
          border-color:rgba(125,180,240,.6);
        }
        .llx2-cta {
          background:#fff; color:#0f1f3d;
          box-shadow:0 10px 26px -14px rgba(0,0,0,.5);
          transition:all .22s ease;
        }
        .llx2-cta:hover {
          background:rgba(255,255,255,.88); color:#0f1f3d;
          transform:translateY(-2px);
          box-shadow:0 12px 30px rgba(0,0,0,.28);
        }
      `}</style>
      <div className="llx2-orb-a" aria-hidden="true" />
      <div className="llx2-orb-b" aria-hidden="true" />
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1100, margin: '0 auto' }}>
        <div className="hol-reveal" style={{ textAlign: 'center', marginBottom: 52 }}>
          <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '.24em', textTransform: 'uppercase', color: '#4a90d9', marginBottom: 14 }}>Why House of Lettings</div>
          <h2 className="llx2-h2" style={{ fontFamily: "'Poppins', sans-serif", fontSize: 'clamp(28px,3.8vw,46px)', fontWeight: 700, color: '#fff', margin: '0 0 16px', lineHeight: 1.15 }}>Helping Landlords Succeed Every Step of the Way</h2>
          <p className="llx2-sub" style={{ fontFamily: "'Poppins', sans-serif", fontSize: 15, fontWeight: 300, color: 'rgba(255,255,255,.55)', lineHeight: 1.75, maxWidth: 600, margin: '0 auto' }}>We combine local market expertise, transparent pricing, and proactive property management to help you achieve better long-term returns with less stress.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', gap: 20, marginBottom: 44 }}>
          <div className="llx2-card hol-reveal" style={{ animationDelay: '80ms' }}>
            <div className="llx2-tile">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7db4f0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
            </div>
            <h3 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 17, fontWeight: 700, color: '#fff', margin: '0 0 10px' }}>Local Market Expertise</h3>
            <p className="llx2-body" style={{ fontFamily: "'Poppins', sans-serif", fontSize: 13.5, fontWeight: 300, color: 'rgba(255,255,255,.62)', lineHeight: 1.75, margin: 0 }}>Agents on the ground in Leeds and Manchester who know exactly what your property can achieve, street by street.</p>
          </div>
          <div className="llx2-card hol-reveal" style={{ animationDelay: '160ms' }}>
            <div className="llx2-tile">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7db4f0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18" /><path d="M7 15h4" /></svg>
            </div>
            <h3 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 17, fontWeight: 700, color: '#fff', margin: '0 0 10px' }}>Transparent Pricing</h3>
            <p className="llx2-body" style={{ fontFamily: "'Poppins', sans-serif", fontSize: 13.5, fontWeight: 300, color: 'rgba(255,255,255,.62)', lineHeight: 1.75, margin: 0 }}>Clear packages, all inclusive of VAT, with no hidden fees, ever. You always know exactly what you pay and why.</p>
          </div>
          <div className="llx2-card hol-reveal" style={{ animationDelay: '240ms' }}>
            <div className="llx2-tile">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7db4f0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></svg>
            </div>
            <h3 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 17, fontWeight: 700, color: '#fff', margin: '0 0 10px' }}>Proactive Management</h3>
            <p className="llx2-body" style={{ fontFamily: "'Poppins', sans-serif", fontSize: 13.5, fontWeight: 300, color: 'rgba(255,255,255,.62)', lineHeight: 1.75, margin: 0 }}>We stay ahead of maintenance, compliance and rent reviews, so problems are solved before they cost you money.</p>
          </div>
        </div>
        <div className="hol-reveal" style={{ textAlign: 'center', animationDelay: '120ms' }}>
          <Link href="/branches" className="llx-cta llx2-cta" style={{ ...CTA_STYLE }}>Speak to Our Lettings Team</Link>
        </div>
      </div>
    </section>
  );
}

function LlxValuationWidget() {
  const [postcode, setPostcode] = useState('LS6 3AA');
  const [propertyType, setPropertyType] = useState<'flat' | 'terraced' | 'semi_detached' | 'detached' | 'bungalow'>('terraced');
  const [bedrooms, setBedrooms] = useState(2);

  const result = useMemo(
    () => calculateValuation({ postcode, propertyType, bedrooms, mode: 'rent' }),
    [postcode, propertyType, bedrooms],
  );

  const typeOptions: { label: string; value: 'flat' | 'terraced' | 'semi_detached' | 'detached' | 'bungalow' }[] = [
    { label: 'Flat', value: 'flat' },
    { label: 'Terraced', value: 'terraced' },
    { label: 'Semi', value: 'semi_detached' },
    { label: 'Detached', value: 'detached' },
    { label: 'Bungalow', value: 'bungalow' },
  ];

  return (
    <section className="llx3-sec">
      <style>{`
        .llx3-sec{position:relative;background:#f7f8fa;padding:clamp(64px,9vw,110px) clamp(20px,7%,100px);font-family:'Poppins',sans-serif;}
        .llx3-grid{max-width:1100px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:clamp(36px,5vw,60px);align-items:center;}
        .llx3-card{position:relative;border-radius:20px;background:#fff;border:1px solid #e5e7eb;box-shadow:0 40px 80px -34px rgba(4,10,26,.35);padding:clamp(26px,3vw,34px);max-width:460px;margin:0 auto;transition:transform .35s ease,box-shadow .35s ease;}
        .llx3-card:hover{transform:translateY(-6px);box-shadow:0 48px 92px -32px rgba(37,99,235,.4);}
        .llx3-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:22px;}
        .llx3-label{font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#6b7280;font-family:'Poppins',sans-serif;}
        .llx3-pill{display:inline-flex;align-items:center;gap:7px;font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#2672d2;background:#eff6ff;border:1px solid #dbeafe;border-radius:999px;padding:5px 11px;font-family:'Poppins',sans-serif;}
        .llx3-dot{width:6px;height:6px;border-radius:50%;background:#2563eb;animation:llxPulse 2.4s ease-out infinite;}
        .llx3-field{display:flex;align-items:center;gap:10px;background:#f7f8fa;border:1px solid #e5e7eb;border-radius:10px;padding:12px 16px;margin-bottom:14px;transition:border-color .2s ease,box-shadow .2s ease;}
        .llx3-field:focus-within{border-color:#2563eb;box-shadow:0 0 0 3px rgba(37,99,235,.12);}
        .llx3-input{flex:1;min-width:0;border:none;outline:none;background:transparent;font-family:'Poppins',sans-serif;font-size:14px;font-weight:600;color:#0f1f3d;letter-spacing:.04em;text-transform:uppercase;}
        .llx3-input::placeholder{color:#9ca3af;text-transform:none;letter-spacing:0;font-weight:500;}
        .llx3-region{font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#9ca3af;flex:none;font-family:'Poppins',sans-serif;}
        .llx3-chips{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:10px;}
        .llx3-beds{display:flex;align-items:center;flex-wrap:wrap;gap:7px;margin-bottom:20px;}
        .llx3-beds-label{font-size:11px;font-weight:600;color:#9ca3af;margin-right:3px;font-family:'Poppins',sans-serif;}
        .llx3-chip{display:inline-flex;align-items:center;justify-content:center;min-height:44px;min-width:44px;padding:0 15px;border-radius:999px;border:1px solid #e5e7eb;background:#f7f8fa;color:#4b5563;font-family:'Poppins',sans-serif;font-size:12px;font-weight:600;letter-spacing:.02em;cursor:pointer;transition:all .2s ease;}
        .llx3-chip:hover{border-color:#bfdbfe;color:#2563eb;transform:translateY(-1px);}
        .llx3-chip-on,.llx3-chip-on:hover{background:#2563eb;border-color:#2563eb;color:#fff;box-shadow:0 10px 22px -10px rgba(37,99,235,.75);animation:llx3Pop .32s ease;transform:none;}
        @keyframes llx3Pop{0%{transform:scale(.9)}55%{transform:scale(1.07)}100%{transform:scale(1)}}
        .llx3-result{border-radius:14px;background:linear-gradient(160deg,#15294c 0%,#0c1a33 100%);padding:20px 22px;margin-bottom:16px;}
        .llx3-result-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:7px;}
        .llx3-result-label{font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.5);font-family:'Poppins',sans-serif;}
        .llx3-growth{font-size:10px;font-weight:700;color:#4ade80;font-family:'Poppins',sans-serif;}
        .llx3-est{font-size:32px;font-weight:800;color:#4ade80;line-height:1;font-family:'Poppins',sans-serif;}
        .llx3-pcm{font-size:14px;font-weight:600;color:rgba(255,255,255,.6);}
        .llx3-track{position:relative;height:5px;border-radius:99px;background:rgba(255,255,255,.14);margin-top:16px;overflow:hidden;}
        .llx3-fill{position:absolute;left:22%;right:22%;top:0;bottom:0;border-radius:99px;background:linear-gradient(90deg,#2563eb,#4ade80,#2563eb);background-size:220% 100%;animation:llxShimmer 6.5s linear infinite;transition:all .4s ease;}
        .llx3-range{display:flex;justify-content:space-between;margin-top:7px;}
        .llx3-range-end{font-size:10px;font-weight:600;color:rgba(255,255,255,.4);font-family:'Poppins',sans-serif;}
        .llx3-range-mid{font-size:10px;font-weight:700;color:#4ade80;font-family:'Poppins',sans-serif;}
        .llx3-foot{display:block;text-align:center;font-size:11px;font-weight:500;color:#9ca3af;line-height:1.6;font-family:'Poppins',sans-serif;}
        .llx3-eyebrow{font-size:11px;font-weight:700;letter-spacing:.24em;text-transform:uppercase;color:#2672d2;margin-bottom:14px;font-family:'Poppins',sans-serif;}
        .llx3-h2{font-size:clamp(28px,3.8vw,46px);font-weight:700;color:#0f1f3d;line-height:1.15;margin:0 0 18px;font-family:'Poppins',sans-serif;text-wrap:balance;}
        .llx3-body{font-size:15px;font-weight:300;color:#4b5563;line-height:1.85;margin:0 0 26px;max-width:500px;font-family:'Poppins',sans-serif;text-wrap:pretty;}
        .llx3-list{list-style:none;margin:0 0 30px;padding:0;display:flex;flex-direction:column;gap:13px;}
        .llx3-li{display:flex;align-items:flex-start;gap:12px;font-size:14px;color:#374151;font-family:'Poppins',sans-serif;}
        .llx3-tick{flex:none;width:22px;height:22px;border-radius:50%;background:#f0fdf4;color:#16a34a;display:inline-flex;align-items:center;justify-content:center;margin-top:1px;transition:transform .25s ease;}
        .llx3-li:hover .llx3-tick{transform:scale(1.15) rotate(8deg);}
        .llx3-cta{background:#2563eb;color:#fff;box-shadow:0 14px 30px -14px rgba(37,99,235,.6);transition:all .22s ease;}
        .llx3-cta:hover{background:#1d4ed8;transform:translateY(-2px);box-shadow:0 22px 42px -14px rgba(37,99,235,.8);}
        .llx3-cta svg{transition:transform .22s ease;}
        .llx3-cta:hover svg{transform:translateX(3px);}
        .llx3-alt-wrap{margin-top:6px;}
        .llx3-alt{display:inline-flex;align-items:center;min-height:44px;font-size:13px;font-weight:500;color:#2672d2;text-decoration:none;font-family:'Poppins',sans-serif;}
        .llx3-alt:hover{text-decoration:underline;}
      `}</style>
      <div className="llx3-grid">
        <div className="hol-reveal" style={{ animationDelay: '120ms' }}>
          <div className="llx3-card">
            <div className="llx3-head">
              <span className="llx3-label">Rental Estimate</span>
              <span className="llx3-pill">
                <span className="llx3-dot" aria-hidden="true" />
                Live market data
              </span>
            </div>
            <div className="llx3-field">
              <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
              <input
                className="llx3-input"
                value={postcode}
                onChange={(e) => setPostcode(e.target.value.toUpperCase())}
                placeholder="Enter your postcode"
                aria-label="Postcode"
              />
              <span className="llx3-region">{result.regionLabel}</span>
            </div>
            <div className="llx3-chips" role="group" aria-label="Property type">
              {typeOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={propertyType === opt.value ? 'llx3-chip llx3-chip-on' : 'llx3-chip'}
                  aria-pressed={propertyType === opt.value}
                  onClick={() => setPropertyType(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="llx3-beds" role="group" aria-label="Bedrooms">
              <span className="llx3-beds-label">Bedrooms</span>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={bedrooms === n ? 'llx3-chip llx3-chip-on' : 'llx3-chip'}
                  aria-pressed={bedrooms === n}
                  onClick={() => setBedrooms(n)}
                >
                  {n}
                </button>
              ))}
            </div>
            <div className="llx3-result">
              <div className="llx3-result-head">
                <span className="llx3-result-label">Instant estimate</span>
                <span className="llx3-growth">+{result.annualGrowthPct.toFixed(1)}% rent growth YoY</span>
              </div>
              <span className="llx3-est">{formatCurrency(result.estimateMid)} <span className="llx3-pcm">pcm</span></span>
              <div className="llx3-track" aria-hidden="true">
                <span className="llx3-fill" />
              </div>
              <div className="llx3-range">
                <span className="llx3-range-end">{formatCurrency(result.estimateLow)}</span>
                <span className="llx3-range-mid">your range</span>
                <span className="llx3-range-end">{formatCurrency(result.estimateHigh)}</span>
              </div>
            </div>
            <span className="llx3-foot">Instant ballpark from {result.dataYear} ONS market data. Your full valuation is prepared by a local expert.</span>
          </div>
        </div>
        <div className="hol-reveal">
          <div className="llx3-eyebrow">Free Rental Valuation</div>
          <h2 className="llx3-h2">Find Out What Your Property Could Earn</h2>
          <p className="llx3-body">Receive a free, no-obligation rental valuation based on current market conditions in Leeds and Manchester.</p>
          <ul className="llx3-list">
            <li className="llx3-li">
              <span className="llx3-tick" aria-hidden="true"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg></span>
              Honest, data-backed figure from a local expert
            </li>
            <li className="llx3-li">
              <span className="llx3-tick" aria-hidden="true"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg></span>
              Based on live Leeds &amp; Manchester market conditions
            </li>
            <li className="llx3-li">
              <span className="llx3-tick" aria-hidden="true"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg></span>
              No obligation and no pressure to proceed
            </li>
          </ul>
          <div>
            <Link href="/book-valuation" className="llx-cta llx3-cta" style={{ ...CTA_STYLE }}>
              Get My Free Rental Valuation
              <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </Link>
          </div>
          <div className="llx3-alt-wrap">
            <Link href="/instant-valuation" className="llx3-alt">Prefer an instant online valuation?</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function LlxLettingSimple() {
  const steps: { num: string; title: string; body: string; done: boolean }[] = [
    {
      num: '01',
      title: 'Free Valuation',
      body: 'A local expert values your property against real, current market data.',
      done: false,
    },
    {
      num: '02',
      title: 'Choose Your Package',
      body: 'Tenant find only or fully managed, pick the level of support that suits you.',
      done: false,
    },
    {
      num: '03',
      title: 'We Find Quality Tenants',
      body: 'Marketing, viewings and rigorous referencing, so only the best applicants get through.',
      done: false,
    },
    {
      num: '04',
      title: 'Fully Managed',
      body: 'Rent, maintenance and compliance handled. You focus on your investment.',
      done: true,
    },
  ];
  return (
    <section style={{ position: 'relative', background: '#fff', padding: 'clamp(64px, 9vw, 110px) clamp(20px, 7%, 100px)' }}>
      <style>{`
        .llx4-head { text-align: center; margin-bottom: 56px; }
        .llx4-eyebrow { font-family: 'Poppins', sans-serif; font-size: 11px; font-weight: 700; letter-spacing: .24em; text-transform: uppercase; color: #2672d2; margin-bottom: 14px; }
        .llx4-title { font-family: 'Poppins', sans-serif; font-size: clamp(28px, 3.8vw, 46px); font-weight: 700; color: #0f1f3d; margin: 0 0 16px; line-height: 1.15; text-wrap: balance; }
        .llx4-sub { font-family: 'Poppins', sans-serif; font-size: 15px; font-weight: 300; color: #6b7280; line-height: 1.75; max-width: 600px; margin: 0 auto; text-wrap: pretty; }
        .llx4-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 20px; margin-bottom: 48px; }
        .llx4-card { position: relative; background: linear-gradient(180deg, #fff 0%, #fbfdff 100%); border: 1px solid #e5e7eb; border-radius: 18px; padding: 30px 24px 26px; transition: transform .3s cubic-bezier(.22,1,.36,1), box-shadow .3s ease, border-color .3s ease; }
        .llx4-card:hover { transform: translateY(-8px); border-color: #bfdbfe; box-shadow: 0 26px 46px -26px rgba(37,99,235,.45); }
        .llx4-top { display: flex; align-items: center; gap: 14px; margin-bottom: 16px; }
        .llx4-num { width: 46px; height: 46px; border-radius: 50%; background: #eff6ff; border: 2px solid #2563eb; display: inline-flex; align-items: center; justify-content: center; font-family: 'Poppins', sans-serif; font-size: 15px; font-weight: 800; color: #2672d2; flex: none; transition: transform .35s cubic-bezier(.34,1.56,.64,1), box-shadow .35s ease; }
        .llx4-card:hover .llx4-num { transform: scale(1.1); box-shadow: 0 0 0 6px rgba(37,99,235,.12); }
        .llx4-num-done { background: #2563eb; }
        .llx4-line { flex: 1; height: 2px; background: linear-gradient(90deg, #bfdbfe, transparent); transform-origin: left center; animation: llx4Grow 1s cubic-bezier(.22,1,.36,1) both; }
        @keyframes llx4Grow { from { transform: scaleX(0); } to { transform: scaleX(1); } }
        .llx4-tick { display: block; }
        .llx4-card:hover .llx4-tick { animation: llx4Pop .5s cubic-bezier(.34,1.56,.64,1); }
        @keyframes llx4Pop { 0% { transform: scale(1); } 45% { transform: scale(1.3) rotate(8deg); } 100% { transform: scale(1); } }
        .llx4-step-title { font-family: 'Poppins', sans-serif; font-size: 16px; font-weight: 700; color: #0f1f3d; margin: 0 0 9px; }
        .llx4-step-body { font-family: 'Poppins', sans-serif; font-size: 13.5px; font-weight: 400; color: #6b7280; line-height: 1.7; margin: 0; text-wrap: pretty; }
        .llx4-cta { background: #0f1f3d; color: #fff; transition: all .22s ease; }
        .llx4-cta:hover { background: #162849; transform: translateY(-2px); box-shadow: 0 16px 32px -16px rgba(15,31,61,.6); color: #fff; }
      `}</style>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div className="hol-reveal llx4-head">
          <div className="llx4-eyebrow">Letting Made Simple</div>
          <h2 className="llx4-title">A Simple Process from Valuation to Fully Managed</h2>
          <p className="llx4-sub">
            From your initial valuation to finding quality tenants and managing your property, we handle
            every step so you can focus on your investment.
          </p>
        </div>
        <div className="llx4-grid">
          {steps.map((s, i) => (
            <div key={s.num} className="hol-reveal llx4-card" style={{ animationDelay: `${60 + i * 80}ms` }}>
              <div className="llx4-top">
                {s.done ? (
                  <span className="llx4-num llx4-num-done">
                    <svg
                      className="llx4-tick"
                      aria-hidden="true"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#fff"
                      strokeWidth="2.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                ) : (
                  <span className="llx4-num">{s.num}</span>
                )}
                <span className="llx4-line" aria-hidden="true" style={{ animationDelay: `${200 + i * 90}ms` }} />
              </div>
              <h3 className="llx4-step-title">{s.title}</h3>
              <p className="llx4-step-body">{s.body}</p>
            </div>
          ))}
        </div>
        <div className="hol-reveal" style={{ textAlign: 'center', animationDelay: '120ms' }}>
          <Link href="/landlord-registration" className="llx-cta llx4-cta" style={CTA_STYLE}>
            Start Letting Today
          </Link>
        </div>
      </div>
    </section>
  );
}

// Package chooser carousel. Replaces both the old two-card "which route"
// section and the tabbed "Services Built Around You" section below it: one
// card per package, so a landlord meets all five in order (cheapest tenant
// find through to full protection) instead of picking a lane and then meeting
// the packages again further down the page. Desktop gets prev/next arrows,
// touch devices swipe — scroll-snap drives both, so the swipe is native and
// the arrows are just scrollTo calls, the same pattern as the RGI carousel
// lower down this page. id="packages" is kept: it is the scroll target for
// this section's own deep links.
function LlxChooseService() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [slide, setSlide] = useState(0);
  const last = BUNDLES.length - 1;

  // Measured rather than assumed, so the step stays correct at any card width.
  const step = () => {
    const t = trackRef.current;
    const a = t?.children[0] as HTMLElement | undefined;
    const b = t?.children[1] as HTMLElement | undefined;
    return a && b ? b.offsetLeft - a.offsetLeft : a?.offsetWidth || 1;
  };
  const go = (i: number) => {
    const t = trackRef.current;
    if (!t) return;
    const c = Math.max(0, Math.min(last, i));
    // Move the index now rather than waiting for the scroll event to land:
    // the controls stay in step with a fast double-click on the arrows, which
    // would otherwise both compute their target from a stale index.
    setSlide(c);
    t.scrollTo({ left: c * step(), behavior: 'smooth' });
  };
  // Swipes never call go(), so the scroll position stays the source of truth.
  const onScroll = () => {
    const t = trackRef.current;
    if (!t) return;
    setSlide(Math.max(0, Math.min(last, Math.round(t.scrollLeft / step()))));
  };

  return (
    <section id="packages" className="llx5-sec">
      <style>{`
        /* Grey band, deliberately a deeper grey than the #f7f8fa sections either
           side of it, so it still reads as its own section without going back to
           a dark blue. */
        .llx5-sec { position:relative; overflow:hidden; scroll-margin-top:88px;
          background:linear-gradient(180deg,#eceff5 0%,#e5e9f1 55%,#eceff5 100%);
          padding:clamp(64px,9vw,110px) clamp(20px,7%,100px); font-family:'Poppins',sans-serif; }
        .llx5-glow { position:absolute; inset:0; pointer-events:none;
          background:radial-gradient(ellipse at 82% 6%,rgba(37,99,235,.09) 0%,transparent 55%),
                     radial-gradient(ellipse at 12% 94%,rgba(15,31,61,.07) 0%,transparent 50%); }
        .llx5-inner { position:relative; z-index:1; max-width:1080px; margin:0 auto; }
        .llx5-head { text-align:center; margin-bottom:40px; }
        .llx5-eyebrow { font-size:11px; font-weight:700; letter-spacing:.24em; text-transform:uppercase; color:var(--logo-blue); margin-bottom:14px; }
        .llx5-h2 { font-size:clamp(28px,3.8vw,46px); font-weight:700; color:#0f1f3d; margin:0 0 16px; line-height:1.15; text-wrap:balance; }
        .llx5-sub { font-size:15px; font-weight:300; color:#6b7280; line-height:1.75; max-width:620px; margin:0 auto; text-wrap:pretty; }

        /* Hands-on spectrum: kept from the old section, but now it tracks the
           carousel — the knob slides as you move through the packages, which is
           exactly the axis they are ordered on. */
        .llx5-spectrum { max-width:520px; margin:0 auto 34px; text-align:center; }
        .llx5-spec-label { display:block; font-size:11px; font-weight:700; letter-spacing:.12em; text-transform:uppercase; color:#6b7280; margin-bottom:14px; }
        .llx5-track-line { position:relative; height:6px; border-radius:99px; background:#d5dbe6; margin:0 12px; }
        .llx5-fill { position:absolute; left:0; top:0; bottom:0; border-radius:99px; background:linear-gradient(90deg,#4a90d9,#2563eb); transition:width .45s cubic-bezier(.22,1,.36,1); }
        .llx5-knob { position:absolute; top:-6px; width:18px; height:18px; border-radius:50%; background:#fff; box-shadow:0 3px 12px rgba(15,31,61,.28),0 0 0 4px rgba(37,99,235,.28); transition:left .45s cubic-bezier(.22,1,.36,1); }
        .llx5-ends { display:flex; justify-content:space-between; margin-top:12px; padding:0 4px; }
        .llx5-end { font-size:11px; font-weight:600; color:#8a93a3; }

        /* Carousel */
        .llx5-carousel { position:relative; }
        .llx5-track { display:flex; gap:20px; overflow-x:auto; scroll-snap-type:x mandatory;
          scrollbar-width:none; -ms-overflow-style:none; padding:4px; margin:-4px; }
        .llx5-track::-webkit-scrollbar { display:none; }
        .llx5-slide { flex:0 0 100%; scroll-snap-align:center; scroll-snap-stop:always; min-width:0; }

        .llx5-card { display:grid; grid-template-columns:1.15fr 1fr; border-radius:20px; overflow:hidden;
          background:#fff; border:1px solid #dfe4ec; box-shadow:0 26px 54px -34px rgba(15,31,61,.4); height:100%; }
        .llx5-card.featured { border-color:#2563eb; box-shadow:0 30px 60px -32px rgba(37,99,235,.5); }
        @media (max-width:820px) { .llx5-card { grid-template-columns:1fr; } }

        .llx5-info { position:relative; padding:clamp(26px,3.2vw,40px); }
        .llx5-chips { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:16px; padding-right:96px; }
        .llx5-chip { font-size:10.5px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; border-radius:999px; padding:5px 11px; }
        .llx5-chip-kind { color:#4b5563; background:#f3f4f6; border:1px solid #e5e7eb; }
        .llx5-chip-you { color:var(--logo-blue); background:#eff6ff; border:1px solid #dbeafe; }
        .llx5-badge { position:absolute; top:clamp(26px,3.2vw,40px); right:clamp(26px,3.2vw,40px);
          font-size:9.5px; font-weight:800; letter-spacing:.08em; text-transform:uppercase;
          background:#2563eb; color:#fff; border-radius:999px; padding:5px 12px; white-space:nowrap;
          box-shadow:0 8px 18px -6px rgba(37,99,235,.6); }
        .llx5-name { font-size:clamp(23px,2.5vw,31px); font-weight:800; color:#0f1f3d; line-height:1.15; margin:0 0 10px; }
        .llx5-best { font-size:14px; font-weight:600; color:var(--logo-blue); margin:0 0 16px; line-height:1.5; }
        .llx5-blurb { font-size:14.5px; font-weight:300; color:#4b5563; line-height:1.8; margin:0 0 24px; text-wrap:pretty; }
        .llx5-price { display:flex; align-items:center; gap:20px; margin-bottom:26px; }
        .llx5-price > div { display:flex; flex-direction:column; }
        .llx5-price b { font-size:30px; font-weight:800; color:var(--price-green-ink); line-height:1; }
        .llx5-price span { font-size:11px; font-weight:600; letter-spacing:.04em; text-transform:uppercase; color:#6b7280; margin-top:6px; }
        .llx5-price-sep { width:1px; height:42px; background:#e5e7eb; }
        /* Both CTAs are the site-standard size and share a row, so the pair is
           identical on desktop and identically full-width on mobile. */
        .llx5-cta-pair { display:flex; flex-wrap:wrap; gap:12px; }
        .llx5-btn { display:inline-flex; align-items:center; justify-content:center; gap:9px;
          box-sizing:border-box; min-height:48px; flex:1 1 190px; line-height:1.2;
          font-size:13.5px; font-weight:700; letter-spacing:.02em; text-transform:uppercase;
          text-decoration:none; padding:14px 24px; border:1.5px solid transparent; border-radius:9px;
          transition:all .2s ease; }
        .llx5-btn.primary { background:#2563eb; color:#fff; border-color:#2563eb; }
        .llx5-btn.primary:hover { background:#1d4ed8; border-color:#1d4ed8; transform:translateY(-2px); }
        .llx5-btn.ghost { background:transparent; color:#0f1f3d; border-color:#cbd5e1; }
        .llx5-btn.ghost:hover { border-color:#0f1f3d; background:#0f1f3d; color:#fff; transform:translateY(-2px); }
        .llx5-btn svg { transition:transform .2s ease; }
        .llx5-btn:hover svg { transform:translateX(3px); }
        @media (max-width:600px) { .llx5-btn { flex:1 1 100%; } }

        .llx5-included { padding:clamp(26px,3.2vw,40px); background:#f7f9fc; border-left:1px solid #e9edf3; display:flex; flex-direction:column; }
        @media (max-width:820px) { .llx5-included { border-left:0; border-top:1px solid #e9edf3; } }
        .llx5-inc-label { font-size:11px; font-weight:700; letter-spacing:.12em; text-transform:uppercase; color:#6b7280; margin-bottom:18px; }
        .llx5-list { list-style:none; margin:0 0 22px; padding:0; display:flex; flex-direction:column; gap:14px; }
        .llx5-li { display:flex; gap:12px; align-items:flex-start; font-size:14px; color:#374151; line-height:1.5; }
        .llx5-tick { flex:none; width:22px; height:22px; border-radius:50%; background:#f0fdf4; color:var(--price-green); display:inline-flex; align-items:center; justify-content:center; margin-top:1px; }
        .llx5-inc-more { margin-top:auto; display:inline-flex; align-items:center; gap:7px; min-height:44px; font-size:12.5px; font-weight:700; color:var(--logo-blue); text-decoration:none; }
        .llx5-inc-more:hover { color:#0f1f3d; }
        .llx5-inc-more svg { transition:transform .2s ease; }
        .llx5-inc-more:hover svg { transform:translateX(3px); }

        /* Controls: arrows sit outside the card on wide screens and are hidden
           on touch widths, where the track is swiped instead. */
        .llx5-arrow { position:absolute; top:50%; transform:translateY(-50%); z-index:2;
          width:48px; height:48px; border-radius:50%; background:#fff; border:1px solid #dfe4ec;
          color:#0f1f3d; display:inline-flex; align-items:center; justify-content:center; cursor:pointer;
          box-shadow:0 12px 28px -12px rgba(15,31,61,.45); transition:all .2s ease; }
        .llx5-arrow:hover:not(:disabled) { background:#2563eb; border-color:#2563eb; color:#fff; box-shadow:0 16px 32px -12px rgba(37,99,235,.7); }
        .llx5-arrow:disabled { opacity:.34; cursor:default; }
        .llx5-arrow.prev { left:-24px; }
        .llx5-arrow.next { right:-24px; }
        @media (max-width:1180px) { .llx5-arrow.prev { left:8px; } .llx5-arrow.next { right:8px; } }
        @media (max-width:820px) { .llx5-arrow { display:none; } }

        .llx5-controls { display:flex; align-items:center; justify-content:center; gap:16px; margin-top:26px; }
        .llx5-dots { display:flex; gap:8px; }
        .llx5-dot { width:32px; height:32px; padding:0; border:0; background:none; cursor:pointer;
          display:inline-flex; align-items:center; justify-content:center; }
        .llx5-dot i { display:block; width:8px; height:8px; border-radius:50%; background:#c2cad8; transition:all .25s ease; }
        .llx5-dot:hover i { background:#94a3b8; }
        .llx5-dot.on i { width:26px; border-radius:99px; background:#2563eb; }
        .llx5-count { font-size:12px; font-weight:600; color:#6b7280; font-variant-numeric:tabular-nums; }
        .llx5-swipe { display:none; }
        @media (max-width:820px) { .llx5-swipe { display:inline; font-size:11.5px; font-weight:500; color:#8a93a3; } }

        .llx5-note { text-align:center; font-size:13px; font-weight:300; color:#6b7280; line-height:1.7; max-width:640px; margin:30px auto 26px; text-wrap:pretty; }
        .llx5-cta-row { text-align:center; }
        .llx5-cta { background:#0f1f3d; color:#fff; transition:all .22s ease; }
        .llx5-cta:hover { background:#162849; color:#fff; transform:translateY(-2px); box-shadow:0 16px 32px -16px rgba(15,31,61,.6); }
        @media (prefers-reduced-motion: reduce) { .llx5-track { scroll-behavior:auto; } }
      `}</style>
      <div className="llx5-glow" aria-hidden="true" />
      <div className="llx5-inner">
        <div className="llx5-head hol-reveal">
          <div className="llx5-eyebrow">Compare Our Landlord Packages</div>
          <h2 className="llx5-h2">Choose the Right Service for Your Property</h2>
          <p className="llx5-sub">From simply finding you a quality tenant through to fully protecting your rental income. Move through the packages to find the one that fits your goals and budget.</p>
        </div>

        <div className="llx5-spectrum hol-reveal" style={{ animationDelay: '60ms' }}>
          <span className="llx5-spec-label">How hands-on do you want to be?</span>
          <div className="llx5-track-line">
            <span className="llx5-fill" style={{ width: `${(slide / last) * 100}%` }} aria-hidden="true" />
            <span className="llx5-knob" style={{ left: `calc(${(slide / last) * 100}% - 9px)` }} aria-hidden="true" />
          </div>
          <div className="llx5-ends">
            <span className="llx5-end">{"I'll manage it myself"}</span>
            <span className="llx5-end">Handle everything for me</span>
          </div>
        </div>

        <div className="llx5-carousel hol-reveal" style={{ animationDelay: '120ms' }}>
          <button
            type="button"
            className="llx5-arrow prev"
            onClick={() => go(slide - 1)}
            disabled={slide === 0}
            aria-label="Previous package"
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <div
            className="llx5-track"
            ref={trackRef}
            onScroll={onScroll}
            role="group"
            aria-roledescription="carousel"
            aria-label="Landlord packages"
          >
            {BUNDLES.map((b, i) => {
              const isMgmt = b.kind === 'Management';
              return (
                <div
                  key={b.id}
                  className="llx5-slide"
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${i + 1} of ${BUNDLES.length}: ${b.label}`}
                  aria-hidden={slide !== i}
                >
                  <div className={`llx5-card${b.badge ? ' featured' : ''}`}>
                    <div className="llx5-info">
                      {b.badge && <span className="llx5-badge">{b.badge}</span>}
                      <div className="llx5-chips">
                        <span className="llx5-chip llx5-chip-kind">{b.kind}</span>
                        <span className="llx5-chip llx5-chip-you">{b.youWe}</span>
                      </div>
                      <h3 className="llx5-name">{b.label}</h3>
                      <p className="llx5-best">Best for {b.bestForLead} {b.bestForRest}.</p>
                      <p className="llx5-blurb">{b.blurb}</p>
                      {/* The ongoing percentage leads: it is our main management
                          fee. Tenant-find packages have no percentage, so the
                          one-time fee leads there instead. */}
                      <div className="llx5-price">
                        {isMgmt ? (
                          <>
                            <div>
                              <b>{b.mgmtFee}</b>
                              <span>management fees</span>
                            </div>
                            <div className="llx5-price-sep" aria-hidden="true" />
                            <div>
                              <b>{b.setupFee}</b>
                              <span>set up fees</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div>
                              <b>{b.setupFee}</b>
                              <span>set up fees</span>
                            </div>
                            <div className="llx5-price-sep" aria-hidden="true" />
                            <div>
                              <b>£0</b>
                              <span>no management fees</span>
                            </div>
                          </>
                        )}
                      </div>
                      <div className="llx5-cta-pair">
                        <Link href="/book-valuation" className="llx5-btn primary" tabIndex={slide === i ? undefined : -1}>
                          Book a Free Valuation
                        </Link>
                        <Link href={`/pricing/${b.id}`} className="llx5-btn ghost" tabIndex={slide === i ? undefined : -1}>
                          See full details
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                        </Link>
                      </div>
                    </div>
                    <div className="llx5-included">
                      <div className="llx5-inc-label">What&apos;s included</div>
                      <ul className="llx5-list">
                        {PKG_HL[i].map((h) => (
                          <li key={h} className="llx5-li">
                            <span className="llx5-tick" aria-hidden="true">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                            </span>
                            {h}
                          </li>
                        ))}
                      </ul>
                      <Link href={`/pricing/${b.id}`} className="llx5-inc-more" tabIndex={slide === i ? undefined : -1}>
                        See every service included
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <button
            type="button"
            className="llx5-arrow next"
            onClick={() => go(slide + 1)}
            disabled={slide === last}
            aria-label="Next package"
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6" /></svg>
          </button>
        </div>

        <div className="llx5-controls">
          <div className="llx5-dots">
            {BUNDLES.map((b, i) => (
              <button
                key={b.id}
                type="button"
                className={`llx5-dot${slide === i ? ' on' : ''}`}
                onClick={() => go(i)}
                aria-label={`Show ${b.label}`}
                aria-current={slide === i}
              >
                <i />
              </button>
            ))}
          </div>
          <span className="llx5-count">
            {slide + 1} / {BUNDLES.length}
            <span className="llx5-swipe"> · swipe</span>
          </span>
        </div>

        <p className="llx5-note">
          All prices inclusive of VAT. Every management tier includes a full tenant find, and
          management runs on a rolling monthly basis, so you can upgrade or cancel any time.
        </p>
        <div className="llx5-cta-row">
          <Link href="/pricing" className="llx-cta llx5-cta" style={{ ...CTA_STYLE }}>Compare All Packages</Link>
        </div>
      </div>
    </section>
  );
}

function LlxReadyToGrow() {
  return (
    <section className="llx6-band">
      <style>{`
        .llx6-band{position:relative;overflow:hidden;background:linear-gradient(168deg,#0a1730 0%,#12244a 55%,#0a1a38 100%);padding:clamp(76px,10vw,130px) clamp(20px,7%,100px);}
        .llx6-grid{position:absolute;inset:0;pointer-events:none;opacity:.6;background-image:linear-gradient(rgba(255,255,255,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.045) 1px,transparent 1px);background-size:48px 48px;-webkit-mask-image:radial-gradient(ellipse 78% 68% at 50% 40%,#000 0%,transparent 76%);mask-image:radial-gradient(ellipse 78% 68% at 50% 40%,#000 0%,transparent 76%);animation:llx6GridDrift 32s linear infinite;}
        @keyframes llx6GridDrift{from{background-position:0 0,0 0;}to{background-position:48px 48px,48px 48px;}}
        .llx6-orb-a{position:absolute;width:520px;height:520px;top:-180px;left:-140px;border-radius:50%;filter:blur(72px);pointer-events:none;background:radial-gradient(circle,rgba(37,99,235,.5) 0%,transparent 70%);animation:llxOrbA 22s ease-in-out infinite;}
        .llx6-orb-b{position:absolute;width:440px;height:440px;bottom:-190px;right:-110px;border-radius:50%;filter:blur(72px);pointer-events:none;background:radial-gradient(circle,rgba(74,144,217,.36) 0%,transparent 70%);animation:llxOrbB 26s ease-in-out infinite;}
        .llx6-inner{position:relative;z-index:1;max-width:820px;margin:0 auto;text-align:center;}
        .llx6-eyebrow{display:inline-flex;align-items:center;gap:9px;font-family:'Poppins',sans-serif;font-size:11px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:#9dc2f2;background:rgba(37,99,235,.12);border:1px solid rgba(74,144,217,.3);border-radius:999px;padding:8px 16px 8px 13px;margin-bottom:24px;max-width:100%;-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);animation:llx6PillFloat 5.5s ease-in-out infinite;}
        @keyframes llx6PillFloat{0%,100%{transform:translateY(0);}50%{transform:translateY(-4px);}}
        @media (max-width:480px){.llx6-eyebrow{font-size:10px;letter-spacing:.12em;}}
        .llx6-dot{flex:0 0 auto;width:7px;height:7px;border-radius:50%;background:#4a90d9;animation:llxPulse 2.4s ease-out infinite;}
        .llx6-title{font-family:'Poppins',sans-serif;font-size:clamp(32px,5vw,58px);font-weight:800;color:#fff;line-height:1.08;letter-spacing:-.02em;margin:0 0 22px;text-shadow:0 2px 44px rgba(0,0,0,.5);text-wrap:balance;}
        .llx6-accent{color:#4a90d9;}
        .llx6-body{font-family:'Poppins',sans-serif;font-size:clamp(15px,1.4vw,17px);font-weight:300;color:rgba(255,255,255,.68);line-height:1.75;max-width:600px;margin:0 auto 36px;text-wrap:pretty;}
        .llx6-ctas{display:flex;flex-wrap:wrap;gap:14px;justify-content:center;}
        .llx6-cta{transition:transform .25s ease,box-shadow .25s ease,background .25s ease,border-color .25s ease;}
        .llx6-cta-primary{background:linear-gradient(135deg,#2563eb 0%,#1d4ed8 55%,#2563eb 100%);background-size:220% 100%;box-shadow:0 14px 34px -12px rgba(37,99,235,.72);animation:llxShimmer 7s linear infinite;}
        .llx6-cta-primary:hover{transform:translateY(-2px);box-shadow:0 22px 46px -12px rgba(37,99,235,.9);}
        .llx6-cta-ghost{background:rgba(255,255,255,.05);-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);}
        .llx6-cta-ghost:hover{transform:translateY(-2px);background:rgba(255,255,255,.11);border-color:#fff !important;box-shadow:0 18px 38px -18px rgba(74,144,217,.55);}
      `}</style>
      <div className="llx6-grid" aria-hidden="true" />
      <div className="llx6-orb-a" aria-hidden="true" />
      <div className="llx6-orb-b" aria-hidden="true" />
      <div className="llx6-inner">
        <div className="hol-reveal">
          <div className="llx6-eyebrow">
            <span className="llx6-dot" />
            Ready to Grow Your Property Portfolio?
          </div>
          <h2 className="llx6-title">
            Your Next Investment Starts with the <span className="llx6-accent">Right Partner</span>
          </h2>
          <p className="llx6-body">
            Partner with an affordable estate agent committed to helping landlords maximise
            returns, minimise hassle, and protect their investment.
          </p>
        </div>
        <div className="llx6-ctas hol-reveal" style={{ animationDelay: '120ms' }}>
          <Link
            href="/branches"
            className="llx-cta llx6-cta llx6-cta-primary"
            style={{ ...CTA_STYLE, color: '#fff' }}
          >
            Contact Our Team
          </Link>
          <Link
            href="/book-valuation"
            className="llx-cta llx6-cta llx6-cta-ghost"
            style={{ ...CTA_STYLE, border: '1.5px solid rgba(255,255,255,.32)', color: '#fff' }}
          >
            Book a Free Valuation
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function LandlordsPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const rgiRef = useRef<HTMLDivElement>(null);
  const [rgiSlide, setRgiSlide] = useState(0);
  const rgiStep = () => {
    const t = rgiRef.current;
    const a = t?.children[0] as HTMLElement | undefined;
    const b = t?.children[1] as HTMLElement | undefined;
    return a && b ? b.offsetLeft - a.offsetLeft : a?.offsetWidth || 1;
  };
  const rgiGo = (i: number) => {
    const t = rgiRef.current;
    if (!t) return;
    const c = Math.max(0, Math.min(RGI_SLIDES.length - 1, i));
    t.scrollTo({ left: c * rgiStep(), behavior: 'smooth' });
  };
  const rgiOnScroll = () => {
    const t = rgiRef.current;
    if (!t) return;
    const idx = Math.round(t.scrollLeft / rgiStep());
    setRgiSlide(Math.max(0, Math.min(RGI_SLIDES.length - 1, idx)));
  };

  return (
    <>
      <Navbar />
      <RevealCards />
      <LlxShared />

      {/* ── HERO ─────────────────────────────────────────────── */}
      <style>{`
        .ll-hero {
          position: relative; overflow: hidden; isolation: isolate;
          background: linear-gradient(168deg, #0a1730 0%, #12244a 52%, #0a1a38 100%);
        }
        /* Masked grid texture */
        .ll-hero-grid {
          position: absolute; inset: 0; z-index: 0; pointer-events: none; opacity: .6;
          background-image:
            linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px);
          background-size: 48px 48px;
          -webkit-mask-image: radial-gradient(ellipse 78% 68% at 50% 34%, #000 0%, transparent 76%);
                  mask-image: radial-gradient(ellipse 78% 68% at 50% 34%, #000 0%, transparent 76%);
        }
        /* Floating aurora orbs */
        .ll-hero-orb { position: absolute; z-index: 0; border-radius: 50%; filter: blur(72px); pointer-events: none; }
        .ll-hero-orb.a { width: 540px; height: 540px; top: -170px; left: -130px;
          background: radial-gradient(circle, rgba(37,99,235,.5) 0%, transparent 70%);
          animation: ll-orb-a 20s ease-in-out infinite; }
        .ll-hero-orb.b { width: 480px; height: 480px; bottom: -200px; right: -120px;
          background: radial-gradient(circle, rgba(74,144,217,.38) 0%, transparent 70%);
          animation: ll-orb-b 24s ease-in-out infinite; }
        .ll-hero-orb.c { width: 380px; height: 380px; top: 14%; right: 16%;
          background: radial-gradient(circle, rgba(56,120,220,.26) 0%, transparent 70%);
          animation: ll-orb-a 30s ease-in-out infinite reverse; }
        @keyframes ll-orb-a { 0%,100% { transform: translate(0,0); } 50% { transform: translate(64px,44px); } }
        @keyframes ll-orb-b { 0%,100% { transform: translate(0,0); } 50% { transform: translate(-54px,-40px); } }
        /* Spotlight behind headline */
        .ll-hero-glow { position: absolute; inset: 0; z-index: 0; pointer-events: none;
          background: radial-gradient(ellipse 58% 46% at 50% 28%, rgba(37,99,235,.24) 0%, transparent 70%); }

        .ll-hero-inner {
          position: relative; z-index: 2; max-width: 920px; margin: 0 auto; text-align: center;
          padding: clamp(140px,17vw,204px) clamp(24px,6%,80px) clamp(84px,10vw,120px);
        }
        .ll-hero-eyebrow {
          display: inline-flex; align-items: center; gap: 9px;
          font: 700 12px/1 'Poppins', sans-serif; letter-spacing: .2em; text-transform: uppercase;
          color: #9dc2f2; background: rgba(37,99,235,.12);
          border: 1px solid rgba(74,144,217,.3); border-radius: 999px;
          padding: 8px 16px 8px 13px; margin-bottom: 26px; backdrop-filter: blur(4px);
        }
        .ll-hero-eyebrow .dot { width: 7px; height: 7px; border-radius: 50%; background: #4a90d9;
          box-shadow: 0 0 0 0 rgba(74,144,217,.6); animation: ll-pulse 2.4s ease-out infinite; }
        @keyframes ll-pulse {
          0% { box-shadow: 0 0 0 0 rgba(74,144,217,.55); }
          70% { box-shadow: 0 0 0 9px rgba(74,144,217,0); }
          100% { box-shadow: 0 0 0 0 rgba(74,144,217,0); }
        }
        .ll-hero-h1 {
          font-family: 'Poppins', sans-serif; font-weight: 800; color: #fff;
          font-size: clamp(42px, 7.4vw, 86px); line-height: 1.02; letter-spacing: -0.022em;
          text-transform: uppercase; margin: 0 0 26px; text-shadow: 0 2px 44px rgba(0,0,0,.5);
        }
        .ll-hero-h1 .accent {
          text-shadow: none;
          background: linear-gradient(100deg, #4a90d9 0%, #8fc0f4 28%, #2563eb 54%, #7db4ee 78%, #4a90d9 100%);
          background-size: 220% auto; -webkit-background-clip: text; background-clip: text;
          -webkit-text-fill-color: transparent; color: transparent;
          filter: drop-shadow(0 6px 26px rgba(37,99,235,.4));
          animation: ll-shimmer 6.5s linear infinite;
        }
        @keyframes ll-shimmer { to { background-position: 220% center; } }
        .ll-hero-sub {
          font: 300 clamp(15px,1.35vw,19px)/1.72 'Poppins', sans-serif;
          color: rgba(255,255,255,.72); max-width: 600px; margin: 0 auto 36px;
        }
        .ll-hero-cta { display: flex; gap: 14px; flex-wrap: wrap; justify-content: center; margin-bottom: 46px; }
        .ll-hero-btn {
          display: inline-flex; align-items: center; justify-content: center; gap: 9px;
          padding: 17px 34px; min-width: 232px; border-radius: 10px; cursor: pointer;
          font: 700 15px/1 'Poppins', sans-serif; letter-spacing: .03em; text-transform: uppercase;
          text-decoration: none;
          transition: transform .25s ease, box-shadow .25s ease, background .25s ease, border-color .25s ease;
        }
        .ll-hero-primary { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #fff; border: none;
          box-shadow: 0 14px 34px -12px rgba(37,99,235,.72); }
        .ll-hero-primary:hover { transform: translateY(-3px); box-shadow: 0 22px 46px -12px rgba(37,99,235,.9); }
        .ll-hero-primary svg { transition: transform .25s ease; }
        .ll-hero-primary:hover svg { transform: translateX(4px); }
        .ll-hero-ghost { background: rgba(255,255,255,.05); color: #fff;
          border: 1.5px solid rgba(255,255,255,.28); backdrop-filter: blur(4px); }
        .ll-hero-ghost:hover { transform: translateY(-3px); border-color: #fff; background: rgba(255,255,255,.11); }

        .ll-hero-stats {
          display: flex; flex-wrap: wrap; justify-content: center; max-width: 720px; margin: 0 auto;
          border: 1px solid rgba(255,255,255,.1); border-radius: 16px; overflow: hidden;
          background: rgba(255,255,255,.035); backdrop-filter: blur(6px);
        }
        .ll-hero-stat { flex: 1 1 150px; padding: 18px 18px; text-align: center;
          border-right: 1px solid rgba(255,255,255,.08); }
        .ll-hero-stat:last-child { border-right: none; }
        .ll-hero-stat b { display: block; font: 800 22px/1 'Poppins', sans-serif; color: #fff; margin-bottom: 6px; }
        .ll-hero-stat b em { font-style: normal; color: #4a90d9; }
        .ll-hero-stat span { font: 600 11px/1.3 'Poppins', sans-serif; letter-spacing: .06em;
          text-transform: uppercase; color: rgba(255,255,255,.55); }
        @media (max-width: 560px) {
          .ll-hero-stat { flex-basis: 50%; }
          .ll-hero-stat:nth-child(2n) { border-right: none; }
          .ll-hero-stat:nth-child(-n+2) { border-bottom: 1px solid rgba(255,255,255,.08); }
        }

        /* Staggered entrance — layered on ONLY when motion is welcome, so the
           hero content is never left hidden if the animation can't run. */
        @keyframes ll-rise { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: none; } }
        @media (prefers-reduced-motion: no-preference) {
          .ll-anim { opacity: 0; animation: ll-rise .7s cubic-bezier(.2,.7,.2,1) forwards; }
          .ll-d1 { animation-delay: .05s; } .ll-d2 { animation-delay: .16s; }
          .ll-d3 { animation-delay: .28s; } .ll-d4 { animation-delay: .4s; } .ll-d5 { animation-delay: .52s; }
        }

        @media (max-width: 600px) {
          .ll-hero-btn { width: 100%; min-width: 0; }
          .ll-hero-cta { flex-direction: column; }
        }
        @media (prefers-reduced-motion: reduce) {
          .ll-hero-orb, .ll-hero-eyebrow .dot, .ll-hero-h1 .accent { animation: none !important; }
        }
      `}</style>
      <ServiceHero
        eyebrow="For Landlords · Leeds & Manchester"
        title={<>Better management.<br />Better tenants.<br /><span style={{ color: '#4a90d9' }}>Better returns.</span></>}
        subtitle="Professional lettings and property management that protects your investment and maximises your returns, across Leeds and Manchester."
        image="/images/Background_of_the_services.webp"
        imageAlt="House of Lettings agents advising landlord clients"
        ctas={[
          { label: 'Book a Free Valuation', href: '/book-valuation' },
          { label: 'View Our Packages', href: '/pricing', variant: 'ghost' },
        ]}
        stats={[
          { value: <>From&nbsp;<em>{LOWEST_MGMT_FEE}</em></>, label: 'Management fees' },
          { value: <>From&nbsp;<em>{LOWEST_FIND_FEE}</em></>, label: 'Tenant find fees' },
          { value: <em>£0</em>, label: 'Hidden fees' },
          { value: <em>Free</em>, label: 'Rental valuation' },
        ]}
      />





      



{/* ── S1 · INVESTMENT SMARTER (handoff) ───────────────── */}
      <LlxInvestmentSmarter />

      {/* ── S2 · WHY LANDLORDS CHOOSE US (handoff) ──────────── */}
      <LlxWhyLandlords />

      {/* ── WHY HOUSE OF LETTINGS ───────────────────────────── */}
      <section style={{
        padding: 'clamp(60px, 8vw, 100px) clamp(24px, 7%, 100px)',
        background: '#f7f8fa',
      }}>
        <style>{`
          .ll-intro-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 56px;
            align-items: start;
            max-width: 1100px;
            margin: 0 auto;
          }
          @media (max-width: 768px) {
            .ll-intro-grid { grid-template-columns: 1fr; gap: 40px; }
            .ll-price-panel { position: static !important; }
          }
          /* Pricing-at-a-glance panel (replaces the old hero image) */
          .ll-price-panel {
            background: linear-gradient(160deg,#15294c 0%,#0c1a33 100%);
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 16px; padding: 26px 24px;
            box-shadow: 0 26px 54px -30px rgba(9,18,40,0.75);
            position: sticky; top: 96px;
          }
          .ll-price-eyebrow { font-family:'Poppins',sans-serif; font-size:11px; font-weight:700;
            letter-spacing:.14em; text-transform:uppercase; color:#4a90d9; }
          .ll-price-title { font-family:'Poppins',sans-serif; font-size:22px; font-weight:800; color:#fff; margin:7px 0 4px; }
          .ll-price-sub { font-family:'Poppins',sans-serif; font-size:12.5px; color:#a9c4ea; }
          .ll-price-list { list-style:none; margin:20px 0 0; padding:0; }
          /* Each row is a link to that package's detail page, so the whole row
             is one 44px+ tap target rather than a dead panel of text. */
          .ll-price-row { display:flex; align-items:center; justify-content:space-between; gap:14px;
            padding:14px 12px; border-radius:10px; border-top:1px solid rgba(255,255,255,0.07);
            text-decoration:none; cursor:pointer; transition:background .2s ease, transform .2s ease; }
          .ll-price-row:first-child { border-top:0; }
          .ll-price-row.ll-hot { background:rgba(37,99,235,0.16); border-top-color:transparent; }
          .ll-price-row:hover { background:rgba(255,255,255,0.09); transform:translateX(3px); }
          .ll-price-row.ll-hot:hover { background:rgba(37,99,235,0.28); }
          .ll-price-row:focus-visible { outline:2px solid #4a90d9; outline-offset:2px; }
          .ll-price-arrow { flex:none; color:#4a90d9; opacity:0; transform:translateX(-4px);
            transition:opacity .2s ease, transform .2s ease; }
          .ll-price-row:hover .ll-price-arrow { opacity:1; transform:none; }
          .ll-price-nm { display:flex; align-items:center; gap:8px; font-family:'Poppins',sans-serif;
            font-size:14.5px; font-weight:700; color:#fff; }
          .ll-price-nm em { font-style:normal; font-size:9px; font-weight:800; letter-spacing:.08em;
            text-transform:uppercase; background:#2563eb; color:#fff; border-radius:999px; padding:2px 8px; }
          .ll-price-kd { display:block; font-family:'Poppins',sans-serif; font-size:11.5px; color:#8fa6c9; margin-top:3px; }
          /* margin-left:auto keeps the figure hard against the arrow on the
             right, rather than the row's space-between stranding it mid-row. */
          .ll-price-fig { text-align:right; flex:none; margin-left:auto; }
          /* Price figures are the additional-services green (#16a34a) site-wide. */
          .ll-price-fig b { display:block; font-family:'Poppins',sans-serif; font-size:18px; font-weight:800; color:var(--price-green-bright); }
          .ll-price-fig span { font-family:'Poppins',sans-serif; font-size:11px; color:#a9c4ea; }
          .ll-price-cta { display:inline-block; margin-top:20px; font-family:'Poppins',sans-serif;
            font-size:13px; font-weight:700; color:#4a90d9; text-decoration:none; }
          .ll-price-cta:hover { color:#fff; }
          /* The "Why choose us" CTA pair. Both buttons are the site-standard CTA
             size and flex:1 within a shared max-width row, so they are identical
             to each other on desktop and stack to the same full width on mobile
             rather than sizing themselves to their label. */
          .ll-why-ctas { display:flex; flex-wrap:wrap; gap:12px; max-width:440px; }
          .ll-why-ctas > * { flex:1 1 190px; }
          @media (max-width:600px) { .ll-why-ctas { max-width:none; } .ll-why-ctas > * { flex:1 1 100%; } }
        `}</style>
        <div className="ll-intro-grid">
          <div>
            <div style={{
              fontSize: 11, fontWeight: 700, letterSpacing: 3,
              textTransform: 'uppercase', color: 'var(--logo-blue)', marginBottom: 16,
              fontFamily: "'Poppins', sans-serif",
            }}>
              Why Choose Us
            </div>
            <h2 style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: 'clamp(26px,3.5vw,44px)', fontWeight: 700,
              color: '#0f1f3d', lineHeight: 1.2, marginBottom: 20,
            }}>
              Expert letting agents who put your returns first
            </h2>
            <p style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: 15, color: '#4b5563', lineHeight: 1.85,
              marginBottom: 32,
            }}>
              At House of Lettings, we believe landlords deserve more than just a property manager, they deserve a partner. Our local experts in Leeds and Manchester work to maximise your rental yield, keep your property compliant, and take the day to day stress completely off your plate.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 36px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                'Free, no obligation rental valuation',
                'Transparent pricing, no hidden fees, ever',
                'Rigorous tenant referencing and screening',
                'Full compliance with UK lettings legislation',
                'Rent collection and arrears management',
                'Dedicated local agent for your portfolio',
              ].map(item => (
                <li key={item} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: 14, color: '#374151',
                }}>
                  <span style={{ color: '#16a34a', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <div className="ll-why-ctas">
              <Link href="/book-valuation"
                style={{
                  ...CTA_STYLE, background: '#0f1f3d', color: '#fff',
                  cursor: 'pointer', transition: 'background 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#162849')}
                onMouseLeave={e => (e.currentTarget.style.background = '#0f1f3d')}
              >
                Get a Free Valuation
              </Link>
              {/* Start Here → the full landlord explainer: process, pricing,
                  paperwork and legal duties, for landlords who want to read
                  before they book anything. */}
              <Link href="/landlords/start-here"
                style={{
                  ...CTA_STYLE, background: 'transparent', color: '#0f1f3d',
                  borderColor: '#0f1f3d', cursor: 'pointer',
                  transition: 'background 0.2s, color 0.2s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#0f1f3d';
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#0f1f3d';
                }}
              >
                Start Here
              </Link>
            </div>
          </div>
          {/* Pricing snapshot (title + price only) in place of the old flyer image */}
          <div className="ll-price-panel">
            <span className="ll-price-eyebrow">Our Packages</span>
            <h3 className="ll-price-title">Pricing at a glance</h3>
            <span className="ll-price-sub">Inclusive of VAT. No hidden fees, ever.</span>
            <ul className="ll-price-list">
              {BUNDLES.map(b => (
                <li key={b.id}>
                  <Link href={`/pricing/${b.id}`} className={`ll-price-row${b.badge ? ' ll-hot' : ''}`}>
                    <div>
                      <span className="ll-price-nm">{b.short}{b.badge && <em>Popular</em>}</span>
                      <span className="ll-price-kd">{b.kind}</span>
                    </div>
                    {/* The ongoing percentage leads: it is our main management fee. */}
                    <div className="ll-price-fig">
                      <b>{b.mgmtFee || b.setupFee}</b>
                      <span>{b.mgmtFee ? `management fees + ${b.setupFee} set up fees` : 'set up fees'}</span>
                    </div>
                    <svg className="ll-price-arrow" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </Link>
                </li>
              ))}
            </ul>
            <Link href="/pricing" className="ll-price-cta">See what&apos;s included in each &rarr;</Link>
          </div>
        </div>
      </section>


      {/* ── S5 · CHOOSE YOUR SERVICE (package carousel) ─────── */}
      <LlxChooseService />

      {/* ── ADDITIONAL SERVICES ─────────────────────────────── */}
      <section style={{
        padding: 'clamp(60px, 8vw, 100px) clamp(24px, 7%, 100px)',
        background: '#f7f8fa',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 52, maxWidth: 620, marginLeft: 'auto', marginRight: 'auto' }}>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: 3,
            textTransform: 'uppercase', color: 'var(--logo-blue)', marginBottom: 14,
            fontFamily: "'Poppins', sans-serif",
          }}>
            Pay As You Go
          </div>
          <h2 style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: 'clamp(28px,4vw,44px)', fontWeight: 700,
            color: '#0f1f3d', margin: '0 0 16px',
          }}>
            Additional services, whenever you need them
          </h2>
          <p style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: 15, color: '#6b7280', lineHeight: 1.7, margin: 0,
          }}>
            Certificates, inventories, photography, referencing and rent protection. Order any
            service on its own, with or without a package, all inclusive of VAT.
          </p>
        </div>
        <style>{`
          .ll-as-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            max-width: 1100px;
            margin: 0 auto 44px;
          }
          .ll-as-card {
            background: #fff; border: 1px solid #e5e7eb; border-radius: 14px;
            padding: 26px 24px; text-decoration: none; display: flex; flex-direction: column;
            transition: transform .2s ease, border-color .2s ease, box-shadow .2s ease;
          }
          .ll-as-card:hover {
            transform: translateY(-4px); border-color: #2563eb;
            box-shadow: 0 20px 40px -26px rgba(15,31,61,.4);
          }
          .ll-as-title { font-family:'Poppins',sans-serif; font-size:16px; font-weight:700;
            color:#0f1f3d; margin:0 0 16px; line-height:1.3; }
          .ll-as-list { list-style:none; margin:0 0 18px; padding:0; display:flex; flex-direction:column; gap:11px; flex:1; }
          .ll-as-item { display:flex; align-items:baseline; justify-content:space-between; gap:12px; }
          .ll-as-item span { font-family:'Poppins',sans-serif; font-size:13.5px; color:#4b5563; line-height:1.4; }
          .ll-as-item b { flex:none; font-family:'Poppins',sans-serif; font-size:13.5px; font-weight:800; color:var(--price-green-ink); white-space:nowrap; }
          .ll-as-more { font-family:'Poppins',sans-serif; font-size:12px; font-weight:700;
            letter-spacing:.4px; text-transform:uppercase; color:var(--logo-blue); }
        `}</style>
        <div className="ll-as-grid">
          {SERVICE_CATEGORIES.map((cat, i) => (
            <Link key={cat.id} href="/additional-services" className="ll-as-card hol-reveal" style={{ animationDelay: `${i * 55}ms` }}>
              <h3 className="ll-as-title">{cat.title}</h3>
              <ul className="ll-as-list">
                {cat.services.slice(0, 3).map(s => (
                  <li key={s.id} className="ll-as-item">
                    <span>{s.name}</span>
                    <b>{s.price}</b>
                  </li>
                ))}
              </ul>
              <span className="ll-as-more">View all &rarr;</span>
            </Link>
          ))}
        </div>
        <div style={{ textAlign: 'center' }}>
          <Link href="/additional-services" style={{
            ...CTA_STYLE, background: '#0f1f3d', color: '#fff',
            transition: 'background 0.2s',
          }}
            onMouseEnter={e => (e.currentTarget.style.background = '#162849')}
            onMouseLeave={e => (e.currentTarget.style.background = '#0f1f3d')}
          >
            Browse All Additional Services
          </Link>
        </div>
      </section>


      {/* ── S4 · LETTING MADE SIMPLE (handoff; replaces the old
          "4 simple steps" section, same intent, richer cards) ── */}
      <LlxLettingSimple />

      {/* ── S3 · INSTANT RENTAL VALUATION WIDGET (handoff) ──── */}
      <LlxValuationWidget />


      {/* ── LANDLORD RESPONSIBILITIES CHECKLIST ─────────────── */}
      <section style={{
        padding: 'clamp(60px, 8vw, 100px) clamp(24px, 7%, 100px)',
        background: '#f7f8fa',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 52, maxWidth: 640, marginLeft: 'auto', marginRight: 'auto' }}>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: 3,
            textTransform: 'uppercase', color: 'var(--logo-blue)', marginBottom: 14,
            fontFamily: "'Poppins', sans-serif",
          }}>
            Know Your Obligations
          </div>
          <h2 style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: 'clamp(28px,4vw,44px)', fontWeight: 700,
            color: '#0f1f3d', margin: '0 0 16px',
          }}>
            A landlord&rsquo;s legal responsibilities at a glance
          </h2>
          <p style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: 15, color: '#6b7280', lineHeight: 1.7, margin: 0,
          }}>
            Letting a property in England comes with real legal duties. Here is what every
            landlord needs in place. On our managed packages, we arrange, track and renew all of it for you.
          </p>
        </div>
        <style>{`
          .ll-resp-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 18px;
            max-width: 1160px;
            margin: 0 auto;
          }
          @media (max-width: 1040px) { .ll-resp-grid { grid-template-columns: repeat(2, 1fr); } }
          @media (max-width: 560px)  { .ll-resp-grid { grid-template-columns: 1fr; gap: 14px; } }

          .ll-resp-card {
            position: relative;
            background: linear-gradient(180deg, #ffffff 0%, #fbfdff 100%);
            border-radius: 18px;
            padding: 24px 22px 20px;
            display: flex;
            flex-direction: column;
            isolation: isolate;
            transition: transform .3s ease, box-shadow .3s ease;
          }
          /* Flowing gradient border on every card (masked ring) */
          .ll-resp-card::before {
            content: '';
            position: absolute;
            inset: 0;
            border-radius: 18px;
            padding: 1.5px;
            background: linear-gradient(120deg, #dbeafe, #2563eb, #60a5fa, #1e40af, #dbeafe);
            background-size: 300% 300%;
            -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
            -webkit-mask-composite: xor;
                    mask-composite: exclude;
            animation: ll-border-flow 9s ease-in-out infinite;
            opacity: .55;
            transition: opacity .3s ease, filter .3s ease;
            z-index: -1;
            pointer-events: none;
          }
          .ll-resp-card:hover {
            transform: translateY(-6px);
            box-shadow: 0 26px 46px -26px rgba(37,99,235,.42);
          }
          .ll-resp-card:hover::before {
            opacity: 1;
            filter: brightness(1.12) saturate(1.25);
            animation-duration: 3.5s;
          }
          @keyframes ll-border-flow {
            0%   { background-position: 0% 50%; }
            50%  { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          @media (prefers-reduced-motion: reduce) {
            .ll-resp-card::before { animation: none; opacity: .7; }
            .ll-resp-card { transition: none; }
          }

          .ll-resp-top {
            display: flex; align-items: center; justify-content: space-between;
            gap: 10px; margin-bottom: 16px;
          }
          .ll-resp-ic {
            width: 46px; height: 46px; border-radius: 13px; flex: none;
            background: linear-gradient(135deg, #2563eb 0%, #4f83f1 100%);
            color: #fff;
            display: inline-flex; align-items: center; justify-content: center;
            box-shadow: 0 10px 20px -8px rgba(37,99,235,.6);
          }
          .ll-resp-tag {
            font-family: 'Poppins', sans-serif;
            font-size: 10px; font-weight: 700; letter-spacing: .09em;
            text-transform: uppercase; border-radius: 999px; padding: 4px 10px;
            white-space: nowrap;
          }
          .ll-resp-h { font-family:'Poppins',sans-serif; font-size:16px; font-weight:700; color:#0f1f3d; margin:0 0 8px; line-height:1.3; }
          .ll-resp-p { font-family:'Poppins',sans-serif; font-size:13px; color:#4b5563; line-height:1.65; margin:0 0 16px; }
          .ll-resp-foot {
            margin-top: auto; display: flex; align-items: center; gap: 6px;
            padding-top: 14px; border-top: 1px solid #eef2f7;
            font-family: 'Poppins', sans-serif; font-size: 11.5px; font-weight: 600; color: #059669;
          }
        `}</style>
        <div className="ll-resp-grid">
          {[
            {
              tag: 'Safety', tc: '#b45309', tb: '#fef3c7', h: 'Gas safety',
              p: 'An annual Gas Safety Certificate (CP12) from a Gas Safe registered engineer if the property has any gas appliances.',
              icon: (<path d="M12 2c1.5 3 4.5 4.5 4.5 8.5a4.5 4.5 0 1 1-9 0c0-1.7.7-3 1.7-4.2.1 1.2.9 2.1 2 2.4C10.8 6.6 11 4.2 12 2z" />),
            },
            {
              tag: 'Safety', tc: '#b45309', tb: '#fef3c7', h: 'Electrical safety',
              p: 'A satisfactory Electrical Installation Condition Report (EICR), renewed at least every 5 years, with any faults put right.',
              icon: (<path d="M13 2 5 13h6l-1 9 9-13h-6l0-7z" />),
            },
            {
              tag: 'Certificate', tc: '#047857', tb: '#d1fae5', h: 'Energy performance',
              p: 'A valid EPC rated E or above, provided to tenants before they move in. Minimum standards are set to tighten in the coming years.',
              icon: (<><path d="M7 3h7l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" /><path d="M14 3v4h4M9 13h6M9 17h4" /></>),
            },
            {
              tag: 'Safety', tc: '#b45309', tb: '#fef3c7', h: 'Smoke and CO alarms',
              p: 'A working smoke alarm on every floor and a carbon monoxide alarm in any room with a fuel burning appliance, tested at the start of a tenancy.',
              icon: (<><path d="M18 9a6 6 0 1 0-12 0c0 4-1.5 5.5-2 6h16c-.5-.5-2-2-2-6z" /><path d="M10 20a2 2 0 0 0 4 0" /></>),
            },
            {
              tag: 'Legal', tc: '#2563eb', tb: '#eff6ff', h: 'Deposit protection',
              p: 'Any deposit placed in a government approved scheme within 30 days, with the prescribed information served on the tenant.',
              icon: (<><path d="M12 3 5 6v5c0 4.4 3 7.6 7 9 4-1.4 7-4.6 7-9V6l-7-3z" /><path d="m9 12 2 2 4-4" /></>),
            },
            {
              tag: 'Legal', tc: '#2563eb', tb: '#eff6ff', h: 'Right to Rent',
              p: 'Every adult occupier checked for the right to rent in England before the tenancy begins, with records kept.',
              icon: (<><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="8.5" cy="11" r="2" /><path d="M6 16c.4-1.2 1.4-2 2.5-2s2.1.8 2.5 2M14 10h4M14 13.5h4" /></>),
            },
            {
              tag: 'Legal', tc: '#2563eb', tb: '#eff6ff', h: 'How to Rent guide',
              p: 'The latest government How to Rent guide issued to tenants, so a valid notice can be served later if ever needed.',
              icon: (<><path d="M5 4a1 1 0 0 1 1-1h11v15H6a2 2 0 0 0-2 2V5z" /><path d="M4 20a2 2 0 0 1 2-2h11M9 7h5" /></>),
            },
            {
              tag: 'Council', tc: '#6d28d9', tb: '#ede9fe', h: 'Licensing',
              p: 'HMO and selective licensing checked for the property and postcode. Many parts of Leeds and Manchester now require a licence.',
              icon: (<><circle cx="12" cy="9" r="5" /><path d="m9 13-1.5 8L12 19l4.5 2L15 13" /></>),
            },
          ].map((c, i) => (
            <article key={c.h} className="ll-resp-card hol-reveal" style={{ animationDelay: `${i * 55}ms` }}>
              <div className="ll-resp-top">
                <span className="ll-resp-ic" aria-hidden>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    {c.icon}
                  </svg>
                </span>
                <span className="ll-resp-tag" style={{ color: c.tc, background: c.tb }}>{c.tag}</span>
              </div>
              <h3 className="ll-resp-h">{c.h}</h3>
              <p className="ll-resp-p">{c.p}</p>
              <div className="ll-resp-foot">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Handled on managed plans
              </div>
            </article>
          ))}
        </div>
        <div style={{
          maxWidth: 1100, margin: '28px auto 0',
          background: '#fff', border: '1px solid #e5e7eb', borderLeft: '3px solid #2563eb',
          borderRadius: 12, padding: '18px 22px',
        }}>
          <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: 13.5, color: '#475569', lineHeight: 1.7, margin: 0 }}>
            <strong style={{ color: '#0f1f3d' }}>Heads up:</strong> the Renters&rsquo; Rights reforms are changing how tenancies work,
            including the move away from Section 21 no fault evictions and new rules on how homes are let and managed.
            We keep every landlord we work with updated as the law changes, so your properties stay compliant.
          </p>
        </div>
      </section>


      {/* ── RENT GUARANTEE CAROUSEL ─────────────────────────── */}
      <section style={{
        padding: 'clamp(60px, 8vw, 100px) clamp(16px, 5%, 80px)',
        background: 'linear-gradient(180deg, #f8fbff 0%, #eaf1fb 100%)',
      }}>
        <style>{`
          .rgi { max-width: 1180px; margin: 0 auto; }
          .rgi-track { display: flex; gap: 20px; overflow-x: auto; scroll-snap-type: x mandatory;
            padding: 6px 4px 22px; scrollbar-width: none; -webkit-overflow-scrolling: touch; }
          .rgi-track::-webkit-scrollbar { display: none; }
          .rgi-slide { flex: 0 0 auto; width: clamp(280px, 80vw, 392px); margin: 0; scroll-snap-align: start;
            border-radius: 20px; overflow: hidden; background: #fff; border: 1px solid #d7e3f4;
            box-shadow: 0 22px 46px -30px rgba(15,31,61,.45); }
          .rgi-slide img { display: block; width: 100%; height: auto; }
          .rgi-controls { display: flex; align-items: center; justify-content: center; gap: 18px; }
          .rgi-arrow { width: 44px; height: 44px; border-radius: 50%; border: 1.5px solid #cdd6ea;
            background: #fff; color: var(--logo-blue); display: inline-flex; align-items: center; justify-content: center;
            cursor: pointer; transition: all .2s ease; box-shadow: 0 6px 16px -8px rgba(15,31,61,.3); flex: none; }
          .rgi-arrow:hover { background: #2563eb; color: #fff; border-color: #2563eb; }
          .rgi-dots { display: flex; align-items: center; gap: 8px; }
          .rgi-dot { width: 8px; height: 8px; border-radius: 50%; background: #c2d3ea; border: none; padding: 0;
            cursor: pointer; transition: all .25s ease; }
          .rgi-dot.active { background: #2563eb; width: 24px; border-radius: 999px; }
          .rgi-cta { display: flex; gap: 14px; flex-wrap: wrap; justify-content: center; margin-top: 34px; }
          .rgi-btn { display: inline-flex; align-items: center; justify-content: center; gap: 9px;
            box-sizing: border-box; min-height: 48px; line-height: 1.2; padding: 14px 28px;
            border: 1.5px solid transparent; border-radius: 9px;
            font-family: 'Poppins', sans-serif; font-size: 13.5px; font-weight: 700;
            letter-spacing: .02em; text-transform: uppercase; text-decoration: none; transition: all .2s ease; }
          .rgi-btn.primary { background: #2563eb; color: #fff; border-color: #2563eb; }
          .rgi-btn.primary:hover { background: #1d4ed8; border-color: #1d4ed8; }
          .rgi-btn.ghost { background: #fff; color: #0f1f3d; border-color: #cdd6ea; }
          .rgi-btn.ghost:hover { border-color: #2563eb; color: var(--logo-blue); }
          @media (max-width: 600px) { .rgi-btn { width: 100%; } }
        `}</style>
        <div className="rgi">
          <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 40px', padding: '0 8px' }}>
            <div style={{
              fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase',
              color: 'var(--logo-blue)', marginBottom: 14, fontFamily: "'Poppins', sans-serif",
            }}>
              Protect Your Income
            </div>
            <h2 style={{
              fontFamily: "'Poppins', sans-serif", fontSize: 'clamp(28px,4vw,44px)',
              fontWeight: 700, color: '#0f1f3d', margin: '0 0 16px',
            }}>
              Rent guarantee insurance
            </h2>
            <p style={{
              fontFamily: "'Poppins', sans-serif", fontSize: 15, color: '#6b7280', lineHeight: 1.7, margin: 0,
            }}>
              If a tenant stops paying, rent guarantee cover can protect your income and help with legal
              costs. Swipe through the essentials, then talk to us about adding it through Comprehensive Management.
            </p>
          </div>

          <div className="rgi-track" ref={rgiRef} onScroll={rgiOnScroll}>
            {RGI_SLIDES.map((s) => (
              <figure key={s.src} className="rgi-slide">
                <img src={s.src} alt={s.alt} width={1000} height={1000} loading="lazy" decoding="async" />
              </figure>
            ))}
          </div>

          <div className="rgi-controls">
            <button type="button" className="rgi-arrow" aria-label="Previous slide" onClick={() => rgiGo(rgiSlide - 1)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
            <div className="rgi-dots" role="tablist" aria-label="Choose a slide">
              {RGI_SLIDES.map((s, i) => (
                <button
                  key={s.src}
                  type="button"
                  role="tab"
                  aria-label={`Go to slide ${i + 1}`}
                  aria-selected={rgiSlide === i}
                  className={`rgi-dot${rgiSlide === i ? ' active' : ''}`}
                  onClick={() => rgiGo(i)}
                />
              ))}
            </div>
            <button type="button" className="rgi-arrow" aria-label="Next slide" onClick={() => rgiGo(rgiSlide + 1)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
            </button>
          </div>

          <div className="rgi-cta">
            <Link href="/pricing/comprehensive-management" className="rgi-btn primary">Explore Comprehensive Management</Link>
            <Link href="/book-valuation" className="rgi-btn ghost">Book a Free Valuation</Link>
          </div>
        </div>
      </section>


      {/* ── FAQ ─────────────────────────────────────────────── */}
      <section style={{
        padding: 'clamp(60px, 8vw, 100px) clamp(24px, 7%, 100px)',
        background: '#fff',
      }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{
            textAlign: 'center', fontSize: 11, fontWeight: 700, letterSpacing: 3,
            textTransform: 'uppercase', color: 'var(--logo-blue)', marginBottom: 14,
            fontFamily: "'Poppins', sans-serif",
          }}>
            Common Questions
          </div>
          <h2 style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: 'clamp(28px,4vw,44px)', fontWeight: 700,
            color: '#0f1f3d', textAlign: 'center', marginBottom: 48,
          }}>
            What landlords should know
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {landlordFaqs.map((faq, i) => (
              <div key={i} style={{ borderTop: '1px solid rgba(15,31,61,0.12)', borderBottom: i === landlordFaqs.length - 1 ? '1px solid rgba(15,31,61,0.12)' : 'none' }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{
                    width: '100%', background: 'none', border: 'none', color: '#0f1f3d',
                    textAlign: 'left', padding: '22px 0', display: 'flex',
                    justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer',
                    fontFamily: "'Poppins', sans-serif", fontSize: 16, fontWeight: 700, gap: 16,
                  }}
                >
                  {faq.q}
                  <span style={{
                    color: 'var(--logo-blue)', fontSize: 22, flexShrink: 0, lineHeight: 1,
                    transform: openFaq === i ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s',
                  }}>+</span>
                </button>
                {openFaq === i && (
                  <p style={{
                    fontFamily: "'Poppins', sans-serif",
                    color: '#4b5563', fontSize: 14, lineHeight: 1.8, paddingBottom: 24, margin: 0,
                  }}>{faq.a}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ── S6 · READY TO GROW, closing CTA band (handoff;
          replaces the old thin CTA banner) ─────────────────── */}
      <LlxReadyToGrow />


      {/* ── FOOTER ──────────────────────────────────────────── */}
      <Footer />

    </>
  );
}
