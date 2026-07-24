// lib/secondLandlord.ts
// Server-side helpers for the joint (second) landlord flow. When a joint
// registration is submitted, the first landlord signs and we email the second
// landlord a secure one-time link to add THEIR own ID, documents and signature
// (they never pick a package or answer the property certificates). This file
// builds that invite email, the second landlord's own signed PDF, and the
// confirmation/office emails once they complete. Imported only by /api routes.
import { jsPDF } from 'jspdf';
import { randomBytes } from 'node:crypto';
import type { Attachment } from '@/lib/agreementDocuments';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.houseoflettings.uk';
export const SECOND_LANDLORD_TTL_MS = 14 * 24 * 60 * 60 * 1000; // link valid 14 days

export function generateSecondLandlordToken(): string {
  return randomBytes(24).toString('hex');
}

export async function sendEmail({ to, subject, html, attachments }: { to: string | string[]; subject: string; html: string; attachments?: Attachment[] }): Promise<{ ok: boolean; error?: string }> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('secondLandlord: RESEND_API_KEY missing, email skipped');
    return { ok: false, error: 'Email service is not configured (missing API key).' };
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
      body: JSON.stringify({ from: process.env.FROM_EMAIL || 'onboarding@resend.dev', to, subject, html, ...(attachments?.length ? { attachments } : {}) }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      console.error('secondLandlord email failed:', body);
      return { ok: false, error: (body?.message || body?.error || `Email provider returned ${res.status}`).toString() };
    }
    return { ok: true };
  } catch (e) {
    console.error('secondLandlord email threw:', e);
    return { ok: false, error: 'Could not reach the email service.' };
  }
}

function shell(headline: string, inner: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
  <body style="margin:0;background:#eef1f6;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 10px 40px rgba(10,22,47,.12);">
      <div style="background:linear-gradient(135deg,#0a162f,#14294f 55%,#2563eb 170%);padding:36px 40px;color:#fff;">
        <div style="font-size:12px;letter-spacing:.22em;text-transform:uppercase;opacity:.7;">House of Lettings</div>
        <div style="font-size:23px;font-weight:800;margin-top:6px;">${headline}</div>
      </div>
      <div style="padding:34px 40px;color:#26303f;font-size:15px;line-height:1.7;">${inner}</div>
      <div style="background:#f6f8fc;padding:20px 40px;text-align:center;font-size:12px;color:#9aa4b2;">© ${new Date().getFullYear()} House of Lettings Ltd · Leeds &amp; Manchester</div>
    </div>
  </body></html>`;
}

// Invite the second landlord to review the registration and accept or decline.
export function secondLandlordInviteHtml(opts: { secondName: string; firstName: string; packageLabel: string; propertyAddress: string; link: string }): string {
  const first = (opts.secondName || 'there').split(' ')[0];
  return shell('You’ve been named as a joint landlord', `
    <p style="margin:0 0 16px;">Hi <strong>${first}</strong>,</p>
    <p style="margin:0 0 16px;"><strong>${opts.firstName}</strong> has registered as a landlord with House of Lettings under the <strong>${opts.packageLabel}</strong> package${opts.propertyAddress ? ` for <strong>${opts.propertyAddress}</strong>` : ''}, and named you as a joint landlord on the property.</p>
    <p style="margin:0 0 16px;">Please review the registration and let us know whether you <strong>accept</strong>. If you accept, we'll ask for your ID, billing address proof and proof of ownership, then show you the agreement to sign. If you <strong>decline</strong>, the registration will be voided and ${opts.firstName} will be notified.</p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${opts.link}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;font-weight:700;padding:15px 42px;border-radius:10px;">Review &amp; respond →</a>
    </div>
    <p style="margin:0;color:#9aa4b2;font-size:13px;">This secure link expires in 14 days and can be used once. If you weren't expecting this, please ignore this email or let us know.</p>
  `);
}

// Sent to the FIRST landlord and the office when the second landlord declines.
export function secondLandlordDeclinedHtml(opts: { firstName: string; secondName: string; propertyAddress: string; packageLabel: string; toOffice?: boolean }): string {
  const who = opts.toOffice ? `<strong>${opts.secondName}</strong> (the second/joint landlord)` : `The joint landlord you named, <strong>${opts.secondName}</strong>,`;
  const greet = opts.toOffice ? '' : `<p style="margin:0 0 16px;">Hi <strong>${(opts.firstName || 'there').split(' ')[0]}</strong>,</p>`;
  return shell('Joint landlord declined — registration voided', `
    ${greet}
    <p style="margin:0 0 16px;">${who} has <strong>declined</strong> to proceed with the ${opts.packageLabel} registration${opts.propertyAddress ? ` for <strong>${opts.propertyAddress}</strong>` : ''}.</p>
    <p style="margin:0 0 16px;">As both landlords must agree, this registration has been <strong>voided</strong> and no agreement will take effect. ${opts.toOffice ? '' : 'If this is unexpected, please contact us and we can help you re-register or continue on your own.'}</p>
    <p style="margin:0;color:#9aa4b2;font-size:13px;">If you have any questions, just reply to this email.</p>
  `);
}

// Confirmation to the second landlord once they've submitted.
export function secondLandlordConfirmHtml(opts: { secondName: string; firstName: string; propertyAddress: string }): string {
  const first = (opts.secondName || 'there').split(' ')[0];
  return shell('Your joint landlord details are in', `
    <p style="margin:0 0 16px;">Hi <strong>${first}</strong>,</p>
    <p style="margin:0 0 16px;">Thank you — we've received your details and documents as a joint landlord${opts.propertyAddress ? ` on <strong>${opts.propertyAddress}</strong>` : ''} (registered by <strong>${opts.firstName}</strong>). A PDF copy of what you submitted is attached for your records.</p>
    <p style="margin:0;color:#6b7280;font-size:14px;">There's nothing more you need to do. Our team will be in touch if anything else is needed.</p>
  `);
}

// Office notification once the second landlord completes.
export function secondLandlordOfficeHtml(opts: { secondName: string; firstName: string; propertyAddress: string; packageLabel: string; second: any }): string {
  const s = opts.second || {};
  const row = (l: string, v: string) => `<tr><td style="padding:9px 10px;border-bottom:1px solid #eef0f5;font-weight:600;color:#6b7280;width:38%;">${l}</td><td style="padding:9px 10px;border-bottom:1px solid #eef0f5;">${v || '-'}</td></tr>`;
  const links = (urls?: string[]) => Array.isArray(urls) && urls.length ? urls.map((u, i) => `<a href="${u}">file ${i + 1}</a>`).join(' · ') : '-';
  return shell('Joint landlord completed their part', `
    <p style="margin:0 0 16px;font-size:14px;">The second (joint) landlord has completed their registration for <strong>${opts.firstName}</strong>'s ${opts.packageLabel} registration${opts.propertyAddress ? ` (${opts.propertyAddress})` : ''}.</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      ${row('Name', s.fullName)}
      ${row('Email', s.email)}
      ${row('Phone', s.phone)}
      ${row('Contact address', s.contactAddress)}
      ${row('Residency', s.residency === 'non-resident' ? 'Non-resident (NRL)' : 'UK-resident')}
      ${row('Landlord ID', links(s.landlordIdUrls))}
      ${row('Billing address proof', links(s.billingProofUrls))}
      ${row('Proof of ownership', links(s.ownershipProofUrls))}
      ${row('Signed by', `${s.signatureName || s.fullName} on ${s.signatureDate || new Date().toLocaleDateString('en-GB')}`)}
    </table>
    <p style="font-size:12px;color:#9ca3af;margin:16px 0 0;">The signed second-landlord PDF is attached.</p>
  `);
}

// A self-contained signed PDF for the second landlord's part, cross-referencing
// the main registration so the two are clearly linked.
export function secondLandlordPdfBase64(opts: {
  ref: string; firstName: string; packageLabel: string; propertyAddress: string;
  second: any; signatureImage?: string | null;
}): string {
  const s = opts.second || {};
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const left = 14;
  let y = 0;

  doc.setFillColor(10, 22, 47);
  doc.rect(0, 0, pageW, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(15);
  doc.text('Joint Landlord Details & Signature', left, 13);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  doc.text(`House of Lettings  ·  ${new Date().toLocaleString('en-GB')}  ·  Ref: ${opts.ref}`, left, 22);
  y = 40;

  const ensure = (n: number) => { if (y + n > pageH - 16) { doc.addPage(); y = 20; } };
  const heading = (t: string) => { ensure(12); y += 3; doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(10, 22, 47); doc.text(t, left, y); doc.setDrawColor(210, 220, 235); doc.line(left, y + 2, pageW - left, y + 2); y += 8; };
  const kv = (label: string, value: string) => {
    const wrapped: string[] = doc.splitTextToSize(value || '-', pageW - left * 2 - 48);
    ensure(wrapped.length * 5 + 1);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(110, 118, 130); doc.text(label, left, y);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(20, 26, 40); doc.text(wrapped, left + 48, y);
    y += Math.max(6, wrapped.length * 5 + 1);
  };
  const fileList = (label: string, urls?: string[]) => {
    kv(label, Array.isArray(urls) && urls.length ? `${urls.length} file(s) uploaded` : '-');
    (urls || []).forEach(u => kv('', u));
  };

  heading('Registration this relates to');
  kv('Primary landlord', opts.firstName);
  kv('Package', opts.packageLabel);
  kv('Property', opts.propertyAddress);

  heading('Joint Landlord');
  kv('Full name', s.fullName);
  kv('Email', s.email);
  kv('Telephone', s.phone);
  kv('Contact address', s.contactAddress);
  kv('Residency', s.residency === 'non-resident' ? 'Non-resident landlord (NRL Scheme applies)' : 'UK-resident landlord');

  heading('Documents');
  fileList('Landlord ID', s.landlordIdUrls);
  fileList('Billing address proof', s.billingProofUrls);
  fileList('Proof of ownership', s.ownershipProofUrls);

  heading('Signature');
  ensure(44);
  const sigTop = y + 2;
  if (typeof opts.signatureImage === 'string' && opts.signatureImage.startsWith('data:image')) {
    try { doc.addImage(opts.signatureImage, 'PNG', left, sigTop, 60, 24); } catch { /* skip on decode failure */ }
  }
  doc.setDrawColor(150, 160, 175); doc.line(left, sigTop + 26, left + 70, sigTop + 26);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(20, 26, 40);
  doc.text(`Joint Landlord: ${s.signatureName || s.fullName || ''}`, left, sigTop + 31);
  doc.setFont('helvetica', 'normal'); doc.setTextColor(110, 118, 130);
  doc.text(`Date: ${s.signatureDate || new Date().toLocaleDateString('en-GB')}`, left, sigTop + 36);

  return Buffer.from(doc.output('arraybuffer')).toString('base64');
}
