'use client';
// app/additional-services/page.tsx
import { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import { SERVICE_CATEGORIES } from '@/lib/additionalServices';
import { isOrderable } from '@/lib/serviceCart';
import OrderControls from '@/components/services/OrderControls';
import CartBar from '@/components/services/CartBar';
import Footer from '@/components/layout/Footer';

export default function AdditionalServicesPage() {
  const [open, setOpen] = useState<string | null>(null);

  const toggle = (id: string) => setOpen((cur) => (cur === id ? null : id));

  return (
    <>
      <Navbar />

      <style>{`
        .as-jump-bar {
          position: sticky;
          top: 72px;
          z-index: 50;
          background: rgba(255,255,255,0.96);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border-bottom: 1px solid var(--gray-200);
        }
        .as-jump-inner {
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 5%;
          display: flex;
          gap: 8px;
          overflow-x: auto;
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .as-jump-inner::-webkit-scrollbar { display: none; }
        .as-jump-link {
          flex-shrink: 0;
          padding: 14px 4px;
          margin: 0 8px;
          font-family: 'Poppins', sans-serif;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: #475569;
          text-decoration: none;
          border-bottom: 2px solid transparent;
          transition: color 0.2s, border-color 0.2s;
          white-space: nowrap;
        }
        .as-jump-link:hover {
          color: var(--navy);
          border-bottom-color: var(--blue);
        }
        .as-card {
          background: #fff;
          border: 1px solid var(--gray-200);
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 2px 12px rgba(15,31,61,0.06);
          transition: box-shadow 0.25s ease, border-color 0.25s ease;
        }
        .as-card:hover { box-shadow: 0 10px 28px rgba(15,31,61,0.12); }
        .as-card.is-open { border-color: var(--navy); }
        .as-card__head {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 18px;
          padding: 22px 24px;
          background: transparent;
          border: none;
          cursor: pointer;
          text-align: left;
        }
        .as-card__price {
          flex-shrink: 0;
          text-align: right;
          margin-left: auto;
        }
        .as-card__chev {
          flex-shrink: 0;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: var(--gray-100);
          color: var(--navy);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          transition: transform 0.3s ease;
        }
        .as-card.is-open .as-card__chev {
          transform: rotate(180deg);
          background: var(--blue);
          color: #fff;
        }
        .as-card__body { display: none; }
        .as-card.is-open .as-card__body { display: block; }
        .as-card.is-open .as-detail-grid { animation: asFadeUp 0.3s ease both; }
        @keyframes asFadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .as-detail-grid {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 32px;
          padding: 6px 24px 28px;
          border-top: 1px solid var(--gray-100);
        }
        .as-price-table {
          width: 100%;
          border-collapse: collapse;
        }
        .as-price-table td {
          padding: 10px 0;
          border-bottom: 1px solid var(--gray-100);
          font-family: 'Poppins', sans-serif;
          font-size: 13.5px;
          color: var(--gray-800);
          vertical-align: top;
        }
        .as-price-table tr:last-child td { border-bottom: none; }
        .as-price-table td:last-child {
          text-align: right;
          font-weight: 700;
          color: var(--navy);
          white-space: nowrap;
          padding-left: 16px;
        }
        .as-card__name { font-size: 17px; font-weight: 700; color: var(--navy); line-height: 1.3; margin-bottom: 4px; }
        .as-card__tag { font-size: 13px; color: #475569; line-height: 1.5; }
        .as-order-wrap { padding: 0 24px 26px; }
        @media (max-width: 760px) {
          .as-jump-bar { top: 60px; }
          .as-detail-grid { grid-template-columns: 1fr; gap: 22px; padding: 6px 16px 24px; }
          .as-order-wrap { padding: 0 16px 22px; }
          .as-card__head { padding: 16px 16px; gap: 12px; align-items: flex-start; flex-wrap: nowrap; }
          .as-card__name { font-size: 15.5px; }
          .as-card__tag { font-size: 12.5px; }
          .as-card__price { padding-top: 2px; }
          .as-card__price > div:first-child { font-size: 18px !important; }
          .as-card__chev { width: 30px; height: 30px; }
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
          backgroundImage: 'url(/images/Background_of_the_services.webp)',
          backgroundSize: 'cover', backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(5,12,30,0.88)' }} />
        <div style={{ position: 'relative', zIndex: 1, padding: '0 5%' }}>
          <h1 style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: 'clamp(36px, 5.5vw, 68px)',
            fontWeight: 700, color: '#fff',
            margin: '0 0 20px', lineHeight: 1.05,
          }}>
            Additional Services
          </h1>
          <p style={{
            fontSize: 17, color: 'rgba(255,255,255,0.9)',
            maxWidth: 640, margin: '0 auto',
            lineHeight: 1.75, fontWeight: 400,
            fontFamily: "'Poppins', sans-serif",
          }}>
            Order any of these services individually, whether or not you use one of our
            management packages. Every price includes VAT/IPT where applicable.
          </p>
          <p style={{
            fontSize: 13.5, color: 'rgba(255,255,255,0.72)',
            maxWidth: 560, margin: '14px auto 0',
            lineHeight: 1.7,
            fontFamily: "'Poppins', sans-serif",
          }}>
            &ldquo;From&rdquo; prices are starting rates. The final cost depends on the size,
            furnishing and location of the property.
          </p>
        </div>
      </section>

      {/* ── CATEGORY JUMP BAR ────────────────────────────────── */}
      <div className="as-jump-bar">
        <div className="as-jump-inner">
          {SERVICE_CATEGORIES.map((cat) => (
            <a key={cat.id} href={`#${cat.id}`} className="as-jump-link">
              {cat.title}
            </a>
          ))}
        </div>
      </div>

      {/* ── SERVICES ─────────────────────────────────────────── */}
      <section style={{ background: '#f7f8fa', padding: '64px 5% 90px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          {SERVICE_CATEGORIES.map((cat, ci) => (
            <div key={cat.id} id={cat.id} style={{ marginBottom: ci < SERVICE_CATEGORIES.length - 1 ? 64 : 0, scrollMarginTop: 130 }}>
              {/* Category heading */}
              <div style={{ marginBottom: 24 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8,
                }}>
                  <span style={{
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: 12, fontWeight: 800, color: '#fff',
                    background: 'var(--blue)', borderRadius: 6,
                    width: 28, height: 28, display: 'inline-flex',
                    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    {ci + 1}
                  </span>
                  <h2 style={{
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: 'clamp(22px, 2.6vw, 30px)', fontWeight: 700,
                    color: 'var(--navy)', margin: 0, lineHeight: 1.2,
                  }}>
                    {cat.title}
                  </h2>
                </div>
                <p style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: 14.5, color: '#475569', margin: 0,
                  paddingLeft: 40, lineHeight: 1.6,
                }}>
                  {cat.blurb}
                </p>
              </div>

              {/* Service cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {cat.services.map((svc) => {
                  const isOpen = open === svc.id;
                  return (
                    <div key={svc.id} className={`as-card${isOpen ? ' is-open' : ''}`}>
                      <button
                        type="button"
                        className="as-card__head"
                        onClick={() => toggle(svc.id)}
                        aria-expanded={isOpen}
                      >
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div className="as-card__name" style={{ fontFamily: "'Poppins', sans-serif" }}>
                            {svc.name}
                          </div>
                          <div className="as-card__tag" style={{ fontFamily: "'Poppins', sans-serif" }}>
                            {svc.tagline}
                          </div>
                        </div>
                        <div className="as-card__price">
                          <div style={{
                            fontFamily: "'Poppins', sans-serif",
                            fontSize: 20, fontWeight: 800, color: 'var(--blue)',
                            lineHeight: 1.1, whiteSpace: 'nowrap',
                          }}>
                            {svc.price}
                          </div>
                          {svc.priceNote && (
                            <div style={{
                              fontFamily: "'Poppins', sans-serif",
                              fontSize: 11, fontWeight: 500, color: '#64748b',
                              textTransform: 'uppercase', letterSpacing: 0.5,
                              marginTop: 2, whiteSpace: 'nowrap',
                            }}>
                              {svc.priceNote}
                            </div>
                          )}
                        </div>
                        <span className="as-card__chev" aria-hidden>▾</span>
                      </button>

                      <div className="as-card__body">
                        <div className="as-detail-grid">
                            {/* Left: what it is + what's included */}
                            <div>
                              <div style={{
                                fontFamily: "'Poppins', sans-serif",
                                fontSize: 11, fontWeight: 700, letterSpacing: 2,
                                textTransform: 'uppercase', color: 'var(--blue)',
                                margin: '18px 0 8px',
                              }}>
                                What it is
                              </div>
                              <p style={{
                                fontFamily: "'Poppins', sans-serif",
                                fontSize: 14, color: 'var(--gray-800)',
                                lineHeight: 1.75, margin: 0,
                              }}>
                                {svc.whatItIs}
                              </p>

                              <div style={{
                                fontFamily: "'Poppins', sans-serif",
                                fontSize: 11, fontWeight: 700, letterSpacing: 2,
                                textTransform: 'uppercase', color: 'var(--blue)',
                                margin: '22px 0 10px',
                              }}>
                                What&rsquo;s included
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {svc.included.map((item) => (
                                  <div key={item} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                    <span style={{
                                      width: 18, height: 18, borderRadius: '50%',
                                      background: 'rgba(10,22,47,0.08)',
                                      color: 'var(--navy)', fontSize: 10, fontWeight: 900,
                                      display: 'inline-flex', alignItems: 'center',
                                      justifyContent: 'center', flexShrink: 0, marginTop: 2,
                                    }}>✓</span>
                                    <span style={{
                                      fontFamily: "'Poppins', sans-serif",
                                      fontSize: 13.5, color: 'var(--gray-800)', lineHeight: 1.55,
                                    }}>
                                      {item}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Right: pricing breakdown + good to know */}
                            <div>
                              <div style={{
                                background: 'var(--navy)',
                                borderRadius: 12,
                                padding: '20px 22px',
                                marginTop: 18,
                              }}>
                                <div style={{
                                  fontFamily: "'Poppins', sans-serif",
                                  fontSize: 11, fontWeight: 700, letterSpacing: 2,
                                  textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)',
                                  marginBottom: 10,
                                }}>
                                  Pricing
                                </div>
                                <table className="as-price-table">
                                  <tbody>
                                    {svc.pricing.map((line) => (
                                      <tr key={line.label}>
                                        <td style={{ color: 'rgba(255,255,255,0.85)', borderBottomColor: 'rgba(255,255,255,0.1)' }}>
                                          {line.label}
                                        </td>
                                        <td style={{ color: '#fff', borderBottomColor: 'rgba(255,255,255,0.1)' }}>
                                          {line.value}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>

                              <div style={{
                                background: '#fff',
                                border: '1px solid var(--gray-200)',
                                borderLeft: '3px solid var(--blue)',
                                borderRadius: 10,
                                padding: '16px 18px',
                                marginTop: 14,
                              }}>
                                <div style={{
                                  fontFamily: "'Poppins', sans-serif",
                                  fontSize: 11, fontWeight: 700, letterSpacing: 2,
                                  textTransform: 'uppercase', color: 'var(--navy)',
                                  marginBottom: 8,
                                }}>
                                  Good to know
                                </div>
                                <ul style={{ margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 7 }}>
                                  {svc.goodToKnow.map((note) => (
                                    <li key={note} style={{
                                      fontFamily: "'Poppins', sans-serif",
                                      fontSize: 12.5, color: '#475569',
                                      lineHeight: 1.6, display: 'flex', gap: 8,
                                    }}>
                                      <span style={{ color: 'var(--blue)', flexShrink: 0 }}>•</span>
                                      {note}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                          <div className="as-order-wrap">
                            {isOrderable(svc.id) ? (
                              <OrderControls serviceId={svc.id} />
                            ) : (
                              <div style={{
                                marginTop: 4, border: '1px dashed #d3dae4', borderRadius: 12,
                                padding: '14px 18px', background: '#f7f9fc', fontFamily: "'Poppins', sans-serif",
                                fontSize: 13.5, color: '#475569', lineHeight: 1.6,
                              }}>
                                This service is priced on request. Speak to our team and we&rsquo;ll prepare a tailored quote.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                  );
                })}
              </div>
            </div>
          ))}
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
            Want a package that covers it all?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 16, fontWeight: 300, margin: 0, fontFamily: "'Poppins', sans-serif" }}>
            Our management packages bundle these services together for less. Or get in
            touch and we&apos;ll help you pick exactly what you need.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <Link href="/pricing" style={{
            padding: '16px 36px', background: 'var(--blue)', color: '#fff',
            borderRadius: 4, fontSize: 14, fontWeight: 700, letterSpacing: '0.5px',
            textTransform: 'uppercase', textDecoration: 'none', fontFamily: "'Poppins', sans-serif", whiteSpace: 'nowrap',
          }}>View Packages</Link>
          <Link href="/landlord-registration" style={{
            padding: '16px 36px', background: 'transparent', color: '#fff',
            border: '1px solid rgba(255,255,255,0.3)', borderRadius: 4, fontSize: 14,
            fontWeight: 500, letterSpacing: '0.5px', textTransform: 'uppercase',
            textDecoration: 'none', fontFamily: "'Poppins', sans-serif", whiteSpace: 'nowrap',
          }}>Register as a Landlord</Link>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <Footer />

      {/* Spacer so the fixed cart bar never hides the footer, then the bar itself */}
      <div aria-hidden style={{ height: 96 }} />
      <CartBar />
    </>
  );
}
