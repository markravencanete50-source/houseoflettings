'use client';
// app/HomeClient.tsx — Homepage (redesign frames 1c desktop / 1d mobile).
// Clean, single-accent (#2563eb) system on navy. Copy unchanged from the site;
// presentation upgraded per the design handoff. SEO/metadata live in page.tsx.
import Link from 'next/link';
import { Home, KeyRound, ShieldCheck, Check, ArrowRight } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import MobileFAB from '@/components/layout/MobileFAB';
import GoogleReviews from '@/components/GoogleReviews';

const HELP_CARDS = [
  {
    icon: Home,
    title: 'For Landlords',
    body: 'Transparent pricing and flexible packages, from tenant find to fully managed, with advertising, enquiry handling, and professional tenancy setup included.',
    href: '/landlords',
  },
  {
    icon: KeyRound,
    title: 'For Tenants',
    body: 'Finding your next home made straightforward, safe, and comfortable, with no agency fees, no pressure, and no unnecessary office visits.',
    href: '/tenants',
  },
  {
    icon: ShieldCheck,
    title: 'Property Management',
    body: 'Accurate valuations, professional photography, comprehensive tenant screening, and full compliance: your property in the best hands at every stage.',
    href: '/property-management',
  },
];

const LANDLORD_PANEL_ITEMS = [
  'Accurate lettings valuation',
  'Local agent who knows your area',
  'Accurate, data-driven figures',
  'Clear next steps, zero pressure',
];
const LANDLORD_POINTS = [
  'Free, no-obligation appraisal',
  'Backed by live local market data',
  'Honest advice to maximise your return',
];
const TENANT_PANEL_ITEMS = [
  'Priority access before the open market',
  'One dedicated point of contact',
  'Viewings arranged around you',
  'A clear, no-pressure process',
];
const TENANT_POINTS = [
  'Early access to new listings',
  'A dedicated agent on your side',
  'No hidden fees for tenants',
];

export default function HomeClient() {
  return (
    <div className="hp">
      <Navbar />
      <MobileFAB />

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="hp-hero">
        <div className="hp-hero__bg" aria-hidden />
        <div className="hp-hero__overlay" aria-hidden />
        <div className="hp-hero__inner">
          <div className="hp-hero__kicker">Lettings &amp; Property Management · Leeds &amp; Manchester</div>
          <h1 className="hp-hero__title">
            We handle the details.<br />
            <span>You enjoy the returns.</span>
          </h1>
          <p className="hp-hero__sub">
            Property management done right, by Leeds &amp; Manchester specialists who keep your returns fully protected.
          </p>
          <div className="hp-hero__btns">
            <Link href="/book-valuation" className="hp-btn hp-btn--primary hp-btn--wide">Book a Valuation</Link>
            <Link href="/listings" className="hp-btn hp-btn--ghost hp-btn--wide">Book a Viewing</Link>
          </div>
          <Link href="/instant-valuation" className="hp-hero__link">
            Try the instant online valuation <ArrowRight size={14} strokeWidth={2} aria-hidden />
          </Link>
          <div className="hp-hero__trust">
            {['No hidden fees', "Renters' Rights Act compliant", 'Local expert teams'].map((t) => (
              <span key={t} className="hp-hero__trust-item">
                <Check size={13} strokeWidth={2.5} aria-hidden />{t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW WE CAN HELP ──────────────────────────────────── */}
      <section className="hp-sec hp-sec--alt">
        <div className="hp-wrap">
          <div className="hp-head">
            <div className="hp-eyebrow">Our Services</div>
            <h2 className="hp-h2">How we can help</h2>
          </div>
          <div className="hp-cards">
            {HELP_CARDS.map(({ icon: Icon, title, body, href }) => (
              <Link key={title} href={href} className="hp-card">
                <span className="hp-card__chip"><Icon size={24} strokeWidth={1.8} aria-hidden /></span>
                <h3 className="hp-card__title">{title}</h3>
                <p className="hp-card__body">{body}</p>
                <span className="hp-card__more">Learn more <ArrowRight size={13} strokeWidth={2} aria-hidden /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── LANDLORD SERVICE ROW ─────────────────────────────── */}
      <section className="hp-sec">
        <div className="hp-row">
          <div className="hp-row__copy">
            <div className="hp-eyebrow">For Landlords</div>
            <h2 className="hp-row__title">Ready to let your property?</h2>
            <p className="hp-row__lead">Book a free lettings valuation with your local agent.</p>
            <p className="hp-row__body">
              We use local knowledge and live market data to give you the most accurate lettings figure,
              so you can plan your next move with total confidence.
            </p>
            <ul className="hp-points">
              {LANDLORD_POINTS.map((p) => (
                <li key={p}><span className="hp-points__tick"><Check size={11} strokeWidth={3} aria-hidden /></span>{p}</li>
              ))}
            </ul>
            <Link href="/book-valuation" className="hp-btn hp-btn--primary">Book a Valuation</Link>
          </div>
          <div className="hp-panel">
            <span className="hp-panel__orb" aria-hidden />
            <div className="hp-panel__top">
              <span className="hp-panel__kind">Free Valuation</span>
              <span className="hp-panel__badge">No Obligation</span>
            </div>
            <div className="hp-panel__price"><span className="hp-panel__fee">Free</span><span className="hp-panel__per">in person or virtual</span></div>
            <div className="hp-panel__note">Booked around you, by your local agent</div>
            <div className="hp-panel__div" />
            <div className="hp-panel__label">What&apos;s included</div>
            <ul className="hp-panel__list">
              {LANDLORD_PANEL_ITEMS.map((h) => (
                <li key={h}><span className="hp-panel__tick hp-panel__tick--green"><Check size={11} strokeWidth={3} aria-hidden /></span>{h}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── TENANT SERVICE ROW (reversed) ────────────────────── */}
      <section className="hp-sec hp-sec--alt">
        <div className="hp-row hp-row--rev">
          <div className="hp-panel hp-panel--hot">
            <span className="hp-panel__orb hp-panel__orb--hot" aria-hidden />
            <div className="hp-panel__top">
              <span className="hp-panel__kind hp-panel__kind--light">For Tenants</span>
              <span className="hp-panel__badge">Always Free</span>
            </div>
            <div className="hp-panel__price"><span className="hp-panel__fee">£0</span><span className="hp-panel__per hp-panel__per--light">tenant fees</span></div>
            <div className="hp-panel__note hp-panel__note--light">Matched before homes go public</div>
            <div className="hp-panel__div hp-panel__div--light" />
            <div className="hp-panel__label hp-panel__label--light">What you get</div>
            <ul className="hp-panel__list">
              {TENANT_PANEL_ITEMS.map((h) => (
                <li key={h}><span className="hp-panel__tick hp-panel__tick--white"><Check size={11} strokeWidth={3} aria-hidden /></span>{h}</li>
              ))}
            </ul>
          </div>
          <div className="hp-row__copy">
            <div className="hp-eyebrow">For Tenants</div>
            <h2 className="hp-row__title">Looking to rent a property?</h2>
            <p className="hp-row__lead">Register your requirements and we&apos;ll match you to the right homes.</p>
            <p className="hp-row__body">
              We take the pressure off your search and connect you with suitable properties before they hit
              the open market, guiding you every step of the way.
            </p>
            <ul className="hp-points">
              {TENANT_POINTS.map((p) => (
                <li key={p}><span className="hp-points__tick"><Check size={11} strokeWidth={3} aria-hidden /></span>{p}</li>
              ))}
            </ul>
            <Link href="/listings" className="hp-btn hp-btn--dark">Book a Viewing</Link>
          </div>
        </div>
      </section>

      {/* ── REVIEWS (social proof) ───────────────────────────── */}
      <GoogleReviews />

      {/* ── CTA BAND ─────────────────────────────────────────── */}
      <section className="hp-cta">
        <div className="hp-cta__orb" aria-hidden />
        <div className="hp-cta__inner">
          <h2 className="hp-cta__title">Ready to get started?</h2>
          <p className="hp-cta__sub">
            Whether you&apos;re letting a property or looking for your next home, our local team is one message away.
          </p>
          <div className="hp-hero__btns">
            <Link href="/book-valuation" className="hp-btn hp-btn--primary hp-btn--wide">Book a Valuation</Link>
            <Link href="/listings" className="hp-btn hp-btn--ghost hp-btn--wide">Browse Properties</Link>
          </div>
        </div>
      </section>

      <Footer />

      <style>{`
        .hp { font-family: 'Poppins', sans-serif; }

        /* Buttons */
        .hp-btn {
          display: inline-block; text-align: center; text-decoration: none;
          border-radius: 8px; font-size: 15px; font-weight: 700;
          letter-spacing: 0.5px; text-transform: uppercase; cursor: pointer;
          transition: background 0.2s, box-shadow 0.2s, border-color 0.2s;
        }
        .hp-btn--wide { width: 240px; padding: 18px 0; }
        .hp-btn--primary { background: #2563eb; color: #fff; padding: 16px 36px; }
        .hp-btn--primary:hover { background: #1d4ed8; box-shadow: 0 10px 30px rgba(37,99,235,0.5); }
        .hp-btn--dark { background: #0f1f3d; color: #fff; padding: 16px 36px; }
        .hp-btn--dark:hover { background: #162849; }
        .hp-btn--ghost {
          background: transparent; color: #fff;
          border: 1.5px solid rgba(255,255,255,0.45); padding: 16.5px 0;
        }
        .hp-btn--ghost:hover { border-color: #fff; }

        /* Sections */
        .hp-sec { background: #fff; padding: 104px 64px; }
        .hp-sec--alt { background: #f8fafc; }
        .hp-wrap { max-width: 1180px; margin: 0 auto; }
        .hp-head { display: flex; flex-direction: column; align-items: center; gap: 14px; text-align: center; margin-bottom: 52px; }
        .hp-eyebrow { font-size: 12px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: #2563eb; }
        .hp-h2 { margin: 0; font-size: 42px; font-weight: 700; color: #0f1f3d; letter-spacing: -0.5px; }

        /* Hero */
        .hp-hero { position: relative; overflow: hidden; min-height: 660px; display: flex; align-items: center; justify-content: center; background: #0f1f3d; }
        .hp-hero__bg { position: absolute; inset: 0; background-image: url('/images/heropage.webp'); background-size: cover; background-position: center top; }
        .hp-hero__overlay { position: absolute; inset: 0; background: linear-gradient(135deg, rgba(9,19,46,0.88) 0%, rgba(9,19,46,0.62) 55%, rgba(9,19,46,0.35) 100%); }
        .hp-hero__inner { position: relative; max-width: 840px; padding: 120px 64px 100px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 26px; }
        .hp-hero__kicker { font-size: 12px; font-weight: 700; letter-spacing: 4px; text-transform: uppercase; color: #7aa5f0; }
        .hp-hero__title { margin: 0; font-size: 72px; font-weight: 800; color: #fff; line-height: 1.05; letter-spacing: -1px; text-transform: uppercase; }
        .hp-hero__title span { color: #4a90d9; }
        .hp-hero__sub { margin: 0; font-size: 18px; font-weight: 300; color: rgba(255,255,255,0.78); line-height: 1.7; max-width: 560px; }
        .hp-hero__btns { display: flex; gap: 14px; margin-top: 8px; flex-wrap: wrap; justify-content: center; }
        .hp-hero__link { display: inline-flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; color: #dbe8fb; text-decoration: none; }
        .hp-hero__link svg { color: #4a90d9; }
        .hp-hero__link:hover { color: #fff; }
        .hp-hero__trust { display: flex; gap: 28px; margin-top: 10px; flex-wrap: wrap; justify-content: center; }
        .hp-hero__trust-item { display: inline-flex; align-items: center; gap: 7px; font-size: 12.5px; font-weight: 600; color: rgba(255,255,255,0.75); }
        .hp-hero__trust-item svg { color: #4a90d9; }

        /* Help cards */
        .hp-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 28px; }
        .hp-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 40px 32px; display: flex; flex-direction: column; gap: 16px; box-shadow: 0 4px 32px rgba(0,0,0,0.06); transition: transform 0.3s, box-shadow 0.3s, border-color 0.3s; text-decoration: none; }
        .hp-card:hover { transform: translateY(-6px); border-color: #2563eb; box-shadow: 0 20px 50px rgba(0,0,0,0.12); }
        .hp-card__chip { width: 52px; height: 52px; border-radius: 8px; background: #eff6ff; display: inline-flex; align-items: center; justify-content: center; color: #2563eb; }
        .hp-card__title { margin: 0; font-size: 20px; font-weight: 700; color: #0f1f3d; }
        .hp-card__body { margin: 0; font-size: 14px; color: #616161; line-height: 1.75; }
        .hp-card__more { margin-top: auto; display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; color: #2563eb; }

        /* Service rows */
        .hp-row { max-width: 1160px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 68px; align-items: center; }
        .hp-row__copy { display: flex; flex-direction: column; align-items: flex-start; gap: 16px; }
        .hp-row__title { margin: 0; font-size: 40px; font-weight: 700; color: #0f1f3d; line-height: 1.18; letter-spacing: -0.5px; }
        .hp-row__lead { margin: 0; font-size: 17px; font-weight: 600; color: #0f1f3d; line-height: 1.55; }
        .hp-row__body { margin: 0; font-size: 15px; color: #5b6472; line-height: 1.85; max-width: 460px; }
        .hp-points { list-style: none; margin: 6px 0 10px; padding: 0; display: flex; flex-direction: column; gap: 12px; }
        .hp-points li { display: inline-flex; align-items: center; gap: 11px; font-size: 14.5px; color: #374151; }
        .hp-points__tick { width: 20px; height: 20px; border-radius: 50%; background: #eff6ff; display: inline-flex; align-items: center; justify-content: center; color: #2563eb; flex-shrink: 0; }

        /* Spec panel */
        .hp-panel { position: relative; overflow: hidden; border-radius: 8px; padding: 40px; background: linear-gradient(155deg, #15294c 0%, #0c1a33 100%); border: 1px solid rgba(255,255,255,0.06); box-shadow: 0 30px 60px -30px rgba(9,18,40,0.7); color: #fff; display: flex; flex-direction: column; }
        .hp-panel--hot { background: linear-gradient(155deg, #2563eb 0%, #122a5c 55%, #0c1a33 100%); border-color: rgba(120,170,255,0.35); box-shadow: 0 34px 66px -28px rgba(37,99,235,0.55); }
        .hp-panel__orb { position: absolute; top: -70px; right: -50px; width: 230px; height: 230px; border-radius: 50%; background: radial-gradient(circle, rgba(74,144,217,0.4) 0%, transparent 70%); pointer-events: none; }
        .hp-panel__orb--hot { background: radial-gradient(circle, rgba(147,197,255,0.5) 0%, transparent 70%); }
        .hp-panel__top { position: relative; display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 18px; }
        .hp-panel__kind { font-size: 11px; font-weight: 700; letter-spacing: 1.7px; text-transform: uppercase; color: #a9c4ea; }
        .hp-panel__kind--light { color: #cfe0f8; }
        .hp-panel__badge { font-size: 9.5px; font-weight: 800; letter-spacing: 0.8px; text-transform: uppercase; color: #0c1a33; background: #fff; border-radius: 999px; padding: 4px 11px; }
        .hp-panel__price { position: relative; display: flex; align-items: baseline; gap: 10px; }
        .hp-panel__fee { font-size: 46px; font-weight: 800; letter-spacing: -1px; line-height: 1; }
        .hp-panel__per { font-size: 12.5px; font-weight: 500; color: #a9c4ea; }
        .hp-panel__per--light { color: #cfe0f8; }
        .hp-panel__note { position: relative; font-size: 13px; font-weight: 600; color: #8fa6c9; margin-top: 9px; }
        .hp-panel__note--light { color: #b7cdf0; }
        .hp-panel__div { position: relative; height: 1px; background: rgba(255,255,255,0.12); margin: 22px 0 16px; }
        .hp-panel__div--light { background: rgba(255,255,255,0.18); }
        .hp-panel__label { position: relative; font-size: 10.5px; font-weight: 700; letter-spacing: 1.3px; text-transform: uppercase; color: #8fa6c9; margin-bottom: 14px; }
        .hp-panel__label--light { color: #b7cdf0; }
        .hp-panel__list { position: relative; list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 12px; }
        .hp-panel__list li { display: inline-flex; align-items: flex-start; gap: 11px; font-size: 13.8px; line-height: 1.45; color: #e7eefb; }
        .hp-panel__tick { flex-shrink: 0; width: 20px; height: 20px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-top: 1px; }
        .hp-panel__tick--green { background: rgba(74,222,128,0.16); color: #4ade80; }
        .hp-panel__tick--white { background: rgba(255,255,255,0.18); color: #fff; }

        /* CTA band */
        .hp-cta { position: relative; overflow: hidden; background: linear-gradient(165deg, #0c1a33 0%, #15294c 55%, #0f1f3d 100%); padding: 96px 64px; text-align: center; }
        .hp-cta__orb { position: absolute; top: -160px; right: -100px; width: 600px; height: 480px; border-radius: 50%; background: radial-gradient(ellipse, rgba(37,99,235,0.2) 0%, transparent 65%); pointer-events: none; }
        .hp-cta__inner { position: relative; max-width: 680px; margin: 0 auto; display: flex; flex-direction: column; align-items: center; gap: 22px; }
        .hp-cta__title { margin: 0; font-size: 46px; font-weight: 800; color: #fff; letter-spacing: -0.5px; line-height: 1.15; text-transform: uppercase; }
        .hp-cta__sub { margin: 0; font-size: 16px; font-weight: 300; color: rgba(255,255,255,0.72); line-height: 1.7; max-width: 520px; }

        /* ── Tablet ── */
        @media (max-width: 960px) {
          .hp-sec { padding: 72px 32px; }
          .hp-cards { grid-template-columns: 1fr; gap: 18px; max-width: 560px; margin: 0 auto; }
          .hp-card { flex-direction: row; align-items: flex-start; padding: 26px 24px; }
          .hp-card__chip { width: 44px; height: 44px; flex-shrink: 0; }
          .hp-card__more { margin-top: 6px; }
          .hp-row { grid-template-columns: 1fr; gap: 32px; max-width: 560px; }
          .hp-row--rev .hp-panel { order: 2; }
          .hp-row--rev .hp-row__copy { order: 1; }
        }

        /* ── Mobile ── */
        @media (max-width: 640px) {
          .hp-sec { padding: 56px 24px; }
          .hp-hero { min-height: 0; }
          .hp-hero__overlay { background: linear-gradient(160deg, rgba(9,19,46,0.9) 0%, rgba(9,19,46,0.66) 60%, rgba(9,19,46,0.45) 100%); }
          .hp-hero__inner { padding: 60px 24px 56px; gap: 20px; }
          .hp-hero__kicker { font-size: 10px; letter-spacing: 2.6px; }
          .hp-hero__title { font-size: 38px; line-height: 1.08; letter-spacing: -0.8px; }
          .hp-hero__sub { font-size: 14.5px; }
          .hp-hero__btns { flex-direction: column; width: 100%; }
          .hp-btn--wide { width: 100%; padding: 17px 0; }
          .hp-h2 { font-size: 28px; }
          .hp-head { margin-bottom: 22px; }
          .hp-row__title { font-size: 26px; }
          .hp-panel { padding: 28px 24px; }
          .hp-panel__fee { font-size: 38px; }
          .hp-cta { padding: 64px 24px; }
          .hp-cta__title { font-size: 30px; }
        }
      `}</style>
    </div>
  );
}
