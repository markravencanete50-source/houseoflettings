// app/api/landlord/ledger/route.ts
// Returns this year's money in / out for ONE of the caller's properties, read
// from the bank-account Google Sheet and matched by postcode. Scoped: the
// requested postcode MUST be one of the landlord's own registered postcodes, so
// a landlord can never pull another property's transactions out of the shared
// sheet. Dormant until LANDLORD_LEDGER_SHEET_ID (+ GIDS) env vars are set.
import { NextResponse } from 'next/server';
import { requireLandlord } from '@/lib/landlordAuth';
import { ledgerForPostcode } from '@/lib/landlordLedger';

export const dynamic = 'force-dynamic';

const norm = (s: string) => (s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

export async function GET(request: Request) {
  const auth = await requireLandlord(request);
  if (auth instanceof Response) return auth;
  const postcode = new URL(request.url).searchParams.get('postcode') || '';
  const target = norm(postcode);
  if (!target) return NextResponse.json({ message: 'Missing postcode.' }, { status: 400 });

  // Scope to the caller's own postcodes.
  const owned = auth.postcodes.map(norm);
  if (!owned.includes(target)) {
    return NextResponse.json({ message: 'Not authorised for that property.' }, { status: 403 });
  }

  const result = await ledgerForPostcode(postcode);
  return NextResponse.json(result, { status: 200 });
}
