'use client';
// components/branches/CityProperties.tsx
// "Latest properties to rent in <City>" grid for a branch office page.
// Subscribes to live listings and shows the newest homes anywhere in that
// city (the office serves the whole city, not one neighbourhood).
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import PropertyCard from '@/components/property/PropertyCard';
import { subscribeToProperties } from '@/services/property';
import { Property } from '@/lib/types';
import { City, listingMatchesCity } from '@/lib/branches';

const EMPTY_FILTERS = { location: '', minPrice: '' as const, maxPrice: '' as const, bedrooms: '' as const };

export default function CityProperties({ city }: { city: City }) {
  const [all, setAll] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeToProperties(EMPTY_FILTERS, (props) => {
      setAll(props);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const list = useMemo(
    () => all.filter((p) => listingMatchesCity(p.location, city)),
    [all, city]
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (list.length === 0) {
    return (
      <div
        style={{
          background: '#fff',
          border: '1px solid var(--gray-200)',
          borderRadius: 12,
          padding: '48px 32px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 44, marginBottom: 12 }}>🏠</div>
        <h3 style={{ fontFamily: "'Poppins',sans-serif", fontSize: 22, marginBottom: 8, color: 'var(--navy)' }}>
          New {city} homes coming soon
        </h3>
        <p style={{ color: 'var(--gray-600)', fontSize: 15, marginBottom: 22 }}>
          We let new {city} properties every week. Register your details and we’ll alert you the moment something matches.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/listings" className="hol-branch-btn hol-branch-btn--navy">
            Browse all properties
          </Link>
          <Link href="/tenant-application" className="hol-branch-btn hol-branch-btn--outline">
            Register with us
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(290px,1fr))', gap: 22 }}>
        {list.slice(0, 6).map((p) => (
          <PropertyCard key={p.id} property={p} />
        ))}
      </div>
      <div style={{ textAlign: 'center', marginTop: 32 }}>
        <Link
          href={`/listings?location=${encodeURIComponent(city)}`}
          className="hol-branch-btn hol-branch-btn--navy"
        >
          See all {city} properties →
        </Link>
      </div>
    </>
  );
}
