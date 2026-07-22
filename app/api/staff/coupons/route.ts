// app/api/staff/coupons/route.ts
// One-time discount coupons for the landlord agreement, issued per-landlord
// from the staff/admin dashboards. Gated on the 'coupons' feature — deliberately
// separate from 'agreements' (which is on by default for all staff) so viewing
// signed agreements never implies the power to issue discounts. Admins always
// have it; a staff member needs it granted explicitly from the Users tab.
//   GET   — list coupons, newest first
//   POST  — { bundleId, discount, note? } -> creates a coupon and returns it.
//           The discount is a fixed £ amount off the package's setup fee
//           (e.g. £399 − £100 = £299), never a percentage.
//   PATCH — { code, action: 'deactivate' } -> cancels an unused coupon.
// Redemption happens in /api/landlord-registration inside a transaction, so a
// code can only ever be used once.
import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { requireStaff, getAdminDb } from '@/lib/staffApiAuth';
import { BUNDLES } from '@/lib/bundles';
import { setupFeeAmount } from '@/lib/agreementContent';

// Route files may only export HTTP handlers, so the collection name is
// repeated (not imported) in the other coupon-touching routes.
const COUPON_COLLECTION = 'agreementCoupons';

// Unambiguous alphabet (no 0/O, 1/I/L) so codes read out cleanly over the phone.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
function generateCode(): string {
  let s = '';
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(6));
  for (let i = 0; i < bytes.length; i++) s += ALPHABET[bytes[i] % ALPHABET.length];
  return `HOL-${s}`;
}

export async function GET(request: Request) {
  const auth = await requireStaff(request, 'coupons');
  if (auth instanceof Response) return auth;
  try {
    const snap = await getAdminDb().collection(COUPON_COLLECTION)
      .orderBy('createdAt', 'desc').limit(200).get();
    const coupons = snap.docs.map(d => {
      const c = d.data();
      return { ...c, code: d.id, createdAt: c.createdAt?.toDate?.()?.toISOString() || null, usedAt: c.usedAt?.toDate?.()?.toISOString() || null };
    });
    return NextResponse.json({ coupons }, { status: 200 });
  } catch (e) {
    console.error('staff/coupons GET error:', e);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireStaff(request, 'coupons');
  if (auth instanceof Response) return auth;
  try {
    const body = await request.json().catch(() => ({}));
    const bundle = BUNDLES.find(b => b.id === body.bundleId);
    if (!bundle) return NextResponse.json({ message: 'Choose one of the five services.' }, { status: 400 });

    const setup = setupFeeAmount(bundle);
    const discount = Math.floor(Number(body.discount));
    if (!Number.isFinite(discount) || discount <= 0) {
      return NextResponse.json({ message: 'Enter a discount amount in pounds (e.g. 100).' }, { status: 400 });
    }
    if (discount >= setup) {
      return NextResponse.json({ message: `The discount must be less than the ${bundle.setupFee} setup fee.` }, { status: 400 });
    }
    const note = (body.note || '').toString().trim().slice(0, 120);

    const db = getAdminDb();
    // Doc id = code. Retry on the (astronomically unlikely) collision.
    for (let attempt = 0; attempt < 3; attempt++) {
      const code = generateCode();
      const ref = db.collection(COUPON_COLLECTION).doc(code);
      if ((await ref.get()).exists) continue;
      const coupon = {
        bundleId: bundle.id,
        bundleLabel: bundle.label,
        setupFee: setup,
        discount,
        finalFee: setup - discount,
        note,
        status: 'active' as const,
        createdBy: auth.uid,
        createdAt: FieldValue.serverTimestamp(),
      };
      await ref.set(coupon);
      return NextResponse.json({ coupon: { ...coupon, code, createdAt: new Date().toISOString() } }, { status: 201 });
    }
    return NextResponse.json({ message: 'Could not generate a unique code. Please try again.' }, { status: 500 });
  } catch (e) {
    console.error('staff/coupons POST error:', e);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const auth = await requireStaff(request, 'coupons');
  if (auth instanceof Response) return auth;
  try {
    const body = await request.json().catch(() => ({}));
    const code = (body.code || '').toString().trim().toUpperCase();
    if (!code || body.action !== 'deactivate') {
      return NextResponse.json({ message: 'Invalid request.' }, { status: 400 });
    }
    const ref = getAdminDb().collection(COUPON_COLLECTION).doc(code);
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ message: 'Coupon not found.' }, { status: 404 });
    if (snap.data()?.status !== 'active') {
      return NextResponse.json({ message: 'Only unused coupons can be deactivated.' }, { status: 400 });
    }
    await ref.update({ status: 'cancelled', cancelledBy: auth.uid, cancelledAt: FieldValue.serverTimestamp() });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    console.error('staff/coupons PATCH error:', e);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
