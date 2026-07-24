// app/api/cron/ledger-sync/route.ts
// Daily cron (vercel.json) that mirrors the bank Google Sheet into the internal
// ledger. Secured with CRON_SECRET (same pattern as the other crons). Read-only
// against the sheet; idempotent.
import { getAdminDb } from '@/lib/staffApiAuth';
import { syncSheetToLedger } from '@/lib/sheetLedgerSync';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const secret = process.env.CRON_SECRET;
    if (secret) {
      if (request.headers.get('authorization') !== `Bearer ${secret}`) {
        return Response.json({ message: 'Unauthorized' }, { status: 401 });
      }
    }
    const result = await syncSheetToLedger(getAdminDb());
    return Response.json({ ok: true, ...result }, { status: 200 });
  } catch (e) {
    console.error('cron/ledger-sync error:', e);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
