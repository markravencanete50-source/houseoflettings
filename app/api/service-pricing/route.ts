// app/api/service-pricing/route.ts
// Admin-editable service pricing overrides (settings/servicePricing).
//   GET — public: the current overrides, so the registration form, pricing page
//         and agreement documents can apply them.
//   PUT — ADMIN ONLY: save the overrides (setup fee + management % per bundle).
import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { requireStaff, getAdminDb } from '@/lib/staffApiAuth';
import { BUNDLES } from '@/lib/bundles';
import { sanitizePricingOverrides } from '@/lib/pricingOverrides';
import { rateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

const COLLECTION = 'settings';
const DOC = 'servicePricing';
const BUNDLE_IDS = BUNDLES.map(b => b.id);

async function loadOverrides() {
  try {
    const snap = await getAdminDb().collection(COLLECTION).doc(DOC).get();
    if (!snap.exists) return {};
    const data = snap.data() || {};
    return sanitizePricingOverrides(data.overrides || data, BUNDLE_IDS);
  } catch (e) {
    console.error('service-pricing load failed:', e);
    return {};
  }
}

export async function GET(request: Request) {
  const limited = rateLimit(request, 'service-pricing-get', 120, 10 * 60 * 1000);
  if (limited) return limited;
  const overrides = await loadOverrides();
  return NextResponse.json({ overrides }, { status: 200 });
}

export async function PUT(request: Request) {
  const auth = await requireStaff(request, 'agreements');
  if (auth instanceof Response) return auth;
  if (auth.role !== 'admin') {
    return NextResponse.json({ message: 'Only an administrator can change service pricing.' }, { status: 403 });
  }
  try {
    const body = await request.json().catch(() => ({}));
    const overrides = sanitizePricingOverrides(body.overrides || {}, BUNDLE_IDS);
    await getAdminDb().collection(COLLECTION).doc(DOC).set(
      { overrides, updatedAt: FieldValue.serverTimestamp(), updatedBy: auth.uid },
      { merge: false },
    );
    return NextResponse.json({ ok: true, overrides }, { status: 200 });
  } catch (e) {
    console.error('service-pricing PUT error:', e);
    return NextResponse.json({ message: 'Could not save pricing. Please try again.' }, { status: 500 });
  }
}
