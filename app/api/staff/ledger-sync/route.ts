// app/api/staff/ledger-sync/route.ts
// Manual trigger for the bank-sheet → ledger mirror (admin-only). Reads the
// Google Sheet and imports new rows into ledgerEntries (source='sheet'), keyed
// by property. The sheet is never modified. See lib/sheetLedgerSync.
import { NextResponse } from 'next/server';
import { requireStaff, getAdminDb } from '@/lib/staffApiAuth';
import { logAction } from '@/lib/activityLog';
import { syncSheetToLedger } from '@/lib/sheetLedgerSync';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const auth = await requireStaff(request, 'properties');
    if (auth instanceof Response) return auth;
    if (auth.role !== 'admin') return NextResponse.json({ message: 'Admin only.' }, { status: 403 });

    const result = await syncSheetToLedger(getAdminDb());
    await logAction(auth, 'POST', '/api/staff/ledger-sync', { imported: result.imported, unassigned: result.unassigned });
    return NextResponse.json(result, { status: 200 });
  } catch (e) {
    console.error('staff/ledger-sync error:', e);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
