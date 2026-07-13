'use client';
// app/landlords/page.tsx
import { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { BUNDLES } from '@/lib/bundles';
import { SERVICE_CATEGORIES } from '@/lib/additionalServices';

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
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(165deg, #0c1a33 0%, #15294c 55%, #0f1f3d 100%)',
      }}>
        {/* Clean, balanced backdrop: soft brand-blue accents instead of the old
            photo (whose baked-in text clashed with the headline on mobile). */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background:
            'radial-gradient(ellipse at 78% 12%, rgba(37,99,235,0.22) 0%, transparent 55%),' +
            'radial-gradient(ellipse at 12% 88%, rgba(74,144,217,0.14) 0%, transparent 50%)',
        }} />

        <div style={{
          position: 'relative', zIndex: 1,
          width: '100%',
          maxWidth: 860,
          margin: '0 auto',
          padding: 'clamp(128px,16vw,190px) clamp(24px,6%,80px) clamp(72px,10vw,130px)',
          textAlign: 'center',
        }}>
          <div style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: 12, fontWeight: 700, letterSpacing: 4,
            textTransform: 'uppercase', color: '#4a90d9', marginBottom: 18,
          }}>
            For Landlords · Leeds &amp; Manchester
          </div>
          <h1 style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: 'clamp(40px,7vw,78px)',
            fontWeight: 800, color: '#fff',
            lineHeight: 1.04, letterSpacing: '-1px',
            textTransform: 'uppercase',
            marginBottom: 24,
          }}>
            Better management.<br />
            Better tenants.<br />
            <span style={{ color: '#4a90d9' }}>Better returns.</span>
          </h1>
          <p style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: 'clamp(15px,1.3vw,18px)',
            color: 'rgba(255,255,255,0.7)',
            lineHeight: 1.75, marginBottom: 28,
            fontWeight: 300,
            maxWidth: 580, margin: '0 auto 28px',
          }}>
            Professional lettings and property management that protects your
            investment and maximises your returns, across Leeds and Manchester.
          </p>
          <div style={{
            display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 40,
          }}>
            {['Inclusive of VAT', 'No hidden fees', 'Fully compliant', 'Local expert teams'].map(chip => (
              <span key={chip} style={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: 12.5, fontWeight: 600, color: '#dbe8fb',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.14)',
                borderRadius: 999, padding: '7px 14px',
              }}>{chip}</span>
            ))}
          </div>
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
            .ll-price-panel { position: static !important; }
          }
          /* Pricing-at-a-glance panel (replaces the old hero image) */
          .ll-price-panel {
            background: linear-gradient(160deg,#15294c 0%,#0c1a33 100%);
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 16px; padding: 26px 24px;
            box-shadow: 0 26px 54px -30px rgba(9,18,40,0.75);
            position: sticky; top: 96px;
          }
          .ll-price-eyebrow { font-family:'Poppins',sans-serif; font-size:11px; font-weight:700;
            letter-spacing:.14em; text-transform:uppercase; color:#4a90d9; }
          .ll-price-title { font-family:'Poppins',sans-serif; font-size:22px; font-weight:800; color:#fff; margin:7px 0 4px; }
          .ll-price-sub { font-family:'Poppins',sans-serif; font-size:12.5px; color:#a9c4ea; }
          .ll-price-list { list-style:none; margin:20px 0 0; padding:0; }
          .ll-price-row { display:flex; align-items:center; justify-content:space-between; gap:14px;
            padding:14px 12px; border-radius:10px; border-top:1px solid rgba(255,255,255,0.07); }
          .ll-price-row:first-child { border-top:0; }
          .ll-price-row.ll-hot { background:rgba(37,99,235,0.16); border-top-color:transparent; }
          .ll-price-nm { display:flex; align-items:center; gap:8px; font-family:'Poppins',sans-serif;
            font-size:14.5px; font-weight:700; color:#fff; }
          .ll-price-nm em { font-style:normal; font-size:9px; font-weight:800; letter-spacing:.08em;
            text-transform:uppercase; background:#2563eb; color:#fff; border-radius:999px; padding:2px 8px; }
          .ll-price-kd { display:block; font-family:'Poppins',sans-serif; font-size:11.5px; color:#8fa6c9; margin-top:3px; }
          .ll-price-fig { text-align:right; flex:none; }
          .ll-price-fig b { display:block; font-family:'Poppins',sans-serif; font-size:18px; font-weight:800; color:#fff; }
          .ll-price-fig span { font-family:'Poppins',sans-serif; font-size:11px; color:#a9c4ea; }
          .ll-price-cta { display:inline-block; margin-top:20px; font-family:'Poppins',sans-serif;
            font-size:13px; font-weight:700; color:#4a90d9; text-decoration:none; }
          .ll-price-cta:hover { color:#fff; }
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
          {/* Pricing snapshot (title + price only) in place of the old flyer image */}
          <div className="ll-price-panel">
            <span className="ll-price-eyebrow">Our Packages</span>
            <h3 className="ll-price-title">Pricing at a glance</h3>
            <span className="ll-price-sub">Inclusive of VAT. No hidden fees, ever.</span>
            <ul className="ll-price-list">
              {BUNDLES.map(b => (
                <li key={b.id} className={`ll-price-row${b.badge ? ' ll-hot' : ''}`}>
                  <div>
                    <span className="ll-price-nm">{b.short}{b.badge && <em>Popular</em>}</span>
                    <span className="ll-price-kd">{b.kind}</span>
                  </div>
                  <div className="ll-price-fig">
                    <b>{b.setupFee}</b>
                    <span>{b.mgmtFee ? `+ ${b.mgmtFee} of rent` : 'one-time'}</span>
                  </div>
                </li>
              ))}
            </ul>
            <Link href="/pricing" className="ll-price-cta">See what&apos;s included in each &rarr;</Link>
          </div>
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
            {/* Prices mirror lib/bundles.ts — keep in sync with the pricing page. */}
            {[
              {
                slug: 'virtual-tenant-find',
                price: '£399', name: 'Virtual Tenant Find', type: 'One-time fee',
                desc: 'Advertise your property, handle enquiries, and secure a tenant, all managed online.',
                features: ['Professional listing creation', 'Multi portal advertising', 'Enquiry management', 'Full tenant referencing'],
                popular: false,
              },
              {
                slug: 'expert-tenant-find',
                price: '£699', name: 'Expert Tenant Find', type: 'One-time fee',
                desc: 'The full marketing push: professional photography, accompanied viewings, and in-person tenancy setup.',
                features: ['Everything in Virtual', 'Photography & floor plan', 'Accompanied viewings', 'In-person tenant handover'],
                popular: false,
              },
              {
                slug: 'essential-management',
                price: '6%', name: 'Essential Management', type: '£199 setup · monthly',
                desc: 'We collect rent, chase arrears, and transfer funds, so you never have to chase a tenant.',
                features: ['Includes a full tenant find', 'Monthly rent collection', 'Arrears management', 'Monthly statements'],
                popular: false,
              },
              {
                slug: 'full-management',
                price: '8%', name: 'Full Management', type: '£399 setup · monthly',
                desc: 'Comprehensive management covering maintenance, inspections, and compliance.',
                features: ['Everything in Essential', 'Maintenance coordination', 'Regular inspections', 'Compliance monitoring'],
                popular: true,
              },
              {
                slug: 'comprehensive-management',
                price: '10%', name: 'Comprehensive Management', type: '£399 setup · monthly',
                desc: 'Our complete hands off package with rent guarantee insurance and dedicated support.',
                features: ['Everything in Full Management', 'Rent guarantee cover', 'Legal & eviction protection', 'Priority contractor response'],
                popular: false,
              },
            ].map(pkg => (
              <Link key={pkg.name} href={`/pricing/${pkg.slug}`} style={{
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
          <p style={{
            fontFamily: "'Poppins', sans-serif", textAlign: 'center',
            fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7,
            maxWidth: 640, margin: '0 auto 28px',
          }}>
            All prices inclusive of VAT. Every management tier includes a full tenant find, and
            management runs on a rolling monthly basis, so you can upgrade or cancel any time.
          </p>
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


      {/* ── ADDITIONAL SERVICES ─────────────────────────────── */}
      <section style={{
        padding: 'clamp(60px, 8vw, 100px) clamp(24px, 7%, 100px)',
        background: '#f7f8fa',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 52, maxWidth: 620, marginLeft: 'auto', marginRight: 'auto' }}>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: 3,
            textTransform: 'uppercase', color: '#2563eb', marginBottom: 14,
            fontFamily: "'Poppins', sans-serif",
          }}>
            Pay As You Go
          </div>
          <h2 style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: 'clamp(28px,4vw,44px)', fontWeight: 700,
            color: '#0f1f3d', margin: '0 0 16px',
          }}>
            Additional services, whenever you need them
          </h2>
          <p style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: 15, color: '#6b7280', lineHeight: 1.7, margin: 0,
          }}>
            Certificates, inventories, photography, referencing and rent protection. Order any
            service on its own, with or without a package, all inclusive of VAT.
          </p>
        </div>
        <style>{`
          .ll-as-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            max-width: 1100px;
            margin: 0 auto 44px;
          }
          .ll-as-card {
            background: #fff; border: 1px solid #e5e7eb; border-radius: 14px;
            padding: 26px 24px; text-decoration: none; display: flex; flex-direction: column;
            transition: transform .2s ease, border-color .2s ease, box-shadow .2s ease;
          }
          .ll-as-card:hover {
            transform: translateY(-4px); border-color: #2563eb;
            box-shadow: 0 20px 40px -26px rgba(15,31,61,.4);
          }
          .ll-as-title { font-family:'Poppins',sans-serif; font-size:16px; font-weight:700;
            color:#0f1f3d; margin:0 0 16px; line-height:1.3; }
          .ll-as-list { list-style:none; margin:0 0 18px; padding:0; display:flex; flex-direction:column; gap:11px; flex:1; }
          .ll-as-item { display:flex; align-items:baseline; justify-content:space-between; gap:12px; }
          .ll-as-item span { font-family:'Poppins',sans-serif; font-size:13.5px; color:#4b5563; line-height:1.4; }
          .ll-as-item b { flex:none; font-family:'Poppins',sans-serif; font-size:13.5px; font-weight:800; color:#2563eb; white-space:nowrap; }
          .ll-as-more { font-family:'Poppins',sans-serif; font-size:12px; font-weight:700;
            letter-spacing:.4px; text-transform:uppercase; color:#2563eb; }
        `}</style>
        <div className="ll-as-grid">
          {SERVICE_CATEGORIES.map(cat => (
            <Link key={cat.id} href="/additional-services" className="ll-as-card">
              <h3 className="ll-as-title">{cat.title}</h3>
              <ul className="ll-as-list">
                {cat.services.slice(0, 3).map(s => (
                  <li key={s.id} className="ll-as-item">
                    <span>{s.name}</span>
                    <b>{s.price}</b>
                  </li>
                ))}
              </ul>
              <span className="ll-as-more">View all &rarr;</span>
            </Link>
          ))}
        </div>
        <div style={{ textAlign: 'center' }}>
          <Link href="/additional-services" style={{
            display: 'inline-block', padding: '16px 48px',
            background: '#0f1f3d', color: '#fff', borderRadius: 6,
            fontSize: 14, fontWeight: 700, letterSpacing: '0.5px',
            textTransform: 'uppercase', textDecoration: 'none',
            fontFamily: "'Poppins', sans-serif", transition: 'background 0.2s',
          }}
            onMouseEnter={e => (e.currentTarget.style.background = '#162849')}
            onMouseLeave={e => (e.currentTarget.style.background = '#0f1f3d')}
          >
            Browse All Additional Services
          </Link>
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


      {/* ── LANDLORD RESPONSIBILITIES CHECKLIST ─────────────── */}
      <section style={{
        padding: 'clamp(60px, 8vw, 100px) clamp(24px, 7%, 100px)',
        background: '#f7f8fa',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 52, maxWidth: 640, marginLeft: 'auto', marginRight: 'auto' }}>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: 3,
            textTransform: 'uppercase', color: '#2563eb', marginBottom: 14,
            fontFamily: "'Poppins', sans-serif",
          }}>
            Know Your Obligations
          </div>
          <h2 style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: 'clamp(28px,4vw,44px)', fontWeight: 700,
            color: '#0f1f3d', margin: '0 0 16px',
          }}>
            A landlord&rsquo;s legal responsibilities at a glance
          </h2>
          <p style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: 15, color: '#6b7280', lineHeight: 1.7, margin: 0,
          }}>
            Letting a property in England comes with real legal duties. Here is what every
            landlord needs in place. On our managed packages, we arrange, track and renew all of it for you.
          </p>
        </div>
        <style>{`
          .ll-resp-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
            gap: 20px;
            max-width: 1100px;
            margin: 0 auto;
          }
          .ll-resp-card {
            background: #fff; border: 1px solid #e5e7eb; border-radius: 14px;
            padding: 26px 24px; display: flex; flex-direction: column;
          }
          .ll-resp-ic {
            width: 40px; height: 40px; border-radius: 10px; background: #eff6ff;
            display: inline-flex; align-items: center; justify-content: center;
            font-size: 20px; margin-bottom: 14px;
          }
          .ll-resp-h { font-family:'Poppins',sans-serif; font-size:16px; font-weight:700; color:#0f1f3d; margin:0 0 8px; line-height:1.3; }
          .ll-resp-p { font-family:'Poppins',sans-serif; font-size:13.5px; color:#4b5563; line-height:1.65; margin:0; }
        `}</style>
        <div className="ll-resp-grid">
          {[
            { ic: '🔥', h: 'Gas safety', p: 'An annual Gas Safety Certificate (CP12) from a Gas Safe registered engineer if the property has any gas appliances.' },
            { ic: '⚡', h: 'Electrical safety', p: 'A satisfactory Electrical Installation Condition Report (EICR), renewed at least every 5 years, with any faults put right.' },
            { ic: '📋', h: 'Energy performance', p: 'A valid EPC rated E or above, provided to tenants before they move in. Minimum standards are set to tighten in the coming years.' },
            { ic: '🔔', h: 'Smoke and CO alarms', p: 'A working smoke alarm on every floor and a carbon monoxide alarm in any room with a fuel burning appliance, tested at the start of a tenancy.' },
            { ic: '🛡️', h: 'Deposit protection', p: 'Any deposit placed in a government approved scheme within 30 days, with the prescribed information served on the tenant.' },
            { ic: '🪪', h: 'Right to Rent', p: 'Every adult occupier checked for the right to rent in England before the tenancy begins, with records kept.' },
            { ic: '📑', h: 'How to Rent guide', p: 'The latest government How to Rent guide issued to tenants, so a valid notice can be served later if ever needed.' },
            { ic: '🏷️', h: 'Licensing', p: 'HMO and selective licensing checked for the property and postcode. Many parts of Leeds and Manchester now require a licence.' },
          ].map((c) => (
            <div key={c.h} className="ll-resp-card">
              <span className="ll-resp-ic" aria-hidden>{c.ic}</span>
              <h3 className="ll-resp-h">{c.h}</h3>
              <p className="ll-resp-p">{c.p}</p>
            </div>
          ))}
        </div>
        <div style={{
          maxWidth: 1100, margin: '28px auto 0',
          background: '#fff', border: '1px solid #e5e7eb', borderLeft: '3px solid #2563eb',
          borderRadius: 12, padding: '18px 22px',
        }}>
          <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: 13.5, color: '#475569', lineHeight: 1.7, margin: 0 }}>
            <strong style={{ color: '#0f1f3d' }}>Heads up:</strong> the Renters&rsquo; Rights reforms are changing how tenancies work,
            including the move away from Section 21 no fault evictions and new rules on how homes are let and managed.
            We keep every landlord we work with updated as the law changes, so your properties stay compliant.
          </p>
        </div>
      </section>


      {/* ── FAQ ─────────────────────────────────────────────── */}
      <section style={{
        padding: 'clamp(60px, 8vw, 100px) clamp(24px, 7%, 100px)',
        background: '#fff',
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
      <Footer />

    </>
  );
}
