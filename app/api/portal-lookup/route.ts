// app/api/portal-lookup/route.ts
// Resolves an inbound portal enquiry (Zoopla / OnTheMarket) to one of our
// listings, so the Make automation can reply with a link to the actual property
// rather than a generic response.
//
// This is machine-to-machine: Make is the only caller, authenticating with a
// shared secret in `Authorization: Bearer`. It is NOT public — it exposes
// listing availability in bulk, and an unauthenticated version would let anyone
// enumerate the portfolio. The secret lives in PORTAL_LOOKUP_SECRET (Vercel).
//
// Matching is deliberately two-tier, and reports which tier fired:
//   exact    — portalRef hit. Trustworthy; safe to auto-reply with a link.
//   probable — postcode (+ bedrooms) hit from the freetext `location`. A guess.
//   none     — no confident answer. The caller must hand to a human.
// The caller decides the confidence bar; we never silently upgrade a guess.
import { createHash, timingSafeEqual } from 'node:crypto';
import { getAdminDb } from '@/lib/staffApiAuth';
import { rateLimit } from '@/lib/rateLimit';
import { normalisePostcode, outwardCode, resolveAvailability } from '@/lib/portalMatch';

const SITE_ORIGIN = 'https://www.houseoflettings.uk';

// Constant-time compare over digests, so we never leak length or prefix via
// timing. Digests are fixed-width, which timingSafeEqual requires.
function secretMatches(provided: string, expected: string): boolean {
  const a = createHash('sha256').update(provided).digest();
  const b = createHash('sha256').update(expected).digest();
  return timingSafeEqual(a, b);
}

type PropertyDoc = Record<string, any>;

function shape(id: string, d: PropertyDoc) {
  return {
    id,
    url: `${SITE_ORIGIN}/listings/${id}`,
    title: d.title ?? null,
    location: d.location ?? null,
    postcode: typeof d.location === 'string' ? normalisePostcode(d.location) : null,
    bedrooms: d.bedrooms ?? null,
    price: d.price ?? null,
    availability: resolveAvailability(d),
  };
}

export async function GET(request: Request) {
  // Generous vs the public form's 10/10min: Make retries, and a busy portal
  // morning is a legitimate burst. Still bounded, since a leaked secret
  // shouldn't hand over an unlimited scrape of the portfolio.
  const limited = rateLimit(request, 'portal-lookup', 120, 10 * 60 * 1000);
  if (limited) return limited;

  const secret = process.env.PORTAL_LOOKUP_SECRET;
  if (!secret) {
    // Fail closed. A missing secret must never degrade into an open endpoint.
    console.error('portal-lookup: PORTAL_LOOKUP_SECRET is not set');
    return Response.json({ message: 'Lookup is not configured' }, { status: 503 });
  }

  const auth = request.headers.get('authorization');
  if (!auth?.startsWith('Bearer ') || !secretMatches(auth.slice(7), secret)) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const ref = searchParams.get('ref')?.trim() || '';
    const postcodeParam = searchParams.get('postcode')?.trim() || '';
    const bedroomsParam = searchParams.get('bedrooms')?.trim() || '';
    const bedrooms = bedroomsParam ? Number(bedroomsParam) : null;

    if (!ref && !postcodeParam) {
      return Response.json({ message: 'A ref or postcode is required' }, { status: 400 });
    }

    const db = getAdminDb();

    // ── Tier 1: exact portalRef ──────────────────────────────────
    // Single-field equality on each portal's ref. Firestore auto-indexes these,
    // so no composite index is needed (this codebase avoids those deliberately).
    if (ref) {
      for (const portal of ['zoopla', 'onthemarket'] as const) {
        const snap = await db
          .collection('properties')
          .where(`portalRef.${portal}`, '==', ref)
          .limit(2)
          .get();

        if (snap.empty) continue;

        // Two listings sharing one portal ref means the data is wrong. Refuse
        // rather than pick one — a coin-flip here emails the wrong property.
        if (snap.size > 1) {
          console.error(`portal-lookup: ref ${ref} matches ${snap.size} listings on ${portal}`);
          return Response.json(
            { match: 'none', confidence: 0, reason: 'duplicate-ref', property: null, alternatives: [] },
            { status: 200 },
          );
        }

        const doc = snap.docs[0];
        const d = doc.data();
        // An inactive/pending listing isn't publicly viewable — linking to it
        // sends the applicant to a dead page. Treat as a human handoff.
        if (d.status !== 'active') {
          return Response.json(
            { match: 'none', confidence: 0, reason: 'listing-not-live', property: null, alternatives: [] },
            { status: 200 },
          );
        }

        const property = shape(doc.id, d);
        return Response.json({
          match: 'exact',
          confidence: 1,
          matchedOn: `portalRef.${portal}`,
          property,
          alternatives:
            property.availability === 'available' ? [] : await similar(db, property, 3),
        });
      }
    }

    // ── Tier 2: postcode fallback ────────────────────────────────
    // `location` is freetext with no postcode field, so this cannot be a
    // Firestore query — we scan active listings and match in memory. Fine at
    // this portfolio size; revisit if it outgrows a few hundred listings.
    const wanted = normalisePostcode(postcodeParam);
    if (!wanted) {
      return Response.json(
        { match: 'none', confidence: 0, reason: ref ? 'unknown-ref' : 'unparseable-postcode', property: null, alternatives: [] },
        { status: 200 },
      );
    }

    const active = await db.collection('properties').where('status', '==', 'active').limit(500).get();
    let hits = active.docs
      .map(doc => shape(doc.id, doc.data()))
      .filter(p => p.postcode === wanted);

    // Bedrooms disambiguates blocks of flats sharing one postcode.
    if (bedrooms !== null && Number.isFinite(bedrooms) && hits.length > 1) {
      const narrowed = hits.filter(p => p.bedrooms === bedrooms);
      if (narrowed.length) hits = narrowed;
    }

    if (hits.length !== 1) {
      // Zero hits, or several we can't separate — either way we don't know.
      return Response.json({
        match: 'none',
        confidence: 0,
        reason: hits.length ? 'ambiguous-postcode' : 'no-postcode-match',
        property: null,
        alternatives: [],
        candidateCount: hits.length,
      });
    }

    const property = hits[0];
    return Response.json({
      match: 'probable',
      // A postcode is a building, not a unit. Correct often, not always — the
      // caller should treat this as "ask a human" unless it's happy to be wrong.
      confidence: 0.6,
      matchedOn: bedrooms !== null ? 'postcode+bedrooms' : 'postcode',
      property,
      alternatives: property.availability === 'available' ? [] : await similar(db, property, 3),
    });
  } catch (error) {
    console.error('portal-lookup error:', error);
    return Response.json({ message: 'Lookup failed' }, { status: 500 });
  }
}

// Nearby available listings for the "let agreed" reply, so a dead enquiry still
// gets a useful answer. Same outward code (LS6 → LS6), nearest bedroom count
// first. Best-effort: an empty list just means that branch sends no suggestions.
async function similar(db: FirebaseFirestore.Firestore, to: ReturnType<typeof shape>, limit: number) {
  if (!to.postcode) return [];
  const outward = outwardCode(to.postcode);

  const snap = await db.collection('properties').where('status', '==', 'active').limit(500).get();
  return snap.docs
    .map(doc => shape(doc.id, doc.data()))
    .filter(p =>
      p.id !== to.id &&
      p.availability === 'available' &&
      p.postcode?.startsWith(outward),
    )
    .sort((a, b) => Math.abs((a.bedrooms ?? 0) - (to.bedrooms ?? 0)) - Math.abs((b.bedrooms ?? 0) - (to.bedrooms ?? 0)))
    .slice(0, limit);
}
