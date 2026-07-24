// lib/ledgerConfig.ts
// Runtime switch for where the landlord statement reads money from:
//   'sheet'  → live bank Google Sheet + internal ledger entries (excluding the
//              sheet mirror). This is the safe default.
//   'ledger' → the internal ledger ONLY (including the mirrored sheet rows); the
//              sheet is no longer read at statement time. This is the step-4
//              cutover — fully reversible by flipping back to 'sheet'.
// Stored in Firestore (config/ledger) so it can be toggled from the admin UI
// without a redeploy, and cached briefly so it doesn't add a read per statement.
import { FieldValue } from 'firebase-admin/firestore';
import type { getAdminDb } from './staffApiAuth';

export type LedgerReadMode = 'sheet' | 'ledger';

let cache: { mode: LedgerReadMode; at: number } | null = null;
const TTL = 30_000;

export async function getLedgerReadMode(db: ReturnType<typeof getAdminDb>): Promise<LedgerReadMode> {
  if (cache && Date.now() - cache.at < TTL) return cache.mode;
  try {
    const d = await db.collection('config').doc('ledger').get();
    const mode: LedgerReadMode = d.exists && (d.data() as any)?.readMode === 'ledger' ? 'ledger' : 'sheet';
    cache = { mode, at: Date.now() };
    return mode;
  } catch {
    return 'sheet';
  }
}

export async function setLedgerReadMode(db: ReturnType<typeof getAdminDb>, mode: LedgerReadMode): Promise<void> {
  await db.collection('config').doc('ledger').set({ readMode: mode, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  cache = { mode, at: Date.now() };
}
