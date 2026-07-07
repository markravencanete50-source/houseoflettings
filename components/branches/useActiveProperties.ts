'use client';
// components/branches/useActiveProperties.ts
// Shared client hook: one live subscription to active listings, plus an
// assigner that gives every branch a DISTINCT property photo. Branch cards and
// heroes use genuine property pictures instead of stock/brand imagery, and no
// two branches in the same city repeat the same photo (a city can have fewer
// photographed listings than branches, so we draw from every image of every
// city property and only fall back to distinct brand images as a last resort).
import { useEffect, useState } from 'react';
import { subscribeToProperties } from '@/services/property';
import { Property } from '@/lib/types';
import {
  Branch,
  listingMatchesBranch,
  listingMatchesCity,
  branchesByCity,
  BRAND_IMAGES,
  City,
} from '@/lib/branches';

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

// Every photo of every property in a city — each property's cover first (better
// looking), then its extra photos — de-duplicated, order stable.
function cityImagePool(props: Property[], city: City): string[] {
  const cityProps = props.filter((p) => p.images?.length && listingMatchesCity(p.location, city));
  const covers: string[] = [];
  const extras: string[] = [];
  cityProps.forEach((p) => {
    (p.images || []).forEach((url, i) => {
      if (!url) return;
      if (i === 0) covers.push(url);
      else extras.push(url);
    });
  });
  const seen = new Set<string>();
  const pool: string[] = [];
  [...covers, ...extras].forEach((u) => {
    if (!seen.has(u)) {
      seen.add(u);
      pool.push(u);
    }
  });
  return pool;
}

// Photos of properties that sit specifically in a branch's area (cover first).
function branchAreaImages(props: Property[], branch: Branch): string[] {
  const areaProps = props.filter((p) => p.images?.length && listingMatchesBranch(p.location, branch));
  const covers: string[] = [];
  const extras: string[] = [];
  areaProps.forEach((p) => {
    (p.images || []).forEach((url, i) => {
      if (!url) return;
      if (i === 0) covers.push(url);
      else extras.push(url);
    });
  });
  return [...covers, ...extras];
}

// Assign a DISTINCT image to each branch in the list (all same city). Area-match
// first, then unused city photos, then distinct brand fillers. Returns a
// slug -> image URL map. A branch is omitted only if everything is exhausted.
export function assignBranchImages(props: Property[], branches: Branch[]): Map<string, string> {
  const result = new Map<string, string>();
  if (branches.length === 0) return result;
  const used = new Set<string>();
  const pool = cityImagePool(props, branches[0].city);
  const candidates = [...pool, ...BRAND_IMAGES];

  // Pass 1 — give each branch a unique photo from its own area if one is free.
  branches.forEach((b) => {
    const pick = branchAreaImages(props, b).find((u) => !used.has(u));
    if (pick) {
      used.add(pick);
      result.set(b.slug, pick);
    }
  });

  // Pass 2 — fill the rest from the shared candidate list, never repeating.
  let idx = 0;
  branches.forEach((b) => {
    if (result.has(b.slug)) return;
    while (idx < candidates.length && used.has(candidates[idx])) idx++;
    if (idx < candidates.length) {
      used.add(candidates[idx]);
      result.set(b.slug, candidates[idx]);
      idx++;
    }
  });

  return result;
}

// Convenience for a single-branch page (e.g. the hero): returns this branch's
// assigned image, computed against its city siblings so it matches the index
// card. Returns null if the assignment is a brand image (so a hero can choose
// to stay on its branded gradient rather than show stock art).
export function realBranchPhoto(props: Property[], branch: Branch): string | null {
  const img = assignBranchImages(props, branchesByCity(branch.city)).get(branch.slug);
  if (!img || BRAND_IMAGES.includes(img)) return null;
  return img;
}
