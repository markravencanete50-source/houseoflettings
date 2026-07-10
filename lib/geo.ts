// lib/geo.ts
// Geo helpers for the browse-properties radius search. Coordinates come from the
// Google Places API (already used across the site for postcode autocomplete);
// every geocode is cached in localStorage so each property location is only
// looked up once per browser.

export type LatLng = { lat: number; lng: number };

/** Great-circle distance between two points, in miles. */
export function haversineMiles(a: LatLng, b: LatLng): number {
  const R = 3958.8; // Earth radius in miles
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Human-readable distance, e.g. "0.4 miles" / "3.2 miles" / "12 miles". */
export function formatMiles(miles: number): string {
  const val = miles < 10 ? Math.round(miles * 10) / 10 : Math.round(miles);
  return `${val} mile${val === 1 ? '' : 's'}`;
}

let mapsPromise: Promise<boolean> | null = null;

/** Load the Google Maps + Places script once, resolving true when ready. */
export function loadGoogleMaps(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if ((window as any).google?.maps?.places) return Promise.resolve(true);
  if (mapsPromise) return mapsPromise;
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
  if (!apiKey) return Promise.resolve(false);

  mapsPromise = new Promise<boolean>((resolve) => {
    const done = () => resolve(!!(window as any).google?.maps?.places);
    const existing = document.querySelector('script[data-hol-gmaps]') as HTMLScriptElement | null;
    if (existing) {
      if ((window as any).google?.maps?.places) return done();
      existing.addEventListener('load', done);
      existing.addEventListener('error', () => resolve(false));
      return;
    }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    (script as any).dataset.holGmaps = '1';
    script.addEventListener('load', done);
    script.addEventListener('error', () => resolve(false));
    document.head.appendChild(script);
  });
  return mapsPromise;
}

const memCache = new Map<string, LatLng | null>();
const cacheKey = (q: string) => `hol-geo:${q.trim().toLowerCase()}`;

/**
 * Resolve a free-text location (property location string, town, postcode) to
 * coordinates via the Places "Find Place" endpoint. Returns null if it can't be
 * resolved or Maps is unavailable. Cached in-memory and in localStorage.
 */
export async function geocodeQuery(query: string): Promise<LatLng | null> {
  const q = query.trim();
  if (!q) return null;
  if (memCache.has(q)) return memCache.get(q)!;

  try {
    const raw = localStorage.getItem(cacheKey(q));
    if (raw !== null) {
      const v = JSON.parse(raw) as LatLng | null;
      memCache.set(q, v);
      return v;
    }
  } catch {
    /* localStorage unavailable — fall through to a live lookup */
  }

  const ok = await loadGoogleMaps();
  if (!ok) return null;
  const google = (window as any).google;

  // Bias UK results by appending the country when the query doesn't mention it.
  const biased = /\b(uk|united kingdom|england|gb)\b/i.test(q) ? q : `${q}, UK`;

  const result = await new Promise<LatLng | null>((resolve) => {
    try {
      const svc = new google.maps.places.PlacesService(document.createElement('div'));
      svc.findPlaceFromQuery(
        { query: biased, fields: ['geometry'] },
        (results: any[], status: string) => {
          if (
            status === google.maps.places.PlacesServiceStatus.OK &&
            results?.[0]?.geometry?.location
          ) {
            const loc = results[0].geometry.location;
            resolve({ lat: loc.lat(), lng: loc.lng() });
          } else {
            resolve(null);
          }
        }
      );
    } catch {
      resolve(null);
    }
  });

  memCache.set(q, result);
  try {
    localStorage.setItem(cacheKey(q), JSON.stringify(result));
  } catch {
    /* ignore quota / privacy-mode errors */
  }
  return result;
}
