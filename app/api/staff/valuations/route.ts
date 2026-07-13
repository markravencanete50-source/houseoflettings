// app/api/staff/valuations/route.ts
// Valuation requests (read-only) for the staff dashboard.
import { requireStaff, getAdminDb } from '@/lib/staffApiAuth';

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
