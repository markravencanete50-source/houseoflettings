// app/api/admin/deleted/route.ts
// The recycle bin, ADMIN-ONLY (Mark / Kasra). GET lists what has been deleted
// in the last 24h (expired items are purged first); POST restores an item or
// permanently deletes it now. Reads/writes go through the Admin SDK.
import { requireStaff } from '@/lib/staffApiAuth';
import { listTrash, restoreTrashItem, purgeTrashItem } from '@/lib/softDelete';

export async function GET(request: Request) {
  try {
    const auth = await requireStaff(request);
    if (auth instanceof Response) return auth;
    if (auth.role !== 'admin') {
      return Response.json({ message: 'Only an administrator can view deleted items.' }, { status: 403 });
    }

    const items = await listTrash();
    return Response.json({ items, count: items.length }, { status: 200 });
  } catch (e) {
    console.error('admin/deleted GET error:', e);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireStaff(request);
    if (auth instanceof Response) return auth;
    if (auth.role !== 'admin') {
      return Response.json({ message: 'Only an administrator can restore or purge deleted items.' }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const id = String(body?.id || '').trim();
    const action = String(body?.action || '').trim();
    if (!id) return Response.json({ message: 'An item id is required.' }, { status: 400 });

    if (action === 'restore') {
      const result = await restoreTrashItem(id);
      if (!result.ok) {
        const msg = result.reason === 'expired'
          ? 'This item is more than 24 hours old and can no longer be restored.'
          : result.reason === 'not-found'
            ? 'This item is no longer in the bin.'
            : 'Could not restore this item.';
        return Response.json({ message: msg, reason: result.reason }, { status: 400 });
      }
      return Response.json({ ok: true }, { status: 200 });
    }

    if (action === 'purge') {
      const result = await purgeTrashItem(id);
      if (!result.ok) return Response.json({ message: 'This item is no longer in the bin.' }, { status: 400 });
      return Response.json({ ok: true }, { status: 200 });
    }

    return Response.json({ message: 'Unknown action.' }, { status: 400 });
  } catch (e) {
    console.error('admin/deleted POST error:', e);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
