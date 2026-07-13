// app/api/staff/properties/route.ts
// All properties (read-only) for the staff dashboard.
import { requireStaff, getAdminDb } from '@/lib/staffApiAuth';

export async function GET(request: Request) {
  try {
    const auth = await requireStaff(request, 'properties');
    if (auth instanceof Response) return auth;

    const snapshot = await getAdminDb().collection('properties')
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();

    const properties = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
      };
    });

    return Response.json({ properties }, { status: 200 });
  } catch (e) {
    console.error('staff/properties error:', e);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
