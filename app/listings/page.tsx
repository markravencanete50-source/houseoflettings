'use client';
// app/listings/page.tsx
import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import PropertyCard from '@/components/property/PropertyCard';
import { subscribeToProperties } from '@/services/property';
import { Property, SearchFilters } from '@/lib/types';
import { loadGoogleMaps, geocodeQuery, haversineMiles } from '@/lib/geo';

type ScoredProperty = Property & { _distanceMiles?: number };

const RADIUS_OPTIONS = [1, 3, 5, 10, 15, 20, 30];

function ListingsContent() {
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<SearchFilters>({
    location: searchParams.get('location') || '',
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : '',
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : '',
    bedrooms: searchParams.get('bedrooms') ? Number(searchParams.get('bedrooms')) : '',
    bathrooms: searchParams.get('bathrooms') ? Number(searchParams.get('bathrooms')) : '',
    propertyType: (searchParams.get('propertyType') as SearchFilters['propertyType']) || '',
    furnished: (searchParams.get('furnished') as SearchFilters['furnished']) || '',
    radiusMiles: searchParams.get('radiusMiles') ? Number(searchParams.get('radiusMiles')) : '',
    lat: null,
    lng: null,
  });

  const [appliedFilters, setAppliedFilters] = useState<SearchFilters>(filters);
  const [rawProperties, setRawProperties] = useState<Property[]>([]);
  const [displayProperties, setDisplayProperties] = useState<ScoredProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [geocoding, setGeocoding] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [mapsReady, setMapsReady] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [resolving, setResolving] = useState(false);

  const locInputRef = useRef<HTMLInputElement>(null);

  // ── Google Places autocomplete on the location field (captures coordinates
  //    so we can offer a "within X miles" radius search). Degrades to a plain
  //    text field if Maps can't load. ──
  useEffect(() => {
    let ac: any = null;
    let listener: any = null;
    let cancelled = false;
    loadGoogleMaps().then((ok) => {
      if (!ok || cancelled || !locInputRef.current) return;
      setMapsReady(true);
      const google = (window as any).google;
      ac = new google.maps.places.Autocomplete(locInputRef.current, {
        types: ['geocode'],
        componentRestrictions: { country: 'gb' },
        fields: ['geometry', 'name', 'formatted_address'],
      });
      listener = ac.addListener('place_changed', () => {
        const place = ac.getPlace();
        const loc = place?.geometry?.location;
        const label = place?.name || place?.formatted_address || locInputRef.current?.value || '';
        setFilters((f) => ({
          ...f,
          location: label,
          lat: loc ? loc.lat() : null,
          lng: loc ? loc.lng() : null,
        }));
      });
    });
    return () => {
      cancelled = true;
      if (listener && (window as any).google) (window as any).google.maps.event.removeListener(listener);
    };
  }, []);

  // Shareable links: if the URL provided a location + radius, resolve the
  // location to coordinates once on mount so the radius search auto-applies.
  useEffect(() => {
    if (filters.location && filters.radiusMiles !== '' && filters.radiusMiles != null && filters.lat == null) {
      geocodeQuery(filters.location).then((c) => {
        if (!c) return;
        setFilters((f) => ({ ...f, lat: c.lat, lng: c.lng }));
        setAppliedFilters((f) => ({ ...f, lat: c.lat, lng: c.lng }));
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Realtime, synchronously-filtered results from Firestore ──
  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToProperties(appliedFilters, (props) => {
      setRawProperties(props);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [appliedFilters]);

  // ── Radius post-filter: geocode each result and keep those within range,
  //    sorted by distance. Runs whenever results or the applied radius change. ──
  useEffect(() => {
    const useRadius =
      appliedFilters.radiusMiles !== '' && appliedFilters.radiusMiles != null &&
      appliedFilters.lat != null && appliedFilters.lng != null;

    if (!useRadius) {
      setDisplayProperties(rawProperties);
      setGeocoding(false);
      return;
    }

    let cancelled = false;
    setGeocoding(true);
    (async () => {
      const origin = { lat: appliedFilters.lat as number, lng: appliedFilters.lng as number };
      const radius = Number(appliedFilters.radiusMiles);
      const out: ScoredProperty[] = [];
      for (const p of rawProperties) {
        if (cancelled) return;
        const coords = await geocodeQuery(p.location);
        if (!coords) continue; // can't place it → leave out of radius results
        const d = haversineMiles(origin, coords);
        if (d <= radius) out.push({ ...p, _distanceMiles: d });
      }
      if (cancelled) return;
      out.sort((a, b) => (a._distanceMiles ?? 0) - (b._distanceMiles ?? 0));
      setDisplayProperties(out);
      setGeocoding(false);
    })();
    return () => { cancelled = true; };
  }, [rawProperties, appliedFilters]);

  // Applying a radius needs a centre point. If the shopper picked a suggestion
  // we already have coordinates; otherwise we geocode whatever postcode/town they
  // typed so the distance is accurate. An empty box prompts for their postcode.
  const applyFilters = async () => {
    setGeoError('');
    const wantsRadius = filters.radiusMiles !== '' && filters.radiusMiles != null;
    if (wantsRadius && filters.lat == null) {
      const q = filters.location.trim();
      if (!q) {
        setGeoError('Enter your postcode to search within a set distance.');
        locInputRef.current?.focus();
        return;
      }
      setResolving(true);
      const c = await geocodeQuery(q);
      setResolving(false);
      if (c) {
        const next = { ...filters, lat: c.lat, lng: c.lng };
        setFilters(next);
        setAppliedFilters(next);
        return;
      }
      setGeoError('We could not find that postcode, so we searched by name instead.');
    }
    setAppliedFilters({ ...filters });
  };

  const clearFilters = () => {
    const empty: SearchFilters = {
      location: '', minPrice: '', maxPrice: '', bedrooms: '',
      bathrooms: '', propertyType: '', furnished: '', radiusMiles: '', lat: null, lng: null,
    };
    setFilters(empty);
    setAppliedFilters(empty);
    setGeoError('');
  };

  const num = (v: string) => (v ? Number(v) : '');
  const set = (patch: Partial<SearchFilters>) => setFilters((f) => ({ ...f, ...patch }));

  const hasActiveFilters =
    !!filters.location || filters.minPrice !== '' || filters.maxPrice !== '' ||
    filters.bedrooms !== '' || filters.bathrooms !== '' ||
    !!filters.propertyType || !!filters.furnished || filters.radiusMiles !== '';

  const radiusActive =
    appliedFilters.radiusMiles !== '' && appliedFilters.radiusMiles != null &&
    appliedFilters.lat != null && appliedFilters.lng != null;
  const radiusSelected =
    filters.radiusMiles !== '' && filters.radiusMiles != null;

  const busy = loading || geocoding;
  const count = displayProperties.length;

  return (
    <div style={{ paddingTop: 68, minHeight: '100vh', background: 'var(--gray-100)' }}>
      <style>{`
        .pac-container { z-index: 100000 !important; }
        .lst-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:12px; }
        .lst-grid .form-input, .lst-grid .form-select { width:100%; box-sizing:border-box; }
        .lst-field { display:flex; flex-direction:column; gap:6px; min-width:0; }
        .lst-field--wide { grid-column:span 2; }
        .lst-actions { display:flex; gap:12px; flex-wrap:wrap; align-items:center; margin-top:16px; }
        /* Site-standard CTA size (as components/layout/ServiceHero.module.css .btn).
           The transparent border keeps apply/ghost exactly the same height. */
        .lst-btn { display:inline-flex; align-items:center; justify-content:center; gap:9px;
          box-sizing:border-box; min-height:48px; line-height:1.2;
          padding:14px 28px; border:1.5px solid transparent; border-radius:9px;
          font-size:13.5px; font-weight:700;
          text-transform:uppercase; letter-spacing:.02em; cursor:pointer; }
        .lst-btn--apply { background:var(--black); color:#fff; transition:background .2s; }
        .lst-btn--apply:hover { background:var(--red); }
        .lst-btn--ghost { background:transparent; color:var(--gray-600); border-color:var(--gray-200); }
        .lst-more { background:none; border:none; color:var(--red); font-size:13px; font-weight:600;
          cursor:pointer; display:inline-flex; align-items:center; gap:6px; padding:12px 4px; }
        .lst-hint { font-size:12px; color:var(--gray-400); margin-top:4px; }
        @media(max-width:560px){ .lst-field--wide{ grid-column:1 / -1; } .lst-btn, .lst-more { width:100%; justify-content:center; } }
      `}</style>

      {/* ── Page Header ── */}
      <div style={{ background: 'var(--black)', padding: '48px 5% 40px' }}>
        <h1 style={{
          fontFamily: 'var(--font-serif)', fontSize: 'clamp(32px,4vw,52px)',
          fontWeight: 700, color: '#fff', marginBottom: 8,
        }}>
          Browse Properties
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16, fontWeight: 300 }}>
          Direct from landlords, no agency fees
        </p>
      </div>

      {/* ── Filters ── */}
      <div style={{ background: '#fff', borderBottom: '1px solid var(--gray-200)', padding: '20px 5%' }}>
        <div className="lst-grid">
          {/* Location + radius */}
          <div className="lst-field lst-field--wide">
            <label className="form-label">{radiusSelected ? 'Your postcode' : 'Location'}</label>
            <input
              ref={locInputRef}
              className="form-input"
              value={filters.location}
              onChange={e => { set({ location: e.target.value, lat: null, lng: null }); setGeoError(''); }}
              placeholder={radiusSelected ? 'Enter your postcode, e.g. LS10' : 'City, area or postcode…'}
              autoComplete="off"
              onKeyDown={e => { if (e.key === 'Enter') applyFilters(); }}
            />
            {geoError
              ? <span className="lst-hint" style={{ color: '#b45309' }}>{geoError}</span>
              : radiusSelected && (
                <span className="lst-hint">
                  {filters.lat != null
                    ? 'Distance is measured from this postcode.'
                    : 'We use your postcode as the centre of the radius for accurate results.'}
                </span>
              )}
          </div>
          <div className="lst-field">
            <label className="form-label">Search radius</label>
            <select className="form-select"
              value={filters.radiusMiles as any}
              onChange={e => {
                const v = num(e.target.value);
                set({ radiusMiles: v });
                setGeoError('');
                // Prompt for the postcode as soon as a distance is chosen.
                if (v !== '' && !filters.location.trim()) setTimeout(() => locInputRef.current?.focus(), 0);
              }}>
              <option value="">This area only</option>
              {RADIUS_OPTIONS.map(m => <option key={m} value={m}>Within {m} mile{m > 1 ? 's' : ''}</option>)}
            </select>
          </div>

          {/* Price */}
          <div className="lst-field">
            <label className="form-label">Min price</label>
            <select className="form-select"
              value={filters.minPrice as any}
              onChange={e => set({ minPrice: num(e.target.value) })}>
              <option value="">No min</option>
              {[500, 800, 1000, 1500, 2000, 3000].map(v => <option key={v} value={v}>£{v.toLocaleString()}/mo</option>)}
            </select>
          </div>
          <div className="lst-field">
            <label className="form-label">Max price</label>
            <select className="form-select"
              value={filters.maxPrice as any}
              onChange={e => set({ maxPrice: num(e.target.value) })}>
              <option value="">No max</option>
              {[1000, 1500, 2000, 3000, 5000].map(v => <option key={v} value={v}>£{v.toLocaleString()}/mo</option>)}
            </select>
          </div>

          {/* Bedrooms + bathrooms (exact count) */}
          <div className="lst-field">
            <label className="form-label">Bedrooms</label>
            <select className="form-select"
              value={filters.bedrooms as any}
              onChange={e => set({ bedrooms: num(e.target.value) })}>
              <option value="">Any</option>
              <option value="0">Studio</option>
              {[1, 2, 3, 4, 5].map(v => <option key={v} value={v}>{v}</option>)}
              <option value="6">6+</option>
            </select>
          </div>
          <div className="lst-field">
            <label className="form-label">Bathrooms</label>
            <select className="form-select"
              value={filters.bathrooms as any}
              onChange={e => set({ bathrooms: num(e.target.value) })}>
              <option value="">Any</option>
              {[1, 2, 3, 4, 5].map(v => <option key={v} value={v}>{v}</option>)}
              <option value="6">6+</option>
            </select>
          </div>
        </div>

        {/* More filters */}
        {showMore && (
          <div className="lst-grid" style={{ marginTop: 12 }}>
            <div className="lst-field">
              <label className="form-label">Property type</label>
              <select className="form-select"
                value={filters.propertyType || ''}
                onChange={e => set({ propertyType: e.target.value as SearchFilters['propertyType'] })}>
                <option value="">Any</option>
                <option value="whole">Whole property</option>
                <option value="room">Room only</option>
              </select>
            </div>
            <div className="lst-field">
              <label className="form-label">Furnishing</label>
              <select className="form-select"
                value={filters.furnished || ''}
                onChange={e => set({ furnished: e.target.value as SearchFilters['furnished'] })}>
                <option value="">Any</option>
                <option value="furnished">Furnished</option>
                <option value="unfurnished">Unfurnished</option>
                <option value="part-furnished">Part furnished</option>
              </select>
            </div>
          </div>
        )}

        <div className="lst-actions">
          <button className="lst-btn lst-btn--apply" onClick={applyFilters} disabled={resolving}>
            {resolving ? 'Locating…' : 'Apply Filters'}
          </button>
          <button className="lst-more" onClick={() => setShowMore(s => !s)}>
            {showMore ? 'Fewer filters' : 'More filters'}
            <span style={{ display: 'inline-block', transform: showMore ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}>▾</span>
          </button>
          {hasActiveFilters && (
            <button className="lst-btn lst-btn--ghost" onClick={clearFilters}>Clear All</button>
          )}
        </div>
      </div>

      {/* ── Results ── */}
      <div style={{ padding: '32px 5%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, gap: 12, flexWrap: 'wrap' }}>
          <p style={{ fontSize: 14, color: 'var(--gray-600)', fontWeight: 500 }}>
            {busy
              ? (geocoding ? 'Finding properties near you…' : 'Loading…')
              : `Showing ${count} propert${count !== 1 ? 'ies' : 'y'}`}
            {!busy && radiusActive && appliedFilters.location && (
              <span style={{ color: 'var(--gray-400)' }}>
                {' '}within {appliedFilters.radiusMiles} mile{Number(appliedFilters.radiusMiles) > 1 ? 's' : ''} of {appliedFilters.location}
              </span>
            )}
          </p>
        </div>
        {busy ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <div className="spinner" />
          </div>
        ) : count === 0 ? (
          <div style={{
            background: '#fff', border: '1px solid var(--gray-200)', borderRadius: 8,
            padding: '80px 40px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🏘</div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, marginBottom: 10 }}>No properties found</h3>
            <p style={{ color: 'var(--gray-400)', fontSize: 15, marginBottom: 24 }}>
              {radiusActive
                ? 'Nothing within that distance. Try widening the radius or adjusting your filters.'
                : 'Try adjusting your filters or search in a different area.'}
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
            {displayProperties.map(p => (
              <PropertyCard key={p.id} property={p} distanceMiles={p._distanceMiles} />
            ))}
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
