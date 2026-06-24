// lib/valuation/marketData2026.ts
//
// UK property market data — baseline year 2026.
// Sources: ONS UK House Price Index (Apr 2026 release) + ONS Private Rent
// and House Prices bulletin (May/Jun 2026) + Zoopla House Price Index (Jun 2026).
//
// ⚠️ UPDATE ANNUALLY. Re-pull regional averages, rent figures, and growth
// rates every January using the latest ONS UK HPI + ONS Private Rent bulletin.
// Rename this file marketData2027.ts next year and update the import in
// valuationEngine.ts.

export const MARKET_DATA_YEAR = 2026;
export const MARKET_DATA_UPDATED = '2026-06'; // last data refresh, YYYY-MM

export type Region =
  | 'london'
  | 'south_east'
  | 'east_of_england'
  | 'south_west'
  | 'west_midlands'
  | 'east_midlands'
  | 'yorkshire_humber'
  | 'north_west'
  | 'north_east'
  | 'wales'
  | 'scotland'
  | 'northern_ireland';

export interface RegionMarketData {
  label: string;
  avgSalePrice: number; // £, average across all property types
  avgMonthlyRent: number; // £/month
  annualSaleGrowthPct: number; // year-on-year, %
  annualRentGrowthPct: number; // year-on-year, %
}

// Average sale price & rent by region — 2026 baseline.
export const REGION_DATA: Record<Region, RegionMarketData> = {
  london: {
    label: 'London',
    avgSalePrice: 529_500,
    avgMonthlyRent: 2294,
    annualSaleGrowthPct: 0.0,
    annualRentGrowthPct: 2.0,
  },
  south_east: {
    label: 'South East',
    avgSalePrice: 384_100,
    avgMonthlyRent: 1320,
    annualSaleGrowthPct: -0.4,
    annualRentGrowthPct: 2.8,
  },
  east_of_england: {
    label: 'East of England',
    avgSalePrice: 338_700,
    avgMonthlyRent: 1260,
    annualSaleGrowthPct: 0.8,
    annualRentGrowthPct: 3.1,
  },
  south_west: {
    label: 'South West',
    avgSalePrice: 311_500,
    avgMonthlyRent: 1180,
    annualSaleGrowthPct: 1.0,
    annualRentGrowthPct: 3.0,
  },
  west_midlands: {
    label: 'West Midlands',
    avgSalePrice: 252_000,
    avgMonthlyRent: 950,
    annualSaleGrowthPct: 2.4,
    annualRentGrowthPct: 4.2,
  },
  east_midlands: {
    label: 'East Midlands',
    avgSalePrice: 238_000,
    avgMonthlyRent: 900,
    annualSaleGrowthPct: 2.1,
    annualRentGrowthPct: 4.0,
  },
  yorkshire_humber: {
    label: 'Yorkshire and the Humber',
    avgSalePrice: 218_000,
    avgMonthlyRent: 860,
    annualSaleGrowthPct: 3.9,
    annualRentGrowthPct: 4.8,
  },
  north_west: {
    label: 'North West',
    avgSalePrice: 210_000,
    avgMonthlyRent: 850,
    annualSaleGrowthPct: 3.1,
    annualRentGrowthPct: 5.0,
  },
  north_east: {
    label: 'North East',
    avgSalePrice: 151_100,
    avgMonthlyRent: 776,
    annualSaleGrowthPct: 9.9,
    annualRentGrowthPct: 5.9,
  },
  wales: {
    label: 'Wales',
    avgSalePrice: 212_000,
    avgMonthlyRent: 836,
    annualSaleGrowthPct: 3.5,
    annualRentGrowthPct: 4.7,
  },
  scotland: {
    label: 'Scotland',
    avgSalePrice: 195_000,
    avgMonthlyRent: 1009,
    annualSaleGrowthPct: 1.3,
    annualRentGrowthPct: 1.0,
  },
  northern_ireland: {
    label: 'Northern Ireland',
    avgSalePrice: 198_000,
    avgMonthlyRent: 876,
    annualSaleGrowthPct: 7.4,
    annualRentGrowthPct: 3.3,
  },
};

// Maps the first letter(s) of a UK postcode "area" to a region.
// This is intentionally coarse — good enough for an instant ballpark figure,
// not a substitute for a real postcode-district lookup table.
export const POSTCODE_AREA_TO_REGION: Record<string, Region> = {
  // London
  E: 'london', EC: 'london', N: 'london', NW: 'london', SE: 'london',
  SW: 'london', W: 'london', WC: 'london',
  // South East
  GU: 'south_east', ME: 'south_east', MK: 'south_east', OX: 'south_east',
  PO: 'south_east', RG: 'south_east', RH: 'south_east', SL: 'south_east',
  SO: 'south_east', TN: 'south_east', BN: 'south_east', KT: 'south_east',
  // East of England
  AL: 'east_of_england', CB: 'east_of_england', CM: 'east_of_england',
  CO: 'east_of_england', IP: 'east_of_england', LU: 'east_of_england',
  NR: 'east_of_england', PE: 'east_of_england', SG: 'east_of_england',
  SS: 'east_of_england',
  // South West
  BA: 'south_west', BH: 'south_west', BS: 'south_west', DT: 'south_west',
  EX: 'south_west', GL: 'south_west', PL: 'south_west', SN: 'south_west',
  SP: 'south_west', TA: 'south_west', TQ: 'south_west', TR: 'south_west',
  // West Midlands
  B: 'west_midlands', CV: 'west_midlands', DY: 'west_midlands',
  WS: 'west_midlands', WV: 'west_midlands', ST: 'west_midlands',
  // East Midlands
  DE: 'east_midlands', LE: 'east_midlands', LN: 'east_midlands',
  NG: 'east_midlands', NN: 'east_midlands',
  // Yorkshire & the Humber
  BD: 'yorkshire_humber', DN: 'yorkshire_humber', HD: 'yorkshire_humber',
  HG: 'yorkshire_humber', HU: 'yorkshire_humber', HX: 'yorkshire_humber',
  LS: 'yorkshire_humber', S: 'yorkshire_humber', WF: 'yorkshire_humber',
  YO: 'yorkshire_humber',
  // North West
  BB: 'north_west', BL: 'north_west', CA: 'north_west', CH: 'north_west',
  CW: 'north_west', FY: 'north_west', L: 'north_west', LA: 'north_west',
  M: 'north_west', OL: 'north_west', PR: 'north_west', SK: 'north_west',
  WA: 'north_west', WN: 'north_west',
  // North East
  DH: 'north_east', DL: 'north_east', NE: 'north_east', SR: 'north_east',
  TS: 'north_east',
  // Wales
  CF: 'wales', LD: 'wales', LL: 'wales', NP: 'wales', SA: 'wales', SY: 'wales',
  // Scotland
  AB: 'scotland', DD: 'scotland', DG: 'scotland', EH: 'scotland',
  FK: 'scotland', G: 'scotland', IV: 'scotland', KA: 'scotland',
  KW: 'scotland', KY: 'scotland', ML: 'scotland', PA: 'scotland',
  PH: 'scotland', TD: 'scotland', ZE: 'scotland',
  // Northern Ireland
  BT: 'northern_ireland',
};

export type PropertyType =
  | 'flat'
  | 'terraced'
  | 'semi_detached'
  | 'detached'
  | 'bungalow';

// Multiplier applied to the regional average sale price / rent.
// Derived from Zoopla Jun 2026 HPI commentary: semis +2.5% YoY vs flats -1.3%,
// detached/terraced roughly in step at +1.7%. Multipliers below are relative
// price-level adjustments (not growth rates) against the regional blended avg.
export const PROPERTY_TYPE_MULTIPLIER: Record<PropertyType, { sale: number; rent: number }> = {
  flat: { sale: 0.78, rent: 0.82 },
  terraced: { sale: 0.92, rent: 0.90 },
  semi_detached: { sale: 1.0, rent: 1.0 },
  detached: { sale: 1.45, rent: 1.35 },
  bungalow: { sale: 1.05, rent: 1.0 },
};

// Adjustment per bedroom, relative to a 3-bed baseline (multiplier = 1.0 at 3 beds).
export const BEDROOM_ADJUSTMENT: Record<number, number> = {
  1: 0.55,
  2: 0.78,
  3: 1.0,
  4: 1.28,
  5: 1.55,
  6: 1.8,
};

export function getBedroomMultiplier(bedrooms: number): number {
  if (bedrooms in BEDROOM_ADJUSTMENT) return BEDROOM_ADJUSTMENT[bedrooms];
  if (bedrooms > 6) return 1.8 + (bedrooms - 6) * 0.2;
  return 0.55;
}

export function getRegionFromPostcode(postcode: string): Region {
  const cleaned = postcode.trim().toUpperCase().replace(/\s+/g, '');
  // Postcode area = leading letters before the first digit.
  const match = cleaned.match(/^([A-Z]{1,2})\d/);
  const area = match ? match[1] : '';

  // Try the 2-letter area first, then fall back to 1-letter.
  if (area.length === 2 && POSTCODE_AREA_TO_REGION[area]) {
    return POSTCODE_AREA_TO_REGION[area];
  }
  const oneLetter = area.charAt(0);
  if (POSTCODE_AREA_TO_REGION[oneLetter]) {
    return POSTCODE_AREA_TO_REGION[oneLetter];
  }
  // Default fallback if postcode area is unrecognised.
  return 'south_east';
}
