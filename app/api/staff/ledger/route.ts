// app/api/staff/ledger/route.ts
// CRUD for the internal money ledger (ledgerEntries) — money against a property
// that isn't in the bank Google Sheet. Entries merge into the landlord statement
// alongside the live Sheet lines. Gated by the 'properties' feature.
//   GET    ?propertyId=…   list entries for a property (newest first)
//   POST   create an entry
//   PATCH  edit an entry   { id, ...fields }
//   DELETE ?id=…           remove an entry (hard delete; entries are cheap)
import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { requireStaff, getAdminDb } from '@/lib/staffApiAuth';
import { logAction } from '@/lib/activityLog';
import { LEDGER_TYPES, defaultDirection } from '@/lib/ledgerEntries';

const TYPE_KEYS = new Set(LEDGER_TYPES.map(t => t.key));
const iso = (v: any) => v?.toDate?.()?.toISOString?.() || null;

function pick(raw: any): Record<string, unknown> | { error: string } {
  const out: Record<string, unknown> = {};
  if (raw.type !== undefined) {
    const type = String(raw.type || '').trim();
    if (!TYPE_KEYS.has(type as any)) return { error: 'Invalid entry type.' };
    out.type = type;
  }
  if (raw.direction !== undefined) {
    const d = raw.direction === 'in' ? 'in' : 'out';
    out.direction = d;
  }
  if (raw.amount !== undefined) {
    const n = Math.abs(Number(raw.amount));
    if (!Number.isFinite(n)) return { error: 'A valid amount is required.' };
    out.amount = Math.round(n * 100) / 100;
  }
  if (raw.date !== undefined) {
    const d = String(raw.date || '').trim();
    if (d && !/^\d{4}-\d{2}-\d{2}$/.test(d)) return { error: 'Date must be yyyy-mm-dd.' };
    out.date = d;
  }
  if (raw.description !== undefined) out.description = String(raw.description || '').slice(0, 300);
  if (raw.reference !== undefined) out.reference = String(raw.reference || '').slice(0, 120);
  if (raw.propertyId !== undefined) out.propertyId = String(raw.propertyId || '').slice(0, 200);
  if (raw.landlordId !== undefined) out.landlordId = String(raw.landlordId || '').slice(0, 200);
  if (raw.propertyLabel !== undefined) out.propertyLabel = String(raw.propertyLabel || '').slice(0, 400);
  return out;
}

export async function GET(request: Request) {
  try {
    const auth = await requireStaff(request, 'properties');
    if (auth instanceof Response) return auth;
    const propertyId = (new URL(request.url).searchParams.get('propertyId') || '').trim();
    if (!propertyId) return NextResponse.json({ message: 'A propertyId is required.' }, { status: 400 });

    const snap = await getAdminDb().collection('ledgerEntries').where('propertyId', '==', propertyId).limit(500).get();
    const entries = snap.docs
      .map(d => ({ id: d.id, ...(d.data() as any), createdAt: iso((d.data() as any).createdAt) }))
      .sort((a: any, b: any) => String(b.date || '').localeCompare(String(a.date || '')) || String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
    return NextResponse.json({ entries }, { status: 200 });
  } catch (e) {
    console.error('staff/ledger GET error:', e);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireStaff(request, 'properties');
    if (auth instanceof Response) return auth;
    const body = await request.json().catch(() => ({}));
    const fields = pick(body);
    if ('error' in fields) return NextResponse.json({ message: fields.error }, { status: 400 });
    if (!fields.propertyId) return NextResponse.json({ message: 'Assign the entry to a property.' }, { status: 400 });
    if (!fields.type) return NextResponse.json({ message: 'Choose an entry type.' }, { status: 400 });
    if (!fields.amount) return NextResponse.json({ message: 'Enter an amount.' }, { status: 400 });
    if (!fields.direction) fields.direction = defaultDirection(String(fields.type));

    const docRef = await getAdminDb().collection('ledgerEntries').add({
      ...fields,
      source: 'manual',
      createdByUid: auth.uid,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    await logAction(auth, 'POST', '/api/staff/ledger', { id: docRef.id, propertyId: fields.propertyId });
    return NextResponse.json({ id: docRef.id }, { status: 201 });
  } catch (e) {
    console.error('staff/ledger POST error:', e);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireStaff(request, 'properties');
    if (auth instanceof Response) return auth;
    const body = await request.json().catch(() => ({}));
    const id = (body.id || '').toString().trim();
    if (!id) return NextResponse.json({ message: 'An entry id is required.' }, { status: 400 });
    const fields = pick(body);
    if ('error' in fields) return NextResponse.json({ message: fields.error }, { status: 400 });
    if (!Object.keys(fields).length) return NextResponse.json({ message: 'No fields to update.' }, { status: 400 });

    await getAdminDb().collection('ledgerEntries').doc(id).update({ ...fields, updatedAt: FieldValue.serverTimestamp(), lastEditBy: auth.uid });
    await logAction(auth, 'PATCH', '/api/staff/ledger', { id });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    console.error('staff/ledger PATCH error:', e);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await requireStaff(request, 'properties');
    if (auth instanceof Response) return auth;
    const id = (new URL(request.url).searchParams.get('id') || '').trim();
    if (!id) return NextResponse.json({ message: 'An entry id is required.' }, { status: 400 });
    await getAdminDb().collection('ledgerEntries').doc(id).delete();
    await logAction(auth, 'DELETE', '/api/staff/ledger', { id });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    console.error('staff/ledger DELETE error:', e);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
