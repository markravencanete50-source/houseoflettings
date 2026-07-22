// app/api/landlord-login/route.ts
// Server-side landlord login. Same shape as /api/team-login but gates on
// role === 'landlord'. The browser only ever talks to our own domain; THIS route
// (on Vercel) does the Firebase auth, so landlords on networks that block
// googleapis.com can still sign in. On success we mint the HttpOnly `hol_session`
// cookie the /api/landlord/* routes accept.
import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getAdminDb } from '@/lib/staffApiAuth';
import { rateLimit, rateLimitByKey } from '@/lib/rateLimit';

const SESSION_COOKIE = 'hol_session';
const EXPIRES_MS = 5 * 24 * 60 * 60 * 1000; // 5 days

export async function POST(request: Request) {
  const limited = rateLimit(request, 'landlord-login', 10, 15 * 60 * 1000);
  if (limited) return limited;
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required.' }, { status: 400 });
    }

    // Per-account throttle on top of the per-IP limit: 5 attempts per mailbox
    // per 15 minutes, so rotating IPs doesn't buy unlimited guesses.
    const emailLimited = rateLimitByKey('landlord-login-email', String(email).trim().toLowerCase(), 5, 15 * 60 * 1000);
    if (emailLimited) return emailLimited;

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
      const msg = /EMAIL_NOT_FOUND|INVALID_PASSWORD|INVALID_LOGIN_CREDENTIALS/.test(code)
        ? 'Invalid email or password.'
        : /USER_DISABLED/.test(code) ? 'This account has been disabled. Please contact us.'
        : /TOO_MANY_ATTEMPTS/.test(code) ? 'Too many attempts. Please try again later.'
        : 'Sign in failed. Please try again.';
      return NextResponse.json({ message: msg }, { status: 401 });
    }

    const uid: string = signIn.localId;
    const idToken: string = signIn.idToken;

    // 2. Load the profile and enforce the landlord gate.
    const snap = await getAdminDb().collection('users').doc(uid).get();
    if (!snap.exists) {
      return NextResponse.json({ message: 'No landlord account found for these details.' }, { status: 403 });
    }
    const data = snap.data() || {};
    if (data.role !== 'landlord') {
      return NextResponse.json({ message: 'This login is for registered landlords. Staff should use the team login.' }, { status: 403 });
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
