// app/api/staff/orders/route.ts
// Additional-services orders (read-only) for the staff dashboard.
import { requireStaff, getAdminDb } from '@/lib/staffApiAuth';

export async function GET(request: Request) {
  try {
    const auth = await requireStaff(request, 'orders');
    if (auth instanceof Response) return auth;

    const snapshot = await getAdminDb().collection('serviceOrders')
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();

    const orders = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
      };
    });

    return Response.json({ orders }, { status: 200 });
  } catch (e) {
    console.error('staff/orders error:', e);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
