'use client';
// app/landlord-registration/page.tsx
// Overview / landing page. The actual form lives at /landlord-registration/apply.
// Redesigned "trust-first" structure (why-register + comparison + package modals + FAQ).
// Prices are sourced from lib/bundles.ts (never hard-coded); shared Navbar/Footer are used;
// every registration CTA routes to /landlord-registration/apply.
import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Check,
  X,
  ChevronDown,
  ShieldCheck,
  Clock3,
  UserCheck,
  FileCheck2,
  TrendingUp,
  Home as HomeIcon,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { BUNDLES } from '@/lib/bundles';

const theme = {
  navyDeep: '#0B2033',
  navy: '#123350',
  navySoft: '#1F4B6E',
  sand: '#F4F5F1',
  card: '#FFFFFF',
  gold: '#BD8A46',
  goldSoft: '#E7D2A6',
  ink: '#1D2A35',
  inkSoft: '#54626F',
  success: '#2E6B52',
  border: '#E3E4DE',
};

/* ---------- scroll reveal ---------- */
function useInView(options?: IntersectionObserverInit): [React.RefObject<HTMLDivElement>, boolean] {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.unobserve(el);
        }
      },
      options || { threshold: 0.2 }
    );
    obs.observe(el);
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return [ref, inView];
}

function Reveal({
  children,
  delay = 0,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  style?: React.CSSProperties;
}) {
  const [ref, inView] = useInView();
  return (
    <div
      ref={ref}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0px)' : 'translateY(22px)',
        transition: `opacity 0.6s ease ${delay}s, transform 0.6s ease ${delay}s`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ---------- content ---------- */
const whyPoints = [
  {
    icon: HomeIcon,
    title: 'A Fully Managed Service',
    body: 'We handle tenant sourcing, referencing, property inspections, maintenance requests and rent collection, so these tasks do not fall to you.',
  },
  {
    icon: ShieldCheck,
    title: 'Complete UK Compliance Tracking',
    body: 'We arrange and monitor your Energy Performance Certificate, Gas Safety Certificate, Electrical Installation Condition Report and deposit protection, so your property remains legally lettable.',
  },
  {
    icon: TrendingUp,
    title: 'Clear, Published Pricing',
    body: 'Every fee is published on our website before you register. No charge is disclosed only after you have signed an agreement.',
  },
  {
    icon: UserCheck,
    title: 'One Named Local Agent',
    body: 'Your property is managed by one agent based in Leeds or Manchester, rather than a shared or rotating team.',
  },
  {
    icon: Clock3,
    title: 'A Response Within 24 To 48 Hours',
    body: 'Every registration is reviewed and answered with a tailored proposal within two working days.',
  },
  {
    icon: FileCheck2,
    title: 'No Obligation To Proceed',
    body: 'Registering is free and does not create a contract. You review the proposal and decide whether to continue.',
  },
];

const comparison = [
  {
    label: 'Published pricing',
    hol: 'Shown in full on our website before you register',
    other: 'Often disclosed only after a phone call',
  },
  {
    label: 'Point of contact',
    hol: 'One named local agent for your property',
    other: 'Frequently a shared or rotating team',
  },
  {
    label: 'Compliance tracking',
    hol: 'EPC, Gas Safety, EICR and deposit protection tracked for you',
    other: 'Varies by branch and package',
  },
  {
    label: 'Response time',
    hol: 'A tailored proposal within 24 to 48 hours',
    other: 'Varies, and can extend during busy periods',
  },
  {
    label: 'Commitment to register',
    hol: 'Free, with no obligation to proceed',
    other: 'Varies by agency',
  },
];

// Editorial copy per package, keyed by bundle id. Prices/fees are NOT stored here:
// they are read live from lib/bundles.ts so this page can never drift from /pricing.
const PKG_COPY: Record<string, { summary: string; details: string[] }> = {
  'virtual-tenant-find': {
    summary:
      'For landlords who intend to manage the tenancy directly and need a fully referenced tenant found quickly.',
    details: [
      'Marketing across major listing portals',
      'Applicant screening and full reference checks',
      'Right to Rent verification',
      'Tenancy agreement prepared and signed',
      'A remote service, with no property visit included',
    ],
  },
  'expert-tenant-find': {
    summary:
      'Includes everything in Virtual Tenant Find, with professional photography and an in-person handover to attract stronger applicants.',
    details: [
      'Everything included in Virtual Tenant Find',
      'Professional photography of the property',
      'Accompanied viewings with prospective tenants',
      'An in-person key handover and move-in check',
      'You continue to manage the tenancy directly',
    ],
  },
  'essential-management': {
    summary:
      'For landlords who want rent collection handled for them while remaining in control of repairs and contractor choice.',
    details: [
      'Rent collection and payment monitoring',
      'Arrears follow up on your behalf',
      'Monthly financial statements',
      'You approve and arrange repairs directly',
    ],
  },
  'full-management': {
    summary:
      'Our most requested package. Rent, maintenance, contractor coordination and compliance are managed by your local team.',
    details: [
      'Everything included in Essential Management',
      'Maintenance requests handled and coordinated',
      'Access to an approved contractor network',
      'Ongoing compliance tracking and renewal reminders',
    ],
  },
  'comprehensive-management': {
    summary:
      'Everything in Full Management, with additional protection for your rental income and legal position.',
    details: [
      'Everything included in Full Management',
      'Emergency maintenance support',
      'Property inspections with a written report',
      'Rent guarantee cover',
      'Legal and eviction expense protection',
      'A priority contractor response time',
    ],
  },
};

type PkgView = {
  id: string;
  name: string;
  setup: string;
  fee: string;
  summary: string;
  details: string[];
  highlight: boolean;
};

// Build the package cards from the single source of truth. Setup fee + management
// percentage come straight from BUNDLES; only the descriptive copy is editorial.
const packages: PkgView[] = BUNDLES.map((b) => ({
  id: b.id,
  name: b.label,
  setup: `${b.setupFee} set up fees`,
  fee: b.mgmtFee ? `${b.mgmtFee} management fees` : 'No management fees',
  summary: PKG_COPY[b.id]?.summary ?? b.blurb,
  details: PKG_COPY[b.id]?.details ?? [],
  highlight: Boolean(b.badge),
}));

const faqs = [
  {
    q: 'Why register my property with House of Lettings?',
    a: 'Registering gives our lettings team the information required to prepare a tailored management proposal for your property. We handle tenant finding, referencing, rent collection, maintenance and full legal compliance across Leeds and Manchester, supported by one named local agent for your portfolio.',
  },
  {
    q: 'What documents will I need to let my property legally in the UK?',
    a: 'You will need a valid Energy Performance Certificate rated E or above, a current Gas Safety Certificate renewed annually where the property has gas appliances, an Electrical Installation Condition Report renewed every 5 years, and working smoke and carbon monoxide alarms. If you choose a managed package, we arrange and track each of these on your behalf.',
  },
  {
    q: "Do I have to protect my tenant's deposit?",
    a: 'Yes. Where House of Lettings holds a tenancy deposit, it is protected in a government approved scheme, either the Deposit Protection Service, mydeposits or the Tenancy Deposit Scheme, within 30 days of receipt, and the required information is provided to your tenant.',
  },
  {
    q: 'Is registering a commitment or a contract?',
    a: 'No. Registering your property is free and does not create a contract. As part of registration you review and electronically sign a Residential Lettings and Management Agreement, and the full terms are shown on screen before you sign. Either party may decide not to proceed after registration.',
  },
  {
    q: 'How many properties can I register?',
    a: 'You may register as many properties as you own. If you manage a portfolio, mention this when you register, and your local agent will prepare a proposal that covers each property.',
  },
];

const complianceCards = [{ label: 'EPC' }, { label: 'Gas Safety' }, { label: 'EICR' }, { label: 'Deposit' }];

const eyebrowStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.16em',
  color: theme.gold,
  margin: 0,
};

/* ---------- small components ---------- */
function TrustPill({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        borderRadius: 999,
        padding: '8px 16px',
        fontSize: 14,
        background: 'rgba(255,255,255,0.08)',
        color: theme.sand,
      }}
    >
      <Check size={15} style={{ color: theme.gold }} />
      <span>{children}</span>
    </div>
  );
}

function ComplianceFan() {
  const [fanned, setFanned] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setFanned(true), 350);
    return () => clearTimeout(t);
  }, []);
  const rotations = [-14, -4, 6, 16];
  const shifts = [-54, -18, 18, 54];
  return (
    <div style={{ position: 'relative', height: 288, width: '100%', maxWidth: 384, margin: '0 auto' }} aria-hidden="true">
      {complianceCards.map((c, i) => (
        <div
          key={c.label}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            display: 'flex',
            height: 160,
            width: 112,
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 12,
            textAlign: 'center',
            boxShadow: '0 12px 28px rgba(11,32,51,0.25)',
            background: theme.card,
            border: `1px solid ${theme.border}`,
            transform: fanned
              ? `translate(-50%, -50%) translateX(${shifts[i]}px) rotate(${rotations[i]}deg)`
              : 'translate(-50%, -50%) translateX(0px) rotate(0deg)',
            transition: `transform 0.8s cubic-bezier(.2,.8,.2,1) ${i * 0.09}s`,
            zIndex: i,
          }}
        >
          <FileCheck2 size={22} style={{ color: theme.success }} />
          <span style={{ marginTop: 8, padding: '0 8px', fontSize: 12, fontWeight: 600, color: theme.ink }}>
            {c.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function PackageModal({ pkg, onClose }: { pkg: PkgView | null; onClose: () => void }) {
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 10);
    return () => clearTimeout(t);
  }, []);
  if (!pkg) return null;
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        background: 'rgba(11,32,51,0.55)',
        backdropFilter: 'blur(3px)',
        opacity: entered ? 1 : 0,
        transition: 'opacity 0.25s ease',
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={pkg.name}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 512,
          borderRadius: 16,
          padding: 32,
          boxShadow: '0 24px 60px rgba(11,32,51,0.35)',
          background: theme.card,
          transform: entered ? 'scale(1) translateY(0px)' : 'scale(0.94) translateY(10px)',
          opacity: entered ? 1 : 0,
          transition: 'transform 0.3s cubic-bezier(.2,.8,.2,1), opacity 0.3s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close package details"
          style={{
            position: 'absolute',
            right: 20,
            top: 20,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 999,
            border: 'none',
            padding: 6,
            cursor: 'pointer',
            background: theme.sand,
            color: theme.ink,
          }}
        >
          <X size={16} />
        </button>
        <p style={{ ...eyebrowStyle, letterSpacing: '0.08em' }}>
          {pkg.setup} &middot; {pkg.fee}
        </p>
        <h3 style={{ marginTop: 8, fontSize: 24, color: theme.ink, fontFamily: "'Fraunces', serif", fontWeight: 600 }}>
          {pkg.name}
        </h3>
        <p style={{ marginTop: 12, fontSize: 14, lineHeight: 1.6, color: theme.inkSoft }}>{pkg.summary}</p>
        <ul style={{ marginTop: 20, listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {pkg.details.map((d) => (
            <li key={d} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: theme.ink }}>
              <Check size={16} style={{ marginTop: 2, flexShrink: 0, color: theme.success }} />
              <span>{d}</span>
            </li>
          ))}
        </ul>
        <Link
          href="/landlord-registration/apply"
          className="lr-btn"
          style={{
            marginTop: 28,
            display: 'block',
            borderRadius: 8,
            padding: '14px 20px',
            textAlign: 'center',
            fontSize: 14,
            fontWeight: 600,
            textDecoration: 'none',
            background: theme.navy,
            color: '#fff',
          }}
        >
          Select {pkg.name} And Register
        </Link>
      </div>
    </div>
  );
}

function FaqItem({ item, isOpen, onToggle }: { item: { q: string; a: string }; isOpen: boolean; onToggle: () => void }) {
  return (
    <div style={{ borderBottom: `1px solid ${theme.border}` }}>
      <button
        onClick={onToggle}
        style={{
          display: 'flex',
          width: '100%',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          padding: '20px 0',
          textAlign: 'left',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontFamily: "'IBM Plex Sans', sans-serif",
        }}
      >
        <span style={{ fontSize: 16, fontWeight: 500, color: theme.ink }}>{item.q}</span>
        <ChevronDown
          size={18}
          style={{
            color: theme.gold,
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s ease',
            flexShrink: 0,
          }}
        />
      </button>
      <div
        style={{
          display: 'grid',
          gridTemplateRows: isOpen ? '1fr' : '0fr',
          transition: 'grid-template-rows 0.35s ease',
        }}
      >
        <div style={{ overflow: 'hidden' }}>
          <p style={{ padding: '0 32px 20px 0', fontSize: 14, lineHeight: 1.6, color: theme.inkSoft, margin: 0 }}>
            {item.a}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ---------- page ---------- */
export default function LandlordRegistrationPage() {
  const [activePkg, setActivePkg] = useState<PkgView | null>(null);
  const [openFaq, setOpenFaq] = useState<number>(0);

  return (
    <>
      <style>{PAGE_CSS}</style>
      <Navbar />

      <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", background: theme.sand }}>
        {/* hero */}
        <section
          style={{
            position: 'relative',
            overflow: 'hidden',
            padding: 'clamp(56px, 8vw, 96px) clamp(20px, 5%, 48px)',
            background: `linear-gradient(180deg, ${theme.navyDeep}, ${theme.navy})`,
          }}
        >
          <div className="lr-hero" style={{ maxWidth: 1152, margin: '0 auto' }}>
            <div>
              <p style={{ ...eyebrowStyle, letterSpacing: '0.18em' }}>Landlord Registration &middot; Leeds &amp; Manchester</p>
              <h1
                style={{
                  marginTop: 16,
                  fontSize: 'clamp(34px, 4.5vw, 52px)',
                  lineHeight: 1.12,
                  color: '#fff',
                  fontFamily: "'Fraunces', serif",
                  fontWeight: 600,
                }}
              >
                Register Your Property With A Local Letting Agent You Can Trust
              </h1>
              <p style={{ marginTop: 20, maxWidth: 460, fontSize: 16, lineHeight: 1.65, color: '#C7D0D8' }}>
                Complete one short form to receive a tailored management proposal within 24 to 48 hours. Registration is
                free, and you decide whether to proceed after you receive it.
              </p>
              <div style={{ marginTop: 32, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                <Link
                  href="/landlord-registration/apply"
                  className="lr-btn"
                  style={{
                    borderRadius: 8,
                    padding: '14px 24px',
                    fontSize: 14,
                    fontWeight: 600,
                    textDecoration: 'none',
                    background: theme.gold,
                    color: theme.navyDeep,
                  }}
                >
                  Start Your Registration
                </Link>
                <a
                  href="#packages"
                  className="lr-btn"
                  style={{
                    borderRadius: 8,
                    padding: '14px 24px',
                    fontSize: 14,
                    fontWeight: 600,
                    textDecoration: 'none',
                    background: 'rgba(255,255,255,0.08)',
                    color: '#fff',
                  }}
                >
                  Compare Our Packages
                </a>
              </div>
              <div style={{ marginTop: 32, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                <TrustPill>Free to register</TrustPill>
                <TrustPill>No obligation to proceed</TrustPill>
                <TrustPill>Response within 24 to 48 hours</TrustPill>
              </div>
            </div>
            <div style={{ animation: 'lrfloat 5s ease-in-out infinite' }}>
              <ComplianceFan />
            </div>
          </div>
        </section>

        {/* why register */}
        <section style={{ padding: 'clamp(56px, 8vw, 80px) clamp(20px, 5%, 48px)' }}>
          <div style={{ maxWidth: 1152, margin: '0 auto' }}>
            <Reveal>
              <p style={eyebrowStyle}>Why Register</p>
              <h2
                style={{
                  marginTop: 12,
                  maxWidth: 640,
                  fontSize: 'clamp(28px, 3.6vw, 38px)',
                  color: theme.ink,
                  fontFamily: "'Fraunces', serif",
                  fontWeight: 600,
                }}
              >
                Why Landlords Choose House Of Lettings
              </h2>
              <p style={{ marginTop: 16, maxWidth: 640, fontSize: 16, lineHeight: 1.6, color: theme.inkSoft }}>
                Many letting agents promise good service. Our registration process is built to show you the difference in
                pricing, communication and compliance before you commit to anything.
              </p>
            </Reveal>

            {/* comparison table */}
            <Reveal delay={0.1} style={{ marginTop: 40 }}>
              <div className="lr-tablewrap">
                <table className="lr-table">
                  <thead>
                    <tr style={{ background: theme.navy, color: '#fff' }}>
                      <th style={{ fontWeight: 500 }}>What matters to landlords</th>
                      <th style={{ fontWeight: 600, color: theme.goldSoft }}>House of Lettings</th>
                      <th style={{ fontWeight: 500 }}>Typical letting agents</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparison.map((row, i) => (
                      <tr key={row.label} style={{ background: i % 2 === 0 ? theme.card : theme.sand }}>
                        <td style={{ fontWeight: 500, color: theme.ink }}>{row.label}</td>
                        <td style={{ color: theme.ink }}>
                          <span style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                            <Check size={15} style={{ marginTop: 2, flexShrink: 0, color: theme.success }} />
                            {row.hol}
                          </span>
                        </td>
                        <td style={{ color: theme.inkSoft }}>{row.other}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Reveal>

            {/* benefit cards */}
            <div className="lr-grid3" style={{ marginTop: 40 }}>
              {whyPoints.map((p, i) => {
                const Icon = p.icon;
                return (
                  <Reveal key={p.title} delay={0.05 * i} style={{ height: '100%' }}>
                    <div
                      className="lr-lift"
                      style={{
                        height: '100%',
                        borderRadius: 16,
                        padding: 24,
                        boxShadow: '0 1px 3px rgba(11,32,51,0.06)',
                        background: theme.card,
                        border: `1px solid ${theme.border}`,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          height: 40,
                          width: 40,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 8,
                          background: theme.sand,
                        }}
                      >
                        <Icon size={19} style={{ color: theme.gold }} />
                      </div>
                      <h3 style={{ marginTop: 16, fontSize: 16, fontWeight: 600, color: theme.ink }}>{p.title}</h3>
                      <p style={{ marginTop: 8, fontSize: 14, lineHeight: 1.6, color: theme.inkSoft }}>{p.body}</p>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* packages */}
        <section id="packages" style={{ padding: 'clamp(56px, 8vw, 80px) clamp(20px, 5%, 48px)', background: theme.card }}>
          <div style={{ maxWidth: 1152, margin: '0 auto' }}>
            <Reveal>
              <p style={eyebrowStyle}>Our Bundles</p>
              <h2
                style={{
                  marginTop: 12,
                  maxWidth: 640,
                  fontSize: 'clamp(28px, 3.6vw, 38px)',
                  color: theme.ink,
                  fontFamily: "'Fraunces', serif",
                  fontWeight: 600,
                }}
              >
                Services You Can Request
              </h2>
              <p style={{ marginTop: 16, maxWidth: 640, fontSize: 16, lineHeight: 1.6, color: theme.inkSoft }}>
                Select a package to see the full list of what is included. You choose your package during registration,
                and can change your mind before you sign.
              </p>
            </Reveal>

            <div className="lr-grid3" style={{ marginTop: 40 }}>
              {packages.map((pkg, i) => (
                <Reveal key={pkg.id} delay={0.05 * i} style={{ height: '100%' }}>
                  <button
                    onClick={() => setActivePkg(pkg)}
                    className="lr-lift"
                    style={{
                      display: 'flex',
                      height: '100%',
                      width: '100%',
                      flexDirection: 'column',
                      borderRadius: 16,
                      padding: 24,
                      textAlign: 'left',
                      cursor: 'pointer',
                      boxShadow: '0 1px 3px rgba(11,32,51,0.06)',
                      background: pkg.highlight ? theme.navy : theme.sand,
                      border: pkg.highlight ? `1px solid ${theme.navy}` : `1px solid ${theme.border}`,
                    }}
                  >
                    {pkg.highlight && (
                      <span
                        style={{
                          marginBottom: 12,
                          display: 'inline-block',
                          width: 'fit-content',
                          borderRadius: 999,
                          padding: '4px 12px',
                          fontSize: 12,
                          fontWeight: 600,
                          background: theme.gold,
                          color: theme.navyDeep,
                        }}
                      >
                        Most Popular
                      </span>
                    )}
                    <p style={{ fontSize: 12, fontWeight: 500, color: pkg.highlight ? theme.goldSoft : theme.inkSoft }}>
                      {pkg.setup} &middot; {pkg.fee}
                    </p>
                    <h3
                      style={{
                        marginTop: 8,
                        fontSize: 18,
                        fontWeight: 600,
                        color: pkg.highlight ? '#fff' : theme.ink,
                        fontFamily: "'Fraunces', serif",
                      }}
                    >
                      {pkg.name}
                    </h3>
                    <p
                      style={{
                        marginTop: 8,
                        flex: 1,
                        fontSize: 14,
                        lineHeight: 1.6,
                        color: pkg.highlight ? '#C7D0D8' : theme.inkSoft,
                      }}
                    >
                      {pkg.summary}
                    </p>
                    <span
                      style={{
                        marginTop: 16,
                        fontSize: 14,
                        fontWeight: 600,
                        color: pkg.highlight ? theme.goldSoft : theme.gold,
                      }}
                    >
                      View full details &rarr;
                    </span>
                  </button>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {activePkg && <PackageModal pkg={activePkg} onClose={() => setActivePkg(null)} />}

        {/* faq */}
        <section style={{ padding: 'clamp(56px, 8vw, 80px) clamp(20px, 5%, 48px)' }}>
          <div style={{ maxWidth: 768, margin: '0 auto' }}>
            <Reveal>
              <p style={eyebrowStyle}>Common Questions</p>
              <h2
                style={{
                  marginTop: 12,
                  fontSize: 'clamp(28px, 3.6vw, 34px)',
                  color: theme.ink,
                  fontFamily: "'Fraunces', serif",
                  fontWeight: 600,
                }}
              >
                Frequently Asked Questions
              </h2>
            </Reveal>
            <Reveal delay={0.1} style={{ marginTop: 32 }}>
              <div>
                {faqs.map((item, i) => (
                  <FaqItem
                    key={item.q}
                    item={item}
                    isOpen={openFaq === i}
                    onToggle={() => setOpenFaq(openFaq === i ? -1 : i)}
                  />
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* final cta */}
        <section
          id="apply"
          style={{
            padding: 'clamp(56px, 8vw, 80px) clamp(24px, 6%, 100px)',
            textAlign: 'center',
            background: `linear-gradient(135deg, ${theme.navyDeep}, ${theme.navy})`,
          }}
        >
          <Reveal>
            <h2
              style={{
                margin: '0 auto',
                maxWidth: 672,
                fontSize: 'clamp(28px, 3.6vw, 38px)',
                color: '#fff',
                fontFamily: "'Fraunces', serif",
                fontWeight: 600,
              }}
            >
              Ready To Register Your Property?
            </h2>
            <p style={{ margin: '16px auto 0', maxWidth: 576, fontSize: 16, lineHeight: 1.6, color: '#C7D0D8' }}>
              Complete the step by step registration and your local Leeds or Manchester agent will respond within 24 to 48
              hours.
            </p>
            <Link
              href="/landlord-registration/apply"
              className="lr-btn"
              style={{
                marginTop: 32,
                display: 'inline-block',
                borderRadius: 8,
                padding: '16px 32px',
                fontSize: 14,
                fontWeight: 600,
                textDecoration: 'none',
                background: theme.gold,
                color: theme.navyDeep,
              }}
            >
              Start Registration
            </Link>
          </Reveal>
        </section>

        <Footer />
      </div>
    </>
  );
}

const PAGE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');

  .lr-hero { display:grid; gap:48px; align-items:center; }
  @media(min-width:768px){ .lr-hero{ grid-template-columns:1fr 1fr; } }

  .lr-grid3 { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; }
  @media(max-width:1024px){ .lr-grid3{ grid-template-columns:repeat(2,1fr); } }
  @media(max-width:640px){ .lr-grid3{ grid-template-columns:1fr; } }

  .lr-lift { transition:transform 0.2s ease, box-shadow 0.2s ease; }
  .lr-lift:hover { transform:translateY(-4px); box-shadow:0 14px 30px rgba(11,32,51,0.10); }

  .lr-btn { transition:transform 0.2s ease, background 0.2s ease, filter 0.2s ease; }
  .lr-btn:hover { transform:translateY(-2px); filter:brightness(0.97); }

  .lr-tablewrap { overflow-x:auto; border-radius:16px; box-shadow:0 1px 3px rgba(11,32,51,0.08); }
  .lr-table { width:100%; min-width:640px; border-collapse:collapse; text-align:left; font-size:14px; }
  .lr-table th, .lr-table td { padding:16px 20px; vertical-align:top; }

  @media (prefers-reduced-motion: reduce) {
    .lr-lift, .lr-btn { transition:none !important; }
  }
  @keyframes lrfloat {
    0%, 100% { transform:translateY(0px); }
    50% { transform:translateY(-6px); }
  }
`;
