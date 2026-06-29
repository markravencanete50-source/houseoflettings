'use client';
// app/pricing/page.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';

type AddressResult = {
  street: string;
  city: string;
  county: string;
  postcode: string;
};

/**
 * Bind Google Places autocomplete to the postcode input.
 * The landlord types a UK postcode, picks a suggestion, and the first
 * line of the address (street) is filled in automatically.
 */
function usePostcodeAutocomplete(onSelect: (data: AddressResult) => void, active: boolean) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // The input only exists once the modal is open, so (re)bind when active.
    if (!active) return;
    let ac: any = null;
    let listener: any = null;

    function initAutocomplete() {
      if (!inputRef.current || !(window as any).google?.maps?.places) return;

      ac = new (window as any).google.maps.places.Autocomplete(inputRef.current, {
        // 'geocode' (not 'address') so postcode-only predictions show up.
        types: ['geocode'],
        componentRestrictions: { country: 'gb' },
        fields: ['address_components'],
      });

      listener = ac.addListener('place_changed', () => {
        const place = ac.getPlace();
        if (!place?.address_components) return;

        let postcode = '', city = '', county = '';
        let streetNumber = '', route = '';

        place.address_components.forEach((comp: any) => {
          if (comp.types.includes('street_number')) streetNumber = comp.long_name;
          if (comp.types.includes('route')) route = comp.long_name;
          if (comp.types.includes('postal_code')) postcode = comp.long_name;
          if (comp.types.includes('postal_town') || comp.types.includes('locality')) city = comp.long_name;
          if (comp.types.includes('administrative_area_level_2')) county = comp.long_name;
        });

        onSelect({
          street: [streetNumber, route].filter(Boolean).join(' '),
          city,
          county,
          postcode,
        });
      });
    }

    if ((window as any).google?.maps?.places) {
      initAutocomplete();
    } else {
      const interval = setInterval(() => {
        if ((window as any).google?.maps?.places) {
          clearInterval(interval);
          initAutocomplete();
        }
      }, 300);
      return () => clearInterval(interval);
    }

    return () => {
      if (listener) (window as any).google?.maps?.event.removeListener(listener);
    };
  }, [onSelect, active]);

  return inputRef;
}

const PACKAGES = [
  {
    id: 'virtual',
    label: 'Virtual Tenant Find',
    price: '£499',
    priceType: 'One-time fee',
    color: '#2563eb',
    bg: 'radial-gradient(ellipse at 20% 60%, rgba(37,99,235,0.18) 0%, transparent 55%), radial-gradient(ellipse at 80% 20%, rgba(15,31,61,0.4) 0%, transparent 60%)',
    badge: null,
    badgeColor: undefined,
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
    color: '#2563eb',
    bg: 'radial-gradient(ellipse at 70% 30%, rgba(37,99,235,0.22) 0%, transparent 55%), radial-gradient(ellipse at 20% 80%, rgba(37,99,235,0.12) 0%, transparent 50%)',
    badge: null,
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
    badge: 'Most Popular',
    badgeColor: '#2563eb',
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
    color: '#2563eb',
    bg: 'radial-gradient(ellipse at 60% 20%, rgba(37,99,235,0.25) 0%, transparent 55%), radial-gradient(ellipse at 15% 85%, rgba(37,99,235,0.15) 0%, transparent 50%)',
    badge: 'Most Complete',
    badgeColor: '#2563eb',
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
  const [active, setActive] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    postcode: '', addressLine1: '', propertyAddress: '', numberOfProperties: '', startDate: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const pkg = PACKAGES[active];

  // Lock body scroll when modal open
  useEffect(() => {
    document.body.style.overflow = showModal ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [showModal]);

  // Load the Google Maps Places script once, for postcode autocomplete.
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
    if (!apiKey) return;
    if ((window as any).google?.maps?.places) return;
    if (document.querySelector('script[data-hol-gmaps]')) return;
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true; script.defer = true;
    (script as any).dataset.holGmaps = '1';
    document.head.appendChild(script);
  }, []);

  const handleAddressSelect = useCallback((data: AddressResult) => {
    setFormData(p => ({
      ...p,
      postcode: data.postcode || p.postcode,
      addressLine1: data.street || p.addressLine1,
    }));
    setError('');
  }, []);

  const postcodeInputRef = usePostcodeAutocomplete(handleAddressSelect, showModal);

  const handleSubmit = async () => {
    setError('');
    const required = ['firstName','lastName','email','phone','postcode','addressLine1','numberOfProperties','startDate'];
    for (const f of required) {
      if (!formData[f as keyof typeof formData].trim()) {
        setError('Please fill in all fields.');
        return;
      }
    }
    // Compose the full property address from the postcode + first line so the
    // backend and confirmation emails keep working unchanged.
    const propertyAddress = [formData.addressLine1, formData.postcode].filter(Boolean).join(', ');
    setSubmitting(true);
    try {
      const res = await fetch('/api/get-started', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, propertyAddress, selectedPackage: pkg.label }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Something went wrong');
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSubmitted(false);
    setError('');
    setFormData({ firstName: '', lastName: '', email: '', phone: '', postcode: '', addressLine1: '', propertyAddress: '', numberOfProperties: '', startDate: '' });
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px',
    background: '#fff',
    border: '1.5px solid #e5e7eb',
    borderRadius: 8, color: '#111827', fontSize: 14,
    fontFamily: "'Poppins', sans-serif",
    outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 13, fontWeight: 500,
    color: '#374151', marginBottom: 6,
    fontFamily: "'Poppins', sans-serif",
  };

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
              border: '2px solid #2563eb',
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

              <button
                onClick={() => setShowModal(true)}
                style={{
                  display: 'block', width: '100%', textAlign: 'center',
                  padding: '16px 24px', background: '#2563eb', color: '#fff',
                  borderRadius: 6, fontSize: 15, fontWeight: 700,
                  letterSpacing: '0.5px', textTransform: 'uppercase',
                  border: 'none', cursor: 'pointer',
                  fontFamily: "'Poppins', sans-serif",
                  transition: 'background 0.2s',
                }}
              >
                Get Started
              </button>

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

      {/* ── GET STARTED MODAL ────────────────────────────────── */}
      {showModal && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <style>{`
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes slideUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
            .gs-input:focus { border-color: #2563eb !important; }
            .gs-input::placeholder { color: #9ca3af; }
            .gs-input option { background: #fff; color: #111; }
            /* Google Places dropdown must sit above the modal (z-index 9999) */
            .pac-container { z-index: 100000 !important; }
          `}</style>

          <div style={{
            background: '#fff',
            borderRadius: 16,
            width: '100%', maxWidth: 540,
            maxHeight: '90vh', overflowY: 'auto',
            animation: 'slideUp 0.25s ease',
            scrollbarWidth: 'none',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}>
            {/* Modal header */}
            <div style={{
              padding: '24px 28px 0',
              position: 'relative',
            }}>
              {/* Close button */}
              <button
                onClick={closeModal}
                style={{
                  position: 'absolute', top: 20, right: 20,
                  background: '#f3f4f6', border: 'none',
                  color: '#6b7280', width: 32, height: 32,
                  borderRadius: '50%', fontSize: 16, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s',
                }}
              >✕</button>

              {/* Selected package badge */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: '#1a3c5e',
                borderRadius: 20, padding: '5px 14px',
                marginBottom: 14,
              }}>
                <span style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: 12, fontWeight: 700, color: '#fff',
                  letterSpacing: 0.5,
                }}>{pkg.label}</span>
              </div>

              <h2 style={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: 26, fontWeight: 700, color: '#111827',
                margin: '0 0 6px',
              }}>Get Started</h2>
              <p style={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: 13, color: '#6b7280', margin: '0 0 20px',
              }}>Fill in your details and we&apos;ll be in touch within 24–48 hours.</p>

              {/* Benefits bar */}
              <div style={{
                background: '#f8f9ff',
                border: '1px solid #e5e7eb',
                borderRadius: 10, padding: '14px 18px',
                marginBottom: 24,
                display: 'flex', flexDirection: 'column', gap: 8,
              }}>
                {['Takes less than two minutes', 'We&apos;ll match you with the right package', 'No commitment until you speak to us'].map((text, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ color: '#2563eb', fontSize: 14, fontWeight: 700 }}>✓</span>
                    <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: 13, color: '#374151' }}
                      dangerouslySetInnerHTML={{ __html: text }} />
                  </div>
                ))}
              </div>

              <h3 style={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: 15, fontWeight: 600, color: '#111827',
                margin: '0 0 16px',
              }}>Your details</h3>
            </div>

            {/* Modal body */}
            <div style={{ padding: '0 28px 28px' }}>
              {submitted ? (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
                  <h3 style={{
                    fontFamily: "'Poppins', sans-serif", fontSize: 20,
                    fontWeight: 700, color: '#111827', marginBottom: 12,
                  }}>Registration Received!</h3>
                  <p style={{
                    fontFamily: "'Poppins', sans-serif", fontSize: 14,
                    color: '#6b7280', lineHeight: 1.7, marginBottom: 28,
                  }}>
                    We&apos;ve sent a confirmation to <strong style={{ color: '#111' }}>{formData.email}</strong>.<br />
                    A member of our team will be in touch shortly.
                  </p>
                  <button
                    onClick={closeModal}
                    style={{
                      padding: '12px 32px', background: '#2563eb', color: '#fff',
                      border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700,
                      cursor: 'pointer', fontFamily: "'Poppins', sans-serif",
                    }}
                  >Close</button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  {/* Row: First + Last name */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div>
                      <label style={labelStyle}>First Name</label>
                      <input
                        className="gs-input"
                        style={inputStyle}
                        placeholder="John"
                        value={formData.firstName}
                        onChange={e => setFormData(p => ({ ...p, firstName: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Last Name</label>
                      <input
                        className="gs-input"
                        style={inputStyle}
                        placeholder="Smith"
                        value={formData.lastName}
                        onChange={e => setFormData(p => ({ ...p, lastName: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label style={labelStyle}>Email Address</label>
                    <input
                      className="gs-input"
                      type="email"
                      style={inputStyle}
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label style={labelStyle}>Phone Number</label>
                    <input
                      className="gs-input"
                      type="tel"
                      style={inputStyle}
                      placeholder="+44 7700 000000"
                      value={formData.phone}
                      onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                    />
                  </div>

                  {/* Property — postcode first (Google autocomplete), then first line of address */}
                  <div>
                    <label style={labelStyle}>What Property Do You Own? Enter Postcode</label>
                    <input
                      ref={postcodeInputRef}
                      className="gs-input"
                      style={inputStyle}
                      placeholder="Start typing a postcode, e.g. LS1 1AA"
                      value={formData.postcode}
                      autoComplete="off"
                      onChange={e => setFormData(p => ({ ...p, postcode: e.target.value }))}
                    />
                  </div>

                  {/* First line of address (auto-filled from the postcode, editable) */}
                  <div>
                    <label style={labelStyle}>First Line of Address</label>
                    <input
                      className="gs-input"
                      style={inputStyle}
                      placeholder="e.g. 12 Oak Street"
                      value={formData.addressLine1}
                      onChange={e => setFormData(p => ({ ...p, addressLine1: e.target.value }))}
                    />
                  </div>

                  {/* Number of properties */}
                  <div>
                    <label style={labelStyle}>How Many Properties to Manage?</label>
                    <select
                      className="gs-input"
                      style={inputStyle}
                      value={formData.numberOfProperties}
                      onChange={e => setFormData(p => ({ ...p, numberOfProperties: e.target.value }))}
                    >
                      <option value="">Select number of properties</option>
                      <option value="1">1 property</option>
                      <option value="2">2 properties</option>
                      <option value="3">3 properties</option>
                      <option value="4">4 properties</option>
                      <option value="5+">5 or more</option>
                    </select>
                  </div>

                  {/* Start date */}
                  <div>
                    <label style={labelStyle}>When Do You Want to Register?</label>
                    <input
                      className="gs-input"
                      type="date"
                      style={{ ...inputStyle, colorScheme: 'light' }}
                      value={formData.startDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={e => setFormData(p => ({ ...p, startDate: e.target.value }))}
                    />
                  </div>

                  {error && (
                    <div style={{
                      background: '#fef2f2', border: '1px solid #fecaca',
                      borderRadius: 8, padding: '12px 16px',
                      color: '#dc2626', fontSize: 13, fontFamily: "'Poppins', sans-serif",
                    }}>{error}</div>
                  )}

                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    style={{
                      width: '100%', padding: '14px 24px',
                      background: submitting ? '#93c5fd' : '#2563eb',
                      color: '#fff', border: 'none', borderRadius: 8,
                      fontSize: 14, fontWeight: 700, letterSpacing: '0.5px',
                      textTransform: 'uppercase', cursor: submitting ? 'wait' : 'pointer',
                      fontFamily: "'Poppins', sans-serif",
                      transition: 'background 0.2s',
                      marginTop: 4,
                    }}
                  >
                    {submitting ? 'Submitting...' : 'Submit Registration'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
