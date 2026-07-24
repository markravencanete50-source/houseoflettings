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
import { softDeleteDoc } from '@/lib/softDelete';
import { logAction } from '@/lib/activityLog';
import { htmlEscapeDeep, sanitizeUploadUrlFieldsDeep } from '@/lib/security';
import { findBundle } from '@/lib/agreementContent';
import { issueAgreementDocuments, sendAgreementEmail, propertyLine, feeLine } from '@/lib/agreementDocuments';
import { loadAgreementTemplate } from '@/lib/agreementTemplateStore';
import { sendPostSignFormsInvite, generateFormsToken, POST_SIGN_FORMS_TTL_MS } from '@/lib/postSignForms';
import { generateSecondLandlordToken, secondLandlordInviteHtml, sendEmail as sendSecondEmail, SECOND_LANDLORD_TTL_MS } from '@/lib/secondLandlord';
import { generateCoSignerToken, sendCoSignerInvites, CO_SIGNER_TTL_MS } from '@/lib/companyCoSigners';

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

    const db = getAdminDb();
    const snapshot = await db.collection('landlordAgreements')
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();

    const agreements = snapshot.docs.map(doc => {
      const data = doc.data();
      // Never leak signing tokens to the dashboard client.
      const { reissueToken, secondLandlordToken, firstFormsToken, secondFormsToken, ...rest } = data;
      if (Array.isArray(rest.coSigners)) {
        // Never leak signing OR post-agreement-forms tokens to the client.
        rest.coSigners = rest.coSigners.map((c: any) => { const { token, formsToken, ...c2 } = c || {}; return c2; });
      }
      return {
        id: doc.id,
        ...rest,
        awaitingSignature: !!reissueToken,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
      };
    });

    // Enrich each registration with each landlord's PORTAL status (whether they've
    // signed in yet, and whether they've set their own password) — these live on
    // the users doc, keyed by the agreement's landlordUid / secondLandlordUid.
    // One batched read covers every landlord across all registrations.
    const uids = Array.from(new Set(
      agreements.flatMap(a => [(a as any).landlordUid, (a as any).secondLandlordUid]).filter(Boolean),
    )) as string[];
    if (uids.length) {
      const userSnaps = await db.getAll(...uids.map(uid => db.collection('users').doc(uid)));
      const byUid = new Map<string, any>();
      userSnaps.forEach(s => { if (s.exists) byUid.set(s.id, s.data() || {}); });
      const portal = (uid?: string) => {
        const u = uid ? byUid.get(uid) : null;
        if (!u) return null;
        return {
          accessed: !!(u.lastLoginAt || u.firstLoginAt),
          passwordReset: u.mustResetPassword === false,
          lastLoginAt: u.lastLoginAt?.toDate?.()?.toISOString?.() || null,
        };
      };
      for (const a of agreements as any[]) {
        const p1 = portal(a.landlordUid);
        if (p1) { a.portalAccessed = p1.accessed; a.passwordReset = p1.passwordReset; a.portalLastLoginAt = p1.lastLoginAt; }
        const p2 = portal(a.secondLandlordUid);
        if (p2) { a.secondPortalAccessed = p2.accessed; a.secondPasswordReset = p2.passwordReset; a.secondPortalLastLoginAt = p2.lastLoginAt; }
      }
    }

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

    // ── Form reminder path ──
    // Re-send the two post-agreement forms (Authorised Rep + Bank/AML) to a
    // signatory: the first landlord, the joint second landlord, or a named
    // company director (party 'cs0', 'cs1', …). Mints a fresh 30-day token so the
    // emailed links are valid even if the original invite has long expired. A
    // second/director can only be reminded once they've signed the agreement
    // (that's when their details — and the form auto-fill — exist).
    if (body.action === 'remind-forms') {
      const party = (body.party || 'first').toString().trim() || 'first';
      if (!/^(first|second|cs\d+)$/.test(party)) {
        return NextResponse.json({ message: 'Unknown signatory.' }, { status: 400 });
      }
      const snap = await ref.get();
      const existing = snap.data();
      if (!snap.exists || !existing) return NextResponse.json({ message: 'Registration not found.' }, { status: 404 });

      const token = generateFormsToken();
      const expires = Date.now() + POST_SIGN_FORMS_TTL_MS;
      let email = '';
      let name = '';

      if (party === 'first') {
        email = String(existing.email || '').trim();
        name = existing.fullName || existing.companyName || '';
        if (!email.includes('@')) return NextResponse.json({ message: 'This registration has no landlord email to send to.' }, { status: 400 });
        await ref.update({ firstFormsToken: token, firstFormsExpires: expires, formsReminderAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
      } else if (party === 'second') {
        if (existing.secondLandlordStatus !== 'completed') {
          return NextResponse.json({ message: 'The joint landlord has not signed the agreement yet, so there are no forms to complete.' }, { status: 400 });
        }
        const s = existing.secondLandlord || {};
        email = String(s.email || existing.landlord2Email || '').trim();
        name = s.fullName || existing.landlord2Name || '';
        if (!email.includes('@')) return NextResponse.json({ message: 'This joint landlord has no email to send to.' }, { status: 400 });
        await ref.update({ secondFormsToken: token, secondFormsExpires: expires, formsReminderAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
      } else {
        // Company director co-signer — the forms token lives on their array entry.
        const coSigners: any[] = Array.isArray(existing.coSigners) ? existing.coSigners : [];
        const idx = coSigners.findIndex(c => c?.id === party);
        if (idx < 0) return NextResponse.json({ message: 'That signatory was not found on this registration.' }, { status: 404 });
        const cs = coSigners[idx];
        if (cs.status !== 'completed') {
          return NextResponse.json({ message: 'This director has not signed the agreement yet, so there are no forms to complete.' }, { status: 400 });
        }
        email = String(cs.email || '').trim();
        name = cs.fullName || cs.name || '';
        if (!email.includes('@')) return NextResponse.json({ message: 'This director has no email to send to.' }, { status: 400 });
        const updated = coSigners.map((c, i) => i === idx ? { ...c, formsToken: token, formsExpires: expires } : c);
        await ref.update({ coSigners: updated, formsReminderAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
      }

      const sent = await sendPostSignFormsInvite({ id, token, party, name, email, propertyAddress: propertyLine(existing) || '' });
      await logAction(auth, 'PATCH', '/api/staff/agreements', { id, action: 'remind-forms', party, emailOk: sent.ok });
      if (!sent.ok) {
        return NextResponse.json({ message: `Could not email ${email}: ${sent.error || 'the email provider rejected it.'}` }, { status: 502 });
      }
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    // ── Signing reminder path ──
    // Nudge a signatory who hasn't yet SIGNED THE AGREEMENT: the joint (second)
    // landlord, or a company director co-signer still "awaiting their response".
    // Re-mints their one-time signing token and re-sends the invite email. Only
    // valid while they're still pending (already accepted/declined → nothing to do).
    if (body.action === 'remind-agreement') {
      const party = (body.party || '').toString().trim();
      if (!/^(second|cs\d+)$/.test(party)) {
        return NextResponse.json({ message: 'Only the joint landlord or a company director can be chased to sign.' }, { status: 400 });
      }
      const snap = await ref.get();
      const existing = snap.data();
      if (!snap.exists || !existing) return NextResponse.json({ message: 'Registration not found.' }, { status: 404 });

      let sent: { ok: boolean; error?: string };
      let recipient = '';
      if (party === 'second') {
        if (existing.secondLandlordStatus && existing.secondLandlordStatus !== 'pending') {
          return NextResponse.json({ message: 'The joint landlord has already responded, so there is nothing to chase.' }, { status: 400 });
        }
        const email = String(existing.landlord2Email || '').trim();
        if (!email.includes('@')) return NextResponse.json({ message: 'This joint landlord has no email to send to.' }, { status: 400 });
        recipient = email;
        const token = generateSecondLandlordToken();
        await ref.update({
          secondLandlordToken: token,
          secondLandlordExpires: Date.now() + SECOND_LANDLORD_TTL_MS,
          secondLandlordStatus: existing.secondLandlordStatus || 'pending',
          agreementReminderAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
        sent = await sendSecondEmail({
          to: email,
          subject: '👥 Reminder: your joint landlord agreement is waiting | House of Lettings',
          html: secondLandlordInviteHtml({
            secondName: existing.landlord2Name || '',
            firstName: existing.fullName || 'the primary landlord',
            packageLabel: existing.selectedPackage || '',
            propertyAddress: propertyLine(existing) || '',
            link: `${SITE_URL}/landlord-registration/joint?id=${id}&token=${token}`,
          }),
        });
      } else {
        const coSigners: any[] = Array.isArray(existing.coSigners) ? existing.coSigners : [];
        const idx = coSigners.findIndex(c => c?.id === party);
        if (idx < 0) return NextResponse.json({ message: 'That director was not found on this registration.' }, { status: 404 });
        const cs = coSigners[idx];
        if (cs.status && cs.status !== 'pending') {
          return NextResponse.json({ message: 'This director has already responded, so there is nothing to chase.' }, { status: 400 });
        }
        const email = String(cs.email || '').trim();
        if (!email.includes('@')) return NextResponse.json({ message: 'This director has no email to send to.' }, { status: 400 });
        recipient = email;
        const token = generateCoSignerToken();
        const updated = coSigners.map((c, i) => i === idx ? { ...c, token } : c);
        await ref.update({
          coSigners: updated,
          coSignersExpires: Date.now() + CO_SIGNER_TTL_MS,
          agreementReminderAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
        const bundle = findBundle(existing.selectedPackageId) || findBundle(existing.selectedPackage);
        sent = await sendCoSignerInvites({
          id, coSigners: [updated[idx]],
          companyName: existing.companyName || '',
          managingDirector: existing.fullName || '',
          packageLabel: bundle?.label || existing.selectedPackage || '',
          propertyAddress: propertyLine(existing) || '',
        });
      }

      await logAction(auth, 'PATCH', '/api/staff/agreements', { id, action: 'remind-agreement', party, emailOk: sent.ok });
      if (!sent.ok) {
        return NextResponse.json({ message: `Could not email ${recipient}: ${sent.error || 'the email provider rejected it.'}` }, { status: 502 });
      }
      return NextResponse.json({ ok: true }, { status: 200 });
    }

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
        await logAction(auth, 'PATCH', '/api/staff/agreements', { id, action: 'reissue' });
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
      await logAction(auth, 'PATCH', '/api/staff/agreements', { id, action: 'edit' });
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    // ── Status path ──
    const status = (body.status || '').toString().trim();
    if (!AGREEMENT_STATUSES.includes(status as any)) {
      return NextResponse.json({ message: 'Invalid status.' }, { status: 400 });
    }
    await ref.update({ status, updatedAt: FieldValue.serverTimestamp(), lastStatusBy: auth.uid });
    await logAction(auth, 'PATCH', '/api/staff/agreements', { id, status });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    console.error('staff/agreements PATCH error:', e);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// Delete a landlord registration. ADMIN-ONLY, soft-deletes into the 24h recycle bin.
export async function DELETE(request: Request) {
  try {
    const auth = await requireStaff(request, 'agreements');
    if (auth instanceof Response) return auth;
    if (auth.role !== 'admin') {
      return NextResponse.json({ message: 'Only an administrator can delete a landlord registration.' }, { status: 403 });
    }
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return NextResponse.json({ message: 'A registration id is required' }, { status: 400 });

    const result = await softDeleteDoc({ collection: 'landlordAgreements', docId: id, actor: auth, typeLabel: 'Landlord registration' });
    if (!result.ok) return NextResponse.json({ message: 'Registration not found' }, { status: 404 });
    await logAction(auth, 'DELETE', '/api/staff/agreements', { id });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    console.error('staff/agreements DELETE error:', e);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
