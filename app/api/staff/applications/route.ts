// app/api/staff/applications/route.ts
// All tenant applications (read-only) for the staff dashboard.
import { requireStaff, getAdminDb } from '@/lib/staffApiAuth';

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
