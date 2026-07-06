'use client';
// app/landlords/page.tsx
import { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';

const landlordFaqs = [
  {
    q: 'What legal certificates do I need before letting my property?',
    a: 'You\u2019ll need a valid Gas Safety Certificate (renewed annually if the property has gas appliances), an Electrical Installation Condition Report (EICR, renewed every 5 years), and an Energy Performance Certificate (EPC) rated E or above. Working smoke alarms on every floor and a carbon monoxide alarm in any room with a fuel burning appliance are also required by law. We arrange and track all of this for you under our managed packages.',
  },
  {
    q: 'Do I need to protect my tenant\u2019s deposit?',
    a: 'Yes, any deposit taken must be placed in a government approved tenancy deposit scheme (such as the DPS, mydeposits, or TDS) within 30 days of receiving it, and the tenant must be given the prescribed information. Failing to do this properly can prevent you from serving a valid Section 21 notice and can result in a financial penalty.',
  },
  {
    q: 'Do I need a licence to rent out my property?',
    a: 'It depends on the property and the local authority. Houses in Multiple Occupation (HMOs) above a certain size need a mandatory HMO licence, and many areas of Leeds and Manchester also fall under selective licensing schemes that apply to all rental properties in that zone. We check the licensing requirements for every property we manage and handle the application if one is needed.',
  },
  {
    q: 'How much notice do I need to give a tenant to end a tenancy?',
    a: 'For a no fault eviction under Section 21, landlords currently need to give at least 2 months\u2019 notice, and the property must be fully compliant (deposit protected, certificates served, EPC and gas safety provided) for the notice to be valid. Section 8 notices, used for rent arrears or breach of tenancy, have different notice periods depending on the grounds. Rules in this area are changing under upcoming reform, so we keep landlords updated as things shift.',
  },
  {
    q: 'Is my rental income taxable?',
    a: 'Yes, rental profit is taxable income and must be declared via Self Assessment. Mortgage interest is no longer fully deductible; instead, landlords receive a 20% tax credit on finance costs. Allowable expenses (letting agent fees, maintenance, insurance, etc.) can still be deducted from rental income before tax. We\u2019d always recommend speaking with an accountant about your specific position.',
  },
  {
    q: 'Do I need landlord insurance?',
    a: 'It\u2019s not a legal requirement, but it\u2019s strongly recommended, a standard home insurance policy typically won\u2019t cover a let property. Landlord insurance covers the building and your liability as a landlord, and can be extended with rent guarantee or legal expenses cover. We can point you toward providers who specialise in this if you don\u2019t already have a policy.',
  },
];

export default function LandlordsPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────── */}
      <style>{`
        .hero-btn {
          padding: 18px 0;
          width: 280px;
          font-size: 15px;
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
          backgroundImage: 'url(/images/Landlord_page.webp)',
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
          width: '100%',
          maxWidth: 860,
          margin: '0 auto',
          padding: 'clamp(100px,12vw,140px) clamp(32px,6%,80px) clamp(80px,10vw,120px)',
          textAlign: 'center',
        }}>
          <h1 style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: 'clamp(40px,5.5vw,72px)',
            fontWeight: 800, color: '#fff',
            lineHeight: 1.12, letterSpacing: '-1px',
            marginBottom: 28,
          }}>
            We handle the management.<br />
            You enjoy the returns.
          </h1>
          <p style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: 'clamp(15px,1.3vw,18px)',
            color: 'rgba(255,255,255,0.72)',
            lineHeight: 1.7, marginBottom: 44,
            fontWeight: 300,
            maxWidth: 560, margin: '0 auto 44px',
          }}>
            Serving landlords across Leeds &amp; Manchester.
          </p>
          <div className="hero-btns" style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link href="/book-valuation"
              className="hero-btn"
              style={{ background: '#2563eb', color: '#fff', border: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#1d4ed8')}
              onMouseLeave={e => (e.currentTarget.style.background = '#2563eb')}
            >
              Book a Free Valuation
            </Link>
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
            gap: 56px;
            align-items: start;
            max-width: 1100px;
            margin: 0 auto;
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
              At House of Lettings, we believe landlords deserve more than just a property manager, they deserve a partner. Our local experts in Leeds and Manchester work to maximise your rental yield, keep your property compliant, and take the day to day stress completely off your plate.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 36px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                'Free, no obligation rental valuation',
                'Transparent pricing, no hidden fees, ever',
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
            <Link href="/book-valuation"
              style={{
                padding: '14px 32px', background: '#0f1f3d', color: '#fff',
                border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 700,
                letterSpacing: '0.5px', cursor: 'pointer', transition: 'background 0.2s',
                fontFamily: "'Poppins', sans-serif", textTransform: 'uppercase',
                textDecoration: 'none', display: 'inline-block',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#162849')}
              onMouseLeave={e => (e.currentTarget.style.background = '#0f1f3d')}
            >
              Get a Free Valuation
            </Link>
          </div>
          <img
            src="/images/Landlord_Book_valuation_background.webp"
            alt="Better Management. Better Tenants. Better Returns."
            className="ll-intro-img"
            style={{
              width: '100%', height: 'auto',
              borderRadius: 12, display: 'block',
              objectFit: 'cover',
              marginTop: 4,
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
              From a one time tenant find to fully comprehensive management, choose what works for your portfolio.
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
                price: '£499', name: 'Virtual Tenant Find', type: 'One time fee',
                desc: 'Advertise your property, handle enquiries, and secure a tenant, all managed online.',
                features: ['Professional listing creation', 'Multi portal advertising', 'Enquiry management', 'Tenant referencing'],
                popular: false,
              },
              {
                price: '£799', name: 'Expert Tenant Find', type: 'One time fee',
                desc: 'Everything in Virtual, plus an in person agent visit, accompanied viewings, and tenancy setup.',
                features: ['Everything in Virtual', 'Agent property visit', 'Accompanied viewings', 'Full tenancy setup'],
                popular: true,
              },
              {
                price: '6%', name: 'Rent Collection', type: 'Monthly',
                desc: 'We collect rent, chase arrears, and transfer funds, so you never have to chase a tenant.',
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
                desc: 'Our complete hands off package with rent guarantee insurance and dedicated support.',
                features: ['Everything in Full Management', 'Rent guarantee insurance', 'Legal eviction cover', 'Priority support'],
                popular: false,
              },
            ].map(pkg => (
              <Link key={pkg.name} href="/pricing" style={{
                background: pkg.popular ? '#162849' : '#162849',
                border: '2px solid #2563eb',
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
                  (e.currentTarget as HTMLElement).style.borderColor = '#2563eb';
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
            { n: '01', title: 'Book a Valuation', desc: 'Our local expert visits your property and gives you an honest, data backed rental valuation, completely free.' },
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


      {/* ── FAQ ─────────────────────────────────────────────── */}
      <section style={{
        padding: 'clamp(60px, 8vw, 100px) clamp(24px, 7%, 100px)',
        background: '#f7f8fa',
      }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{
            textAlign: 'center', fontSize: 11, fontWeight: 700, letterSpacing: 3,
            textTransform: 'uppercase', color: '#2563eb', marginBottom: 14,
            fontFamily: "'Poppins', sans-serif",
          }}>
            Common Questions
          </div>
          <h2 style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: 'clamp(28px,4vw,44px)', fontWeight: 700,
            color: '#0f1f3d', textAlign: 'center', marginBottom: 48,
          }}>
            What landlords should know
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {landlordFaqs.map((faq, i) => (
              <div key={i} style={{ borderTop: '1px solid rgba(15,31,61,0.12)', borderBottom: i === landlordFaqs.length - 1 ? '1px solid rgba(15,31,61,0.12)' : 'none' }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{
                    width: '100%', background: 'none', border: 'none', color: '#0f1f3d',
                    textAlign: 'left', padding: '22px 0', display: 'flex',
                    justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer',
                    fontFamily: "'Poppins', sans-serif", fontSize: 16, fontWeight: 700, gap: 16,
                  }}
                >
                  {faq.q}
                  <span style={{
                    color: '#2563eb', fontSize: 22, flexShrink: 0, lineHeight: 1,
                    transform: openFaq === i ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s',
                  }}>+</span>
                </button>
                {openFaq === i && (
                  <p style={{
                    fontFamily: "'Poppins', sans-serif",
                    color: '#4b5563', fontSize: 14, lineHeight: 1.8, paddingBottom: 24, margin: 0,
                  }}>{faq.a}</p>
                )}
              </div>
            ))}
          </div>
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
          <h2 style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: 'clamp(28px,4vw,52px)', fontWeight: 700,
            color: '#fff', marginBottom: 16,
          }}>
            Ready to maximise your <span style={{ color: '#fff' }}>rental returns?</span>
          </h2>
          <p style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: 16, color: 'rgba(255,255,255,0.55)',
            maxWidth: 520, margin: '0 auto 40px', lineHeight: 1.7, fontWeight: 300,
          }}>
            Book a free valuation today and find out exactly what your property could be earning.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/book-valuation"
              style={{
                padding: '16px 44px', background: '#2563eb', color: '#fff',
                border: 'none', borderRadius: 6, fontSize: 15, fontWeight: 700,
                letterSpacing: '0.5px', cursor: 'pointer', transition: 'background 0.2s',
                fontFamily: "'Poppins', sans-serif", textTransform: 'uppercase',
                textDecoration: 'none', display: 'inline-block',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#1d4ed8')}
              onMouseLeave={e => (e.currentTarget.style.background = '#2563eb')}
            >
              Book a Free Valuation
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

    </>
  );
}
