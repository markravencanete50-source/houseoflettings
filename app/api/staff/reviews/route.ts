// app/api/staff/reviews/route.ts
// Google-reviews management for staff who have the "reviews" feature enabled.
// Mirrors the admin reviews tab rules: only 4★ and 5★ reviews can be added.
// Writes go through the Admin SDK because Firestore rules limit google_reviews
// writes to admins.
import { FieldValue } from 'firebase-admin/firestore';
import { requireStaff, getAdminDb } from '@/lib/staffApiAuth';
import { softDeleteDoc } from '@/lib/softDelete';
import { logAction } from '@/lib/activityLog';

export async function GET(request: Request) {
  try {
    const auth = await requireStaff(request, 'reviews');
    if (auth instanceof Response) return auth;

    const snapshot = await getAdminDb().collection('google_reviews')
      .orderBy('createdAt', 'desc')
      .limit(200)
      .get();

    const reviews = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
      };
    });

    return Response.json({ reviews }, { status: 200 });
  } catch (e) {
    console.error('staff/reviews GET error:', e);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireStaff(request, 'reviews');
    if (auth instanceof Response) return auth;

    const body = await request.json();
    const author_name = (body.author_name || '').toString().trim().slice(0, 80);
    const text = (body.text || '').toString().trim().slice(0, 2000);
    const rating = Number(body.rating);
    const location = body.location === 'manchester' ? 'manchester' : 'leeds';
    const relative_time_description = (body.relative_time_description || '').toString().trim().slice(0, 40);
    const profile_photo_url = (body.profile_photo_url || '').toString().trim().slice(0, 500);

    if (!author_name) return Response.json({ message: 'Reviewer name is required.' }, { status: 400 });
    if (!text) return Response.json({ message: 'Review text is required.' }, { status: 400 });
    if (rating !== 4 && rating !== 5) return Response.json({ message: 'Only 4★ and 5★ reviews can be added.' }, { status: 400 });

    const docRef = await getAdminDb().collection('google_reviews').add({
      author_name, text, rating, location, relative_time_description, profile_photo_url,
      addedBy: auth.uid,
      createdAt: FieldValue.serverTimestamp(),
    });

    await logAction(auth, 'POST', '/api/staff/reviews', { id: docRef.id, author_name, rating });
    return Response.json({
      review: { id: docRef.id, author_name, text, rating, location, relative_time_description, profile_photo_url, createdAt: new Date().toISOString() },
    }, { status: 201 });
  } catch (e) {
    console.error('staff/reviews POST error:', e);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// Removing a review is destructive, so it is ADMIN-ONLY. Staff can add reviews
// (4★/5★) but only an administrator may delete one.
export async function DELETE(request: Request) {
  try {
    const auth = await requireStaff(request, 'reviews');
    if (auth instanceof Response) return auth;
    if (auth.role !== 'admin') {
      return Response.json({ message: 'Only an administrator can delete a review.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = (searchParams.get('id') || '').trim();
    if (!id) return Response.json({ message: 'Review id is required.' }, { status: 400 });

    // Soft-delete into the 24h recycle bin so an admin can restore it.
    const result = await softDeleteDoc({ collection: 'google_reviews', docId: id, actor: auth, typeLabel: 'Review' });
    if (!result.ok) return Response.json({ message: 'Review not found.' }, { status: 404 });
    await logAction(auth, 'DELETE', '/api/staff/reviews', { id });
    return Response.json({ ok: true }, { status: 200 });
  } catch (e) {
    console.error('staff/reviews DELETE error:', e);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
