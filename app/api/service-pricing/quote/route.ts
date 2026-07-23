// app/api/service-pricing/quote/route.ts
// BESPOKE (per-landlord) service pricing links. Distinct from the GLOBAL
// settings/servicePricing overrides — creating a quote NEVER changes the prices
// shown on the public registration form. Only a landlord who opens the unique
// link (…/landlord-registration/apply?quote=<id>) sees these prices.
//
//   POST — ADMIN ONLY: store one landlord's overrides in pricingQuotes/{id} and
//          return the shareable URL. The id is an unguessable random slug.
//   GET ?id= — public: return that quote's overrides + label so the form and the
//          agreement route can apply them. 404 if the id is unknown.
import { NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { requireStaff, getAdminDb } from '@/lib/staffApiAuth';
import { BUNDLES } from '@/lib/bundles';
import { sanitizePricingOverrides } from '@/lib/pricingOverrides';
import { rateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

const COLLECTION = 'pricingQuotes';
const BUNDLE_IDS = BUNDLES.map(b => b.id);
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.houseoflettings.uk';

function quoteUrl(id: string): string {
  return `${SITE_URL}/landlord-registration/apply?quote=${id}`;
}

// Optional per-link service allow-list: which packages appear on the form for
// this one link. Returns a stable, de-duplicated list of valid bundle ids.
// A list covering every bundle is treated as "no restriction" (empty), so the
// stored quote only carries a `services` field when it genuinely limits the set.
function sanitizeServices(raw: any, validIds: string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const wanted = new Set(raw.filter((v): v is string => typeof v === 'string'));
  const picked = validIds.filter(id => wanted.has(id));
  return picked.length >= validIds.length ? [] : picked; // all selected = no restriction
}

// Firestore admin Timestamp → epoch millis (or null). Safe across the shapes a
// serverTimestamp can take (Timestamp instance or a plain {_seconds} object).
function tsToMillis(ts: any): number | null {
  if (!ts) return null;
  if (typeof ts.toMillis === 'function') return ts.toMillis();
  if (typeof ts._seconds === 'number') return ts._seconds * 1000;
  return null;
}

export async function GET(request: Request) {
  const url = new URL(request.url);

  // No ?id= → ADMIN history list of every generated link (label, prices,
  // services, created date and whether it has been used yet). Admin only.
  if (!url.searchParams.has('id')) {
    const auth = await requireStaff(request, 'agreements');
    if (auth instanceof Response) return auth;
    if (auth.role !== 'admin') {
      return NextResponse.json({ message: 'Only an administrator can view pricing links.' }, { status: 403 });
    }
    try {
      const snap = await getAdminDb().collection(COLLECTION).orderBy('createdAt', 'desc').limit(100).get();
      const quotes = snap.docs.map(doc => {
        const data = doc.data() || {};
        return {
          id: doc.id,
          label: (data.label || '').toString().slice(0, 80),
          url: quoteUrl(doc.id),
          createdAt: tsToMillis(data.createdAt),
          used: Boolean(data.redeemedAt),
          redeemedAt: tsToMillis(data.redeemedAt),
          services: sanitizeServices(data.services, BUNDLE_IDS), // [] = all services
          overrides: sanitizePricingOverrides(data.overrides || {}, BUNDLE_IDS), // {} = standard prices
        };
      });
      return NextResponse.json({ quotes }, { status: 200 });
    } catch (e) {
      console.error('pricing-quote list failed:', e);
      return NextResponse.json({ message: 'Could not load the link history.' }, { status: 500 });
    }
  }

  const limited = rateLimit(request, 'pricing-quote-get', 120, 10 * 60 * 1000);
  if (limited) return limited;
  const id = url.searchParams.get('id') || '';
  if (!/^[a-f0-9]{24,48}$/.test(id)) {
    return NextResponse.json({ message: 'Unknown quote.' }, { status: 404 });
  }
  try {
    const snap = await getAdminDb().collection(COLLECTION).doc(id).get();
    if (!snap.exists) return NextResponse.json({ message: 'Unknown quote.' }, { status: 404 });
    const data = snap.data() || {};
    const label = (data.label || '').toString().slice(0, 80);
    // One-time link: once redeemed on a completed registration it no longer
    // carries custom prices or a limited service set. The form falls back to the
    // standard prices and shows every service.
    if (data.redeemedAt) {
      return NextResponse.json({ used: true, overrides: {}, label }, { status: 200 });
    }
    const overrides = sanitizePricingOverrides(data.overrides || {}, BUNDLE_IDS);
    const services = sanitizeServices(data.services, BUNDLE_IDS);
    const payload: { overrides: typeof overrides; label: string; services?: string[] } = { overrides, label };
    if (services.length > 0) payload.services = services; // only when the link limits the set
    return NextResponse.json(payload, { status: 200 });
  } catch (e) {
    console.error('pricing-quote GET failed:', e);
    return NextResponse.json({ message: 'Unknown quote.' }, { status: 404 });
  }
}

export async function POST(request: Request) {
  const auth = await requireStaff(request, 'agreements');
  if (auth instanceof Response) return auth;
  if (auth.role !== 'admin') {
    return NextResponse.json({ message: 'Only an administrator can create pricing links.' }, { status: 403 });
  }
  try {
    const body = await request.json().catch(() => ({}));
    const overrides = sanitizePricingOverrides(body.overrides || {}, BUNDLE_IDS);
    const services = sanitizeServices(body.services, BUNDLE_IDS);
    // A link is "bespoke" if it carries custom prices, limits which services
    // appear, or both. Guard against a link that does neither.
    if (Object.keys(overrides).length === 0 && services.length === 0) {
      return NextResponse.json(
        { message: 'Set at least one custom price, or limit which services appear, before creating a link.' },
        { status: 400 },
      );
    }
    const label = (body.label || '').toString().trim().slice(0, 80);
    const id = randomBytes(16).toString('hex'); // 32 hex chars — unguessable slug
    const doc: Record<string, unknown> = {
      overrides,
      label,
      createdBy: auth.uid,
      createdAt: FieldValue.serverTimestamp(),
    };
    if (services.length > 0) doc.services = services; // only store a real restriction
    await getAdminDb().collection(COLLECTION).doc(id).set(doc);
    return NextResponse.json({ id, url: quoteUrl(id), overrides, label, services }, { status: 200 });
  } catch (e) {
    console.error('pricing-quote POST error:', e);
    return NextResponse.json({ message: 'Could not create the link. Please try again.' }, { status: 500 });
  }
}
