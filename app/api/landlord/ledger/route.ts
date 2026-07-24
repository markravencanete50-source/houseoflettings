// app/api/landlord/ledger/route.ts
// Returns this year's money in / out for ONE of the caller's properties, read
// from the bank-account Google Sheet. The property is resolved SERVER-SIDE from
// the caller's own data by its `id`, and matched against the sheet by postcode
// or (when the property has no postcode) its address line — so a property
// registered without a postcode still resolves, and a landlord can never pull
// another property's transactions. Dormant until LANDLORD_LEDGER_SHEET_ID is set.
import { NextResponse } from 'next/server';
import { requireLandlord, type LandlordAuth } from '@/lib/landlordAuth';
import { ledgerForProperty } from '@/lib/landlordLedger';
import { getAdminDb } from '@/lib/staffApiAuth';
import { normalisePostcode } from '@/lib/portalMatch';

export const dynamic = 'force-dynamic';

const norm = (s: string) => (s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

// The first comma-segment that carries a house number (a digit), else the first
// non-empty segment — i.e. "6 Browning Road" out of "6 Browning Road, , Leeds".
function addressLineFrom(...parts: (string | undefined)[]): string {
  const joined = parts.filter(Boolean).join(', ');
  const segs = joined.split(',').map(s => s.trim()).filter(Boolean);
  return segs.find(s => /\d/.test(s)) || segs[0] || '';
}

type Resolved = { postcode: string; addressLine: string };

// Resolve a property the caller owns, from the overview's property id:
//   • "<agreementId>-<index>" → a registered property on one of their agreements
//   • "<listingId>"           → a listing posted FOR them (properties.landlordId)
// Returns null when the id doesn't belong to the caller (→ 403/404 upstream).
async function resolveOwnProperty(db: ReturnType<typeof getAdminDb>, auth: LandlordAuth, id: string): Promise<Resolved | null> {
  const composite = id.match(/^(.+)-(\d+)$/); // agreement ids are hyphen-free auto-ids
  if (composite) {
    const agreementId = composite[1];
    const index = Number(composite[2]);
    const snap = await db.collection('landlordAgreements').doc(agreementId).get();
    if (!snap.exists) return null;
    const d = snap.data() || {};
    const owns = auth.agreementIds.includes(agreementId)
      || (!!auth.email && String(d.email || '').trim().toLowerCase() === auth.email.trim().toLowerCase());
    if (!owns) return null;
    const list = Array.isArray(d.properties) && d.properties.length ? d.properties : [{
      postcode: d.postcode, street: d.street, flatNumber: d.flatNumber, city: d.city,
    }];
    const p = list[index];
    if (!p) return null;
    return {
      postcode: normalisePostcode(String(p.postcode || '')) || '',
      addressLine: addressLineFrom(p.flatNumber, p.street, p.city, p.postcode),
    };
  }
  // Listing posted for this landlord.
  const psnap = await db.collection('properties').doc(id).get();
  if (!psnap.exists) return null;
  const p = psnap.data() || {};
  if (p.landlordId !== auth.uid) return null;
  const loc = String(p.location || '');
  return { postcode: normalisePostcode(loc) || '', addressLine: addressLineFrom(loc) };
}

export async function GET(request: Request) {
  const auth = await requireLandlord(request);
  if (auth instanceof Response) return auth;

  const url = new URL(request.url);
  const id = (url.searchParams.get('id') || '').trim();
  const db = getAdminDb();

  // Preferred path: resolve the property from the caller's own data by id. This
  // is authoritative (postcode + address come from our records, not the client)
  // and secure (the id must belong to the caller).
  if (id) {
    let resolved: Resolved | null = null;
    try { resolved = await resolveOwnProperty(db, auth, id); }
    catch (e) { console.error('ledger resolve error:', e); return NextResponse.json({ message: 'Could not load your account.' }, { status: 500 }); }
    if (!resolved) return NextResponse.json({ message: 'Not authorised for that property.' }, { status: 403 });
    const result = await ledgerForProperty(resolved);
    return NextResponse.json(result, { status: 200 });
  }

  // ── Legacy path: match by an explicit postcode, scoped to the caller's own
  //    postcodes (kept so older clients that pass ?postcode= keep working). ──
  const postcode = url.searchParams.get('postcode') || '';
  const target = norm(postcode);
  if (!target) return NextResponse.json({ message: 'Missing property reference.' }, { status: 400 });

  const allowed = new Set(auth.postcodes.map(norm));
  if (!allowed.has(target)) {
    try {
      const snap = await db.collection('properties').where('landlordId', '==', auth.uid).get();
      snap.docs.forEach(d => {
        const pc = norm(normalisePostcode(String((d.data() as any)?.location || '')) || '');
        if (pc) allowed.add(pc);
      });
    } catch { /* fall through to the 403 below */ }
  }
  if (!allowed.has(target)) {
    return NextResponse.json({ message: 'Not authorised for that property.' }, { status: 403 });
  }

  const result = await ledgerForProperty({ postcode });
  return NextResponse.json(result, { status: 200 });
}
