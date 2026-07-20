import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rateLimit';

// Address-by-postcode lookup with a two-provider chain:
//
//  1. Homedata (primary) — a paid PAF provider that returns the full list of
//     individual addresses at a postcode. Best UX, but metered: the free plan
//     is 100 lookups/month and returns 429 once exhausted.
//  2. Google Geocoding (fallback) — uses the site's existing Maps/Places key
//     (NEXT_PUBLIC_GOOGLE_PLACES_API_KEY, already used for reviews/geocoding).
//     It can't enumerate every building, but it reliably resolves a postcode to
//     its street + town + county, so the visitor selects that and just adds
//     their house number. This keeps address lookup working when Homedata is
//     out of quota or down.
//
// Both keys stay server-side. The route is rate limited and postcode-validated
// so it can't be used as a quota-drain proxy.

const HOMEDATA_API_KEY = process.env.HOMEDATA_API_KEY;
// Call the backend host directly. The documented homedata.co.uk/api/v1 host
// 301-redirects here, and fetch() strips the Authorization header across the
// cross-subdomain redirect — so we target the final URL to keep auth intact.
const HOMEDATA_BASE_URL = 'https://api.homedata.co.uk/api';
const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;

export type AddressResult = {
  street: string;   // first line of the address (sub-building / name / number + street)
  city: string;
  county: string;
  postcode: string;
};

type HomedataOutcome =
  | { status: 'ok'; addresses: AddressResult[] } // a definitive answer (may be empty)
  | { status: 'unavailable' };                    // quota/outage/network — try the fallback

// ─── Homedata (primary) ──────────────────────────────────────────────────────
async function lookupHomedata(rawUpper: string): Promise<HomedataOutcome> {
  if (!HOMEDATA_API_KEY) return { status: 'unavailable' };
  const postcodePath = encodeURIComponent(rawUpper.replace(/\s+/g, ''));

  try {
    const response = await fetch(`${HOMEDATA_BASE_URL}/address/postcode/${postcodePath}`, {
      headers: {
        Authorization: `Api-Key ${HOMEDATA_API_KEY}`,
        Accept: 'application/json',
        'User-Agent': 'HouseOfLettings/1.0',
      },
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      console.error(`Homedata API ${response.status}: ${body}`);
      // 404 = valid postcode, no PAF entries. Everything else (429 quota, 5xx)
      // is an outage from our point of view — let the caller try the fallback.
      return response.status === 404 ? { status: 'ok', addresses: [] } : { status: 'unavailable' };
    }

    const data = (await response.json()) as {
      postcode?: string;
      addresses?: Array<{
        address?: string;
        building_name?: string;
        building_number?: string;
        sub_building?: string;
        street?: string;
        town?: string;
      }>;
    };

    const topPostcode = data.postcode || rawUpper;
    const results: AddressResult[] = (data.addresses || []).map((a) => {
      const numberStreet = [a.building_number, a.street].filter(Boolean).join(' ');
      const firstLine =
        [a.sub_building, a.building_name, numberStreet].filter(Boolean).join(', ') ||
        a.address ||
        '';
      return { street: firstLine, city: a.town || '', county: '', postcode: topPostcode };
    });
    return { status: 'ok', addresses: results };
  } catch (error) {
    // Network reset / DNS / TLS failure (e.g. the backend dropping connections
    // once the quota is hit). Treat as an outage so the fallback runs.
    console.error('Homedata lookup error:', error);
    return { status: 'unavailable' };
  }
}

// ─── Google Geocoding (fallback) ─────────────────────────────────────────────
// Returns a single postcode-level match (street + town + county), or null.
async function lookupGoogle(rawUpper: string): Promise<AddressResult | null> {
  if (!GOOGLE_API_KEY) return null;
  try {
    const url =
      `https://maps.googleapis.com/maps/api/geocode/json` +
      `?address=${encodeURIComponent(rawUpper)}&region=gb&key=${GOOGLE_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as {
      status: string;
      results?: Array<{ address_components: Array<{ long_name: string; types: string[] }> }>;
    };
    if (data.status !== 'OK' || !data.results?.length) return null;

    const comps: Record<string, string> = {};
    for (const c of data.results[0].address_components) {
      for (const t of c.types) comps[t] = c.long_name;
    }
    const postcode = comps.postal_code || rawUpper;
    const city = comps.postal_town || comps.locality || comps.administrative_area_level_2 || '';
    const county = comps.administrative_area_level_2 || '';
    const street = comps.route || '';
    if (!city && !street) return null; // nothing useful resolved
    return { street, city, county: county === city ? '' : county, postcode };
  } catch (error) {
    console.error('Google geocode fallback error:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  const limited = rateLimit(request, 'address-lookup', 30, 10 * 60 * 1000);
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const raw = searchParams.get('postcode');

  // UK postcodes are alphanumeric with an optional space, 5–8 characters.
  // Loose enough to accept partials the form sends, strict enough to stop
  // arbitrary strings reaching the paid upstream API.
  if (!raw || raw.trim().length < 3 || !/^[A-Za-z0-9 ]{3,10}$/.test(raw.trim())) {
    return NextResponse.json(
      { error: 'Postcode is required and must be at least 3 characters.' },
      { status: 400 }
    );
  }

  const rawUpper = raw.trim().toUpperCase();

  // 1. Homedata: the full address list when it has quota.
  const homedata = await lookupHomedata(rawUpper);
  if (homedata.status === 'ok' && homedata.addresses.length > 0) {
    return NextResponse.json({ addresses: homedata.addresses });
  }

  // 2. Google fallback: postcode-level match (add house number). Runs whenever
  //    Homedata is unavailable OR returned no addresses at all.
  const google = await lookupGoogle(rawUpper);
  if (google) {
    return NextResponse.json({ addresses: [google], source: 'google', partial: true });
  }

  // Homedata answered but had nothing, and Google couldn't resolve it either.
  if (homedata.status === 'ok') {
    return NextResponse.json({ addresses: [] });
  }

  // Everything is unavailable — the UI falls back to manual entry.
  return NextResponse.json({ addresses: [], unavailable: true });
}
