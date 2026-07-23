// app/api/admin/activity-logs/route.ts
// Read the staff activity trail for the admin dashboard's "Activity Logs" tab.
// ADMIN-ONLY (Mark / Kasra): staff must never see who did what across the team.
// Reads via the Admin SDK, so no Firestore client rules are involved.
import { requireStaff, getAdminDb } from '@/lib/staffApiAuth';
import { ACTIVITY_COLLECTION } from '@/lib/activityLog';

const iso = (v: any) => v?.toDate?.()?.toISOString?.() || null;

export async function GET(request: Request) {
  try {
    const auth = await requireStaff(request);
    if (auth instanceof Response) return auth;
    if (auth.role !== 'admin') {
      return Response.json({ message: 'Only an administrator can view activity logs.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(Number(searchParams.get('limit')) || 300, 1), 500);
    const actorUid = (searchParams.get('staff') || '').trim();
    const feature = (searchParams.get('feature') || '').trim();

    // Order by time only (a single-field index Firestore provides automatically),
    // then filter in-memory — this keeps the feature free of composite indexes.
    const snap = await getAdminDb().collection(ACTIVITY_COLLECTION)
      .orderBy('createdAt', 'desc')
      .limit(actorUid || feature ? 500 : limit)
      .get();

    let logs = snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        actorUid: data.actorUid || '',
        actorName: data.actorName || '',
        actorEmail: data.actorEmail || '',
        actorRole: data.actorRole || '',
        type: data.type || 'action',
        method: data.method || null,
        feature: data.feature || 'other',
        section: data.section || null,
        action: data.action || '',
        summary: data.summary || '',
        targetId: data.targetId || null,
        httpStatus: data.httpStatus ?? null,
        ok: data.ok ?? null,
        createdAt: iso(data.createdAt),
      };
    });

    if (actorUid) logs = logs.filter(l => l.actorUid === actorUid);
    if (feature) logs = logs.filter(l => l.feature === feature);
    if (logs.length > limit) logs = logs.slice(0, limit);

    return Response.json({ logs, count: logs.length }, { status: 200 });
  } catch (e) {
    console.error('admin/activity-logs GET error:', e);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
