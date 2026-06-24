// lib/valuation/valuationEngine.ts
//
// Pure calculation engine for the Instant Valuation tool.
// No external API calls — everything resolves from marketData2026.ts.
// Swap the import below to marketDataYYYY.ts each year after refreshing data.

import {
  REGION_DATA,
  PROPERTY_TYPE_MULTIPLIER,
  getBedroomMultiplier,
  getRegionFromPostcode,
  MARKET_DATA_YEAR,
  MARKET_DATA_UPDATED,
  type PropertyType,
  type Region,
} from './marketData2026';

export type ValuationMode = 'sale' | 'rent';

export interface ValuationInput {
  postcode: string;
  propertyType: PropertyType;
  bedrooms: number;
  mode: ValuationMode;
  /** Optional: 0-100, where 100 = pristine/recently renovated, 50 = average, 0 = needs full refurb */
  conditionScore?: number;
}

export interface ValuationResult {
  mode: ValuationMode;
  region: Region;
  regionLabel: string;
  estimateLow: number;
  estimateMid: number;
  estimateHigh: number;
  annualGrowthPct: number;
  dataYear: number;
  dataUpdated: string;
  breakdown: {
    regionalBaseline: number;
    propertyTypeMultiplier: number;
    bedroomMultiplier: number;
    conditionMultiplier: number;
  };
}

const CONDITION_RANGE = { min: 0.85, max: 1.12 }; // applied around a 50 = neutral midpoint

function getConditionMultiplier(conditionScore?: number): number {
  if (conditionScore === undefined) return 1.0;
  const clamped = Math.max(0, Math.min(100, conditionScore));
  const t = clamped / 100; // 0..1
  return CONDITION_RANGE.min + t * (CONDITION_RANGE.max - CONDITION_RANGE.min);
}

export function calculateValuation(input: ValuationInput): ValuationResult {
  const region = getRegionFromPostcode(input.postcode);
  const regionData = REGION_DATA[region];
  const typeMultiplier = PROPERTY_TYPE_MULTIPLIER[input.propertyType];
  const bedroomMultiplier = getBedroomMultiplier(input.bedrooms);
  const conditionMultiplier = getConditionMultiplier(input.conditionScore);

  const baseline =
    input.mode === 'sale' ? regionData.avgSalePrice : regionData.avgMonthlyRent;
  const typeMult = input.mode === 'sale' ? typeMultiplier.sale : typeMultiplier.rent;

  const mid = baseline * typeMult * bedroomMultiplier * conditionMultiplier;

  // Spread reflects normal AVM-style uncertainty: tighter for rent, wider for sale.
  const spread = input.mode === 'sale' ? 0.09 : 0.07;

  const round = (n: number) =>
    input.mode === 'sale' ? Math.round(n / 500) * 500 : Math.round(n / 5) * 5;

  return {
    mode: input.mode,
    region,
    regionLabel: regionData.label,
    estimateLow: round(mid * (1 - spread)),
    estimateMid: round(mid),
    estimateHigh: round(mid * (1 + spread)),
    annualGrowthPct:
      input.mode === 'sale' ? regionData.annualSaleGrowthPct : regionData.annualRentGrowthPct,
    dataYear: MARKET_DATA_YEAR,
    dataUpdated: MARKET_DATA_UPDATED,
    breakdown: {
      regionalBaseline: baseline,
      propertyTypeMultiplier: typeMult,
      bedroomMultiplier,
      conditionMultiplier,
    },
  };
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  }).format(value);
}
