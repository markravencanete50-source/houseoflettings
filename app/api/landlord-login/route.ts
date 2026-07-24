// app/api/landlord-login/route.ts
// Server-side landlord login. Same shape as /api/team-login but gates on
// role === 'landlord'. The browser only ever talks to our own domain; THIS route
// (on Vercel) does the Firebase auth, so landlords on networks that block
// googleapis.com can still sign in. On success we mint the HttpOnly `hol_session`
// cookie the /api/landlord/* routes accept.
import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/staffApiAuth';
import { rateLimit } from '@/lib/rateLimit';
import { getLockState, registerFailure, clearLockout } from '@/lib/loginLockout';

const SESSION_COOKIE = 'hol_session';
const EXPIRES_MS = 5 * 24 * 60 * 60 * 1000; // 5 days

export async function POST(request: Request) {
  const limited = rateLimit(request, 'landlord-login', 12, 15 * 60 * 1000);
  if (limited) return limited;
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required.' }, { status: 400 });
    }
    const emailKey = String(email).trim().toLowerCase();
    const db = getAdminDb();

    // Hard gate: an account is locked for 24h after MAX_FAILS consecutive misses.
    const lock = await getLockState(db, emailKey);
    if (lock.locked) {
      return NextResponse.json({
        message: `Too many incorrect attempts — this account is locked for security. Try again in about ${lock.hoursLeft} hour${lock.hoursLeft === 1 ? '' : 's'}, or reset your password to regain access now.`,
        locked: true,
      }, { status: 429 });
    }

    const key = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (!key) {
      console.error('landlord-login: NEXT_PUBLIC_FIREBASE_API_KEY missing');
      return NextResponse.json({ message: 'Login is temporarily unavailable.' }, { status: 500 });
    }

    // 1. Verify the password against Firebase Auth (server -> Google).
    const signInRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: String(email).trim(), password: String(password), returnSecureToken: true }),
      },
    );
    const signIn = await signInRes.json().catch(() => ({}));
    if (!signInRes.ok) {
      const code = signIn?.error?.message || '';
      const isCredentialMiss = /EMAIL_NOT_FOUND|INVALID_PASSWORD|INVALID_LOGIN_CREDENTIALS/.test(code);
      if (isCredentialMiss) {
        // Count the strike; lock the account on the third consecutive miss.
        const { locked, remaining } = await registerFailure(db, emailKey);
        if (locked) {
          return NextResponse.json({
            message: 'That was the third incorrect attempt, so this account is now locked for 24 hours. Reset your password to regain access sooner.',
            locked: true,
          }, { status: 429 });
        }
        return NextResponse.json({
          message: `Invalid email or password. ${remaining} attempt${remaining === 1 ? '' : 's'} left before this account is locked for 24 hours.`,
        }, { status: 401 });
      }
      const msg = /USER_DISABLED/.test(code) ? 'This account has been disabled. Please contact us.'
        : /TOO_MANY_ATTEMPTS/.test(code) ? 'Too many attempts. Please try again later.'
        : 'Sign in failed. Please try again.';
      return NextResponse.json({ message: msg }, { status: 401 });
    }

    // Correct password → wipe any accumulated strikes for this account.
    await clearLockout(db, emailKey);

    const uid: string = signIn.localId;
    const idToken: string = signIn.idToken;

    // 2. Load the profile and enforce the landlord gate.
    const snap = await getAdminDb().collection('users').doc(uid).get();
    if (!snap.exists) {
      return NextResponse.json({ message: 'No landlord account found for these details.' }, { status: 403 });
    }
    const data = snap.data() || {};
    // Landlords use this login; admins are allowed too so a developer/owner can
    // reach the portal with the same account they use for the admin dashboard.
    if (data.role !== 'landlord' && data.role !== 'admin') {
      return NextResponse.json({ message: 'This login is for registered landlords. Staff should use the team login.' }, { status: 403 });
    }

    // Record portal access so the dashboards can show that this landlord has
    // actually signed in (i.e. used the temporary credentials at least once).
    // Best-effort: a write failure must never block a valid sign-in.
    try {
      await getAdminDb().collection('users').doc(uid).set({
        lastLoginAt: FieldValue.serverTimestamp(),
        ...(data.firstLoginAt ? {} : { firstLoginAt: FieldValue.serverTimestamp() }),
      }, { merge: true });
    } catch (e) {
      console.error('landlord-login: could not record login time', e);
    }

    // 3. Mint a Firebase session cookie from the fresh ID token.
    const sessionCookie = await getAuth().createSessionCookie(idToken, { expiresIn: EXPIRES_MS });

    const res = NextResponse.json({
      ok: true,
      name: data.name || '',
      email: data.email || String(email).trim(),
      mustResetPassword: !!data.mustResetPassword,
    });
    res.cookies.set(SESSION_COOKIE, sessionCookie, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: Math.floor(EXPIRES_MS / 1000),
    });
    return res;
  } catch (e) {
    console.error('landlord-login error:', e);
    return NextResponse.json({ message: 'Sign in failed. Please try again.' }, { status: 500 });
  }
}
