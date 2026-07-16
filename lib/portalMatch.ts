// lib/portalMatch.ts
// Pure matching helpers for /api/portal-lookup. Kept out of the route file so
// they can be tested without Firestore credentials — the route itself can only
// run with the Admin SDK configured, which is Vercel-only.

export type Availability = 'available' | 'pending' | 'let-agreed' | 'unknown';

// Outward + inward code, tolerating a missing space ("LS6 2AA" / "LS62AA").
// Anchored on word boundaries so it finds the postcode inside a freetext
// address like "12 Hyde Park Road, Leeds, LS6 1AA".
const UK_POSTCODE = /\b([A-Z]{1,2}\d[A-Z\d]?)\s*(\d[A-Z]{2})\b/i;

/** Extracts a postcode from freetext, normalised to uppercase, no space. */
export function normalisePostcode(raw: string): string | null {
  if (!raw) return null;
  const m = raw.match(UK_POSTCODE);
  return m ? `${m[1]}${m[2]}`.toUpperCase() : null;
}

/** The outward code only ("LS62AA" → "LS6"), for same-area suggestions. */
export function outwardCode(postcode: string): string {
  return postcode.replace(/\d[A-Z]{2}$/, '');
}

/**
 * `availability` is the field the admin controls, but it is optional — older
 * listings predate it and carry only the legacy `letAgreed` boolean, and the
 * oldest carry neither. Never assume "missing" means "available": that is the
 * one wrong guess that emails a live booking link for a let property.
 */
export function resolveAvailability(d: Record<string, any>): Availability {
  if (d.availability === 'available' || d.availability === 'pending' || d.availability === 'let-agreed') {
    return d.availability;
  }
  if (typeof d.letAgreed === 'boolean') return d.letAgreed ? 'let-agreed' : 'available';
  return 'unknown';
}
