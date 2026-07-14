'use client';

import Link from 'next/link';
import { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import ServiceHero from '@/components/layout/ServiceHero';
import RevealCards from '@/components/RevealCards';

const colors = {
  navy: '#0f1f3d',
  navyLight: '#162a50',
  blue: '#2563eb',
  lightBlue: '#4a90d9',
  red: '#e53e3e',
  white: '#ffffff',
  offWhite: '#f8faff',
  lightGray: '#f1f5f9',
  borderGray: '#e2e8f0',
  textDark: '#1a202c',
  textMid: '#4a5568',
  textLight: '#718096',
};

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
    q: 'How do you handle the Renters\' Rights Act changes?',
    a: 'We are fully up to date with the Renters\' Rights Act 2025 (in force from 1 May 2026). We handle all Section 13 rent increase notices, provide the required Information Sheet to tenants, manage Section 8 proceedings, and ensure your tenancy agreements comply with the new periodic tenancy rules.',
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

const services = [
  {
    icon: '🏠',
    title: 'Tenant Finding & Referencing',
    desc: 'Professional photography, listings on Rightmove and Zoopla, accompanied viewings, and full tenant referencing including credit checks, employment verification, and previous landlord references.',
  },
  {
    icon: '💷',
    title: 'Rent Collection',
    desc: 'Monthly rent collection with automated reminders, arrears management, and prompt payment to your account, with full monthly statements.',
  },
  {
    icon: '🔍',
    title: 'Property Inspections',
    desc: 'Regular mid-tenancy inspections (typically every 3-6 months) with written reports and photographs, so you always know the condition of your investment.',
  },
  {
    icon: '🔧',
    title: 'Maintenance Coordination',
    desc: '24/7 tenant maintenance reporting, a trusted network of vetted local tradespeople, and transparent invoicing, with no hidden mark-ups on repairs.',
  },
  {
    icon: '📋',
    title: 'Legal Compliance',
    desc: 'We keep your property legally compliant: Gas Safety, EICR, EPC, Right to Rent checks, deposit protection, Renters\' Rights Act documentation, and all tenancy legislation updates.',
  },
  {
    icon: '📄',
    title: 'Tenancy Management',
    desc: 'From drafting legally compliant tenancy agreements to managing renewals, rent reviews (Section 13 notices), and end-of-tenancy checkout reports and deposit returns.',
  },
  {
    icon: '⚖️',
    title: 'Section 8 & Possession Proceedings',
    desc: 'Under the Renters\' Rights Act 2025, Section 21 is abolished. We manage Section 8 notices and possession proceedings correctly, with proper grounds and evidence, protecting your rights as a landlord.',
  },
  {
    icon: '🐾',
    title: 'Pet Policy Management',
    desc: 'The Renters\' Rights Act gives tenants the right to request pets. We manage these requests fairly and legally, including advising on pet damage insurance to protect your property.',
  },
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

export default function PropertyManagementPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div style={{ fontFamily: 'Poppins, sans-serif', color: colors.textDark, background: colors.white }}>
      <Navbar />
      <RevealCards />

      {/* Hero */}
      <ServiceHero
        eyebrow="Property Management · Leeds & Manchester"
        title={<>Property Management<br /><span style={{ color: '#4a90d9' }}>Done Properly.</span></>}
        subtitle="From finding your first tenant to navigating the Renters' Rights Act 2025, we manage your property so you don't have to worry about a thing."
        image="/images/Tenants_Book_viewing_background.webp"
        imageAlt="House of Lettings team advising landlord clients in the office"
        ctas={[
          { label: 'Book Valuation', href: '/book-valuation' },
          { label: 'View Packages', href: '/pricing', variant: 'ghost' },
        ]}
        trust={['Leeds & Manchester', 'No Hidden Fees', "Renters' Rights Act Compliant"]}
        float={{ label: 'Hidden fees', value: '£0', sub: 'One clear monthly fee' }}
      />

      {/* What is Property Management */}
      <section style={{ padding: '80px 24px', background: colors.white }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: 60, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 340px' }}>
              <p style={{ color: colors.blue, fontWeight: 600, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>What We Do</p>
              <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 36px)', fontWeight: 700, color: colors.navy, margin: '0 0 20px', lineHeight: 1.3 }}>
                Your Property.<br />Our Responsibility.
              </h2>
              <p style={{ color: colors.textMid, lineHeight: 1.8, marginBottom: 16 }}>
                Property management means we act as your professional representative, handling every aspect of your rental from day one. You retain ownership and receive rent; we handle everything else.
              </p>
              <p style={{ color: colors.textMid, lineHeight: 1.8 }}>
                The UK rental market has changed significantly in 2026. The Renters&apos; Rights Act 2025 abolished Section 21 &quot;no fault&quot; evictions, introduced rolling periodic tenancies, new pet rights, and strict documentation requirements. Getting it wrong can result in fines of up to £7,000. We make sure you&apos;re always on the right side of the law.
              </p>
            </div>
            <div style={{ flex: '1 1 300px' }}>
              {[
                { label: 'Tenant Finding', pct: 100 },
                { label: 'Rent Collection', pct: 100 },
                { label: 'Legal Compliance', pct: 100 },
                { label: 'Maintenance', pct: 100 },
                { label: 'Deposit Management', pct: 100 },
              ].map(({ label, pct }) => (
                <div key={label} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>
                    <span>{label}</span>
                    <span style={{ color: colors.blue }}>Fully Managed</span>
                  </div>
                  <div style={{ background: colors.lightGray, borderRadius: 4, height: 6 }}>
                    <div style={{ background: `linear-gradient(90deg, ${colors.blue}, ${colors.lightBlue})`, width: `${pct}%`, height: '100%', borderRadius: 4 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section style={{ padding: '80px 24px', background: colors.offWhite }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ color: colors.blue, fontWeight: 600, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Our Services</p>
            <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 38px)', fontWeight: 700, color: colors.navy, margin: '0 0 16px' }}>
              Everything Included. Nothing Extra.
            </h2>
            <p style={{ color: colors.textMid, maxWidth: 560, margin: '0 auto', lineHeight: 1.7 }}>
              Our fully managed service covers every aspect of your property: one fixed fee, complete peace of mind.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
            {services.map((s, i) => (
              <div key={s.title} className="hol-card hol-reveal" style={{
                background: colors.white,
                borderRadius: 12,
                padding: 28,
                border: `1px solid ${colors.borderGray}`,
                animationDelay: `${i * 55}ms`,
              }}>
                <div style={{ fontSize: 32, marginBottom: 14 }}>{s.icon}</div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: colors.navy, margin: '0 0 10px' }}>{s.title}</h3>
                <p style={{ color: colors.textMid, fontSize: 14, lineHeight: 1.7, margin: 0 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Renters Rights Act Section — redesigned */}
      <section style={{ padding: '80px 24px', background: colors.navy }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 40, flexWrap: 'wrap', marginBottom: 56 }}>
            <div style={{ flex: '1 1 320px' }}>
              <div style={{
                display: 'inline-block',
                background: 'rgba(229,62,62,0.15)',
                border: '1px solid rgba(229,62,62,0.35)',
                borderRadius: 6,
                padding: '4px 12px',
                color: '#fc8181',
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                marginBottom: 16,
              }}>
                In Force: 1 May 2026
              </div>
              <h2 style={{ color: colors.white, fontSize: 'clamp(24px, 3.5vw, 36px)', fontWeight: 700, margin: '0 0 14px', lineHeight: 1.25 }}>
                The Renters&apos; Rights Act 2025
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15, lineHeight: 1.7, margin: 0 }}>
                The biggest shake-up to UK renting in 30 years. Here&apos;s what changed, and what we handle so you don&apos;t have to.
              </p>
            </div>
            {/* Fine callout */}
            <div style={{
              flex: '0 0 auto',
              background: 'rgba(229,62,62,0.1)',
              border: '1px solid rgba(229,62,62,0.25)',
              borderRadius: 12,
              padding: '24px 32px',
              textAlign: 'center',
              minWidth: 200,
            }}>
              <div style={{ color: '#fc8181', fontSize: 36, fontWeight: 800, lineHeight: 1 }}>£7,000</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 6 }}>max fine for non-compliance</div>
            </div>
          </div>

          {/* Zone 1 — 3 key changes, horizontal */}
          <div style={{ marginBottom: 40 }}>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20 }}>
              What&apos;s Changed
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 2 }}>
              {[
                {
                  num: '01',
                  title: 'Section 21 Gone',
                  body: 'No-fault evictions are abolished. Possession now requires a valid Section 8 ground: rent arrears, property sale, anti-social behaviour.',
                },
                {
                  num: '02',
                  title: 'All Tenancies Periodic',
                  body: 'Fixed-term ASTs no longer exist. Every tenancy is now a rolling periodic contract from day one.',
                },
                {
                  num: '03',
                  title: 'Information Sheet Required',
                  body: 'Must be issued to every tenant before the tenancy begins. Fines up to £7,000 for failure. We issue it automatically.',
                },
              ].map((item, i) => (
                <div key={item.num} style={{
                  borderLeft: `3px solid ${i === 0 ? '#fc8181' : i === 1 ? colors.lightBlue : colors.blue}`,
                  padding: '20px 24px',
                  background: 'rgba(255,255,255,0.04)',
                }}>
                  <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 8 }}>{item.num}</div>
                  <div style={{ color: colors.white, fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{item.title}</div>
                  <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, lineHeight: 1.6 }}>{item.body}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Zone 2 — We handle checklist */}
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12,
            padding: '28px 32px',
          }}>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20 }}>
              We Also Handle
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
              {[
                { label: 'Section 13 rent increase notices', sub: 'Once per year, 2 months\' notice required' },
                { label: 'Tenant pet requests', sub: 'Cannot be unreasonably refused' },
                { label: 'Landlord database registration', sub: 'Coming later in 2026' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%',
                    background: 'rgba(37,99,235,0.3)',
                    border: '1px solid rgba(74,144,217,0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, marginTop: 2,
                    fontSize: 11, color: colors.lightBlue, fontWeight: 700,
                  }}>✓</div>
                  <div>
                    <div style={{ color: colors.white, fontSize: 14, fontWeight: 600 }}>{item.label}</div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 }}>{item.sub}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA line */}
            <div style={{
              marginTop: 28,
              paddingTop: 24,
              borderTop: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 20,
            }}>
              <p style={{ color: colors.white, fontSize: 20, fontWeight: 700, margin: 0, lineHeight: 1.3 }}>
                Not sure if your property is compliant?
              </p>
              <Link href="/book-valuation" style={{
                background: colors.blue,
                color: colors.white,
                padding: '14px 32px',
                borderRadius: 6,
                fontWeight: 700,
                fontSize: 15,
                textDecoration: 'none',
                display: 'inline-block',
                whiteSpace: 'nowrap',
              }}>
                Book Valuation
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* Compliance Checklist */}
      <section style={{ padding: '80px 24px', background: colors.white }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <p style={{ color: colors.blue, fontWeight: 600, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Legal Requirements</p>
            <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 36px)', fontWeight: 700, color: colors.navy, margin: '0 0 16px' }}>
              Landlord Compliance Checklist
            </h2>
            <p style={{ color: colors.textMid, maxWidth: 560, margin: '0 auto', lineHeight: 1.7 }}>
              Every property we manage is kept fully compliant. Here&apos;s what&apos;s legally required, and what we handle for you.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {complianceItems.map(item => (
              <div key={item.title} style={{
                display: 'flex',
                gap: 20,
                alignItems: 'flex-start',
                background: colors.offWhite,
                border: `1px solid ${colors.borderGray}`,
                borderRadius: 10,
                padding: '20px 24px',
              }}>
                <div style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: item.status === 'New for 2026' ? colors.red : item.status === 'Best Practice' ? colors.lightBlue : colors.blue,
                  marginTop: 6,
                  flexShrink: 0,
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: colors.navy, margin: 0 }}>{item.title}</h3>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '3px 10px',
                      borderRadius: 20,
                      background: item.status === 'New for 2026'
                        ? 'rgba(229,62,62,0.1)'
                        : item.status === 'Best Practice'
                          ? 'rgba(74,144,217,0.1)'
                          : 'rgba(37,99,235,0.1)',
                      color: item.status === 'New for 2026'
                        ? colors.red
                        : item.status === 'Best Practice'
                          ? colors.lightBlue
                          : colors.blue,
                    }}>
                      {item.status}
                    </span>
                  </div>
                  <p style={{ color: colors.textMid, fontSize: 14, lineHeight: 1.7, margin: '0 0 4px' }}>{item.detail}</p>
                  <p style={{ color: colors.textLight, fontSize: 13, margin: 0 }}>Frequency: <strong>{item.freq}</strong></p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section style={{ padding: '80px 24px', background: colors.offWhite }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ color: colors.blue, fontWeight: 600, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>The Process</p>
            <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 36px)', fontWeight: 700, color: colors.navy, margin: 0 }}>
              How It Works
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[
              {
                step: '01',
                title: 'Free Rental Valuation',
                body: 'We visit your property, assess the market, and give you an honest rental valuation, including advice on what improvements (if any) could increase your yield.',
              },
              {
                step: '02',
                title: 'Instruction & Preparation',
                body: 'We instruct a professional photographer, list your property on Rightmove and Zoopla, and carry out any agreed compliance certificates before marketing begins.',
              },
              {
                step: '03',
                title: 'Tenant Finding & Referencing',
                body: 'We conduct accompanied viewings, receive applications, and carry out full tenant referencing: credit checks, income verification, and previous landlord references.',
              },
              {
                step: '04',
                title: 'Tenancy Commencement',
                body: 'We prepare a legally compliant tenancy agreement, protect the deposit, issue all required documentation (including the Renters\' Rights Information Sheet), and conduct a detailed check-in inventory.',
              },
              {
                step: '05',
                title: 'Ongoing Management',
                body: 'We collect rent, handle maintenance, conduct regular inspections, manage renewals and rent reviews, and keep you updated, while you simply receive your monthly payment.',
              },
              {
                step: '06',
                title: 'End of Tenancy',
                body: 'We handle check-out, compare against the inventory, manage deposit returns or disputes, and begin the process of reletting your property to minimise any void period.',
              },
            ].map((step, i, arr) => (
              <div key={step.step} style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                  <div style={{
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${colors.blue}, ${colors.lightBlue})`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: colors.white,
                    fontWeight: 800,
                    fontSize: 15,
                  }}>
                    {step.step}
                  </div>
                  {i < arr.length - 1 && (
                    <div style={{ width: 2, flex: 1, minHeight: 40, background: colors.borderGray, margin: '8px 0' }} />
                  )}
                </div>
                <div style={{ paddingBottom: i < arr.length - 1 ? 36 : 0, paddingTop: 12 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: colors.navy, margin: '0 0 8px' }}>{step.title}</h3>
                  <p style={{ color: colors.textMid, lineHeight: 1.7, margin: 0 }}>{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section style={{ padding: '80px 24px', background: colors.white }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <p style={{ color: colors.blue, fontWeight: 600, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Why House of Lettings</p>
            <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 36px)', fontWeight: 700, color: colors.navy, margin: 0 }}>
              What Makes Us Different
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 24 }}>
            {[
              { icon: '📍', title: 'Leeds & Manchester Specialists', body: 'Deep local knowledge of both markets. We know the areas, the rents, and the demand.' },
              { icon: '💰', title: 'No Hidden Fees', body: 'One transparent monthly fee. No admin charges, no renewal fees, no mark-ups on maintenance.' },
              { icon: '⚡', title: 'Fast Maintenance Response', body: 'Tenant maintenance requests are responded to within 24 hours. Emergencies handled immediately.' },
              { icon: '📚', title: 'Compliance Experts', body: "Fully up to date with the Renters' Rights Act 2025 and all UK landlord legislation." },
              { icon: '📊', title: 'Regular Reporting', body: 'Monthly statements, inspection reports, and complete transparency on your property at all times.' },
              { icon: '🤝', title: 'Personal Service', body: 'You deal with a dedicated property manager (not a call centre) who knows your property.' },
            ].map((item, i) => (
              <div key={item.title} className="hol-card hol-reveal" style={{
                textAlign: 'center',
                padding: '32px 20px',
                background: colors.offWhite,
                borderRadius: 12,
                border: `1px solid ${colors.borderGray}`,
                animationDelay: `${i * 55}ms`,
              }}>
                <div style={{ fontSize: 36, marginBottom: 14 }}>{item.icon}</div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: colors.navy, margin: '0 0 8px' }}>{item.title}</h3>
                <p style={{ color: colors.textMid, fontSize: 14, lineHeight: 1.6, margin: 0 }}>{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: '80px 24px', background: colors.offWhite }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <p style={{ color: colors.blue, fontWeight: 600, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>FAQs</p>
            <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 36px)', fontWeight: 700, color: colors.navy, margin: 0 }}>
              Common Landlord Questions
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {faqs.map((faq, i) => (
              <div key={i} style={{
                background: colors.white,
                border: `1px solid ${openFaq === i ? colors.blue : colors.borderGray}`,
                borderRadius: 10,
                overflow: 'hidden',
                transition: 'border-color 0.2s',
              }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '20px 24px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    gap: 16,
                  }}
                >
                  <span style={{ fontWeight: 600, fontSize: 15, color: colors.navy }}>{faq.q}</span>
                  <span style={{
                    color: colors.blue,
                    fontSize: 20,
                    fontWeight: 300,
                    flexShrink: 0,
                    transform: openFaq === i ? 'rotate(45deg)' : 'rotate(0)',
                    transition: 'transform 0.2s',
                    display: 'inline-block',
                  }}>+</span>
                </button>
                {openFaq === i && (
                  <div style={{ padding: '0 24px 20px' }}>
                    <p style={{ color: colors.textMid, lineHeight: 1.7, margin: 0 }}>{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section style={{
        padding: '80px 24px',
        background: `linear-gradient(135deg, ${colors.blue} 0%, ${colors.navy} 100%)`,
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <h2 style={{ color: colors.white, fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 700, margin: '0 0 16px' }}>
            Ready to Hand Over the Keys?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 17, lineHeight: 1.7, margin: '0 0 36px' }}>
            Book a free, no-obligation rental valuation. We&apos;ll visit your property, tell you what it&apos;s worth, and explain exactly how we&apos;ll manage it.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/book-valuation" style={{
              background: colors.white,
              color: colors.navy,
              padding: '16px 36px',
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 16,
              textDecoration: 'none',
              display: 'inline-block',
            }}>
              Book Valuation
            </Link>
            <Link href="/book-viewing" style={{
              background: colors.blue,
              color: colors.white,
              padding: '16px 36px',
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 16,
              textDecoration: 'none',
              display: 'inline-block',
            }}>
              Book a Viewing
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
