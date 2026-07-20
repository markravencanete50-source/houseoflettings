// app/api/team-login/route.ts
// Server-side team login. The browser only talks to our own domain; THIS route
// (running on Vercel) does the Google/Firebase auth, so staff on networks that
// block googleapis.com can still sign in. On success we mint a Firebase session
// cookie (HttpOnly) that the /api/staff/* routes accept — the staff dashboard
// then works end-to-end without the browser ever calling Google.
import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getAdminDb } from '@/lib/staffApiAuth';
import { DEFAULT_STAFF_PERMISSIONS, STAFF_FEATURE_IDS } from '@/lib/staffAccess';
import { rateLimit, rateLimitByKey } from '@/lib/rateLimit';

const SESSION_COOKIE = 'hol_session';
const EXPIRES_MS = 5 * 24 * 60 * 60 * 1000; // 5 days

export async function POST(request: Request) {
  // App-level throttle on top of Firebase's TOO_MANY_ATTEMPTS: 10 login
  // attempts per IP per 15 minutes.
  const limited = rateLimit(request, 'team-login', 10, 15 * 60 * 1000);
  if (limited) return limited;
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required.' }, { status: 400 });
    }

    // Second layer on top of the per-IP limit above: 5 attempts per account
    // per 15 minutes, so rotating IPs doesn't buy unlimited guesses at one
    // mailbox. Keyed on the normalised email.
    const emailLimited = rateLimitByKey('team-login-email', String(email).trim().toLowerCase(), 5, 15 * 60 * 1000);
    if (emailLimited) return emailLimited;

    const key = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (!key) {
      console.error('team-login: NEXT_PUBLIC_FIREBASE_API_KEY missing');
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
        : /USER_DISABLED/.test(code) ? 'This account has been disabled.'
        : /TOO_MANY_ATTEMPTS/.test(code) ? 'Too many attempts. Please try again later.'
        : 'Sign in failed. Please try again.';
      return NextResponse.json({ message: msg }, { status: 401 });
    }

    const uid: string = signIn.localId;
    const idToken: string = signIn.idToken;

    // 2. Load the profile and enforce the staff/admin gate.
    const snap = await getAdminDb().collection('users').doc(uid).get();
    if (!snap.exists) {
      return NextResponse.json({ message: 'User profile not found. Please contact support.' }, { status: 403 });
    }
    const data = snap.data() || {};
    const role = data.role;
    if (role !== 'staff' && role !== 'admin') {
      return NextResponse.json({ message: 'Access denied. This login is for House of Lettings staff and administrators only.' }, { status: 403 });
    }
    const permissions: string[] = role === 'admin'
      ? [...STAFF_FEATURE_IDS]
      : (Array.isArray(data.permissions) ? data.permissions : [...DEFAULT_STAFF_PERMISSIONS]);

    // 3. Mint a Firebase session cookie from the fresh ID token.
    const sessionCookie = await getAuth().createSessionCookie(idToken, { expiresIn: EXPIRES_MS });

    const res = NextResponse.json({
      ok: true,
      role,
      name: data.name || '',
      email: data.email || String(email).trim(),
      permissions,
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
    console.error('team-login error:', e);
    return NextResponse.json({ message: 'Sign in failed. Please try again.' }, { status: 500 });
  }
}
