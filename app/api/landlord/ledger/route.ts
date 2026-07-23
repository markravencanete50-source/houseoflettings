// app/api/landlord/ledger/route.ts
// Returns this year's money in / out for ONE of the caller's properties, read
// from the bank-account Google Sheet and matched by postcode. Scoped: the
// requested postcode MUST be one of the landlord's own registered postcodes, so
// a landlord can never pull another property's transactions out of the shared
// sheet. Dormant until LANDLORD_LEDGER_SHEET_ID (+ GIDS) env vars are set.
import { NextResponse } from 'next/server';
import { requireLandlord } from '@/lib/landlordAuth';
import { ledgerForPostcode } from '@/lib/landlordLedger';
import { getAdminDb } from '@/lib/staffApiAuth';
import { normalisePostcode } from '@/lib/portalMatch';

export const dynamic = 'force-dynamic';

const norm = (s: string) => (s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

export async function GET(request: Request) {
  const auth = await requireLandlord(request);
  if (auth instanceof Response) return auth;
  const postcode = new URL(request.url).searchParams.get('postcode') || '';
  const target = norm(postcode);
  if (!target) return NextResponse.json({ message: 'Missing postcode.' }, { status: 400 });

  // Scope to the caller's own postcodes: their registered ones, plus the
  // postcodes of any listings posted FOR them (properties.landlordId === uid) —
  // those are their real properties too, so their Account tab must resolve.
  const allowed = new Set(auth.postcodes.map(norm));
  if (!allowed.has(target)) {
    try {
      const snap = await getAdminDb().collection('properties').where('landlordId', '==', auth.uid).get();
      snap.docs.forEach(d => {
        const pc = norm(normalisePostcode(String((d.data() as any)?.location || '')) || '');
        if (pc) allowed.add(pc);
      });
    } catch { /* fall through to the 403 below */ }
  }
  if (!allowed.has(target)) {
    return NextResponse.json({ message: 'Not authorised for that property.' }, { status: 403 });
  }

  const result = await ledgerForPostcode(postcode);
  return NextResponse.json(result, { status: 200 });
}
