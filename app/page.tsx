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

// ── GALLERY DATA ──────────────────────────────────────────────────────────────
const GALLERY_ITEMS = [
  { img: '/images/agent-photo.jpeg',      label: 'Leeds & Manchester Experts',   sub: 'Local knowledge, professional service.' },
  { img: '/images/brand-desk.jpeg',       label: 'We Handle the Details.',       sub: 'You enjoy the returns.' },
  { img: '/images/service-compare.png',   label: 'Full Lettings & Management',   sub: 'AI-powered system, expert team.' },
  { img: '/images/landlord-app.png',      label: 'Everything You Need',          sub: 'To succeed as a landlord.' },
  { img: '/images/compliance.jpeg',       label: 'Stay Fully Compliant',         sub: 'We track the rules so you don\'t have to.' },
  { img: '/images/tenant-pressure.jpeg',  label: 'Tenant Pressure? We Handle It.', sub: 'Smart landlords choose professional management.' },
];

// ── SERVICES DATA ─────────────────────────────────────────────────────────────
const SERVICES = [
  {
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>
        <path d="M9 21V12h6v9"/>
      </svg>
    ),
    tag: 'Landlords',
    title: 'For Landlords',
    desc: 'Renting your property should feel straightforward. Our service keeps the process clear with transparent pricing — from free tools to low-cost packages including advertising, enquiry handling, and professional tenancy setup.',
    href: '/pricing',
  },
  {
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/>
      </svg>
    ),
    tag: 'Tenants',
    title: 'For Tenants',
    desc: 'Finding your next home should be straightforward, safe, and comfortable. We offer flexible search options — pet-friendly, student accommodation, and properties for all lifestyles. No pressure, no unnecessary office visits.',
    href: '/listings',
  },
  {
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
      </svg>
    ),
    tag: 'Management',
    title: 'Property Management',
    desc: 'From accurate valuations and professional photography to comprehensive tenant screening and 12-month guarantee insurance, we ensure your property is in the best hands at every stage.',
    href: '/pricing',
  },
];

// ── ABOUT FEATURES ────────────────────────────────────────────────────────────
const ABOUT_FEATURES = [
  'Local + global expertise', 'Deep market insights',
  'Exceptional client support', 'Premium properties',
  'Expert marketing', 'Transparent service',
];

// ── STATS ─────────────────────────────────────────────────────────────────────
const STATS = [
  { number: '150+', label: 'Years Combined Experience' },
  { number: '2018', label: 'Founded' },
  { number: '4.5★', label: 'Customer Rating' },
  { number: '3',    label: 'Generations of Expertise' },
];

// ── HOW IT WORKS ──────────────────────────────────────────────────────────────
const HOW_IT_WORKS = [
  {
    role: 'For Landlords',
    steps: [
      { n: 1, title: 'Create your account',  desc: 'Sign up as a landlord in under 2 minutes. No setup fees.' },
      { n: 2, title: 'List your property',   desc: 'Add photos, set your rent, describe your home. It goes live instantly.' },
      { n: 3, title: 'Receive enquiries',    desc: 'Tenants message you directly. No middlemen, no commission.' },
      { n: 4, title: 'Find your tenant',     desc: 'Choose who you let to. Full control at every step.' },
    ],
  },
  {
    role: 'For Tenants',
    steps: [
      { n: 1, title: 'Search & filter',      desc: 'Browse by location, price, bedrooms. Find homes that fit your life.' },
      { n: 2, title: 'View details',         desc: 'See all photos, features, and availability at a glance.' },
      { n: 3, title: 'Message landlord',     desc: 'Contact landlords directly. No agency gatekeeping.' },
      { n: 4, title: 'Secure your home',     desc: 'Agree terms directly with the landlord. Zero agency fees.' },
    ],
  },
];

// ── GALLERY COMPONENT ─────────────────────────────────────────────────────────
function ImageGallery() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive]       = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX]       = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [lightbox, setLightbox]   = useState<number | null>(null);

  const scrollToIndex = (i: number) => {
    if (!trackRef.current) return;
    const card = trackRef.current.children[i] as HTMLElement;
    if (!card) return;
    trackRef.current.scrollTo({ left: card.offsetLeft - 20, behavior: 'smooth' });
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
    trackRef.current.scrollLeft = scrollLeft - (e.pageX - (trackRef.current.offsetLeft ?? 0) - startX);
  };
  const onMouseUp = () => setIsDragging(false);

  return (
    <section style={{ padding: '80px 0', background: '#fff', overflow: 'hidden' }}>
      <style>{`
        .hol-track::-webkit-scrollbar { display:none; }
        .hol-track { -ms-overflow-style:none; scrollbar-width:none; }
        .hol-card  { transition: transform 0.3s ease, box-shadow 0.3s ease; }
        .hol-card:hover { transform: translateY(-6px); box-shadow: 0 24px 60px rgba(45,27,105,0.18) !important; }
        .hol-card:hover .hol-overlay { opacity:1 !important; }
        .hol-card:hover .hol-label   { transform:translateY(0) !important; opacity:1 !important; }
        .hol-dot { transition: all 0.2s ease; cursor:pointer; border:none; padding:0; background:none; }
        .hol-lb { position:fixed; inset:0; background:rgba(0,0,0,0.92); z-index:9999; display:flex; align-items:center; justify-content:center; animation:hol-in 0.2s ease; }
        @keyframes hol-in { from{opacity:0} to{opacity:1} }
        .hol-lb img { max-width:90vw; max-height:85vh; object-fit:contain; border-radius:10px; box-shadow:0 32px 80px rgba(0,0,0,0.6); }
        .hol-lb-close { position:absolute; top:20px; right:24px; color:#fff; font-size:34px; cursor:pointer; background:none; border:none; opacity:0.8; transition:opacity 0.2s; line-height:1; }
        .hol-lb-close:hover { opacity:1; }
        .hol-lb-arrow { position:absolute; top:50%; transform:translateY(-50%); color:#fff; font-size:32px; cursor:pointer; background:rgba(255,255,255,0.1); border:none; border-radius:50%; width:50px; height:50px; display:flex; align-items:center; justify-content:center; transition:background 0.2s; }
        .hol-lb-arrow:hover { background:rgba(255,255,255,0.22); }
        .hol-lb-prev { left:16px; } .hol-lb-next { right:16px; }
        .hol-lb-cap { position:absolute; bottom:20px; left:50%; transform:translateX(-50%); color:#fff; font-size:14px; font-weight:600; text-align:center; white-space:nowrap; }
      `}</style>

      {lightbox !== null && (
        <div className="hol-lb" onClick={() => setLightbox(null)}>
          <button className="hol-lb-close" onClick={() => setLightbox(null)}>✕</button>
          <button className="hol-lb-arrow hol-lb-prev" onClick={e => { e.stopPropagation(); setLightbox((lightbox - 1 + GALLERY_ITEMS.length) % GALLERY_ITEMS.length); }}>‹</button>
          <img src={GALLERY_ITEMS[lightbox].img} alt={GALLERY_ITEMS[lightbox].label} onClick={e => e.stopPropagation()} />
          <button className="hol-lb-arrow hol-lb-next" onClick={e => { e.stopPropagation(); setLightbox((lightbox + 1) % GALLERY_ITEMS.length); }}>›</button>
          <div className="hol-lb-cap">{GALLERY_ITEMS[lightbox].label}</div>
        </div>
      )}

      <div style={{ padding: '0 5%', marginBottom: 40 }}>
        <p className="section-label">Properties We Love</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
          <h2 style={{ margin: 0 }}>Homes That Inspire</h2>
          <p style={{ fontSize: 15, color: 'var(--gray-500)', maxWidth: 360, lineHeight: 1.65, margin: 0, fontWeight: 400 }}>
            From compact city flats to countryside homes — every property listed directly by landlords across the UK.
          </p>
        </div>
      </div>

      <div
        ref={trackRef}
        className="hol-track"
        onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
        style={{ display: 'flex', gap: 16, padding: '8px 5% 16px', overflowX: 'auto', cursor: isDragging ? 'grabbing' : 'grab', userSelect: 'none' }}
      >
        {GALLERY_ITEMS.map((item, i) => (
          <div
            key={i}
            className="hol-card"
            onClick={() => { setActive(i); setLightbox(i); }}
            style={{
              flexShrink: 0,
              width: i % 3 === 0 ? 340 : 260,
              height: 380,
              borderRadius: 14,
              overflow: 'hidden',
              position: 'relative',
              boxShadow: active === i ? '0 20px 50px rgba(45,27,105,0.22)' : '0 6px 24px rgba(45,27,105,0.08)',
              cursor: 'pointer',
              outline: active === i ? '2.5px solid var(--teal)' : '2px solid transparent',
              outlineOffset: 3,
            }}
          >
            <img src={item.img} alt={item.label} draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            <div className="hol-overlay" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(30,16,71,0.88) 0%, rgba(30,16,71,0.1) 55%, transparent 100%)', opacity: active === i ? 1 : 0.65, transition: 'opacity 0.3s' }} />
            <div className="hol-label" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '18px 18px 20px', transform: active === i ? 'translateY(0)' : 'translateY(6px)', opacity: active === i ? 1 : 0.8, transition: 'all 0.3s' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 3, fontFamily: 'var(--font-sans)' }}>{item.label}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{item.sub}</div>
            </div>
            {active === i && (
              <div style={{ position: 'absolute', top: 12, right: 12, background: 'var(--teal)', color: '#fff', fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', padding: '4px 10px', borderRadius: 20 }}>Featured</div>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 24, padding: '0 5%' }}>
        {GALLERY_ITEMS.map((_, i) => (
          <button key={i} className="hol-dot" onClick={() => scrollToIndex(i)} aria-label={`Slide ${i + 1}`}
            style={{ width: active === i ? 26 : 8, height: 8, borderRadius: 4, background: active === i ? 'var(--teal)' : 'var(--gray-200)' }} />
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
    if (minPrice)  params.set('minPrice', minPrice);
    if (maxPrice)  params.set('maxPrice', maxPrice);
    if (bedrooms)  params.set('bedrooms', bedrooms);
    router.push(`/listings?${params.toString()}`);
  };

  return (
    <>
      <Navbar />

      {/* ══════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════ */}
      <section style={{
        minHeight: '100vh',
        background: 'var(--navy-dark)',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        padding: 'calc(var(--nav-height) + 40px) 5% 60px',
      }}>
        {/* BG image */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'url(https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1800&q=80) center/cover no-repeat',
          opacity: 0.14,
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, rgba(30,16,71,0.95) 0%, rgba(45,27,105,0.7) 60%, rgba(30,16,71,0.9) 100%)',
        }} />

        <div style={{ position: 'relative', zIndex: 2, maxWidth: 660, width: '100%' }}>
          {/* Logo row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 40 }}>
            <img src="/logo_HOL.png" alt="House of Lettings" style={{ height: 72, width: 'auto' }} />
            <div style={{ lineHeight: 1.2 }}>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.9)', letterSpacing: '2.5px', textTransform: 'uppercase' }}>House of</div>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.9)', letterSpacing: '2.5px', textTransform: 'uppercase' }}>Lettings</div>
            </div>
          </div>

          {/* Headline */}
          <h1 style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'clamp(2rem, 6vw, 3.6rem)',
            fontWeight: 800,
            color: '#fff',
            lineHeight: 1.1,
            letterSpacing: '-0.5px',
            marginBottom: 6,
          }}>
            We Handle the Details.
          </h1>
          <h1 style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'clamp(2rem, 6vw, 3.6rem)',
            fontWeight: 800,
            color: 'var(--teal)',
            lineHeight: 1.1,
            letterSpacing: '-0.5px',
            marginBottom: 28,
          }}>
            You Enjoy the Returns.
          </h1>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
            <div style={{ width: 30, height: 1, background: 'rgba(255,255,255,0.2)' }} />
            <svg width="16" height="16" viewBox="0 0 24 24" fill="rgba(255,255,255,0.4)"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
          </div>

          <p style={{ fontSize: 'clamp(15px,2vw,17px)', color: 'rgba(255,255,255,0.62)', lineHeight: 1.7, maxWidth: 460, marginBottom: 44, fontWeight: 400 }}>
            Property management. Done right.
          </p>

          {/* CTA buttons */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/listings" style={{
              padding: '15px 32px', background: 'var(--teal)', color: '#fff',
              borderRadius: 'var(--radius-md)', fontSize: 14, fontWeight: 700,
              letterSpacing: '0.04em', textTransform: 'uppercase', display: 'inline-block',
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--teal-dark)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--teal)'; (e.currentTarget as HTMLElement).style.transform = 'none'; }}
            >
              Browse Properties
            </Link>
            <Link href="/register" style={{
              padding: '15px 32px', background: 'transparent', color: '#fff',
              border: '2px solid rgba(255,255,255,0.35)', borderRadius: 'var(--radius-md)',
              fontSize: 14, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase',
              display: 'inline-block', transition: 'all 0.2s',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.7)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.35)'; }}
            >
              List Your Property
            </Link>
            <ValuationCard />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          SEARCH BAR
      ══════════════════════════════════════════════════════ */}
      <section style={{ background: 'var(--light-gray)', padding: '40px 5%', borderBottom: '1px solid var(--gray-200)' }}>
        <div className="search-card">
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gray-400)', marginBottom: 18 }}>
            Search Properties
          </p>
          <div className="search-grid">
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
            <div className="search-btn-wrap">
              <button onClick={handleSearch} style={{
                width: '100%', padding: '13px 28px',
                background: 'var(--navy)', color: '#fff', border: 'none',
                borderRadius: 'var(--radius-md)', fontSize: 14, fontWeight: 700,
                cursor: 'pointer', transition: 'background 0.2s', letterSpacing: '0.04em', textTransform: 'uppercase',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--teal)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--navy)'; }}
              >
                Search
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          SERVICES
      ══════════════════════════════════════════════════════ */}
      <section style={{ padding: '80px 5%', background: '#fff' }}>
        <p className="section-label">What We Offer</p>
        <h2 style={{ marginBottom: 12 }}>Helping Landlords &amp; Tenants</h2>
        <p style={{ color: 'var(--gray-500)', fontSize: 15, maxWidth: 520, marginBottom: 48, lineHeight: 1.75 }}>
          Clear communication, verified listings, and professional support at every stage of the letting journey.
        </p>
        <div className="services-grid">
          {SERVICES.map((s, i) => (
            <div key={i} style={{
              background: 'var(--navy-dark)',
              borderRadius: 'var(--radius-lg)',
              padding: '36px 30px',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              transition: 'transform 0.25s ease, box-shadow 0.25s ease',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-5px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 24px 60px rgba(30,16,71,0.25)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
            >
              {/* glow */}
              <div style={{ position: 'absolute', top: 0, right: 0, width: 140, height: 140, background: 'radial-gradient(circle, rgba(0,184,160,0.14) 0%, transparent 70%)', pointerEvents: 'none' }} />
              {/* icon */}
              <div style={{ width: 52, height: 52, background: 'rgba(0,184,160,0.14)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, color: 'var(--teal)', flexShrink: 0 }}>
                {s.icon}
              </div>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--teal)', marginBottom: 8 }}>{s.tag}</p>
              <h3 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 700, marginBottom: 12, lineHeight: 1.3 }}>{s.title}</h3>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.75, marginBottom: 24, flex: 1 }}>{s.desc}</p>
              <Link href={s.href} style={{ fontSize: 13, fontWeight: 700, color: 'var(--teal)', display: 'flex', alignItems: 'center', gap: 6, transition: 'color 0.2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#fff'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--teal)'; }}
              >
                Find out More
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 7h10M8 3l4 4-4 4"/></svg>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          STATS BAND
      ══════════════════════════════════════════════════════ */}
      <div style={{ background: 'var(--navy)', padding: '56px 5%' }}>
        <div className="stats-grid">
          {STATS.map((s, i) => (
            <div key={i}>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: 'clamp(2rem,4vw,2.8rem)', fontWeight: 800, color: 'var(--teal)', lineHeight: 1, marginBottom: 8 }}>{s.number}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', fontWeight: 500, letterSpacing: '0.03em' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          ABOUT US
      ══════════════════════════════════════════════════════ */}
      <section style={{ padding: '80px 5%', background: 'var(--off-white)' }}>
        <div className="about-grid">
          {/* Image */}
          <div style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden', height: 500, position: 'relative', background: 'var(--gray-200)', flexShrink: 0 }}>
            <img
              src="https://houseoflettings.co.uk/wp-content/uploads/2025/11/Depositphotos_491527834_XL-scaled.jpg"
              alt="About House of Lettings"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
            {/* Est. badge */}
            <div style={{ position: 'absolute', bottom: 20, right: 20, background: 'var(--navy-dark)', borderRadius: 12, padding: '14px 20px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: '1.8rem', fontWeight: 800, color: 'var(--teal)', lineHeight: 1 }}>2018</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 4 }}>Est.</div>
            </div>
          </div>

          {/* Text */}
          <div>
            <p className="section-label">About Us</p>
            <h2 style={{ marginBottom: 20 }}>Trusted Experts in UK Property</h2>
            <p style={{ fontSize: 15, color: 'var(--gray-500)', lineHeight: 1.85, marginBottom: 18 }}>
              Founded in 2018, House of Lettings represents over 150 years of combined family experience in the property industry, spanning three generations. Built on a legacy of transparency, trust, and professionalism.
            </p>
            <p style={{ fontSize: 15, color: 'var(--gray-500)', lineHeight: 1.85, marginBottom: 32 }}>
              Whether you're letting, buying, or investing, our team delivers professional guidance and results you can rely on — combining deep market insight with innovative marketing and first-class service.
            </p>

            {/* Feature checkmarks */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px', marginBottom: 36 }}>
              {ABOUT_FEATURES.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, color: 'var(--gray-700)', fontWeight: 500 }}>
                  <span style={{ width: 22, height: 22, background: 'rgba(0,184,160,0.12)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--teal)', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>✓</span>
                  {f}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <Link href="/about" style={{
                padding: '13px 28px', background: 'var(--navy)', color: '#fff',
                borderRadius: 'var(--radius-md)', fontSize: 14, fontWeight: 700,
                display: 'inline-block', transition: 'background 0.2s',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--teal)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--navy)'; }}
              >
                Learn More About Us
              </Link>
              <Link href="/contact" style={{
                padding: '13px 28px', background: 'transparent', color: 'var(--navy)',
                border: '2px solid var(--navy)', borderRadius: 'var(--radius-md)',
                fontSize: 14, fontWeight: 600, display: 'inline-block', transition: 'all 0.2s',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--navy)'; (e.currentTarget as HTMLElement).style.color = '#fff'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--navy)'; }}
              >
                Book a Valuation
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FEATURED LISTINGS
      ══════════════════════════════════════════════════════ */}
      <section style={{ padding: '80px 5%', background: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 48, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <p className="section-label">Latest Listings</p>
            <h2 style={{ margin: 0 }}>Recently Added</h2>
          </div>
          <Link href="/listings" style={{
            padding: '11px 22px', border: '2px solid var(--gray-200)', borderRadius: 'var(--radius-md)',
            fontSize: 13, fontWeight: 600, color: 'var(--navy)', transition: 'all 0.2s',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--navy)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--gray-200)'; }}
          >
            View All →
          </Link>
        </div>

        {featured.length > 0 ? (
          <div className="properties-grid">
            {featured.map(p => <PropertyCard key={p.id} property={p} />)}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--gray-400)' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🏠</div>
            <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--navy)' }}>No properties listed yet.</p>
            <p style={{ fontSize: 14, marginTop: 8, color: 'var(--gray-500)' }}>Be the first to list a property!</p>
            <Link href="/register" style={{
              display: 'inline-block', marginTop: 20, padding: '12px 28px',
              background: 'var(--teal)', color: '#fff', borderRadius: 'var(--radius-md)',
              fontSize: 14, fontWeight: 700,
            }}>
              List Your Property →
            </Link>
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════════════════ */}
      <section style={{ padding: '80px 5%', background: 'var(--light-gray)', borderTop: '1px solid var(--gray-200)' }}>
        <p className="section-label">How It Works</p>
        <h2 style={{ marginBottom: 48 }}>Simple, Direct, Transparent</h2>
        <div className="how-grid">
          {HOW_IT_WORKS.map(col => (
            <div key={col.role}>
              <div style={{
                display: 'inline-block', fontSize: 11, fontWeight: 700,
                letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--navy)',
                marginBottom: 28, paddingBottom: 10,
                borderBottom: '2.5px solid var(--teal)',
              }}>
                {col.role}
              </div>
              {col.steps.map(s => (
                <div key={s.n} style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
                  <div style={{
                    width: 38, height: 38, background: 'var(--navy)', color: '#fff',
                    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 800, flexShrink: 0,
                  }}>
                    {s.n}
                  </div>
                  <div>
                    <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 5, color: 'var(--navy)' }}>{s.title}</h4>
                    <p style={{ fontSize: 14, color: 'var(--gray-500)', lineHeight: 1.65 }}>{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          GALLERY
      ══════════════════════════════════════════════════════ */}
      <ImageGallery />

      {/* ══════════════════════════════════════════════════════
          CTA BANNER
      ══════════════════════════════════════════════════════ */}
      <section style={{ background: 'var(--navy-dark)', padding: '80px 5%' }}>
        <div className="cta-band-inner">
          <div>
            <h2 style={{ color: '#fff', fontSize: 'clamp(1.6rem,3.5vw,2.6rem)', fontWeight: 800, marginBottom: 12, lineHeight: 1.2 }}>
              Ready to find your<br />
              <span style={{ color: 'var(--teal)' }}>perfect home?</span>
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 15, fontWeight: 400 }}>
              Join thousands of landlords and tenants already using House of Lettings.
            </p>
          </div>
          <div className="cta-btns" style={{ display: 'flex', gap: 12, flexShrink: 0 }}>
            <Link href="/register" style={{
              padding: '15px 32px', background: 'var(--teal)', color: '#fff',
              borderRadius: 'var(--radius-md)', fontSize: 14, fontWeight: 700,
              letterSpacing: '0.04em', textTransform: 'uppercase', display: 'inline-block',
              transition: 'background 0.2s',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--teal-dark)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--teal)'; }}
            >
              Get Started Free
            </Link>
            <Link href="/listings" style={{
              padding: '15px 32px', background: 'transparent', color: '#fff',
              border: '2px solid rgba(255,255,255,0.3)', borderRadius: 'var(--radius-md)',
              fontSize: 14, fontWeight: 600, display: 'inline-block', transition: 'border-color 0.2s',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.7)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.3)'; }}
            >
              Browse Listings
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════════ */}
      <footer style={{ background: 'var(--navy-dark)', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '40px 5%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 18, fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 8, height: 8, background: 'var(--teal)', borderRadius: '50%', display: 'inline-block' }} />
            House of Lettings
          </div>
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>
            © {new Date().getFullYear()} House of Lettings Ltd. All rights reserved.
          </p>
          <div style={{ display: 'flex', gap: 24 }}>
            <Link href="/cookie-policy" style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>Cookie Policy</Link>
            <Link href="/terms"         style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>Terms</Link>
            <Link href="/contact"       style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>Contact</Link>
          </div>
        </div>
      </footer>
    </>
  );
}
