// app/api/landlord/compliance/route.ts
// Landlord compliance documents (Gas, EPC, EICR, Insurance) per property.
//   GET  ?propertyId= -> the caller's docs for that property
//   POST               -> upsert one document (file url + issue/expiry dates)
// Cookie/Bearer authenticated as a landlord; every doc is stored under the
// caller's uid, so a landlord only ever reads/writes their own. Stored in the
// server-only `complianceDocs` collection (deny-all in firestore.rules).
import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { requireLandlord } from '@/lib/landlordAuth';
import { getAdminDb } from '@/lib/staffApiAuth';
import { isComplianceType } from '@/lib/compliance';

export const dynamic = 'force-dynamic';

const COLLECTION = 'complianceDocs';
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const docId = (uid: string, propertyId: string, type: string) =>
  `${uid}_${String(propertyId).replace(/[^\w-]/g, '_')}_${type}`;

function publicShape(data: any) {
  return {
    type: data.type,
    fileUrl: data.fileUrl || '',
    fileName: data.fileName || '',
    issueDate: data.issueDate || '',
    expiryDate: data.expiryDate || '',
    arrangeRequestedAt: data.arrangeRequestedAt ? true : false,
    updatedAt: typeof data.updatedAt?.toMillis === 'function' ? data.updatedAt.toMillis() : null,
  };
}

export async function GET(request: Request) {
  const auth = await requireLandlord(request);
  if (auth instanceof Response) return auth;
  const propertyId = new URL(request.url).searchParams.get('propertyId') || '';
  if (!propertyId) return NextResponse.json({ message: 'Missing propertyId.' }, { status: 400 });
  try {
    // Single-field query (no composite index); filter to the property in memory.
    const snap = await getAdminDb().collection(COLLECTION).where('landlordUid', '==', auth.uid).get();
    const docs: Record<string, ReturnType<typeof publicShape>> = {};
    snap.docs.forEach(d => {
      const data = d.data() || {};
      if (data.propertyId === propertyId && isComplianceType(data.type)) docs[data.type] = publicShape(data);
    });
    return NextResponse.json({ docs }, { status: 200 });
  } catch (e) {
    console.error('compliance GET failed:', e);
    return NextResponse.json({ message: 'Could not load your documents.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireLandlord(request);
  if (auth instanceof Response) return auth;
  try {
    const body = await request.json().catch(() => ({}));
    const type = String(body.type || '');
    const propertyId = String(body.propertyId || '');
    const fileUrl = String(body.fileUrl || '');
    const fileName = String(body.fileName || '').slice(0, 200);
    const issueDate = String(body.issueDate || '');
    const expiryDate = String(body.expiryDate || '');
    const propertyLabel = String(body.propertyLabel || '').slice(0, 200);
    const postcode = String(body.postcode || '').slice(0, 12);

    if (!isComplianceType(type)) return NextResponse.json({ message: 'Unknown document type.' }, { status: 400 });
    if (!propertyId) return NextResponse.json({ message: 'Missing property.' }, { status: 400 });
    if (!/^https:\/\/res\.cloudinary\.com\//.test(fileUrl)) {
      return NextResponse.json({ message: 'Please upload the document first.' }, { status: 400 });
    }
    if (!ISO_DATE.test(expiryDate)) return NextResponse.json({ message: 'Please enter the expiry date.' }, { status: 400 });
    if (issueDate && !ISO_DATE.test(issueDate)) return NextResponse.json({ message: 'The issue date is not valid.' }, { status: 400 });

    const id = docId(auth.uid, propertyId, type);
    const ref = getAdminDb().collection(COLLECTION).doc(id);
    const existing = await ref.get();

    await ref.set({
      landlordUid: auth.uid,
      landlordEmail: auth.email || '',
      landlordName: auth.name || '',
      landlordPhone: auth.phone || '',
      propertyId,
      propertyLabel,
      postcode,
      type,
      fileUrl,
      fileName,
      issueDate,
      expiryDate,
      // A fresh upload starts a new reminder cycle for the new expiry date.
      reminderForExpiry: null,
      arrangeRequestedAt: null,
      selfArrangeAt: null,
      actionToken: null,
      updatedAt: FieldValue.serverTimestamp(),
      ...(existing.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
    }, { merge: true });

    return NextResponse.json({ ok: true, doc: publicShape({ type, fileUrl, fileName, issueDate, expiryDate }) }, { status: 200 });
  } catch (e) {
    console.error('compliance POST failed:', e);
    return NextResponse.json({ message: 'Could not save the document. Please try again.' }, { status: 500 });
  }
}
