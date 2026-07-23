// app/api/staff/applications/route.ts
// All tenant applications for the staff dashboard: list (GET) and admin-only
// delete (DELETE, soft-deletes into the 24h recycle bin).
import { requireStaff, getAdminDb } from '@/lib/staffApiAuth';
import { softDeleteDoc } from '@/lib/softDelete';

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
    return Response.json({ ok: true }, { status: 200 });
  } catch (e) {
    console.error('staff/applications DELETE error:', e);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
