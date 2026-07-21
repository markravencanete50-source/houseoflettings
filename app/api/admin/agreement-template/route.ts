// app/api/admin/agreement-template/route.ts
// Admin-only save of the agreement wording overrides. Editing the legal clause
// text is a high-trust action, so it is gated on the admin role (not just any
// staff feature). The submitted overrides are validated by sanitizeTemplate
// before they are stored.
import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { requireStaff, getAdminDb } from '@/lib/staffApiAuth';
import { loadAgreementTemplate, sanitizeTemplate, TEMPLATE_COLLECTION, TEMPLATE_DOC } from '@/lib/agreementTemplateStore';

export async function GET(request: Request) {
  const auth = await requireStaff(request);
  if (auth instanceof Response) return auth;
  if (auth.role !== 'admin') return NextResponse.json({ message: 'Admins only.' }, { status: 403 });
  const template = await loadAgreementTemplate(getAdminDb());
  return NextResponse.json({ template }, { status: 200 });
}

export async function POST(request: Request) {
  const auth = await requireStaff(request);
  if (auth instanceof Response) return auth;
  if (auth.role !== 'admin') return NextResponse.json({ message: 'Admins only.' }, { status: 403 });
  try {
    const body = await request.json().catch(() => ({}));
    const template = sanitizeTemplate(body.template);
    await getAdminDb().collection(TEMPLATE_COLLECTION).doc(TEMPLATE_DOC).set({
      ...template,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: auth.uid,
    });
    return NextResponse.json({ ok: true, template }, { status: 200 });
  } catch (e) {
    console.error('admin/agreement-template POST error:', e);
    return NextResponse.json({ message: 'Could not save. Please try again.' }, { status: 500 });
  }
}
