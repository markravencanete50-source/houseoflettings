// app/api/staff/agreements/route.ts
// Signed landlord management agreements for the staff dashboard.
//   GET   — list
//   PATCH — status change  { id, status }
//           OR edit        { id, action:'edit', fields, mode:'save'|'correct'|'reissue' }
//             save    : update the record only (no email)
//             correct : update + regenerate the PDF and email an updated copy
//             reissue : update + send the landlord a link to review and re-sign
// All accept the Bearer ID token OR the session cookie via requireStaff.
import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { requireStaff, getAdminDb } from '@/lib/staffApiAuth';
import { htmlEscapeDeep, sanitizeUploadUrlFieldsDeep } from '@/lib/security';
import { findBundle } from '@/lib/agreementContent';
import { issueAgreementDocuments, sendAgreementEmail, propertyLine, feeLine } from '@/lib/agreementDocuments';
import { loadAgreementTemplate } from '@/lib/agreementTemplateStore';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.houseoflettings.uk';
const REISSUE_TTL_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

const AGREEMENT_STATUSES = ['signed', 'countersigned', 'active', 'completed', 'cancelled'] as const;

// Only these fields can be changed from the dashboard editor.
const EDITABLE_FIELDS = new Set([
  'fullName', 'email', 'phone', 'contactAddress',
  'jointLandlord', 'landlord2Name', 'landlord2Email', 'residency',
  'postcode', 'street', 'city', 'county', 'flatNumber',
  'propertyType', 'bedrooms', 'bathrooms', 'receptions',
  'furnishing', 'parking', 'availableFrom', 'currentRent', 'securityNote',
  'selectedPackage', 'selectedPackageId',
]);

export async function GET(request: Request) {
  try {
    const auth = await requireStaff(request, 'agreements');
    if (auth instanceof Response) return auth;

    const snapshot = await getAdminDb().collection('landlordAgreements')
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();

    const agreements = snapshot.docs.map(doc => {
      const data = doc.data();
      // Never leak the re-issue token to the dashboard client.
      const { reissueToken, ...rest } = data;
      return {
        id: doc.id,
        ...rest,
        awaitingSignature: !!reissueToken,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
      };
    });

    return NextResponse.json({ agreements }, { status: 200 });
  } catch (e) {
    console.error('staff/agreements error:', e);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// Pull the stored signature PNG back down so a regenerated (corrected) PDF still
// shows the landlord's signature. Best-effort: a failure just omits the image.
async function fetchSignatureDataUrl(url?: string): Promise<string | undefined> {
  if (!url || !/^https:\/\/res\.cloudinary\.com\//.test(url)) return undefined;
  try {
    const r = await fetch(url);
    if (!r.ok) return undefined;
    const buf = Buffer.from(await r.arrayBuffer());
    return `data:image/png;base64,${buf.toString('base64')}`;
  } catch { return undefined; }
}

function pickEditableFields(raw: any): Record<string, unknown> {
  const clean = sanitizeUploadUrlFieldsDeep(raw || {});
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(clean)) {
    if (!EDITABLE_FIELDS.has(k)) continue;
    if (k === 'jointLandlord') out[k] = !!v;
    else out[k] = typeof v === 'string' ? v : (v ?? '');
  }
  return out;
}

function reissueEmailHtml(data: any, bundle: any, link: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/></head>
<body style="font-family:Arial,sans-serif;background:#f4f6f9;margin:0;padding:0;">
<div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">
  <div style="background:linear-gradient(135deg,#0a162f,#2563eb);padding:32px 40px;color:#fff;"><h1 style="margin:0;font-size:22px;font-weight:800;">Please review and re-sign your agreement</h1></div>
  <div style="padding:32px 40px;">
    <p style="font-size:15px;line-height:1.6;color:#374151;">Dear <strong>${data.fullName}</strong>,</p>
    <p style="font-size:15px;line-height:1.6;color:#374151;">We have updated your <strong>${bundle.label}</strong> agreement${propertyLine(data) ? ` for ${propertyLine(data)}` : ''} and need you to review the changes and sign again. Your previous signature no longer applies to the updated terms.</p>
    <p style="text-align:center;margin:26px 0;"><a href="${link}" style="display:inline-block;background:#2563eb;color:#fff;font-weight:700;font-size:15px;text-decoration:none;padding:14px 30px;border-radius:9px;">Review &amp; sign your agreement</a></p>
    <p style="font-size:13px;line-height:1.6;color:#6b7280;">Package: <strong>${bundle.label}</strong> (${feeLine(bundle)}). This link expires in 14 days. If the button does not work, copy and paste this address into your browser:<br/><span style="word-break:break-all;color:#2563eb;">${link}</span></p>
  </div>
  <div style="background:#f8f9ff;padding:18px 40px;text-align:center;font-size:12px;color:#9ca3af;">© ${new Date().getFullYear()} House of Lettings Ltd.</div>
</div></body></html>`;
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireStaff(request, 'agreements');
    if (auth instanceof Response) return auth;

    const body = await request.json().catch(() => ({}));
    const id = (body.id || '').toString().trim();
    if (!id) return NextResponse.json({ message: 'Agreement id is required.' }, { status: 400 });

    const db = getAdminDb();
    const ref = db.collection('landlordAgreements').doc(id);

    // ── Edit path ──
    if (body.action === 'edit') {
      const mode = ['save', 'correct', 'reissue'].includes(body.mode) ? body.mode : 'save';
      const fields = pickEditableFields(body.fields);
      if (!Object.keys(fields).length) return NextResponse.json({ message: 'No editable fields supplied.' }, { status: 400 });

      const snap = await ref.get();
      const existing = snap.data();
      if (!snap.exists || !existing) return NextResponse.json({ message: 'Agreement not found.' }, { status: 404 });

      const merged: any = { ...existing, ...fields };
      const bundle = findBundle(merged.selectedPackageId) || findBundle(merged.selectedPackage);
      if ((mode === 'correct' || mode === 'reissue') && !bundle) {
        return NextResponse.json({ message: 'A valid service package is required to send the agreement.' }, { status: 400 });
      }

      if (mode === 'reissue' && bundle) {
        const token = (globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`);
        await ref.update({
          ...fields,
          status: 'awaiting-signature',
          reissueToken: token,
          reissueExpires: Date.now() + REISSUE_TTL_MS,
          updatedAt: FieldValue.serverTimestamp(),
          lastEditBy: auth.uid,
        });
        const link = `${SITE_URL}/landlord-registration/apply?agreementId=${encodeURIComponent(id)}&token=${encodeURIComponent(token)}`;
        const emailData = htmlEscapeDeep(merged);
        await sendAgreementEmail({
          to: merged.email,
          subject: `Please review and re-sign your ${bundle.label} agreement | House of Lettings`,
          html: reissueEmailHtml(emailData, bundle, link),
        }).catch(() => { /* non-fatal */ });
        return NextResponse.json({ ok: true, status: 'awaiting-signature' }, { status: 200 });
      }

      // save or correct: persist the fields
      await ref.update({ ...fields, updatedAt: FieldValue.serverTimestamp(), lastEditBy: auth.uid });

      if (mode === 'correct' && bundle) {
        merged.signatureImage = await fetchSignatureDataUrl(existing.signatureUrl);
        if (merged.jointLandlord && existing.signature2Url) {
          merged.signature2Image = await fetchSignatureDataUrl(existing.signature2Url);
        }
        const template = await loadAgreementTemplate(db);
        const emailData = htmlEscapeDeep(merged);
        await issueAgreementDocuments({ data: merged, bundle, ref: id, template, emailData, corrected: true });
      }
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    // ── Status path ──
    const status = (body.status || '').toString().trim();
    if (!AGREEMENT_STATUSES.includes(status as any)) {
      return NextResponse.json({ message: 'Invalid status.' }, { status: 400 });
    }
    await ref.update({ status, updatedAt: FieldValue.serverTimestamp(), lastStatusBy: auth.uid });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    console.error('staff/agreements PATCH error:', e);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
