// lib/pricingOverrides.ts
// Admin-editable service pricing. The bundle catalogue in lib/bundles.ts holds
// the DEFAULT setup fees + management %; admins can override a bundle's setupFee
// and mgmtFee (stored in Firestore settings/servicePricing) without a deploy.
// This module (client-safe: no firebase-admin) applies the overrides everywhere
// bundles are shown — registration, pricing page, agreement PDF/email.
import type { Bundle } from '@/lib/bundles';

export type BundlePriceOverride = { setupFee?: string; mgmtFee?: string };
export type PricingOverrides = Record<string, BundlePriceOverride>;

const replaceAll = (s: string, from: string, to: string) => (from && from !== to ? s.split(from).join(to) : s);

// Normalise loose admin input: "199" → "£199", "10" → "10%".
export function normalizeSetup(v: string): string {
  const t = (v || '').trim();
  return !t ? t : (/^£/.test(t) ? t : `£${t.replace(/^£\s*/, '')}`);
}
export function normalizeMgmt(v: string): string {
  const t = (v || '').trim();
  return !t ? '' : (/%$/.test(t) ? t : `${t.replace(/\s*%$/, '')}%`);
}

// Apply one bundle's override, rewriting the fee everywhere it appears (the
// setup/mgmt figures are also embedded in `ongoing` and the group headings).
export function applyPricingOverride(bundle: Bundle, ov?: BundlePriceOverride): Bundle {
  if (!ov) return bundle;
  const setupFee = ov.setupFee && ov.setupFee.trim() ? ov.setupFee.trim() : bundle.setupFee;
  const mgmtFee = ov.mgmtFee !== undefined ? ov.mgmtFee.trim() : bundle.mgmtFee;
  if (setupFee === bundle.setupFee && mgmtFee === bundle.mgmtFee) return bundle;

  let ongoing = bundle.ongoing;
  let groups = bundle.groups;
  if (setupFee !== bundle.setupFee) {
    ongoing = replaceAll(ongoing, bundle.setupFee, setupFee);
    groups = groups.map(g => ({ ...g, heading: replaceAll(g.heading, bundle.setupFee, setupFee) }));
  }
  if (mgmtFee !== bundle.mgmtFee && bundle.mgmtFee) {
    ongoing = replaceAll(ongoing, bundle.mgmtFee, mgmtFee);
    groups = groups.map(g => ({ ...g, heading: replaceAll(g.heading, bundle.mgmtFee, mgmtFee) }));
  }
  return { ...bundle, setupFee, mgmtFee, ongoing, groups };
}

export function applyOverridesToBundles(bundles: Bundle[], overrides: PricingOverrides): Bundle[] {
  return bundles.map(b => applyPricingOverride(b, overrides[b.id]));
}

// Validate an admin's submitted overrides: only known bundle ids, trimmed,
// normalised and length-capped. A blank field is dropped (use the default).
export function sanitizePricingOverrides(raw: any, validIds: string[]): PricingOverrides {
  const out: PricingOverrides = {};
  if (raw && typeof raw === 'object') {
    for (const id of validIds) {
      const v = raw[id];
      if (!v || typeof v !== 'object') continue;
      const entry: BundlePriceOverride = {};
      if (typeof v.setupFee === 'string' && v.setupFee.trim()) entry.setupFee = normalizeSetup(v.setupFee).slice(0, 20);
      if (typeof v.mgmtFee === 'string' && v.mgmtFee.trim()) entry.mgmtFee = normalizeMgmt(v.mgmtFee).slice(0, 12);
      if (entry.setupFee !== undefined || entry.mgmtFee !== undefined) out[id] = entry;
    }
  }
  return out;
}
