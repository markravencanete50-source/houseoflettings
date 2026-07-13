// app/api/team-logout/route.ts
// Clears the team session cookie.
import { NextResponse } from 'next/server';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set('hol_session', '', { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 0 });
  return res;
}
