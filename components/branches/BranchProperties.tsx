'use client';
// components/branches/BranchProperties.tsx
// Live "properties to rent in <area>" grid for a branch page. Subscribes to the
// active listings and filters them to the branch's area (falling back to a
// city-wide match when the specific area has nothing live yet, so the section
// is never empty while inventory is thin).
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import PropertyCard from '@/components/property/PropertyCard';
import { subscribeToProperties } from '@/services/property';
import { Property } from '@/lib/types';
import {
  Branch,
  listingMatchesBranch,
  listingMatchesCity,
} from '@/lib/branches';

const EMPTY_FILTERS = { location: '', minPrice: '' as const, maxPrice: '' as const, bedrooms: '' as const };

export default function BranchProperties({ branch }: { branch: Branch }) {
  const [all, setAll] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeToProperties(EMPTY_FILTERS, (props) => {
      setAll(props);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const { list, scope } = useMemo(() => {
    const inArea = all.filter((p) => listingMatchesBranch(p.location, branch));
    if (inArea.length > 0) return { list: inArea, scope: 'area' as const };
    const inCity = all.filter((p) => listingMatchesCity(p.location, branch.city));
    return { list: inCity, scope: 'city' as const };
  }, [all, branch]);

  return (
    <div>
      {!loading && list.length > 0 && (
        <p style={{ fontSize: 14, color: 'var(--gray-600)', marginBottom: 22, fontWeight: 500 }}>
          {scope === 'area'
            ? `Showing ${list.length} available propert${list.length !== 1 ? 'ies' : 'y'} to rent in ${branch.name}.`
            : `No live listings in ${branch.name} right now — here’s what’s available to rent across ${branch.city}.`}
        </p>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <div className="spinner" />
        </div>
      ) : list.length === 0 ? (
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
            New {branch.name} homes coming soon
          </h3>
          <p style={{ color: 'var(--gray-600)', fontSize: 15, marginBottom: 22 }}>
            We let new {branch.name} properties every week. Register your details and we’ll alert you the moment
            something matches.
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
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill,minmax(290px,1fr))',
              gap: 22,
            }}
          >
            {list.slice(0, 9).map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <Link
              href={`/listings?location=${encodeURIComponent(branch.name)}`}
              className="hol-branch-btn hol-branch-btn--navy"
            >
              See all {branch.name} properties →
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
