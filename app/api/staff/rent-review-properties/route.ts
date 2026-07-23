// app/api/staff/rent-review-properties/route.ts
// Manage the rent-review property catalogue from the admin/staff dashboards, so
// the office can add or edit the properties shown on the rent-review form
// WITHOUT a code change. Gated behind the 'rent-reviews' feature.
import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { requireStaff, getAdminDb } from '@/lib/staffApiAuth';
import { softDeleteDoc } from '@/lib/softDelete';
import { extractPostcode } from '@/lib/rentReviewProperties';

export async function GET(request: Request) {
  try {
    const auth = await requireStaff(request, 'rent-reviews');
    if (auth instanceof Response) return auth;

    const snap = await getAdminDb().collection('rentReviewProperties').orderBy('address').get();
    const properties = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ properties }, { status: 200 });
  } catch (e) {
    console.error('staff/rent-review-properties GET error:', e);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireStaff(request, 'rent-reviews');
    if (auth instanceof Response) return auth;

    const body = await request.json().catch(() => null);
    const address = String(body?.address || '').trim();
    if (!address) return NextResponse.json({ message: 'A property address is required' }, { status: 400 });

    const doc = {
      address,
      postcode: String(body?.postcode || '').trim().toUpperCase() || extractPostcode(address),
      currentRent: String(body?.currentRent || '').trim(),
      proposedRent: String(body?.proposedRent || '').trim(),
      effectiveDate: String(body?.effectiveDate || '').trim(),
      active: body?.active !== false,
      createdAt: FieldValue.serverTimestamp(),
      createdByUid: auth.uid,
    };
    const ref = await getAdminDb().collection('rentReviewProperties').add(doc);
    return NextResponse.json({ id: ref.id, ...doc, createdAt: null }, { status: 201 });
  } catch (e) {
    console.error('staff/rent-review-properties POST error:', e);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireStaff(request, 'rent-reviews');
    if (auth instanceof Response) return auth;

    const body = await request.json().catch(() => null);
    const id = String(body?.id || '').trim();
    if (!id) return NextResponse.json({ message: 'A property id is required' }, { status: 400 });

    const { id: _drop, createdAt, createdByUid, ...rest } = body as Record<string, unknown>;
    const updates: Record<string, unknown> = {};
    for (const k of ['address', 'postcode', 'currentRent', 'proposedRent', 'effectiveDate', 'active']) {
      if (k in rest) updates[k] = k === 'active' ? rest[k] !== false : String(rest[k] ?? '').trim();
    }
    if ('address' in updates && !('postcode' in updates)) updates.postcode = extractPostcode(String(updates.address));
    if (Object.keys(updates).length === 0) return NextResponse.json({ message: 'No fields to update' }, { status: 400 });
    updates.updatedAt = FieldValue.serverTimestamp();

    await getAdminDb().collection('rentReviewProperties').doc(id).update(updates);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    console.error('staff/rent-review-properties PATCH error:', e);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// Removing a rent-review property is destructive, so it is ADMIN-ONLY. Staff can
// add, edit and (de)activate entries but only an administrator may delete one.
export async function DELETE(request: Request) {
  try {
    const auth = await requireStaff(request, 'rent-reviews');
    if (auth instanceof Response) return auth;
    if (auth.role !== 'admin') {
      return NextResponse.json({ message: 'Only an administrator can delete a property.' }, { status: 403 });
    }

    const id = new URL(request.url).searchParams.get('id');
    if (!id) return NextResponse.json({ message: 'A property id is required' }, { status: 400 });

    // Soft-delete into the 24h recycle bin so an admin can restore it.
    const result = await softDeleteDoc({ collection: 'rentReviewProperties', docId: id, actor: auth, typeLabel: 'Rent-review property' });
    if (!result.ok) return NextResponse.json({ message: 'Property not found' }, { status: 404 });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    console.error('staff/rent-review-properties DELETE error:', e);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
