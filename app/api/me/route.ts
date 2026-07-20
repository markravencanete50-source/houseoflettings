import { rateLimit } from "@/lib/rateLimit";
// app/api/me/route.ts
// Returns the signed-in team member's profile from the HttpOnly session cookie
// set by /api/team-login. Used by the staff dashboard when the browser can't
// use the Firebase client SDK (blocked network) so it still knows who you are.
import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getAdminDb } from '@/lib/staffApiAuth';
import { DEFAULT_STAFF_PERMISSIONS, STAFF_FEATURE_IDS } from '@/lib/staffAccess';

// Reads the per-request session cookie — must never be statically cached.
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const limited = rateLimit(request, "me", 120, 10 * 60 * 1000);
  if (limited) return limited;
  try {
    const cookie = request.headers.get('cookie') || '';
    const match = cookie.match(/(?:^|;\s*)hol_session=([^;]+)/);
    if (!match) return NextResponse.json({ user: null }, { status: 200 });

    let uid: string;
    try {
      getAdminDb();
      uid = (await getAuth().verifySessionCookie(decodeURIComponent(match[1]), true)).uid;
    } catch {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const snap = await getAdminDb().collection('users').doc(uid).get();
    if (!snap.exists) return NextResponse.json({ user: null }, { status: 200 });
    const data = snap.data() || {};
    const role = data.role;
    if (role !== 'staff' && role !== 'admin') return NextResponse.json({ user: null }, { status: 200 });

    const permissions: string[] = role === 'admin'
      ? [...STAFF_FEATURE_IDS]
      : (Array.isArray(data.permissions) ? data.permissions : [...DEFAULT_STAFF_PERMISSIONS]);

    return NextResponse.json({
      user: { uid, name: data.name || '', email: data.email || '', role, permissions },
    }, { status: 200 });
  } catch (e) {
    console.error('me error:', e);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
