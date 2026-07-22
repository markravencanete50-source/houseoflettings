// lib/landlordAuth.ts
// Server-only auth gate for the landlord portal (/api/landlord/*). Mirrors
// lib/staffApiAuth.ts#requireStaff but enforces role === 'landlord'. Accepts the
// same HttpOnly `hol_session` Firebase session cookie every other server-auth'd
// dashboard uses (minted by /api/landlord-login), or a Bearer ID token. Uses the
// Admin SDK, so Firestore rules are bypassed — this check IS the gate.
//
// The portal is deliberately cookie/Admin-SDK based (never the browser Firebase
// SDK): landlords on networks that block googleapis.com can still use it, and no
// new client-side Firestore read surface is opened.
import { getAuth } from 'firebase-admin/auth';
import { getAdminDb } from './staffApiAuth';

export const LANDLORD_SESSION_COOKIE = 'hol_session';

export type LandlordAuth = {
  uid: string;
  email: string;
  name: string;
  phone: string;
  postcodes: string[];      // normalised (uppercase, no space) — the scoping key
  agreementIds: string[];
  mustResetPassword: boolean;
};

function sessionCookie(request: Request): string | null {
  const cookie = request.headers.get('cookie') || '';
  const m = cookie.match(/(?:^|;\s*)hol_session=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

// Returns the caller's landlord identity, or a ready-to-return error Response.
export async function requireLandlord(request: Request): Promise<LandlordAuth | Response> {
  const authHeader = request.headers.get('authorization');
  const cookie = sessionCookie(request);
  if (!authHeader?.startsWith('Bearer ') && !cookie) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  }

  getAdminDb(); // ensure the admin app is initialised before getAuth()
  let uid: string | null = null;
  if (authHeader?.startsWith('Bearer ')) {
    try { uid = (await getAuth().verifyIdToken(authHeader.substring(7))).uid; } catch { /* try cookie */ }
  }
  if (!uid && cookie) {
    try { uid = (await getAuth().verifySessionCookie(cookie, true)).uid; } catch { /* invalid cookie */ }
  }
  if (!uid) return Response.json({ message: 'Unauthorized' }, { status: 401 });

  const snap = await getAdminDb().collection('users').doc(uid).get();
  const data = snap.data() || {};
  // Admins can also open the portal (to preview a landlord's view / QA the
  // feature) — they simply see whatever is scoped to their own postcodes.
  if (data.role !== 'landlord' && data.role !== 'admin') {
    return Response.json({ message: 'This area is for registered landlords only.' }, { status: 403 });
  }

  return {
    uid,
    email: data.email || '',
    name: data.name || '',
    phone: data.phone || '',
    postcodes: Array.isArray(data.landlordPostcodes) ? data.landlordPostcodes : [],
    agreementIds: Array.isArray(data.landlordAgreementIds) ? data.landlordAgreementIds : [],
    mustResetPassword: !!data.mustResetPassword,
  };
}
