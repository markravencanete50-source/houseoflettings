'use client';
// app/tenants/TenantsClient.tsx - Tenants page (redesign frames 1e desktop / 1g mobile).
// Clean, single-accent (#2563eb) system on navy, matching HomeClient's design language.
// Copy is unchanged from the previous page; presentation upgraded per the design handoff.
// SEO/metadata + FAQ JSON-LD live in page.tsx.
import { useState } from 'react';
import Link from 'next/link';
import { Shield, Clock, Users, MapPin, Wrench, Check } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import MobileFAB from '@/components/layout/MobileFAB';
import { TENANT_FAQS } from './faqs';

const STEPS = [
  {
    num: '01',
    title: 'Send an enquiry',
    body: "Tell us what you're looking for, property type, area, move in date. No long forms.",
  },
  {
    num: '02',
    title: 'Answer a few quick questions',
    body: 'We ask a handful of straightforward questions to match you with the right property.',
  },
  {
    num: '03',
    title: 'Book your viewing',
    body: 'We arrange the viewing fast. See the property in person before committing to anything.',
  },
  {
    num: '04',
    title: 'Secure it with a holding deposit',
    body: "To take the property off the market, pay a holding deposit, deducted from your first month's rent.",
  },
  {
    num: '05',
    title: 'Submit your application',
    body: 'Our team guides you through the full application process, referencing, ID checks, and everything in between.',
  },
  {
    num: '06',
    title: 'Credit and right to rent check',
    body: 'We run a credit check and verify your right to rent in the UK as part of your referencing.',
  },
  {
    num: '07',
    title: 'Payment',
    body: "Once you're approved, you'll settle your first month's rent and any agreed fees ahead of moving in.",
  },
  {
    num: '08',
    title: 'Move in',
    body: 'Referencing done, paperwork signed, keys in hand. Welcome home.',
  },
];

const WHY_CARDS = [
  {
    icon: Shield,
    title: 'No agency fees',
    body: 'Renting through us costs you nothing extra. The holding deposit is the only upfront payment, and it comes off your first rent.',
  },
  {
    icon: Clock,
    title: 'Fast, simple process',
    body: 'Send an enquiry, answer a few questions, book your viewing. No lengthy forms, no waiting weeks to hear back.',
  },
  {
    icon: Users,
    title: 'Direct landlord contact',
    body: 'We work closely with our landlords, no middlemen, no miscommunication. Questions get answered quickly.',
  },
  {
    icon: MapPin,
    title: 'Leeds & Manchester',
    body: "City centre flats, suburban houses, and everything in between, across two of the UK's most in demand rental markets.",
  },
];

const FEE_ROWS = [
  { label: 'Agency fees', sub: 'Always free for tenants', value: '£0', accent: true },
  { label: 'Holding deposit', sub: "Deducted from first month's rent", value: 'Varies', accent: false },
  { label: 'Application forms', sub: 'Just a quick conversation', value: 'None', accent: false },
  { label: 'Viewing fee', sub: 'No charge to view a property', value: '£0', accent: true },
];

export default function TenantsClient() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="tn">
      <Navbar />
      <MobileFAB />

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="tn-hero">
        <div className="tn-hero__bg" aria-hidden />
        <div className="tn-hero__overlay" aria-hidden />
        <div className="tn-hero__inner">
          <div className="tn-hero__kicker">For Tenants · Leeds &amp; Manchester</div>
          <h1 className="tn-hero__title">
            Looking for your next home?<br />
            <span>We hold the key.</span>
          </h1>
          <p className="tn-hero__sub">
            No agency fees. No endless forms. Send an enquiry, answer a few quick questions,
            and we&apos;ll get you in for a viewing.
          </p>
          <div className="tn-hero__chips">
            {['£0 agency fees', '£0 viewing fee', 'No long forms'].map((c) => (
              <span key={c} className="tn-chip">
                <Check size={13} strokeWidth={2.5} aria-hidden />{c}
              </span>
            ))}
          </div>
          <div className="tn-hero__btns">
            <Link href="/book-viewing" className="tn-btn tn-btn--primary tn-btn--wide">Book a Viewing</Link>
            <Link href="/listings" className="tn-btn tn-btn--ghost tn-btn--wide">Browse Properties</Link>
          </div>
        </div>
      </section>

      {/* ── EIGHT STEPS ──────────────────────────────────────── */}
      <section className="tn-sec tn-sec--alt">
        <div className="tn-wrap">
          <div className="tn-head">
            <div className="tn-eyebrow">How It Works</div>
            <h2 className="tn-h2">From enquiry to keys, eight steps</h2>
          </div>

          {/* Desktop / tablet: 4x2 card grid (step 08 highlighted) */}
          <div className="tn-steps-grid">
            {STEPS.map((s, i) => (
              <div key={s.num} className={`tn-step-card${i === STEPS.length - 1 ? ' tn-step-card--hot' : ''}`}>
                <span className="tn-step-card__num">{s.num}</span>
                <span className="tn-step-card__title">{s.title}</span>
                <span className="tn-step-card__body">{s.body}</span>
              </div>
            ))}
          </div>

          {/* Mobile: vertical numbered timeline */}
          <ol className="tn-timeline">
            {STEPS.map((s, i) => (
              <li key={s.num} className="tn-timeline__item">
                <div className="tn-timeline__rail">
                  <span className="tn-timeline__dot">{s.num}</span>
                  {i < STEPS.length - 1 && <span className="tn-timeline__line" aria-hidden />}
                </div>
                <div className="tn-timeline__copy">
                  <span className="tn-timeline__title">{s.title}</span>
                  <span className="tn-timeline__body">{s.body}</span>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── WHAT MAKES US DIFFERENT ──────────────────────────── */}
      <section className="tn-sec">
        <div className="tn-wrap">
          <div className="tn-head">
            <div className="tn-eyebrow">Why Rent With Us</div>
            <h2 className="tn-h2">What makes us different</h2>
          </div>
          <div className="tn-why-grid">
            {WHY_CARDS.map(({ icon: Icon, title, body }) => (
              <div key={title} className="tn-why-card">
                <span className="tn-why-card__chip"><Icon size={22} strokeWidth={1.8} aria-hidden /></span>
                <span className="tn-why-card__title">{title}</span>
                <span className="tn-why-card__body">{body}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOLDING DEPOSIT (navy split) ─────────────────────── */}
      <section className="tn-deposit">
        <div className="tn-deposit__orb" aria-hidden />
        <div className="tn-deposit__inner">
          <div className="tn-deposit__copy">
            <div className="tn-eyebrow tn-eyebrow--dark">The Only Upfront Cost</div>
            <h2 className="tn-deposit__title">The holding deposit, explained</h2>
            <p className="tn-deposit__p">
              When you&apos;ve seen the property and want to move forward, a holding deposit takes it
              off the market while your application is processed.
            </p>
            <p className="tn-deposit__p">
              That deposit is <strong>deducted from your first month&apos;s rent</strong>, so you&apos;re not
              paying it on top of anything. It&apos;s just paying your rent a little early.
            </p>
            <div className="tn-maint">
              <div className="tn-maint__head">
                <span className="tn-maint__title">Already renting with us? Something broken?</span>
                <span className="tn-maint__sub">
                  If you have a maintenance issue or fault in your property, report it here with a few
                  photos and we&apos;ll get it sorted.
                </span>
              </div>
              <Link href="/maintenance/report" className="tn-maint__btn">
                <Wrench size={14} strokeWidth={2} aria-hidden />Report a maintenance issue
              </Link>
            </div>
          </div>

          <div className="tn-fees">
            {FEE_ROWS.map((row, i) => (
              <div key={row.label} className={`tn-fees__row${i === FEE_ROWS.length - 1 ? ' tn-fees__row--last' : ''}`}>
                <div className="tn-fees__meta">
                  <span className="tn-fees__label">{row.label}</span>
                  <span className="tn-fees__sub">{row.sub}</span>
                </div>
                <span className={`tn-fees__value${row.accent ? ' tn-fees__value--green' : ''}`}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────── */}
      <section className="tn-sec tn-sec--alt">
        <div className="tn-faq-wrap">
          <div className="tn-head tn-head--left">
            <div className="tn-eyebrow">Common Questions</div>
            <h2 className="tn-h2">Tenant FAQs</h2>
          </div>
          <div className="tn-faq">
            {TENANT_FAQS.map((faq, i) => (
              <div key={faq.q} className="tn-faq__item">
                <button
                  type="button"
                  className="tn-faq__q"
                  aria-expanded={openFaq === i}
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  {faq.q}
                  <span className={`tn-faq__plus${openFaq === i ? ' tn-faq__plus--open' : ''}`} aria-hidden>+</span>
                </button>
                {openFaq === i && <p className="tn-faq__a">{faq.a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BAND ─────────────────────────────────────────── */}
      <section className="tn-cta">
        <div className="tn-cta__orb" aria-hidden />
        <div className="tn-cta__inner">
          <h2 className="tn-cta__title">Ready to find your next home?</h2>
          <p className="tn-cta__sub">
            Send us an enquiry and we&apos;ll take it from there. No forms, no fees, no hassle.
          </p>
          <Link href="/book-viewing" className="tn-btn tn-btn--primary tn-btn--wide">Send an Enquiry</Link>
        </div>
      </section>

      <Footer />

      <style>{`
        .tn { font-family: 'Poppins', sans-serif; }

        /* Buttons */
        .tn-btn {
          display: inline-block; text-align: center; text-decoration: none;
          border-radius: 8px; font-size: 15px; font-weight: 700;
          letter-spacing: 0.5px; text-transform: uppercase; cursor: pointer;
          transition: background 0.2s, box-shadow 0.2s, border-color 0.2s;
        }
        .tn-btn--wide { width: 260px; padding: 18px 0; }
        .tn-btn--primary { background: #2563eb; color: #fff; }
        .tn-btn--primary:hover { background: #1d4ed8; box-shadow: 0 10px 30px rgba(37,99,235,0.5); }
        .tn-btn--ghost { background: transparent; color: #fff; border: 1.5px solid rgba(255,255,255,0.4); padding: 16.5px 0; }
        .tn-btn--ghost:hover { border-color: #fff; }

        /* Sections */
        .tn-sec { background: #fff; padding: 104px 64px; }
        .tn-sec--alt { background: #f8fafc; }
        .tn-wrap { max-width: 1180px; margin: 0 auto; }
        .tn-head { display: flex; flex-direction: column; align-items: flex-start; gap: 14px; margin-bottom: 48px; }
        .tn-eyebrow { font-size: 12px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: #2563eb; }
        .tn-eyebrow--dark { color: #4a90d9; }
        .tn-h2 { margin: 0; font-size: 42px; font-weight: 700; color: #0f1f3d; letter-spacing: -0.5px; }

        /* Hero */
        .tn-hero { position: relative; overflow: hidden; background: #0f1f3d; }
        .tn-hero__bg { position: absolute; inset: 0; background-image: url('/images/Tenants_Book_viewing_background.webp'); background-size: cover; background-position: center; }
        .tn-hero__overlay { position: absolute; inset: 0; background: linear-gradient(160deg, rgba(2,11,26,0.85) 0%, rgba(4,18,48,0.78) 60%, rgba(6,26,66,0.7) 100%); }
        .tn-hero__inner { position: relative; max-width: 880px; margin: 0 auto; padding: 108px 64px 96px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 26px; }
        .tn-hero__kicker { font-size: 12px; font-weight: 700; letter-spacing: 4px; text-transform: uppercase; color: #4a90d9; }
        .tn-hero__title { margin: 0; font-size: 68px; font-weight: 800; color: #fff; line-height: 1.05; letter-spacing: -1px; text-transform: uppercase; }
        .tn-hero__title span { color: #4a90d9; }
        .tn-hero__sub { margin: 0; font-size: 18px; font-weight: 300; color: rgba(255,255,255,0.75); line-height: 1.7; max-width: 560px; }
        .tn-hero__chips { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; }
        .tn-chip { display: inline-flex; align-items: center; gap: 7px; font-size: 12.5px; font-weight: 600; color: #dbe8fb; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.14); border-radius: 999px; padding: 8px 16px; }
        .tn-chip svg { color: #4a90d9; }
        .tn-hero__btns { display: flex; gap: 14px; margin-top: 12px; flex-wrap: wrap; justify-content: center; }

        /* Eight steps - card grid */
        .tn-steps-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
        .tn-step-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 28px 24px; display: flex; flex-direction: column; gap: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); transition: transform 0.3s, box-shadow 0.3s, border-color 0.3s; }
        .tn-step-card:hover { transform: translateY(-4px); box-shadow: 0 12px 30px rgba(0,0,0,0.08); }
        .tn-step-card--hot { border-color: #2563eb; box-shadow: 0 8px 24px rgba(37,99,235,0.14); }
        .tn-step-card__num { font-size: 11px; font-weight: 700; color: #2563eb; letter-spacing: 1.5px; text-transform: uppercase; }
        .tn-step-card__title { font-size: 16px; font-weight: 700; color: #0f1f3d; }
        .tn-step-card__body { font-size: 13.5px; color: #4b5563; line-height: 1.65; }

        /* Eight steps - mobile timeline */
        .tn-timeline { display: none; list-style: none; margin: 0; padding: 0; }
        .tn-timeline__item { display: flex; gap: 16px; align-items: flex-start; }
        .tn-timeline__rail { display: flex; flex-direction: column; align-items: center; flex-shrink: 0; align-self: stretch; }
        .tn-timeline__dot { width: 34px; height: 34px; border-radius: 50%; background: linear-gradient(135deg, #2563eb, #4a90d9); display: inline-flex; align-items: center; justify-content: center; color: #fff; font-weight: 800; font-size: 11px; }
        .tn-timeline__line { width: 2px; flex: 1; min-height: 16px; background: #e2e8f0; margin: 6px 0; }
        .tn-timeline__copy { display: flex; flex-direction: column; gap: 3px; padding: 6px 0 22px; }
        .tn-timeline__title { font-size: 15px; font-weight: 700; color: #0f1f3d; }
        .tn-timeline__body { font-size: 12.5px; color: #4b5563; line-height: 1.6; }

        /* What makes us different */
        .tn-why-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
        .tn-why-card { background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 8px; padding: 32px 26px; display: flex; flex-direction: column; gap: 14px; transition: transform 0.3s, box-shadow 0.3s, border-color 0.3s; }
        .tn-why-card:hover { transform: translateY(-4px); border-color: #2563eb; box-shadow: 0 18px 40px rgba(0,0,0,0.08); }
        .tn-why-card__chip { width: 46px; height: 46px; border-radius: 8px; background: #eff6ff; display: inline-flex; align-items: center; justify-content: center; color: #2563eb; }
        .tn-why-card__title { font-size: 17px; font-weight: 700; color: #0f1f3d; }
        .tn-why-card__body { font-size: 13.5px; color: #4b5563; line-height: 1.7; }

        /* Holding deposit */
        .tn-deposit { position: relative; overflow: hidden; background: linear-gradient(165deg, #0c1a33 0%, #15294c 55%, #0f1f3d 100%); padding: 104px 64px; }
        .tn-deposit__orb { position: absolute; top: -160px; right: -100px; width: 620px; height: 480px; border-radius: 50%; background: radial-gradient(ellipse, rgba(37,99,235,0.18) 0%, transparent 65%); pointer-events: none; }
        .tn-deposit__inner { position: relative; max-width: 1100px; margin: 0 auto; display: grid; grid-template-columns: 1.1fr 1fr; gap: 64px; align-items: center; }
        .tn-deposit__copy { display: flex; flex-direction: column; align-items: flex-start; gap: 18px; }
        .tn-deposit__title { margin: 0; font-size: 40px; font-weight: 700; color: #fff; line-height: 1.2; letter-spacing: -0.5px; }
        .tn-deposit__p { margin: 0; font-size: 15px; color: rgba(255,255,255,0.68); line-height: 1.8; }
        .tn-deposit__p strong { color: #fff; font-weight: 600; }
        .tn-maint { margin-top: 10px; border: 1px solid rgba(37,99,235,0.4); border-radius: 8px; padding: 22px 26px; background: rgba(37,99,235,0.08); display: flex; flex-direction: column; gap: 12px; align-items: flex-start; }
        .tn-maint__head { display: flex; flex-direction: column; gap: 4px; }
        .tn-maint__title { font-size: 16px; font-weight: 700; color: #fff; }
        .tn-maint__sub { font-size: 13.5px; color: rgba(255,255,255,0.6); line-height: 1.65; }
        .tn-maint__btn { display: inline-flex; align-items: center; gap: 8px; background: #2563eb; color: #fff; font-size: 13px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; padding: 13px 24px; border-radius: 8px; text-decoration: none; transition: background 0.2s; }
        .tn-maint__btn:hover { background: #1d4ed8; }
        .tn-maint__btn svg { color: #fff; }
        .tn-fees { background: rgba(10,24,56,0.85); border: 1px solid rgba(255,255,255,0.14); border-radius: 8px; padding: 20px 32px; box-shadow: 0 30px 60px -30px rgba(0,0,0,0.7); }
        .tn-fees__row { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; padding: 18px 0; border-bottom: 1px solid rgba(255,255,255,0.08); }
        .tn-fees__row--last { border-bottom: none; }
        .tn-fees__meta { display: flex; flex-direction: column; gap: 3px; }
        .tn-fees__label { font-size: 15px; font-weight: 600; color: #d1d5db; }
        .tn-fees__sub { font-size: 12px; color: rgba(209,213,219,0.55); }
        .tn-fees__value { font-size: 16px; font-weight: 700; color: #d1d5db; flex-shrink: 0; }
        .tn-fees__value--green { font-size: 20px; font-weight: 800; color: #4ade80; }

        /* FAQ */
        .tn-faq-wrap { max-width: 820px; margin: 0 auto; }
        .tn-head--left { margin-bottom: 40px; }
        .tn-faq { display: flex; flex-direction: column; }
        .tn-faq__item { border-top: 1px solid #e2e8f0; }
        .tn-faq__item:last-child { border-bottom: 1px solid #e2e8f0; }
        .tn-faq__q { width: 100%; background: none; border: none; cursor: pointer; text-align: left; font-family: 'Poppins', sans-serif; padding: 22px 0; display: flex; justify-content: space-between; align-items: center; gap: 16px; font-size: 16px; font-weight: 600; color: #0f1f3d; }
        .tn-faq__plus { color: #2563eb; font-size: 22px; line-height: 1; flex-shrink: 0; transition: transform 0.2s; }
        .tn-faq__plus--open { transform: rotate(45deg); }
        .tn-faq__a { margin: 0; padding: 0 0 22px; font-size: 14.5px; color: #475569; line-height: 1.75; }

        /* CTA band */
        .tn-cta { position: relative; overflow: hidden; background: linear-gradient(165deg, #0c1a33 0%, #15294c 55%, #0f1f3d 100%); padding: 96px 64px; text-align: center; }
        .tn-cta__orb { position: absolute; top: -160px; left: -100px; width: 600px; height: 480px; border-radius: 50%; background: radial-gradient(ellipse, rgba(37,99,235,0.2) 0%, transparent 65%); pointer-events: none; }
        .tn-cta__inner { position: relative; max-width: 620px; margin: 0 auto; display: flex; flex-direction: column; align-items: center; gap: 22px; }
        .tn-cta__title { margin: 0; font-size: 46px; font-weight: 800; color: #fff; letter-spacing: -0.5px; line-height: 1.15; text-transform: uppercase; }
        .tn-cta__sub { margin: 0; font-size: 16px; font-weight: 300; color: rgba(255,255,255,0.72); line-height: 1.7; }

        /* ── Tablet ── */
        @media (max-width: 960px) {
          .tn-sec { padding: 72px 32px; }
          .tn-steps-grid { grid-template-columns: repeat(2, 1fr); }
          .tn-why-grid { grid-template-columns: repeat(2, 1fr); }
          .tn-deposit { padding: 72px 32px; }
          .tn-deposit__inner { grid-template-columns: 1fr; gap: 32px; }
        }

        /* ── Mobile ── */
        @media (max-width: 640px) {
          .tn-sec { padding: 56px 24px; }
          .tn-hero__overlay { background: linear-gradient(160deg, rgba(2,11,26,0.88) 0%, rgba(4,18,48,0.8) 60%, rgba(6,26,66,0.72) 100%); }
          .tn-hero__inner { padding: 56px 24px 52px; gap: 20px; }
          .tn-hero__kicker { font-size: 10px; letter-spacing: 2.6px; }
          .tn-hero__title { font-size: 36px; line-height: 1.08; letter-spacing: -0.8px; }
          .tn-hero__sub { font-size: 14.5px; }
          .tn-hero__btns { flex-direction: column; width: 100%; }
          .tn-btn--wide { width: 100%; padding: 17px 0; }
          .tn-h2 { font-size: 26px; }
          .tn-head { margin-bottom: 24px; }
          .tn-steps-grid { display: none; }
          .tn-timeline { display: flex; flex-direction: column; }
          .tn-why-grid { grid-template-columns: 1fr; }
          .tn-deposit { padding: 56px 24px; }
          .tn-deposit__title { font-size: 26px; }
          .tn-cta { padding: 64px 24px; }
          .tn-cta__title { font-size: 28px; }
        }
      `}</style>
    </div>
  );
}
