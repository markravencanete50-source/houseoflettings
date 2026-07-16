'use client';
// app/page.tsx
import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/layout/Navbar';
import PropertyCard from '@/components/property/PropertyCard';
import { getProperties } from '@/services/property';
import { Property } from '@/lib/types';
import GoogleReviews from '@/components/GoogleReviews';
import Footer from '@/components/layout/Footer';
import { BUNDLES } from '@/lib/bundles';

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
        fontSize: 17, color: 'rgba(255,255,255,0.95)', lineHeight: 1.65,
        maxWidth: 480, margin: '0 auto 44px', fontWeight: 400, letterSpacing: '0.2px',
        fontFamily: "'Poppins', sans-serif", textAlign: 'center',
      }}>
        {HERO_PHRASES[idx]}
      </p>
    </>
  );
}

const ValuationModal = lazy(() => import('@/components/ValuationModal'));

// The site-standard CTA size, matching components/layout/ServiceHero.module.css
// (.btn) and the .hero-btn rule below. Every call-to-action is this size.
const HOME_CTA_STYLE: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9,
  boxSizing: 'border-box', minHeight: 48, lineHeight: 1.2,
  padding: '14px 28px', border: '1.5px solid transparent', borderRadius: 9,
  fontFamily: "'Poppins', sans-serif", fontSize: 13.5, fontWeight: 700,
  letterSpacing: '.02em', textTransform: 'uppercase', textDecoration: 'none',
};

// ── INLINE VALUATION BUTTON (routes to the full valuation form) ───────────────
// Same size as every other CTA, but laid out full-width within its column.
const inlineCtaStyle: React.CSSProperties = {
  ...HOME_CTA_STYLE,
  background: '#2563eb', color: '#fff',
  cursor: 'pointer', transition: 'background 0.2s',
  display: 'flex', width: '100%', maxWidth: '260px',
};
function ValuationInlineButton() {
  return (
    <Link
      href="/book-valuation"
      style={inlineCtaStyle}
      onMouseEnter={e => (e.currentTarget.style.background = '#1d4ed8')}
      onMouseLeave={e => (e.currentTarget.style.background = '#2563eb')}
    >
      Book a valuation
    </Link>
  );
}

// ── INLINE BOOK A VIEWING BUTTON (routes to browse properties) ────────────────
function BookViewingInlineButton() {
  return (
    <Link
      href="/listings"
      style={inlineCtaStyle}
      onMouseEnter={e => (e.currentTarget.style.background = '#1d4ed8')}
      onMouseLeave={e => (e.currentTarget.style.background = '#2563eb')}
    >
      Book a viewing
    </Link>
  );
}


// ── SERVICE ROW (pricing-style: copy + designed navy spec panel) ──────────────
type HpPanel = {
  kind: string;
  badge?: string;
  headline: string;
  per?: string;
  note?: string;
  listLabel: string;
  items: string[];
};
function ServiceRow({
  eyebrow, title, lead, body, points, cta, panel, reversed, featured,
}: {
  eyebrow: string;
  title: string;
  lead: string;
  body: string;
  points: string[];
  cta: React.ReactNode;
  panel: HpPanel;
  reversed?: boolean;
  featured?: boolean;
}) {
  return (
    <div className={`hp-svc-row${reversed ? ' hp-rev' : ''}${featured ? ' hp-featured' : ''}`}>
      {/* Copy side */}
      <div className="hp-svc-copy">
        <span className="hp-svc-kicker">{eyebrow}</span>
        <h2 className="hp-svc-title">{title}</h2>
        <p className="hp-svc-lead">{lead}</p>
        <p className="hp-svc-body">{body}</p>
        <ul className="hp-svc-points">
          {points.map((pt) => (
            <li key={pt}>
              <i className="hp-ptick" aria-hidden>
                <svg viewBox="0 0 24 24"><polyline points="4 13 10 19 20 6" /></svg>
              </i>
              <span>{pt}</span>
            </li>
          ))}
        </ul>
        <div className="hp-svc-cta">{cta}</div>
      </div>

      {/* Designed navy spec panel (no photo) */}
      <div className="hp-svc-visual">
        <div className={`hp-vis${featured ? ' hp-vis--hot' : ''}`}>
          <span className="hp-orb hp-orb-a" aria-hidden />
          <span className="hp-orb hp-orb-b" aria-hidden />
          <div className="hp-vis-top">
            <span className="hp-vis-kind">{panel.kind}</span>
            {panel.badge && <span className="hp-vis-badge">{panel.badge}</span>}
          </div>
          <div className="hp-vis-price">
            <span className="hp-vis-fee">{panel.headline}</span>
            {panel.per && <span className="hp-vis-per">{panel.per}</span>}
          </div>
          {panel.note && <div className="hp-vis-note">{panel.note}</div>}
          <div className="hp-vis-div" />
          <div className="hp-vis-label">{panel.listLabel}</div>
          <ul className="hp-vis-list">
            {panel.items.map((h, hi) => (
              <li key={h} className="hp-vis-item" style={{ animationDelay: `${0.24 + hi * 0.09}s` }}>
                <i className="hp-vis-tick" aria-hidden>
                  <svg viewBox="0 0 24 24"><polyline points="4 13 10 19 20 6" /></svg>
                </i>
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}


// ── GALLERY DATA ─────────────────────────────────────────────────────────────
const GALLERY_ITEMS = [
  {
    img: '/images/agent-photo.webp',
    label: 'Leeds & Manchester Experts',
    sub: 'Local knowledge, professional service.',
  },
  {
    img: '/images/brand-desk.webp',
    label: 'We Handle the Details.',
    sub: 'You enjoy the returns.',
  },
  {
    img: '/images/service-compare.webp',
    label: 'Full Lettings & Management',
    sub: 'AI powered system, expert team.',
  },
  {
    img: '/images/landlord-app.webp',
    label: 'Everything You Need',
    sub: 'To succeed as a landlord.',
  },
  {
    img: '/images/compliance.webp',
    label: 'Stay Fully Compliant',
    sub: 'We track the rules so you don\'t have to.',
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
        <div
          className="hol-lightbox"
          onClick={() => setLightbox(null)}
          onKeyDown={(e) => e.key === 'Escape' && setLightbox(null)}
          role="dialog"
          aria-label="Image viewer"
        >
          <button className="hol-lb-close" onClick={() => setLightbox(null)} aria-label="Close image viewer">&times;</button>
          <button className="hol-lb-prev" aria-label="Previous image" onClick={e => { e.stopPropagation(); setLightbox((lightbox - 1 + GALLERY_ITEMS.length) % GALLERY_ITEMS.length); }}>&lsaquo;</button>
          <img
            src={GALLERY_ITEMS[lightbox].img}
            alt={GALLERY_ITEMS[lightbox].label}
            onClick={e => e.stopPropagation()}
          />
          <button className="hol-lb-next" aria-label="Next image" onClick={e => { e.stopPropagation(); setLightbox((lightbox + 1) % GALLERY_ITEMS.length); }}>&rsaquo;</button>
          <div className="hol-lb-caption">{GALLERY_ITEMS[lightbox].label}</div>
        </div>
      )}

      {/* Section header */}
      <div style={{ padding: '0 5%', marginBottom: 48 }}>
        <div style={{
          fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase',
          color: 'var(--logo-blue)', marginBottom: 14,
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
            From compact city flats to sprawling countryside homes, every property listed directly by landlords across the UK.
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
            role="button"
            tabIndex={0}
            aria-label={`View ${item.label}`}
            onClick={() => { setActive(i); setLightbox(i); }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setActive(i);
                setLightbox(i);
              }
            }}
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
            <Image
              src={item.img}
              alt={item.label}
              fill
              draggable={false}
              sizes="360px"
              style={{ objectFit: 'cover' }}
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
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', letterSpacing: 0.5 }}>
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
      <Link href="/listings">🔍 Search Properties</Link>
      <div className="fab-divider" />
      <button onClick={() => setValuationOpen(true)}>📋 Book a Valuation</button>
      <Suspense fallback={null}>
        {valuationOpen && <ValuationModal isOpen={valuationOpen} onClose={() => setValuationOpen(false)} />}
      </Suspense>
    </div>
  );
}

// ── SERVICE-ROW SCROLL REVEAL ─────────────────────────────────────────────────
// Rows are visible by default; when a row scrolls into view we add `is-in`, which
// plays a one-shot directional entrance (copy from one side, panel from the other).
// Resting state is visible, so content is never left stuck if scripting is slow.
//
// A window scroll listener that re-queries `.hp-svc-row` on each frame (rather than
// a one-shot IntersectionObserver) is deliberate: the homepage has a pre-existing
// hydration mismatch that swaps the document's DOM after mount, which would leave an
// observer bound to stale, detached nodes. The window survives the swap, so querying
// live nodes on each scroll always targets the current elements.
function useServiceRowReveal() {
  useEffect(() => {
    let raf = 0;
    const reveal = () => {
      raf = 0;
      const trigger = window.innerHeight * 0.86;
      document.querySelectorAll('.hp-svc-row').forEach((r) => {
        if (r.classList.contains('is-in')) return;
        if (r.getBoundingClientRect().top < trigger) r.classList.add('is-in');
      });
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(reveal); };
    reveal();                       // reveal anything already in view on mount
    const settle = setTimeout(reveal, 150);   // re-check after hydration settles
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      clearTimeout(settle);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
}

// ── PAGE ──────────────────────────────────────────────────────────────────────
export default function HomePage() {
  useScrollReveal();
  useServiceRowReveal();
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
        setFeatured(props.slice(0, 6));
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
        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; }
        }

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

        /* Section breathing gaps - navy so dark sections flow naturally */
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
          max-width: calc(100vw - 16px);
          background: #0f1f3d; border-radius: 40px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.35);
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.12);
        }
        @media (max-width: 768px) {
          .hol-fab { display: flex; }
        }
        .hol-fab a, .hol-fab button {
          padding: 12px 16px; font-size: 11.5px; font-weight: 700;
          letter-spacing: 0.3px; text-transform: uppercase;
          color: #fff; text-decoration: none; white-space: nowrap;
          font-family: 'Poppins', sans-serif;
          border: none; background: none; cursor: pointer;
          transition: background 0.2s;
        }
        @media (max-width: 380px) {
          .hol-fab a, .hol-fab button { padding: 11px 12px; font-size: 10.5px; letter-spacing: 0.2px; }
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
          transition: transform 0.3s ease, border-color 0.3s ease, background 0.3s ease, box-shadow 0.3s ease !important;
        }
        .service-card:hover {
          transform: translateY(-4px) !important;
          border-color: #2563eb !important;
          background: #f8fafc !important;
          box-shadow: 0 20px 50px rgba(0,0,0,0.12) !important;
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

        @media (max-width: 768px) {
          .hcw-orb-a, .hcw-orb-b, .hcw-orb-c,
          .hcw-grid-lines,
          .hol-gallery-card:hover img,
          .hol-gallery-card:hover .svc-shimmer {
            animation: none !important;
          }
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
        {/* Hero background image - happy family (LCP element).
            Served as a directly-preloaded static WebP (see layout.tsx) rather than
            through next/image: heropage.webp is already only ~52KB, so the optimizer
            adds a network hop + AVIF-decode cost on throttled mobile with no byte
            saving — a measured LCP/PageSpeed regression. Keep it a raw background. */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url(/images/heropage.webp)',
          backgroundSize: 'cover', backgroundPosition: 'center top',
          backgroundRepeat: 'no-repeat',
          filter: 'brightness(1.0)',
        }} />
        {/* Dark overlay for text readability */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg,rgba(10,20,50,0.75) 0%,rgba(10,20,50,0.55) 60%, rgba(10,20,50,0.3) 100%)',
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
            fontWeight: 700, color: '#fff', lineHeight: 1.05, letterSpacing: '0.5px', marginBottom: 28,
            textTransform: 'uppercase',
          }}>
            We Handle the Details. <br /> <span style={{ color: '#4a90d9' }}>You Enjoy the Returns.</span>
          </h1>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20, justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="rgba(255,255,255,0.6)" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
          </div>

          <HeroCycler />

          <style>{`
            .hero-btns {
              display: flex; gap: 12px; flex-wrap: wrap;
              justify-content: center;
            }
            /* Site-standard CTA size, as components/layout/ServiceHero.module.css (.btn). */
            .hero-btn {
              display: inline-flex; align-items: center; justify-content: center; gap: 9px;
              box-sizing: border-box; min-height: 48px; line-height: 1.2;
              padding: 14px 28px;
              min-width: 200px; text-align: center;
              background: #2563eb; color: #fff; border: 1.5px solid transparent;
              border-radius: 9px; font-size: 13.5px; font-weight: 700;
              letter-spacing: 0.02em; text-transform: uppercase;
              text-decoration: none; font-family: 'Poppins', sans-serif;
              white-space: nowrap;
              cursor: pointer; transition: background 0.2s, border-color 0.2s, color 0.2s;
            }
            .hero-btn:hover { background: #1d4ed8; }
            @media (max-width: 600px) {
              .hero-btns { flex-direction: column; gap: 10px; align-items: stretch; }
              .hero-btn { width: 100%; min-width: 0; }
            }
          `}</style>
          <div className="hero-btns">
            <Link href="/listings" className="hero-btn">
              Book a Viewing
            </Link>
            <Link href="/book-valuation" className="hero-btn">
              Book a Valuation
            </Link>
            <Link href="/instant-valuation" className="hero-btn">
              Instant Valuation
            </Link>
          </div>
        </div>
      </section>


      {/* ── SERVICE ROWS (pricing-style copy + navy spec panel) ─ */}
      <style>{`
        /* ---------- Home service rows: alternating copy / spec panel ---------- */
        .hp-guide { max-width: 1160px; margin: 0 auto; padding: clamp(60px, 8vw, 100px) clamp(20px, 5%, 5%); }
        .hp-svc-row { display: grid; grid-template-columns: 1fr 1fr; gap: clamp(28px, 4.5vw, 68px); align-items: center; }
        .hp-svc-row + .hp-svc-row { margin-top: clamp(48px, 7vw, 88px); }

        /* Motion: elements are visible by default; is-in plays a one-shot entrance. */
        @keyframes hp-rise { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: none; } }
        @keyframes hp-in-left { from { opacity: 0; transform: translateX(-34px); } to { opacity: 1; transform: none; } }
        @keyframes hp-in-right { from { opacity: 0; transform: translateX(34px); } to { opacity: 1; transform: none; } }
        @keyframes hp-rise-sm { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        @keyframes hp-float-a { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-24px,20px) scale(1.08); } }
        @keyframes hp-float-b { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(20px,-18px) scale(1.06); } }

        /* copy side */
        .hp-svc-kicker { display: inline-block; font-family: 'Poppins', sans-serif; font-size: 12px; font-weight: 700;
          letter-spacing: .14em; text-transform: uppercase; color: var(--logo-blue); margin-bottom: 14px; }
        .hp-svc-title { font-family: 'Poppins', sans-serif; font-size: clamp(26px, 3.4vw, 42px); font-weight: 700;
          color: #0f1f3d; margin: 0 0 16px; line-height: 1.16; letter-spacing: -.01em; }
        .hp-svc-lead { font-family: 'Poppins', sans-serif; font-size: 17px; font-weight: 600; color: #0f1f3d;
          margin: 0 0 14px; line-height: 1.55; }
        .hp-svc-body { font-family: 'Poppins', sans-serif; font-size: 15px; color: #5b6472; line-height: 1.85;
          margin: 0 0 22px; max-width: 460px; }
        .hp-svc-points { list-style: none; margin: 0 0 30px; padding: 0; display: flex; flex-direction: column; gap: 12px; }
        .hp-svc-points li { display: flex; gap: 11px; font-family: 'Poppins', sans-serif; font-size: 14.5px; color: #374151; line-height: 1.5; }
        .hp-ptick { flex: none; width: 20px; height: 20px; border-radius: 50%; background: #e7f6ee;
          display: inline-flex; align-items: center; justify-content: center; margin-top: 1px; }
        .hp-ptick svg { width: 11px; height: 11px; stroke: #16a34a; stroke-width: 3; fill: none; stroke-linecap: round; stroke-linejoin: round; }
        .hp-svc-cta { display: flex; }

        /* spec panel (the designed "image" side, no photo) */
        .hp-vis { position: relative; overflow: hidden; border-radius: 20px; padding: clamp(28px, 3vw, 40px);
          background: linear-gradient(155deg, #15294c 0%, #0c1a33 100%); color: #fff;
          box-shadow: 0 30px 60px -30px rgba(9,18,40,.7); border: 1px solid rgba(255,255,255,.06);
          transition: transform .25s ease, box-shadow .25s ease; }
        .hp-svc-row:hover .hp-vis { transform: translateY(-5px); box-shadow: 0 40px 72px -30px rgba(9,18,40,.8); }
        .hp-vis--hot { background: linear-gradient(155deg, #2563eb 0%, #122a5c 55%, #0c1a33 100%);
          border-color: rgba(120,170,255,.35); box-shadow: 0 34px 66px -28px rgba(37,99,235,.55); }
        .hp-orb { position: absolute; border-radius: 50%; pointer-events: none; filter: blur(2px); }
        .hp-orb-a { width: 230px; height: 230px; top: -70px; right: -50px;
          background: radial-gradient(circle, rgba(74,144,217,.4) 0%, transparent 70%); animation: hp-float-a 16s ease-in-out infinite; }
        .hp-orb-b { width: 180px; height: 180px; bottom: -60px; left: -40px;
          background: radial-gradient(circle, rgba(37,99,235,.32) 0%, transparent 70%); animation: hp-float-b 20s ease-in-out infinite; }
        .hp-vis--hot .hp-orb-a { background: radial-gradient(circle, rgba(147,197,255,.5) 0%, transparent 70%); }
        .hp-vis-top { position: relative; display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 18px; }
        .hp-vis-kind { font-family: 'Poppins', sans-serif; font-size: 11px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; color: #a9c4ea; }
        .hp-vis-badge { font-family: 'Poppins', sans-serif; font-size: 9.5px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase;
          color: #0c1a33; background: #fff; border-radius: 999px; padding: 4px 11px; }
        .hp-vis-price { position: relative; display: flex; align-items: baseline; gap: 10px; }
        .hp-vis-fee { font-family: 'Poppins', sans-serif; font-size: clamp(34px, 4.4vw, 46px); font-weight: 800; letter-spacing: -.02em; line-height: 1; }
        .hp-vis-per { font-family: 'Poppins', sans-serif; font-size: 12.5px; font-weight: 500; color: #a9c4ea; }
        .hp-vis-note { position: relative; font-family: 'Poppins', sans-serif; font-size: 13px; font-weight: 600; color: #8fa6c9; margin-top: 9px; }
        .hp-vis-div { position: relative; height: 1px; background: rgba(255,255,255,.12); margin: 22px 0 16px; }
        .hp-vis-label { position: relative; font-family: 'Poppins', sans-serif; font-size: 10.5px; font-weight: 700; letter-spacing: .12em;
          text-transform: uppercase; color: #8fa6c9; margin-bottom: 14px; }
        .hp-vis-list { position: relative; list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 12px; }
        .hp-vis-item { display: flex; gap: 11px; align-items: flex-start; font-family: 'Poppins', sans-serif; font-size: 13.8px; line-height: 1.45; color: #e7eefb; }
        .hp-svc-row.is-in .hp-vis-item { animation: hp-rise-sm .5s ease backwards; }
        .hp-vis-tick { flex: none; width: 20px; height: 20px; border-radius: 50%; background: rgba(74,222,128,.16);
          display: inline-flex; align-items: center; justify-content: center; margin-top: 1px; }
        .hp-vis-tick svg { width: 11px; height: 11px; stroke: #4ade80; stroke-width: 3; fill: none; stroke-linecap: round; stroke-linejoin: round; }
        .hp-vis--hot .hp-vis-tick { background: rgba(255,255,255,.18); }
        .hp-vis--hot .hp-vis-tick svg { stroke: #fff; }

        /* desktop: alternate sides + directional slide-in from each side */
        @media (min-width: 861px) {
          .hp-svc-row.hp-rev .hp-svc-visual { order: -1; }
          .hp-svc-row.is-in .hp-svc-copy { animation: hp-in-left .7s .05s cubic-bezier(.22,1,.36,1) backwards; }
          .hp-svc-row.is-in .hp-svc-visual { animation: hp-in-right .7s .12s cubic-bezier(.22,1,.36,1) backwards; }
          .hp-svc-row.hp-rev.is-in .hp-svc-copy { animation-name: hp-in-right; }
          .hp-svc-row.hp-rev.is-in .hp-svc-visual { animation-name: hp-in-left; }
        }
        /* mobile: stack — panel on top, copy below, full-width CTA */
        @media (max-width: 860px) {
          .hp-svc-row { grid-template-columns: 1fr; gap: 30px; }
          .hp-svc-visual { order: -1; }
          .hp-svc-row.is-in { animation: hp-rise .55s cubic-bezier(.22,1,.36,1) backwards; }
          .hp-svc-body { max-width: 100%; }
          .hp-svc-cta { justify-content: center; }
        }
        @media (prefers-reduced-motion: reduce) {
          .hp-svc-row, .hp-svc-copy, .hp-svc-visual, .hp-vis-item, .hp-orb { animation: none !important; }
        }
      `}</style>
      <section style={{ background: 'linear-gradient(180deg, #ffffff 0%, #f3f4f6 100%)', overflow: 'hidden' }}>
        <div className="hp-guide">
          <ServiceRow
            eyebrow="For Landlords"
            title="Are you ready to sell or let your property?"
            lead="Book a free sales or lettings valuation with your local agent."
            body="They use their local knowledge and expertise to give you the most accurate sales or lettings figure, so you can plan your next move with total confidence."
            points={[
              'Free, no obligation appraisal',
              'Backed by live local market data',
              'Honest advice to maximise your return',
            ]}
            cta={<ValuationInlineButton />}
            panel={{
              kind: 'Free Valuation',
              headline: 'Free',
              per: 'no obligation',
              note: 'Booked around you, in person or virtual',
              listLabel: "What's included",
              items: [
                'Sales or lettings valuation',
                'Local agent who knows your area',
                'Accurate, data-driven figures',
                'Clear next steps, zero pressure',
              ],
            }}
          />
          <ServiceRow
            reversed
            eyebrow="For Tenants"
            title="Looking to rent a property?"
            lead="Register your requirements and we'll match you to the right homes."
            body="We take the pressure off your search and connect you with suitable properties before they hit the open market, guiding you every step of the way."
            points={[
              'Early access to new listings',
              'A dedicated agent on your side',
              'No hidden fees for tenants',
            ]}
            cta={<BookViewingInlineButton />}
            panel={{
              kind: 'For Tenants',
              headline: '£0',
              per: 'tenant fees',
              note: 'Matched before homes go public',
              listLabel: 'What you get',
              items: [
                'Priority access before the open market',
                'One dedicated point of contact',
                'Viewings arranged around you',
                'A clear, no pressure process',
              ],
            }}
          />
        </div>
      </section>


      {/* ── INFO CARDS ───────────────────────────────────────── */}
      <style>{`
        .services-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 28px;
          position: relative;
          z-index: 1;
        }
        @media (max-width: 900px) {
          .services-grid { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 600px) {
          .services-grid { grid-template-columns: 1fr; }
        }

        @keyframes hcw-float-a {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33%       { transform: translate(40px, -30px) scale(1.06); }
          66%       { transform: translate(-20px, 20px) scale(0.97); }
        }
        @keyframes hcw-float-b {
          0%, 100% { transform: translate(0, 0) scale(1); }
          40%       { transform: translate(-50px, 30px) scale(1.05); }
          70%       { transform: translate(25px, -15px) scale(0.96); }
        }
        @keyframes hcw-float-c {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%       { transform: translate(30px, 40px) scale(1.08); }
        }
        .hcw-orb-a {
          position: absolute; border-radius: 50%; pointer-events: none;
          width: 480px; height: 480px;
          top: -120px; left: -80px;
          background: radial-gradient(circle, rgba(37,99,235,0.13) 0%, transparent 70%);
          animation: hcw-float-a 14s ease-in-out infinite;
        }
        .hcw-orb-b {
          position: absolute; border-radius: 50%; pointer-events: none;
          width: 380px; height: 380px;
          bottom: -80px; right: -60px;
          background: radial-gradient(circle, rgba(74,144,217,0.12) 0%, transparent 70%);
          animation: hcw-float-b 18s ease-in-out infinite;
        }
        .hcw-orb-c {
          position: absolute; border-radius: 50%; pointer-events: none;
          width: 260px; height: 260px;
          top: 50%; left: 50%; transform: translate(-50%, -50%);
          background: radial-gradient(circle, rgba(37,99,235,0.07) 0%, transparent 70%);
          animation: hcw-float-c 10s ease-in-out infinite;
        }

        @keyframes hcw-grid-pulse {
          0%, 100% { opacity: 0.18; }
          50%       { opacity: 0.32; }
        }
        .hcw-grid-lines {
          position: absolute; inset: 0; pointer-events: none;
          background-image:
            linear-gradient(rgba(37,99,235,0.07) 1px, transparent 1px),
            linear-gradient(90deg, rgba(37,99,235,0.07) 1px, transparent 1px);
          background-size: 60px 60px;
          animation: hcw-grid-pulse 6s ease-in-out infinite;
          mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%);
        }

        .service-card.reveal {
          opacity: 0;
          transform: translateY(28px) scale(0.94);
          transition: opacity 0.7s cubic-bezier(.22,1,.36,1), transform 0.7s cubic-bezier(.22,1,.36,1);
        }
        .service-card.reveal.revealed {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
        .service-card {
          position: relative;
          overflow: hidden;
        }
        .service-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          border-radius: 10px 10px 0 0;
          background: linear-gradient(90deg, #2563eb, #4a90d9);
          transform: scaleX(0);
          transform-origin: left center;
          transition: transform 0.35s ease;
          z-index: 2;
        }
        .service-card:hover::before {
          transform: scaleX(1);
        }
        .service-card::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 10px;
          background: radial-gradient(ellipse 70% 60% at 50% 110%, rgba(37,99,235,0.08) 0%, transparent 70%);
          opacity: 0;
          transition: opacity 0.4s ease;
          pointer-events: none;
          z-index: 0;
        }
        .service-card:hover::after {
          opacity: 1;
        }
        .svc-icon {
          width: 52px; height: 52px;
          border-radius: 12px;
          background: linear-gradient(135deg, #e8f0fe 0%, #dbeafe 100%);
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 20px;
          transition: background 0.3s ease, transform 0.3s ease;
          flex-shrink: 0;
          position: relative; z-index: 1;
        }
        .service-card:hover .svc-icon {
          background: linear-gradient(135deg, #2563eb 0%, #4a90d9 100%);
          transform: rotate(-4deg) scale(1.08);
        }
        .svc-icon svg { transition: fill 0.3s ease; }
        .service-card:hover .svc-icon svg { fill: #fff !important; }
        .learn-more-arrow {
          display: inline-block;
          transition: transform 0.25s ease;
        }
        .service-card:hover .learn-more-arrow {
          transform: translateX(6px);
        }
        .svc-learn {
          display: inline-flex; align-items: center; gap: 7px;
          background: #EDF5E1; color: #3f6b1a; font-size: 13px; font-weight: 700;
          letter-spacing: 0.3px; padding: 9px 18px; border-radius: 999px;
          border: 1px solid #d8ecc4;
          position: relative; z-index: 1;
          transition: background 0.25s ease, border-color 0.25s ease, color 0.25s ease;
        }
        .service-card:hover .svc-learn { background: #e2efd0; border-color: #c4e0a6; color: #35591a; }
        @keyframes hcw-shimmer {
          0%   { left: -80%; }
          100% { left: 140%; }
        }
        .svc-shimmer {
          position: absolute; top: 0; bottom: 0;
          width: 60px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent);
          transform: skewX(-15deg);
          opacity: 0;
          pointer-events: none;
          z-index: 3;
        }
        .service-card:hover .svc-shimmer {
          opacity: 1;
          animation: hcw-shimmer 0.65s ease forwards;
        }
        @keyframes hcw-underline-grow {
          from { width: 0; }
          to   { width: 64px; }
        }
        .hcw-heading-line {
          display: block;
          height: 3px;
          border-radius: 2px;
          background: linear-gradient(90deg, #2563eb, #4a90d9);
          margin: 14px auto 0;
          animation: hcw-underline-grow 0.8s cubic-bezier(.22,1,.36,1) 0.3s both;
        }
      `}</style>
      <section style={{
        padding: 'clamp(60px, 8vw, 100px) clamp(20px, 5%, 5%)',
        background: 'linear-gradient(160deg, #e8edf5 0%, #f3f4f6 40%, #eef1f8 100%)',
        borderTop: '1px solid rgba(37,99,235,0.10)',
        borderBottom: '1px solid rgba(37,99,235,0.10)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div className="hcw-orb-a" />
        <div className="hcw-orb-b" />
        <div className="hcw-orb-c" />
        <div className="hcw-grid-lines" />

        <div style={{ marginBottom: 56, textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--logo-blue)', marginBottom: 14 }}>
            Our Services
          </div>
          <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 'clamp(28px,4vw,48px)', fontWeight: 700, color: '#0f1f3d', margin: 0 }}>
            How We Can Help
          </h2>
          <span className="hcw-heading-line" />
        </div>

        <div className="services-grid">
          {[
            {
              title: 'For Landlords',
              body: 'Renting your property should feel straightforward and cost effective. Our service keeps the process clear with transparent pricing and flexible options, from free tools to low cost packages including advertising, enquiry handling, and professional tenancy setup.',
              href: '/landlords',
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="#2563eb" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                </svg>
              ),
            },
            {
              title: 'For Tenants',
              body: 'Our goal is to make finding your next home straightforward, safe, and comfortable. We offer flexible search options for different needs: pet friendly homes, student accommodation, and properties suitable for a range of lifestyles. No pressure, no unnecessary office visits.',
              href: '/tenants',
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="#2563eb" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
                </svg>
              ),
            },
            {
              title: 'Property Management',
              body: 'From accurate valuations and professional photography to comprehensive tenant screening and 12 month guarantee insurance, we ensure your property is in the best hands at every stage of the letting process.',
              href: '/property-management',
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="#2563eb" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-1 14l-3-3 1.41-1.41L11 12.17l4.59-4.58L17 9l-6 6z"/>
                </svg>
              ),
            },
          ].map((card, i) => (
            <Link key={card.title} href={card.href} className={`service-card reveal reveal-delay-${i + 1}`} style={{
              background: '#fff',
              borderRadius: 10, padding: '40px 32px',
              border: '1px solid rgba(229,231,235,0.8)',
              boxShadow: '0 4px 32px rgba(0,0,0,0.06)',
              textDecoration: 'none', display: 'block',
              transition: 'transform 0.3s ease, border-color 0.3s ease, background 0.3s ease, box-shadow 0.3s ease',
            }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-6px)';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(37,99,235,0.35)';
                (e.currentTarget as HTMLElement).style.background = '#fafcff';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 24px 56px rgba(37,99,235,0.14), 0 4px 12px rgba(0,0,0,0.06)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(229,231,235,0.8)';
                (e.currentTarget as HTMLElement).style.background = '#fff';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 32px rgba(0,0,0,0.06)';
              }}
            >
              <div className="svc-shimmer" />
              <div className="svc-icon">{card.icon}</div>
              <h3 style={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: 20, fontWeight: 700, color: '#0f1f3d',
                marginBottom: 16, position: 'relative', zIndex: 1,
              }}>
                {card.title}
              </h3>
              <p style={{ fontSize: 14, color: '#4b5563', lineHeight: 1.8, margin: '0 0 20px', position: 'relative', zIndex: 1 }}>
                {card.body}
              </p>
              <span className="svc-learn">
                Learn more <span className="learn-more-arrow">{'->'}</span>
              </span>
            </Link>
          ))}
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
          color: var(--logo-blue); margin-bottom: 16px;
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
          color: var(--logo-blue); font-weight: 700;
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

     {/* Valuation - professional two-col, no photo */}
<section className="split-section" style={{ background: '#f7f8fa' }}>
  <style>{`
    .val-section-inner {
      max-width: 1100px;
      margin: 0 auto;
      padding: clamp(72px, 9vw, 110px) clamp(24px, 5%, 80px);
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 80px;
      align-items: start;
    }
    @media (max-width: 768px) {
      .val-section-inner {
        grid-template-columns: 1fr;
        gap: 40px;
        padding: 56px 24px;
      }
    }
  `}</style>
  <div className="val-section-inner reveal">

    {/* LEFT — heading + body */}
    <div>
      <p className="split-eyebrow" style={{ textAlign: 'left' }}>For Landlords</p>
      <h2 className="split-title" style={{ textAlign: 'left', fontSize: 'clamp(28px,3.5vw,40px)', marginBottom: 20 }}>
        Why book a valuation with House of Lettings?
      </h2>
      <p className="split-body" style={{ textAlign: 'left', maxWidth: '100%', marginBottom: 28 }}>
        Booking a valuation with House of Lettings will save you time, money, and stress. Our local experts give you an honest, data driven view of what your property is worth, so you can make informed decisions with confidence.
      </p>
      <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: 13, color: '#6b7280', lineHeight: 1.7, marginBottom: 36 }}>
        Whether you own one property or a full portfolio, our team is here to protect your investment and maximise your returns so you can enjoy the freedom of hands-off landlording.
      </p>
      <ValuationInlineButton />
    </div>

    {/* RIGHT — checklist */}
    <div style={{
      background: '#fff',
      borderRadius: 12,
      padding: '36px 32px',
      boxShadow: '0 4px 32px rgba(0,0,0,0.07)',
      border: '1px solid #e5e7eb',
    }}>
      <p style={{
        fontFamily: "'Poppins', sans-serif",
        fontSize: 11, fontWeight: 700, letterSpacing: 3,
        textTransform: 'uppercase', color: 'var(--logo-blue)', marginBottom: 20,
      }}>
        What you get
      </p>
      <ul className="split-list" style={{ margin: 0, gap: 16 }}>
        {[
          'Free, no obligation valuation from a local expert',
          'Accurate rental and sales valuations backed by live market data',
          'Advice on how to maximise your property\'s return',
          'Better tenant quality. We find and secure reliable tenants',
          'Full compliance, legal, and rent protection support',
          'Day to day management handled by experts',
        ].map((item, i) => (
          <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, paddingBottom: 16, borderBottom: i < 5 ? '1px solid #f3f4f6' : 'none' }}>
            <span style={{
              width: 22, height: 22, borderRadius: '50%',
              background: '#eff6ff', display: 'flex', alignItems: 'center',
              justifyContent: 'center', flexShrink: 0, marginTop: 1,
            }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="#2563eb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
            <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: 14, color: '#374151', lineHeight: 1.6 }}>{item}</span>
          </li>
        ))}
      </ul>
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
          backgroundImage: 'url(/images/Background_of_the_services.webp)',
          backgroundSize: 'cover', backgroundPosition: 'center bottom',
          backgroundRepeat: 'no-repeat',
        }} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(5,12,30,0.88)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>

          <div style={{ marginBottom: 56, textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: '#4a90d9', marginBottom: 14 }}>
              Landlords Pricing
            </div>
            <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 'clamp(28px,4vw,48px)', fontWeight: 700, color: '#fff', margin: '0 0 16px' }}>
              Choose Your Package
            </h2>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.70)', maxWidth: 560, margin: '0 auto', lineHeight: 1.7, fontWeight: 300, fontFamily: "'Poppins', sans-serif" }}>
              Every package builds on the last. Start with what you need and upgrade whenever you&apos;re ready.
            </p>
          </div>

          {/* Driven by lib/bundles.ts so the teaser can never quote a price the
              rest of the site disagrees with. The ongoing percentage leads: it
              is our main management fee. Tenant-find packages have no
              percentage, so the one time fee leads there instead. */}
          <div className="pricing-teaser-grid">
            {BUNDLES.map((b, i) => {
              const isMgmt = !!b.mgmtFee;
              const popular = !!b.badge;
              return (
                <Link
                  key={b.id}
                  href="/pricing"
                  className={`pricing-teaser-card reveal reveal-delay-${i + 1}${popular ? ' popular' : ''}`}
                >
                  {popular && (
                    <div style={{
                      position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)',
                      background: '#2563eb', color: '#fff', fontSize: 9, fontWeight: 800,
                      letterSpacing: 2, textTransform: 'uppercase', padding: '4px 14px', borderRadius: 20,
                      whiteSpace: 'nowrap',
                    }}>
                      Most Popular
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, fontFamily: "'Poppins', sans-serif" }}>
                    {isMgmt ? 'Management fees' : 'Set up fees'}
                  </div>
                  <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 'clamp(28px,3vw,40px)', fontWeight: 700, color: 'var(--price-green)', lineHeight: 1, marginBottom: 6 }}>
                    {isMgmt ? b.mgmtFee : b.setupFee}
                                      </div>
                  <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 11.5, fontWeight: 600, color: 'rgba(255,255,255,0.55)', marginBottom: 12 }}>
                    {isMgmt
                      ? <><b style={{ fontWeight: 800, color: 'var(--price-green-bright)' }}>{b.setupFee}</b> set up fees</>
                      : 'No management fees'}
                  </div>
                  <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 13, fontWeight: 700, color: '#fff', lineHeight: 1.4 }}>
                    {b.label}
                  </div>
                  <div style={{ marginTop: 16, fontSize: 11, color: '#4a90d9', fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                    View details &rarr;
                  </div>
                </Link>
              );
            })}
          </div>

          <div style={{ textAlign: 'center' }}>
            <Link href="/pricing" style={{
              ...HOME_CTA_STYLE, background: '#2563eb', color: '#fff',
              transition: 'background 0.2s',
            }}
              onMouseEnter={e => (e.currentTarget.style.background = '#1d4ed8')}
              onMouseLeave={e => (e.currentTarget.style.background = '#2563eb')}
            >
              View Full Pricing &amp; Details
            </Link>
          </div>

        </div>
      </section>


      {/* Find your perfect home - pricing-style copy + featured navy panel */}
      <section style={{ background: '#ffffff', overflow: 'hidden' }}>
        <div className="hp-guide">
          <ServiceRow
            featured
            eyebrow="For Tenants"
            title="Find your perfect home with House of Lettings"
            lead="Booking a viewing with us is quick, easy, and puts you first."
            body="We take the pressure off your search, matching you with the right properties and guiding you every step of the way."
            points={[
              'View properties before they hit the open market',
              'Dedicated agent to handle all enquiries and negotiations',
              'Transparent process with no hidden fees for tenants',
            ]}
            cta={<BookViewingInlineButton />}
            panel={{
              kind: 'For Tenants',
              badge: 'Free to register',
              headline: 'Free',
              per: 'to register',
              note: 'Off-market homes, first',
              listLabel: "What's included",
              items: [
                'Early access to off-market homes',
                'One point of contact throughout',
                'Honest advice at every step',
                'No fees, no pressure',
              ],
            }}
          />
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
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#6b7280', marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <span>Search Properties</span>
            {(location || minPrice || maxPrice || bedrooms) && (
              <span style={{
                fontSize: 12, color: 'var(--logo-blue)', fontWeight: 600, letterSpacing: 0.5,
                background: '#eff6ff', padding: '4px 12px', borderRadius: 20,
                textTransform: 'none', animation: 'fadeSlideIn 0.25s ease',
              }}>
                {[
                  location && `📍 ${location}`,
                  minPrice && `from £${Number(minPrice).toLocaleString()}/mo`,
                  maxPrice && `to £${Number(maxPrice).toLocaleString()}/mo`,
                  bedrooms === '0' ? 'Studio' : bedrooms ? `${bedrooms}+ beds` : '',
                ].filter(Boolean).join('  ')}
              </span>
            )}
          </div>
          <div className="search-grid">
            <div>
              <label htmlFor="location-input" style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Location</label>
              <input
                id="location-input"
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
              <label htmlFor="minprice-select" style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Min Price</label>
              <select id="minprice-select" value={minPrice} onChange={e => setMinPrice(e.target.value)} style={{
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
              <label htmlFor="maxprice-select" style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Max Price</label>
              <select id="maxprice-select" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} style={{
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
              <label htmlFor="bedrooms-select" style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Bedrooms</label>
              <select id="bedrooms-select" value={bedrooms} onChange={e => setBedrooms(e.target.value)} style={{
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
              ...HOME_CTA_STYLE, background: '#0f1f3d', color: '#fff',
              whiteSpace: 'nowrap', cursor: 'pointer', transition: 'background .2s',
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
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--logo-blue)', marginBottom: 14 }}>
              Latest Listings
            </div>
            <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 'clamp(32px,4vw,52px)', fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.5px', color: '#0f1f3d' }}>
              Recently Added
            </h2>
          </div>
          <Link href="/listings" style={{
            ...HOME_CTA_STYLE, background: 'transparent',
            borderColor: '#e5e7eb', color: '#0f1f3d',
            transition: 'all .2s',
          }}>
            View All &rarr;
          </Link>
        </div>

        {featured.length > 0 ? (
          <>
    <style>{`
      .listings-scroll-track {
        display: flex;
        gap: 24px;
        overflow-x: auto;
        padding-bottom: 16px;
        scroll-snap-type: x mandatory;
        -webkit-overflow-scrolling: touch;
        cursor: grab;
      }
      .listings-scroll-track:active { cursor: grabbing; }
      .listings-scroll-track::-webkit-scrollbar { height: 4px; }
      .listings-scroll-track::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 2px; }
      .listings-scroll-track::-webkit-scrollbar-thumb { background: #2563eb; border-radius: 2px; }
      .listings-scroll-track > * {
        flex: 0 0 300px;
        scroll-snap-align: start;
      }
      @media (max-width: 480px) {
        .listings-scroll-track > * { flex: 0 0 85vw; }
      }
    `}</style>
    <div className="listings-scroll-track">
      {featured.map(p => <PropertyCard key={p.id} property={p} />)}
    </div>
  </>
) : (
  <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af' }}>
    <div style={{ fontSize: 48, marginBottom: 16 }}>🏠</div>
    <p style={{ fontSize: 16, fontWeight: 500 }}>No properties listed yet.</p>
    <p style={{ fontSize: 14, marginTop: 8 }}>Be the first to list a property!</p>
    <Link href="/landlord-registration" style={{
      ...HOME_CTA_STYLE, marginTop: 20,
      background: '#1e3a6e', color: '#ffffff',
    }}>
      List Your Property &rarr;
    </Link>
  </div>
)}
      </section>
      <GoogleReviews />

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
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--logo-blue)', marginBottom: 14 }}>
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
          .cta-banner { flex-direction: column; align-items: flex-start; gap: 28px; }
          .cta-banner-btns { width: 100%; flex-direction: column; gap: 12px; }
          .cta-banner-btns a { flex: none; width: 100%; text-align: center; box-sizing: border-box; white-space: nowrap; }
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
              Ready to find your<br /><span style={{ color: '#60a5fa' }}>perfect home?</span>
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 16, fontWeight: 300 }}>
              Join thousands of landlords and tenants already using House of Lettings.
            </p>
          </div>
          <div className="cta-banner-btns">
            <Link href="/landlord-registration" style={{
              ...HOME_CTA_STYLE, background: '#1e3a6e', color: '#ffffff',
            }}>
              Get Started Free
            </Link>
            <Link href="/listings" style={{
              ...HOME_CTA_STYLE, background: 'transparent', color: '#fff',
              borderColor: 'rgba(255,255,255,0.3)',
            }}>
              Browse Listings
            </Link>
          </div>
        </div>
      </section>


      {/* ── FOOTER ───────────────────────────────────────────── */}
      <Footer />

    </>
  );
}
