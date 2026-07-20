// lib/rentReviewProperties.ts
// The catalogue of managed properties a tenant can pick from on the rent-review
// form. The list is data-driven: the source of truth is the Firestore
// collection `rentReviewProperties`, managed from the admin/staff dashboards so
// the office can add or edit properties WITHOUT a code change. This file seeds
// the initial catalogue (below) and provides the address/postcode helpers used
// by the API and the dashboards.
//
// The public API merges these defaults with any Firestore entries (Firestore
// wins on a matching address), so the form always shows the full list even
// before anything is added in the dashboard.

export interface RentReviewProperty {
  id?: string;             // Firestore id (absent for code defaults)
  address: string;         // full display address
  postcode: string;        // extracted / provided postcode (uppercased, single-spaced)
  currentRent?: string;    // optional, set by staff
  proposedRent?: string;   // optional, set by staff
  effectiveDate?: string;  // optional ISO date the new rent applies from
  active?: boolean;
  source?: 'default' | 'firestore';
}

// UK postcode, tolerant of a missing internal space (e.g. "LS85DQ" or "M147BA").
const POSTCODE_RE = /([A-Z]{1,2}\d[A-Z\d]?)\s*(\d[A-Z]{2})/i;

/** Pull the postcode out of a free-form address and normalise it to "OUT IN". */
export function extractPostcode(address: string): string {
  const m = (address || '').toUpperCase().match(POSTCODE_RE);
  return m ? `${m[1]} ${m[2]}` : '';
}

/** A stable key for de-duplicating an address across the defaults and Firestore. */
export function addressKey(address: string): string {
  return (address || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

// The initial catalogue supplied by the office. Address-only — proposed rent
// and effective date are set per-tenant (via the personalised link) or per
// property from the dashboard.
export const DEFAULT_RENT_REVIEW_ADDRESSES: string[] = [
  'Apartment 10 Parkside 193 Hart Road, Manchester M14 7BA',
  '59 Aberdeen Terrace, Bradford, West Yorkshire BD14 6LS',
  '29 Chancel Road, Wakefield, West Yorkshire WF1 5JH',
  '10 Whitmore Road, Manchester M14 7RG',
  '25 Darfield Road, Leeds, West Yorkshire LS8 5DQ',
  '24 Kensington Way, Leeds, West Yorkshire LS10 4UP',
  '34 Torre Mount, Leeds, West Yorkshire LS9 7DJ',
  'Flat 3, 20 Lickless Gardens, Leeds, West Yorkshire LS18 5QU',
  'Apartment 181 Advent House 3, 1 Isaac Way, Manchester M4 7EE',
  'Flat 1-1 Conway Place, Leeds, West Yorkshire LS8 5HT',
  '25 Iveson Grove, Leeds, West Yorkshire LS16 6ND',
  'Flat Basement, 12 Baldovan Place, Leeds, West Yorkshire LS8 4JF',
  '6 Browning Road, Huddersfield, West Yorkshire HD2 1HU',
  '2 Marlborough Grange, Leeds, West Yorkshire LS1 4PF',
  '21 Walesby Court, Leeds, West Yorkshire LS16 6RX',
  '14 Tynwald Green, Leeds, West Yorkshire LS17 5NL',
  '45 Coronation Street, Manchester M27 6DE',
  '166A Chapeltown Road, Leeds, West Yorkshire LS7 4EE',
  '122 Ashley Lane, Manchester M9 4NT',
  'Apartment 9a Quay 5, 232 Ordsall Lane, Salford, Lancashire M5 3NB',
  'Flat 38 Riverside Court, 214 Palatine Road, Manchester M20 2UF',
  '42 Abbeydale Garth, Leeds, West Yorkshire LS5 3RQ',
  '15 Bolton Court, Leeds, Yorkshire LS14 6NB',
  'Flat E, 164 Chapeltown Road, Leeds, West Yorkshire LS7 4EE',
  'Flat B1, 19 Francis Street, Leeds, West Yorkshire LS7 4BY',
  '2 Sharp House Road, Leeds, West Yorkshire LS10 4SD',
  'Room C, 7 Francis Street, Leeds, West Yorkshire LS7 4BY',
  '45 Charlton Place, Richmond Hill, Leeds, West Yorkshire LS9 9JP',
  '86 School Crescent, Dewsbury, West Yorkshire WF13 4RT',
  '37 Nowell Mount, Leeds, West Yorkshire LS9 6HP',
  'Flat 2 Parkfield Lodge, Parkfield Road South, Manchester M20 6DD',
  'Flat 2, 7 Francis Street, Leeds LS7 4BY',
  'Flat 2-1 Conway Place, Leeds LS8 5HT',
  'Flat 3-1 Conway Place, Leeds LS8 5HT',
  '4 Whingate Green, Leeds, West Yorkshire LS12 3TH',
  'Room 6, 7 Francis Street, Leeds LS7 4BY',
  '12 Hanson Court, Normanton, West Yorkshire WF6 1GU',
  '36 Holden Avenue, Manchester M16 8TA',
  '40 Loring Street, Manchester M40 1WU',
  '54 Chervil Close, Manchester M14 7DP',
  'Apartment 45b Quay 5, 234 Ordsall Lane, Salford, Lancashire M5 3WJ',
  'Flat 4-1 Conway Place, Leeds LS8 5HT',
  '7 Marlborough Grange, Leeds, West Yorkshire LS1 4PF',
  '33 Bilsborrow Road, Manchester M14 7TH',
  'Room 4, 7 Francis Street, Leeds, West Yorkshire LS7 4BY',
  'Apartment 137 Advent House, 1 Isaac Way, Manchester M4 7EE',
  '2 Roving Bridge Rise, Clifton, Swinton, Manchester M27 8AF',
  '26 Arthington Terrace, Leeds, West Yorkshire LS10 2NF',
  'Flat Number 2, 12 Baldovan Place, Leeds, West Yorkshire LS8 4JF',
  '15 Woodhall Drive, Leeds, West Yorkshire LS5 3LQ',
  'Flat B, 299 Roundhay Road, Leeds, West Yorkshire LS8 4HT',
  'Flat 1, 12 Baldovan Place, Leeds, West Yorkshire LS8 4JF',
  '199 The Edge, Clowes Street, Salford, Lancashire M3 5NF',
  'Flat 2, 25 Marshall Street, Leeds, West Yorkshire LS15 8DY',
  'Flat 1, 25 Marshall Street, Leeds, West Yorkshire LS15 8DY',
  '3A Trafford Terrace, Leeds, West Yorkshire LS9 6BQ',
  'Flat 4, 105 King Lane (Earls Court), Leeds, West Yorkshire LS17 5BF',
  'Flat 3, 12 Baldovan Place, Leeds, West Yorkshire LS8 4JF',
  'Flat 1, 71 Town Street, Leeds, West Yorkshire LS12 3HD',
  '10 Marlborough Grange, Leeds LS1 4PF',
  '37 Woodview, Shevington, Wigan, Lancashire WN6 8BG',
  '19 Stillwater Drive, Manchester M11 4TP',
  'Flat 3, 25 Marshall Street, Leeds, West Yorkshire LS15 8DY',
  '44 Cardwell Road, Leeds LS14 1FL',
  'Apartment 205 Michigan Point Tower A, 9 Michigan Avenue, Salford, Lancashire M50 2HA',
  'Flat 3, 299 Roundhay Road, Leeds, West Yorkshire LS8 4HT',
  '1 Longfield Avenue, Pudsey, West Yorkshire LS28 7DB',
  'Apartment 184 Advent House, 1 Isaac Way, Manchester M4 7EE',
  'Apartment 180 Advent House 3, 1 Isaac Way, Manchester M4 7EE',
  '75 Hastings Street, Bradford, West Yorkshire BD5 9PJ',
  '43 Kempster Gardens, Salford, Lancashire M7 1AE',
  'Apartment 166, Whitehall Waterfront, 2 Riverside Way, Leeds LS1 4EG',
  'Apartment 5, Fusion 1, 18 Middlewood Street, Salford M5 4LW',
  'Flat 2, 71 Town Street, Leeds, West Yorkshire LS12 3HD',
  '77 Garrett Meadow, Tyldesley, Manchester M29 8SD',
  '75 Garrett Meadow, Tyldesley, Manchester M29 8SD',
  '8 Colwyn Mount, Leeds LS11 6LH',
  'Apartment 133 Advent House, 1 Isaac Way, Manchester M4 7EE',
  'Apartment 17, 2 Stoneyholme Avenue, Blackley M8 0BY',
  '19 Monkswood Bank, Leeds, West Yorkshire LS14 1DS',
  'Flat 2, 299 Roundhay Road, Leeds, West Yorkshire LS8 4HT',
  '161 Lupton Avenue, Leeds, West Yorkshire LS9 6HQ',
  'Flat 1, 299 Roundhay Road, Leeds LS8 4HT',
  'Room 1, 7 Francis Street, Leeds, West Yorkshire LS7 4BY',
  'Flat C, 164 Chapeltown Road, Leeds, West Yorkshire LS7 4EE',
  '18 Hadleys Court, Gelderd Road, Leeds LS27 7LZ',
];

/** The code-default catalogue as {address, postcode} rows. */
export function defaultRentReviewProperties(): RentReviewProperty[] {
  return DEFAULT_RENT_REVIEW_ADDRESSES.map(address => ({
    address,
    postcode: extractPostcode(address),
    active: true,
    source: 'default' as const,
  }));
}

/** Merge Firestore-managed properties over the code defaults (Firestore wins on
 *  a matching address), returning the active list sorted by address. */
export function mergeRentReviewProperties(firestore: RentReviewProperty[]): RentReviewProperty[] {
  const byKey = new Map<string, RentReviewProperty>();
  for (const p of defaultRentReviewProperties()) byKey.set(addressKey(p.address), p);
  for (const p of firestore) {
    if (!p.address) continue;
    byKey.set(addressKey(p.address), { ...p, source: 'firestore', postcode: p.postcode || extractPostcode(p.address) });
  }
  return Array.from(byKey.values())
    .filter(p => p.active !== false)
    .sort((a, b) => a.address.localeCompare(b.address));
}
