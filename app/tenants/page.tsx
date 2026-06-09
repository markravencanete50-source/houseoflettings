'use client';
import { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';

// ── FAQ ACCORDION ─────────────────────────────────────────────────────────────
const FAQS = [
  {
    q: 'Do I need to pay any fees as a tenant?',
    a: 'No. We charge zero agency fees to tenants. The only money you pay upfront is a holding deposit (capped at one week\'s rent) to secure the property while referencing is completed, and your first month\'s rent plus deposit on move-in day.',
  },
  {
    q: 'How much is the holding deposit?',
    a: 'The holding deposit is capped at one week\'s rent by law (Tenant Fees Act 2019). It is deducted from your first month\'s rent on move-in, so it\'s not an extra cost — just an advance.',
  },
  {
    q: 'How long does the referencing process take?',
    a: 'Typically 3–5 working days. We use a streamlined referencing process and will keep you updated throughout. If there are any delays we\'ll let you know immediately.',
  },
  {
    q: 'Can I book a viewing before applying?',
    a: 'Yes — always. We never ask for money or personal information before you\'ve viewed the property and decided you\'d like to proceed.',
  },
  {
    q: 'What happens if my application is unsuccessful?',
    a: 'Your holding deposit is returned to you in full within 7 days, unless you provided false information or withdraw without good reason.',
  },
  {
    q: 'Do you manage properties in Leeds and Manchester only?',
    a: 'Currently yes — we specialise in Leeds and Manchester. This lets us offer a genuinely local, hands-on service rather than a faceless national operation.',
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      padding: '20px 0',
    }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          width: '100%', textAlign: 'left', display: 'flex',
          justifyContent: 'space-between', alignItems: 'center', gap: 16,
        }}
      >
        <span style={{ fontSize: 16, fontWeight: 600, color: '#fff', fontFamily: "'Poppins', sans-serif" }}>
          {q}
        </span>
        <span style={{
          fontSize: 22, color: '#2563eb', flexShrink: 0,
          transform: open ? 'rotate(45deg)' : 'none',
          transition: 'transform 0.2s',
          display: 'inline-block',
        }}>+</span>
      </button>
      {open && (
        <p style={{
          marginTop: 12, fontSize: 15, color: 'rgba(255,255,255,0.6)',
          lineHeight: 1.7, fontFamily: "'Poppins', sans-serif",
        }}>
          {a}
        </p>
      )}
    </div>
  );
}

// ── ENQUIRY BUTTON ────────────────────────────────────────────────────────────
function EnquiryButton({ label, style }: { label: string; style?: React.CSSProperties }) {
  return (
    <Link href="/listings" style={style}>
      {label}
    </Link>
  );
}

// ── PAGE ──────────────────────────────────────────────────────────────────────
export default function TenantsPage() {
  return (
    <>
      <Navbar />

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a1628; }

        .tenants-hero {
          background: #0a1628;
          padding: 160px clamp(20px, 5%, 5%) 100px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .tenants-hero::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at 50% 0%, rgba(37,99,235,0.12) 0%, transparent 65%);
          pointer-events: none;
        }

        .steps-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        @media (max-width: 900px) {
          .steps-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 540px) {
          .steps-grid { grid-template-columns: 1fr; }
        }

        .why-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }
        @media (max-width: 900px) {
          .why-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 500px) {
          .why-grid { grid-template-columns: 1fr; }
        }

        .cost-table { width: 100%; border-collapse: collapse; }
        .cost-table tr td {
          padding: 14px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          font-size: 15px;
          color: rgba(255,255,255,0.75);
          font-family: 'Poppins', sans-serif;
        }
        .cost-table tr td:first-child { color: rgba(255,255,255,0.45); font-size: 13px; }
        .cost-table tr:last-child td { border-bottom: none; }

        .split-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
          align-items: start;
        }
        @media (max-width: 768px) {
          .split-layout { grid-template-columns: 1fr; gap: 40px; }
        }
      `}</style>

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section className="tenants-hero">
        <div style={{ position: 'relative' }}>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase',
            color: '#2563eb', marginBottom: 20,
            fontFamily: "'Poppins', sans-serif",
          }}>
            For Tenants
          </div>
          <h1 style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: 'clamp(38px, 6vw, 72px)',
            fontWeight: 800, lineHeight: 1.08,
            letterSpacing: '-1.5px', color: '#fff',
            marginBottom: 24,
          }}>
            Rent without<br />
            <span style={{ color: '#2563eb' }}>the runaround.</span>
          </h1>
          <p style={{
            fontSize: 17, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7,
            maxWidth: 480, margin: '0 auto 44px',
            fontFamily: "'Poppins', sans-serif",
          }}>
            No agency fees. No hidden charges. Direct contact with landlords.
            We make renting straightforward — the way it should be.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/listings" style={{
              padding: '16px 36px', background: '#2563eb', color: '#fff',
              borderRadius: 4, fontSize: 14, fontWeight: 700,
              letterSpacing: '0.5px', textTransform: 'uppercase',
              textDecoration: 'none', transition: 'background 0.2s',
              fontFamily: "'Poppins', sans-serif",
            }}>
              Browse Properties
            </Link>
            <Link href="/contact" style={{
              padding: '16px 36px', background: 'transparent', color: '#fff',
              border: '1px solid rgba(255,255,255,0.25)', borderRadius: 4,
              fontSize: 14, fontWeight: 500, letterSpacing: '0.5px',
              textTransform: 'uppercase', textDecoration: 'none',
              fontFamily: "'Poppins', sans-serif",
            }}>
              Send an Enquiry
            </Link>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────────── */}
      <section style={{ background: '#0d1b35', padding: 'clamp(60px, 8vw, 90px) clamp(20px, 5%, 5%)' }}>
        <div style={{ marginBottom: 48 }}>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase',
            color: '#2563eb', marginBottom: 14, fontFamily: "'Poppins', sans-serif",
          }}>
            Your Journey
          </div>
          <h2 style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 700,
            color: '#fff', lineHeight: 1.15,
          }}>
            How it works
          </h2>
        </div>

        <div className="steps-grid">
          {[
            { n: 1, title: 'Send an Enquiry', desc: 'Browse our listings and send a direct enquiry on any property that interests you.' },
            { n: 2, title: 'We Answer Your Questions', desc: 'We\'ll respond quickly with all the details you need — no sales pressure.' },
            { n: 3, title: 'Book a Viewing', desc: 'Arrange a viewing at a time that suits you. See the property before committing to anything.' },
            { n: 4, title: 'Secure with Holding Deposit', desc: 'Pay a holding deposit (one week\'s rent) to take the property off the market while referencing is completed.' },
            { n: 5, title: 'Application & Referencing', desc: 'Complete your application and referencing. We\'ll discuss the process with you and guide you through each step.' },
            { n: 6, title: 'Move In', desc: 'Sign your tenancy agreement, pay your first month\'s rent and deposit, and collect your keys.' },
          ].map(step => (
            <div key={step.n} style={{
              border: '1px solid rgba(37,99,235,0.3)',
              borderRadius: 8, padding: '28px 24px',
              background: 'rgba(37,99,235,0.04)',
            }}>
              <div style={{
                width: 36, height: 36, background: '#2563eb', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 16,
                fontFamily: "'Poppins', sans-serif",
              }}>
                {step.n}
              </div>
              <h3 style={{
                fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 8,
                fontFamily: "'Poppins', sans-serif",
              }}>
                {step.title}
              </h3>
              <p style={{
                fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.65,
                fontFamily: "'Poppins', sans-serif",
              }}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHY RENT WITH US ─────────────────────────────────────────────────── */}
      <section style={{ background: '#0a1628', padding: 'clamp(60px, 8vw, 90px) clamp(20px, 5%, 5%)' }}>
        <div style={{ marginBottom: 48 }}>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase',
            color: '#2563eb', marginBottom: 14, fontFamily: "'Poppins', sans-serif",
          }}>
            Why Us
          </div>
          <h2 style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 700,
            color: '#fff', lineHeight: 1.15,
          }}>
            Why rent with House of Lettings?
          </h2>
        </div>

        <div className="why-grid">
          {[
            { icon: '£', title: 'Zero Tenant Fees', desc: 'No admin fees, no referencing fees, no check-in fees. Nothing.' },
            { icon: '⚡', title: 'Fast Process', desc: 'From enquiry to keys in as little as 2 weeks. We don\'t drag our feet.' },
            { icon: '🤝', title: 'Direct Landlord Contact', desc: 'You deal with us directly — no call centres, no passing the buck.' },
            { icon: '📍', title: 'Leeds & Manchester', desc: 'Local experts who know the market, the areas, and the properties.' },
          ].map(card => (
            <div key={card.title} style={{
              border: '1px solid rgba(37,99,235,0.25)',
              borderRadius: 8, padding: '28px 24px',
              background: 'rgba(255,255,255,0.02)',
            }}>
              <div style={{ fontSize: 28, marginBottom: 16 }}>{card.icon}</div>
              <h3 style={{
                fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 8,
                fontFamily: "'Poppins', sans-serif",
              }}>
                {card.title}
              </h3>
              <p style={{
                fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.65,
                fontFamily: "'Poppins', sans-serif",
              }}>
                {card.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOLDING DEPOSIT EXPLAINER ─────────────────────────────────────────── */}
      <section style={{ background: '#0d1b35', padding: 'clamp(60px, 8vw, 90px) clamp(20px, 5%, 5%)' }}>
        <div className="split-layout">
          <div>
            <div style={{
              fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase',
              color: '#2563eb', marginBottom: 14, fontFamily: "'Poppins', sans-serif",
            }}>
              Transparent Costs
            </div>
            <h2 style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: 'clamp(26px, 3.5vw, 42px)', fontWeight: 700,
              color: '#fff', lineHeight: 1.2, marginBottom: 20,
            }}>
              What you actually pay
            </h2>
            <p style={{
              fontSize: 15, color: 'rgba(255,255,255,0.55)', lineHeight: 1.75,
              fontFamily: "'Poppins', sans-serif", marginBottom: 24,
            }}>
              Under the Tenant Fees Act 2019, we are legally prohibited from charging
              admin or agency fees. The only permitted upfront payments are a holding
              deposit and your first month's rent + security deposit.
            </p>
            <p style={{
              fontSize: 15, color: 'rgba(255,255,255,0.55)', lineHeight: 1.75,
              fontFamily: "'Poppins', sans-serif",
            }}>
              The holding deposit is capped at one week's rent and is deducted from
              your first payment — so it's not an extra cost, just an advance.
            </p>
          </div>
          <div>
            <table className="cost-table">
              <tbody>
                {[
                  { label: 'Agency fee', value: '£0 — prohibited by law' },
                  { label: 'Referencing fee', value: '£0 — we cover this' },
                  { label: 'Viewing fee', value: '£0 — always free' },
                  { label: 'Admin / check-in fee', value: '£0 — not permitted' },
                  { label: 'Holding deposit', value: 'Max 1 week's rent (deducted from move-in)' },
                  { label: 'Security deposit', value: 'Max 5 weeks' rent (held in TDS)' },
                  { label: 'First month's rent', value: 'Paid on move-in day' },
                ].map(row => (
                  <tr key={row.label}>
                    <td>{row.label}</td>
                    <td style={{ fontWeight: 600, color: '#fff' }}>{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────────── */}
      <section style={{ background: '#0a1628', padding: 'clamp(60px, 8vw, 90px) clamp(20px, 5%, 5%)' }}>
        <div style={{ maxWidth: 780, margin: '0 auto' }}>
          <div style={{ marginBottom: 48, textAlign: 'center' }}>
            <div style={{
              fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase',
              color: '#2563eb', marginBottom: 14, fontFamily: "'Poppins', sans-serif",
            }}>
              FAQ
            </div>
            <h2 style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700,
              color: '#fff', lineHeight: 1.15,
            }}>
              Common questions
            </h2>
          </div>
          {FAQS.map(faq => <FAQItem key={faq.q} q={faq.q} a={faq.a} />)}
        </div>
      </section>

      {/* ── CTA BANNER ───────────────────────────────────────────────────────── */}
      <section style={{
        background: '#0d1b35',
        border: '1px solid rgba(37,99,235,0.3)',
        margin: 'clamp(40px, 6vw, 80px) clamp(20px, 5%, 5%)',
        borderRadius: 12,
        padding: 'clamp(48px, 6vw, 72px) clamp(24px, 5%, 60px)',
        textAlign: 'center',
      }}>
        <h2 style={{
          fontFamily: "'Poppins', sans-serif",
          fontSize: 'clamp(26px, 4vw, 44px)', fontWeight: 800,
          color: '#fff', marginBottom: 16, lineHeight: 1.1,
        }}>
          Ready to find your next home?
        </h2>
        <p style={{
          fontSize: 16, color: 'rgba(255,255,255,0.5)',
          marginBottom: 36, fontFamily: "'Poppins', sans-serif",
        }}>
          Browse our available properties in Leeds and Manchester.
        </p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/listings" style={{
            padding: '16px 40px', background: '#2563eb', color: '#fff',
            borderRadius: 4, fontSize: 14, fontWeight: 700,
            letterSpacing: '0.5px', textTransform: 'uppercase',
            textDecoration: 'none', fontFamily: "'Poppins', sans-serif",
          }}>
            Browse Properties
          </Link>
          <Link href="/contact" style={{
            padding: '16px 40px', background: 'transparent', color: '#fff',
            border: '1px solid rgba(255,255,255,0.2)', borderRadius: 4,
            fontSize: 14, fontWeight: 500, letterSpacing: '0.5px',
            textTransform: 'uppercase', textDecoration: 'none',
            fontFamily: "'Poppins', sans-serif",
          }}>
            Contact Us
          </Link>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────────── */}
      <footer style={{
        background: '#050a12', borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: 'clamp(32px, 5vw, 48px) clamp(20px, 5%, 5%)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{
            fontFamily: "'Poppins', sans-serif", fontSize: 20, fontWeight: 700,
            color: '#fff', display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ width: 7, height: 7, background: '#2563eb', borderRadius: '50%', display: 'inline-block' }} />
            House of Lettings
          </div>
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13, fontFamily: "'Poppins', sans-serif" }}>
            © {new Date().getFullYear()} House of Lettings Ltd. All rights reserved.
          </p>
          <div style={{ display: 'flex', gap: 24 }}>
            <Link href="/cookie-policy" style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, textDecoration: 'none' }}>Cookie Policy</Link>
            <Link href="/terms" style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, textDecoration: 'none' }}>Terms</Link>
          </div>
        </div>
      </footer>
    </>
  );
}
