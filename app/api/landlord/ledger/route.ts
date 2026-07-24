// app/api/landlord/ledger/route.ts
// Returns this year's money in / out for ONE of the caller's properties, read
// from the bank-account Google Sheet. The property is resolved SERVER-SIDE from
// the caller's own data by its `id`, and matched against the sheet by postcode
// or (when the property has no postcode) its address line — so a property
// registered without a postcode still resolves, and a landlord can never pull
// another property's transactions. Dormant until LANDLORD_LEDGER_SHEET_ID is set.
import { NextResponse } from 'next/server';
import { requireLandlord, type LandlordAuth } from '@/lib/landlordAuth';
import { ledgerForProperty, type LedgerResult } from '@/lib/landlordLedger';
import { getAdminDb } from '@/lib/staffApiAuth';
import { normalisePostcode } from '@/lib/portalMatch';
import { signedAmount, typeLabel } from '@/lib/ledgerEntries';
import { getLedgerReadMode } from '@/lib/ledgerConfig';
import { STATEMENT_FLOOR_MS } from '@/lib/statementFloor';

export const dynamic = 'force-dynamic';

const norm = (s: string) => (s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

// dd/mm/yyyy (sheet) OR yyyy-mm-dd (internal) → epoch for sorting.
function txnDateKey(d: string): number {
  let m = String(d || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).getTime() || 0;
  m = String(d || '').match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (!m) return 0;
  const yr = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
  return new Date(yr, Number(m[2]) - 1, Number(m[1])).getTime() || 0;
}
const toDMY = (isoDay: string): string => {
  const m = String(isoDay || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : String(isoDay || '');
};

// Internal ledger entries for a property within the period, as statement rows.
// Landlord statement grouping: money the agent collected for them (received),
// what the agent kept/spent (deductions: fees + maintenance), and what was paid
// out to the landlord (payments). Statement balance = received − deductions −
// payments = what the agent still holds for the landlord.
type Group = 'received' | 'deduction' | 'payment';
type Txn = { date: string; description: string; amount: number; category?: string; group: Group };

function groupForType(type: string, direction: string): Group {
  if (type === 'rent_in' || type === 'credit') return 'received';
  if (type === 'payment_to_landlord') return 'payment';
  if (type === 'management_fee' || type === 'finders_fee' || type === 'maintenance' || type === 'charge') return 'deduction';
  return direction === 'in' ? 'received' : 'deduction'; // adjustment / other
}

async function internalEntries(db: ReturnType<typeof getAdminDb>, propertyId: string, fromMs: number, toMs: number, includeSheet = false): Promise<Txn[]> {
  if (!propertyId) return [];
  const snap = await db.collection('ledgerEntries').where('propertyId', '==', propertyId).limit(500).get();
  return snap.docs.map(d => d.data() as any)
    // In 'sheet' mode the statement live-reads the sheet, so mirrored rows are
    // excluded to avoid double-counting. In 'ledger' mode (cutover) they ARE the
    // statement, so they're included.
    .filter(e => includeSheet || e.source !== 'sheet')
    .filter(e => {
      const t = new Date(`${String(e.date || '').slice(0, 10)}T00:00:00`).getTime();
      return Number.isFinite(t) && t >= fromMs && t <= toMs;
    })
    .map(e => ({
      date: toDMY(String(e.date || '')),
      // Clean label: the section header already conveys the type, so don't repeat it.
      description: (e.description && String(e.description).trim()) || typeLabel(e.type),
      amount: signedAmount(e),
      category: e.type === 'maintenance' ? 'maintenance' : undefined,
      group: groupForType(String(e.type || ''), String(e.direction || (signedAmount(e) >= 0 ? 'in' : 'out'))),
    }));
}

// Merge the live Sheet result with internal entries into one statement. Sheet
// rows carry no type: money-in is rent received, money-out is treated as paid to
// the landlord.
function mergeStatement(sheet: LedgerResult, entries: Txn[]): LedgerResult {
  if (sheet.error && !entries.length) return sheet;
  const sheetTxns: Txn[] = (sheet.transactions || []).map(t => ({ ...t, group: t.amount > 0 ? 'received' : 'payment' as Group }));
  const txns = [...sheetTxns, ...entries].sort((a, b) => txnDateKey(b.date) - txnDateKey(a.date));
  let moneyIn = 0, moneyOut = 0;
  for (const t of txns) { if (t.amount > 0) moneyIn += t.amount; else moneyOut += -t.amount; }
  return {
    configured: sheet.configured || entries.length > 0,
    error: sheet.error,
    unmatched: !!sheet.unmatched && entries.length === 0,
    transactions: txns,
    totals: { moneyIn, moneyOut, net: moneyIn - moneyOut },
  };
}

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

  // Optional statement period (yyyy-mm-dd). Absent → the lib defaults to the
  // current calendar year.
  const parseDay = (v: string | null, end: boolean): number | undefined => {
    if (!v || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return undefined;
    const t = new Date(`${v}T${end ? '23:59:59.999' : '00:00:00'}`).getTime();
    return Number.isFinite(t) ? t : undefined;
  };
  // Effective window (mirror the lib default of the current calendar year) so the
  // Sheet and internal entries use exactly the same period.
  const now = new Date();
  // Clamp to the go-live floor (June 2026) so no pre-June record ever appears,
  // regardless of the requested period or read mode.
  const fromMs = Math.max(parseDay(url.searchParams.get('from'), false) ?? new Date(now.getFullYear(), 0, 1).getTime(), STATEMENT_FLOOR_MS);
  const toMs = parseDay(url.searchParams.get('to'), true) ?? new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999).getTime();

  // Preferred path: resolve the property from the caller's own data by id. This
  // is authoritative (postcode + address come from our records, not the client)
  // and secure (the id must belong to the caller). Merges the live Sheet with
  // internal ledger entries recorded against this property.
  if (id) {
    let resolved: Resolved | null = null;
    try { resolved = await resolveOwnProperty(db, auth, id); }
    catch (e) { console.error('ledger resolve error:', e); return NextResponse.json({ message: 'Could not load your account.' }, { status: 500 }); }
    if (!resolved) return NextResponse.json({ message: 'Not authorised for that property.' }, { status: 403 });

    const mode = await getLedgerReadMode(db);
    if (mode === 'ledger') {
      // Cutover: the internal ledger (incl. mirrored sheet rows) IS the statement.
      const entries = await internalEntries(db, id, fromMs, toMs, true);
      const emptySheet = { configured: true, transactions: [], totals: { moneyIn: 0, moneyOut: 0, net: 0 } };
      return NextResponse.json(mergeStatement(emptySheet, entries), { status: 200 });
    }
    // Default: live sheet + internal entries (excluding the mirror).
    const [sheet, entries] = await Promise.all([
      ledgerForProperty({ ...resolved, fromMs, toMs }),
      internalEntries(db, id, fromMs, toMs, false),
    ]);
    return NextResponse.json(mergeStatement(sheet, entries), { status: 200 });
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

  const result = await ledgerForProperty({ postcode, fromMs, toMs });
  return NextResponse.json(result, { status: 200 });
}
