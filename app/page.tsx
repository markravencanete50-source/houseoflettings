'use client';
// app/page.tsx
import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import PropertyCard from '@/components/property/PropertyCard';
import { getProperties } from '@/services/property';
import { Property } from '@/lib/types';

// ── SCROLL REVEAL HOOK ────────────────────────────────────────────────────────
function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    els.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}


// ── HERO TEXT CYCLER ──────────────────────────────────────────────────────────
const HERO_PHRASES = [
  'Property management. Done right.',
  'Leeds & Manchester specialists.',
  'Your returns, fully protected.',
];
function HeroCycler() {
  const [idx, setIdx] = useState(0);
  const [fade, setFade] = useState(true);
  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setIdx(i => (i + 1) % HERO_PHRASES.length);
        setFade(true);
      }, 350);
    }, 3000);
    return () => clearInterval(interval);
  }, []);
  return (
    <>
      <style>{`
        .hero-cycler { transition: opacity 0.35s ease, transform 0.35s ease; }
        .hero-cycler.fade-in { opacity: 1; transform: translateY(0); }
        .hero-cycler.fade-out { opacity: 0; transform: translateY(-8px); }
      `}</style>
      <p className={`hero-cycler ${fade ? 'fade-in' : 'fade-out'}`} style={{
        fontSize: 17, color: 'rgba(255,255,255,0.6)', lineHeight: 1.65,
        maxWidth: 480, margin: '0 auto 44px', fontWeight: 400, letterSpacing: '0.2px',
        fontFamily: "'Poppins', sans-serif", textAlign: 'center',
      }}>
        {HERO_PHRASES[idx]}
      </p>
    </>
  );
}

const ValuationModal = lazy(() => import('@/components/ValuationModal'));
const TenantEnquiryModal = lazy(() => import('@/components/property/TenantEnquiryModal'));

// ── INLINE VALUATION BUTTON ───────────────────────────────────────────────────
function ValuationInlineButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          padding: '16px 0', background: '#2563eb', color: '#fff',
          border: 'none', borderRadius: 6, fontSize: 16, fontWeight: 700,
          letterSpacing: '0.5px', cursor: 'pointer', transition: 'background 0.2s',
          fontFamily: "'Poppins', sans-serif",
          display: 'block', width: '100%', maxWidth: '260px', textAlign: 'center',
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

// ── INLINE BOOK A VIEWING BUTTON ──────────────────────────────────────────────
function BookViewingInlineButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          padding: '16px 0', background: '#2563eb', color: '#fff',
          border: 'none', borderRadius: 6, fontSize: 16, fontWeight: 700,
          letterSpacing: '0.5px', cursor: 'pointer', transition: 'background 0.2s',
          fontFamily: "'Poppins', sans-serif",
          display: 'block', width: '100%', maxWidth: '260px', textAlign: 'center',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = '#1d4ed8')}
        onMouseLeave={e => (e.currentTarget.style.background = '#2563eb')}
      >
        Book a viewing
      </button>
      <Suspense fallback={null}>
        {open && (
          <TenantEnquiryModal
            isOpen={open}
            onClose={() => setOpen(false)}
            propertyTitle="House of Lettings"
            propertyPrice={0}
          />
        )}
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
            fontFamily: "'Poppins', sans-serif",
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
              <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 4, fontFamily: "'Poppins', sans-serif" }}>
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

// ── SCROLL PROGRESS BAR ───────────────────────────────────────────────────────
function ScrollProgressBar() {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const update = () => {
      const scrolled = window.scrollY;
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setWidth(total > 0 ? Math.round((scrolled / total) * 100) : 0);
    };
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);
  return <div id="hol-progress" style={{ width: `${width}%` }} />;
}

// ── MOBILE FAB ────────────────────────────────────────────────────────────────
function MobileFAB() {
  const [valuationOpen, setValuationOpen] = useState(false);
  return (
    <div className="hol-fab">
      <Link href="/listings">🔍 Find Home</Link>
      <div className="fab-divider" />
      <button onClick={() => setValuationOpen(true)}>📋 List Property</button>
      <Suspense fallback={null}>
        {valuationOpen && <ValuationModal isOpen={valuationOpen} onClose={() => setValuationOpen(false)} />}
      </Suspense>
    </div>
  );
}

// ── PAGE ──────────────────────────────────────────────────────────────────────
export default function HomePage() {
  useScrollReveal();
  const router = useRouter();
  const [featured, setFeatured] = useState<Property[]>([]);
  const [location, setLocation] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [bedrooms, setBedrooms] = useState('');

  useEffect(() => {
    const timeout = setTimeout(() => setFeatured([]), 8000);
    getProperties()
      .then(props => {
        clearTimeout(timeout);
        setFeatured(props.slice(0, 3));
      })
      .catch(() => {
        clearTimeout(timeout);
        setFeatured([]);
      });
    return () => clearTimeout(timeout);
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
      {/* ── GLOBAL REVEAL + SMART NAVBAR + MOBILE FAB STYLES ── */}
      <style>{`
        .reveal {
          opacity: 0;
          transform: translateY(32px);
          transition: opacity 0.65s cubic-bezier(.22,1,.36,1), transform 0.65s cubic-bezier(.22,1,.36,1);
        }
        .reveal.revealed {
          opacity: 1;
          transform: translateY(0);
        }
        .reveal-delay-1 { transition-delay: 0.1s; }
        .reveal-delay-2 { transition-delay: 0.2s; }
        .reveal-delay-3 { transition-delay: 0.3s; }
        .reveal-delay-4 { transition-delay: 0.4s; }

        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Section breathing gaps — navy so dark sections flow naturally */
        .section-gap, .section-gap-light, .section-gap-dark {
          height: clamp(56px, 7vw, 88px);
          background: #08122a;
        }
        @media (max-width: 768px) {
          .section-gap, .section-gap-light, .section-gap-dark {
            height: 44px;
          }
        }

        /* Scroll progress bar */
        #hol-progress {
          position: fixed; top: 0; left: 0; height: 3px;
          background: #2563eb; z-index: 9999;
          transition: width 0.1s linear;
          pointer-events: none;
        }

        /* Mobile FAB */
        .hol-fab {
          display: none;
          position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
          z-index: 999;
          background: #0f1f3d; border-radius: 40px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.35);
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.12);
        }
        @media (max-width: 768px) {
          .hol-fab { display: flex; }
        }
        .hol-fab a, .hol-fab button {
          padding: 13px 22px; font-size: 12px; font-weight: 700;
          letter-spacing: 0.5px; text-transform: uppercase;
          color: #fff; text-decoration: none; white-space: nowrap;
          font-family: 'Poppins', sans-serif;
          border: none; background: none; cursor: pointer;
          transition: background 0.2s;
        }
        .hol-fab a:hover, .hol-fab button:hover { background: rgba(255,255,255,0.08); }
        .hol-fab .fab-divider {
          width: 1px; background: rgba(255,255,255,0.15);
          align-self: stretch; margin: 10px 0;
        }

        /* Pricing card hover lift */
        .pricing-card {
          transition: transform 0.3s cubic-bezier(.22,1,.36,1), box-shadow 0.3s ease !important;
        }
        .pricing-card:hover {
          transform: translateY(-6px) !important;
          box-shadow: 0 24px 60px rgba(0,0,0,0.35) !important;
        }

        /* Services card hover */
        .service-card {
          transition: transform 0.3s ease, border-color 0.3s ease, background 0.3s ease !important;
        }
        .service-card:hover {
          transform: translateY(-4px) !important;
          border-color: rgba(74,144,217,0.4) !important;
          background: #1a3060 !important;
        }

        /* How it works step reveal */
        .how-step {
          transition: transform 0.2s ease, opacity 0.2s ease;
        }
        .how-step:hover .step-num {
          background: #2563eb !important;
          transform: scale(1.1);
        }
        .step-num { transition: background 0.2s ease, transform 0.2s ease; }

        /* Ken Burns on gallery images */
        .hol-gallery-card img {
          transition: transform 6s ease !important;
        }
        .hol-gallery-card:hover img {
          transform: scale(1.06) !important;
        }
      `}</style>

      {/* Scroll progress bar */}
      <ScrollProgressBar />

      {/* Mobile FAB */}
      <MobileFAB />

      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section style={{
        minHeight: '100vh', background: '#0f1f3d', 
        position: 'relative', display: 'flex', alignItems: 'center',
        justifyContent: 'center',
        padding: 'calc(var(--navbar-height, 72px) + 40px) 5% 60px',
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

        <div style={{ position: 'relative', maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>


          <h1 style={{
            fontFamily: "'Barlow Condensed', 'Poppins', sans-serif",
            fontSize: 'clamp(36px,5.5vw,68px)',
            fontWeight: 700, color: '#fff', lineHeight: 1.05, letterSpacing: '0.5px', marginBottom: 6,
            textTransform: 'uppercase',
          }}>
            We Handle the Details.
          </h1>
          <h1 style={{
            fontFamily: "'Barlow Condensed', 'Poppins', sans-serif",
            fontSize: 'clamp(36px,5.5vw,68px)',
            fontWeight: 700, color: '#4a90d9', lineHeight: 1.05, letterSpacing: '0.5px', marginBottom: 28,
            textTransform: 'uppercase',
          }}>
            You Enjoy the Returns.
          </h1>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, justifyContent: 'center' }}>
            <div style={{ width: 32, height: 1, background: 'rgba(255,255,255,0.25)' }} />
            <svg width="18" height="18" viewBox="0 0 24 24" fill="rgba(255,255,255,0.4)" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
          </div>

          <HeroCycler />

          <style>{`
            .hero-btns {
              display: flex; gap: 12px; flex-wrap: wrap;
              justify-content: center;
            }
            .hero-btn {
              padding: 14px 28px;
              min-width: 200px; text-align: center;
              background: #2563eb; color: #fff; border: none;
              border-radius: 6px; font-size: 13px; font-weight: 700;
              letter-spacing: 0.5px; text-transform: uppercase;
              text-decoration: none; font-family: 'Poppins', sans-serif;
              white-space: nowrap; display: inline-block;
              cursor: pointer; transition: background 0.2s;
            }
            .hero-btn:hover { background: #1d4ed8; }
            @media (max-width: 480px) {
              .hero-btns { flex-direction: column; gap: 10px; align-items: stretch; }
              .hero-btn {
                padding: 14px 18px; font-size: 12px;
                text-align: center; width: 100%;
              }
            }
          `}</style>
          <div className="hero-btns">
            <Link href="/listings" className="hero-btn">
              Browse Properties
            </Link>
            <Link href="/tenants" className="hero-btn">
              Book a Viewing
            </Link>
            <Link href="/landlords" className="hero-btn">
              Book a Valuation
            </Link>
            <Link href="/pricing" className="hero-btn">
              Pricing
            </Link>
          </div>
        </div>
      </section>


      {/* ── BOOK A VALUATION ─────────────────────────────────── */}
      <style>{`
        .bav-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          min-height: 560px;
        }
        .bav-text {
          padding: clamp(56px, 7vw, 100px) clamp(32px, 5vw, 80px);
          display: flex; flex-direction: column; justify-content: center;
          background: #08122a;
        }
        .bav-photo {
          position: relative; overflow: hidden; min-height: 560px;
        }
        .bav-photo img {
          width: 100%; height: 100%;
          object-fit: cover; object-position: center;
          display: block;
        }
        @media (max-width: 768px) {
          .bav-grid { grid-template-columns: 1fr; }
          .bav-photo { min-height: 300px; order: -1; }
          .bav-photo img { min-height: 300px; }
          .bav-text { padding: 48px 24px; }
        }
      `}</style>
      <section style={{ overflow: 'hidden', background: '#08122a' }}>
        <div className="bav-grid">
          <div className="bav-text reveal">
            <h2 style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: 'clamp(28px,4vw,48px)', fontWeight: 700,
              color: '#fff', lineHeight: 1.2, marginBottom: 24,
            }}>
              Are you ready to sell or let your property?
            </h2>
            <p style={{
              fontSize: 17, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8,
              marginBottom: 44, fontWeight: 300,
            }}>
              Book a free sales or lettings valuation with your local agent, and they will use their local knowledge and expertise to give you the most accurate sales or lettings valuation.
            </p>
            <div><ValuationInlineButton /></div>
          </div>
          <div className="bav-photo">
            <img src="/images/Background_Book_Valuation.png" alt="Book a Valuation" />
          </div>
        </div>
      </section>


      {/* ── BOOK A VIEWING ───────────────────────────────────── */}
      <style>{`
        .bvw-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          min-height: 560px;
        }
        .bvw-photo {
          position: relative; overflow: hidden; min-height: 560px;
        }
        .bvw-photo img {
          width: 100%; height: 100%;
          object-fit: cover; object-position: center right;
          display: block;
        }
        .bvw-text {
          padding: clamp(56px, 7vw, 100px) clamp(32px, 5vw, 80px);
          display: flex; flex-direction: column; justify-content: center;
          background: #08122a;
        }
        @media (max-width: 768px) {
          .bvw-grid { grid-template-columns: 1fr; }
          .bvw-photo { min-height: 300px; order: -1; }
          .bvw-photo img { min-height: 300px; }
          .bvw-text { padding: 48px 24px; }
        }
      `}</style>
      <section style={{ overflow: 'hidden', background: '#08122a' }}>
        <div className="bvw-grid">
          <div className="bvw-photo">
            <img src="/images/agent-photo.jpeg" alt="Book a Viewing" />
          </div>
          <div className="bvw-text reveal">
            <h2 style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: 'clamp(28px,4vw,48px)', fontWeight: 700,
              color: '#fff', lineHeight: 1.2, marginBottom: 24,
            }}>
              Looking to rent a property?
            </h2>
            <p style={{
              fontSize: 17, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8,
              marginBottom: 44, fontWeight: 300,
            }}>
              Register your requirements and we&apos;ll match you with suitable properties before they hit the market.
            </p>
            <div><BookViewingInlineButton /></div>
          </div>
        </div>
      </section>


      {/* ── INFO CARDS ───────────────────────────────────────── */}
      <style>{`
        .services-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 28px;
        }
        @media (max-width: 900px) {
          .services-grid { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 600px) {
          .services-grid { grid-template-columns: 1fr; }
        }
      `}</style>
      <section style={{ padding: 'clamp(60px, 8vw, 100px) clamp(20px, 5%, 5%)', position: 'relative', overflow: 'hidden' }}>
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
          <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 'clamp(28px,4vw,48px)', fontWeight: 700, color: '#fff', margin: 0 }}>
            How We Can Help
          </h2>
        </div>
        <div className="services-grid">
          {[
            {
              title: 'For Landlords',
              body: 'Renting your property should feel straightforward and cost-effective. Our service keeps the process clear with transparent pricing and flexible options, from free tools to low-cost packages including advertising, enquiry handling, and professional tenancy setup.',
              href: '/landlords',
            },
            {
              title: 'For Tenants',
              body: 'Our goal is to make finding your next home straightforward, safe, and comfortable. We offer flexible search options for different needs — pet-friendly homes, student accommodation, and properties suitable for a range of lifestyles. No pressure, no unnecessary office visits.',
              href: '/tenants',
            },
            {
              title: 'Property Management',
              body: 'From accurate valuations and professional photography to comprehensive tenant screening and 12-month guarantee insurance, we ensure your property is in the best hands at every stage of the letting process.',
              href: '/property-management',
            },
          ].map((card, i) => (
            <Link key={card.title} href={card.href} className={`service-card reveal reveal-delay-${i + 1}`} style={{
              background: 'rgba(10,24,56,0.82)',
              borderRadius: 10, padding: '40px 32px',
              border: '2px solid #2563eb',
              textDecoration: 'none', display: 'block',
              transition: 'transform 0.25s ease, border-color 0.25s ease, background 0.25s ease',
            }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-5px)';
                (e.currentTarget as HTMLElement).style.borderColor = '#4a90d9';
                (e.currentTarget as HTMLElement).style.background = '#1a3060';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLElement).style.borderColor = '#2563eb';
                (e.currentTarget as HTMLElement).style.background = 'rgba(10,24,56,0.82)';
              }}
            >
              <h3 style={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: 20, fontWeight: 700, color: '#fff',
                marginBottom: 16,
              }}>
                {card.title}
              </h3>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.8, margin: '0 0 20px' }}>
                {card.body}
              </p>
              <span style={{ fontSize: 13, color: '#4a90d9', fontWeight: 600, letterSpacing: 0.5 }}>
                Learn more →
              </span>
            </Link>
          ))}
        </div>
        </div>
      </section>


      {/* ── WHY BOOK A VALUATION + VIEWING ───────────────────── */}
      <style>{`
        .split-section { overflow: hidden; }
        .split-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          min-height: 860px;
        }
        .split-photo {
          background-size: cover;
          background-repeat: no-repeat;
          background-position: center center;
          min-height: 860px;
        }
        .split-photo-contain {
          background-size: contain;
          background-repeat: no-repeat;
          background-position: center center;
          min-height: 860px;
          background-color: #08122a;
        }
        .split-text {
          padding: clamp(48px, 6vw, 88px) clamp(28px, 5vw, 72px);
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .split-eyebrow {
          font-family: 'Poppins', sans-serif;
          font-size: 11px; font-weight: 700;
          letter-spacing: 0.18em; text-transform: uppercase;
          color: #2563eb; margin-bottom: 16px;
        }
        .split-title {
          font-family: 'Poppins', sans-serif;
          font-size: clamp(22px, 3vw, 34px); font-weight: 700;
          color: #0f1f3d; line-height: 1.25; margin-bottom: 16px;
        }
        .split-body {
          font-family: 'Poppins', sans-serif;
          font-size: 15px; color: #4b5563;
          line-height: 1.8; margin-bottom: 24px; max-width: 440px;
        }
        .split-list {
          list-style: none; padding: 0;
          margin: 0 0 32px;
          display: flex; flex-direction: column; gap: 12px;
        }
        .split-list li {
          display: flex; align-items: flex-start; gap: 12px;
          font-family: 'Poppins', sans-serif;
          font-size: 14px; color: #374151;
        }
        .split-check {
          color: #2563eb; font-weight: 700;
          font-size: 16px; line-height: 1.4; flex-shrink: 0;
        }
        @media (max-width: 768px) {
          .split-grid {
            grid-template-columns: 1fr !important;
            min-height: auto !important;
          }
          .split-photo, .split-photo-contain {
            min-height: 320px !important;
            order: -1 !important;
          }
          .split-img-panel {
            min-height: 360px !important;
            order: -1 !important;
          }
          .split-img-panel img {
            min-height: 360px !important;
          }
          .split-text {
            padding: 40px 24px !important;
          }
          .split-body { max-width: 100% !important; }
        }
      `}</style>

      {/* Valuation — text left, photo right */}
      <section className="split-section" style={{ background: '#f7f8fa' }}>
        <div className="split-grid">
          <div className="split-text reveal" style={{ background: '#f7f8fa' }}>
            <p className="split-eyebrow">For Landlords</p>
            <h2 className="split-title">Why book a valuation with House of Lettings?</h2>
            <p className="split-body">
              Booking a valuation with House of Lettings will save you time, money, and stress. Our local experts give you an honest, data-driven view of what your property is worth — so you can make informed decisions with confidence.
            </p>
            <ul className="split-list">
              <li><span className="split-check">✓</span>Free, no-obligation valuation from a local expert</li>
              <li><span className="split-check">✓</span>Accurate rental and sales valuations backed by live market data</li>
              <li><span className="split-check">✓</span>Advice on how to maximise your property&apos;s return</li>
              <li><span className="split-check">✓</span>Better tenant quality — we find and secure reliable tenants</li>
              <li><span className="split-check">✓</span>Full compliance, legal, and rent protection support</li>
              <li><span className="split-check">✓</span>Day-to-day management handled by experts</li>
            </ul>
            <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: 13, color: '#6b7280', lineHeight: 1.7, marginBottom: 28 }}>
              Whether you own one property or a full portfolio, our team is here to protect your investment and maximise your returns — so you can enjoy the freedom of hands-off landlording.
            </p>
            <ValuationInlineButton />
          </div>
          <div className="split-img-panel" style={{ overflow: 'hidden', minHeight: 860, display: 'flex', alignItems: 'stretch', position: 'relative' }}>
            <img
              src="/images/Landlord_Book_valuation_background.png"
              alt="Book a Valuation"
              style={{
                width: '100%',
                height: '100%',
                minHeight: 860,
                objectFit: 'cover',
                objectPosition: 'center top',
                display: 'block',
              }}
            />
          </div>
        </div>
      </section>


      {/* ── PRICING TEASER ────────────────────────────────────── */}
      <style>{`
        .pricing-teaser-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 16px;
          max-width: 1100px;
          margin: 0 auto 48px;
        }
        .pricing-teaser-card {
          background: #162849;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          padding: 28px 20px;
          text-align: center;
          transition: transform 0.25s ease, border-color 0.25s ease, background 0.25s ease;
          cursor: pointer;
          text-decoration: none;
          display: block;
        }
        .pricing-teaser-card:hover {
          transform: translateY(-5px);
          border-color: rgba(74,144,217,0.5);
          background: #1a3060;
        }
        .pricing-teaser-card.popular {
          border: 2px solid #2563eb;
          background: #0f1f3d;
          position: relative;
        }
        @media (max-width: 900px) {
          .pricing-teaser-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 560px) {
          .pricing-teaser-grid { grid-template-columns: repeat(1, 1fr); gap: 12px; }
        }
      `}</style>
      <section style={{ padding: 'clamp(60px, 8vw, 100px) clamp(20px, 5%, 5%)', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url(/images/Background_of_the_services.png)',
          backgroundSize: 'cover', backgroundPosition: 'center bottom',
          backgroundRepeat: 'no-repeat',
        }} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(5,12,30,0.88)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>

          {/* Header */}
          <div style={{ marginBottom: 56, textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: '#4a90d9', marginBottom: 14 }}>
              Transparent Pricing
            </div>
            <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 'clamp(28px,4vw,48px)', fontWeight: 700, color: '#fff', margin: '0 0 16px' }}>
              Choose Your Package
            </h2>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', maxWidth: 560, margin: '0 auto', lineHeight: 1.7, fontWeight: 300, fontFamily: "'Poppins', sans-serif" }}>
              Every package builds on the last. Start with what you need — upgrade whenever you&apos;re ready.
            </p>
          </div>

          {/* 5 teaser tiles */}
          <div className="pricing-teaser-grid">
            {[
              { price: '£499', label: 'Virtual Tenant Find', type: 'One-time fee', popular: false },
              { price: '£799', label: 'Expert Tenant Find', type: 'One-time fee', popular: true },
              { price: '6%',   label: 'Rent Collection',    type: 'Monthly',       popular: false },
              { price: '8%',   label: 'Full Management',    type: 'Monthly',       popular: false },
              { price: '10%',  label: 'Comprehensive Management', type: 'Monthly', popular: false },
            ].map((pkg, i) => (
              <Link
                key={pkg.label}
                href="/pricing"
                className={`pricing-teaser-card reveal reveal-delay-${i + 1}${pkg.popular ? ' popular' : ''}`}
              >
                {pkg.popular && (
                  <div style={{
                    position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)',
                    background: '#2563eb', color: '#fff', fontSize: 9, fontWeight: 800,
                    letterSpacing: 2, textTransform: 'uppercase', padding: '4px 14px', borderRadius: 20,
                    whiteSpace: 'nowrap',
                  }}>
                    Most Popular
                  </div>
                )}
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, fontFamily: "'Poppins', sans-serif" }}>
                  {pkg.type}
                </div>
                <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 'clamp(28px,3vw,40px)', fontWeight: 700, color: pkg.popular ? '#4a90d9' : '#fff', lineHeight: 1, marginBottom: 12 }}>
                  {pkg.price}
                </div>
                <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 13, fontWeight: 700, color: '#fff', lineHeight: 1.4 }}>
                  {pkg.label}
                </div>
                <div style={{ marginTop: 16, fontSize: 11, color: '#4a90d9', fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                  View details →
                </div>
              </Link>
            ))}
          </div>

          {/* CTA to pricing page */}
          <div style={{ textAlign: 'center' }}>
            <Link href="/pricing" style={{
              display: 'inline-block', padding: '16px 48px',
              background: '#2563eb', color: '#fff', borderRadius: 6,
              fontSize: 14, fontWeight: 700, letterSpacing: '0.5px',
              textTransform: 'uppercase', textDecoration: 'none',
              transition: 'background 0.2s',
              fontFamily: "'Poppins', sans-serif",
            }}
              onMouseEnter={e => (e.currentTarget.style.background = '#1d4ed8')}
              onMouseLeave={e => (e.currentTarget.style.background = '#2563eb')}
            >
              View Full Pricing &amp; Details
            </Link>
          </div>

        </div>
      </section>


      {/* Viewing — photo left, text right */}
      <section className="split-section" style={{ background: '#ffffff' }}>
        <div className="split-grid" style={{ alignItems: 'stretch', minHeight: 560 }}>
          <div
            className="split-photo"
            style={{ backgroundImage: 'url(/images/Tenants_Book_viewing_background.png)', backgroundPosition: 'center center', alignSelf: 'stretch', minHeight: 560 }}
          />
          <div className="split-text" style={{ background: '#ffffff', justifyContent: 'center' }}>
            <p className="split-eyebrow">For Tenants</p>
            <h2 className="split-title">Find your perfect home with House of Lettings</h2>
            <p className="split-body">
              Booking a viewing with us is quick, easy, and puts you first. We take the pressure off your search — matching you with the right properties and guiding you every step of the way.
            </p>
            <ul className="split-list">
              <li><span className="split-check">✓</span>View properties before they hit the open market</li>
              <li><span className="split-check">✓</span>Dedicated agent to handle all enquiries and negotiations</li>
              <li><span className="split-check">✓</span>Transparent process with no hidden fees for tenants</li>
            </ul>
            <BookViewingInlineButton />
          </div>
        </div>
      </section>



      {/* ── SEARCH BAR ───────────────────────────────────────── */}
      <style>{`
        .search-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr auto;
          gap: 16px;
          align-items: end;
        }
        @media (max-width: 900px) {
          .search-grid {
            grid-template-columns: 1fr 1fr;
          }
          .search-grid button {
            grid-column: 1 / -1;
          }
        }
        @media (max-width: 480px) {
          .search-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
      <section style={{ background: '#f7f8fa', padding: 'clamp(40px, 6vw, 56px) clamp(20px, 5%, 5%)', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{
          background: '#fff', borderRadius: 10, padding: 'clamp(24px, 4vw, 40px)',
          boxShadow: '0 4px 32px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb',
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#9ca3af', marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <span>Search Properties</span>
            {(location || minPrice || maxPrice || bedrooms) && (
              <span style={{
                fontSize: 12, color: '#2563eb', fontWeight: 600, letterSpacing: 0.5,
                background: '#eff6ff', padding: '4px 12px', borderRadius: 20,
                textTransform: 'none', animation: 'fadeSlideIn 0.25s ease',
              }}>
                {[
                  location && `📍 ${location}`,
                  minPrice && `from £${Number(minPrice).toLocaleString()}/mo`,
                  maxPrice && `to £${Number(maxPrice).toLocaleString()}/mo`,
                  bedrooms === '0' ? 'Studio' : bedrooms ? `${bedrooms}+ beds` : '',
                ].filter(Boolean).join(' · ')}
              </span>
            )}
          </div>
          <div className="search-grid">
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Location</label>
              <input
                value={location} onChange={e => setLocation(e.target.value)}
                placeholder="City, postcode or area…"
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                style={{
                  width: '100%', padding: '14px 16px', fontSize: 15,
                  border: '1px solid #d1d5db', borderRadius: 6, outline: 'none',
                  fontFamily: "'Poppins', sans-serif", color: '#0f1f3d',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Min Price</label>
              <select value={minPrice} onChange={e => setMinPrice(e.target.value)} style={{
                width: '100%', padding: '14px 16px', fontSize: 15,
                border: '1px solid #d1d5db', borderRadius: 6, outline: 'none',
                fontFamily: "'Poppins', sans-serif", color: '#0f1f3d',
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
                fontFamily: "'Poppins', sans-serif", color: '#0f1f3d',
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
                fontFamily: "'Poppins', sans-serif", color: '#0f1f3d',
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
      <style>{`
        .listings-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 56px;
          flex-wrap: wrap;
          gap: 16px;
        }
      `}</style>
      <section style={{ padding: 'clamp(60px, 8vw, 90px) clamp(20px, 5%, 5%)' }}>
        <div className="listings-header">
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: '#2563eb', marginBottom: 14 }}>
              Latest Listings
            </div>
            <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 'clamp(32px,4vw,52px)', fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.5px', color: '#0f1f3d' }}>
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
      <style>{`
        .how-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
        }
        @media (max-width: 768px) {
          .how-grid {
            grid-template-columns: 1fr;
            gap: 48px;
          }
        }
      `}</style>
      <section style={{ padding: 'clamp(60px, 8vw, 90px) clamp(20px, 5%, 5%)', background: '#f7f8fa' }}>
        <div style={{ marginBottom: 56 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: '#2563eb', marginBottom: 14 }}>
            How It Works
          </div>
          <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 'clamp(32px,4vw,52px)', fontWeight: 700, color: '#0f1f3d' }}>
            Simple, Direct, Transparent
          </h2>
        </div>

        <div className="how-grid">
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
                <div key={s.n} className={`how-step reveal reveal-delay-${s.n}`} style={{ display: 'flex', gap: 18, marginBottom: 28 }}>
                  <div className="step-num" style={{
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
      <style>{`
        .cta-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 40px;
          flex-wrap: wrap;
        }
        .cta-banner-btns {
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
        }
        @media (max-width: 600px) {
          .cta-banner { flex-direction: column; align-items: flex-start; }
          .cta-banner-btns { width: 100%; }
          .cta-banner-btns a { flex: 1; text-align: center; }
        }
      `}</style>
      <section style={{
        background: '#0f1f3d', padding: 'clamp(56px, 8vw, 80px) clamp(20px, 5%, 5%)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at 20% 50%, rgba(30,58,110,0.2) 0%, transparent 60%)',
          pointerEvents: 'none',
        }} />
        <div className="cta-banner reveal" style={{ position: 'relative' }}>
          <div>
            <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 'clamp(28px,3.5vw,48px)', fontWeight: 700, color: '#fff', marginBottom: 12 }}>
              Ready to find your<br /><span style={{ color: '#4a90d9' }}>perfect home?</span>
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 16, fontWeight: 300 }}>
              Join thousands of landlords and tenants already using House of Lettings.
            </p>
          </div>
          <div className="cta-banner-btns">
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
        </div>
      </section>


      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer style={{
        background: '#050a12', borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: 'clamp(32px, 5vw, 48px) clamp(20px, 5%, 5%)',
      }}>
        <style>{`
          @media (max-width: 600px) {
            .hol-footer-inner { flex-direction: column !important; align-items: flex-start !important; gap: 20px !important; }
          }
        `}</style>
        <div className="hol-footer-inner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{
            fontFamily: "'Poppins', sans-serif", fontSize: 20, fontWeight: 700,
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
