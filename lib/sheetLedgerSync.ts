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
