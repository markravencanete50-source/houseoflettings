'use client';
// app/landlords/page.tsx
import { useState, useRef } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ServiceHero from '@/components/layout/ServiceHero';
import RevealCards from '@/components/RevealCards';
import { BUNDLES } from '@/lib/bundles';
import { SERVICE_CATEGORIES } from '@/lib/additionalServices';

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

export default function LandlordsPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activePkg, setActivePkg] = useState(3); // default: Full Management (Most Popular)
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
          { value: <>From&nbsp;<em>6%</em></>, label: 'Management fees' },
          { value: <em>£0</em>, label: 'Hidden fees' },
          { value: <em>2</em>, label: 'Cities covered' },
          { value: <em>Free</em>, label: 'Rental valuation' },
        ]}
      />





      



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
          .ll-price-row { display:flex; align-items:center; justify-content:space-between; gap:14px;
            padding:14px 12px; border-radius:10px; border-top:1px solid rgba(255,255,255,0.07); }
          .ll-price-row:first-child { border-top:0; }
          .ll-price-row.ll-hot { background:rgba(37,99,235,0.16); border-top-color:transparent; }
          .ll-price-nm { display:flex; align-items:center; gap:8px; font-family:'Poppins',sans-serif;
            font-size:14.5px; font-weight:700; color:#fff; }
          .ll-price-nm em { font-style:normal; font-size:9px; font-weight:800; letter-spacing:.08em;
            text-transform:uppercase; background:#2563eb; color:#fff; border-radius:999px; padding:2px 8px; }
          .ll-price-kd { display:block; font-family:'Poppins',sans-serif; font-size:11.5px; color:#8fa6c9; margin-top:3px; }
          .ll-price-fig { text-align:right; flex:none; }
          .ll-price-fig b { display:block; font-family:'Poppins',sans-serif; font-size:18px; font-weight:800; color:#fff; }
          .ll-price-fig span { font-family:'Poppins',sans-serif; font-size:11px; color:#a9c4ea; }
          .ll-price-cta { display:inline-block; margin-top:20px; font-family:'Poppins',sans-serif;
            font-size:13px; font-weight:700; color:#4a90d9; text-decoration:none; }
          .ll-price-cta:hover { color:#fff; }
        `}</style>
        <div className="ll-intro-grid">
          <div>
            <div style={{
              fontSize: 11, fontWeight: 700, letterSpacing: 3,
              textTransform: 'uppercase', color: '#2563eb', marginBottom: 16,
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
          </div>
          {/* Pricing snapshot (title + price only) in place of the old flyer image */}
          <div className="ll-price-panel">
            <span className="ll-price-eyebrow">Our Packages</span>
            <h3 className="ll-price-title">Pricing at a glance</h3>
            <span className="ll-price-sub">Inclusive of VAT. No hidden fees, ever.</span>
            <ul className="ll-price-list">
              {BUNDLES.map(b => (
                <li key={b.id} className={`ll-price-row${b.badge ? ' ll-hot' : ''}`}>
                  <div>
                    <span className="ll-price-nm">{b.short}{b.badge && <em>Popular</em>}</span>
                    <span className="ll-price-kd">{b.kind}</span>
                  </div>
                  {/* The ongoing percentage leads: it is our main management fee. */}
                  <div className="ll-price-fig">
                    <b>{b.mgmtFee || b.setupFee}</b>
                    <span>{b.mgmtFee ? `of rent + ${b.setupFee} one time fee` : 'one time fee'}</span>
                  </div>
                </li>
              ))}
            </ul>
            <Link href="/pricing" className="ll-price-cta">See what&apos;s included in each &rarr;</Link>
          </div>
        </div>
      </section>


      {/* ── OUR SERVICES ────────────────────────────────────── */}
      <section style={{
        padding: 'clamp(60px, 8vw, 100px) clamp(24px, 7%, 100px)',
        background: 'linear-gradient(180deg, #0b1730 0%, #0f1f3d 55%, #0c1a33 100%)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background:
            'radial-gradient(ellipse at 82% 8%, rgba(37,99,235,0.20) 0%, transparent 55%),' +
            'radial-gradient(ellipse at 12% 92%, rgba(74,144,217,0.12) 0%, transparent 50%)',
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{
              fontSize: 11, fontWeight: 700, letterSpacing: 3,
              textTransform: 'uppercase', color: '#4a90d9', marginBottom: 14,
              fontFamily: "'Poppins', sans-serif",
            }}>
              Our Packages
            </div>
            <h2 style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: 'clamp(28px,4vw,48px)', fontWeight: 700,
              color: '#fff', margin: '0 0 16px',
            }}>
              Services Built Around You
            </h2>
            <p style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: 15, color: 'rgba(255,255,255,0.5)',
              maxWidth: 560, margin: '0 auto', lineHeight: 1.7, fontWeight: 300,
            }}>
              Not sure which fits? Pick a package below to see exactly what it does for you,
              from simply finding a tenant to fully protecting your rental income.
            </p>
          </div>

          <style>{`
            /* Interactive package explainer: a tab selector drives a single
               detail panel. A deliberately different structure from both the
               old card grid and the /pricing alternating layout. */
            .ll-svc { max-width: 1060px; margin: 0 auto 44px; }
            .ll-svc-tabs { display: flex; gap: 10px; justify-content: center; flex-wrap: nowrap;
              overflow-x: auto; padding: 4px 4px 14px; margin-bottom: 26px; scrollbar-width: none; }
            .ll-svc-tabs::-webkit-scrollbar { display: none; }
            .ll-svc-tab { position: relative; flex: 0 0 auto; cursor: pointer;
              display: flex; flex-direction: column; align-items: center; gap: 3px;
              padding: 12px 20px; border-radius: 12px; white-space: nowrap;
              background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.12);
              color: #cdddf5; font-family: 'Poppins', sans-serif; transition: all .2s ease; }
            .ll-svc-tab:hover { background: rgba(255,255,255,.09); border-color: rgba(74,144,217,.5); }
            .ll-svc-tab.active { background: linear-gradient(135deg,#2563eb,#1d4ed8);
              border-color: #2563eb; color: #fff; box-shadow: 0 12px 26px -12px rgba(37,99,235,.7); }
            .ll-svc-tab-name { font-size: 14px; font-weight: 700; }
            .ll-svc-tab-fee { font-size: 11px; font-weight: 600; opacity: .68; }
            .ll-svc-tab.active .ll-svc-tab-fee { opacity: .9; }
            .ll-svc-tab-dot { position: absolute; top: 8px; right: 10px; width: 6px; height: 6px;
              border-radius: 50%; background: #f59e0b; }
            .ll-svc-tab.active .ll-svc-tab-dot { background: #fff; }

            .ll-svc-panel { display: grid; grid-template-columns: 1.15fr 1fr; border-radius: 20px;
              overflow: hidden; border: 1px solid rgba(255,255,255,.1);
              background: linear-gradient(160deg, rgba(22,41,76,.92) 0%, rgba(12,26,51,.92) 100%);
              box-shadow: 0 30px 64px -34px rgba(0,0,0,.75); animation: ll-svc-fade .4s ease; }
            .ll-svc-panel.featured { border-color: rgba(37,99,235,.5); box-shadow: 0 30px 64px -30px rgba(37,99,235,.5); }
            @keyframes ll-svc-fade { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
            @media (max-width: 820px) { .ll-svc-panel { grid-template-columns: 1fr; } }

            .ll-svc-info { padding: clamp(28px,3.4vw,44px); }
            .ll-svc-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
            .ll-svc-kind, .ll-svc-you, .ll-svc-pop { font-family: 'Poppins', sans-serif; font-size: 10.5px;
              font-weight: 700; letter-spacing: .08em; text-transform: uppercase; border-radius: 999px; padding: 5px 11px; }
            .ll-svc-kind { color: #a9c4ea; background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.14); }
            .ll-svc-you { color: #cbdcf6; background: rgba(37,99,235,.16); border: 1px solid rgba(74,144,217,.3); }
            .ll-svc-pop { color: #fff; background: #2563eb; }
            .ll-svc-name { font-family: 'Poppins', sans-serif; font-size: clamp(24px,2.6vw,32px); font-weight: 800;
              color: #fff; line-height: 1.15; margin: 0 0 10px; }
            .ll-svc-best { font-family: 'Poppins', sans-serif; font-size: 14px; font-weight: 600; color: #7db4f0;
              margin: 0 0 16px; line-height: 1.5; }
            .ll-svc-blurb { font-family: 'Poppins', sans-serif; font-size: 14.5px; color: rgba(255,255,255,.72);
              line-height: 1.8; margin: 0 0 24px; }
            .ll-svc-price { display: flex; align-items: center; gap: 20px; margin-bottom: 26px; }
            .ll-svc-price > div { display: flex; flex-direction: column; }
            .ll-svc-price b { font-family: 'Poppins', sans-serif; font-size: 30px; font-weight: 800; color: #fff; line-height: 1; }
            .ll-svc-price b.accent { color: #4a90d9; }
            .ll-svc-price span { font-family: 'Poppins', sans-serif; font-size: 11px; font-weight: 600; letter-spacing: .04em;
              text-transform: uppercase; color: rgba(255,255,255,.5); margin-top: 6px; }
            .ll-svc-price-sep { width: 1px; height: 42px; background: rgba(255,255,255,.14); }
            .ll-svc-cta { display: flex; gap: 12px; flex-wrap: wrap; }
            .ll-svc-btn { display: inline-flex; align-items: center; justify-content: center; gap: 9px;
              box-sizing: border-box; min-height: 48px; line-height: 1.2;
              font-family: 'Poppins', sans-serif; font-size: 13.5px; font-weight: 700; letter-spacing: .02em;
              text-transform: uppercase; text-decoration: none; padding: 14px 28px;
              border: 1.5px solid transparent; border-radius: 9px; transition: all .2s ease; }
            .ll-svc-btn.primary { background: #2563eb; color: #fff; border-color: #2563eb; }
            .ll-svc-btn.primary:hover { background: #1d4ed8; border-color: #1d4ed8; transform: translateY(-2px); }
            .ll-svc-btn.ghost { background: transparent; color: #cddffb; border-color: rgba(255,255,255,.28); }
            .ll-svc-btn.ghost:hover { border-color: #fff; color: #fff; }
            .ll-svc-btn.ghost svg { transition: transform .2s ease; }
            .ll-svc-btn.ghost:hover svg { transform: translateX(3px); }

            .ll-svc-included { padding: clamp(28px,3.4vw,44px); background: rgba(0,0,0,.18);
              border-left: 1px solid rgba(255,255,255,.08); display: flex; flex-direction: column; }
            @media (max-width: 820px) { .ll-svc-included { border-left: 0; border-top: 1px solid rgba(255,255,255,.08); } }
            .ll-svc-inc-label { font-family: 'Poppins', sans-serif; font-size: 11px; font-weight: 700; letter-spacing: .12em;
              text-transform: uppercase; color: #8fa6c9; margin-bottom: 18px; }
            .ll-svc-inc-list { list-style: none; margin: 0 0 22px; padding: 0; display: flex; flex-direction: column; gap: 14px; }
            .ll-svc-inc-list li { display: flex; gap: 12px; align-items: flex-start; font-family: 'Poppins', sans-serif;
              font-size: 14px; color: #e7eefb; line-height: 1.45; }
            .ll-svc-inc-tick { flex: none; width: 22px; height: 22px; border-radius: 50%; background: rgba(74,222,128,.16);
              color: #4ade80; display: inline-flex; align-items: center; justify-content: center; margin-top: 1px; }
            .ll-svc-inc-tick svg { width: 12px; height: 12px; }
            .ll-svc-inc-more { margin-top: auto; display: inline-flex; align-items: center; gap: 7px; font-family: 'Poppins', sans-serif;
              font-size: 12.5px; font-weight: 700; color: #4a90d9; text-decoration: none; }
            .ll-svc-inc-more:hover { color: #7db4f0; }
            .ll-svc-inc-more svg { transition: transform .2s ease; }
            .ll-svc-inc-more:hover svg { transform: translateX(3px); }
            @media (prefers-reduced-motion: reduce) { .ll-svc-panel { animation: none; } }
          `}</style>

          <div className="ll-svc">
            <div className="ll-svc-tabs" role="tablist" aria-label="Choose a package">
              {BUNDLES.map((b, i) => (
                <button
                  key={b.id}
                  type="button"
                  role="tab"
                  aria-selected={activePkg === i}
                  className={`ll-svc-tab${activePkg === i ? ' active' : ''}`}
                  onClick={() => setActivePkg(i)}
                >
                  {b.badge && <span className="ll-svc-tab-dot" aria-hidden />}
                  <span className="ll-svc-tab-name">{b.short}</span>
                  <span className="ll-svc-tab-fee">{b.mgmtFee ? `${b.mgmtFee} + ${b.setupFee}` : b.setupFee}</span>
                </button>
              ))}
            </div>

            {(() => {
              const b = BUNDLES[activePkg];
              const isMgmt = b.kind === 'Management';
              return (
                <div className={`ll-svc-panel${b.badge ? ' featured' : ''}`}>
                  <div className="ll-svc-info">
                    <div className="ll-svc-chips">
                      <span className="ll-svc-kind">{b.kind}</span>
                      <span className="ll-svc-you">{b.youWe}</span>
                      {b.badge && <span className="ll-svc-pop">Most Popular</span>}
                    </div>
                    <h3 className="ll-svc-name">{b.label}</h3>
                    <p className="ll-svc-best">Best for {b.bestForLead} {b.bestForRest}.</p>
                    <p className="ll-svc-blurb">{b.blurb}</p>
                    {/* The ongoing percentage leads: it is our main management fee.
                        Tenant-find packages have no percentage, so the one-time
                        fee leads there instead. */}
                    <div className="ll-svc-price">
                      {isMgmt ? (
                        <>
                          <div>
                            <b className="accent">{b.mgmtFee}</b>
                            <span>of rent / month</span>
                          </div>
                          <div className="ll-svc-price-sep" aria-hidden />
                          <div>
                            <b>{b.setupFee}</b>
                            <span>one time fee</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <b>{b.setupFee}</b>
                            <span>one time fee</span>
                          </div>
                          <div className="ll-svc-price-sep" aria-hidden />
                          <div>
                            <b>£0</b>
                            <span>ongoing fee</span>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="ll-svc-cta">
                      <Link href="/book-valuation" className="ll-svc-btn primary">Book a Free Valuation</Link>
                      <Link href={`/pricing/${b.id}`} className="ll-svc-btn ghost">
                        See full details
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                          <path d="M5 12h14M13 6l6 6-6 6" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                  <div className="ll-svc-included">
                    <div className="ll-svc-inc-label">What&apos;s included</div>
                    <ul className="ll-svc-inc-list">
                      {PKG_HL[activePkg].map((h) => (
                        <li key={h}>
                          <span className="ll-svc-inc-tick" aria-hidden>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </span>
                          {h}
                        </li>
                      ))}
                    </ul>
                    <Link href={`/pricing/${b.id}`} className="ll-svc-inc-more">
                      See every service included
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M5 12h14M13 6l6 6-6 6" />
                      </svg>
                    </Link>
                  </div>
                </div>
              );
            })()}
          </div>
          <p style={{
            fontFamily: "'Poppins', sans-serif", textAlign: 'center',
            fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7,
            maxWidth: 640, margin: '0 auto 28px',
          }}>
            All prices inclusive of VAT. Every management tier includes a full tenant find, and
            management runs on a rolling monthly basis, so you can upgrade or cancel any time.
          </p>
          <div style={{ textAlign: 'center' }}>
            <Link href="/pricing" style={{
              ...CTA_STYLE, background: '#2563eb', color: '#fff',
              transition: 'background 0.2s',
            }}
              onMouseEnter={e => (e.currentTarget.style.background = '#1d4ed8')}
              onMouseLeave={e => (e.currentTarget.style.background = '#2563eb')}
            >
              Compare All Packages
            </Link>
          </div>
        </div>
      </section>


      {/* ── ADDITIONAL SERVICES ─────────────────────────────── */}
      <section style={{
        padding: 'clamp(60px, 8vw, 100px) clamp(24px, 7%, 100px)',
        background: '#f7f8fa',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 52, maxWidth: 620, marginLeft: 'auto', marginRight: 'auto' }}>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: 3,
            textTransform: 'uppercase', color: '#2563eb', marginBottom: 14,
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
          .ll-as-item b { flex:none; font-family:'Poppins',sans-serif; font-size:13.5px; font-weight:800; color:#2563eb; white-space:nowrap; }
          .ll-as-more { font-family:'Poppins',sans-serif; font-size:12px; font-weight:700;
            letter-spacing:.4px; text-transform:uppercase; color:#2563eb; }
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


      {/* ── HOW IT WORKS ────────────────────────────────────── */}
      <section style={{
        padding: 'clamp(60px, 8vw, 100px) clamp(24px, 7%, 100px)',
        background: '#fff',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: 3,
            textTransform: 'uppercase', color: '#2563eb', marginBottom: 14,
            fontFamily: "'Poppins', sans-serif",
          }}>
            Getting Started
          </div>
          <h2 style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: 'clamp(28px,4vw,48px)', fontWeight: 700,
            color: '#0f1f3d', margin: 0,
          }}>
            Let your property in 4 simple steps
          </h2>
        </div>
        <style>{`
          .ll-steps-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 32px;
            max-width: 1100px;
            margin: 0 auto;
          }
          @media (max-width: 900px) { .ll-steps-grid { grid-template-columns: 1fr 1fr; } }
          @media (max-width: 500px) { .ll-steps-grid { grid-template-columns: 1fr; } }
        `}</style>
        <div className="ll-steps-grid">
          {[
            { n: '01', title: 'Book a Valuation', desc: 'Our local expert visits your property and gives you an honest, data backed rental valuation, completely free.' },
            { n: '02', title: 'Choose Your Package', desc: 'Pick from Virtual Tenant Find, Expert Tenant Find, or one of our management packages. No pressure, no hard sell.' },
            { n: '03', title: 'We Find Your Tenant', desc: 'We advertise, screen applicants, conduct viewings, and handle all referencing so only the best tenants make it through.' },
            { n: '04', title: 'Sit Back & Collect', desc: 'Once your tenant is in, we handle everything from rent collection to maintenance calls. You just enjoy the returns.' },
          ].map((step, i) => (
            <div key={step.n} className="hol-reveal" style={{ textAlign: 'center', animationDelay: `${i * 55}ms` }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: '#eff6ff', border: '2px solid #2563eb',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px',
                fontFamily: "'Poppins', sans-serif",
                fontSize: 18, fontWeight: 800, color: '#2563eb',
              }}>{step.n}</div>
              <h3 style={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: 16, fontWeight: 700, color: '#0f1f3d',
                marginBottom: 10,
              }}>{step.title}</h3>
              <p style={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: 14, color: '#6b7280', lineHeight: 1.7,
              }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>


      {/* ── LANDLORD RESPONSIBILITIES CHECKLIST ─────────────── */}
      <section style={{
        padding: 'clamp(60px, 8vw, 100px) clamp(24px, 7%, 100px)',
        background: '#f7f8fa',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 52, maxWidth: 640, marginLeft: 'auto', marginRight: 'auto' }}>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: 3,
            textTransform: 'uppercase', color: '#2563eb', marginBottom: 14,
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
            background: #fff; color: #2563eb; display: inline-flex; align-items: center; justify-content: center;
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
          .rgi-btn.ghost:hover { border-color: #2563eb; color: #2563eb; }
          @media (max-width: 600px) { .rgi-btn { width: 100%; } }
        `}</style>
        <div className="rgi">
          <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 40px', padding: '0 8px' }}>
            <div style={{
              fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase',
              color: '#2563eb', marginBottom: 14, fontFamily: "'Poppins', sans-serif",
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
            textTransform: 'uppercase', color: '#2563eb', marginBottom: 14,
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
                    color: '#2563eb', fontSize: 22, flexShrink: 0, lineHeight: 1,
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


      {/* ── CTA BANNER ──────────────────────────────────────── */}
      <section style={{
        background: '#0f1f3d',
        padding: 'clamp(56px, 8vw, 80px) clamp(24px, 7%, 100px)',
        position: 'relative', overflow: 'hidden',
        textAlign: 'center',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at 50% 50%, rgba(37,99,235,0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: 'clamp(28px,4vw,52px)', fontWeight: 700,
            color: '#fff', marginBottom: 16,
          }}>
            Ready to maximise your <span style={{ color: '#fff' }}>rental returns?</span>
          </h2>
          <p style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: 16, color: 'rgba(255,255,255,0.55)',
            maxWidth: 520, margin: '0 auto 40px', lineHeight: 1.7, fontWeight: 300,
          }}>
            Book a free valuation today and find out exactly what your property could be earning.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/book-valuation"
              style={{
                ...CTA_STYLE, background: '#2563eb', color: '#fff',
                cursor: 'pointer', transition: 'background 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#1d4ed8')}
              onMouseLeave={e => (e.currentTarget.style.background = '#2563eb')}
            >
              Book a Free Valuation
            </Link>
          </div>
        </div>
      </section>


      {/* ── FOOTER ──────────────────────────────────────────── */}
      <Footer />

    </>
  );
}
