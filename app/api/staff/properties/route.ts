// app/api/staff/properties/route.ts
// Properties for the staff dashboard: GET lists them, POST creates one.
//
// POST exists because a staff member is often signed in by session cookie only,
// with no Firebase client SDK user (see the note in app/dashboard/staff/page.tsx:
// their browser can't reach Google, which is why login goes through our server).
// A browser write via addDoc() then has request.auth == null, so the Firestore
// rules reject it — and when Firestore is unreachable the write never settles at
// all, which is why posting appeared to hang forever. Creating server-side with
// firebase-admin authenticates off the same cookie every other staff route uses.
import { FieldValue } from 'firebase-admin/firestore';
import { requireStaff, getAdminDb } from '@/lib/staffApiAuth';

export async function POST(request: Request) {
  try {
    const auth = await requireStaff(request, 'post');
    if (auth instanceof Response) return auth;

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return Response.json({ message: 'Invalid request body' }, { status: 400 });
    }

    const title = String(body.title || '').trim();
    const location = String(body.location || '').trim();
    const price = Number(body.price);
    if (!title || !location || !Number.isFinite(price) || price <= 0) {
      return Response.json({ message: 'Title, location and a valid price are required' }, { status: 400 });
    }

    // Never trust the client for these: the writer is whoever the verified
    // session says it is, and id/createdAt are ours to set.
    const { id, createdAt, ...rest } = body as Record<string, unknown>;

    const docRef = await getAdminDb().collection('properties').add({
      ...rest,
      title,
      location,
      price,
      images: Array.isArray(body.images) ? body.images : [],
      landlordId: body.landlordId || auth.uid,
      landlordName: body.landlordName || '',
      status: body.status || 'active',
      createdAt: FieldValue.serverTimestamp(),
      createdByUid: auth.uid,
      createdByRole: auth.role,
    });

    return Response.json({ id: docRef.id }, { status: 201 });
  } catch (e) {
    console.error('staff/properties POST error:', e);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}

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
