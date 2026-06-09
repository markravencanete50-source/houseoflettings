'use client';
// app/landlords/page.tsx
import { useState, Suspense, lazy } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';

const ValuationModal = lazy(() => import('@/components/ValuationModal'));

export default function LandlordsPage() {
  const [valuationOpen, setValuationOpen] = useState(false);

  return (
    <>
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────── */}
      <style>{`
        .hero-btn {
          padding: 16px 0;
          width: 260px;
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 0.5px;
          border-radius: 6px;
          cursor: pointer;
          font-family: 'Poppins', sans-serif;
          text-transform: uppercase;
          text-align: center;
          text-decoration: none;
          display: inline-block;
          transition: background 0.2s, border-color 0.2s;
        }
        @media (max-width: 600px) {
          .hero-btn { width: 100%; }
          .hero-btns { flex-direction: column !important; }
        }
      `}</style>
      <section style={{
        position: 'relative', minHeight: '100vh',
        display: 'flex', alignItems: 'center',
        overflow: 'hidden',
      }}>
        {/* Background image */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url(/images/Landlord_page.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat',
        }} />
        {/* Dark overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(90deg, rgba(8,18,42,0.92) 0%, rgba(8,18,42,0.75) 55%, rgba(8,18,42,0.40) 100%)',
        }} />

        <div style={{
          position: 'relative', zIndex: 1,
          padding: 'clamp(100px,12vw,140px) clamp(24px,7%,100px) clamp(80px,10vw,120px)',
          maxWidth: 600,
        }}>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: 4,
            textTransform: 'uppercase', color: '#4a90d9', marginBottom: 20,
            fontFamily: "'Poppins', sans-serif",
          }}>
            For Landlords
          </div>
          <h1 style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: 'clamp(36px,4.5vw,58px)',
            fontWeight: 800, color: '#fff',
            lineHeight: 1.1, letterSpacing: '-1px',
            marginBottom: 16,
          }}>
            Is Your Property<br />
            <span style={{ color: '#4a90d9' }}>Actually Making</span><br />
            You Money?
          </h1>
          <p style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: 'clamp(14px,1.5vw,17px)',
            color: 'rgba(255,255,255,0.72)',
            lineHeight: 1.75, marginBottom: 40,
            fontWeight: 300, maxWidth: 460,
          }}>
            We handle the management. You enjoy the returns.<br />
            Serving landlords across Leeds &amp; Manchester.
          </p>
          <div className="hero-btns" style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <button
              onClick={() => setValuationOpen(true)}
              className="hero-btn"
              style={{ background: '#2563eb', color: '#fff', border: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#1d4ed8')}
              onMouseLeave={e => (e.currentTarget.style.background = '#2563eb')}
            >
              Book a Free Valuation
            </button>
            <Link href="/pricing"
              className="hero-btn"
              style={{
                background: 'transparent', color: '#fff',
                border: '1.5px solid rgba(255,255,255,0.4)',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#fff')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)')}
            >
              View Our Packages
            </Link>
          </div>
        </div>
      </section>





      {/* ── WHY HOUSE OF LETTINGS ───────────────────────────── */}
      <section style={{
        padding: 'clamp(60px, 8vw, 100px) clamp(24px, 7%, 100px)',
        background: '#f7f8fa',
      }}>
        <style>{`
          .ll-intro-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 80px;
            align-items: center;
          }
          @media (max-width: 768px) {
            .ll-intro-grid { grid-template-columns: 1fr; gap: 40px; }
          }
        `}</style>
        <div className="ll-intro-grid">
          <div>
            <div style={{
              fontSize: 11, fontWeight: 700, letterSpacing: 3,
              textTransform: 'uppercase', color: '#2563eb', marginBottom: 16,
              fontFamily: "'Poppins', sans-serif",
            }}>
              Why Choose Us
            </div>
            <h2 style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: 'clamp(26px,3.5vw,44px)', fontWeight: 700,
              color: '#0f1f3d', lineHeight: 1.2, marginBottom: 20,
            }}>
              Expert letting agents who put your returns first
            </h2>
            <p style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: 15, color: '#4b5563', lineHeight: 1.85,
              marginBottom: 32,
            }}>
              At House of Lettings, we believe landlords deserve more than just a property manager — they deserve a partner. Our local experts in Leeds and Manchester work to maximise your rental yield, keep your property compliant, and take the day-to-day stress completely off your plate.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 36px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                'Free, no-obligation rental valuation',
                'Transparent pricing — no hidden fees, ever',
                'Rigorous tenant referencing and screening',
                'Full compliance with UK lettings legislation',
                'Rent collection and arrears management',
                'Dedicated local agent for your portfolio',
              ].map(item => (
                <li key={item} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: 14, color: '#374151',
                }}>
                  <span style={{ color: '#2563eb', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <button
              onClick={() => setValuationOpen(true)}
              style={{
                padding: '14px 32px', background: '#0f1f3d', color: '#fff',
                border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 700,
                letterSpacing: '0.5px', cursor: 'pointer', transition: 'background 0.2s',
                fontFamily: "'Poppins', sans-serif", textTransform: 'uppercase',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#162849')}
              onMouseLeave={e => (e.currentTarget.style.background = '#0f1f3d')}
            >
              Get a Free Valuation
            </button>
          </div>
          <img
            src="/images/Landlord_Book_valuation_background.png"
            alt="Better Management. Better Tenants. Better Returns."
            className="ll-intro-img"
            style={{
              width: '100%', height: 'auto',
              borderRadius: 12, display: 'block',
              objectFit: 'cover',
            }}
          />
        </div>
      </section>


      {/* ── OUR SERVICES ────────────────────────────────────── */}
      <section style={{
        padding: 'clamp(60px, 8vw, 100px) clamp(24px, 7%, 100px)',
        background: '#0f1f3d', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at 80% 20%, rgba(37,99,235,0.12) 0%, transparent 60%)',
          pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{
              fontSize: 11, fontWeight: 700, letterSpacing: 3,
              textTransform: 'uppercase', color: '#4a90d9', marginBottom: 14,
              fontFamily: "'Poppins', sans-serif",
            }}>
              Our Packages
            </div>
            <h2 style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: 'clamp(28px,4vw,48px)', fontWeight: 700,
              color: '#fff', margin: '0 0 16px',
            }}>
              Services Built Around You
            </h2>
            <p style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: 15, color: 'rgba(255,255,255,0.5)',
              maxWidth: 520, margin: '0 auto', lineHeight: 1.7, fontWeight: 300,
            }}>
              From a one-time tenant find to fully comprehensive management — choose what works for your portfolio.
            </p>
          </div>
          <style>{`
            .ll-packages-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 24px;
              max-width: 1100px;
              margin: 0 auto 48px;
            }
            @media (max-width: 900px) { .ll-packages-grid { grid-template-columns: 1fr 1fr; } }
            @media (max-width: 560px) { .ll-packages-grid { grid-template-columns: 1fr; } }
          `}</style>
          <div className="ll-packages-grid">
            {[
              {
                price: '£499', name: 'Virtual Tenant Find', type: 'One-time fee',
                desc: 'Advertise your property, handle enquiries, and secure a tenant — all managed online.',
                features: ['Professional listing creation', 'Multi-portal advertising', 'Enquiry management', 'Tenant referencing'],
                popular: false,
              },
              {
                price: '£799', name: 'Expert Tenant Find', type: 'One-time fee',
                desc: 'Everything in Virtual, plus an in-person agent visit, accompanied viewings, and tenancy setup.',
                features: ['Everything in Virtual', 'Agent property visit', 'Accompanied viewings', 'Full tenancy setup'],
                popular: true,
              },
              {
                price: '6%', name: 'Rent Collection', type: 'Monthly',
                desc: 'We collect rent, chase arrears, and transfer funds — so you never have to chase a tenant.',
                features: ['Monthly rent collection', 'Arrears management', 'Monthly statements', 'Direct landlord transfer'],
                popular: false,
              },
              {
                price: '8%', name: 'Full Management', type: 'Monthly',
                desc: 'Comprehensive management covering maintenance, inspections, and compliance.',
                features: ['Everything in Rent Collection', 'Maintenance coordination', 'Regular inspections', 'Legal compliance support'],
                popular: false,
              },
              {
                price: '10%', name: 'Comprehensive Management', type: 'Monthly',
                desc: 'Our complete hands-off package with rent guarantee insurance and dedicated support.',
                features: ['Everything in Full Management', 'Rent guarantee insurance', 'Legal eviction cover', 'Priority support'],
                popular: false,
              },
            ].map(pkg => (
              <Link key={pkg.name} href="/pricing" style={{
                background: pkg.popular ? '#162849' : '#162849',
                border: pkg.popular ? '2px solid #2563eb' : '1px solid rgba(255,255,255,0.08)',
                borderRadius: 10, padding: '32px 28px',
                textDecoration: 'none', display: 'block',
                position: 'relative',
                transition: 'transform 0.25s ease, border-color 0.25s ease',
              }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-5px)';
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(74,144,217,0.6)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLElement).style.borderColor = pkg.popular ? '#2563eb' : 'rgba(255,255,255,0.08)';
                }}
              >
                {pkg.popular && (
                  <div style={{
                    position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)',
                    background: '#2563eb', color: '#fff', fontSize: 9, fontWeight: 800,
                    letterSpacing: 2, textTransform: 'uppercase', padding: '4px 14px',
                    borderRadius: 20, whiteSpace: 'nowrap', fontFamily: "'Poppins', sans-serif",
                  }}>Most Popular</div>
                )}
                <div style={{
                  fontSize: 11, color: 'rgba(255,255,255,0.4)',
                  textTransform: 'uppercase', letterSpacing: 1,
                  marginBottom: 8, fontFamily: "'Poppins', sans-serif",
                }}>{pkg.type}</div>
                <div style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: 'clamp(28px,3vw,38px)', fontWeight: 800,
                  color: pkg.popular ? '#4a90d9' : '#fff',
                  lineHeight: 1, marginBottom: 8,
                }}>{pkg.price}</div>
                <div style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: 15, fontWeight: 700, color: '#fff',
                  marginBottom: 12,
                }}>{pkg.name}</div>
                <p style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: 13, color: 'rgba(255,255,255,0.55)',
                  lineHeight: 1.7, marginBottom: 20,
                }}>{pkg.desc}</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {pkg.features.map(f => (
                    <li key={f} style={{
                      display: 'flex', alignItems: 'flex-start', gap: 8,
                      fontSize: 13, color: 'rgba(255,255,255,0.65)',
                      fontFamily: "'Poppins', sans-serif",
                    }}>
                      <span style={{ color: '#4a90d9', fontWeight: 700, flexShrink: 0 }}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <div style={{
                  fontSize: 12, color: '#4a90d9', fontWeight: 600,
                  letterSpacing: 0.5, textTransform: 'uppercase',
                  fontFamily: "'Poppins', sans-serif",
                }}>View full details →</div>
              </Link>
            ))}
          </div>
          <div style={{ textAlign: 'center' }}>
            <Link href="/pricing" style={{
              display: 'inline-block', padding: '16px 48px',
              background: '#2563eb', color: '#fff', borderRadius: 6,
              fontSize: 14, fontWeight: 700, letterSpacing: '0.5px',
              textTransform: 'uppercase', textDecoration: 'none',
              fontFamily: "'Poppins', sans-serif", transition: 'background 0.2s',
            }}
              onMouseEnter={e => (e.currentTarget.style.background = '#1d4ed8')}
              onMouseLeave={e => (e.currentTarget.style.background = '#2563eb')}
            >
              Compare All Packages
            </Link>
          </div>
        </div>
      </section>


      {/* ── HOW IT WORKS ────────────────────────────────────── */}
      <section style={{
        padding: 'clamp(60px, 8vw, 100px) clamp(24px, 7%, 100px)',
        background: '#fff',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: 3,
            textTransform: 'uppercase', color: '#2563eb', marginBottom: 14,
            fontFamily: "'Poppins', sans-serif",
          }}>
            Getting Started
          </div>
          <h2 style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: 'clamp(28px,4vw,48px)', fontWeight: 700,
            color: '#0f1f3d', margin: 0,
          }}>
            Let your property in 4 simple steps
          </h2>
        </div>
        <style>{`
          .ll-steps-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 32px;
            max-width: 1100px;
            margin: 0 auto;
          }
          @media (max-width: 900px) { .ll-steps-grid { grid-template-columns: 1fr 1fr; } }
          @media (max-width: 500px) { .ll-steps-grid { grid-template-columns: 1fr; } }
        `}</style>
        <div className="ll-steps-grid">
          {[
            { n: '01', title: 'Book a Valuation', desc: 'Our local expert visits your property and gives you an honest, data-backed rental valuation — completely free.' },
            { n: '02', title: 'Choose Your Package', desc: 'Pick from Virtual Tenant Find, Expert Tenant Find, or one of our management packages. No pressure, no hard sell.' },
            { n: '03', title: 'We Find Your Tenant', desc: 'We advertise, screen applicants, conduct viewings, and handle all referencing so only the best tenants make it through.' },
            { n: '04', title: 'Sit Back & Collect', desc: 'Once your tenant is in, we handle everything from rent collection to maintenance calls. You just enjoy the returns.' },
          ].map(step => (
            <div key={step.n} style={{ textAlign: 'center' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: '#eff6ff', border: '2px solid #2563eb',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px',
                fontFamily: "'Poppins', sans-serif",
                fontSize: 18, fontWeight: 800, color: '#2563eb',
              }}>{step.n}</div>
              <h3 style={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: 16, fontWeight: 700, color: '#0f1f3d',
                marginBottom: 10,
              }}>{step.title}</h3>
              <p style={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: 14, color: '#6b7280', lineHeight: 1.7,
              }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>


      {/* ── CTA BANNER ──────────────────────────────────────── */}
      <section style={{
        background: '#0f1f3d',
        padding: 'clamp(56px, 8vw, 80px) clamp(24px, 7%, 100px)',
        position: 'relative', overflow: 'hidden',
        textAlign: 'center',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at 50% 50%, rgba(37,99,235,0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: 3,
            textTransform: 'uppercase', color: '#4a90d9', marginBottom: 16,
            fontFamily: "'Poppins', sans-serif",
          }}>
            Get Started Today
          </div>
          <h2 style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: 'clamp(28px,4vw,52px)', fontWeight: 700,
            color: '#fff', marginBottom: 16,
          }}>
            Ready to maximise your <span style={{ color: '#4a90d9' }}>rental returns?</span>
          </h2>
          <p style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: 16, color: 'rgba(255,255,255,0.55)',
            maxWidth: 520, margin: '0 auto 40px', lineHeight: 1.7, fontWeight: 300,
          }}>
            Book a free valuation today and find out exactly what your property could be earning.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => setValuationOpen(true)}
              style={{
                padding: '16px 44px', background: '#2563eb', color: '#fff',
                border: 'none', borderRadius: 6, fontSize: 15, fontWeight: 700,
                letterSpacing: '0.5px', cursor: 'pointer', transition: 'background 0.2s',
                fontFamily: "'Poppins', sans-serif", textTransform: 'uppercase',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#1d4ed8')}
              onMouseLeave={e => (e.currentTarget.style.background = '#2563eb')}
            >
              Book a Free Valuation
            </button>
            <Link href="/pricing" style={{
              padding: '16px 44px', background: 'transparent', color: '#fff',
              border: '1.5px solid rgba(255,255,255,0.35)', borderRadius: 6,
              fontSize: 15, fontWeight: 600, textDecoration: 'none',
              fontFamily: "'Poppins', sans-serif", textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              View Pricing
            </Link>
          </div>
        </div>
      </section>


      {/* ── FOOTER ──────────────────────────────────────────── */}
      <footer style={{
        background: '#050a12', borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: 'clamp(32px, 5vw, 48px) clamp(24px, 7%, 100px)',
      }}>
        <style>{`
          @media (max-width: 600px) {
            .ll-footer { flex-direction: column !important; align-items: flex-start !important; gap: 20px !important; }
          }
        `}</style>
        <div className="ll-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
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
            <Link href="/" style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, textDecoration: 'none' }}>Home</Link>
          </div>
        </div>
      </footer>

      <Suspense fallback={null}>
        {valuationOpen && <ValuationModal isOpen={valuationOpen} onClose={() => setValuationOpen(false)} />}
      </Suspense>
    </>
  );
}
