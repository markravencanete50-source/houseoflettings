'use client';
// app/listings/page.tsx
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import PropertyCard from '@/components/property/PropertyCard';
import { subscribeToProperties } from '@/services/property';
import { Property, SearchFilters } from '@/lib/types';

function ListingsContent() {
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<SearchFilters>({
    location: searchParams.get('location') || '',
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : '',
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : '',
    bedrooms: searchParams.get('bedrooms') ? Number(searchParams.get('bedrooms')) : '',
  });

  const [appliedFilters, setAppliedFilters] = useState<SearchFilters>(filters);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToProperties(appliedFilters, (props) => {
      setProperties(props);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [appliedFilters]);

  const applyFilters = () => setAppliedFilters({ ...filters });

  const clearFilters = () => {
    const empty: SearchFilters = { location: '', minPrice: '', maxPrice: '', bedrooms: '' };
    setFilters(empty);
    setAppliedFilters(empty);
  };

  const hasActiveFilters = filters.location || filters.minPrice !== '' || filters.maxPrice !== '' || filters.bedrooms !== '';

  return (
    <div style={{ paddingTop: 68, minHeight: '100vh', background: 'var(--gray-100)' }}>
      {/* ── Page Header ── */}
      <div style={{ background: 'var(--black)', padding: '48px 5% 40px' }}>
        <h1 style={{
          fontFamily: 'var(--font-serif)', fontSize: 'clamp(32px,4vw,52px)',
          fontWeight: 700, color: '#fff', marginBottom: 8,
        }}>
          Browse Properties
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16, fontWeight: 300 }}>
          Direct from landlords — no agency fees
        </p>
      </div>

      {/* ── Filters ── */}
      <div style={{ background: '#fff', borderBottom: '1px solid var(--gray-200)', padding: '20px 5%' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label className="form-label">Location</label>
            <input
              className="form-input"
              style={{ width: 220 }}
              value={filters.location}
              onChange={e => setFilters(f => ({ ...f, location: e.target.value }))}
              placeholder="City, area or postcode…"
              onKeyDown={e => e.key === 'Enter' && applyFilters()}
            />
          </div>
          <div>
            <label className="form-label">Min Price</label>
            <select className="form-select" style={{ width: 130 }}
              value={filters.minPrice} onChange={e => setFilters(f => ({ ...f, minPrice: e.target.value ? Number(e.target.value) : '' }))}>
              <option value="">No min</option>
              {[500, 800, 1000, 1500, 2000, 3000].map(v => <option key={v} value={v}>£{v.toLocaleString()}/mo</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Max Price</label>
            <select className="form-select" style={{ width: 130 }}
              value={filters.maxPrice} onChange={e => setFilters(f => ({ ...f, maxPrice: e.target.value ? Number(e.target.value) : '' }))}>
              <option value="">No max</option>
              {[1000, 1500, 2000, 3000, 5000].map(v => <option key={v} value={v}>£{v.toLocaleString()}/mo</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Bedrooms</label>
            <select className="form-select" style={{ width: 120 }}
              value={filters.bedrooms} onChange={e => setFilters(f => ({ ...f, bedrooms: e.target.value ? Number(e.target.value) : '' }))}>
              <option value="">Any</option>
              <option value="0">Studio</option>
              <option value="1">1+</option>
              <option value="2">2+</option>
              <option value="3">3+</option>
              <option value="4">4+</option>
            </select>
          </div>
          <button onClick={applyFilters} style={{
            padding: '12px 24px', background: 'var(--black)', color: '#fff',
            border: 'none', borderRadius: 4, fontSize: 13, fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.5px', cursor: 'pointer',
          }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--red)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--black)')}
          >
            Apply
          </button>
          {hasActiveFilters && (
            <button onClick={clearFilters} style={{
              padding: '12px 20px', background: 'transparent', color: 'var(--gray-600)',
              border: '1px solid var(--gray-200)', borderRadius: 4, fontSize: 13,
              fontWeight: 500, cursor: 'pointer',
            }}>
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* ── Results ── */}
      <div style={{ padding: '32px 5%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <p style={{ fontSize: 14, color: 'var(--gray-600)', fontWeight: 500 }}>
            {loading ? 'Loading…' : `Showing ${properties.length} propert${properties.length !== 1 ? 'ies' : 'y'}`}
          </p>
        </div>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <div className="spinner" />
          </div>
        ) : properties.length === 0 ? (
          <div style={{
            background: '#fff', border: '1px solid var(--gray-200)', borderRadius: 8,
            padding: '80px 40px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🏘</div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, marginBottom: 10 }}>No properties found</h3>
            <p style={{ color: 'var(--gray-400)', fontSize: 15, marginBottom: 24 }}>
              Try adjusting your filters or search in a different area.
            </p>
            <button onClick={clearFilters} style={{
              padding: '12px 24px', background: 'var(--red)', color: '#fff',
              border: 'none', borderRadius: 4, fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}>
              Clear Filters
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 24 }}>
            {properties.map(p => <PropertyCard key={p.id} property={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ListingsPage() {
  return (
    <>
      <Navbar />
      <Suspense fallback={<div style={{ paddingTop: 68 }}>Loading...</div>}>
        <ListingsContent />
      </Suspense>
    </>
  );
}