// app/api/staff/maintenance/route.ts
// Maintenance requests for the staff dashboard: list (GET) and status update
// (PATCH). Both accept the Bearer ID token OR the session cookie via
// requireStaff, so they work on networks that block Google.
import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { requireStaff, getAdminDb } from '@/lib/staffApiAuth';
import { softDeleteDoc } from '@/lib/softDelete';
import { logAction } from '@/lib/activityLog';

export async function GET(request: Request) {
  try {
    const auth = await requireStaff(request, 'maintenance');
    if (auth instanceof Response) return auth;

    const snapshot = await getAdminDb().collection('maintenanceRequests')
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();

    const requests = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        submittedAt: data.createdAt?.toDate?.()?.toISOString() || null,
      };
    });

    return NextResponse.json({ requests }, { status: 200 });
  } catch (e) {
    console.error('staff/maintenance error:', e);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// Update a maintenance request's status (staff and admin). Body: { id, status }.
const MAINT_STATUSES = ['open', 'in-progress', 'resolved', 'cancelled'] as const;

export async function PATCH(request: Request) {
  try {
    const auth = await requireStaff(request, 'maintenance');
    if (auth instanceof Response) return auth;

    const body = await request.json();
    const id = (body.id || '').toString().trim();
    const status = (body.status || '').toString().trim();
    if (!id) return NextResponse.json({ message: 'Request id is required.' }, { status: 400 });
    if (!MAINT_STATUSES.includes(status as any)) {
      return NextResponse.json({ message: 'Invalid status.' }, { status: 400 });
    }

    await getAdminDb().collection('maintenanceRequests').doc(id).update({
      status,
      updatedAt: FieldValue.serverTimestamp(),
      lastStatusBy: auth.uid,
    });

    await logAction(auth, 'PATCH', '/api/staff/maintenance', { id, status });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    console.error('staff/maintenance PATCH error:', e);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// Delete a maintenance request. ADMIN-ONLY, soft-deletes into the 24h recycle bin.
export async function DELETE(request: Request) {
  try {
    const auth = await requireStaff(request, 'maintenance');
    if (auth instanceof Response) return auth;
    if (auth.role !== 'admin') {
      return NextResponse.json({ message: 'Only an administrator can delete a maintenance request.' }, { status: 403 });
    }
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return NextResponse.json({ message: 'A request id is required' }, { status: 400 });

    const result = await softDeleteDoc({ collection: 'maintenanceRequests', docId: id, actor: auth, typeLabel: 'Maintenance request' });
    if (!result.ok) return NextResponse.json({ message: 'Request not found' }, { status: 404 });
    await logAction(auth, 'DELETE', '/api/staff/maintenance', { id });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    console.error('staff/maintenance DELETE error:', e);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
