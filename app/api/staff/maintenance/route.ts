// app/api/staff/maintenance/route.ts
// Maintenance requests for the staff dashboard: list (GET) and status update
// (PATCH). Both accept the Bearer ID token OR the session cookie via
// requireStaff, so they work on networks that block Google.
import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { requireStaff, getAdminDb } from '@/lib/staffApiAuth';
import { softDeleteDoc } from '@/lib/softDelete';
import { logAction } from '@/lib/activityLog';
import { normalisePostcode } from '@/lib/portalMatch';
import { sanitizeUploadUrlFieldsDeep } from '@/lib/security';

// Cost breakdown line items: [{ label, amount }]. Amount coerced to a number.
function cleanBreakdown(raw: any): { label: string; amount: number }[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((r: any) => ({ label: String(r?.label || '').slice(0, 120), amount: Number(r?.amount) }))
    .filter(r => r.label && Number.isFinite(r.amount))
    .slice(0, 40);
}

// Fields a staff ticket can carry / be edited with (never the client's id/dates).
function pickTicketFields(raw: any): Record<string, unknown> {
  const b = sanitizeUploadUrlFieldsDeep(raw || {});
  const out: Record<string, unknown> = {};
  const str = (k: string, max = 400) => { if (b[k] !== undefined) out[k] = String(b[k] ?? '').slice(0, max); };
  str('title'); str('issueDescription', 2000); str('category', 80); str('contractor', 160);
  str('propertyId', 200); str('landlordId', 200); str('propertyAddress', 400); str('propertyLabel', 400);
  str('fullName', 200); str('email', 200); str('contactNumber', 60);
  if (b.postcode !== undefined || b.propertyAddress !== undefined) {
    out.postcode = normalisePostcode(String(b.postcode || b.propertyAddress || b.propertyLabel || '')) || '';
  }
  if (b.cost !== undefined) { const n = Number(b.cost); out.cost = Number.isFinite(n) && n >= 0 ? n : 0; }
  if (b.billToLandlord !== undefined) out.billToLandlord = !!b.billToLandlord;
  if (b.breakdown !== undefined) out.breakdown = cleanBreakdown(b.breakdown);
  return out;
}

export async function GET(request: Request) {
  try {
    const auth = await requireStaff(request, 'maintenance');
    if (auth instanceof Response) return auth;

    const snapshot = await getAdminDb().collection('maintenanceRequests')
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();

    const requests = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        submittedAt: data.createdAt?.toDate?.()?.toISOString() || null,
      };
    });

    return NextResponse.json({ requests }, { status: 200 });
  } catch (e) {
    console.error('staff/maintenance error:', e);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

const MAINT_STATUSES = ['open', 'in-progress', 'resolved', 'cancelled'] as const;

// Create a maintenance ticket from the dashboard, assigned to a property. This
// is how a repair cost reaches a landlord's Account statement (as a deduction)
// once the ticket is completed and marked "bill to landlord".
export async function POST(request: Request) {
  try {
    const auth = await requireStaff(request, 'maintenance');
    if (auth instanceof Response) return auth;

    const body = await request.json().catch(() => ({}));
    const fields = pickTicketFields(body);
    const desc = String(fields.issueDescription || fields.title || '').trim();
    if (!desc) return NextResponse.json({ message: 'A description of the job is required.' }, { status: 400 });
    if (!fields.propertyId && !fields.propertyAddress && !fields.postcode) {
      return NextResponse.json({ message: 'Please assign the ticket to a property.' }, { status: 400 });
    }

    const status = MAINT_STATUSES.includes(body.status) ? body.status : 'open';
    const docRef = await getAdminDb().collection('maintenanceRequests').add({
      ...fields,
      status,
      source: 'staff-ticket',
      createdByUid: auth.uid,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    await logAction(auth, 'POST', '/api/staff/maintenance', { id: docRef.id, title: fields.title || desc.slice(0, 60) });
    return NextResponse.json({ id: docRef.id }, { status: 201 });
  } catch (e) {
    console.error('staff/maintenance POST error:', e);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// Update a maintenance request/ticket: status and/or the ticket fields
// (cost, breakdown, bill-to-landlord, property assignment, description).
export async function PATCH(request: Request) {
  try {
    const auth = await requireStaff(request, 'maintenance');
    if (auth instanceof Response) return auth;

    const body = await request.json();
    const id = (body.id || '').toString().trim();
    if (!id) return NextResponse.json({ message: 'Request id is required.' }, { status: 400 });

    const updates: Record<string, unknown> = { ...pickTicketFields(body), updatedAt: FieldValue.serverTimestamp(), lastEditBy: auth.uid };
    if (body.status !== undefined) {
      const status = String(body.status || '').trim();
      if (!MAINT_STATUSES.includes(status as any)) return NextResponse.json({ message: 'Invalid status.' }, { status: 400 });
      updates.status = status;
      updates.lastStatusBy = auth.uid;
    }
    if (Object.keys(updates).length <= 2) return NextResponse.json({ message: 'No fields to update.' }, { status: 400 });

    await getAdminDb().collection('maintenanceRequests').doc(id).update(updates);
    await logAction(auth, 'PATCH', '/api/staff/maintenance', { id, status: updates.status });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    console.error('staff/maintenance PATCH error:', e);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// Delete a maintenance request. ADMIN-ONLY, soft-deletes into the 24h recycle bin.
export async function DELETE(request: Request) {
  try {
    const auth = await requireStaff(request, 'maintenance');
    if (auth instanceof Response) return auth;
    if (auth.role !== 'admin') {
      return NextResponse.json({ message: 'Only an administrator can delete a maintenance request.' }, { status: 403 });
    }
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return NextResponse.json({ message: 'A request id is required' }, { status: 400 });

    const result = await softDeleteDoc({ collection: 'maintenanceRequests', docId: id, actor: auth, typeLabel: 'Maintenance request' });
    if (!result.ok) return NextResponse.json({ message: 'Request not found' }, { status: 404 });
    await logAction(auth, 'DELETE', '/api/staff/maintenance', { id });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    console.error('staff/maintenance DELETE error:', e);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
