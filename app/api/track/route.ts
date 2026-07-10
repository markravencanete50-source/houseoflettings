// app/api/track/route.ts
// First-party, privacy-light website analytics. Each public page view is rolled
// up into a single aggregate document (analytics/summary) so the admin dashboard
// can read one doc: total views, unique visitors, and breakdowns by country,
// page and day. Country comes from Vercel's edge geo headers.
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

function getDb() {
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  }
  return getFirestore();
}

const summaryRef = () => getDb().collection('analytics').doc('summary');

// Normalise a path into a safe, bounded Firestore map key.
function pathKey(raw: string): string {
  let p = (raw || '/').toString().split('?')[0].split('#')[0];
  if (p.length > 1) p = p.replace(/\/+$/, ''); // trim trailing slash
  if (!/^\/[\w\-/]*$/.test(p) || p.length > 60) return '/other';
  // Firestore map keys can't contain "/" cleanly when read back as field paths,
  // so store the path with "/" swapped for "·" and restore it on read.
  return p === '/' ? '(home)' : p.slice(1).replace(/\//g, ' › ');
}

export async function POST(request: Request) {
  try {
    const data = await request.json().catch(() => ({}));
    const rawPath = (data.path || '/').toString();
    // Never count admin/dashboard views (that's the owner, not a visitor).
    if (rawPath.startsWith('/admin') || rawPath.startsWith('/dashboard')) {
      return Response.json({ ok: true, skipped: true });
    }
    const country = (request.headers.get('x-vercel-ip-country') || 'ZZ').toUpperCase().slice(0, 2);
    const day = new Date().toISOString().slice(0, 10); // UTC YYYY-MM-DD
    const key = pathKey(rawPath);

    const update: Record<string, any> = {
      totalViews: FieldValue.increment(1),
      byCountry: { [country]: FieldValue.increment(1) },
      byPath: { [key]: FieldValue.increment(1) },
      byDay: { [day]: FieldValue.increment(1) },
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (data.isNewVisitor) update.uniqueVisitors = FieldValue.increment(1);

    await summaryRef().set(update, { merge: true });
    return Response.json({ ok: true });
  } catch {
    // Analytics must never break a page load.
    return Response.json({ ok: false }, { status: 200 });
  }
}

export async function GET() {
  try {
    const snap = await summaryRef().get();
    const d = (snap.exists ? snap.data() : {}) || {};
    return Response.json({
      totalViews: d.totalViews || 0,
      uniqueVisitors: d.uniqueVisitors || 0,
      byCountry: d.byCountry || {},
      byPath: d.byPath || {},
      byDay: d.byDay || {},
      updatedAt: d.updatedAt?.toMillis?.() || null,
    });
  } catch {
    return Response.json({ totalViews: 0, uniqueVisitors: 0, byCountry: {}, byPath: {}, byDay: {}, updatedAt: null }, { status: 200 });
  }
}
