'use client';
// app/pricing/page.tsx
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';

export default function PricingPage() {
  return (
    <>
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section style={{
        paddingTop: 140, paddingBottom: 80,
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
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(5, 12, 30, 0.88)',
        }} />
        <div style={{ position: 'relative', zIndex: 1, padding: '0 5%' }}>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: 3,
            textTransform: 'uppercase', color: '#4a90d9', marginBottom: 14,
            fontFamily: "'Poppins', sans-serif",
          }}>
            Transparent Pricing
          </div>
          <h1 style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: 'clamp(32px, 5vw, 60px)',
            fontWeight: 700, color: '#fff',
            margin: '0 0 20px', lineHeight: 1.1,
          }}>
            Choose Your Package
          </h1>
          <p style={{
            fontSize: 17, color: 'rgba(255,255,255,0.6)',
            maxWidth: 540, margin: '0 auto',
            lineHeight: 1.7, fontWeight: 300,
            fontFamily: "'Poppins', sans-serif",
          }}>
            Every package builds on the last. Start with what you need — upgrade whenever you&apos;re ready.
          </p>
        </div>
      </section>

      {/* ── PRICING CARDS ────────────────────────────────────── */}
      <section style={{
        padding: '80px 5% 100px',
        background: '#08122a',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url(/images/Background_of_the_services.png)',
          backgroundSize: 'cover', backgroundPosition: 'center bottom',
          backgroundRepeat: 'no-repeat',
        }} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(5, 12, 30, 0.92)' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>

          {/* ── Row 1: 3 cards ── */}
          <style>{`
            .pricing-grid-3 {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 24px;
              max-width: 1100px;
              margin: 0 auto 24px;
            }
            .pricing-grid-2 {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 24px;
              max-width: 740px;
              margin: 0 auto;
            }
            @media (max-width: 900px) {
              .pricing-grid-3 {
                grid-template-columns: repeat(2, 1fr);
                max-width: 700px;
              }
            }
            @media (max-width: 600px) {
              .pricing-grid-3,
              .pricing-grid-2 {
                grid-template-columns: 1fr;
                max-width: 100%;
              }
            }
          `}</style>

          <div className="pricing-grid-3">

            {/* Virtual Tenant Find — £499 */}
            <div style={{
              background: '#162849', borderRadius: 10, padding: '36px 28px',
              border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column',
            }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1, fontFamily: "'Poppins', sans-serif" }}>One-time fee</div>
              <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 52, fontWeight: 700, color: '#fff', lineHeight: 1, marginBottom: 4 }}>£499</div>
              <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 8, paddingBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                Virtual Tenant Find
              </div>
              {[
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
              ].map(item => (
                <div key={item} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
                  <span style={{ color: '#2563eb', fontWeight: 700, fontSize: 14, marginTop: 2, flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, fontFamily: "'Poppins', sans-serif" }}>{item}</span>
                </div>
              ))}
              <div style={{ marginTop: 'auto', paddingTop: 28 }}>
                <Link href="/register" style={{
                  display: 'block', textAlign: 'center',
                  padding: '14px 24px', background: '#2563eb', color: '#fff',
                  borderRadius: 4, fontSize: 14, fontWeight: 700,
                  letterSpacing: '0.5px', textTransform: 'uppercase', textDecoration: 'none',
                  fontFamily: "'Poppins', sans-serif",
                }}>
                  Get Started
                </Link>
              </div>
            </div>

            {/* Expert Tenant Find — £799 — Most Popular */}
            <div style={{
              background: '#0f1f3d', borderRadius: 10, padding: '36px 28px',
              border: '2px solid #2563eb', display: 'flex', flexDirection: 'column',
              position: 'relative',
            }}>
              <div style={{
                position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
                background: '#2563eb', color: '#fff', fontSize: 10, fontWeight: 800,
                letterSpacing: 2, textTransform: 'uppercase', padding: '5px 16px', borderRadius: 20,
                whiteSpace: 'nowrap', fontFamily: "'Poppins', sans-serif",
              }}>
                Most Popular
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1, fontFamily: "'Poppins', sans-serif" }}>One-time fee</div>
              <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 52, fontWeight: 700, color: '#4a90d9', lineHeight: 1, marginBottom: 4 }}>£799</div>
              <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 8, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                Expert Tenant Find
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', marginBottom: 12, fontFamily: "'Poppins', sans-serif" }}>
                ↳ Everything in Virtual, plus:
              </div>
              {[
                'Professional property photography',
                'Advertising on major property portals',
                'Enquiry management and applicant screening',
                'Agent-led property viewings',
                'Viewing feedback and negotiation',
                'Tenant handover and key management',
              ].map(item => (
                <div key={item} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
                  <span style={{ color: '#4a90d9', fontWeight: 700, fontSize: 14, marginTop: 2, flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, fontFamily: "'Poppins', sans-serif" }}>{item}</span>
                </div>
              ))}
              <div style={{ marginTop: 'auto', paddingTop: 28 }}>
                <Link href="/register" style={{
                  display: 'block', textAlign: 'center',
                  padding: '14px 24px', background: '#2563eb', color: '#fff',
                  borderRadius: 4, fontSize: 14, fontWeight: 700,
                  letterSpacing: '0.5px', textTransform: 'uppercase', textDecoration: 'none',
                  fontFamily: "'Poppins', sans-serif",
                }}>
                  Get Started
                </Link>
              </div>
            </div>

            {/* Rent Collection — 6% */}
            <div style={{
              background: '#162849', borderRadius: 10, padding: '36px 28px',
              border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column',
            }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1, fontFamily: "'Poppins', sans-serif" }}>Monthly percentage</div>
              <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 52, fontWeight: 700, color: '#fff', lineHeight: 1, marginBottom: 4 }}>6%</div>
              <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 8, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                Rent Collection
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', marginBottom: 12, fontFamily: "'Poppins', sans-serif" }}>
                ↳ Everything in Expert Tenant Find, plus:
              </div>
              {[
                'Monthly rent collection',
                'Rent payment monitoring',
                'Arrears chasing and reminders',
                'Monthly landlord statements',
                'Annual rental income summary',
                'Tenancy continuation management',
                'Rent review guidance',
                'Utility and compliance reminders',
              ].map(item => (
                <div key={item} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
                  <span style={{ color: '#2563eb', fontWeight: 700, fontSize: 14, marginTop: 2, flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, fontFamily: "'Poppins', sans-serif" }}>{item}</span>
                </div>
              ))}
              <div style={{ marginTop: 'auto', paddingTop: 28 }}>
                <Link href="/register" style={{
                  display: 'block', textAlign: 'center',
                  padding: '14px 24px', background: '#2563eb', color: '#fff',
                  borderRadius: 4, fontSize: 14, fontWeight: 700,
                  letterSpacing: '0.5px', textTransform: 'uppercase', textDecoration: 'none',
                  fontFamily: "'Poppins', sans-serif",
                }}>
                  Get Started
                </Link>
              </div>
            </div>

          </div>{/* end row 1 */}

          {/* ── Row 2: 2 cards centred ── */}
          <div className="pricing-grid-2">

            {/* Full Management — 8% */}
            <div style={{
              background: '#162849', borderRadius: 10, padding: '36px 28px',
              border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column',
            }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1, fontFamily: "'Poppins', sans-serif" }}>Monthly percentage</div>
              <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 52, fontWeight: 700, color: '#fff', lineHeight: 1, marginBottom: 4 }}>8%</div>
              <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 8, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                Full Management
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', marginBottom: 12, fontFamily: "'Poppins', sans-serif" }}>
                ↳ Everything in Rent Collection, plus:
              </div>
              {[
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
              ].map(item => (
                <div key={item} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
                  <span style={{ color: '#2563eb', fontWeight: 700, fontSize: 14, marginTop: 2, flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, fontFamily: "'Poppins', sans-serif" }}>{item}</span>
                </div>
              ))}
              <div style={{ marginTop: 'auto', paddingTop: 28 }}>
                <Link href="/register" style={{
                  display: 'block', textAlign: 'center',
                  padding: '14px 24px', background: '#2563eb', color: '#fff',
                  borderRadius: 4, fontSize: 14, fontWeight: 700,
                  letterSpacing: '0.5px', textTransform: 'uppercase', textDecoration: 'none',
                  fontFamily: "'Poppins', sans-serif",
                }}>
                  Get Started
                </Link>
              </div>
            </div>

            {/* Comprehensive Management — 10% — Most Complete */}
            <div style={{
              background: '#0f1f3d', borderRadius: 10, padding: '36px 28px',
              border: '2px solid #4a6fa5', display: 'flex', flexDirection: 'column',
              position: 'relative',
            }}>
              <div style={{
                position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
                background: '#4a6fa5', color: '#fff', fontSize: 10, fontWeight: 800,
                letterSpacing: 2, textTransform: 'uppercase', padding: '5px 16px', borderRadius: 20,
                whiteSpace: 'nowrap', fontFamily: "'Poppins', sans-serif",
              }}>
                Most Complete
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1, fontFamily: "'Poppins', sans-serif" }}>Monthly percentage</div>
              <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 52, fontWeight: 700, color: '#4a90d9', lineHeight: 1, marginBottom: 4 }}>10%</div>
              <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 8, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                Comprehensive Management
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', marginBottom: 12, fontFamily: "'Poppins', sans-serif" }}>
                ↳ Everything in Full Management, plus:
              </div>
              {[
                'Professional check-in inventory',
                'Professional check-out inventory',
                'Inventory comparison report',
                'Deposit deduction assessment and evidence preparation',
                'Contractor attendance coordination',
                'Property compliance monitoring and reporting',
                'End-of-tenancy dispute preparation (if required)',
                'Priority management support',
              ].map(item => (
                <div key={item} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
                  <span style={{ color: '#4a90d9', fontWeight: 700, fontSize: 14, marginTop: 2, flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, fontFamily: "'Poppins', sans-serif" }}>{item}</span>
                </div>
              ))}
              <div style={{ marginTop: 'auto', paddingTop: 28 }}>
                <Link href="/register" style={{
                  display: 'block', textAlign: 'center',
                  padding: '14px 24px', background: '#4a6fa5', color: '#fff',
                  borderRadius: 4, fontSize: 14, fontWeight: 700,
                  letterSpacing: '0.5px', textTransform: 'uppercase', textDecoration: 'none',
                  fontFamily: "'Poppins', sans-serif",
                }}>
                  Get Started
                </Link>
              </div>
            </div>

          </div>{/* end row 2 */}
        </div>
      </section>

      {/* ── FAQ / REASSURANCE STRIP ──────────────────────────── */}
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 32 }}>
            {[
              {
                q: 'Can I upgrade my package later?',
                a: 'Yes — you can upgrade at any time. We\'ll simply apply the difference to your next invoice.',
              },
              {
                q: 'Are there any hidden fees?',
                a: 'No. The price you see is the price you pay. No setup fees, no renewal fees, no surprises.',
              },
              {
                q: 'What\'s the difference between Rent Collection and Full Management?',
                a: 'Rent Collection handles money and statements. Full Management adds hands-on day-to-day property management, maintenance, and compliance.',
              },
              {
                q: 'Do I need to sign a long-term contract?',
                a: 'Our one-time fee packages have no ongoing commitment. Management packages run on a rolling monthly basis.',
              },
            ].map(faq => (
              <div key={faq.q} style={{ borderLeft: '3px solid #2563eb', paddingLeft: 20 }}>
                <h3 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 16, fontWeight: 700, color: '#0f1f3d', marginBottom: 8 }}>
                  {faq.q}
                </h3>
                <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.7, margin: 0 }}>
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ───────────────────────────────────────── */}
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
            textTransform: 'uppercase', textDecoration: 'none', fontFamily: "'Poppins', sans-serif",
            whiteSpace: 'nowrap',
          }}>
            Get Started Free
          </Link>
          <Link href="/" style={{
            padding: '16px 36px', background: 'transparent', color: '#fff',
            border: '1px solid rgba(255,255,255,0.3)', borderRadius: 4, fontSize: 14,
            fontWeight: 500, letterSpacing: '0.5px', textTransform: 'uppercase',
            textDecoration: 'none', fontFamily: "'Poppins', sans-serif",
            whiteSpace: 'nowrap',
          }}>
            Back to Home
          </Link>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer style={{
        background: '#050a12', borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '48px 5%',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
          <div style={{
            fontFamily: "'Poppins', sans-serif", fontSize: 20, fontWeight: 700,
            color: '#fff', display: 'flex', alignItems: 'center', gap: 10,
          }}>
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
