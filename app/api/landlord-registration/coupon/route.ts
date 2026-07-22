// app/api/landlord-registration/coupon/route.ts
// Public, rate-limited check of a discount coupon (?code=&bundleId=) used by
// the registration form to preview the discount before signing. Read-only — the
// coupon is only marked used inside the /api/landlord-registration transaction.
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { rateLimit } from '@/lib/rateLimit';

const COUPON_COLLECTION = 'agreementCoupons';

function db() {
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  }
  return getFirestore();
}

export async function GET(request: Request) {
  const limited = rateLimit(request, 'agreement-coupon', 20, 10 * 60 * 1000);
  if (limited) return limited;
  try {
    const url = new URL(request.url);
    const code = (url.searchParams.get('code') || '').trim().toUpperCase();
    const bundleId = (url.searchParams.get('bundleId') || '').trim();
    if (!code) return Response.json({ message: 'Enter a coupon code.' }, { status: 400 });

    const snap = await db().collection(COUPON_COLLECTION).doc(code).get();
    const c = snap.data();
    if (!snap.exists || !c) return Response.json({ message: 'That coupon code was not found.' }, { status: 404 });
    if (c.status === 'used') return Response.json({ message: 'This coupon has already been used.' }, { status: 400 });
    if (c.status !== 'active') return Response.json({ message: 'This coupon is no longer active.' }, { status: 400 });
    if (bundleId && c.bundleId !== bundleId) {
      return Response.json({ message: `This coupon is for the ${c.bundleLabel} package. Select that service to use it.` }, { status: 400 });
    }
    return Response.json({
      coupon: { code, bundleId: c.bundleId, bundleLabel: c.bundleLabel, discount: c.discount, setupFee: c.setupFee, finalFee: c.finalFee },
    }, { status: 200 });
  } catch (e) {
    console.error('registration coupon check error:', e);
    return Response.json({ message: 'Could not check the coupon. Please try again.' }, { status: 500 });
  }
}
