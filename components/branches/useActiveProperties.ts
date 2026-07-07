'use client';
// components/branches/useActiveProperties.ts
// Shared client hook: one live subscription to active listings, plus a helper
// that picks a real property photo for a branch (area match first, then any
// photo from the same city). Used so branch cards + heroes show genuine
// property pictures instead of stock/brand imagery.
import { useEffect, useState } from 'react';
import { subscribeToProperties } from '@/services/property';
import { Property } from '@/lib/types';
import { Branch, listingMatchesBranch, listingMatchesCity } from '@/lib/branches';

const EMPTY_FILTERS = { location: '', minPrice: '' as const, maxPrice: '' as const, bedrooms: '' as const };

export function useActiveProperties() {
  const [props, setProps] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeToProperties(EMPTY_FILTERS, (p) => {
      setProps(p);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return { props, loading };
}

// Returns the first available property photo for a branch, or null if the whole
// city has no photographed listings yet (caller falls back to a brand image).
export function pickBranchImage(props: Property[], branch: Branch): string | null {
  const area = props.find((p) => p.images?.[0] && listingMatchesBranch(p.location, branch));
  if (area) return area.images[0];
  const city = props.find((p) => p.images?.[0] && listingMatchesCity(p.location, branch.city));
  return city ? city.images![0] : null;
}
