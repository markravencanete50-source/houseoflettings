// lib/landlordLedger.ts
// Reads the House of Lettings bank-account Google Sheet (a per-transaction
// ledger split across the Rent / Leeds / Manchester tabs) and returns the money
// in / out for ONE property THIS YEAR, matched by postcode. Server-only. The
// sheet id + tab gids come from env so they are not committed to the (public)
// repo:
//   LANDLORD_LEDGER_SHEET_ID   the spreadsheet id
//   LANDLORD_LEDGER_GIDS       comma-separated tab gids (e.g. rent,leeds,manchester)
//                              (falls back to LANDLORD_LEDGER_GID, else "0")
// Each tab is assumed to share the same columns (Date, Amount, Payment
// reference, Property address). The sheet must be readable by the server —
// either "Anyone with the link -> Viewer" (this CSV export works) or, better,
// shared with the Google service account and read via the Sheets API.

export type LedgerTxn = { date: string; description: string; amount: number; category?: string };
export type LedgerResult = {
  configured: boolean;
  error?: boolean;
  unmatched?: boolean; // no postcode AND no usable address to match the sheet on
  transactions: LedgerTxn[];
  totals: { moneyIn: number; moneyOut: number; net: number };
};

// How a property is matched against the "Property address" column of the sheet.
// Postcode is the reliable key; the address line is a fallback for properties
// registered/listed without a postcode (so their Account still resolves).
// fromMs/toMs bound the statement period (epoch ms); default is the current
// calendar year.
export type LedgerQuery = { postcode?: string; addressLine?: string; fromMs?: number; toMs?: number };

const norm = (s: string) => (s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

// Minimal RFC-4180-ish CSV parser (handles quoted fields with commas/newlines).
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], field = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQuotes = false; }
      else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c === '\r') { /* ignore */ }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function parseAmount(v: string): number {
  const n = parseFloat(String(v || '').replace(/[^0-9.\-]/g, ''));
  return isNaN(n) ? NaN : n;
}

// dd/mm/yyyy -> sortable epoch (0 if unparseable).
function dateKey(d: string): number {
  const m = String(d || '').match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (!m) return 0;
  const yr = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
  return new Date(yr, Number(m[2]) - 1, Number(m[1])).getTime() || 0;
}

// In-process cache per tab so repeated Account-tab opens don't refetch.
const cache = new Map<string, { at: number; rows: string[][] }>();
const TTL = 5 * 60 * 1000;

function gids(): string[] {
  const list = (process.env.LANDLORD_LEDGER_GIDS || process.env.LANDLORD_LEDGER_GID || '0')
    .split(',').map(s => s.trim()).filter(Boolean);
  return list.length ? list : ['0'];
}

async function loadTab(sheetId: string, gid: string): Promise<string[][]> {
  const key = `${sheetId}:${gid}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.rows;
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
  try {
    const res = await fetch(url, { redirect: 'follow', cache: 'no-store' });
    if (!res.ok) throw new Error(`sheet fetch ${res.status}`);
    const rows = parseCsv(await res.text());
    cache.set(key, { at: Date.now(), rows });
    return rows;
  } catch (e) {
    // The bank sheet updates daily; a transient fetch failure must not blank a
    // landlord's account, so fall back to the last successful read if we have
    // one. The next request (once the source recovers) refreshes it.
    if (hit) return hit.rows;
    throw e;
  }
}

// Build the row matcher for a query. Postcode → the sheet's address cell must
// contain it (reliable, order-independent). No postcode → fall back to the
// property's address line, matched per comma/newline segment on a leading
// boundary so "6 Browning Road" never matches "16 Browning Road".
function buildMatcher(q: LedgerQuery): ((addressCell: string) => boolean) | null {
  const pc = norm(q.postcode || '');
  if (pc) return (cell) => norm(cell).includes(pc);
  const al = norm(q.addressLine || '');
  if (al.length >= 6) {
    return (cell) => String(cell || '').split(/[,\n]/).map(norm).some(seg => seg.length >= 6 && seg.startsWith(al));
  }
  return null;
}

// Pull the property's transactions within [fromMs, toMs] out of one tab's rows.
function extractTab(rows: string[][], match: (addressCell: string) => boolean, fromMs: number, toMs: number): { txns: LedgerTxn[]; moneyIn: number; moneyOut: number } {
  const out = { txns: [] as LedgerTxn[], moneyIn: 0, moneyOut: 0 };
  if (!rows.length) return out;
  let hi = 0;
  for (let i = 0; i < Math.min(rows.length, 6); i++) {
    const h = rows[i].map(x => x.toLowerCase());
    if (h.some(x => x.includes('property address')) && h.some(x => x.trim() === 'amount')) { hi = i; break; }
  }
  const header = rows[hi].map(x => x.trim().toLowerCase());
  const colDate = header.findIndex(x => x === 'date');
  const colAmount = header.findIndex(x => x === 'amount');
  const colRef = header.findIndex(x => x.includes('payment reference'));
  const colAddr = header.findIndex(x => x.includes('property address'));
  if (colAmount < 0 || colAddr < 0) return out;
  for (let i = hi + 1; i < rows.length; i++) {
    const r = rows[i];
    if (!match(r[colAddr] || '')) continue;
    const date = (colDate >= 0 ? r[colDate] : '') || '';
    const k = dateKey(date);
    if (!k || k < fromMs || k > toMs) continue; // within the statement period only
    const amount = parseAmount(r[colAmount]);
    if (isNaN(amount) || amount === 0) continue;
    if (amount > 0) out.moneyIn += amount; else out.moneyOut += -amount;
    out.txns.push({ date, description: (colRef >= 0 ? r[colRef] : '') || '', amount });
  }
  return out;
}

const EMPTY: LedgerResult['totals'] = { moneyIn: 0, moneyOut: 0, net: 0 };

// Money in / out for one property over the statement period (default: current
// calendar year), matched by postcode or (fallback) address line.
export async function ledgerForProperty(q: LedgerQuery): Promise<LedgerResult> {
  const sheetId = process.env.LANDLORD_LEDGER_SHEET_ID;
  if (!sheetId) return { configured: false, transactions: [], totals: { ...EMPTY } };
  const matcher = buildMatcher(q);
  // No postcode and no usable address → nothing to match on. Signal it clearly
  // so the UI can ask the landlord to have the address/postcode corrected.
  if (!matcher) return { configured: true, unmatched: true, transactions: [], totals: { ...EMPTY } };

  const now = new Date();
  const fromMs = Number.isFinite(q.fromMs as number) ? (q.fromMs as number) : new Date(now.getFullYear(), 0, 1).getTime();
  const toMs = Number.isFinite(q.toMs as number) ? (q.toMs as number) : new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999).getTime();

  const txns: LedgerTxn[] = [];
  let moneyIn = 0, moneyOut = 0;
  try {
    for (const gid of gids()) {
      const rows = await loadTab(sheetId, gid);
      const t = extractTab(rows, matcher, fromMs, toMs);
      txns.push(...t.txns); moneyIn += t.moneyIn; moneyOut += t.moneyOut;
    }
  } catch {
    return { configured: true, error: true, transactions: [], totals: { ...EMPTY } };
  }
  txns.sort((a, b) => dateKey(b.date) - dateKey(a.date));
  return { configured: true, transactions: txns, totals: { moneyIn, moneyOut, net: moneyIn - moneyOut } };
}

// Back-compat convenience: match by postcode only.
export async function ledgerForPostcode(postcode: string): Promise<LedgerResult> {
  return ledgerForProperty({ postcode });
}
