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
import { softDeleteDoc } from '@/lib/softDelete';

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

// Update a property (availability, active/inactive status, or a full edit from
// the form). Server-side with the Admin SDK for the same reason POST exists:
// staff are usually cookie-authenticated with no Firebase client user, so a
// browser Firestore write would be rejected by the rules.
export async function PATCH(request: Request) {
  try {
    const auth = await requireStaff(request, 'properties');
    if (auth instanceof Response) return auth;

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object' || !body.id) {
      return Response.json({ message: 'A property id is required' }, { status: 400 });
    }

    // id and provenance fields are ours to control, never the client's.
    const { id, createdAt, createdByUid, createdByRole, ...updates } = body as Record<string, unknown>;
    if ('price' in updates) {
      const p = Number(updates.price);
      if (Number.isFinite(p) && p > 0) updates.price = p; else delete updates.price;
    }
    if ('images' in updates && !Array.isArray(updates.images)) delete updates.images;
    if (Object.keys(updates).length === 0) {
      return Response.json({ message: 'No fields to update' }, { status: 400 });
    }
    updates.updatedAt = FieldValue.serverTimestamp();
    updates.updatedByUid = auth.uid;

    await getAdminDb().collection('properties').doc(String(id)).update(updates);
    return Response.json({ ok: true }, { status: 200 });
  } catch (e) {
    console.error('staff/properties PATCH error:', e);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// Deleting a listing is destructive and irreversible, so it is ADMIN-ONLY.
// Staff can create, edit and change a property's status/availability, but only
// an administrator may remove one outright.
export async function DELETE(request: Request) {
  try {
    const auth = await requireStaff(request, 'properties');
    if (auth instanceof Response) return auth;
    if (auth.role !== 'admin') {
      return Response.json({ message: 'Only an administrator can delete a property.' }, { status: 403 });
    }

    const id = new URL(request.url).searchParams.get('id');
    if (!id) return Response.json({ message: 'A property id is required' }, { status: 400 });

    // Soft-delete into the 24h recycle bin instead of hard-deleting, so an admin
    // can restore it from the Deleted tab.
    const result = await softDeleteDoc({ collection: 'properties', docId: id, actor: auth, typeLabel: 'Property' });
    if (!result.ok) return Response.json({ message: 'Property not found' }, { status: 404 });
    return Response.json({ ok: true }, { status: 200 });
  } catch (e) {
    console.error('staff/properties DELETE error:', e);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    // The property list also feeds the Rent Review tool, so either permission
    // grants read access here.
    let auth = await requireStaff(request, 'properties');
    if (auth instanceof Response) {
      const viaRentReview = await requireStaff(request, 'rent-reviews');
      if (viaRentReview instanceof Response) return auth;
      auth = viaRentReview;
    }

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
