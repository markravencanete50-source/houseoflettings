'use client';
// app/page.tsx
import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import PropertyCard from '@/components/property/PropertyCard';
import { getProperties } from '@/services/property';
import { Property } from '@/lib/types';

const ValuationModal = lazy(() => import('@/components/ValuationModal'));

// ── INLINE VALUATION BUTTON ───────────────────────────────────────────────────
function ValuationInlineButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          padding: '16px 48px', background: '#2563eb', color: '#fff',
          border: 'none', borderRadius: 6, fontSize: 16, fontWeight: 700,
          letterSpacing: '0.5px', cursor: 'pointer', transition: 'background 0.2s',
          fontFamily: 'Georgia, "Times New Roman", serif',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = '#1d4ed8')}
        onMouseLeave={e => (e.currentTarget.style.background = '#2563eb')}
      >
        Book a valuation
      </button>
      <Suspense fallback={null}>
        {open && <ValuationModal isOpen={open} onClose={() => setOpen(false)} />}
      </Suspense>
    </>
  );
}



// ── GALLERY DATA ─────────────────────────────────────────────────────────────
const GALLERY_ITEMS = [
  {
    img: '/images/agent-photo.jpeg',
    label: 'Leeds & Manchester Experts',
    sub: 'Local knowledge, professional service.',
  },
  {
    img: '/images/brand-desk.jpeg',
    label: 'We Handle the Details.',
    sub: 'You enjoy the returns.',
  },
  {
    img: '/images/service-compare.png',
    label: 'Full Lettings & Management',
    sub: 'AI-powered system, expert team.',
  },
  {
    img: '/images/landlord-app.png',
    label: 'Everything You Need',
    sub: 'To succeed as a landlord.',
  },
  {
    img: '/images/compliance.jpeg',
    label: 'Stay Fully Compliant',
    sub: 'We track the rules so you don\'t have to.',
  },
  {
    img: '/images/tenant-pressure.jpeg',
    label: 'Tenant Pressure? We Handle It.',
    sub: 'Smart landlords choose professional management.',
  },
];

// ── GALLERY COMPONENT ─────────────────────────────────────────────────────────
function ImageGallery() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);

  const scrollToIndex = (i: number) => {
    if (!trackRef.current) return;
    const card = trackRef.current.children[i] as HTMLElement;
    if (!card) return;
    trackRef.current.scrollTo({ left: card.offsetLeft - 40, behavior: 'smooth' });
    setActive(i);
  };

  const onMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.pageX - (trackRef.current?.offsetLeft ?? 0));
    setScrollLeft(trackRef.current?.scrollLeft ?? 0);
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !trackRef.current) return;
    e.preventDefault();
    const x = e.pageX - (trackRef.current.offsetLeft ?? 0);
    trackRef.current.scrollLeft = scrollLeft - (x - startX);
  };
  const onMouseUp = () => setIsDragging(false);

  return (
    <section style={{ padding: '90px 0', background: '#fff', overflow: 'hidden' }}>
      <style>{`
        .hol-gallery-track::-webkit-scrollbar { display: none; }
        .hol-gallery-track { -ms-overflow-style: none; scrollbar-width: none; }
        .hol-gallery-card { transition: transform 0.35s ease, box-shadow 0.35s ease; }
        .hol-gallery-card:hover { transform: translateY(-8px) scale(1.015); box-shadow: 0 24px 60px rgba(0,0,0,0.18) !important; }
        .hol-gallery-card:hover .hol-gallery-overlay { opacity: 1 !important; }
        .hol-gallery-card:hover .hol-gallery-label { transform: translateY(0) !important; opacity: 1 !important; }
        .hol-dot { transition: all 0.2s ease; cursor: pointer; border: none; padding: 0; background: none; }
        .hol-lightbox { position: fixed; inset: 0; background: rgba(0,0,0,0.92); z-index: 9999; display: flex; align-items: center; justify-content: center; animation: hol-fadein 0.2s ease; }
        @keyframes hol-fadein { from { opacity: 0 } to { opacity: 1 } }
        .hol-lightbox img { max-width: 90vw; max-height: 85vh; object-fit: contain; border-radius: 8px; box-shadow: 0 32px 80px rgba(0,0,0,0.6); }
        .hol-lb-close { position: absolute; top: 20px; right: 28px; color: #fff; font-size: 36px; cursor: pointer; line-height: 1; background: none; border: none; opacity: 0.8; transition: opacity 0.2s; }
        .hol-lb-close:hover { opacity: 1; }
        .hol-lb-prev, .hol-lb-next { position: absolute; top: 50%; transform: translateY(-50%); color: #fff; font-size: 36px; cursor: pointer; background: rgba(255,255,255,0.1); border: none; border-radius: 50%; width: 52px; height: 52px; display: flex; align-items: center; justify-content: center; transition: background 0.2s; }
        .hol-lb-prev:hover, .hol-lb-next:hover { background: rgba(255,255,255,0.25); }
        .hol-lb-prev { left: 20px; }
        .hol-lb-next { right: 20px; }
        .hol-lb-caption { position: absolute; bottom: 24px; left: 50%; transform: translateX(-50%); color: #fff; font-size: 15px; font-weight: 600; text-align: center; white-space: nowrap; }
      `}</style>

      {/* Lightbox */}
      {lightbox !== null && (
        <div className="hol-lightbox" onClick={() => setLightbox(null)}>
          <button className="hol-lb-close" onClick={() => setLightbox(null)}>✕</button>
          <button className="hol-lb-prev" onClick={e => { e.stopPropagation(); setLightbox((lightbox - 1 + GALLERY_ITEMS.length) % GALLERY_ITEMS.length); }}>‹</button>
          <img
            src={GALLERY_ITEMS[lightbox].img}
            alt={GALLERY_ITEMS[lightbox].label}
            onClick={e => e.stopPropagation()}
          />
          <button className="hol-lb-next" onClick={e => { e.stopPropagation(); setLightbox((lightbox + 1) % GALLERY_ITEMS.length); }}>›</button>
          <div className="hol-lb-caption">{GALLERY_ITEMS[lightbox].label}</div>
        </div>
      )}

      {/* Section header */}
      <div style={{ padding: '0 5%', marginBottom: 48 }}>
        <div style={{
          fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase',
          color: '#2563eb', marginBottom: 14,
        }}>
          Properties We Love
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
          <h2 style={{
            fontFamily: "Georgia, "Times New Roman", serif",
            fontSize: 'clamp(28px,4vw,48px)',
            fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.5px', margin: 0,
            color: '#0f1f3d',
          }}>
            Homes That Inspire
          </h2>
          <p style={{ fontSize: 15, color: '#6b7280', maxWidth: 380, lineHeight: 1.65, margin: 0, fontWeight: 300 }}>
            From compact city flats to sprawling countryside homes — every property listed directly by landlords across the UK.
          </p>
        </div>
      </div>

      {/* Scrollable track */}
      <div
        ref={trackRef}
        className="hol-gallery-track"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        style={{
          display: 'flex', gap: 20, padding: '8px 5% 16px',
          overflowX: 'auto', cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
        }}
      >
        {GALLERY_ITEMS.map((item, i) => (
          <div
            key={i}
            className="hol-gallery-card"
            onClick={() => { setActive(i); setLightbox(i); }}
            style={{
              flexShrink: 0,
              width: i % 3 === 0 ? 360 : 280,
              height: 400,
              borderRadius: 12,
              overflow: 'hidden',
              position: 'relative',
              boxShadow: active === i
                ? '0 20px 50px rgba(15,31,61,0.22)'
                : '0 6px 24px rgba(0,0,0,0.08)',
              cursor: 'pointer',
              outline: active === i ? '2px solid #2563eb' : '2px solid transparent',
              outlineOffset: 3,
            }}
          >
            <img
              src={item.img}
              alt={item.label}
              draggable={false}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />

            {/* Overlay */}
            <div
              className="hol-gallery-overlay"
              style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to top, rgba(10,10,20,0.85) 0%, rgba(10,10,20,0.1) 55%, transparent 100%)',
                opacity: active === i ? 1 : 0.7,
                transition: 'opacity 0.3s ease',
              }}
            />

            {/* Label */}
            <div
              className="hol-gallery-label"
              style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                padding: '20px 20px 22px',
                transform: active === i ? 'translateY(0)' : 'translateY(6px)',
                opacity: active === i ? 1 : 0.85,
                transition: 'all 0.3s ease',
              }}
            >
              <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 4, fontFamily: 'Georgia, serif' }}>
                {item.label}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', letterSpacing: 0.5 }}>
                {item.sub}
              </div>
            </div>

            {/* Active badge */}
            {active === i && (
              <div style={{
                position: 'absolute', top: 14, right: 14,
                background: '#1e3a6e', color: '#fff',
                fontSize: 10, fontWeight: 700, letterSpacing: 1.5,
                textTransform: 'uppercase', padding: '4px 10px', borderRadius: 20,
              }}>
                Featured
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Dot navigation */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 28, padding: '0 5%' }}>
        {GALLERY_ITEMS.map((_, i) => (
          <button
            key={i}
            className="hol-dot"
            onClick={() => scrollToIndex(i)}
            aria-label={`Go to slide ${i + 1}`}
            style={{
              width: active === i ? 28 : 8,
              height: 8,
              borderRadius: 4,
              background: active === i ? '#2563eb' : '#e5e7eb',
            }}
          />
        ))}
      </div>

    </section>
  );
}

// ── PAGE ──────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const router = useRouter();
  const [featured, setFeatured] = useState<Property[]>([]);
  const [location, setLocation] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [bedrooms, setBedrooms] = useState('');

  useEffect(() => {
    getProperties().then(props => setFeatured(props.slice(0, 3)));
  }, []);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (location) params.set('location', location);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (bedrooms) params.set('bedrooms', bedrooms);
    router.push(`/listings?${params.toString()}`);
  };

  return (
    <>
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section style={{
        minHeight: '100vh', background: '#0f1f3d', 
        position: 'relative', display: 'flex', alignItems: 'center', padding: '0 5%',
      }}>
        {/* Hero background image - Leeds city */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url(/images/Background_of_the_Homepage.png)',
          backgroundSize: 'cover', backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }} />
        {/* Dark overlay for text readability */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg,rgba(10,20,50,0.88) 0%,rgba(10,20,50,0.65) 60%, rgba(10,20,50,0.4) 100%)',
        }} />
        {/* Subtle radial accent */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at 70% 50%, rgba(30,58,110,0.12) 0%, transparent 60%)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', maxWidth: 700 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 36 }}>
            <img
              src="/images/logo_HOL.png"
              alt="House of Lettings Logo"
              style={{ height: 60, width: 'auto', display: 'block' }}
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
            <div style={{ lineHeight: 1.15 }}>
              <div style={{
                fontFamily: "Georgia, "Times New Roman", serif", fontSize: 18, fontWeight: 700,
                color: '#fff', letterSpacing: '2px', textTransform: 'uppercase',
              }}>
                House of Lettings
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', letterSpacing: '1px', textTransform: 'uppercase', marginTop: 2 }}>
                Leeds &amp; Manchester
              </div>
            </div>
          </div>

          <h1 style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 'clamp(32px,5vw,66px)',
            fontWeight: 500, color: '#fff', lineHeight: 1.08, letterSpacing: '-0.5px', marginBottom: 12,
            textTransform: 'uppercase',
          }}>
            We Handle the Details.
          </h1>
          <h1 style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 'clamp(32px,5vw,66px)',
            fontWeight: 500, color: '#4a90d9', lineHeight: 1.08, letterSpacing: '-0.5px', marginBottom: 28,
            textTransform: 'uppercase',
          }}>
            You Enjoy the Returns.
          </h1>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
            <div style={{ width: 32, height: 1, background: 'rgba(255,255,255,0.25)' }} />
            <svg width="18" height="18" viewBox="0 0 24 24" fill="rgba(255,255,255,0.4)" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
          </div>

          <p style={{
            fontSize: 17, color: 'rgba(255,255,255,0.6)', lineHeight: 1.65,
            maxWidth: 480, marginBottom: 44, fontWeight: 300, letterSpacing: '0.2px',
          }}>
            Property management. Done right.
          </p>

          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <Link href="/listings" style={{
              padding: '16px 36px', background: '#1e3a6e', color: '#ffffff', border: 'none',
              borderRadius: 4, fontSize: 14, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase',
              textDecoration: 'none',
            }}>
              Browse Properties
            </Link>
            <Link href="/register" style={{
              padding: '16px 36px', background: 'transparent', color: '#fff',
              border: '1px solid rgba(255,255,255,0.4)', borderRadius: 4, fontSize: 14,
              fontWeight: 500, letterSpacing: '0.5px', textTransform: 'uppercase',
              textDecoration: 'none',
            }}>
              List Your Property
            </Link>
            <Link href="/terms" style={{
              padding: '16px 36px', background: 'transparent', color: '#fff',
              border: '1px solid rgba(255,255,255,0.4)', borderRadius: 4, fontSize: 14,
              fontWeight: 500, letterSpacing: '0.5px', textTransform: 'uppercase',
              textDecoration: 'none',
            }}>
              Terms &amp; Conditions
            </Link>
          </div>
        </div>
      </section>

      {/* ── BOOK A VALUATION ─────────────────────────────────── */}
      <section style={{
        padding: '100px 5%',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Valuation background image - luxury interior */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url(/images/Background_Book_Valuation.png)',
          backgroundSize: 'cover', backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }} />
        {/* Dark overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(8, 18, 40, 0.78)',
        }} />
        <div style={{ maxWidth: 780, position: 'relative', zIndex: 1 }}>
          <h2 style={{
            fontFamily: "Georgia, "Times New Roman", serif",
            fontSize: 'clamp(32px,5vw,56px)', fontWeight: 700,
            color: '#fff', lineHeight: 1.2, marginBottom: 24,
          }}>
            Are you ready to sell or let your property?
          </h2>
          <p style={{
            fontSize: 18, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8,
            marginBottom: 44, fontWeight: 300, maxWidth: 620,
          }}>
            Book a free sales or lettings valuation with your local agent, and they will use their local knowledge and expertise to give you the most accurate sales or lettings valuation.
          </p>
          <ValuationInlineButton />
        </div>
      </section>

      {/* ── INFO CARDS ───────────────────────────────────────── */}
      <section style={{ padding: '90px 5%', position: 'relative', overflow: 'hidden' }}>
        {/* Services background image - agent with clients */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url(/images/Background_of_the_services.png)',
          backgroundSize: 'cover', backgroundPosition: 'center top',
          backgroundRepeat: 'no-repeat',
        }} />
        {/* Dark overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(8, 18, 40, 0.82)',
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ marginBottom: 56, textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: '#4a90d9', marginBottom: 14 }}>
            Our Services
          </div>
          <h2 style={{ fontFamily: "Georgia, "Times New Roman", serif", fontSize: 'clamp(28px,4vw,48px)', fontWeight: 700, color: '#fff', margin: 0 }}>
            How We Can Help
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
          {[
            {
              title: 'For Landlords',
              body: 'Renting your property should feel straightforward and cost-effective. Our service keeps the process clear with transparent pricing and flexible options, from free tools to low-cost packages including advertising, enquiry handling, and professional tenancy setup.',
            },
            {
              title: 'For Tenants',
              body: 'Our goal is to make finding your next home straightforward, safe, and comfortable. We offer flexible search options for different needs — pet-friendly homes, student accommodation, and properties suitable for a range of lifestyles. No pressure, no unnecessary office visits.',
            },
            {
              title: 'Property Management',
              body: 'From accurate valuations and professional photography to comprehensive tenant screening and 12-month guarantee insurance, we ensure your property is in the best hands at every stage of the letting process.',
            },
          ].map(card => (
            <div key={card.title} style={{
              background: '#162849',
              borderRadius: 10, padding: '32px 28px',
              border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <h3 style={{
                fontFamily: "Georgia, "Times New Roman", serif",
                fontSize: 20, fontWeight: 700, color: '#fff',
                marginBottom: 16,
              }}>
                {card.title}
              </h3>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.8, margin: 0 }}>
                {card.body}
              </p>
            </div>
          ))}
        </div>
        </div>
      </section>

      {/* ── PRICING TABLE ─────────────────────────────────────── */}
      <section style={{ padding: '90px 5%', position: 'relative', overflow: 'hidden' }}>
        {/* Pricing background - same services image, different angle */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url(/images/Background_of_the_services.png)',
          backgroundSize: 'cover', backgroundPosition: 'center bottom',
          backgroundRepeat: 'no-repeat',
        }} />
        {/* Darker overlay for pricing readability */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(5, 12, 30, 0.88)',
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ marginBottom: 56, textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: '#4a90d9', marginBottom: 14 }}>
            Transparent Pricing
          </div>
          <h2 style={{ fontFamily: "Georgia, "Times New Roman", serif", fontSize: 'clamp(28px,4vw,48px)', fontWeight: 700, color: '#fff', margin: 0 }}>
            Choose Your Package
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, maxWidth: 1100, margin: '0 auto' }}>

          {/* £399 Virtual Tenant Find */}
          <div style={{
            background: '#162849', borderRadius: 10, padding: '36px 28px',
            border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>One-time fee</div>
            <div style={{ fontFamily: "Georgia, "Times New Roman", serif", fontSize: 52, fontWeight: 700, color: '#fff', lineHeight: 1, marginBottom: 4 }}>£399</div>
            <div style={{ fontFamily: "Georgia, "Times New Roman", serif", fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              Virtual Tenant Find
            </div>
            {[
              'Expert property valuation',
              'Advertising your property on major portals',
              'Enquiries, Screening & Viewings Arrangement',
              'Schedule Viewing with the Landlord',
              'Viewing Feedback & Offer Negotiation',
              'Document Request & Holding Deposit Collection',
              'Credit & Right to Rent Checks',
              'Binding ASAT tenancy agreement',
              'First Rent & Deposit Collection',
              'Arranging transfer of utilities and council tax',
            ].map(item => (
              <div key={item} style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'flex-start' }}>
                <span style={{ color: '#2563eb', fontWeight: 700, fontSize: 15, marginTop: 1, flexShrink: 0 }}>✓</span>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>{item}</span>
              </div>
            ))}
            <div style={{ marginTop: 'auto', paddingTop: 28 }}>
              <Link href="/register" style={{
                display: 'block', textAlign: 'center',
                padding: '14px 24px', background: '#2563eb', color: '#fff',
                borderRadius: 4, fontSize: 14, fontWeight: 700,
                letterSpacing: '0.5px', textTransform: 'uppercase', textDecoration: 'none',
              }}>
                Add Listing Now
              </Link>
            </div>
          </div>

          {/* £599 Expert Tenant Find — Most Popular */}
          <div style={{
            background: '#0f1f3d', borderRadius: 10, padding: '36px 28px',
            border: '2px solid #2563eb', display: 'flex', flexDirection: 'column',
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
              background: '#2563eb', color: '#fff', fontSize: 10, fontWeight: 800,
              letterSpacing: 2, textTransform: 'uppercase', padding: '5px 16px', borderRadius: 20,
              whiteSpace: 'nowrap',
            }}>
              Most Popular
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>One-time fee</div>
            <div style={{ fontFamily: "Georgia, "Times New Roman", serif", fontSize: 52, fontWeight: 700, color: '#4a90d9', lineHeight: 1, marginBottom: 4 }}>£599</div>
            <div style={{ fontFamily: "Georgia, "Times New Roman", serif", fontSize: 18, fontWeight: 700, fontStyle: 'normal', color: '#fff', marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              Expert Tenant Find
            </div>
            {[
              'Professional property photography',
              'Expert property valuation',
              'Advertising your property on major portals',
              'Enquiries, Screening & Viewings Arrangement',
              'Viewings conducted by our experienced agent',
              'Viewing Feedback & Offer Negotiation',
              'Document Request & Holding Deposit Collection',
              'Credit & Right to Rent Checks',
              'Binding ASAT tenancy agreement',
              'First Rent & Deposit Collection',
              'Comprehensive handover key to the tenant',
            ].map(item => (
              <div key={item} style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'flex-start' }}>
                <span style={{ color: '#4a90d9', fontWeight: 700, fontSize: 15, marginTop: 1, flexShrink: 0 }}>✓</span>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>{item}</span>
              </div>
            ))}
            <div style={{ marginTop: 'auto', paddingTop: 28 }}>
              <Link href="/register" style={{
                display: 'block', textAlign: 'center',
                padding: '14px 24px', background: '#2563eb', color: '#fff',
                borderRadius: 4, fontSize: 14, fontWeight: 700,
                letterSpacing: '0.5px', textTransform: 'uppercase', textDecoration: 'none',
              }}>
                Add Listing Now
              </Link>
            </div>
          </div>

          {/* 8% Full Management */}
          <div style={{
            background: '#162849', borderRadius: 10, padding: '36px 28px',
            border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Monthly percentage</div>
            <div style={{ fontFamily: "Georgia, "Times New Roman", serif", fontSize: 52, fontWeight: 700, color: '#fff', lineHeight: 1, marginBottom: 4 }}>8%</div>
            <div style={{ fontFamily: "Georgia, "Times New Roman", serif", fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              Full Management
            </div>
            {[
              'Rental Invoice to Tenant & Rent Collection',
              'Account Statement & Rent Transfer to Landlord',
              'Maintenance Payment Handling',
              'Annual Expense and Income Summary',
              'Deposit Protection (DPS/TDS)',
              'Gas, Electric & EPC Certificate Renewal Reminders',
              'Move-In Inventory Report',
              'Move-Out Inventory Report',
              'Check-in / Check-out Comparison',
              'Tenant enquiry handling',
              'Maintenance Reporting & Oversight',
              'Contractor Coordination (with approval)',
              'Maintenance Record Keeping',
              'Key Holding Management',
              'Final Utility & Council Tax Coordination',
              'Compliance Certificate Management',
            ].map(item => (
              <div key={item} style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'flex-start' }}>
                <span style={{ color: '#2563eb', fontWeight: 700, fontSize: 15, marginTop: 1, flexShrink: 0 }}>✓</span>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>{item}</span>
              </div>
            ))}
            <div style={{ marginTop: 'auto', paddingTop: 28 }}>
              <Link href="/register" style={{
                display: 'block', textAlign: 'center',
                padding: '14px 24px', background: '#2563eb', color: '#fff',
                borderRadius: 4, fontSize: 14, fontWeight: 700,
                letterSpacing: '0.5px', textTransform: 'uppercase', textDecoration: 'none',
              }}>
                Add Listing Now
              </Link>
            </div>
          </div>

        </div>
        </div>
      </section>

      {/* ── SEARCH BAR ───────────────────────────────────────── */}
      <section style={{ background: '#f7f8fa', padding: '56px 5%', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{
          background: '#fff', borderRadius: 10, padding: '40px 40px',
          boxShadow: '0 4px 32px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb',
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#9ca3af', marginBottom: 28 }}>
            Search Properties
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: 16, alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Location</label>
              <input
                value={location} onChange={e => setLocation(e.target.value)}
                placeholder="City, postcode or area…"
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                style={{
                  width: '100%', padding: '14px 16px', fontSize: 15,
                  border: '1px solid #d1d5db', borderRadius: 6, outline: 'none',
                  fontFamily: "Georgia, "Times New Roman", serif", color: '#0f1f3d',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Min Price</label>
              <select value={minPrice} onChange={e => setMinPrice(e.target.value)} style={{
                width: '100%', padding: '14px 16px', fontSize: 15,
                border: '1px solid #d1d5db', borderRadius: 6, outline: 'none',
                fontFamily: "Georgia, "Times New Roman", serif", color: '#0f1f3d',
                background: '#fff', cursor: 'pointer',
              }}>
                <option value="">No min</option>
                <option value="500">£500/mo</option>
                <option value="800">£800/mo</option>
                <option value="1000">£1,000/mo</option>
                <option value="1500">£1,500/mo</option>
                <option value="2000">£2,000/mo</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Max Price</label>
              <select value={maxPrice} onChange={e => setMaxPrice(e.target.value)} style={{
                width: '100%', padding: '14px 16px', fontSize: 15,
                border: '1px solid #d1d5db', borderRadius: 6, outline: 'none',
                fontFamily: "Georgia, "Times New Roman", serif", color: '#0f1f3d',
                background: '#fff', cursor: 'pointer',
              }}>
                <option value="">No max</option>
                <option value="1000">£1,000/mo</option>
                <option value="1500">£1,500/mo</option>
                <option value="2000">£2,000/mo</option>
                <option value="3000">£3,000/mo</option>
                <option value="5000">£5,000/mo</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Bedrooms</label>
              <select value={bedrooms} onChange={e => setBedrooms(e.target.value)} style={{
                width: '100%', padding: '14px 16px', fontSize: 15,
                border: '1px solid #d1d5db', borderRadius: 6, outline: 'none',
                fontFamily: "Georgia, "Times New Roman", serif", color: '#0f1f3d',
                background: '#fff', cursor: 'pointer',
              }}>
                <option value="">Any</option>
                <option value="0">Studio</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
                <option value="4">4+</option>
              </select>
            </div>
            <button onClick={handleSearch} style={{
              padding: '14px 32px', background: '#0f1f3d', color: '#fff', border: 'none',
              borderRadius: 6, fontSize: 15, fontWeight: 700, whiteSpace: 'nowrap',
              textTransform: 'uppercase', letterSpacing: '1px', cursor: 'pointer', transition: 'background .2s',
            }}
              onMouseEnter={e => (e.currentTarget.style.background = '#162849')}
              onMouseLeave={e => (e.currentTarget.style.background = '#0f1f3d')}
            >
              Search
            </button>
          </div>
        </div>
      </section>

      {/* ── FEATURED LISTINGS ────────────────────────────────── */}
      <section style={{ padding: '90px 5%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 56 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: '#2563eb', marginBottom: 14 }}>
              Latest Listings
            </div>
            <h2 style={{ fontFamily: "Georgia, "Times New Roman", serif", fontSize: 'clamp(32px,4vw,52px)', fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.5px', color: '#0f1f3d' }}>
              Recently Added
            </h2>
          </div>
          <Link href="/listings" style={{
            padding: '12px 24px', border: '1px solid #e5e7eb', borderRadius: 4,
            fontSize: 13, fontWeight: 600, color: '#0f1f3d', textTransform: 'uppercase',
            letterSpacing: '0.5px', transition: 'all .2s', textDecoration: 'none',
          }}>
            View All →
          </Link>
        </div>

        {featured.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 24 }}>
            {featured.map(p => <PropertyCard key={p.id} property={p} />)}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🏠</div>
            <p style={{ fontSize: 16, fontWeight: 500 }}>No properties listed yet.</p>
            <p style={{ fontSize: 14, marginTop: 8 }}>Be the first to list a property!</p>
            <Link href="/register" style={{
              display: 'inline-block', marginTop: 20, padding: '12px 24px',
              background: '#1e3a6e', color: '#ffffff', borderRadius: 4, fontSize: 14, fontWeight: 700,
              textDecoration: 'none',
            }}>
              List Your Property →
            </Link>
          </div>
        )}
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section style={{ padding: '90px 5%', background: '#f7f8fa', borderTop: '1px solid #e5e7eb' }}>
        <div style={{ marginBottom: 56 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: '#2563eb', marginBottom: 14 }}>
            How It Works
          </div>
          <h2 style={{ fontFamily: "Georgia, "Times New Roman", serif", fontSize: 'clamp(32px,4vw,52px)', fontWeight: 700, color: '#0f1f3d' }}>
            Simple, Direct, Transparent
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60 }}>
          {[
            {
              role: 'For Landlords',
              steps: [
                { n: 1, title: 'Create your account', desc: 'Sign up as a landlord in under 2 minutes. No setup fees.' },
                { n: 2, title: 'List your property', desc: 'Add photos, set your rent, describe your home. It goes live instantly.' },
                { n: 3, title: 'Receive enquiries', desc: 'Tenants message you directly. No middlemen, no commission.' },
                { n: 4, title: 'Find your tenant', desc: 'Choose who you let to. Full control at every step.' },
              ],
            },
            {
              role: 'For Tenants',
              steps: [
                { n: 1, title: 'Search & filter', desc: 'Browse by location, price, bedrooms. Find homes that fit your life.' },
                { n: 2, title: 'View details', desc: 'See all photos, features, and availability at a glance.' },
                { n: 3, title: 'Message landlord', desc: 'Contact landlords directly. No agency gatekeeping.' },
                { n: 4, title: 'Secure your home', desc: 'Agree terms directly with the landlord. Zero agency fees.' },
              ],
            },
          ].map(col => (
            <div key={col.role}>
              <div style={{
                fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase',
                color: '#0f1f3d', marginBottom: 28, paddingBottom: 12,
                borderBottom: '2px solid #2563eb', display: 'inline-block',
              }}>
                {col.role}
              </div>
              {col.steps.map(s => (
                <div key={s.n} style={{ display: 'flex', gap: 18, marginBottom: 28 }}>
                  <div style={{
                    width: 36, height: 36, background: '#0f1f3d', color: '#fff',
                    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 700, flexShrink: 0,
                  }}>
                    {s.n}
                  </div>
                  <div>
                    <h4 style={{ fontSize: 15, fontWeight: 600, marginBottom: 5, color: '#0f1f3d' }}>{s.title}</h4>
                    <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ── IMAGE GALLERY ─────────────────────────────────────── */}
      <ImageGallery />

      {/* ── CTA BANNER ───────────────────────────────────────── */}
      <section style={{
        background: '#0f1f3d', padding: '80px 5%',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 40, flexWrap: 'wrap',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at 20% 50%, rgba(30,58,110,0.2) 0%, transparent 60%)',
          pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative' }}>
          <h2 style={{ fontFamily: "Georgia, "Times New Roman", serif", fontSize: 'clamp(28px,3.5vw,48px)', fontWeight: 700, color: '#fff', marginBottom: 12 }}>
            Ready to find your<br /><span style={{ color: '#4a90d9' }}>perfect home?</span>
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 16, fontWeight: 300 }}>
            Join thousands of landlords and tenants already using House of Lettings.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 14, position: 'relative' }}>
          <Link href="/register" style={{
            padding: '16px 36px', background: '#1e3a6e', color: '#ffffff',
            borderRadius: 4, fontSize: 14, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase',
            textDecoration: 'none',
          }}>
            Get Started Free
          </Link>
          <Link href="/listings" style={{
            padding: '16px 36px', background: 'transparent', color: '#fff',
            border: '1px solid rgba(255,255,255,0.3)', borderRadius: 4, fontSize: 14,
            fontWeight: 500, letterSpacing: '0.5px', textTransform: 'uppercase',
            textDecoration: 'none',
          }}>
            Browse Listings
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
            fontFamily: "Georgia, "Times New Roman", serif", fontSize: 20, fontWeight: 700,
            color: '#fff', display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ width: 7, height: 7, background: '#2563eb', borderRadius: '50%', display: 'inline-block' }} />
            House of Lettings
          </div>
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>
            © {new Date().getFullYear()} House of Lettings Ltd. All rights reserved.
          </p>
          <div style={{ display: 'flex', gap: 24 }}>
            <Link href="/cookie-policy" style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, textDecoration: 'none' }}>Cookie Policy</Link>
            <Link href="/terms" style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, textDecoration: 'none' }}>Terms</Link>
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, cursor: 'pointer' }}>Contact</span>
          </div>
        </div>
      </footer>

    </>
  );
}
