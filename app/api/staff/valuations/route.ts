// app/api/staff/valuations/route.ts
// Valuation requests for the staff dashboard: list (GET) and admin-only delete
// (DELETE, soft-deletes into the 24h recycle bin).
import { requireStaff, getAdminDb } from '@/lib/staffApiAuth';
import { softDeleteDoc } from '@/lib/softDelete';

export async function GET(request: Request) {
  try {
    const auth = await requireStaff(request, 'valuations');
    if (auth instanceof Response) return auth;

    const snapshot = await getAdminDb().collection('valuationRequests')
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();

    const valuations = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
      };
    });

    return Response.json({ valuations }, { status: 200 });
  } catch (e) {
    console.error('staff/valuations error:', e);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// Delete a valuation request. ADMIN-ONLY, soft-deletes into the 24h recycle bin.
export async function DELETE(request: Request) {
  try {
    const auth = await requireStaff(request, 'valuations');
    if (auth instanceof Response) return auth;
    if (auth.role !== 'admin') {
      return Response.json({ message: 'Only an administrator can delete a valuation.' }, { status: 403 });
    }
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return Response.json({ message: 'A valuation id is required' }, { status: 400 });

    const result = await softDeleteDoc({ collection: 'valuationRequests', docId: id, actor: auth, typeLabel: 'Valuation' });
    if (!result.ok) return Response.json({ message: 'Valuation not found' }, { status: 404 });
    return Response.json({ ok: true }, { status: 200 });
  } catch (e) {
    console.error('staff/valuations DELETE error:', e);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
