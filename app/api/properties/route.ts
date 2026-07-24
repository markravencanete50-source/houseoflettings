// app/api/properties/route.ts
// Public read of the property listings via the Admin SDK, so browsing never
// depends on client-side Firestore security rules. The client `properties` read
// started returning permission-denied after a rules republish drifted from the
// repo's `allow read: if true`; reading through this server route makes the
// listings, branches, homepage and property-detail pages work regardless.
//   GET            -> { properties: [...] }  active listings (for browse)
//   GET ?id=<id>   -> { property: {...} }    a single listing (any status)
import { getAdminDb } from '@/lib/staffApiAuth';

export const dynamic = 'force-dynamic';

function tsSeconds(ts: any): number | null {
  if (!ts) return null;
  if (typeof ts.toMillis === 'function') return Math.floor(ts.toMillis() / 1000);
  if (typeof ts._seconds === 'number') return ts._seconds;
  if (typeof ts.seconds === 'number') return ts.seconds;
  return null;
}

// Firestore Timestamps don't survive JSON as the client expects ({seconds}),
// so normalise the fields the client sorts/reads on.
function serialize(id: string, data: any) {
  const out: any = { id, ...data };
  const cs = tsSeconds(data?.createdAt);
  out.createdAt = cs != null ? { seconds: cs } : null;
  if (data?.updatedAt !== undefined) {
    const us = tsSeconds(data.updatedAt);
    out.updatedAt = us != null ? { seconds: us } : null;
  }
  return out;
}

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get('id');
  try {
    const db = getAdminDb();
    if (id) {
      const snap = await db.collection('properties').doc(id).get();
      const pd = snap.data() as any;
      // Not public: missing, demo, or not an active advert (e.g. status 'unlisted').
      if (!snap.exists || pd?.demo === true || (pd?.status && pd.status !== 'active')) return Response.json({ property: null }, { status: 404 });
      return Response.json({ property: serialize(snap.id, snap.data()) }, { status: 200 });
    }
    const snap = await db.collection('properties').where('status', '==', 'active').get();
    // Demo/test properties are portal-only — never surface them on the public site.
    const properties = snap.docs.filter(d => (d.data() as any)?.demo !== true).map(d => serialize(d.id, d.data()));
    return Response.json({ properties }, { status: 200 });
  } catch (e) {
    console.error('GET /api/properties failed:', e);
    return Response.json({ properties: [], property: null, message: 'Could not load properties.' }, { status: 500 });
  }
}
