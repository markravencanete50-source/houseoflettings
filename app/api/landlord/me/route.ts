// app/api/landlord/me/route.ts
// Who the signed-in landlord is, from the HttpOnly session cookie. Powers the
// portal's identity + the "must reset password" first-login gate.
import { NextResponse } from 'next/server';
import { requireLandlord } from '@/lib/landlordAuth';
import { rateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const limited = rateLimit(request, 'landlord-me', 120, 10 * 60 * 1000);
  if (limited) return limited;
  const auth = await requireLandlord(request);
  if (auth instanceof Response) {
    // Portal treats 401/403 as "not logged in" — return a soft null so the page
    // can redirect to /landlord-login without surfacing an error.
    return NextResponse.json({ user: null }, { status: 200 });
  }
  return NextResponse.json({
    user: {
      uid: auth.uid,
      name: auth.name,
      email: auth.email,
      phone: auth.phone,
      mustResetPassword: auth.mustResetPassword,
      propertyCount: auth.postcodes.length,
    },
  }, { status: 200 });
}
