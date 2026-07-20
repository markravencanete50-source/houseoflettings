// app/api/team-logout/route.ts
// Clears the team session cookie.
import { NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rateLimit';

export async function POST(request: Request) {
  const limited = rateLimit(request, 'team-logout', 60, 10 * 60 * 1000);
  if (limited) return limited;
  const res = NextResponse.json({ ok: true });
  res.cookies.set('hol_session', '', { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 0 });
  return res;
}
