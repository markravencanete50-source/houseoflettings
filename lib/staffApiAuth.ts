// lib/staffApiAuth.ts
// Server-only helper for /api/staff/* routes: verifies the Firebase ID token,
// loads the caller's user doc, checks the staff/admin role and (optionally)
// that a specific staff-dashboard feature is enabled for them. Uses the Admin
// SDK, so Firestore security rules are bypassed — this check IS the gate.
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { DEFAULT_STAFF_PERMISSIONS, STAFF_FEATURE_IDS, type StaffFeature } from './staffAccess';
import { isDualAccessEmail } from './dualAccess';

export function getAdminDb() {
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

export type StaffAuth = { uid: string; role: 'staff' | 'admin'; permissions: string[] };

function sessionCookie(request: Request): string | null {
  const cookie = request.headers.get('cookie') || '';
  const m = cookie.match(/(?:^|;\s*)hol_session=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

// Returns the caller's identity, or a ready-to-return error Response. Accepts
// EITHER a Firebase ID token (Authorization: Bearer) OR the HttpOnly session
// cookie set by /api/team-login — the latter lets staff on networks that block
// googleapis.com use the dashboard, since only our server calls Google.
export async function requireStaff(request: Request, feature?: StaffFeature): Promise<StaffAuth | Response> {
  const authHeader = request.headers.get('authorization');
  const cookie = sessionCookie(request);
  if (!authHeader?.startsWith('Bearer ') && !cookie) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  }

  // Try the Bearer ID token first; if it's missing/expired/invalid, fall back
  // to the session cookie — so a stale client token never blocks a request that
  // has a valid cookie.
  getAdminDb(); // ensure the admin app is initialised before getAuth()
  let uid: string | null = null;
  if (authHeader?.startsWith('Bearer ')) {
    try { uid = (await getAuth().verifyIdToken(authHeader.substring(7))).uid; } catch { /* try cookie */ }
  }
  if (!uid && cookie) {
    try { uid = (await getAuth().verifySessionCookie(cookie, true)).uid; } catch { /* invalid cookie */ }
  }
  if (!uid) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const snap = await getAdminDb().collection('users').doc(uid).get();
  const data = snap.data() || {};
  let role = data.role;
  // Owner/dev dual-access emails act as admin here even if stored as 'landlord'.
  if (role !== 'staff' && role !== 'admin' && isDualAccessEmail(data.email)) role = 'admin';
  if (role !== 'staff' && role !== 'admin') {
    return Response.json({ message: 'Forbidden' }, { status: 403 });
  }

  const permissions: string[] = role === 'admin'
    ? [...STAFF_FEATURE_IDS]
    : (Array.isArray(data.permissions) ? data.permissions : [...DEFAULT_STAFF_PERMISSIONS]);

  if (feature && !permissions.includes(feature)) {
    return Response.json({ message: 'This feature is not enabled for your account. Ask an admin to grant it.' }, { status: 403 });
  }

  return { uid, role, permissions };
}
