'use client';
// app/landlords/LandlordsClient.tsx: Landlords page (redesign frames 1a desktop / 1b mobile).
// Single-accent (#2563eb) system on navy, Poppins, 8px radii. Pricing figures come
// from lib/bundles.ts; additional-service prices from lib/additionalServices.ts.
// SEO/metadata + FAQ structured data live in ./page.tsx (server wrapper).
import { useState } from 'react';
import Link from 'next/link';
import {
  Check, ArrowRight, MapPin, CalendarCheck, Tag, UserCheck, ShieldCheck,
  CreditCard, Flame, Zap, FileText, BellRing, Wallet, BadgeCheck, BookOpen,
  ClipboardCheck, Camera, Scale, Plus,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import MobileFAB from '@/components/layout/MobileFAB';
import { BUNDLES } from '@/lib/bundles';
import { SERVICE_CATEGORIES } from '@/lib/additionalServices';
import { landlordFaqs } from './landlordFaqs';

// Marketing summary + top-4 highlights per package. Prices/names come from BUNDLES.
const PKG_COPY: Record<string, { desc: string; highlights: string[] }> = {
  'virtual-tenant-find': {
    desc: 'Advertise your property, handle enquiries, and secure a tenant, all managed online.',
    highlights: ['Professional listing creation', 'Multi portal advertising', 'Enquiry management', 'Full tenant referencing'],
  },
  'expert-tenant-find': {
    desc: 'The full marketing push: professional photography, accompanied viewings, and in-person tenancy setup.',
    highlights: ['Everything in Virtual', 'Photography and floor plan', 'Accompanied viewings', 'In-person tenant handover'],
  },
  'essential-management': {
    desc: 'We collect rent, chase arrears, and transfer funds, so you never have to chase a tenant.',
    highlights: ['Includes a full tenant find', 'Monthly rent collection', 'Arrears management', 'Monthly statements'],
  },
  'full-management': {
    desc: 'Comprehensive management covering maintenance, inspections, and compliance.',
    highlights: ['Everything in Essential', 'Maintenance coordination', 'Regular inspections', 'Compliance monitoring'],
  },
  'comprehensive-management': {
    desc: 'Our complete hands off package with rent guarantee insurance and dedicated support.',
    highlights: ['Everything in Full Management', 'Rent guarantee cover', 'Legal and eviction protection', 'Priority contractor response'],
  },
};

const WHY_CHECKS = [
  { Icon: CalendarCheck, t: 'Free, no obligation rental valuation', s: 'An honest, data backed view of what your property should earn.' },
  { Icon: Tag, t: 'Transparent pricing, no hidden fees, ever', s: 'Every figure inclusive of VAT, agreed up front.' },
  { Icon: UserCheck, t: 'Rigorous tenant referencing and screening', s: 'Credit, landlord and income checks on every applicant.' },
  { Icon: ShieldCheck, t: 'Full compliance with UK lettings legislation', s: 'Certificates arranged, tracked and renewed for you.' },
  { Icon: CreditCard, t: 'Rent collection and arrears management', s: 'You never have to chase a tenant for payment.' },
  { Icon: MapPin, t: 'A dedicated local agent for your portfolio', s: 'A real person who knows your street, not a call centre.' },
];

const STEPS = [
  { n: '01', t: 'Book a Valuation', p: 'Our local expert visits your property and gives you an honest, data backed rental valuation, completely free.' },
  { n: '02', t: 'Choose Your Package', p: 'Pick from Virtual Tenant Find, Expert Tenant Find, or one of our management packages. No pressure, no hard sell.' },
  { n: '03', t: 'We Find Your Tenant', p: 'We advertise, screen applicants, conduct viewings, and handle all referencing, so only the best tenants make it through.' },
  { n: '04', t: 'Sit Back & Collect', p: 'Once your tenant is in, we handle everything from rent collection to maintenance calls. You just enjoy the returns.' },
];

const LEGAL = [
  { Icon: Flame, t: 'Gas safety', p: 'An annual Gas Safety Certificate (CP12) from a Gas Safe registered engineer if the property has any gas appliances.' },
  { Icon: Zap, t: 'Electrical safety', p: 'A satisfactory Electrical Installation Condition Report (EICR), renewed at least every 5 years, with any faults put right.' },
  { Icon: FileText, t: 'Energy performance', p: 'A valid EPC rated E or above, provided to tenants before they move in. Minimum standards are set to tighten.' },
  { Icon: BellRing, t: 'Smoke & CO alarms', p: 'A working smoke alarm on every floor and a carbon monoxide alarm in any room with a fuel burning appliance.' },
  { Icon: Wallet, t: 'Deposit protection', p: 'Any deposit placed in a government approved scheme within 30 days, with the prescribed information served.' },
  { Icon: BadgeCheck, t: 'Right to Rent', p: 'Every adult occupier checked for the right to rent in England before the tenancy begins, with records kept.' },
  { Icon: BookOpen, t: 'How to Rent guide', p: 'The latest government How to Rent guide issued to tenants, so a valid notice can be served later if ever needed.' },
  { Icon: ShieldCheck, t: 'Licensing', p: 'HMO and selective licensing checked for the property and postcode. Many parts of Leeds and Manchester now require a licence.' },
];

const CAT_ICON: Record<string, typeof ClipboardCheck> = {
  inventory: ClipboardCheck,
  marketing: Camera,
  referencing: UserCheck,
  compliance: ShieldCheck,
  legal: Scale,
};

export default function LandlordsClient() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [city, setCity] = useState<'leeds' | 'manchester'>('leeds');
  const cityLabel = city === 'leeds' ? 'Leeds' : 'Greater Manchester';

  return (
    <div className="ll">
      <Navbar />
      <MobileFAB />

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="ll-hero">
        <span className="ll-orb ll-orb-a" aria-hidden style={{
          top: -180, right: -120, width: 720, height: 560,
          background: 'radial-gradient(ellipse, rgba(37,99,235,0.22) 0%, transparent 65%)',
        }} />
        <span className="ll-orb ll-orb-b" aria-hidden style={{
          bottom: -200, left: -140, width: 640, height: 520,
          background: 'radial-gradient(ellipse, rgba(74,144,217,0.14) 0%, transparent 62%)',
        }} />
        <span className="ll-hero__grid" aria-hidden />
        <div className="ll-hero__inner">
          <div className="ll-hero__kicker">For Landlords &middot; Leeds &amp; Manchester</div>
          <h1 className="ll-hero__title">
            Better management.<br />
            Better tenants.<br />
            <span>Better returns.</span>
          </h1>
          <p className="ll-hero__sub">
            Professional lettings and property management that protects your investment and
            maximises your returns, across Leeds and Manchester.
          </p>
          <div className="ll-hero__chips">
            {['Inclusive of VAT', 'No hidden fees', 'Fully compliant', 'Local expert teams'].map((c) => (
              <span key={c} className="ll-chip"><Check size={13} strokeWidth={2.5} aria-hidden />{c}</span>
            ))}
          </div>
          <div className="ll-hero__btns">
            <Link href="/book-valuation" className="ll-btn ll-btn--primary ll-btn--wide">Book a Free Valuation</Link>
            <Link href="/pricing" className="ll-btn ll-btn--ghost ll-btn--wide">View Our Packages</Link>
          </div>
        </div>
      </section>

      {/* ── WHY CHOOSE US ────────────────────────────────────── */}
      <section className="ll-sec ll-sec--alt">
        <div className="ll-why">
          <div className="ll-why__copy">
            <div className="ll-eyebrow">Why Choose Us</div>
            <h2 className="ll-why__h">Expert letting agents who put your returns first</h2>
            <p className="ll-why__p">
              At House of Lettings, we believe landlords deserve more than just a property manager,
              they deserve a partner. Our local experts in Leeds and Manchester work to maximise your
              rental yield, keep your property compliant, and take the day to day stress completely off your plate.
            </p>
            <p className="ll-why__p">
              No hidden fees, no long tie-ins. Every price you see is inclusive of VAT, and management
              runs on a rolling monthly contract.
            </p>
            <Link href="/book-valuation" className="ll-btn ll-btn--dark">Get a Free Valuation</Link>
            <div className="ll-info-row">
              <div className="ll-info">
                <span className="ll-chip-ic"><MapPin size={20} strokeWidth={1.8} aria-hidden /></span>
                <div><b>Leeds &amp; Manchester</b><span>Full local coverage</span></div>
              </div>
              <div className="ll-info">
                <span className="ll-chip-ic"><CalendarCheck size={20} strokeWidth={1.8} aria-hidden /></span>
                <div><b>Rolling monthly</b><span>Cancel any time</span></div>
              </div>
            </div>
          </div>
          <div className="ll-check-card">
            {WHY_CHECKS.map(({ Icon, t, s }) => (
              <div key={t} className="ll-check-row">
                <span className="ll-check-ic"><Icon size={19} strokeWidth={1.8} aria-hidden /></span>
                <div>
                  <div className="ll-check-tt">{t}</div>
                  <div className="ll-check-sub">{s}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING AT A GLANCE ──────────────────────────────── */}
      <section className="ll-sec ll-sec--light">
        <div className="ll-head">
          <div className="ll-eyebrow">Our Packages</div>
          <h2 className="ll-h2">Pricing at a glance</h2>
          <p className="ll-lead">Inclusive of VAT. No hidden fees, ever.</p>
          <div className="ll-citytoggle" role="group" aria-label="Choose your city">
            <button type="button" className={city === 'leeds' ? 'is-active' : ''} onClick={() => setCity('leeds')} aria-pressed={city === 'leeds'}>Leeds</button>
            <button type="button" className={city === 'manchester' ? 'is-active' : ''} onClick={() => setCity('manchester')} aria-pressed={city === 'manchester'}>Manchester</button>
          </div>
          <p className="ll-lead" style={{ fontSize: 13 }}>Serving landlords across {cityLabel}.</p>
        </div>

        {/* Desktop: 5 price cards */}
        <div className="ll-price-cards">
          {BUNDLES.map((b) => {
            const isMgmt = b.kind === 'Management';
            const hot = !!b.badge;
            return (
              <div key={b.id} className={`ll-pc${hot ? ' ll-pc--hot' : ''}`}>
                {hot && <span className="ll-pc__badge">Most Popular</span>}
                <span className="ll-pc__k">{b.kind}</span>
                <span className="ll-pc__n">{b.label}</span>
                <span className="ll-pc__big">{isMgmt ? b.mgmtFee : b.setupFee}</span>
                <span className="ll-pc__sub">{isMgmt ? `of rent · ${b.setupFee} setup` : 'one-time fee'}</span>
              </div>
            );
          })}
        </div>

        {/* Mobile: compact navy list */}
        <div className="ll-price-mob">
          {BUNDLES.map((b) => {
            const isMgmt = b.kind === 'Management';
            const hot = !!b.badge;
            return (
              <div key={b.id} className={`ll-pm-row${hot ? ' ll-pm-row--hot' : ''}`}>
                <div>
                  <span className="ll-pm-nm">{b.label}{hot && <span className="ll-pm-badge">Popular</span>}</span>
                  <div className="ll-pm-kd">{isMgmt ? `${b.setupFee} setup` : 'Tenant find'}</div>
                </div>
                <div className={`ll-pm-fig${hot ? ' ll-pm-fig--hot' : ''}`}>
                  <b>{isMgmt ? b.mgmtFee : b.setupFee}</b>
                  <span>{isMgmt ? 'of rent' : 'one-time'}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="ll-price-notes">
          {['All prices inclusive of VAT', 'Every management tier includes a full tenant find', 'Rolling monthly, upgrade or cancel any time'].map((n) => (
            <span key={n}><Check size={13} strokeWidth={2.5} aria-hidden />{n}</span>
          ))}
        </div>
      </section>

      {/* ── PACKAGE CARDS (navy) ─────────────────────────────── */}
      <section className="ll-pkgsec">
        <span className="ll-orb ll-orb-a" aria-hidden style={{
          top: -160, right: -100, width: 640, height: 520,
          background: 'radial-gradient(ellipse, rgba(37,99,235,0.2) 0%, transparent 62%)',
        }} />
        <div className="ll-head">
          <div className="ll-eyebrow ll-eyebrow--light">What&apos;s Included</div>
          <h2 className="ll-h2 ll-h2--light">Services built around you</h2>
          <p className="ll-lead ll-lead--light">
            From a one time tenant find to fully comprehensive management, choose what works for your portfolio.
          </p>
        </div>
        <div className="ll-pkgs">
          {BUNDLES.map((b) => {
            const isMgmt = b.kind === 'Management';
            const hot = !!b.badge;
            const copy = PKG_COPY[b.id];
            return (
              <Link key={b.id} href="/pricing" className={`ll-pkg${hot ? ' ll-pkg--hot' : ''}`}>
                {hot && <span className="ll-pkg__badge">Most Popular</span>}
                <span className="ll-pkg__type">{isMgmt ? `${b.setupFee} setup · monthly` : 'One-time fee'}</span>
                <span className="ll-pkg__price">{isMgmt ? b.mgmtFee : b.setupFee}</span>
                <span className="ll-pkg__name">{b.label}</span>
                <p className="ll-pkg__desc">{copy.desc}</p>
                <ul className="ll-pkg__list">
                  {copy.highlights.map((h) => (
                    <li key={h}><Check size={13} strokeWidth={2.5} aria-hidden />{h}</li>
                  ))}
                </ul>
                <span className="ll-pkg__more">View full details <ArrowRight size={14} strokeWidth={2} aria-hidden /></span>
              </Link>
            );
          })}
        </div>
        <div className="ll-pkg-dots" aria-hidden>
          <span className="is-active" /><span /><span /><span /><span />
        </div>
        <div className="ll-pkgs-foot">
          <p>
            All prices inclusive of VAT. Every management tier includes a full tenant find, and
            management runs on a rolling monthly basis, so you can upgrade or cancel any time.
          </p>
          <Link href="/pricing" className="ll-btn ll-btn--primary">Compare All Packages</Link>
        </div>
      </section>

      {/* ── ADDITIONAL SERVICES ──────────────────────────────── */}
      <section className="ll-sec ll-sec--alt">
        <div className="ll-head">
          <div className="ll-eyebrow">Pay As You Go</div>
          <h2 className="ll-h2">Additional services, whenever you need them</h2>
          <p className="ll-lead">
            Certificates, inventories, photography, referencing and rent protection. Order any service
            on its own, with or without a package, all inclusive of VAT.
          </p>
        </div>
        <div className="ll-as-grid">
          {SERVICE_CATEGORIES.map((cat) => {
            const Icon = CAT_ICON[cat.id] ?? ClipboardCheck;
            return (
              <Link key={cat.id} href="/additional-services" className="ll-as">
                <span className="ll-as__ic"><Icon size={21} strokeWidth={1.8} aria-hidden /></span>
                <h3 className="ll-as__t">{cat.title}</h3>
                <div className="ll-as__rows">
                  {cat.services.slice(0, 3).map((s) => (
                    <div key={s.id} className="ll-as__row">
                      <span>{s.name}</span>
                      <b>{s.price}</b>
                    </div>
                  ))}
                </div>
                <span className="ll-as__more">View all <ArrowRight size={13} strokeWidth={2} aria-hidden /></span>
              </Link>
            );
          })}
        </div>
        <div style={{ textAlign: 'center', marginTop: 44 }}>
          <Link href="/additional-services" className="ll-btn ll-btn--dark">Browse All Additional Services</Link>
        </div>
      </section>

      {/* ── 4-STEP PROCESS ───────────────────────────────────── */}
      <section className="ll-sec ll-sec--light">
        <div className="ll-head">
          <div className="ll-eyebrow">Getting Started</div>
          <h2 className="ll-h2">Let your property in 4 simple steps</h2>
        </div>
        <div className="ll-steps">
          <span className="ll-steps__line" aria-hidden />
          <div className="ll-steps__grid">
            {STEPS.map((s, i) => (
              <div key={s.n} className="ll-step">
                <span className={`ll-step__n ${i === 0 ? 'll-step__n--first' : 'll-step__n--rest'}`}>{s.n}</span>
                <div>
                  <div className="ll-step__t">{s.t}</div>
                  <p className="ll-step__p">{s.p}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LEGAL OBLIGATIONS ────────────────────────────────── */}
      <section className="ll-sec ll-sec--alt">
        <div className="ll-head">
          <div className="ll-eyebrow">Know Your Obligations</div>
          <h2 className="ll-h2">A landlord&rsquo;s legal responsibilities at a glance</h2>
          <p className="ll-lead">
            Letting a property in England comes with real legal duties. On our managed packages, we
            arrange, track and renew all of it for you.
          </p>
        </div>
        <div className="ll-legal">
          {LEGAL.map(({ Icon, t, p }) => (
            <div key={t} className="ll-lg">
              <span className="ll-lg__ic"><Icon size={20} strokeWidth={1.8} aria-hidden /></span>
              <span className="ll-lg__t">{t}</span>
              <p className="ll-lg__p">{p}</p>
            </div>
          ))}
        </div>
        <div className="ll-heads">
          <span className="ll-heads__ic"><BellRing size={22} strokeWidth={1.8} aria-hidden /></span>
          <p>
            <strong>The Renters&rsquo; Rights reforms are changing how tenancies work</strong>, including
            the move away from Section 21 and new rules on how homes are let and managed. We keep every
            landlord we work with updated as the law changes, so your properties stay compliant.
          </p>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────── */}
      <section className="ll-sec ll-sec--light">
        <div className="ll-head">
          <div className="ll-eyebrow">Common Questions</div>
          <h2 className="ll-h2">What landlords should know</h2>
        </div>
        <div className="ll-faq">
          {landlordFaqs.map((faq, i) => {
            const open = openFaq === i;
            return (
              <div key={faq.q} className="ll-faq__item">
                <button
                  type="button"
                  className={`ll-faq__q${open ? ' is-open' : ''}`}
                  aria-expanded={open}
                  onClick={() => setOpenFaq(open ? null : i)}
                >
                  {faq.q}
                  <Plus size={20} strokeWidth={2} aria-hidden />
                </button>
                <div className={`ll-faq__panel${open ? ' is-open' : ''}`}>
                  <div><p className="ll-faq__a">{faq.a}</p></div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── CTA BAND ─────────────────────────────────────────── */}
      <section className="ll-cta">
        <span aria-hidden style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse at 50% 40%, rgba(37,99,235,0.18) 0%, transparent 68%)',
        }} />
        <div className="ll-cta__inner">
          <h2 className="ll-cta__h">Ready to maximise your rental returns?</h2>
          <p className="ll-cta__p">Book a free valuation today and find out exactly what your property could be earning.</p>
          <Link href="/book-valuation" className="ll-btn ll-btn--primary" style={{ marginTop: 14 }}>Book a Free Valuation</Link>
        </div>
      </section>

      <Footer />

      <style>{`
        .ll { font-family: 'Poppins', sans-serif; }

        /* Buttons */
        .ll-btn { display: inline-block; text-align: center; text-decoration: none;
          border-radius: 8px; font-size: 15px; font-weight: 700; letter-spacing: 0.5px;
          text-transform: uppercase; cursor: pointer; transition: background .2s, box-shadow .2s, border-color .2s; }
        .ll-btn--primary { background: #2563eb; color: #fff; padding: 18px 48px; }
        .ll-btn--primary:hover { background: #1d4ed8; box-shadow: 0 10px 30px rgba(37,99,235,0.5); }
        .ll-btn--ghost { background: transparent; color: #fff; border: 1.5px solid rgba(255,255,255,0.4); padding: 16.5px 48px; }
        .ll-btn--ghost:hover { border-color: #fff; }
        .ll-btn--dark { background: #0f1f3d; color: #fff; padding: 16px 36px; font-size: 14px; }
        .ll-btn--dark:hover { background: #162849; }
        .ll-btn--wide { width: 280px; padding-left: 0; padding-right: 0; }

        /* Sections */
        .ll-sec { padding: 104px 64px; }
        .ll-sec--light { background: #fff; }
        .ll-sec--alt { background: #f8fafc; }
        .ll-head { display: flex; flex-direction: column; align-items: center; text-align: center;
          gap: 14px; margin: 0 auto 52px; max-width: 760px; }
        .ll-eyebrow { font-size: 12px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: #2563eb; }
        .ll-eyebrow--light { color: #4a90d9; }
        .ll-h2 { margin: 0; font-size: 44px; font-weight: 700; color: #0f1f3d; letter-spacing: -0.5px; }
        .ll-h2--light { color: #fff; }
        .ll-lead { margin: 0; font-size: 15px; font-weight: 300; color: #616161; line-height: 1.7; }
        .ll-lead--light { color: rgba(255,255,255,0.55); max-width: 540px; }

        /* Hero */
        .ll-hero { position: relative; overflow: hidden;
          background: linear-gradient(165deg, #0c1a33 0%, #15294c 55%, #0f1f3d 100%); }
        .ll-orb { position: absolute; border-radius: 50%; pointer-events: none; }
        .ll-orb-a { animation: llGlowA 18s ease-in-out infinite alternate; }
        .ll-orb-b { animation: llGlowB 24s ease-in-out infinite alternate; }
        .ll-hero__grid { position: absolute; inset: 0; pointer-events: none;
          background-image:
            repeating-linear-gradient(0deg, rgba(148,180,255,0.045) 0px, rgba(148,180,255,0.045) 1px, transparent 1px, transparent 90px),
            repeating-linear-gradient(90deg, rgba(148,180,255,0.045) 0px, rgba(148,180,255,0.045) 1px, transparent 1px, transparent 90px);
          -webkit-mask-image: radial-gradient(ellipse at 50% 0%, #000 30%, transparent 78%);
          mask-image: radial-gradient(ellipse at 50% 0%, #000 30%, transparent 78%); }
        .ll-hero__inner { position: relative; z-index: 1; max-width: 940px; margin: 0 auto;
          padding: 108px 64px 96px; display: flex; flex-direction: column; align-items: center;
          text-align: center; gap: 26px; }
        .ll-hero__kicker { font-size: 12px; font-weight: 700; letter-spacing: 4px; text-transform: uppercase; color: #4a90d9; }
        .ll-hero__title { margin: 0; font-size: 76px; font-weight: 800; color: #fff; line-height: 1.05;
          letter-spacing: -1px; text-transform: uppercase; }
        .ll-hero__title span { color: #4a90d9; }
        .ll-hero__sub { margin: 0; font-size: 18px; font-weight: 300; color: rgba(255,255,255,0.72);
          line-height: 1.7; max-width: 600px; }
        .ll-hero__chips { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; }
        .ll-chip { display: inline-flex; align-items: center; gap: 7px; font-size: 12.5px; font-weight: 600;
          color: #dbe8fb; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.14);
          border-radius: 999px; padding: 8px 16px; }
        .ll-chip svg { color: #4a90d9; }
        .ll-hero__btns { display: flex; gap: 14px; margin-top: 12px; flex-wrap: wrap; justify-content: center; }

        /* Why choose us */
        .ll-why { max-width: 1180px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr;
          gap: 72px; align-items: start; }
        .ll-why__copy { display: flex; flex-direction: column; align-items: flex-start; gap: 22px; }
        .ll-why__h { margin: 0; font-size: 42px; font-weight: 700; color: #0f1f3d; line-height: 1.2; letter-spacing: -0.5px; }
        .ll-why__p { margin: 0; font-size: 15px; color: #616161; line-height: 1.7; }
        .ll-info-row { display: flex; gap: 16px; margin-top: 6px; flex-wrap: wrap; }
        .ll-info { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 18px 22px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.08); display: flex; align-items: center; gap: 14px; }
        .ll-chip-ic { width: 40px; height: 40px; border-radius: 8px; background: #eff6ff;
          display: inline-flex; align-items: center; justify-content: center; color: #2563eb; flex-shrink: 0; }
        .ll-info b { display: block; font-size: 15px; font-weight: 700; color: #0f1f3d; }
        .ll-info span { font-size: 12px; color: #9e9e9e; }
        .ll-check-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 24px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.08); display: flex; flex-direction: column; }
        .ll-check-row { display: flex; align-items: flex-start; gap: 16px; padding: 18px 0; border-bottom: 1px solid #f1f5f9; }
        .ll-check-row:last-child { border-bottom: none; }
        .ll-check-ic { width: 38px; height: 38px; flex-shrink: 0; border-radius: 8px; background: #eff6ff;
          display: inline-flex; align-items: center; justify-content: center; color: #2563eb; }
        .ll-check-tt { font-size: 15px; font-weight: 700; color: #0f1f3d; }
        .ll-check-sub { font-size: 13px; color: #9e9e9e; line-height: 1.6; margin-top: 3px; }

        /* City toggle */
        .ll-citytoggle { display: inline-flex; background: #eff6ff; border: 1px solid #dbe8fb;
          border-radius: 999px; padding: 4px; gap: 4px; margin-top: 6px; }
        .ll-citytoggle button { border: none; background: transparent; font-family: inherit; font-size: 12px;
          font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; color: #64748b;
          padding: 8px 18px; border-radius: 999px; cursor: pointer; transition: background .2s, color .2s; }
        .ll-citytoggle button.is-active { background: #2563eb; color: #fff; }

        /* Pricing at a glance (desktop cards) */
        .ll-price-cards { display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px;
          align-items: stretch; max-width: 1240px; margin: 0 auto; }
        .ll-pc { position: relative; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px;
          padding: 26px 24px; display: flex; flex-direction: column; gap: 6px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.08); transition: transform .25s, box-shadow .25s, border-color .25s; }
        .ll-pc:hover { transform: translateY(-5px); box-shadow: 0 18px 40px -18px rgba(15,31,61,0.3); border-color: #2563eb; }
        .ll-pc__k { font-size: 12px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #9e9e9e; }
        .ll-pc__n { font-size: 15px; font-weight: 700; color: #0f1f3d; line-height: 1.3; }
        .ll-pc__big { font-size: 34px; font-weight: 800; color: #0f1f3d; letter-spacing: -1px; margin-top: 8px; }
        .ll-pc__sub { font-size: 12.5px; color: #616161; }
        .ll-pc--hot { background: linear-gradient(165deg, #15294c 0%, #0c1a33 100%); border: 1.5px solid #2563eb;
          box-shadow: 0 18px 44px -20px rgba(37,99,235,0.55); transform: scale(1.03); }
        .ll-pc--hot:hover { transform: scale(1.03) translateY(-5px); box-shadow: 0 26px 54px -22px rgba(37,99,235,0.65); }
        .ll-pc--hot .ll-pc__k { color: #8fa6c9; }
        .ll-pc--hot .ll-pc__n { color: #fff; }
        .ll-pc--hot .ll-pc__big { color: #4a90d9; }
        .ll-pc--hot .ll-pc__sub { color: #a9c4ea; }
        .ll-pc__badge { position: absolute; top: -12px; left: 50%; transform: translateX(-50%);
          background: #2563eb; color: #fff; font-size: 9px; font-weight: 800; letter-spacing: 2px;
          text-transform: uppercase; padding: 5px 14px; border-radius: 999px; white-space: nowrap; }
        .ll-price-notes { display: flex; justify-content: center; gap: 24px; flex-wrap: wrap;
          font-size: 13px; color: #9e9e9e; margin-top: 40px; }
        .ll-price-notes span { display: inline-flex; align-items: center; gap: 7px; }
        .ll-price-notes svg { color: #2563eb; }

        /* Pricing (mobile navy list) */
        .ll-price-mob { display: none; background: linear-gradient(160deg, #15294c 0%, #0c1a33 100%);
          border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 10px 18px;
          box-shadow: 0 18px 40px -22px rgba(9,18,40,0.7); flex-direction: column; }
        .ll-pm-row { display: flex; justify-content: space-between; align-items: center; gap: 12px;
          padding: 15px 0; border-bottom: 1px solid rgba(255,255,255,0.08); }
        .ll-pm-row:last-child { border-bottom: none; }
        .ll-pm-row--hot { background: rgba(37,99,235,0.18); border-radius: 8px; padding: 15px 12px;
          margin: 0 -12px; border-bottom: none; }
        .ll-pm-nm { font-size: 14px; font-weight: 700; color: #fff; display: inline-flex; align-items: center; gap: 8px; }
        .ll-pm-badge { font-size: 8px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase;
          background: #2563eb; color: #fff; border-radius: 999px; padding: 2px 8px; }
        .ll-pm-kd { font-size: 11px; color: #8fa6c9; margin-top: 2px; }
        .ll-pm-fig { text-align: right; }
        .ll-pm-fig b { display: block; font-size: 17px; font-weight: 800; color: #fff; }
        .ll-pm-fig--hot b { color: #4a90d9; }
        .ll-pm-fig span { font-size: 10.5px; color: #a9c4ea; }

        /* Package cards (navy) */
        .ll-pkgsec { position: relative; overflow: hidden;
          background: linear-gradient(180deg, #0b1730 0%, #0f1f3d 55%, #0c1a33 100%); padding: 104px 64px; }
        .ll-pkgsec .ll-head { position: relative; z-index: 1; }
        .ll-pkgs { position: relative; z-index: 1; display: flex; flex-wrap: wrap; justify-content: center;
          gap: 24px; max-width: 1180px; margin: 0 auto; }
        .ll-pkg { position: relative; width: 350px; box-sizing: border-box;
          background: linear-gradient(165deg, #16294c 0%, #0e1e3c 100%); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px; padding: 32px 24px 26px; display: flex; flex-direction: column; gap: 12px;
          text-decoration: none; transition: transform .28s, border-color .28s, box-shadow .28s; }
        .ll-pkg:hover { transform: translateY(-6px); border-color: rgba(74,144,217,0.55); box-shadow: 0 26px 54px -26px rgba(0,0,0,0.7); }
        .ll-pkg__type { font-size: 11px; font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase; color: rgba(255,255,255,0.4); }
        .ll-pkg__price { font-size: 36px; font-weight: 800; color: #fff; line-height: 1; letter-spacing: -1px; }
        .ll-pkg__name { font-size: 16px; font-weight: 700; color: #fff; }
        .ll-pkg__desc { margin: 0; font-size: 13px; color: rgba(255,255,255,0.55); line-height: 1.7; }
        .ll-pkg__list { list-style: none; margin: 6px 0 0; padding: 0; display: flex; flex-direction: column; gap: 9px; }
        .ll-pkg__list li { display: inline-flex; align-items: flex-start; gap: 9px; font-size: 13px; color: rgba(255,255,255,0.68); }
        .ll-pkg__list svg { color: #4a90d9; flex-shrink: 0; margin-top: 2px; }
        .ll-pkg__more { margin-top: auto; padding-top: 14px; display: inline-flex; align-items: center; gap: 7px;
          font-size: 12px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; color: #4a90d9; }
        .ll-pkg--hot { background: linear-gradient(165deg, #1c396b 0%, #102244 100%); border: 1.5px solid #2563eb;
          box-shadow: 0 26px 54px -26px rgba(37,99,235,0.55); transform: scale(1.02); }
        .ll-pkg--hot:hover { transform: scale(1.02) translateY(-6px); border-color: #4a90d9; box-shadow: 0 32px 64px -26px rgba(37,99,235,0.65); }
        .ll-pkg--hot .ll-pkg__price { color: #4a90d9; }
        .ll-pkg--hot .ll-pkg__more { color: #fff; }
        .ll-pkg--hot .ll-pkg__more svg { color: #fff; }
        .ll-pkg__badge { position: absolute; top: -12px; left: 50%; transform: translateX(-50%);
          background: #2563eb; color: #fff; font-size: 9px; font-weight: 800; letter-spacing: 2px;
          text-transform: uppercase; padding: 5px 14px; border-radius: 999px; white-space: nowrap; }
        .ll-pkg-dots { display: none; justify-content: center; gap: 6px; margin-top: 18px; position: relative; z-index: 1; }
        .ll-pkg-dots span { width: 4px; height: 4px; border-radius: 999px; background: rgba(255,255,255,0.25); }
        .ll-pkg-dots span.is-active { width: 18px; background: #2563eb; }
        .ll-pkgs-foot { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center;
          gap: 24px; margin-top: 52px; }
        .ll-pkgs-foot p { margin: 0; text-align: center; font-size: 13px; color: rgba(255,255,255,0.5); line-height: 1.7; max-width: 620px; }

        /* Additional services */
        .ll-as-grid { display: flex; flex-wrap: wrap; justify-content: center; gap: 20px; max-width: 1180px; margin: 0 auto; }
        .ll-as { width: 368px; box-sizing: border-box; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px;
          padding: 24px; display: flex; flex-direction: column; gap: 14px; box-shadow: 0 2px 12px rgba(0,0,0,0.08);
          text-decoration: none; transition: transform .25s, border-color .25s, box-shadow .25s; }
        .ll-as:hover { transform: translateY(-4px); border-color: #2563eb; box-shadow: 0 18px 40px -20px rgba(15,31,61,0.35); }
        .ll-as__ic { width: 42px; height: 42px; border-radius: 8px; background: #eff6ff; display: inline-flex;
          align-items: center; justify-content: center; color: #2563eb; }
        .ll-as__t { font-size: 16px; font-weight: 700; color: #0f1f3d; line-height: 1.35; margin: 0; }
        .ll-as__rows { display: flex; flex-direction: column; gap: 10px; }
        .ll-as__row { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
        .ll-as__row span { font-size: 13.5px; color: #616161; }
        .ll-as__row b { font-size: 13.5px; font-weight: 800; color: #2563eb; white-space: nowrap; }
        .ll-as__more { margin-top: auto; display: inline-flex; align-items: center; gap: 6px; font-size: 12px;
          font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; color: #2563eb; }

        /* Steps */
        .ll-steps { position: relative; max-width: 1180px; margin: 0 auto; }
        .ll-steps__line { position: absolute; top: 32px; left: 12.5%; right: 12.5%; height: 2px;
          background: linear-gradient(90deg, #2563eb 0%, #bfdbfe 100%); }
        .ll-steps__grid { position: relative; display: grid; grid-template-columns: repeat(4, 1fr); gap: 32px; }
        .ll-step { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 18px; }
        .ll-step__n { width: 64px; height: 64px; border-radius: 50%; display: inline-flex; align-items: center;
          justify-content: center; font-size: 18px; font-weight: 800; }
        .ll-step__n--first { background: #2563eb; border: 2px solid #2563eb; color: #fff; box-shadow: 0 8px 22px rgba(37,99,235,0.35); }
        .ll-step__n--rest { background: #eff6ff; border: 2px solid #2563eb; color: #2563eb; }
        .ll-step__t { font-size: 17px; font-weight: 700; color: #0f1f3d; margin-bottom: 8px; }
        .ll-step__p { margin: 0; font-size: 14px; color: #616161; line-height: 1.7; }

        /* Legal grid */
        .ll-legal { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; max-width: 1180px; margin: 0 auto; }
        .ll-lg { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px;
          display: flex; flex-direction: column; gap: 12px; transition: transform .25s, border-color .25s, box-shadow .25s; }
        .ll-lg:hover { transform: translateY(-4px); border-color: #2563eb; box-shadow: 0 18px 40px -20px rgba(15,31,61,0.3); }
        .ll-lg__ic { width: 40px; height: 40px; border-radius: 8px; background: #eff6ff; display: inline-flex;
          align-items: center; justify-content: center; color: #2563eb; }
        .ll-lg__t { font-size: 15px; font-weight: 700; color: #0f1f3d; }
        .ll-lg__p { margin: 0; font-size: 13px; color: #616161; line-height: 1.65; }
        .ll-heads { max-width: 1180px; margin: 28px auto 0; background: #0f1f3d; border-radius: 8px;
          padding: 26px 32px; display: flex; align-items: center; gap: 20px; box-shadow: 0 18px 44px -22px rgba(10,22,47,0.55); }
        .ll-heads__ic { width: 44px; height: 44px; flex-shrink: 0; border-radius: 8px; background: rgba(37,99,235,0.22);
          display: inline-flex; align-items: center; justify-content: center; color: #7aa5f0; }
        .ll-heads p { margin: 0; font-size: 14px; color: rgba(255,255,255,0.78); line-height: 1.7; }
        .ll-heads strong { color: #fff; }

        /* FAQ */
        .ll-faq { max-width: 800px; margin: 0 auto; }
        .ll-faq__item { border-top: 1px solid rgba(15,31,61,0.12); }
        .ll-faq__item:last-child { border-bottom: 1px solid rgba(15,31,61,0.12); }
        .ll-faq__q { width: 100%; background: none; border: none; text-align: left; display: flex;
          justify-content: space-between; align-items: center; gap: 16px; padding: 24px 0; cursor: pointer;
          font-family: inherit; font-size: 16.5px; font-weight: 700; color: #0f1f3d; }
        .ll-faq__q svg { color: #2563eb; flex-shrink: 0; transition: transform .3s cubic-bezier(0.22,1,0.36,1); }
        .ll-faq__q.is-open svg { transform: rotate(45deg); }
        .ll-faq__panel { display: grid; grid-template-rows: 0fr; transition: grid-template-rows .35s cubic-bezier(0.22,1,0.36,1); }
        .ll-faq__panel.is-open { grid-template-rows: 1fr; }
        .ll-faq__panel > div { overflow: hidden; min-height: 0; }
        .ll-faq__a { margin: 0; padding: 0 40px 26px 0; font-size: 14.5px; color: #616161; line-height: 1.8; }

        /* CTA band */
        .ll-cta { position: relative; overflow: hidden; background: #0f1f3d; padding: 88px 64px; text-align: center; }
        .ll-cta__inner { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; gap: 18px; }
        .ll-cta__h { margin: 0; font-size: 48px; font-weight: 700; color: #fff; letter-spacing: -0.5px; }
        .ll-cta__p { margin: 0; font-size: 16px; font-weight: 300; color: rgba(255,255,255,0.6); line-height: 1.7; max-width: 520px; }

        @keyframes llGlowA { 0% { transform: translate(0,0) scale(1); } 100% { transform: translate(-30px,24px) scale(1.12); } }
        @keyframes llGlowB { 0% { transform: translate(0,0) scale(1); } 100% { transform: translate(26px,-20px) scale(1.1); } }
        @media (prefers-reduced-motion: reduce) { .ll-orb-a, .ll-orb-b { animation: none; } }

        /* ── Tablet ── */
        @media (max-width: 960px) {
          .ll-sec { padding: 76px 40px; }
          .ll-pkgsec { padding: 76px 40px; }
          .ll-why { grid-template-columns: 1fr; gap: 40px; max-width: 620px; }
          .ll-price-cards { grid-template-columns: repeat(2, 1fr); max-width: 640px; }
          .ll-pc--hot { transform: none; }
          .ll-pc--hot:hover { transform: translateY(-5px); }
          .ll-legal { grid-template-columns: repeat(2, 1fr); }
          .ll-steps__line { display: none; }
          .ll-steps__grid { grid-template-columns: repeat(2, 1fr); gap: 40px; }
        }

        /* ── Mobile ── */
        @media (max-width: 640px) {
          .ll-sec { padding: 56px 24px; }
          .ll-hero__inner { padding: 56px 24px 52px; gap: 20px; }
          .ll-hero__kicker { font-size: 10.5px; letter-spacing: 3px; }
          .ll-hero__title { font-size: 40px; line-height: 1.06; }
          .ll-hero__sub { font-size: 14.5px; }
          .ll-hero__chips { gap: 8px; }
          .ll-chip { font-size: 11px; padding: 6px 12px; }
          .ll-hero__btns { flex-direction: column; width: 100%; }
          .ll-btn--wide { width: 100%; }
          .ll-h2 { font-size: 28px; }
          .ll-why__h { font-size: 28px; }
          .ll-head { margin-bottom: 28px; }
          .ll-check-sub { display: none; }
          .ll-check-card { padding: 8px 18px; }
          .ll-check-row { padding: 14px 0; align-items: center; }
          .ll-price-cards { display: none; }
          .ll-price-mob { display: flex; }
          .ll-price-notes { display: none; }
          .ll-pkgsec { padding: 56px 0; }
          .ll-pkgsec .ll-head { padding: 0 24px; }
          .ll-pkgs { flex-wrap: nowrap; overflow-x: auto; justify-content: flex-start;
            scroll-snap-type: x mandatory; padding: 14px 24px 8px; gap: 14px; -webkit-overflow-scrolling: touch; }
          .ll-pkg { flex: 0 0 292px; width: auto; scroll-snap-align: start; transform: none; }
          .ll-pkg--hot { transform: none; }
          .ll-pkg--hot:hover, .ll-pkg:hover { transform: none; }
          .ll-pkg-dots { display: flex; }
          .ll-pkgs-foot { padding: 0 24px; margin-top: 28px; }
          .ll-as { width: 100%; }
          .ll-steps__grid { grid-template-columns: 1fr; gap: 28px; }
          .ll-legal { grid-template-columns: 1fr; }
          .ll-heads { flex-direction: column; align-items: flex-start; gap: 14px; padding: 22px 24px; }
          .ll-cta { padding: 60px 24px; }
          .ll-cta__h { font-size: 28px; }
          .ll-faq__q { font-size: 15px; }
        }
      `}</style>
    </div>
  );
}
