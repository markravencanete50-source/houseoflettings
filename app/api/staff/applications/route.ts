// app/api/staff/applications/route.ts
// All tenant applications for the staff dashboard: list (GET) and admin-only
// delete (DELETE, soft-deletes into the 24h recycle bin).
import { FieldValue } from 'firebase-admin/firestore';
import { requireStaff, getAdminDb } from '@/lib/staffApiAuth';
import { softDeleteDoc } from '@/lib/softDelete';
import { logAction } from '@/lib/activityLog';
import { normalisePostcode } from '@/lib/portalMatch';
import { ALL_STAGES } from '@/lib/applicationStages';

export async function GET(request: Request) {
  try {
    const auth = await requireStaff(request, 'applications');
    if (auth instanceof Response) return auth;

    const snapshot = await getAdminDb().collection('tenantApplications')
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();

    const applications = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        submittedAt: data.createdAt?.toDate?.()?.toISOString() || null,
      };
    });

    return Response.json({ applications }, { status: 200 });
  } catch (e) {
    console.error('staff/applications error:', e);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// Update a tenant application: assign it to a property (so it reaches the right
// landlord portal) and/or move it along the landlord-visible stage pipeline.
// Body: { id, stage?, status?, propertyId?, landlordId?, propertyAddress? }.
export async function PATCH(request: Request) {
  try {
    const auth = await requireStaff(request, 'applications');
    if (auth instanceof Response) return auth;

    const body = await request.json().catch(() => ({}));
    const id = (body.id || '').toString().trim();
    if (!id) return Response.json({ message: 'An application id is required.' }, { status: 400 });

    const updates: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp(), lastEditBy: auth.uid };
    if (body.stage !== undefined) {
      const stage = String(body.stage || '').trim();
      if (!ALL_STAGES.includes(stage as any)) return Response.json({ message: 'Invalid stage.' }, { status: 400 });
      updates.stage = stage;
    }
    if (body.status !== undefined) updates.status = String(body.status || '').slice(0, 40);
    if (body.propertyId !== undefined) updates.propertyId = String(body.propertyId || '').slice(0, 200);
    if (body.landlordId !== undefined) updates.landlordId = String(body.landlordId || '').slice(0, 200);
    if (body.propertyAddress !== undefined) {
      const addr = String(body.propertyAddress || '').slice(0, 400);
      updates.assignedPropertyAddress = addr;
      updates.postcode = normalisePostcode(addr) || '';
    }
    if (Object.keys(updates).length <= 2) return Response.json({ message: 'No fields to update.' }, { status: 400 });

    await getAdminDb().collection('tenantApplications').doc(id).update(updates);
    await logAction(auth, 'PATCH', '/api/staff/applications', { id, stage: updates.stage, propertyId: updates.propertyId });
    return Response.json({ ok: true }, { status: 200 });
  } catch (e) {
    console.error('staff/applications PATCH error:', e);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// Delete a tenant application. ADMIN-ONLY, and soft-deletes into the 24h recycle
// bin so it can be restored from the admin Deleted tab.
export async function DELETE(request: Request) {
  try {
    const auth = await requireStaff(request, 'applications');
    if (auth instanceof Response) return auth;
    if (auth.role !== 'admin') {
      return Response.json({ message: 'Only an administrator can delete an application.' }, { status: 403 });
    }
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return Response.json({ message: 'An application id is required' }, { status: 400 });

    const result = await softDeleteDoc({ collection: 'tenantApplications', docId: id, actor: auth, typeLabel: 'Application' });
    if (!result.ok) return Response.json({ message: 'Application not found' }, { status: 404 });
    await logAction(auth, 'DELETE', '/api/staff/applications', { id });
    return Response.json({ ok: true }, { status: 200 });
  } catch (e) {
    console.error('staff/applications DELETE error:', e);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
