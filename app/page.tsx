'use client';
// app/page.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import PropertyCard from '@/components/property/PropertyCard';
import { getProperties } from '@/services/property';
import { Property } from '@/lib/types';
import ValuationCard from '@/components/ValuationCard';

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
        minHeight: '100vh', background: 'var(--black)',
        position: 'relative', display: 'flex', alignItems: 'center', padding: '68px 5% 0',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'url(https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1800&q=80) center/cover no-repeat',
          opacity: 0.25,
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg,rgba(10,10,10,0.88) 0%,rgba(10,10,10,0.45) 100%)',
        }} />

        <div style={{ position: 'relative', maxWidth: 700 }}>
          <span style={{
            display: 'inline-block', background: 'var(--red)', color: '#fff',
            fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase',
            padding: '6px 14px', borderRadius: 2, marginBottom: 28,
          }}>
            No Agency Fees — Direct from Landlords
          </span>

          <h1 style={{
            fontFamily: 'var(--font-serif)', fontSize: 'clamp(42px,6vw,80px)',
            fontWeight: 700, color: '#fff', lineHeight: 1.05, letterSpacing: '-1px', marginBottom: 22,
          }}>
            Find Your Next{' '}
            <span style={{ color: 'var(--red)' }}>Home.</span>
            <br />Or Let It Faster.
          </h1>

          <p style={{
            fontSize: 18, color: 'rgba(255,255,255,0.65)', lineHeight: 1.65,
            maxWidth: 520, marginBottom: 44, fontWeight: 300,
          }}>
            The UK's premier direct rental platform. Landlords list properties,
            tenants find homes — no agency fees, no middlemen, no nonsense.
          </p>

          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <Link href="/listings" style={{
              padding: '16px 36px', background: 'var(--red)', color: '#fff', border: 'none',
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
          </div>
        </div>

        {/* Stats */}
        <div style={{
          position: 'absolute', bottom: 60, right: '5%',
          display: 'flex', gap: 40,
        }}>
          {[
            { num: '12,400+', label: 'Properties Listed' },
            { num: '98%', label: 'Landlord Satisfaction' },
            { num: '£0', label: 'Agency Fees' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 36, fontWeight: 700, color: '#fff' }}>
                {s.num}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', letterSpacing: 1, textTransform: 'uppercase' }}>
                {s.label}
              </div>
            </div>
          ))}
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
            {['Privacy', 'Terms', 'Contact'].map(l => (
              <span key={l} style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, cursor: 'pointer' }}>{l}</span>
            ))}
          </div>
        </div>
      </footer>
    </>
  );
}
