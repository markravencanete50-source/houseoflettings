// app/api/staff/rent-reviews/route.ts
// Rent reviews for the staff dashboard: list (GET) and status update (PATCH).
// Both accept the Bearer ID token OR the session cookie via requireStaff, so
// they work on networks that block Google.
import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { requireStaff, getAdminDb } from '@/lib/staffApiAuth';

export async function GET(request: Request) {
  try {
    const auth = await requireStaff(request, 'rent-reviews');
    if (auth instanceof Response) return auth;

    const snapshot = await getAdminDb().collection('rentReviews')
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();

    const reviews = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        submittedAt: data.createdAt?.toDate?.()?.toISOString() || null,
      };
    });

    return NextResponse.json({ reviews }, { status: 200 });
  } catch (e) {
    console.error('staff/rent-reviews error:', e);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// Update a rent review's status (staff and admin). Body: { id, status }.
const RR_STATUSES = ['pending', 'reviewing', 'agreed', 'completed', 'cancelled'] as const;

export async function PATCH(request: Request) {
  try {
    const auth = await requireStaff(request, 'rent-reviews');
    if (auth instanceof Response) return auth;

    const body = await request.json();
    const id = (body.id || '').toString().trim();
    const status = (body.status || '').toString().trim();
    if (!id) return NextResponse.json({ message: 'Review id is required.' }, { status: 400 });
    if (!RR_STATUSES.includes(status as any)) {
      return NextResponse.json({ message: 'Invalid status.' }, { status: 400 });
    }

    await getAdminDb().collection('rentReviews').doc(id).update({
      status,
      updatedAt: FieldValue.serverTimestamp(),
      lastStatusBy: auth.uid,
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    console.error('staff/rent-reviews PATCH error:', e);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
