// lib/sheetLedgerSync.ts
// Mirrors the bank Google Sheet into the internal ledger (ledgerEntries, tagged
// source='sheet'), keyed by propertyId. Idempotent: each sheet row has a stable
// sheetKey and is imported once. Rows whose address doesn't match a property go
// to a `sheetSyncUnassigned` queue for staff to resolve.
//
// IMPORTANT: while the statement still live-reads the sheet, the landlord ledger
// route EXCLUDES source='sheet' entries so these never double-count. The mirror
// just builds the ledger in the background, ready for the eventual ledger-only
// cutover (step 4). The sheet itself is never modified.
import { FieldValue } from 'firebase-admin/firestore';
import { readAllSheetTransactions } from './landlordLedger';
import { normalisePostcode } from './portalMatch';
import type { getAdminDb } from './staffApiAuth';

const norm = (s: string) => (s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

// dd/mm/yyyy → yyyy-mm-dd (internal ledger date format), '' if unparseable.
function isoDate(dmy: string): string {
  const m = String(dmy || '').match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (!m) return '';
  const y = m[3].length === 2 ? `20${m[3]}` : m[3];
  return `${y}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
}

export type SyncResult = { configured: boolean; error?: boolean; imported: number; skipped: number; unassigned: number; total: number };

export async function syncSheetToLedger(db: ReturnType<typeof getAdminDb>): Promise<SyncResult> {
  const { configured, error, rows } = await readAllSheetTransactions();
  if (!configured) return { configured: false, imported: 0, skipped: 0, unassigned: 0, total: 0 };
  if (error) return { configured: true, error: true, imported: 0, skipped: 0, unassigned: 0, total: 0 };

  // Map each property's postcode → { id, landlordId, label } for matching.
  const propsSnap = await db.collection('properties').get();
  const byPostcode = new Map<string, { id: string; landlordId: string; label: string }>();
  for (const d of propsSnap.docs) {
    const p = d.data() as any;
    const pc = norm(normalisePostcode(String(p.location || '')) || '');
    if (pc && !byPostcode.has(pc)) byPostcode.set(pc, { id: d.id, landlordId: p.landlordId || '', label: p.location || '' });
  }

  // Already-imported sheet keys (idempotency).
  const existing = await db.collection('ledgerEntries').where('source', '==', 'sheet').get();
  const seen = new Set<string>(existing.docs.map(d => (d.data() as any).sheetKey).filter(Boolean));

  let imported = 0, skipped = 0, unassigned = 0;
  let batch = db.batch();
  let ops = 0;
  const flush = async () => { if (ops) { await batch.commit(); batch = db.batch(); ops = 0; } };

  for (const r of rows) {
    if (seen.has(r.sheetKey)) { skipped++; continue; }
    const pc = norm(normalisePostcode(r.address) || '');
    const match = pc ? byPostcode.get(pc) : undefined;

    if (!match) {
      const ref = db.collection('sheetSyncUnassigned').doc(`u_${r.sheetKey.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 240)}`);
      batch.set(ref, { sheetKey: r.sheetKey, date: r.date, amount: r.amount, description: r.description, address: r.address, resolved: false, createdAt: FieldValue.serverTimestamp() }, { merge: true });
      unassigned++; ops++;
    } else {
      const direction = r.amount >= 0 ? 'in' : 'out';
      const ref = db.collection('ledgerEntries').doc();
      batch.set(ref, {
        source: 'sheet', sheetKey: r.sheetKey,
        propertyId: match.id, landlordId: match.landlordId, propertyLabel: match.label,
        type: direction === 'in' ? 'rent_in' : 'payment_to_landlord', direction,
        amount: Math.abs(r.amount), date: isoDate(r.date),
        description: r.description || '', reference: r.description || '',
        createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
      });
      seen.add(r.sheetKey); imported++; ops++;
    }
    if (ops >= 400) await flush();
  }
  await flush();
  return { configured: true, imported, skipped, unassigned, total: rows.length };
}

// ── Reconciliation: does the mirror account for every sheet row? ─────────────
export type Reconciliation = {
  configured: boolean;
  sheet: { count: number; in: number; out: number };
  ledger: { count: number; in: number; out: number };
  unassigned: { count: number; in: number; out: number };
  balanced: boolean; // every sheet row is either mirrored or queued
};

export async function getReconciliation(db: ReturnType<typeof getAdminDb>): Promise<Reconciliation> {
  const { configured, rows } = await readAllSheetTransactions();
  const sheet = {
    count: rows.length,
    in: rows.reduce((s, r) => s + (r.amount > 0 ? r.amount : 0), 0),
    out: rows.reduce((s, r) => s + (r.amount < 0 ? -r.amount : 0), 0),
  };
  const led = await db.collection('ledgerEntries').where('source', '==', 'sheet').get();
  let lIn = 0, lOut = 0;
  led.docs.forEach(d => { const e = d.data() as any; const a = Math.abs(Number(e.amount) || 0); if (e.direction === 'in') lIn += a; else lOut += a; });
  const un = await db.collection('sheetSyncUnassigned').get();
  const unresolved = un.docs.filter(d => !(d.data() as any).resolved);
  let uIn = 0, uOut = 0;
  unresolved.forEach(d => { const e = d.data() as any; const a = Math.abs(Number(e.amount) || 0); if ((e.amount || 0) > 0) uIn += a; else uOut += a; });
  return {
    configured,
    sheet,
    ledger: { count: led.size, in: lIn, out: lOut },
    unassigned: { count: unresolved.length, in: uIn, out: uOut },
    balanced: sheet.count === led.size + unresolved.length,
  };
}

export async function getUnassigned(db: ReturnType<typeof getAdminDb>) {
  const snap = await db.collection('sheetSyncUnassigned').limit(500).get();
  return snap.docs
    .filter(d => !(d.data() as any).resolved)
    .map(d => { const e = d.data() as any; return { id: d.id, date: e.date || '', amount: Number(e.amount) || 0, description: e.description || '', address: e.address || '' }; })
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

// Assign one queued row (optionally every queued row with the same address) to a
// property: create its 'sheet' ledger entry and remove it from the queue.
export async function resolveUnassigned(db: ReturnType<typeof getAdminDb>, opts: { id: string; propertyId: string; applyToAddress?: boolean }): Promise<{ resolved: number; error?: string }> {
  const propSnap = await db.collection('properties').doc(opts.propertyId).get();
  if (!propSnap.exists) return { resolved: 0, error: 'Property not found.' };
  const p = propSnap.data() as any;
  const match = { id: propSnap.id, landlordId: p.landlordId || '', label: p.location || p.title || '' };

  const first = await db.collection('sheetSyncUnassigned').doc(opts.id).get();
  if (!first.exists) return { resolved: 0, error: 'That queued row no longer exists.' };

  let targets = [first];
  if (opts.applyToAddress) {
    const addrNorm = norm((first.data() as any).address || '');
    const all = await db.collection('sheetSyncUnassigned').get();
    targets = all.docs.filter(d => !(d.data() as any).resolved && norm((d.data() as any).address || '') === addrNorm);
  }

  const existing = await db.collection('ledgerEntries').where('source', '==', 'sheet').get();
  const seen = new Set<string>(existing.docs.map(d => (d.data() as any).sheetKey).filter(Boolean));

  let resolved = 0;
  let batch = db.batch(); let ops = 0;
  const flush = async () => { if (ops) { await batch.commit(); batch = db.batch(); ops = 0; } };
  for (const t of targets) {
    const r = t.data() as any;
    if (!seen.has(r.sheetKey)) {
      const direction = r.amount >= 0 ? 'in' : 'out';
      const ref = db.collection('ledgerEntries').doc();
      batch.set(ref, {
        source: 'sheet', sheetKey: r.sheetKey, propertyId: match.id, landlordId: match.landlordId, propertyLabel: match.label,
        type: direction === 'in' ? 'rent_in' : 'payment_to_landlord', direction,
        amount: Math.abs(r.amount), date: isoDate(r.date), description: r.description || '', reference: r.description || '',
        createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
      });
      seen.add(r.sheetKey); ops++;
    }
    batch.delete(t.ref); ops++; resolved++;
    if (ops >= 400) await flush();
  }
  await flush();
  return { resolved };
}
