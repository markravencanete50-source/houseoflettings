// lib/valuation/fullEngine.ts
//
// The single valuation engine behind the public Instant Valuation tool and
// the admin/staff Rent Review tool. Covers EVERY UK postcode:
//   1. Postcodes inside our operating areas resolve to a precise district
//      tier (operatingAreaPostcodes.ts) for the baseline figure.
//   2. Everywhere else falls back to ONS regional averages (marketData2026.ts).
// On top of the baseline it applies property-type, bedroom, bathroom,
// condition, EPC, garden, balcony and parking adjustments, and returns a
// conservative / market / optimistic band per mode (rent and/or sale).
//
// Pure and dependency-free — safe on both client and server. The AI layer
// (lib/ai/groqValuation.ts) refines the narrative around these numbers but is
// always anchored to them.

import {
  REGION_DATA,
  getRegionFromPostcode,
  MARKET_DATA_YEAR,
  MARKET_DATA_UPDATED,
} from './marketData2026';
import { lookupPostcode, TIER_PRICING_2026 } from './operatingAreaPostcodes';

// ─── Input option types ──────────────────────────────────────────────────────
export type ValuationMode  = 'rent' | 'sale';
export type ValuationType  = 'let' | 'sale' | 'both';
export type PropertyTypeId = 'flat' | 'terraced' | 'semi' | 'detached' | 'bungalow';
export type ConditionId    = 'excellent' | 'good' | 'average' | 'dated' | 'renovation';
export type EpcId          = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'unknown';
export type GardenId       = 'private' | 'shared' | 'patio' | 'none';
export type ParkingId      = 'garage' | 'driveway' | 'allocated' | 'permit' | 'on_street' | 'none';
export type FurnishingId   = 'furnished' | 'part-furnished' | 'unfurnished';

export interface FullValuationInput {
  postcode:     string;
  addressLine1?: string;
  propertyType: PropertyTypeId;
  bedrooms:     number;        // 0 = studio
  bathrooms:    number;
  condition:    ConditionId;
  epc:          EpcId;
  garden:       GardenId;
  balcony:      boolean;
  parking:      ParkingId;
  furnishing?:  FurnishingId;  // affects rent only; optional for callers that don't collect it
}

// ─── Labels (shared by UI, PDF and emails) ───────────────────────────────────
export const PROPERTY_TYPE_LABEL: Record<PropertyTypeId, string> = {
  flat: 'Flat / Apartment', terraced: 'Terraced House', semi: 'Semi-Detached House',
  detached: 'Detached House', bungalow: 'Bungalow',
};
export const CONDITION_LABEL: Record<ConditionId, string> = {
  excellent: 'Excellent (recently renovated)', good: 'Good (well maintained)',
  average: 'Average (liveable, some wear)', dated: 'Dated (needs modernising)',
  renovation: 'Needs full renovation',
};
export const EPC_LABEL: Record<EpcId, string> = {
  A: 'EPC A', B: 'EPC B', C: 'EPC C', D: 'EPC D', E: 'EPC E', F: 'EPC F', G: 'EPC G',
  unknown: 'Not sure',
};
export const GARDEN_LABEL: Record<GardenId, string> = {
  private: 'Private garden', shared: 'Shared / communal garden',
  patio: 'Patio / courtyard', none: 'No garden',
};
export const PARKING_LABEL: Record<ParkingId, string> = {
  garage: 'Garage', driveway: 'Driveway (off-street)', allocated: 'Allocated space',
  permit: 'Permit parking', on_street: 'On-street parking', none: 'No parking',
};
export const FURNISHING_LABEL: Record<FurnishingId, string> = {
  furnished: 'Furnished', 'part-furnished': 'Part-furnished', unfurnished: 'Unfurnished',
};
export function bedroomsLabel(n: number): string {
  return n === 0 ? 'Studio' : `${n} bedroom${n > 1 ? 's' : ''}`;
}
// Adjective form for prose: "3-bedroom terraced house", "studio flat".
export function bedroomsAdjective(n: number): string {
  return n === 0 ? 'studio' : `${n}-bedroom`;
}

// ─── Multipliers & adjustments ───────────────────────────────────────────────
// Property-type multipliers, relative to the tier baseline. Rent and sale
// differ: in city rental markets flats are the standard stock and barely
// discount against the average, whereas as a purchase a flat is well below a
// house. Calibrated against 2026 asking-rent/asking-price comparables (e.g.
// a 2-bed flat in M5/Salford lets around £1,000–£1,150).
const PROP_MULT: Record<PropertyTypeId, { sale: number; rent: number }> = {
  flat:     { sale: 0.82, rent: 0.92 },
  terraced: { sale: 0.92, rent: 1.00 },
  semi:     { sale: 1.00, rent: 1.06 },
  detached: { sale: 1.40, rent: 1.28 },
  bungalow: { sale: 1.05, rent: 1.04 },
};

// Bedroom multipliers relative to a 3-bed baseline. Rents compress far more
// than sale prices: a 1-bed flat is roughly half a 3-bed house to BUY, but its
// RENT is much closer, so rent uses a flatter curve centred near a 2-bed (the
// modal rental unit).
const BEDROOM_MULT_SALE: Record<number, number> = {
  0: 0.52, 1: 0.62, 2: 0.83, 3: 1.00, 4: 1.26, 5: 1.52, 6: 1.78,
};
const BEDROOM_MULT_RENT: Record<number, number> = {
  0: 0.66, 1: 0.80, 2: 0.96, 3: 1.14, 4: 1.36, 5: 1.58, 6: 1.82,
};
function bedroomMult(n: number, mode: ValuationMode): number {
  const table = mode === 'rent' ? BEDROOM_MULT_RENT : BEDROOM_MULT_SALE;
  const clamped = Math.max(0, Math.min(6, Math.round(n)));
  const top = mode === 'rent' ? 1.82 : 1.78;
  const perExtra = mode === 'rent' ? 0.18 : 0.2;
  return n > 6 ? top + (n - 6) * perExtra : (table[clamped] ?? 1);
}

const CONDITION_PCT: Record<ConditionId, number> = {
  excellent: 0.08, good: 0.03, average: 0, dated: -0.06, renovation: -0.14,
};
const EPC_PCT: Record<EpcId, number> = {
  A: 0.04, B: 0.03, C: 0.015, D: 0, E: -0.02, F: -0.05, G: -0.07, unknown: 0,
};
const GARDEN_PCT: Record<GardenId, number> = {
  private: 0.06, shared: 0.02, patio: 0.015, none: 0,
};
const PARKING_PCT: Record<ParkingId, number> = {
  garage: 0.05, driveway: 0.045, allocated: 0.035, permit: 0.01, on_street: 0, none: 0,
};
// Furnishing affects lettings only — a furnished let typically commands a small
// premium, while it makes little difference to a sale price (buyers usually want
// the property empty). Applied in rent mode only (see calcMode).
const FURNISHING_PCT: Record<FurnishingId, number> = {
  furnished: 0.05, 'part-furnished': 0.02, unfurnished: 0,
};
const BALCONY_PCT = 0.025;
const BATHROOM_PCT_PER_EXTRA = 0.035;
const MAX_EXTRA_BATHROOMS = 3;

export interface AdjustmentLine {
  label: string;
  pct:   number; // e.g. 0.05 = +5%
}

// A three-year value trajectory for the charts: last year (actual), this year
// (the estimate), and next year (projected from the regional growth rate).
export interface TrajectoryPoint {
  year:      number;
  value:     number;
  projected: boolean; // true only for the forward-looking year
}

// ─── Output ──────────────────────────────────────────────────────────────────
export interface ModeValuation {
  mode:          ValuationMode;
  conservative:  number;
  market:        number;
  optimistic:    number;
  baseline:      number;   // area average before multipliers
  annualGrowthPct: number;
  adjustments:   AdjustmentLine[];
  totalAdjustmentPct: number;
  trajectory:    TrajectoryPoint[]; // last year → this year → next year (projected)
}

export interface FullValuationResult {
  postcode:    string;
  areaLabel:   string;   // "Headingley, Leeds" or "Yorkshire and the Humber"
  regionLabel: string;   // always the ONS region label
  isOperatingArea: boolean;
  dataYear:    number;
  dataUpdated: string;
  rent?: ModeValuation;
  sale?: ModeValuation;
}

// ─── Postcode validation (full UK coverage) ──────────────────────────────────
// Standard UK postcode formats per the Royal Mail spec (A9 9AA, A99 9AA,
// AA9 9AA, AA99 9AA, A9A 9AA, AA9A 9AA) plus the GIR 0AA special case.
const UK_POSTCODE_RE = /^(GIR\s*0AA|[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})$/i;

export function isValidUKPostcode(raw: string): boolean {
  return UK_POSTCODE_RE.test(raw.trim().replace(/\s+/g, ' '));
}

export function normalisePostcode(raw: string): string {
  const s = raw.replace(/\s+/g, '').toUpperCase();
  if (s.length < 5) return s;
  return `${s.slice(0, -3)} ${s.slice(-3)}`;
}

// ─── Core calculation ────────────────────────────────────────────────────────
function roundTo(n: number, step: number): number {
  return Math.round(n / step) * step;
}

function calcMode(input: FullValuationInput, mode: ValuationMode): ModeValuation {
  const district = lookupPostcode(input.postcode);
  const region   = getRegionFromPostcode(input.postcode);
  const regionData = REGION_DATA[region];

  const baseline = district
    ? (mode === 'rent' ? TIER_PRICING_2026[district.tier].avgRent : TIER_PRICING_2026[district.tier].avgSale)
    : (mode === 'rent' ? regionData.avgMonthlyRent : regionData.avgSalePrice);

  const adjustments: AdjustmentLine[] = [];
  const extraBaths = Math.min(Math.max(input.bathrooms - 1, 0), MAX_EXTRA_BATHROOMS);
  if (extraBaths > 0) adjustments.push({ label: `${input.bathrooms} bathrooms`, pct: extraBaths * BATHROOM_PCT_PER_EXTRA });
  if (CONDITION_PCT[input.condition] !== 0)
    adjustments.push({ label: CONDITION_LABEL[input.condition], pct: CONDITION_PCT[input.condition] });
  if (EPC_PCT[input.epc] !== 0)
    adjustments.push({ label: `Energy rating ${input.epc}`, pct: EPC_PCT[input.epc] });
  if (GARDEN_PCT[input.garden] !== 0)
    adjustments.push({ label: GARDEN_LABEL[input.garden], pct: GARDEN_PCT[input.garden] });
  if (input.balcony) adjustments.push({ label: 'Balcony', pct: BALCONY_PCT });
  if (PARKING_PCT[input.parking] !== 0)
    adjustments.push({ label: PARKING_LABEL[input.parking], pct: PARKING_PCT[input.parking] });
  // Furnishing is a rental-only factor.
  if (mode === 'rent' && input.furnishing && FURNISHING_PCT[input.furnishing] !== 0)
    adjustments.push({ label: FURNISHING_LABEL[input.furnishing], pct: FURNISHING_PCT[input.furnishing] });

  const totalAdjustmentPct = adjustments.reduce((s, a) => s + a.pct, 0);

  const mid = baseline
    * PROP_MULT[input.propertyType][mode]
    * bedroomMult(input.bedrooms, mode)
    * (1 + totalAdjustmentPct);

  // Conservative / optimistic band: AVM-style uncertainty, tighter for rent.
  const spread = mode === 'sale' ? 0.09 : 0.07;
  const step   = mode === 'sale' ? 2500 : 5;
  const market = roundTo(mid, step);

  // Three-year trajectory around the current estimate, using the regional
  // year-on-year growth rate: last year is the estimate discounted by one
  // year's growth, next year is the estimate grown by one more year.
  const growth = mode === 'rent' ? regionData.annualRentGrowthPct : regionData.annualSaleGrowthPct;
  const g = growth / 100;
  const trajectory: TrajectoryPoint[] = [
    { year: MARKET_DATA_YEAR - 1, value: roundTo(market / (1 + g), step), projected: false },
    { year: MARKET_DATA_YEAR,     value: market,                          projected: false },
    { year: MARKET_DATA_YEAR + 1, value: roundTo(market * (1 + g), step), projected: true  },
  ];

  return {
    mode,
    conservative: roundTo(mid * (1 - spread), step),
    market,
    optimistic:   roundTo(mid * (1 + spread), step),
    baseline,
    annualGrowthPct: growth,
    adjustments,
    totalAdjustmentPct,
    trajectory,
  };
}

export function computeFullValuation(
  input: FullValuationInput,
  type: ValuationType,
): FullValuationResult {
  const district = lookupPostcode(input.postcode);
  const region   = getRegionFromPostcode(input.postcode);

  return {
    postcode:    normalisePostcode(input.postcode),
    areaLabel:   district ? `${district.subArea}, ${district.area}` : REGION_DATA[region].label,
    regionLabel: REGION_DATA[region].label,
    isOperatingArea: !!district,
    dataYear:    MARKET_DATA_YEAR,
    dataUpdated: MARKET_DATA_UPDATED,
    ...(type !== 'sale' ? { rent: calcMode(input, 'rent') } : {}),
    ...(type !== 'let'  ? { sale: calcMode(input, 'sale') } : {}),
  };
}

export function fmtGBP(n: number): string {
  return `£${Math.round(n).toLocaleString('en-GB')}`;
}
