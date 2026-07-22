// app/api/landlord/password/route.ts
// Landlord password change — used both for the forced first-login reset and any
// later change from the portal's Account tab. Requires a valid landlord session
// AND the current password (re-authentication), so a stolen cookie alone can't
// lock the real landlord out.
import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { requireLandlord } from '@/lib/landlordAuth';
import { getAdminDb } from '@/lib/staffApiAuth';
import { rateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const limited = rateLimit(request, 'landlord-password', 10, 15 * 60 * 1000);
  if (limited) return limited;

  const auth = await requireLandlord(request);
  if (auth instanceof Response) return auth;

  try {
    const { currentPassword, newPassword } = await request.json();
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ message: 'Both your current and new password are required.' }, { status: 400 });
    }
    if (String(newPassword).length < 8) {
      return NextResponse.json({ message: 'Your new password must be at least 8 characters.' }, { status: 400 });
    }

    const key = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (!key) return NextResponse.json({ message: 'Password change is temporarily unavailable.' }, { status: 500 });

    // Re-authenticate with the current password before allowing the change.
    const verify = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: auth.email, password: String(currentPassword), returnSecureToken: false }),
      },
    );
    if (!verify.ok) {
      return NextResponse.json({ message: 'Your current password is incorrect.' }, { status: 401 });
    }

    await getAuth().updateUser(auth.uid, { password: String(newPassword) });
    // First-login gate cleared once they've chosen their own password.
    await getAdminDb().collection('users').doc(auth.uid).set({ mustResetPassword: false }, { merge: true });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    console.error('landlord-password error:', e);
    return NextResponse.json({ message: 'Could not change your password. Please try again.' }, { status: 500 });
  }
}
