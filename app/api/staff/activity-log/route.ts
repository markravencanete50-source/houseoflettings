// app/api/staff/activity-log/route.ts
// Sink for staff activity events fired by the staff dashboard. The dashboard's
// authedFetch calls this (fire-and-forget) after every write, and on section
// clicks — see app/dashboard/staff/page.tsx. The caller is identified from the
// verified session here, NOT from the request body, so entries can't be forged.
import { requireStaff } from '@/lib/staffApiAuth';
import { recordActivity } from '@/lib/activityLog';

export async function POST(request: Request) {
  try {
    // Any signed-in staff/admin may write their own activity — no feature gate.
    const auth = await requireStaff(request);
    if (auth instanceof Response) return auth;

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return Response.json({ message: 'Invalid body' }, { status: 400 });
    }

    await recordActivity(auth, {
      type: typeof body.type === 'string' ? body.type : 'action',
      method: typeof body.method === 'string' ? body.method : undefined,
      path: typeof body.path === 'string' ? body.path : undefined,
      section: typeof body.section === 'string' ? body.section : undefined,
      status: typeof body.status === 'number' ? body.status : undefined,
      meta: body.meta,
      userAgent: request.headers.get('user-agent'),
    });

    // 204: this is fire-and-forget; the client never needs a body back.
    return new Response(null, { status: 204 });
  } catch (e) {
    console.error('staff/activity-log POST error:', e);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
