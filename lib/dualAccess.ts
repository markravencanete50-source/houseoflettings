// lib/dualAccess.ts
// Owner/developer emails that are granted BOTH landlord-portal and admin access
// on the same account, without changing the account's stored role. Used by the
// server auth gates (team-login, requireStaff, /api/me), the client admin guard,
// and mirrored in firestore.rules (request.auth.token.email) so client-side
// admin reads succeed too.
//
// Client-safe: no server-only imports, and the list is exposed via a
// NEXT_PUBLIC_ var so both the browser guard and the API routes read the same
// value. Defaults to the site owner's email when the var is unset.
const RAW = process.env.NEXT_PUBLIC_DUAL_ACCESS_EMAILS || 'markravencanete50@gmail.com';

export const DUAL_ACCESS_EMAILS: string[] = RAW
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean);

export function isDualAccessEmail(email?: string | null): boolean {
  return !!email && DUAL_ACCESS_EMAILS.includes(email.trim().toLowerCase());
}
