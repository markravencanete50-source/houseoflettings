// app/api/cron/purge-deleted/route.ts
// Daily backstop that permanently removes recycle-bin items whose 24h window has
// passed. Scheduled in vercel.json. The admin Deleted tab also purges expired
// items whenever it is opened, so this is belt-and-braces for when nobody looks.
//
// When CRON_SECRET is set (Vercel injects it as `Authorization: Bearer <secret>`
// on cron invocations), we require it. If it isn't set, we still allow the call
// because the endpoint only ever deletes items that are already past expiry.
import { purgeExpiredTrash } from '@/lib/softDelete';

// Never prerender/evaluate this at build time — it must only run when Vercel Cron
// (or an admin) actually calls it, otherwise the build would trigger a purge.
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const secret = process.env.CRON_SECRET;
    if (secret) {
      const auth = request.headers.get('authorization');
      if (auth !== `Bearer ${secret}`) {
        return Response.json({ message: 'Unauthorized' }, { status: 401 });
      }
    }
    const purged = await purgeExpiredTrash();
    return Response.json({ ok: true, purged }, { status: 200 });
  } catch (e) {
    console.error('cron/purge-deleted error:', e);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
