'use client';
// app/property-management/PropertyManagementClient.tsx
// Property Management page (redesign frames 1f desktop / 1h mobile).
// Single-accent (#2563eb) system on navy, matching HomeClient's visual language.
// Copy is unchanged from the site; presentation upgraded per the design handoff.
// SEO/metadata + FAQ JSON-LD live in page.tsx.
import Link from 'next/link';
import { useState } from 'react';
import {
  UserCheck, CreditCard, Search, Wrench, ShieldCheck, FileText, Scale, Heart,
  MapPin, Wallet, Zap, BookOpen, BarChart3, Handshake, Check,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import MobileFAB from '@/components/layout/MobileFAB';

const MANAGED_ROWS = [
  'Tenant finding',
  'Rent collection',
  'Legal compliance',
  'Maintenance',
  'Deposit management',
];

const services = [
  {
    icon: UserCheck,
    title: 'Tenant Finding & Referencing',
    desc: 'Professional photography, listings on Rightmove and Zoopla, accompanied viewings, and full tenant referencing including credit checks, employment verification, and previous landlord references.',
  },
  {
    icon: CreditCard,
    title: 'Rent Collection',
    desc: 'Monthly rent collection with automated reminders, arrears management, and prompt payment to your account, with full monthly statements.',
  },
  {
    icon: Search,
    title: 'Property Inspections',
    desc: 'Regular mid-tenancy inspections (typically every 3-6 months) with written reports and photographs, so you always know the condition of your investment.',
  },
  {
    icon: Wrench,
    title: 'Maintenance Coordination',
    desc: '24/7 tenant maintenance reporting, a trusted network of vetted local tradespeople, and transparent invoicing, with no hidden mark-ups on repairs.',
  },
  {
    icon: ShieldCheck,
    title: 'Legal Compliance',
    desc: "We keep your property legally compliant: Gas Safety, EICR, EPC, Right to Rent checks, deposit protection, Renters' Rights Act documentation, and all tenancy legislation updates.",
  },
  {
    icon: FileText,
    title: 'Tenancy Management',
    desc: 'From drafting legally compliant tenancy agreements to managing renewals, rent reviews (Section 13 notices), and end-of-tenancy checkout reports and deposit returns.',
  },
  {
    icon: Scale,
    title: 'Section 8 & Possession Proceedings',
    desc: "Under the Renters' Rights Act 2025, Section 21 is abolished. We manage Section 8 notices and possession proceedings correctly, with proper grounds and evidence, protecting your rights as a landlord.",
  },
  {
    icon: Heart,
    title: 'Pet Policy Management',
    desc: "The Renters' Rights Act gives tenants the right to request pets. We manage these requests fairly and legally, including advising on pet damage insurance to protect your property.",
  },
];

const changes = [
  {
    num: '01',
    title: 'Section 21 gone',
    body: 'No-fault evictions are abolished. Possession now requires a valid Section 8 ground: rent arrears, property sale, anti-social behaviour.',
    border: '#fc8181',
  },
  {
    num: '02',
    title: 'All tenancies periodic',
    body: 'Fixed-term ASTs no longer exist. Every tenancy is now a rolling periodic contract from day one.',
    border: '#4a90d9',
  },
  {
    num: '03',
    title: 'Information sheet required',
    body: 'Must be issued to every tenant before the tenancy begins. Fines up to £7,000 for failure. We issue it automatically.',
    border: '#2563eb',
  },
];

const alsoHandle = [
  { label: 'Section 13 rent increase notices', sub: "Once per year, 2 months' notice required" },
  { label: 'Tenant pet requests', sub: 'Cannot be unreasonably refused' },
  { label: 'Landlord database registration', sub: 'Coming later in 2026' },
];

const complianceItems = [
  {
    title: 'Gas Safety Record',
    freq: 'Annual',
    detail: 'Carried out by a Gas Safe registered engineer. Must be provided to tenants before move-in and within 28 days of renewal.',
    status: 'Mandatory',
  },
  {
    title: 'Electrical Installation Condition Report (EICR)',
    freq: 'Every 5 years',
    detail: 'Required for all private rented properties. Ensures the electrical installation is safe. Must be carried out by a qualified electrician.',
    status: 'Mandatory',
  },
  {
    title: 'Energy Performance Certificate (EPC)',
    freq: 'Every 10 years',
    detail: 'Currently required at EPC rating E or above to legally let a property. Proposed minimum of C in coming years, and we advise on improvements.',
    status: 'Mandatory',
  },
  {
    title: 'Right to Rent Check',
    freq: 'Before tenancy',
    detail: 'Landlords must verify all adult occupants have the legal right to rent in England. Fines of up to £20,000 per illegal occupant if not carried out.',
    status: 'Mandatory',
  },
  {
    title: 'Deposit Protection',
    freq: 'Within 30 days',
    detail: 'All deposits must be registered with a government-approved scheme (DPS, TDS, or MyDeposits) and prescribed information provided to the tenant.',
    status: 'Mandatory',
  },
  {
    title: "Renters' Rights Information Sheet",
    freq: 'Per tenancy',
    detail: "Required under the Renters' Rights Act 2025 (from 1 May 2026). Must be provided to all new tenants before tenancy begins. Fines up to £7,000 for non-compliance.",
    status: 'New for 2026',
  },
  {
    title: 'Legionella Risk Assessment',
    freq: 'Recommended',
    detail: 'Landlords have a duty of care to assess the risk of Legionella. A written risk assessment is best practice and protects you legally.',
    status: 'Best Practice',
  },
  {
    title: 'Smoke & CO Alarms',
    freq: 'At all times',
    detail: 'Working smoke alarm on each floor, CO alarm in every room with a fixed combustion appliance (excluding gas cookers). Checked at start of each tenancy.',
    status: 'Mandatory',
  },
];

const steps = [
  {
    step: '01',
    title: 'Free rental valuation',
    body: 'We visit your property, assess the market, and give you an honest rental valuation, including advice on what improvements (if any) could increase your yield.',
  },
  {
    step: '02',
    title: 'Instruction & preparation',
    body: 'We instruct a professional photographer, list your property on Rightmove and Zoopla, and carry out any agreed compliance certificates before marketing begins.',
  },
  {
    step: '03',
    title: 'Tenant finding & referencing',
    body: 'We conduct accompanied viewings, receive applications, and carry out full tenant referencing: credit checks, income verification, and previous landlord references.',
  },
  {
    step: '04',
    title: 'Tenancy commencement',
    body: "We prepare a legally compliant tenancy agreement, protect the deposit, issue all required documentation (including the Renters' Rights Information Sheet), and conduct a detailed check-in inventory.",
  },
  {
    step: '05',
    title: 'Ongoing management',
    body: 'We collect rent, handle maintenance, conduct regular inspections, manage renewals and rent reviews, and keep you updated, while you simply receive your monthly payment.',
  },
  {
    step: '06',
    title: 'End of tenancy',
    body: 'We handle check-out, compare against the inventory, manage deposit returns or disputes, and begin the process of reletting your property to minimise any void period.',
  },
];

const differentiators = [
  { icon: MapPin, title: 'Leeds & Manchester Specialists', body: 'Deep local knowledge of both markets. We know the areas, the rents, and the demand.' },
  { icon: Wallet, title: 'No Hidden Fees', body: 'One transparent monthly fee. No admin charges, no renewal fees, no mark-ups on maintenance.' },
  { icon: Zap, title: 'Fast Maintenance Response', body: 'Tenant maintenance requests are responded to within 24 hours. Emergencies handled immediately.' },
  { icon: BookOpen, title: 'Compliance Experts', body: "Fully up to date with the Renters' Rights Act 2025 and all UK landlord legislation." },
  { icon: BarChart3, title: 'Regular Reporting', body: 'Monthly statements, inspection reports, and complete transparency on your property at all times.' },
  { icon: Handshake, title: 'Personal Service', body: 'You deal with a dedicated property manager (not a call centre) who knows your property.' },
];

const faqs = [
  {
    q: 'How much does full property management cost?',
    a: 'Our fully managed service is typically 10-14% of monthly rent (inc. VAT). We are transparent, with no hidden fees, no renewal charges, and no mark-ups on maintenance.',
  },
  {
    q: 'Can I switch to House of Lettings from another agent?',
    a: 'Yes. We handle the transfer from your current agent, including notifying tenants and updating payment details. Most switches complete within 5-10 working days.',
  },
  {
    q: 'What happens if my property is empty (void period)?',
    a: 'We proactively market your property from 2 months before any tenancy ends to minimise void periods. We also advise on realistic market rents to keep your property competitive.',
  },
  {
    q: "How do you handle the Renters' Rights Act changes?",
    a: "We are fully up to date with the Renters' Rights Act 2025 (in force from 1 May 2026). We handle all Section 13 rent increase notices, provide the required Information Sheet to tenants, manage Section 8 proceedings, and ensure your tenancy agreements comply with the new periodic tenancy rules.",
  },
  {
    q: 'Who carries out maintenance and repairs?',
    a: 'We have a network of vetted local tradespeople across Leeds and Manchester. For works under an agreed threshold (typically £250), we instruct repairs immediately without waiting for approval, keeping your tenants happy and your property in good condition.',
  },
  {
    q: 'How are rental payments handled?',
    a: 'Rent is collected from tenants and transferred directly to your nominated bank account, usually within 1-3 working days of receipt. You also receive a monthly statement with a full breakdown.',
  },
  {
    q: 'Do you handle deposit protection?',
    a: 'Yes. All deposits are registered with a government-approved deposit protection scheme (DPS or TDS) within 30 days of receipt, as legally required. We manage the full end-of-tenancy deposit return or dispute process on your behalf.',
  },
  {
    q: 'What certifications do you handle?',
    a: 'We arrange and track all mandatory safety certificates: Gas Safety Record (annual), Electrical Installation Condition Report (EICR) every 5 years, Energy Performance Certificate (EPC), and where applicable, Legionella Risk Assessment and PAT testing for furnished properties.',
  },
];

function statusStyle(status: string) {
  if (status === 'New for 2026') return { bg: 'rgba(229,62,62,0.1)', color: '#e53e3e' };
  if (status === 'Best Practice') return { bg: 'rgba(74,144,217,0.12)', color: '#4a90d9' };
  return { bg: 'rgba(37,99,235,0.1)', color: '#2563eb' };
}

export default function PropertyManagementClient() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="pm">
      <Navbar />
      <MobileFAB />

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="pm-hero">
        <div className="pm-hero__glow" aria-hidden />
        <div className="pm-hero__grid" aria-hidden />
        <div className="pm-hero__inner">
          <div className="pm-hero__kicker">Fully Managed · Leeds &amp; Manchester</div>
          <h1 className="pm-hero__title">
            Property management.<br />
            <span>Done properly.</span>
          </h1>
          <p className="pm-hero__sub">
            From finding your first tenant to navigating the Renters&apos; Rights Act 2025,
            we manage your property so you don&apos;t have to worry about a thing.
          </p>
          <div className="pm-hero__btns">
            <Link href="/book-valuation" className="pm-btn pm-btn--primary pm-btn--wide">Book a Valuation</Link>
            <Link href="/pricing" className="pm-btn pm-btn--ghost pm-btn--wide">View Our Packages</Link>
          </div>
          <div className="pm-hero__trust">
            {['Leeds & Manchester', 'No hidden fees', "Renters' Rights Act compliant"].map((t) => (
              <span key={t} className="pm-hero__trust-item">
                <Check size={13} strokeWidth={2.5} aria-hidden />{t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHAT WE DO ───────────────────────────────────────── */}
      <section className="pm-sec">
        <div className="pm-split">
          <div className="pm-split__copy">
            <div className="pm-eyebrow">What We Do</div>
            <h2 className="pm-h2 pm-h2--left">Your property.<br />Our responsibility.</h2>
            <p className="pm-body">
              Property management means we act as your professional representative, handling every
              aspect of your rental from day one. You retain ownership and receive rent; we handle
              everything else.
            </p>
            <p className="pm-body">
              The UK rental market changed significantly in 2026. The Renters&apos; Rights Act 2025
              abolished Section 21 &quot;no fault&quot; evictions, introduced rolling periodic tenancies,
              new pet rights, and strict documentation requirements. Getting it wrong can mean fines of
              up to £7,000. We make sure you&apos;re always on the right side of the law.
            </p>
          </div>
          <div className="pm-managed">
            {MANAGED_ROWS.map((row) => (
              <div key={row} className="pm-managed__row">
                <span className="pm-managed__label">{row}</span>
                <span className="pm-managed__pill">Fully Managed</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SERVICES ─────────────────────────────────────────── */}
      <section className="pm-sec pm-sec--alt">
        <div className="pm-wrap">
          <div className="pm-head">
            <div className="pm-eyebrow">Our Services</div>
            <h2 className="pm-h2">Everything included. Nothing extra.</h2>
            <p className="pm-head__sub">
              Our fully managed service covers every aspect of your property: one fixed fee, complete
              peace of mind.
            </p>
          </div>
          <div className="pm-services">
            {services.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="pm-service">
                <span className="pm-service__chip"><Icon size={20} strokeWidth={1.8} aria-hidden /></span>
                <span className="pm-service__title">{title}</span>
                <span className="pm-service__desc">{desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── RENTERS' RIGHTS ACT 2025 ─────────────────────────── */}
      <section className="pm-navy">
        <div className="pm-navy__glow" aria-hidden />
        <div className="pm-rra">
          <div className="pm-rra__head">
            <div className="pm-rra__intro">
              <span className="pm-badge">In force: 1 May 2026</span>
              <h2 className="pm-h2 pm-h2--dark">The Renters&apos; Rights Act 2025</h2>
              <p className="pm-navy__sub">
                The biggest shake-up to UK renting in 30 years. Here&apos;s what changed, and what we
                handle so you don&apos;t have to.
              </p>
            </div>
            <div className="pm-fine">
              <div className="pm-fine__num">£7,000</div>
              <div className="pm-fine__label">max fine for non-compliance</div>
            </div>
          </div>

          <div className="pm-changes">
            {changes.map((c) => (
              <div key={c.num} className="pm-change" style={{ borderLeftColor: c.border }}>
                <span className="pm-change__num">{c.num}</span>
                <span className="pm-change__title">{c.title}</span>
                <span className="pm-change__body">{c.body}</span>
              </div>
            ))}
          </div>

          <div className="pm-handle">
            <span className="pm-handle__label">We also handle</span>
            <div className="pm-handle__grid">
              {alsoHandle.map((item) => (
                <div key={item.label} className="pm-handle__item">
                  <span className="pm-handle__tick"><Check size={10} strokeWidth={3} aria-hidden /></span>
                  <div>
                    <div className="pm-handle__name">{item.label}</div>
                    <div className="pm-handle__sub">{item.sub}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="pm-handle__cta">
              <span className="pm-handle__q">Not sure if your property is compliant?</span>
              <Link href="/book-valuation" className="pm-btn pm-btn--primary pm-btn--inline">Book a Valuation</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── COMPLIANCE CHECKLIST ─────────────────────────────── */}
      <section className="pm-sec">
        <div className="pm-wrap pm-wrap--narrow">
          <div className="pm-head">
            <div className="pm-eyebrow">Legal Requirements</div>
            <h2 className="pm-h2">Landlord compliance checklist</h2>
            <p className="pm-head__sub">
              Every property we manage is kept fully compliant. Here&apos;s what&apos;s legally
              required, and what we handle for you.
            </p>
          </div>
          <div className="pm-compliance">
            {complianceItems.map((item) => {
              const isNew = item.status === 'New for 2026';
              const ss = statusStyle(item.status);
              return (
                <div key={item.title} className={`pm-comp${isNew ? ' pm-comp--new' : ''}`}>
                  <div className="pm-comp__top">
                    <span className="pm-comp__title">{item.title}</span>
                    <span className="pm-comp__pill" style={{ background: ss.bg, color: ss.color }}>{item.status}</span>
                    <span className="pm-comp__freq">{item.freq}</span>
                  </div>
                  <span className="pm-comp__detail">{item.detail}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section className="pm-sec pm-sec--alt">
        <div className="pm-wrap pm-wrap--timeline">
          <div className="pm-head">
            <div className="pm-eyebrow">The Process</div>
            <h2 className="pm-h2">How it works</h2>
          </div>
          <div className="pm-timeline">
            {steps.map((s, i) => (
              <div key={s.step} className="pm-tl">
                <div className="pm-tl__rail">
                  <span className="pm-tl__dot">{s.step}</span>
                  {i < steps.length - 1 && <span className="pm-tl__line" />}
                </div>
                <div className="pm-tl__body">
                  <span className="pm-tl__title">{s.title}</span>
                  <span className="pm-tl__text">{s.body}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHAT MAKES US DIFFERENT ──────────────────────────── */}
      <section className="pm-sec">
        <div className="pm-wrap">
          <div className="pm-head">
            <div className="pm-eyebrow">Why House of Lettings</div>
            <h2 className="pm-h2">What makes us different</h2>
          </div>
          <div className="pm-diffs">
            {differentiators.map(({ icon: Icon, title, body }) => (
              <div key={title} className="pm-diff">
                <span className="pm-diff__chip"><Icon size={22} strokeWidth={1.8} aria-hidden /></span>
                <span className="pm-diff__title">{title}</span>
                <span className="pm-diff__body">{body}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────── */}
      <section className="pm-sec pm-sec--alt">
        <div className="pm-faqwrap">
          <div className="pm-head">
            <div className="pm-eyebrow">FAQs</div>
            <h2 className="pm-h2">Common landlord questions</h2>
          </div>
          <div className="pm-faqs">
            {faqs.map((faq, i) => {
              const open = openFaq === i;
              return (
                <div key={faq.q} className={`pm-faq${open ? ' pm-faq--open' : ''}`}>
                  <button
                    type="button"
                    className="pm-faq__q"
                    aria-expanded={open}
                    onClick={() => setOpenFaq(open ? null : i)}
                  >
                    <span>{faq.q}</span>
                    <span className="pm-faq__plus">+</span>
                  </button>
                  <div className="pm-faq__panel">
                    <div className="pm-faq__inner">
                      <p className="pm-faq__a">{faq.a}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA BAND ─────────────────────────────────────────── */}
      <section className="pm-cta">
        <div className="pm-cta__orb" aria-hidden />
        <div className="pm-cta__inner">
          <h2 className="pm-cta__title">Ready to hand over the keys?</h2>
          <p className="pm-cta__sub">
            Book a free, no-obligation rental valuation. We&apos;ll visit your property, tell you what
            it&apos;s worth, and explain exactly how we&apos;ll manage it.
          </p>
          <div className="pm-hero__btns">
            <Link href="/book-valuation" className="pm-btn pm-btn--primary pm-btn--cta">Book a Valuation</Link>
            <Link href="/pricing" className="pm-btn pm-btn--ghost pm-btn--cta">View Our Packages</Link>
          </div>
        </div>
      </section>

      <Footer />

      <style>{`
        .pm { font-family: 'Poppins', sans-serif; }

        /* Buttons */
        .pm-btn {
          display: inline-block; text-align: center; text-decoration: none;
          border-radius: 8px; font-size: 15px; font-weight: 700;
          letter-spacing: 0.5px; text-transform: uppercase; cursor: pointer;
          transition: background 0.2s, box-shadow 0.2s, border-color 0.2s;
        }
        .pm-btn--wide { width: 260px; padding: 18px 0; }
        .pm-btn--cta { width: 250px; padding: 18px 0; }
        .pm-btn--inline { padding: 15px 34px; white-space: nowrap; }
        .pm-btn--primary { background: #2563eb; color: #fff; padding: 16px 36px; }
        .pm-btn--primary:hover { background: #1d4ed8; box-shadow: 0 10px 30px rgba(37,99,235,0.5); }
        .pm-btn--ghost {
          background: transparent; color: #fff;
          border: 1.5px solid rgba(255,255,255,0.4); padding: 16.5px 0;
        }
        .pm-btn--ghost:hover { border-color: #fff; }

        /* Sections */
        .pm-sec { background: #fff; padding: 104px 64px; }
        .pm-sec--alt { background: #f8fafc; }
        .pm-wrap { max-width: 1180px; margin: 0 auto; }
        .pm-wrap--narrow { max-width: 1080px; }
        .pm-wrap--timeline { max-width: 880px; }
        .pm-head { display: flex; flex-direction: column; align-items: center; gap: 14px; text-align: center; margin-bottom: 52px; }
        .pm-head__sub { margin: 0; font-size: 15px; color: #4a5568; line-height: 1.7; max-width: 560px; }
        .pm-eyebrow { font-size: 12px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: #2563eb; }
        .pm-h2 { margin: 0; font-size: 42px; font-weight: 700; color: #0f1f3d; letter-spacing: -0.5px; line-height: 1.2; }
        .pm-h2--left { text-align: left; }
        .pm-h2--dark { color: #fff; }
        .pm-body { margin: 0; font-size: 15px; color: #4a5568; line-height: 1.8; }

        /* Hero */
        .pm-hero { position: relative; overflow: hidden; background: linear-gradient(165deg, #0c1a33 0%, #15294c 55%, #0f1f3d 100%); }
        .pm-hero__glow { position: absolute; top: -180px; right: -120px; width: 720px; height: 560px; border-radius: 50%; background: radial-gradient(ellipse, rgba(37,99,235,0.22) 0%, transparent 65%); pointer-events: none; animation: pmGlow 18s ease-in-out infinite alternate; }
        .pm-hero__grid { position: absolute; inset: 0; pointer-events: none; background-image: repeating-linear-gradient(0deg, rgba(148,180,255,0.045) 0px, rgba(148,180,255,0.045) 1px, transparent 1px, transparent 90px), repeating-linear-gradient(90deg, rgba(148,180,255,0.045) 0px, rgba(148,180,255,0.045) 1px, transparent 1px, transparent 90px); -webkit-mask-image: radial-gradient(ellipse at 50% 0%, #000 30%, transparent 78%); mask-image: radial-gradient(ellipse at 50% 0%, #000 30%, transparent 78%); }
        .pm-hero__inner { position: relative; max-width: 900px; margin: 0 auto; padding: 108px 64px 96px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 26px; }
        .pm-hero__kicker { font-size: 12px; font-weight: 700; letter-spacing: 4px; text-transform: uppercase; color: #4a90d9; }
        .pm-hero__title { margin: 0; font-size: 72px; font-weight: 800; color: #fff; line-height: 1.05; letter-spacing: -1px; text-transform: uppercase; }
        .pm-hero__title span { color: #4a90d9; }
        .pm-hero__sub { margin: 0; font-size: 18px; font-weight: 300; color: rgba(255,255,255,0.75); line-height: 1.7; max-width: 600px; }
        .pm-hero__btns { display: flex; gap: 14px; margin-top: 8px; flex-wrap: wrap; justify-content: center; }
        .pm-hero__trust { display: flex; gap: 28px; margin-top: 10px; flex-wrap: wrap; justify-content: center; }
        .pm-hero__trust-item { display: inline-flex; align-items: center; gap: 7px; font-size: 12.5px; font-weight: 600; color: rgba(255,255,255,0.7); }
        .pm-hero__trust-item svg { color: #4a90d9; }

        /* What we do split */
        .pm-split { max-width: 1100px; margin: 0 auto; display: grid; grid-template-columns: 1.1fr 1fr; gap: 72px; align-items: center; }
        .pm-split__copy { display: flex; flex-direction: column; align-items: flex-start; gap: 18px; }
        .pm-managed { background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 28px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); display: flex; flex-direction: column; }
        .pm-managed__row { display: flex; justify-content: space-between; align-items: center; padding: 17px 0; border-bottom: 1px solid #eef2f7; }
        .pm-managed__row:last-child { border-bottom: none; }
        .pm-managed__label { font-size: 14.5px; font-weight: 600; color: #0f1f3d; }
        .pm-managed__pill { font-size: 11px; font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase; color: #2563eb; background: #eff6ff; border-radius: 999px; padding: 5px 12px; }

        /* Services */
        .pm-services { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
        .pm-service { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 28px 24px; display: flex; flex-direction: column; gap: 12px; transition: transform 0.3s, box-shadow 0.3s, border-color 0.3s; }
        .pm-service:hover { transform: translateY(-4px); border-color: #2563eb; box-shadow: 0 20px 50px rgba(0,0,0,0.1); }
        .pm-service__chip { width: 44px; height: 44px; border-radius: 8px; background: #eff6ff; display: inline-flex; align-items: center; justify-content: center; color: #2563eb; }
        .pm-service__title { font-size: 15.5px; font-weight: 700; color: #0f1f3d; }
        .pm-service__desc { font-size: 13px; color: #4a5568; line-height: 1.7; }

        /* Navy band */
        .pm-navy { position: relative; overflow: hidden; background: linear-gradient(165deg, #0c1a33 0%, #15294c 55%, #0f1f3d 100%); padding: 104px 64px; }
        .pm-navy__glow { position: absolute; top: -160px; right: -100px; width: 620px; height: 480px; border-radius: 50%; background: radial-gradient(ellipse, rgba(37,99,235,0.18) 0%, transparent 65%); pointer-events: none; }
        .pm-navy__sub { margin: 0; font-size: 15px; color: rgba(255,255,255,0.55); line-height: 1.75; }
        .pm-rra { position: relative; max-width: 1080px; margin: 0 auto; display: flex; flex-direction: column; gap: 44px; }
        .pm-rra__head { display: flex; align-items: flex-start; justify-content: space-between; gap: 48px; }
        .pm-rra__intro { display: flex; flex-direction: column; gap: 14px; align-items: flex-start; max-width: 620px; }
        .pm-badge { font-size: 11px; font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase; color: #fc8181; background: rgba(229,62,62,0.15); border: 1px solid rgba(229,62,62,0.35); border-radius: 6px; padding: 5px 13px; }
        .pm-fine { flex-shrink: 0; background: rgba(229,62,62,0.1); border: 1px solid rgba(229,62,62,0.25); border-radius: 8px; padding: 28px 38px; text-align: center; }
        .pm-fine__num { font-size: 40px; font-weight: 800; color: #fc8181; line-height: 1; }
        .pm-fine__label { font-size: 13px; color: rgba(255,255,255,0.5); margin-top: 8px; }
        .pm-changes { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 2px; }
        .pm-change { border-left: 3px solid #2563eb; padding: 22px 26px; background: rgba(255,255,255,0.04); display: flex; flex-direction: column; gap: 8px; }
        .pm-change__num { font-size: 12px; font-weight: 700; letter-spacing: 1px; color: rgba(255,255,255,0.25); }
        .pm-change__title { font-size: 17px; font-weight: 700; color: #fff; }
        .pm-change__body { font-size: 14px; color: rgba(255,255,255,0.55); line-height: 1.65; }
        .pm-handle { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 30px 34px; display: flex; flex-direction: column; gap: 24px; }
        .pm-handle__label { font-size: 11px; font-weight: 700; letter-spacing: 1.3px; text-transform: uppercase; color: rgba(255,255,255,0.35); }
        .pm-handle__grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; }
        .pm-handle__item { display: flex; gap: 12px; align-items: flex-start; }
        .pm-handle__tick { width: 20px; height: 20px; border-radius: 50%; background: rgba(37,99,235,0.3); border: 1px solid rgba(74,144,217,0.4); display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px; color: #4a90d9; }
        .pm-handle__name { font-size: 14px; font-weight: 600; color: #fff; }
        .pm-handle__sub { font-size: 12px; color: rgba(255,255,255,0.4); margin-top: 3px; }
        .pm-handle__cta { border-top: 1px solid rgba(255,255,255,0.08); padding-top: 24px; display: flex; align-items: center; justify-content: space-between; gap: 20px; }
        .pm-handle__q { font-size: 20px; font-weight: 700; color: #fff; line-height: 1.3; }

        /* Compliance */
        .pm-compliance { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .pm-comp { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 22px 26px; display: flex; flex-direction: column; gap: 8px; }
        .pm-comp--new { background: #fff; border-color: rgba(229,62,62,0.35); box-shadow: 0 8px 24px rgba(229,62,62,0.08); }
        .pm-comp__top { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .pm-comp__title { font-size: 16px; font-weight: 700; color: #0f1f3d; }
        .pm-comp__pill { font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 999px; }
        .pm-comp__freq { margin-left: auto; font-size: 12px; font-weight: 600; color: #718096; }
        .pm-comp__detail { font-size: 13.5px; color: #4a5568; line-height: 1.7; }

        /* Timeline */
        .pm-timeline { display: flex; flex-direction: column; }
        .pm-tl { display: flex; gap: 26px; align-items: flex-start; }
        .pm-tl__rail { display: flex; flex-direction: column; align-items: center; flex-shrink: 0; align-self: stretch; }
        .pm-tl__dot { width: 52px; height: 52px; border-radius: 50%; background: linear-gradient(135deg, #2563eb, #4a90d9); display: inline-flex; align-items: center; justify-content: center; color: #fff; font-weight: 800; font-size: 15px; flex-shrink: 0; }
        .pm-tl__line { width: 2px; flex: 1; min-height: 32px; background: #e2e8f0; margin: 8px 0; }
        .pm-tl__body { display: flex; flex-direction: column; gap: 6px; padding: 12px 0 36px; }
        .pm-tl:last-child .pm-tl__body { padding-bottom: 0; }
        .pm-tl__title { font-size: 18px; font-weight: 700; color: #0f1f3d; }
        .pm-tl__text { font-size: 14.5px; color: #4a5568; line-height: 1.7; }

        /* Differentiators */
        .pm-diffs { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        .pm-diff { background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 8px; padding: 32px 26px; display: flex; flex-direction: column; gap: 12px; transition: transform 0.3s, box-shadow 0.3s, border-color 0.3s; }
        .pm-diff:hover { transform: translateY(-4px); border-color: #2563eb; box-shadow: 0 20px 50px rgba(0,0,0,0.1); }
        .pm-diff__chip { width: 48px; height: 48px; border-radius: 8px; background: #eff6ff; display: inline-flex; align-items: center; justify-content: center; color: #2563eb; }
        .pm-diff__title { font-size: 16px; font-weight: 700; color: #0f1f3d; }
        .pm-diff__body { font-size: 14px; color: #4a5568; line-height: 1.7; }

        /* FAQ */
        .pm-faqwrap { max-width: 820px; margin: 0 auto; }
        .pm-faqs { display: flex; flex-direction: column; gap: 12px; }
        .pm-faq { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; transition: border-color 0.2s; }
        .pm-faq--open { border-color: #2563eb; }
        .pm-faq__q { width: 100%; display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 20px 24px; background: none; border: none; cursor: pointer; text-align: left; font-family: inherit; }
        .pm-faq__q span:first-child { font-weight: 600; font-size: 15px; color: #0f1f3d; }
        .pm-faq__plus { color: #2563eb; font-size: 22px; font-weight: 300; flex-shrink: 0; line-height: 1; transition: transform 0.25s ease; }
        .pm-faq--open .pm-faq__plus { transform: rotate(45deg); }
        .pm-faq__panel { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 0.25s ease; }
        .pm-faq--open .pm-faq__panel { grid-template-rows: 1fr; }
        .pm-faq__inner { overflow: hidden; }
        .pm-faq__a { margin: 0; padding: 0 24px 20px; color: #4a5568; line-height: 1.7; font-size: 14.5px; }

        /* CTA band */
        .pm-cta { position: relative; overflow: hidden; background: linear-gradient(165deg, #0c1a33 0%, #15294c 55%, #0f1f3d 100%); padding: 96px 64px; text-align: center; }
        .pm-cta__orb { position: absolute; top: -160px; right: -100px; width: 600px; height: 480px; border-radius: 50%; background: radial-gradient(ellipse, rgba(37,99,235,0.2) 0%, transparent 65%); pointer-events: none; }
        .pm-cta__inner { position: relative; max-width: 680px; margin: 0 auto; display: flex; flex-direction: column; align-items: center; gap: 22px; }
        .pm-cta__title { margin: 0; font-size: 46px; font-weight: 800; color: #fff; letter-spacing: -0.5px; line-height: 1.15; text-transform: uppercase; }
        .pm-cta__sub { margin: 0; font-size: 16px; font-weight: 300; color: rgba(255,255,255,0.72); line-height: 1.7; max-width: 540px; }

        @keyframes pmGlow { from { transform: translate(0,0) scale(1); } to { transform: translate(-40px,30px) scale(1.12); } }
        @media (prefers-reduced-motion: reduce) {
          .pm-hero__glow { animation: none; }
        }

        /* ── Tablet ── */
        @media (max-width: 960px) {
          .pm-sec { padding: 72px 32px; }
          .pm-navy { padding: 72px 32px; }
          .pm-cta { padding: 72px 32px; }
          .pm-split { grid-template-columns: 1fr; gap: 36px; max-width: 620px; }
          .pm-h2--left { text-align: left; }
          .pm-services { grid-template-columns: repeat(2, 1fr); }
          .pm-changes { grid-template-columns: 1fr; }
          .pm-handle__grid { grid-template-columns: 1fr; }
          .pm-compliance { grid-template-columns: 1fr; }
          .pm-diffs { grid-template-columns: repeat(2, 1fr); }
          .pm-rra__head { flex-direction: column; gap: 24px; }
          .pm-fine { align-self: stretch; }
        }

        /* ── Mobile ── */
        @media (max-width: 640px) {
          .pm-sec { padding: 56px 24px; }
          .pm-navy { padding: 56px 24px; }
          .pm-cta { padding: 60px 24px 110px; }
          .pm-hero__inner { padding: 56px 24px 52px; gap: 20px; }
          .pm-hero__kicker { font-size: 10px; letter-spacing: 2.6px; }
          .pm-hero__title { font-size: 38px; line-height: 1.08; letter-spacing: -0.8px; }
          .pm-hero__sub { font-size: 14.5px; }
          .pm-hero__btns { flex-direction: column; width: 100%; }
          .pm-btn--wide, .pm-btn--cta { width: 100%; padding: 17px 0; }
          .pm-h2 { font-size: 26px; line-height: 1.25; }
          .pm-head { margin-bottom: 22px; }

          /* Services become one checklist card */
          .pm-services { grid-template-columns: 1fr; gap: 0; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 4px 18px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
          .pm-service { flex-direction: row; align-items: center; gap: 12px; padding: 13px 0; border: none; border-bottom: 1px solid #f1f5f9; border-radius: 0; box-shadow: none; }
          .pm-service:hover { transform: none; box-shadow: none; border-color: transparent; border-bottom: 1px solid #f1f5f9; }
          .pm-services .pm-service:last-child { border-bottom: none; }
          .pm-service__chip { width: 24px; height: 24px; background: transparent; flex-shrink: 0; }
          .pm-service__title { font-size: 13.5px; }
          .pm-service__desc { display: none; }

          /* Renters' rights stacked */
          .pm-rra { gap: 20px; }
          .pm-fine { padding: 20px 24px; text-align: left; }
          .pm-fine__num { font-size: 30px; }
          .pm-handle__cta { flex-direction: column; align-items: stretch; }
          .pm-btn--inline { width: 100%; padding: 16px 0; }
          .pm-handle__q { font-size: 17px; }

          .pm-diffs { grid-template-columns: 1fr; }
          .pm-cta__title { font-size: 28px; }
        }
      `}</style>
    </div>
  );
}
