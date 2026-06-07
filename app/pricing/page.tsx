'use client';
// app/pricing/page.tsx
import { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';

const PACKAGES = [
  {
    id: 'virtual',
    label: 'Virtual Tenant Find',
    price: '£499',
    priceType: 'One-time fee',
    color: '#2563eb',
    bg: 'radial-gradient(ellipse at 20% 60%, rgba(37,99,235,0.18) 0%, transparent 55%), radial-gradient(ellipse at 80% 20%, rgba(15,31,61,0.4) 0%, transparent 60%)',
    badge: null,
    inherits: null,
    features: [
      'Collection of holding deposit',
      'Right to Rent checks',
      'Tenant application processing',
      'Credit and affordability checks',
      'Employment and landlord references',
      'Guarantor referencing (where applicable)',
      'Preparation of tenancy agreement',
      "Collection of first month's rent and tenancy deposit",
      'Deposit registration and prescribed information',
      'Utility and council tax notifications',
      'Landlord tenancy documentation pack',
      'Transfer of funds to the landlord',
    ],
  },
  {
    id: 'expert',
    label: 'Expert Tenant Find',
    price: '£799',
    priceType: 'One-time fee',
    color: '#4a90d9',
    bg: 'radial-gradient(ellipse at 70% 30%, rgba(74,144,217,0.22) 0%, transparent 55%), radial-gradient(ellipse at 20% 80%, rgba(37,99,235,0.12) 0%, transparent 50%)',
    badge: 'Most Popular',
    badgeColor: '#2563eb',
    inherits: 'Everything in Virtual, plus:',
    features: [
      'Professional property photography',
      'Advertising on major property portals',
      'Enquiry management and applicant screening',
      'Agent-led property viewings',
      'Viewing feedback and negotiation',
      'Tenant handover and key management',
    ],
  },
  {
    id: 'rent',
    label: 'Rent Collection',
    price: '6%',
    priceType: 'Monthly percentage',
    color: '#2563eb',
    bg: 'radial-gradient(ellipse at 50% 80%, rgba(0,184,160,0.15) 0%, transparent 55%), radial-gradient(ellipse at 90% 10%, rgba(37,99,235,0.1) 0%, transparent 50%)',
    badge: null,
    inherits: 'Everything in Expert Tenant Find, plus:',
    features: [
      'Monthly rent collection',
      'Rent payment monitoring',
      'Arrears chasing and reminders',
      'Monthly landlord statements',
      'Annual rental income summary',
      'Tenancy continuation management',
      'Rent review guidance',
      'Utility and compliance reminders',
    ],
  },
  {
    id: 'full',
    label: 'Full Management',
    price: '8%',
    priceType: 'Monthly percentage',
    color: '#2563eb',
    bg: 'radial-gradient(ellipse at 10% 40%, rgba(99,37,235,0.16) 0%, transparent 55%), radial-gradient(ellipse at 85% 70%, rgba(37,99,235,0.14) 0%, transparent 50%)',
    badge: null,
    inherits: 'Everything in Rent Collection, plus:',
    features: [
      'Dedicated property management team',
      'Day-to-day tenant communication',
      'Maintenance reporting and contractor coordination',
      'Repair quotation management',
      'Emergency maintenance support',
      'Key holding service',
      'Compliance monitoring (Gas Safety, EICR, EPC)',
      'Tenancy continuation and re-marketing management',
      'End-of-tenancy administration',
      'Deposit negotiation assistance',
    ],
  },
  {
    id: 'comprehensive',
    label: 'Comprehensive',
    price: '10%',
    priceType: 'Monthly percentage',
    color: '#4a90d9',
    bg: 'radial-gradient(ellipse at 60% 20%, rgba(74,111,165,0.25) 0%, transparent 55%), radial-gradient(ellipse at 15% 85%, rgba(74,144,217,0.15) 0%, transparent 50%)',
    badge: 'Most Complete',
    badgeColor: '#4a6fa5',
    inherits: 'Everything in Full Management, plus:',
    features: [
      'Professional check-in inventory',
      'Professional check-out inventory',
      'Inventory comparison report',
      'Deposit deduction assessment and evidence preparation',
      'Contractor attendance coordination',
      'Property compliance monitoring and reporting',
      'End-of-tenancy dispute preparation (if required)',
      'Priority management support',
    ],
  },
];

export default function PricingPage() {
  const [active, setActive] = useState(1); // default to Expert (Most Popular)

  const pkg = PACKAGES[active];

  return (
    <>
      <Navbar />

      <style>{`
        .pkg-tab {
          padding: 10px 20px;
          border-radius: 6px;
          border: 1.5px solid rgba(255,255,255,0.18);
          background: transparent;
          color: rgba(255,255,255,0.6);
          font-family: 'Poppins', sans-serif;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.04em;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
          position: relative;
        }
        .pkg-tab:hover {
          border-color: rgba(255,255,255,0.45);
          color: #fff;
        }
        .pkg-tab.active {
          background: #2563eb;
          border-color: #2563eb;
          color: #fff;
        }
        .pkg-tab .tab-badge {
          position: absolute;
          top: -9px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          padding: 2px 8px;
          border-radius: 10px;
          white-space: nowrap;
        }
        .feature-row {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          padding: 12px 0;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          animation: fadeUp 0.3s ease both;
        }
        .feature-row:last-child { border-bottom: none; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .price-display {
          transition: all 0.25s ease;
        }
        @media (max-width: 768px) {
          .pkg-tabs-wrap {
            overflow-x: auto;
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .pkg-tabs-wrap::-webkit-scrollbar { display: none; }
          .pkg-detail-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section style={{
        paddingTop: 130, paddingBottom: 70,
        background: '#0f1f3d',
        position: 'relative',
        overflow: 'hidden',
        textAlign: 'center',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url(/images/Background_of_the_services.png)',
          backgroundSize: 'cover', backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(5,12,30,0.88)' }} />
        <div style={{ position: 'relative', zIndex: 1, padding: '0 5%' }}>
          <div style={{
            fontSize: 13, fontWeight: 700, letterSpacing: 4,
            textTransform: 'uppercase', color: '#4a90d9', marginBottom: 16,
            fontFamily: "'Poppins', sans-serif",
          }}>
            Transparent Pricing
          </div>
          <h1 style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: 'clamp(36px, 5.5vw, 68px)',
            fontWeight: 700, color: '#fff',
            margin: '0 0 20px', lineHeight: 1.05,
          }}>
            Choose Your Package
          </h1>
          <p style={{
            fontSize: 17, color: 'rgba(255,255,255,0.6)',
            maxWidth: 520, margin: '0 auto',
            lineHeight: 1.75, fontWeight: 300,
            fontFamily: "'Poppins', sans-serif",
          }}>
            Every package builds on the last. Start with what you need — upgrade whenever you&apos;re ready.
          </p>
        </div>
      </section>

      {/* ── PACKAGE SELECTOR ─────────────────────────────────── */}
      <section style={{
        background: '#08122a',
        padding: '64px 5% 100px',
        position: 'relative',
        overflow: 'hidden',
        transition: 'background 0.5s ease',
      }}>
        {/* Background photo — more visible now */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url(/images/Background_of_the_services.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.55,
        }} />
        {/* Gradient overlay — dark at edges, lighter in centre so photo shows through */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at 50% 50%, rgba(8,18,42,0.55) 0%, rgba(5,12,30,0.88) 100%)',
        }} />
        {/* Dynamic accent layer — shifts per package */}
        <div style={{
          position: 'absolute', inset: 0,
          background: pkg.bg,
          transition: 'background 0.6s ease',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto' }}>

          {/* Tab strip */}
          <div className="pkg-tabs-wrap" style={{ marginBottom: 56 }}>
            <div style={{
              display: 'flex', gap: 10, justifyContent: 'center',
              flexWrap: 'wrap', padding: '0 0 4px',
            }}>
              {PACKAGES.map((p, i) => (
                <button
                  key={p.id}
                  className={`pkg-tab${active === i ? ' active' : ''}`}
                  onClick={() => setActive(i)}
                >
                  {p.badge && (
                    <span className="tab-badge" style={{ background: p.badgeColor, color: '#fff' }}>
                      {p.badge}
                    </span>
                  )}
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Package detail panel */}
          <div
            className="pkg-detail-grid"
            key={pkg.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '340px 1fr',
              gap: 40,
              alignItems: 'start',
            }}
          >
            {/* Left — price + CTA */}
            <div style={{
              background: 'rgba(10,24,56,0.82)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: `2px solid ${pkg.color}`,
              borderRadius: 14,
              padding: '44px 36px',
              position: 'sticky',
              top: 100,
            }}>
              {pkg.badge && (
                <div style={{
                  display: 'inline-block',
                  background: pkg.badgeColor,
                  color: '#fff', fontSize: 10, fontWeight: 800,
                  letterSpacing: 2, textTransform: 'uppercase',
                  padding: '5px 16px', borderRadius: 20,
                  marginBottom: 20, fontFamily: "'Poppins', sans-serif",
                }}>
                  {pkg.badge}
                </div>
              )}
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8, fontFamily: "'Poppins', sans-serif" }}>
                {pkg.priceType}
              </div>
              <div className="price-display" style={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: 'clamp(52px, 7vw, 80px)',
                fontWeight: 700, color: pkg.color,
                lineHeight: 1, marginBottom: 8,
              }}>
                {pkg.price}
              </div>
              <div style={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: 22, fontWeight: 800, color: '#fff',
                marginBottom: 24, paddingBottom: 24,
                borderBottom: '1px solid rgba(255,255,255,0.1)',
              }}>
                {pkg.label}
              </div>

              {pkg.inherits && (
                <div style={{
                  fontSize: 13, color: 'rgba(255,255,255,0.45)',
                  fontStyle: 'italic', marginBottom: 20,
                  fontFamily: "'Poppins', sans-serif",
                }}>
                  ↳ {pkg.inherits}
                </div>
              )}

              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, marginBottom: 32, fontFamily: "'Poppins', sans-serif" }}>
                {active === 0 && "Perfect for landlords who want to manage the tenancy themselves after move-in."}
                {active === 1 && "Our agent handles everything from photography to tenant handover."}
                {active === 2 && "Hands-off rent collection with full financial reporting every month."}
                {active === 3 && "Complete day-to-day management so you never have to worry."}
                {active === 4 && "Our most comprehensive package — total peace of mind from day one."}
              </div>

              <Link href="/register" style={{
                display: 'block', textAlign: 'center',
                padding: '16px 24px', background: '#2563eb', color: '#fff',
                borderRadius: 6, fontSize: 15, fontWeight: 700,
                letterSpacing: '0.5px', textTransform: 'uppercase',
                textDecoration: 'none', fontFamily: "'Poppins', sans-serif",
                transition: 'background 0.2s',
              }}>
                Get Started
              </Link>

              {/* Step indicator */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 24 }}>
                {PACKAGES.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActive(i)}
                    style={{
                      width: active === i ? 24 : 7,
                      height: 7, borderRadius: 4,
                      background: active === i ? '#2563eb' : 'rgba(255,255,255,0.2)',
                      border: 'none', cursor: 'pointer',
                      transition: 'all 0.2s ease', padding: 0,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Right — feature list */}
            <div style={{
              background: 'rgba(16,34,68,0.78)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.10)',
              borderRadius: 14,
              padding: '44px 40px',
            }}>
              <div style={{
                fontSize: 11, fontWeight: 700, letterSpacing: 3,
                textTransform: 'uppercase', color: '#4a90d9', marginBottom: 24,
                fontFamily: "'Poppins', sans-serif",
              }}>
                What&apos;s included
              </div>
              <div>
                {pkg.features.map((f, i) => (
                  <div
                    key={f}
                    className="feature-row"
                    style={{ animationDelay: `${i * 0.04}s` }}
                  >
                    <div style={{
                      width: 22, height: 22, borderRadius: '50%',
                      background: 'rgba(37,99,235,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, marginTop: 1,
                    }}>
                      <span style={{ color: pkg.color, fontSize: 12, fontWeight: 900 }}>✓</span>
                    </div>
                    <span style={{
                      fontSize: 15, color: 'rgba(255,255,255,0.82)',
                      lineHeight: 1.55, fontFamily: "'Poppins', sans-serif",
                    }}>
                      {f}
                    </span>
                  </div>
                ))}
              </div>

              {/* Prev / Next navigation */}
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                marginTop: 40, paddingTop: 28,
                borderTop: '1px solid rgba(255,255,255,0.08)',
              }}>
                <button
                  onClick={() => setActive(i => Math.max(0, i - 1))}
                  disabled={active === 0}
                  style={{
                    padding: '10px 20px', background: 'transparent',
                    color: active === 0 ? 'rgba(255,255,255,0.2)' : '#fff',
                    border: '1.5px solid',
                    borderColor: active === 0 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.3)',
                    borderRadius: 6, fontSize: 13, fontWeight: 600,
                    cursor: active === 0 ? 'default' : 'pointer',
                    fontFamily: "'Poppins', sans-serif",
                    transition: 'all 0.2s',
                  }}
                >
                  ← Previous
                </button>
                <button
                  onClick={() => setActive(i => Math.min(PACKAGES.length - 1, i + 1))}
                  disabled={active === PACKAGES.length - 1}
                  style={{
                    padding: '10px 20px', background: active === PACKAGES.length - 1 ? 'transparent' : '#2563eb',
                    color: active === PACKAGES.length - 1 ? 'rgba(255,255,255,0.2)' : '#fff',
                    border: '1.5px solid',
                    borderColor: active === PACKAGES.length - 1 ? 'rgba(255,255,255,0.1)' : '#2563eb',
                    borderRadius: 6, fontSize: 13, fontWeight: 600,
                    cursor: active === PACKAGES.length - 1 ? 'default' : 'pointer',
                    fontFamily: "'Poppins', sans-serif",
                    transition: 'all 0.2s',
                  }}
                >
                  Next →
                </button>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────── */}
      <section style={{ background: '#f7f8fa', padding: '80px 5%', borderTop: '1px solid #e5e7eb' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ marginBottom: 48, textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: '#2563eb', marginBottom: 14, fontFamily: "'Poppins', sans-serif" }}>
              Common Questions
            </div>
            <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 'clamp(24px,3vw,40px)', fontWeight: 700, color: '#0f1f3d', margin: 0 }}>
              Everything you need to know
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 32 }}>
            {[
              { q: 'Can I upgrade my package later?', a: "Yes — you can upgrade at any time. We'll simply apply the difference to your next invoice." },
              { q: 'Are there any hidden fees?', a: 'No. The price you see is the price you pay. No setup fees, no renewal fees, no surprises.' },
              { q: "What's the difference between Rent Collection and Full Management?", a: 'Rent Collection handles money and statements. Full Management adds hands-on day-to-day property management, maintenance, and compliance.' },
              { q: 'Do I need to sign a long-term contract?', a: 'Our one-time fee packages have no ongoing commitment. Management packages run on a rolling monthly basis.' },
            ].map(faq => (
              <div key={faq.q} style={{ borderLeft: '3px solid #2563eb', paddingLeft: 20 }}>
                <h3 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 16, fontWeight: 700, color: '#0f1f3d', marginBottom: 8 }}>{faq.q}</h3>
                <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.7, margin: 0 }}>{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section style={{
        background: '#0f1f3d', padding: '80px 5%',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 40, flexWrap: 'wrap',
      }}>
        <div>
          <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 'clamp(24px,3vw,42px)', fontWeight: 700, color: '#fff', marginBottom: 12 }}>
            Not sure which package is right for you?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 16, fontWeight: 300, margin: 0, fontFamily: "'Poppins', sans-serif" }}>
            Book a free valuation and we&apos;ll recommend the best fit for your property.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <Link href="/register" style={{
            padding: '16px 36px', background: '#2563eb', color: '#fff',
            borderRadius: 4, fontSize: 14, fontWeight: 700, letterSpacing: '0.5px',
            textTransform: 'uppercase', textDecoration: 'none', fontFamily: "'Poppins', sans-serif", whiteSpace: 'nowrap',
          }}>Get Started Free</Link>
          <Link href="/" style={{
            padding: '16px 36px', background: 'transparent', color: '#fff',
            border: '1px solid rgba(255,255,255,0.3)', borderRadius: 4, fontSize: 14,
            fontWeight: 500, letterSpacing: '0.5px', textTransform: 'uppercase',
            textDecoration: 'none', fontFamily: "'Poppins', sans-serif", whiteSpace: 'nowrap',
          }}>Back to Home</Link>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer style={{ background: '#050a12', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '48px 5%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
          <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 20, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 7, height: 7, background: '#2563eb', borderRadius: '50%', display: 'inline-block' }} />
            House of Lettings
          </div>
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13, margin: 0, fontFamily: "'Poppins', sans-serif" }}>
            © {new Date().getFullYear()} House of Lettings Ltd. All rights reserved.
          </p>
          <div style={{ display: 'flex', gap: 24 }}>
            <Link href="/cookie-policy" style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, textDecoration: 'none' }}>Cookie Policy</Link>
            <Link href="/terms" style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, textDecoration: 'none' }}>Terms</Link>
            <Link href="/" style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, textDecoration: 'none' }}>Home</Link>
          </div>
        </div>
      </footer>
    </>
  );
}
