// lib/staffApiAuth.ts
// Server-only helper for /api/staff/* routes: verifies the Firebase ID token,
// loads the caller's user doc, checks the staff/admin role and (optionally)
// that a specific staff-dashboard feature is enabled for them. Uses the Admin
// SDK, so Firestore security rules are bypassed — this check IS the gate.
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { DEFAULT_STAFF_PERMISSIONS, STAFF_FEATURE_IDS, type StaffFeature } from './staffAccess';

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

// Returns the caller's identity, or a ready-to-return error Response.
export async function requireStaff(request: Request, feature?: StaffFeature): Promise<StaffAuth | Response> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  }
  let uid: string;
  try {
    getAdminDb(); // ensure the admin app is initialised before getAuth()
    uid = (await getAuth().verifyIdToken(authHeader.substring(7))).uid;
  } catch {
    return Response.json({ message: 'Invalid token' }, { status: 401 });
  }

  const snap = await getAdminDb().collection('users').doc(uid).get();
  const data = snap.data() || {};
  const role = data.role;
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
