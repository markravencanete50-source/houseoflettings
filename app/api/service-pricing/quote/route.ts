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

export async function GET(request: Request) {
  const limited = rateLimit(request, 'pricing-quote-get', 120, 10 * 60 * 1000);
  if (limited) return limited;
  const id = new URL(request.url).searchParams.get('id') || '';
  if (!/^[a-f0-9]{24,48}$/.test(id)) {
    return NextResponse.json({ message: 'Unknown quote.' }, { status: 404 });
  }
  try {
    const snap = await getAdminDb().collection(COLLECTION).doc(id).get();
    if (!snap.exists) return NextResponse.json({ message: 'Unknown quote.' }, { status: 404 });
    const data = snap.data() || {};
    const overrides = sanitizePricingOverrides(data.overrides || {}, BUNDLE_IDS);
    return NextResponse.json({ overrides, label: (data.label || '').toString().slice(0, 80) }, { status: 200 });
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
    if (Object.keys(overrides).length === 0) {
      return NextResponse.json({ message: 'Set at least one custom price before creating a link.' }, { status: 400 });
    }
    const label = (body.label || '').toString().trim().slice(0, 80);
    const id = randomBytes(16).toString('hex'); // 32 hex chars — unguessable slug
    await getAdminDb().collection(COLLECTION).doc(id).set({
      overrides,
      label,
      createdBy: auth.uid,
      createdAt: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ id, url: quoteUrl(id), overrides, label }, { status: 200 });
  } catch (e) {
    console.error('pricing-quote POST error:', e);
    return NextResponse.json({ message: 'Could not create the link. Please try again.' }, { status: 500 });
  }
}
