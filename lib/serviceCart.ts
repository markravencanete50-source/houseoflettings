// lib/serviceCart.ts
// Structured, machine-readable pricing for the orderable additional services,
// plus the pricing maths used by BOTH the cart UI and the server (which re-prices
// every order from this same source, never trusting client-sent totals).
//
// A service is "orderable" iff it has an entry in SERVICE_ORDERS. Quote-only
// services (eviction, legal, insurance) are intentionally absent and show an
// "Enquire" button instead of "Add to order".
import { SERVICE_CATEGORIES } from '@/lib/additionalServices';
import { BUNDLES } from '@/lib/bundles';

export type AddOn = {
  id: string;
  label: string;
  price: number;                 // GBP
  kind: 'toggle' | 'qty';        // toggle = one-off; qty = per-unit count
  unitLabel?: string;            // e.g. 'bedroom' (for qty add-ons)
  max?: number;
};

export type ServiceOrderConfig = {
  basePrice?: number;            // used when there are no variants
  from?: boolean;                // headline is a "from" (indicative) price
  variants?: { id: string; label: string; price: number }[];
  defaultVariant?: string;
  addOns?: AddOn[];
  unit?: string;                 // line quantity means this (e.g. 'applicant'); default one-off
  kind?: 'service' | 'package';  // packages = landlord tiers charged as a one-time setup fee
  ongoingNote?: string;          // for packages: the ongoing fee arranged during onboarding
};

export const SERVICE_ORDERS: Record<string, ServiceOrderConfig> = {
  'inventory-handover': {
    from: true,
    variants: [
      { id: 'inventory', label: 'Inventory only', price: 85 },
      { id: 'inventory-handover', label: 'Inventory + Handover (Check-In)', price: 120 },
    ],
    defaultVariant: 'inventory-handover',
    addOns: [
      { id: 'furnished', label: 'Furnished property', price: 15, kind: 'toggle' },
      { id: 'extra-bed', label: 'Extra bedrooms (beyond the first)', price: 15, kind: 'qty', unitLabel: 'bedroom', max: 12 },
      { id: 'diff-day', label: 'Handover on a different day', price: 65, kind: 'toggle' },
    ],
  },
  'check-out': {
    basePrice: 89,
    addOns: [{ id: 'extra-bed', label: 'Extra bedrooms (beyond the first)', price: 15, kind: 'qty', unitLabel: 'bedroom', max: 12 }],
  },
  'check-comparison': { basePrice: 89 },
  'mid-tenancy-inspection': { basePrice: 89 },
  'virtual-inspection': { basePrice: 39 },
  'photos-floorplans': { basePrice: 75, from: true },
  'video-tour': { basePrice: 75 },
  'accompanied-viewings': { basePrice: 45, from: true },
  'referencing-service': { basePrice: 25, unit: 'applicant' },
  'gas-safety': {
    basePrice: 70, from: true,
    addOns: [
      { id: 'extra-appliance', label: 'Additional gas appliances', price: 13, kind: 'qty', unitLabel: 'appliance', max: 20 },
      { id: 'boiler-service', label: 'Add a full boiler service', price: 50, kind: 'toggle' },
    ],
  },
  'epc': {
    basePrice: 65, from: true,
    addOns: [{ id: 'extra-bed6', label: 'Bedrooms beyond 6', price: 15, kind: 'qty', unitLabel: 'bedroom', max: 12 }],
  },
  'eicr': {
    basePrice: 170,
    addOns: [
      { id: 'per-bed', label: 'Per bedroom', price: 15, kind: 'qty', unitLabel: 'bedroom', max: 12 },
      { id: 'extra-circuit', label: 'Circuits beyond 8', price: 15, kind: 'qty', unitLabel: 'circuit', max: 30 },
      { id: 'extra-board', label: 'Additional fuse boards (beyond the first)', price: 55, kind: 'qty', unitLabel: 'board', max: 6 },
    ],
  },
  'pat': {
    basePrice: 90,
    addOns: [{ id: 'extra-appliance', label: 'Appliances beyond 10', price: 2, kind: 'qty', unitLabel: 'appliance', max: 100 }],
  },
  'rent-guarantee': { basePrice: 275 },
};

// ── Service name/category index (kept in sync with the display data) ──
type ServiceMeta = { name: string; categoryTitle: string; tagline: string };
export const SERVICE_INDEX: Record<string, ServiceMeta> = (() => {
  const idx: Record<string, ServiceMeta> = {};
  for (const cat of SERVICE_CATEGORIES) {
    for (const s of cat.services) {
      idx[s.id] = { name: s.name, categoryTitle: cat.title, tagline: s.tagline };
    }
  }
  return idx;
})();

// ── Register the landlord packages as orderable items. They're charged as their
//    one-time setup fee (the "first payment" to register the landlord); the
//    ongoing % is arranged by the account team during onboarding. ──
for (const b of BUNDLES) {
  const setup = parseInt(b.setupFee.replace(/[^\d]/g, ''), 10) || 0;
  SERVICE_ORDERS[b.id] = {
    basePrice: setup,
    kind: 'package',
    ongoingNote: b.mgmtFee ? `then ${b.mgmtFee} of monthly rent, arranged by our account team` : 'No ongoing fee',
  };
  SERVICE_INDEX[b.id] = {
    name: b.label,
    categoryTitle: b.kind === 'Management' ? 'Management package' : 'Tenant-find package',
    tagline: b.blurb,
  };
}

export function isPackage(serviceId: string): boolean {
  return SERVICE_ORDERS[serviceId]?.kind === 'package';
}

export function isOrderable(serviceId: string): boolean {
  return !!SERVICE_ORDERS[serviceId];
}

// ── A single line in the cart ──
export type OrderSelection = {
  uid: string;                    // client-side line id
  serviceId: string;
  variantId?: string;
  addOns: Record<string, number>; // addOnId -> count (toggle stored as 0/1)
  quantity: number;
};

export type AddOnLine = { id: string; label: string; count?: number; amount: number };
export type LineBreakdown = {
  serviceId: string;
  name: string;
  categoryTitle: string;
  variantLabel?: string;
  base: number;
  from: boolean;
  addOns: AddOnLine[];
  quantity: number;
  unit?: string;                  // 'applicant' etc; undefined = one-off
  unitTotal: number;              // base + add-ons (per unit)
  total: number;                  // unitTotal * quantity
  kind: 'service' | 'package';
  ongoingNote?: string;           // packages only
};

export function baseFor(cfg: ServiceOrderConfig, variantId?: string): { price: number; label?: string } {
  if (cfg.variants && cfg.variants.length) {
    const v = cfg.variants.find(x => x.id === variantId) ||
      cfg.variants.find(x => x.id === cfg.defaultVariant) || cfg.variants[0];
    return { price: v.price, label: v.label };
  }
  return { price: cfg.basePrice || 0 };
}

// Re-price a selection from the canonical config. Returns null for non-orderable ids.
export function priceLine(sel: OrderSelection): LineBreakdown | null {
  const cfg = SERVICE_ORDERS[sel.serviceId];
  const meta = SERVICE_INDEX[sel.serviceId];
  if (!cfg || !meta) return null;

  const { price: base, label: variantLabel } = baseFor(cfg, sel.variantId);
  const addOns: AddOnLine[] = [];
  for (const a of cfg.addOns || []) {
    const raw = sel.addOns?.[a.id] || 0;
    const count = a.kind === 'toggle' ? (raw ? 1 : 0) : Math.max(0, Math.min(a.max ?? 99, Math.floor(raw)));
    if (count > 0) {
      addOns.push({
        id: a.id,
        label: a.label,
        count: a.kind === 'qty' ? count : undefined,
        amount: a.price * count,
      });
    }
  }
  const quantity = Math.max(1, Math.min(50, Math.floor(sel.quantity || 1)));
  const unitTotal = base + addOns.reduce((s, l) => s + l.amount, 0);
  return {
    serviceId: sel.serviceId,
    name: meta.name,
    categoryTitle: meta.categoryTitle,
    variantLabel,
    base,
    from: !!cfg.from,
    addOns,
    quantity,
    unit: cfg.unit,
    unitTotal,
    total: unitTotal * quantity,
    kind: cfg.kind || 'service',
    ongoingNote: cfg.ongoingNote,
  };
}

export function cartTotal(items: OrderSelection[]): number {
  return items.reduce((sum, it) => sum + (priceLine(it)?.total || 0), 0);
}

export function anyFrom(items: OrderSelection[]): boolean {
  return items.some(it => priceLine(it)?.from);
}

export function formatGBP(n: number): string {
  return Number.isInteger(n) ? `£${n}` : `£${n.toFixed(2)}`;
}

// A default (empty) selection for a service, with default variant preselected.
export function newSelection(serviceId: string, uid: string): OrderSelection {
  const cfg = SERVICE_ORDERS[serviceId];
  return {
    uid,
    serviceId,
    variantId: cfg?.variants ? (cfg.defaultVariant || cfg.variants[0].id) : undefined,
    addOns: {},
    quantity: 1,
  };
}
