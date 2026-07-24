// app/api/staff/ledger-sync/route.ts
// Manual trigger for the bank-sheet → ledger mirror (admin-only). Reads the
// Google Sheet and imports new rows into ledgerEntries (source='sheet'), keyed
// by property. The sheet is never modified. See lib/sheetLedgerSync.
import { NextResponse } from 'next/server';
import { requireStaff, getAdminDb } from '@/lib/staffApiAuth';
import { logAction } from '@/lib/activityLog';
import { syncSheetToLedger, getReconciliation, getUnassigned, resolveUnassigned } from '@/lib/sheetLedgerSync';

export const dynamic = 'force-dynamic';

// Reconciliation + the unassigned queue.
export async function GET(request: Request) {
  try {
    const auth = await requireStaff(request, 'properties');
    if (auth instanceof Response) return auth;
    if (auth.role !== 'admin') return NextResponse.json({ message: 'Admin only.' }, { status: 403 });
    const db = getAdminDb();
    const [reconciliation, unassigned] = await Promise.all([getReconciliation(db), getUnassigned(db)]);
    return NextResponse.json({ reconciliation, unassigned }, { status: 200 });
  } catch (e) {
    console.error('staff/ledger-sync GET error:', e);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireStaff(request, 'properties');
    if (auth instanceof Response) return auth;
    if (auth.role !== 'admin') return NextResponse.json({ message: 'Admin only.' }, { status: 403 });

    const body = await request.json().catch(() => ({}));
    const db = getAdminDb();

    // Assign a queued row (optionally all with the same address) to a property.
    if (body.action === 'resolve') {
      if (!body.id || !body.propertyId) return NextResponse.json({ message: 'A queued row and a property are required.' }, { status: 400 });
      const result = await resolveUnassigned(db, { id: String(body.id), propertyId: String(body.propertyId), applyToAddress: !!body.applyToAddress });
      if (result.error) return NextResponse.json({ message: result.error }, { status: 400 });
      await logAction(auth, 'POST', '/api/staff/ledger-sync', { action: 'resolve', resolved: result.resolved });
      return NextResponse.json(result, { status: 200 });
    }

    // Default: run the mirror sync.
    const result = await syncSheetToLedger(db);
    await logAction(auth, 'POST', '/api/staff/ledger-sync', { imported: result.imported, unassigned: result.unassigned });
    return NextResponse.json(result, { status: 200 });
  } catch (e) {
    console.error('staff/ledger-sync error:', e);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
