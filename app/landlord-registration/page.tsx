'use client';
// app/landlord-registration/page.tsx
// Overview / landing page. The actual form lives at /landlord-registration/apply.
import { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { BUNDLES } from '@/lib/bundles';

const REGISTRATION_FAQS = [
  {
    q: 'Why register my property with House of Lettings?',
    a: 'Registering gives our lettings team the details we need to build a tailored management proposal for your property. We handle tenant finding, referencing, rent collection, maintenance and full legal compliance across Leeds and Manchester, so you get a hands-off, fully compliant let and a dedicated local agent for your portfolio.',
  },
  {
    q: 'What documents will I need to let my property legally in the UK?',
    a: 'You will need a valid Energy Performance Certificate (EPC) rated E or above, a Gas Safety Certificate (renewed annually where there are gas appliances) and an Electrical Installation Condition Report (EICR, renewed every 5 years). Working smoke alarms on every floor and a carbon monoxide alarm in any room with a fuel-burning appliance are also legally required. During registration you can tell us which of these you already hold (and upload them), or ask us to arrange them for you.',
  },
  {
    q: 'Do I have to protect my tenant’s deposit?',
    a: 'Yes. Any deposit taken must be placed in a government-approved tenancy deposit scheme (DPS, mydeposits or TDS) within 30 days, and the tenant must be given the prescribed information. We handle deposit protection as part of our managed packages.',
  },
  {
    q: 'Is registering a commitment or a contract?',
    a: 'No. Registering simply starts the conversation. There is no obligation and no fee to register. Once we understand your property and the services you need, we will send a clear proposal. You only proceed if you are happy with it.',
  },
  {
    q: 'How many properties can I register?',
    a: 'As many as you like. Whether you own a single flat or a large portfolio, let us know the number of properties you hold and we will scope a package that works for you.',
  },
];

export default function LandlordRegistrationPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <>
      <style>{PAGE_CSS}</style>
      <Navbar />

      <div style={{ fontFamily: "'Poppins', sans-serif" }}>

        {/* ── HERO (simple background, no image) ── */}
        <div style={{
          background: '#0f1f3d',
          backgroundImage: 'radial-gradient(ellipse at 75% 15%, rgba(37,99,235,0.20) 0%, transparent 55%), radial-gradient(ellipse at 15% 90%, rgba(37,99,235,0.12) 0%, transparent 50%)',
          paddingTop: 'calc(68px + clamp(56px, 8vw, 96px))',
          paddingBottom: 'clamp(56px, 8vw, 96px)',
          paddingLeft: 'clamp(20px, 5%, 5%)',
          paddingRight: 'clamp(20px, 5%, 5%)',
          textAlign: 'center',
        }}>
          <div style={{
            display: 'inline-block', background: 'rgba(74,144,217,0.28)', color: '#93c5fd',
            fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase',
            padding: '5px 14px', borderRadius: 20, marginBottom: 18,
            border: '1px solid rgba(147,197,253,0.35)',
          }}>
            Landlord Registration
          </div>
          <h1 style={{ fontSize: 'clamp(32px, 4.5vw, 54px)', fontWeight: 800, color: '#fff', lineHeight: 1.12, marginBottom: 16 }}>
            Register your property with House of Lettings
          </h1>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.62)', maxWidth: 560, margin: '0 auto 34px', lineHeight: 1.65, fontWeight: 300 }}>
            Tell us about your property and the services you need. It&rsquo;s free, takes a couple of minutes,
            and there&rsquo;s no obligation, just a tailored management proposal from your local Leeds &amp; Manchester team.
          </p>
          <Link href="/landlord-registration/apply" className="hol-hero-cta">
            Landlord Registration
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </Link>
          <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.45)', marginTop: 16 }}>Free · No obligation · Response within 24-48 hours</p>
        </div>

        {/* ── WHY REGISTER ── */}
        <section style={{ background: '#f7f8fa', padding: 'clamp(56px, 8vw, 96px) clamp(20px, 6%, 80px)' }}>
          <div style={{ maxWidth: 1080, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <div className="hol-eyebrow">Why Register</div>
              <h2 className="hol-h2">Why register a landlord account with us</h2>
              <p style={{ fontSize: 15, color: '#6b7280', maxWidth: 560, margin: '14px auto 0', lineHeight: 1.7 }}>
                One short form connects you with a dedicated local agent who handles everything from compliance to rent collection.
              </p>
            </div>
            <div className="hol-why-grid">
              {[
                { icon: '🏠', title: 'Hands-off management', desc: 'Tenant finding, referencing, inspections, maintenance and rent collection, all handled for you.' },
                { icon: '📋', title: 'Full UK compliance', desc: 'We arrange and track your EPC, Gas Safety, EICR and deposit protection so your let stays legal.' },
                { icon: '💷', title: 'Maximise your returns', desc: 'Accurate rental valuations and transparent pricing with no hidden fees, ever.' },
                { icon: '👤', title: 'A dedicated local agent', desc: 'A real person who knows the Leeds & Manchester market and manages your portfolio.' },
                { icon: '⚡', title: 'Fast turnaround', desc: 'We respond to every registration within 24-48 hours with a tailored proposal.' },
                { icon: '🔒', title: 'No obligation', desc: 'Registering is free and commitment-free. You only proceed if the proposal suits you.' },
              ].map(item => (
                <div key={item.title} className="hol-why-card">
                  <div style={{ fontSize: 28, marginBottom: 14 }}>{item.icon}</div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f1f3d', marginBottom: 8 }}>{item.title}</h3>
                  <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.7, margin: 0 }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SERVICES (pricing packages) ── */}
        <section style={{ background: '#0f1f3d', padding: 'clamp(56px, 8vw, 96px) clamp(20px, 6%, 80px)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 80% 20%, rgba(37,99,235,0.14) 0%, transparent 60%)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', zIndex: 1, maxWidth: 1080, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <div className="hol-eyebrow" style={{ color: '#4a90d9' }}>Our Bundles</div>
              <h2 className="hol-h2" style={{ color: '#fff' }}>Services you can request</h2>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', maxWidth: 580, margin: '14px auto 0', lineHeight: 1.7 }}>
                Each bundle pairs a one-time tenant-find fee with an ongoing monthly management fee. Pick the one that fits your portfolio when you register.
              </p>
            </div>
            <div className="hol-pkg-grid hol-pkg-grid--2">
              {BUNDLES.map(b => (
                <div key={b.id} className="hol-pkg-card">
                  {b.badge && <div style={{ display: 'inline-block', fontSize: 10, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: '#0f1f3d', background: '#4a90d9', padding: '3px 10px', borderRadius: 20, marginBottom: 12 }}>{b.badge}</div>}
                  <div style={{ fontSize: 'clamp(24px,3vw,32px)', fontWeight: 800, color: '#4a90d9', lineHeight: 1, marginBottom: 6 }}>
                    {b.setupFee} <span style={{ fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.55)' }}>{b.mgmtFee ? `+ ${b.mgmtFee}/mo` : 'one-time'}</span>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 8 }}>{b.label}</div>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.65, margin: 0 }}>{b.blurb}</p>
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: 40 }}>
              <Link href="/pricing" style={{ display: 'inline-block', padding: '13px 32px', background: 'transparent', color: '#fff', border: '1.5px solid rgba(255,255,255,0.4)', borderRadius: 6, fontSize: 13, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', textDecoration: 'none' }}>
                Compare All Bundles
              </Link>
            </div>
          </div>
        </section>

        {/* ── TERMS & CONDITIONS ── */}
        <section style={{ background: '#fff', padding: 'clamp(56px, 8vw, 96px) clamp(20px, 6%, 80px)' }}>
          <div style={{ maxWidth: 820, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <div className="hol-eyebrow">The Terms</div>
              <h2 className="hol-h2">Property management terms &amp; conditions (UK)</h2>
              <p style={{ fontSize: 15, color: '#6b7280', maxWidth: 560, margin: '14px auto 0', lineHeight: 1.7 }}>
                A plain-English summary of how we work together. You confirm you&rsquo;ve read these when you register.
              </p>
            </div>
            <ol className="hol-terms-list">
              {[
                ['No obligation to register', 'Registering your details is free and does not create a management agreement. A formal contract is only entered into once you accept a written proposal from us.'],
                ['Legal compliance', 'As the landlord you remain legally responsible for your property. We will arrange and track required documents (EPC rated E or above, annual Gas Safety Certificate, EICR every 5 years, smoke and carbon-monoxide alarms) under any managed package you take.'],
                ['Deposit protection', 'Where we hold a tenancy deposit, it will be protected in a government-approved scheme (DPS, mydeposits or TDS) within 30 days and the prescribed information served on the tenant.'],
                ['Fees', 'Any management, tenant-find or certificate fees are set out clearly in your proposal before work begins. We never charge hidden fees.'],
                ['Your data & documents', 'The information and documents you provide are used solely to prepare your proposal and manage your property. They are stored securely and never sold. See our Terms and Cookie Policy for full details.'],
                ['Right to decline', 'Both parties may decline to proceed after registration. Registering does not guarantee that House of Lettings will take on your property.'],
              ].map(([title, body], i) => (
                <li key={i}><strong>{title}.</strong> {body}</li>
              ))}
            </ol>
            <p style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', marginTop: 24 }}>
              Full terms are available on our <Link href="/terms" style={{ color: '#2563eb', fontWeight: 600 }}>Terms &amp; Conditions</Link> page.
            </p>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section style={{ background: '#f7f8fa', padding: 'clamp(56px, 8vw, 96px) clamp(20px, 6%, 80px)' }}>
          <div style={{ maxWidth: 760, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <div className="hol-eyebrow">Common Questions</div>
              <h2 className="hol-h2">Frequently asked questions</h2>
            </div>
            <div>
              {REGISTRATION_FAQS.map((faq, i) => (
                <div key={i} style={{ borderTop: '1px solid rgba(15,31,61,0.12)', borderBottom: i === REGISTRATION_FAQS.length - 1 ? '1px solid rgba(15,31,61,0.12)' : 'none' }}>
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ width: '100%', background: 'none', border: 'none', color: '#0f1f3d', textAlign: 'left', padding: '22px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontFamily: "'Poppins', sans-serif", fontSize: 16, fontWeight: 700, gap: 16 }}>
                    {faq.q}
                    <span style={{ color: '#2563eb', fontSize: 22, flexShrink: 0, lineHeight: 1, transform: openFaq === i ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }}>+</span>
                  </button>
                  {openFaq === i && (<p style={{ color: '#4b5563', fontSize: 14, lineHeight: 1.8, paddingBottom: 24, margin: 0 }}>{faq.a}</p>)}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA BANNER ── */}
        <section style={{ background: '#0f1f3d', padding: 'clamp(56px, 8vw, 88px) clamp(24px, 7%, 100px)', position: 'relative', overflow: 'hidden', textAlign: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 50%, rgba(37,99,235,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h2 style={{ fontSize: 'clamp(26px,3.6vw,46px)', fontWeight: 700, color: '#fff', marginBottom: 16 }}>Ready to register your property?</h2>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.55)', maxWidth: 520, margin: '0 auto 36px', lineHeight: 1.7, fontWeight: 300 }}>
              Complete the step-by-step registration and we&rsquo;ll be in touch within 24-48 hours.
            </p>
            <Link href="/landlord-registration/apply" className="hol-hero-cta">
              Start Registration
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </Link>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <Footer />

      </div>
    </>
  );
}

const PAGE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');

  .hol-eyebrow { font-size:11px; font-weight:700; letter-spacing:3px; text-transform:uppercase; color:#2563eb; margin-bottom:14px; font-family:'Poppins',sans-serif; }
  .hol-h2 { font-family:'Poppins',sans-serif; font-size:clamp(26px,3.6vw,42px); font-weight:700; color:#0f1f3d; line-height:1.2; margin:0; }

  .hol-hero-cta { display:inline-flex; align-items:center; gap:8px; background:#2563eb; color:#fff; text-decoration:none; font-family:'Poppins',sans-serif; font-size:14px; font-weight:700; letter-spacing:.5px; text-transform:uppercase; padding:15px 34px; border-radius:8px; transition:background .2s,transform .2s; }
  .hol-hero-cta:hover { background:#1d4ed8; transform:translateY(-2px); }

  .hol-why-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:22px; }
  @media(max-width:860px){ .hol-why-grid{grid-template-columns:1fr 1fr;} }
  @media(max-width:560px){ .hol-why-grid{grid-template-columns:1fr;} }
  .hol-why-card { background:#fff; border:1px solid #eef0f5; border-radius:14px; padding:26px 24px; transition:transform .2s,box-shadow .2s; }
  .hol-why-card:hover { transform:translateY(-4px); box-shadow:0 12px 28px rgba(15,31,61,.08); }

  .hol-pkg-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; }
  .hol-pkg-grid--2 { grid-template-columns:repeat(2,1fr); max-width:760px; margin:0 auto; }
  @media(max-width:860px){ .hol-pkg-grid{grid-template-columns:1fr 1fr;} }
  @media(max-width:560px){ .hol-pkg-grid, .hol-pkg-grid--2{grid-template-columns:1fr;} }
  .hol-pkg-card { background:#162849; border:1px solid rgba(74,144,217,.28); border-radius:12px; padding:24px 22px; transition:transform .2s,border-color .2s; }
  .hol-pkg-card:hover { transform:translateY(-4px); border-color:rgba(74,144,217,.6); }

  .hol-terms-list { max-width:760px; margin:0 auto; padding-left:22px; display:flex; flex-direction:column; gap:16px; }
  .hol-terms-list li { font-family:'Poppins',sans-serif; font-size:14px; color:#4b5563; line-height:1.75; }
  .hol-terms-list li strong { color:#0f1f3d; }

  @media(max-width:600px){ .hol-footer{flex-direction:column;align-items:flex-start;gap:20px;} }
`;
