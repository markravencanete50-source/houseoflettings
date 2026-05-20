'use client';
// app/page.tsx
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import PropertyCard from '@/components/property/PropertyCard';
import { getProperties } from '@/services/property';
import { Property } from '@/lib/types';
import ValuationCard from '@/components/ValuationCard';

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
          color: 'var(--red)', marginBottom: 14,
        }}>
          Properties We Love
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
          <h2 style={{
            fontFamily: 'var(--font-serif)', fontSize: 'clamp(28px,4vw,48px)',
            fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.5px', margin: 0,
          }}>
            Homes That Inspire
          </h2>
          <p style={{ fontSize: 15, color: 'var(--gray-600)', maxWidth: 380, lineHeight: 1.65, margin: 0, fontWeight: 300 }}>
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
                ? '0 20px 50px rgba(0,0,0,0.22)'
                : '0 6px 24px rgba(0,0,0,0.08)',
              cursor: 'pointer',
              outline: active === i ? '2px solid var(--red)' : '2px solid transparent',
              outlineOffset: 3,
            }}
          >
            {/* Image */}
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
              <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 4, fontFamily: 'var(--font-serif)' }}>
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
                background: 'var(--red)', color: '#fff',
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
              background: active === i ? 'var(--red)' : 'var(--gray-200)',
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
        minHeight: '100vh', background: '#0d1117',
        position: 'relative', display: 'flex', alignItems: 'center', padding: '68px 5% 0',
      }}>
        {/* Background image */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'url(https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1800&q=80) center/cover no-repeat',
          opacity: 0.18,
        }} />
        {/* Dark overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg,rgba(10,10,10,0.92) 0%,rgba(10,10,10,0.5) 100%)',
        }} />

        <div style={{ position: 'relative', maxWidth: 700 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 36 }}>
            {/* HOL logo mark — house + N shape, matching uploaded logo */}
            <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="56" height="56" rx="8" fill="#0a1628"/>
              {/* House roofline — arrow pointing up */}
              <polygon points="28,8 48,26 44,26 44,48 32,48 32,36 24,36 24,48 12,48 12,26 8,26" fill="#1e88e5"/>
              {/* N letterform overlaid in white on lower portion */}
              <rect x="16" y="28" width="5" height="16" fill="white"/>
              <rect x="35" y="28" width="5" height="16" fill="white"/>
              <polygon points="16,28 21,28 40,44 35,44" fill="white"/>
            </svg>
            <div style={{ lineHeight: 1.15 }}>
              <div style={{
                fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 600,
                color: '#fff', letterSpacing: '2px', textTransform: 'uppercase',
              }}>
                House of
              </div>
              <div style={{
                fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 600,
                color: '#fff', letterSpacing: '2px', textTransform: 'uppercase',
              }}>
                Lettings
              </div>
            </div>
          </div>

          <h1 style={{
            fontFamily: 'var(--font-serif)', fontSize: 'clamp(32px,5vw,66px)',
            fontWeight: 500, color: '#fff', lineHeight: 1.08, letterSpacing: '-0.5px', marginBottom: 12,
            textTransform: 'uppercase',
          }}>
            We Handle the Details.
          </h1>
          <h1 style={{
            fontFamily: 'var(--font-serif)', fontSize: 'clamp(32px,5vw,66px)',
            fontWeight: 500, color: '#1e88e5', lineHeight: 1.08, letterSpacing: '-0.5px', marginBottom: 28,
            textTransform: 'uppercase',
          }}>
            You Enjoy the Returns.
          </h1>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
            <div style={{ width: 32, height: 1, background: 'rgba(255,255,255,0.25)' }} />
            <svg width="18" height="18" viewBox="0 0 24 24" fill="rgba(255,255,255,0.5)" xmlns="http://www.w3.org/2000/svg">
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
              padding: '16px 36px', background: '#1e88e5', color: '#fff', border: 'none',
              borderRadius: 4, fontSize: 14, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase',
            }}>
              Browse Properties
            </Link>
            <Link href="/register" style={{
              padding: '16px 36px', background: 'transparent', color: '#fff',
              border: '1px solid rgba(255,255,255,0.4)', borderRadius: 4, fontSize: 14,
              fontWeight: 500, letterSpacing: '0.5px', textTransform: 'uppercase',
            }}>
              List Your Property
            </Link>
            <ValuationCard />
            <Link href="/terms" style={{
              padding: '16px 36px', background: 'transparent', color: '#fff',
              border: '1px solid rgba(255,255,255,0.4)', borderRadius: 4, fontSize: 14,
              fontWeight: 500, letterSpacing: '0.5px', textTransform: 'uppercase',
            }}>
              Terms &amp; Conditions
            </Link>
          </div>
        </div>
      </section>

      {/* ── SEARCH BAR ───────────────────────────────────────── */}
      <section style={{ background: 'var(--gray-100)', padding: '40px 5%', borderBottom: '1px solid var(--gray-200)' }}>
        <div style={{
          background: '#fff', borderRadius: 8, padding: '28px 32px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)', border: '1px solid var(--gray-200)',
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--gray-400)', marginBottom: 20 }}>
            Search Properties
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: 12, alignItems: 'end' }}>
            <div>
              <label className="form-label">Location</label>
              <input className="form-input" value={location} onChange={e => setLocation(e.target.value)}
                placeholder="City, postcode or area…" onKeyDown={e => e.key === 'Enter' && handleSearch()} />
            </div>
            <div>
              <label className="form-label">Min Price</label>
              <select className="form-select" value={minPrice} onChange={e => setMinPrice(e.target.value)}>
                <option value="">No min</option>
                <option value="500">£500/mo</option>
                <option value="800">£800/mo</option>
                <option value="1000">£1,000/mo</option>
                <option value="1500">£1,500/mo</option>
                <option value="2000">£2,000/mo</option>
              </select>
            </div>
            <div>
              <label className="form-label">Max Price</label>
              <select className="form-select" value={maxPrice} onChange={e => setMaxPrice(e.target.value)}>
                <option value="">No max</option>
                <option value="1000">£1,000/mo</option>
                <option value="1500">£1,500/mo</option>
                <option value="2000">£2,000/mo</option>
                <option value="3000">£3,000/mo</option>
                <option value="5000">£5,000/mo</option>
              </select>
            </div>
            <div>
              <label className="form-label">Bedrooms</label>
              <select className="form-select" value={bedrooms} onChange={e => setBedrooms(e.target.value)}>
                <option value="">Any</option>
                <option value="0">Studio</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
                <option value="4">4+</option>
              </select>
            </div>
            <button onClick={handleSearch} style={{
              padding: '13px 28px', background: 'var(--black)', color: '#fff', border: 'none',
              borderRadius: 4, fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap',
              textTransform: 'uppercase', letterSpacing: '0.5px', cursor: 'pointer', transition: 'background .2s',
            }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--red)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--black)')}
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
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--red)', marginBottom: 14 }}>
              Latest Listings
            </div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(32px,4vw,52px)', fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.5px' }}>
              Recently Added
            </h2>
          </div>
          <Link href="/listings" style={{
            padding: '12px 24px', border: '1px solid var(--gray-200)', borderRadius: 4,
            fontSize: 13, fontWeight: 600, color: 'var(--black)', textTransform: 'uppercase',
            letterSpacing: '0.5px', transition: 'all .2s',
          }}>
            View All →
          </Link>
        </div>

        {featured.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 24 }}>
            {featured.map(p => <PropertyCard key={p.id} property={p} />)}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--gray-400)' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🏠</div>
            <p style={{ fontSize: 16, fontWeight: 500 }}>No properties listed yet.</p>
            <p style={{ fontSize: 14, marginTop: 8 }}>Be the first to list a property!</p>
            <Link href="/register" style={{
              display: 'inline-block', marginTop: 20, padding: '12px 24px',
              background: 'var(--red)', color: '#fff', borderRadius: 4, fontSize: 14, fontWeight: 600,
            }}>
              List Your Property →
            </Link>
          </div>
        )}
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section style={{ padding: '90px 5%', background: 'var(--gray-100)', borderTop: '1px solid var(--gray-200)' }}>
        <div style={{ marginBottom: 56 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--red)', marginBottom: 14 }}>
            How It Works
          </div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(32px,4vw,52px)', fontWeight: 700 }}>
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
                marginBottom: 28, paddingBottom: 12, borderBottom: '2px solid var(--red)',
                display: 'inline-block',
              }}>
                {col.role}
              </div>
              {col.steps.map(s => (
                <div key={s.n} style={{ display: 'flex', gap: 18, marginBottom: 28 }}>
                  <div style={{
                    width: 36, height: 36, background: 'var(--black)', color: '#fff',
                    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 700, flexShrink: 0,
                  }}>
                    {s.n}
                  </div>
                  <div>
                    <h4 style={{ fontSize: 15, fontWeight: 600, marginBottom: 5 }}>{s.title}</h4>
                    <p style={{ fontSize: 14, color: 'var(--gray-600)', lineHeight: 1.6 }}>{s.desc}</p>
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
        background: 'var(--black)', padding: '80px 5%',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 40, flexWrap: 'wrap',
      }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(28px,3.5vw,48px)', fontWeight: 700, color: '#fff', marginBottom: 12 }}>
            Ready to find your<br /><span style={{ color: 'var(--red)' }}>perfect home?</span>
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 16, fontWeight: 300 }}>
            Join thousands of landlords and tenants already using House of Lettings.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 14 }}>
          <Link href="/register" style={{
            padding: '16px 36px', background: 'var(--red)', color: '#fff',
            borderRadius: 4, fontSize: 14, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase',
          }}>
            Get Started Free
          </Link>
          <Link href="/listings" style={{
            padding: '16px 36px', background: 'transparent', color: '#fff',
            border: '1px solid rgba(255,255,255,0.3)', borderRadius: 4, fontSize: 14,
            fontWeight: 500, letterSpacing: '0.5px', textTransform: 'uppercase',
          }}>
            Browse Listings
          </Link>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer style={{
        background: '#050505', borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '48px 5%',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
          <div style={{
            fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 700,
            color: '#fff', display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ width: 7, height: 7, background: 'var(--red)', borderRadius: '50%', display: 'inline-block' }} />
            House of Lettings
          </div>
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>
            © {new Date().getFullYear()} House of Lettings Ltd. All rights reserved.
          </p>
          <div style={{ display: 'flex', gap: 24 }}>
            <Link href="/cookie-policy" style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>Cookie Policy</Link>
            <Link href="/terms" style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>Terms</Link>
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, cursor: 'pointer' }}>Contact</span>
          </div>
        </div>
      </footer>
    </>
  );
}
