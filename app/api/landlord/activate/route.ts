// app/api/landlord/activate/route.ts
// Consumes the one-time link from /api/landlord/request-access. GET validates the
// token (so the page can greet the landlord); POST sets their chosen password,
// activates/links the landlord account across ALL their registrations, and signs
// them straight in (mints the hol_session cookie).
import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, type Firestore } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/staffApiAuth';
import { postcodesFromAgreement } from '@/lib/landlordProvision';
import { clearLockout } from '@/lib/loginLockout';
import { rateLimit } from '@/lib/rateLimit';
import { createHash } from 'node:crypto';

export const dynamic = 'force-dynamic';

const SESSION_COOKIE = 'hol_session';
const EXPIRES_MS = 5 * 24 * 60 * 60 * 1000;
const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');

// Returns the token doc if valid for this email, else null.
async function validToken(db: Firestore, token: string, email: string) {
  if (!token || !email) return null;
  const ref = db.collection('landlordAccessTokens').doc(sha256(token));
  const snap = await ref.get();
  const d = snap.data();
  if (!snap.exists || !d) return null;
  if (d.used) return null;
  if (d.email !== email) return null;
  if (d.expiresAt && d.expiresAt < Date.now()) return null;
  return ref;
}

export async function GET(request: Request) {
  const limited = rateLimit(request, 'landlord-activate-check', 30, 15 * 60 * 1000);
  if (limited) return limited;
  try {
    const url = new URL(request.url);
    const token = (url.searchParams.get('token') || '').trim();
    const email = (url.searchParams.get('email') || '').trim().toLowerCase();
    const db = getAdminDb();
    const ref = await validToken(db, token, email);
    if (!ref) return NextResponse.json({ valid: false }, { status: 200 });

    const snap = await db.collection('landlordAgreements').where('email', '==', email).limit(1).get();
    const name = snap.empty ? '' : (snap.docs[0].data()?.companyName || snap.docs[0].data()?.fullName || '');
    return NextResponse.json({ valid: true, email, name }, { status: 200 });
  } catch (e) {
    console.error('landlord-activate GET error:', e);
    return NextResponse.json({ valid: false }, { status: 200 });
  }
}

export async function POST(request: Request) {
  const limited = rateLimit(request, 'landlord-activate', 10, 15 * 60 * 1000);
  if (limited) return limited;
  try {
    const { token, email, password } = await request.json();
    const clean = String(email || '').trim().toLowerCase();
    const pw = String(password || '');
    if (pw.length < 8) return NextResponse.json({ message: 'Choose a password of at least 8 characters.' }, { status: 400 });

    const db = getAdminDb();
    const tokenRef = await validToken(db, String(token || ''), clean);
    if (!tokenRef) return NextResponse.json({ message: 'This link is invalid or has expired. Please request a new one.' }, { status: 403 });

    // Create or update the Firebase Auth user with the chosen password.
    const auth = getAuth();
    let uid: string;
    try {
      uid = (await auth.getUserByEmail(clean)).uid;
      await auth.updateUser(uid, { password: pw });
    } catch {
      uid = (await auth.createUser({ email: clean, password: pw, emailVerified: true })).uid;
    }

    // Link EVERY registration this email owns onto the account.
    const agSnap = await db.collection('landlordAgreements').where('email', '==', clean).limit(50).get();
    const agreementIds: string[] = [];
    const postcodes = new Set<string>();
    let name = '';
    for (const doc of agSnap.docs) {
      agreementIds.push(doc.id);
      const data = doc.data() || {};
      if (!name) name = (data.companyName || data.fullName || '').toString();
      postcodesFromAgreement(data).forEach(p => postcodes.add(p));
      await doc.ref.set({ landlordUid: uid, accountProvisioned: true }, { merge: true });
    }

    await db.collection('users').doc(uid).set({
      name: name || 'Landlord',
      email: clean,
      role: 'landlord',
      landlordAgreementIds: agreementIds,
      landlordPostcodes: Array.from(postcodes),
      mustResetPassword: false,
      accountProvisionedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    // Burn the token so the link can't be reused, and clear any login lockout so
    // a locked-out landlord regains access immediately after resetting.
    await tokenRef.set({ used: true, usedAt: FieldValue.serverTimestamp() }, { merge: true });
    await clearLockout(db, clean);

    // Sign them straight in: password → idToken → session cookie.
    const key = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    const res = NextResponse.json({ ok: true }, { status: 200 });
    if (key) {
      const signIn = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${key}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: clean, password: pw, returnSecureToken: true }) },
      ).then(r => r.json()).catch(() => null);
      if (signIn?.idToken) {
        const cookie = await auth.createSessionCookie(signIn.idToken, { expiresIn: EXPIRES_MS });
        res.cookies.set(SESSION_COOKIE, cookie, {
          httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: Math.floor(EXPIRES_MS / 1000),
        });
      }
    }
    return res;
  } catch (e) {
    console.error('landlord-activate POST error:', e);
    return NextResponse.json({ message: 'Could not activate your account. Please try again.' }, { status: 500 });
  }
}
