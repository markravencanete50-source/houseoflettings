// app/api/staff/agreements/route.ts
// Signed landlord management agreements for the staff dashboard: list (GET) and
// status update (PATCH). Both accept the Bearer ID token OR the session cookie
// via requireStaff, so they work on networks that block Google.
import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { requireStaff, getAdminDb } from '@/lib/staffApiAuth';

export async function GET(request: Request) {
  try {
    const auth = await requireStaff(request, 'agreements');
    if (auth instanceof Response) return auth;

    const snapshot = await getAdminDb().collection('landlordAgreements')
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();

    const agreements = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
      };
    });

    return NextResponse.json({ agreements }, { status: 200 });
  } catch (e) {
    console.error('staff/agreements error:', e);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// Lifecycle of a signed agreement: the landlord signs (signed) → the office
// countersigns and it goes live (active) → completed, or cancelled.
const AGREEMENT_STATUSES = ['signed', 'countersigned', 'active', 'completed', 'cancelled'] as const;

export async function PATCH(request: Request) {
  try {
    const auth = await requireStaff(request, 'agreements');
    if (auth instanceof Response) return auth;

    const body = await request.json();
    const id = (body.id || '').toString().trim();
    const status = (body.status || '').toString().trim();
    if (!id) return NextResponse.json({ message: 'Agreement id is required.' }, { status: 400 });
    if (!AGREEMENT_STATUSES.includes(status as any)) {
      return NextResponse.json({ message: 'Invalid status.' }, { status: 400 });
    }

    await getAdminDb().collection('landlordAgreements').doc(id).update({
      status,
      updatedAt: FieldValue.serverTimestamp(),
      lastStatusBy: auth.uid,
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    console.error('staff/agreements PATCH error:', e);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
