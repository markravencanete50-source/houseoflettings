// app/api/landlord/logout/route.ts
// Clears the landlord session cookie (same cookie name every server-auth'd
// dashboard uses).
import { NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rateLimit';

export async function POST(request: Request) {
  const limited = rateLimit(request, 'landlord-logout', 60, 10 * 60 * 1000);
  if (limited) return limited;
  const res = NextResponse.json({ ok: true });
  res.cookies.set('hol_session', '', { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 0 });
  return res;
}
