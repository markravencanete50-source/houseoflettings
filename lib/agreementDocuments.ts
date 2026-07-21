// lib/agreementDocuments.ts
// Server-side builders for the signed-agreement PDF and the confirmation /
// notification emails. Shared by every route that produces an agreement
// document — the initial signing, an office correction, and a re-issue — so the
// three always generate byte-identical output. Imported only by /api routes.
import { jsPDF } from 'jspdf';
import {
  AGENT_DETAILS,
  effectiveIntro,
  buildAgreementSections,
  discountedSetupFee,
  type AgreementTemplate,
  type CouponInfo,
} from '@/lib/agreementContent';
import type { Bundle } from '@/lib/bundles';

export type Attachment = { filename: string; content: string };

export async function sendAgreementEmail({ to, subject, html, attachments }: { to: string | string[]; subject: string; html: string; attachments?: Attachment[] }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
    body: JSON.stringify({
      from: process.env.FROM_EMAIL || 'onboarding@resend.dev',
      to, subject, html,
      ...(attachments?.length ? { attachments } : {}),
    }),
  });
  if (!res.ok) console.error('Agreement email failed:', await res.json().catch(() => ({})));
}

export function propertyLine(data: any): string {
  return [data.flatNumber, data.street, data.city, data.postcode].filter(Boolean).join(', ');
}

export function propertyMeta(data: any): string {
  return [data.propertyType, data.bedrooms && `${data.bedrooms} bed`, data.bathrooms && `${data.bathrooms} bath`, data.furnishing, data.parking && `${data.parking} parking`]
    .filter(Boolean).join(' · ');
}

// Available-from is stored as yyyy-mm-dd (date picker); show it readably, but
// leave any older free-text value ("Immediately") untouched.
export function fmtAvailable(v?: string): string {
  if (!v) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v.trim());
  if (!m) return v;
  const d = new Date(`${v}T00:00:00`);
  return isNaN(d.getTime()) ? v : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// A signed record carries couponCode/couponDiscount when a one-time discount
// code was redeemed at signing.
export function couponFromData(data: any): CouponInfo | undefined {
  const code = (data?.couponCode || '').toString().trim();
  const discount = Number(data?.couponDiscount);
  return code && discount > 0 ? { code, discount } : undefined;
}

export function feeLine(b: Bundle, coupon?: CouponInfo | null): string {
  const setup = coupon
    ? `£${discountedSetupFee(b, coupon)} set up (was ${b.setupFee}, coupon ${coupon.code} −£${coupon.discount})`
    : `${b.setupFee} set up`;
  return b.mgmtFee
    ? `${setup}, then ${b.mgmtFee} management fee of the monthly rent`
    : `${setup}, one time — no ongoing management fee`;
}

// ── Signed PDF ──────────────────────────────────────────────────────────────
export function agreementPdfBase64(data: any, bundle: Bundle, ref: string, template?: AgreementTemplate | null): string {
  const coupon = couponFromData(data);
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const left = 14;
  let y = 0;

  doc.setFillColor(10, 22, 47);
  doc.rect(0, 0, pageW, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(15);
  doc.text('Residential Lettings & Management Agreement', left, 13);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  doc.text(`House of Lettings  ·  ${new Date().toLocaleString('en-GB')}  ·  Ref: ${ref}`, left, 22);
  y = 40;

  const ensure = (needed: number) => { if (y + needed > pageH - 16) { doc.addPage(); y = 20; } };
  const para = (text: string, size = 9.5, color: [number, number, number] = [55, 65, 81], gap = 1.5) => {
    const wrapped: string[] = doc.splitTextToSize(text, pageW - left * 2);
    ensure(wrapped.length * (size * 0.5) + gap + 2);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(size); doc.setTextColor(...color);
    doc.text(wrapped, left, y);
    y += wrapped.length * (size * 0.5) + gap + 2;
  };
  const heading = (text: string) => {
    ensure(12);
    y += 3;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(10, 22, 47);
    doc.text(text, left, y);
    doc.setDrawColor(210, 220, 235); doc.line(left, y + 2, pageW - left, y + 2);
    y += 8;
  };
  const kv = (label: string, value: string) => {
    const wrapped: string[] = doc.splitTextToSize(value || '-', pageW - left * 2 - 48);
    ensure(wrapped.length * 5 + 1);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(110, 118, 130);
    doc.text(label, left, y);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(20, 26, 40);
    doc.text(wrapped, left + 48, y);
    y += Math.max(6, wrapped.length * 5 + 1);
  };

  para(effectiveIntro(template), 9, [75, 85, 99]);

  heading('Parties');
  kv('Landlord', [data.fullName, data.jointLandlord && data.landlord2Name ? `and ${data.landlord2Name}` : ''].filter(Boolean).join(' '));
  kv('Email', data.email);
  kv('Telephone', data.phone);
  kv('Address', data.contactAddress);
  kv('Residency', data.residency === 'non-resident' ? 'Non-resident landlord (NRL Scheme applies)' : 'UK-resident landlord');
  kv('Agent', `${AGENT_DETAILS.companyName} (Co. No. ${AGENT_DETAILS.companyNumber})`);
  kv('Agent Address', AGENT_DETAILS.address);
  kv('Redress', `Ombudsman ${AGENT_DETAILS.ombudsman}, CMP ${AGENT_DETAILS.moneyProtection}`);

  heading('Property');
  kv('Address', propertyLine(data));
  kv('Details', propertyMeta(data));
  if (data.currentRent) kv('Expected Rent', `£${data.currentRent} per month`);
  if (data.availableFrom) kv('Available From', fmtAvailable(data.availableFrom));

  heading('Service Selected');
  kv('Package', bundle.label);
  kv('Fees', feeLine(bundle, coupon));
  if (coupon) kv('Coupon', `${coupon.code} — £${coupon.discount} off the setup fee (one-time use, redeemed)`);

  // Full clauses (Service schedule is a bundle-driven bullet list).
  buildAgreementSections(bundle, template, coupon).forEach(sec => {
    heading(`${sec.n}. ${sec.title}`);
    sec.paras?.forEach((p, i) => para(`${sec.n}.${i + 1}  ${p}`));
    sec.groups?.forEach(g => {
      ensure(8);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(22, 101, 52);
      const gw: string[] = doc.splitTextToSize(g.heading, pageW - left * 2);
      doc.text(gw, left, y); y += gw.length * 5 + 1;
      g.items.forEach(it => {
        const iw: string[] = doc.splitTextToSize(`•  ${it}`, pageW - left * 2 - 4);
        ensure(iw.length * 4.6 + 1);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(55, 65, 81);
        doc.text(iw, left + 4, y); y += iw.length * 4.6 + 1;
      });
      y += 1;
    });
  });

  // Signatures
  heading('Signatures');
  para('By signing below, the Landlord(s) confirm they have read and accepted the terms of this Agreement (including any schedules). The Agent is authorised to commence services immediately.', 9, [75, 85, 99]);
  ensure(46);
  const sigTop = y + 2;
  if (typeof data.signatureImage === 'string' && data.signatureImage.startsWith('data:image')) {
    try { doc.addImage(data.signatureImage, 'PNG', left, sigTop, 60, 24); } catch { /* skip on decode failure */ }
  }
  doc.setDrawColor(150, 160, 175); doc.line(left, sigTop + 26, left + 70, sigTop + 26);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(20, 26, 40);
  doc.text(`Landlord: ${data.signatureName || data.fullName || ''}`, left, sigTop + 31);
  doc.setFont('helvetica', 'normal'); doc.setTextColor(110, 118, 130);
  doc.text(`Date: ${data.signatureDate || new Date().toLocaleDateString('en-GB')}`, left, sigTop + 36);

  const rx = left + 100;
  doc.setDrawColor(150, 160, 175); doc.line(rx, sigTop + 26, rx + 70, sigTop + 26);
  doc.setFont('helvetica', 'bold'); doc.setTextColor(20, 26, 40);
  doc.text('For the Agent: KASRA BELYANI', rx, sigTop + 31);
  doc.setFont('helvetica', 'normal'); doc.setTextColor(110, 118, 130);
  doc.text('House of Lettings Limited', rx, sigTop + 36);

  // Second (joint) landlord signature, on its own row beneath.
  const hasSig2 = (typeof data.signature2Image === 'string' && data.signature2Image.startsWith('data:image')) || data.signature2Name;
  if (data.jointLandlord && hasSig2) {
    y = sigTop + 42;
    ensure(40);
    const sig2Top = y;
    if (typeof data.signature2Image === 'string' && data.signature2Image.startsWith('data:image')) {
      try { doc.addImage(data.signature2Image, 'PNG', left, sig2Top, 60, 24); } catch { /* skip on decode failure */ }
    }
    doc.setDrawColor(150, 160, 175); doc.line(left, sig2Top + 26, left + 70, sig2Top + 26);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(20, 26, 40);
    doc.text(`Second Landlord: ${data.signature2Name || data.landlord2Name || ''}`, left, sig2Top + 31);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(110, 118, 130);
    doc.text(`Date: ${data.signatureDate || new Date().toLocaleDateString('en-GB')}`, left, sig2Top + 36);
  }

  return Buffer.from(doc.output('arraybuffer')).toString('base64');
}

// ── Emails ──────────────────────────────────────────────────────────────────
function serviceBundleHtml(bundle: Bundle): string {
  return bundle.groups.map(g =>
    `<div style="margin:0 0 14px;"><div style="font-size:13px;font-weight:700;color:#16a34a;margin-bottom:6px;">${g.heading}</div><ul style="margin:0;padding-left:18px;">${g.items.map(it => `<li style="font-size:13px;color:#374151;line-height:1.55;margin-bottom:3px;">${it}</li>`).join('')}</ul></div>`
  ).join('');
}

// The landlord email carries BOTH parts: (1) the bundle of services acquired,
// and (2) the tenancy/management agreement summary, with the signed PDF
// attached. `corrected` switches the wording to an updated-copy notice.
export function landlordEmailHtml(data: any, bundle: Bundle, opts: { corrected?: boolean } = {}): string {
  const title = opts.corrected ? '📄 Your updated agreement' : '🖊️ Your agreement is signed';
  const intro = opts.corrected
    ? `We have updated your <strong>${bundle.label}</strong> agreement. The corrected copy is attached, and no action is needed from you. Below is a summary of what you are getting and the key terms.`
    : `Thank you for signing your <strong>${bundle.label}</strong> agreement with House of Lettings. Your signed PDF is attached to this email for your records. Below is a summary of what you are getting and the key terms.`;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/></head>
<body style="font-family:Arial,sans-serif;background:#f4f6f9;margin:0;padding:0;">
<div style="max-width:640px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">
  <div style="background:linear-gradient(135deg,#0a162f,#2563eb);padding:34px 40px;color:#fff;">
    <h1 style="margin:0 0 6px;font-size:23px;font-weight:800;">${title}</h1>
    <p style="margin:0;opacity:.85;font-size:14px;">Residential Lettings &amp; Management Agreement</p>
  </div>
  <div style="padding:34px 40px;">
    <p style="font-size:15px;line-height:1.6;color:#374151;">Dear <strong>${data.fullName}</strong>,</p>
    <p style="font-size:15px;line-height:1.6;color:#374151;">${intro}</p>

    <h2 style="font-size:16px;color:#0a162f;margin:26px 0 6px;border-bottom:2px solid #eef2f7;padding-bottom:6px;">1. Your bundle of services</h2>
    <p style="font-size:13px;color:#6b7280;margin:0 0 14px;">Everything included in your <strong>${bundle.label}</strong> package:</p>
    ${serviceBundleHtml(bundle)}

    <h2 style="font-size:16px;color:#0a162f;margin:26px 0 10px;border-bottom:2px solid #eef2f7;padding-bottom:6px;">2. Your tenancy management agreement</h2>
    <div style="background:#f8f9ff;border-radius:12px;padding:18px 22px;">
      <div style="font-size:14px;color:#111827;padding:6px 0;border-bottom:1px solid #eef0f5;"><span style="color:#6b7280;">Property:</span> <strong>${propertyLine(data) || '-'}</strong></div>
      <div style="font-size:14px;color:#111827;padding:6px 0;border-bottom:1px solid #eef0f5;"><span style="color:#6b7280;">Service:</span> <strong>${bundle.label}</strong></div>
      <div style="font-size:14px;color:#111827;padding:6px 0;border-bottom:1px solid #eef0f5;"><span style="color:#6b7280;">Fees:</span> <strong>${feeLine(bundle, couponFromData(data))}</strong></div>
      <div style="font-size:14px;color:#111827;padding:6px 0;"><span style="color:#6b7280;">Signed by:</span> <strong>${data.signatureName || data.fullName}</strong>${data.jointLandlord && (data.signature2Name || data.landlord2Name) ? ` and <strong>${data.signature2Name || data.landlord2Name}</strong>` : ''} on ${data.signatureDate}</div>
    </div>
    <p style="font-size:13px;line-height:1.6;color:#6b7280;margin:16px 0 0;">The full agreement, including all terms and conditions and your signature, is in the attached PDF.${opts.corrected ? '' : ' Our team has been notified and will be in touch shortly to begin.'}</p>
    <p style="font-size:13px;line-height:1.6;color:#6b7280;margin:12px 0 0;">If anything above is not right, simply reply to this email.</p>
  </div>
  <div style="background:#f8f9ff;padding:18px 40px;text-align:center;font-size:12px;color:#9ca3af;">© ${new Date().getFullYear()} House of Lettings Ltd. ${AGENT_DETAILS.address}</div>
</div></body></html>`;
}

export function adminEmailHtml(data: any, bundle: Bundle, opts: { corrected?: boolean } = {}): string {
  const sigLink = data.signatureUrl ? `<a href="${data.signatureUrl}">view signature image</a>` : 'embedded in PDF';
  const heading = opts.corrected ? '📄 Updated Landlord Agreement' : '📄 New Signed Landlord Agreement';
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/></head>
<body style="font-family:Arial,sans-serif;background:#f4f6f9;margin:0;padding:0;">
<div style="max-width:620px;margin:32px auto;background:#fff;border-radius:14px;overflow:hidden;">
  <div style="background:#0a162f;padding:22px 30px;color:#fff;"><h2 style="margin:0;font-size:19px;">${heading}</h2><p style="margin:4px 0 0;opacity:.8;font-size:13px;">${new Date().toLocaleString('en-GB')}</p></div>
  <div style="padding:26px 30px;">
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <tr><td style="padding:9px 10px;border-bottom:1px solid #eef0f5;font-weight:600;color:#6b7280;width:38%;">Landlord</td><td style="padding:9px 10px;border-bottom:1px solid #eef0f5;">${data.fullName}${data.jointLandlord && data.landlord2Name ? ` &amp; ${data.landlord2Name}` : ''}</td></tr>
      <tr><td style="padding:9px 10px;border-bottom:1px solid #eef0f5;font-weight:600;color:#6b7280;">Email</td><td style="padding:9px 10px;border-bottom:1px solid #eef0f5;">${data.email}</td></tr>
      <tr><td style="padding:9px 10px;border-bottom:1px solid #eef0f5;font-weight:600;color:#6b7280;">Phone</td><td style="padding:9px 10px;border-bottom:1px solid #eef0f5;">${data.phone}</td></tr>
      <tr><td style="padding:9px 10px;border-bottom:1px solid #eef0f5;font-weight:600;color:#6b7280;">Contact address</td><td style="padding:9px 10px;border-bottom:1px solid #eef0f5;">${data.contactAddress || '-'}</td></tr>
      <tr><td style="padding:9px 10px;border-bottom:1px solid #eef0f5;font-weight:600;color:#6b7280;">Residency</td><td style="padding:9px 10px;border-bottom:1px solid #eef0f5;">${data.residency === 'non-resident' ? 'Non-resident (NRL)' : 'UK-resident'}</td></tr>
      <tr><td style="padding:9px 10px;border-bottom:1px solid #eef0f5;font-weight:600;color:#6b7280;">Property</td><td style="padding:9px 10px;border-bottom:1px solid #eef0f5;">${propertyLine(data) || '-'}</td></tr>
      <tr><td style="padding:9px 10px;border-bottom:1px solid #eef0f5;font-weight:600;color:#6b7280;">Property details</td><td style="padding:9px 10px;border-bottom:1px solid #eef0f5;">${propertyMeta(data) || '-'}</td></tr>
      <tr><td style="padding:9px 10px;border-bottom:1px solid #eef0f5;font-weight:600;color:#6b7280;">Expected rent</td><td style="padding:9px 10px;border-bottom:1px solid #eef0f5;">${data.currentRent ? `£${data.currentRent}/month` : '-'}</td></tr>
      <tr><td style="padding:9px 10px;border-bottom:1px solid #eef0f5;font-weight:600;color:#6b7280;">Package</td><td style="padding:9px 10px;border-bottom:1px solid #eef0f5;"><strong>${bundle.label}</strong> (${feeLine(bundle, couponFromData(data))})</td></tr>
      ${couponFromData(data) ? `<tr><td style="padding:9px 10px;border-bottom:1px solid #eef0f5;font-weight:600;color:#6b7280;">Coupon redeemed</td><td style="padding:9px 10px;border-bottom:1px solid #eef0f5;"><strong>${couponFromData(data)!.code}</strong> — £${couponFromData(data)!.discount} off the setup fee</td></tr>` : ''}
      <tr><td style="padding:9px 10px;border-bottom:1px solid #eef0f5;font-weight:600;color:#6b7280;">Signed by</td><td style="padding:9px 10px;border-bottom:1px solid #eef0f5;">${data.signatureName || data.fullName} on ${data.signatureDate}</td></tr>
      <tr><td style="padding:9px 10px;font-weight:600;color:#6b7280;">Signature</td><td style="padding:9px 10px;">${sigLink}</td></tr>
    </table>
    <p style="font-size:12px;color:#9ca3af;margin:16px 0 0;">The full signed agreement PDF is attached.</p>
  </div>
</div></body></html>`;
}

// Build the PDF attachment (best-effort) and send both emails. Returns the PDF
// base64 (or undefined) so callers can also back it up.
export async function issueAgreementDocuments(opts: {
  data: any;
  bundle: Bundle;
  ref: string;
  template?: AgreementTemplate | null;
  emailData: any; // html-escaped copy for the templates
  corrected?: boolean;
}): Promise<{ attachments?: Attachment[]; pdfBase64?: string }> {
  const { data, bundle, ref, template, emailData, corrected } = opts;
  let pdfBase64: string | undefined;
  try {
    pdfBase64 = agreementPdfBase64(data, bundle, ref, template);
  } catch (e) {
    console.error('agreement PDF generation failed:', e);
  }
  const attachments = pdfBase64 ? [{ filename: `management-agreement-${ref}.pdf`, content: pdfBase64 }] : undefined;

  // Send the landlord copy to both landlords when it is a joint tenancy.
  const landlordTo = [data.email, ...(data.jointLandlord && data.landlord2Email ? [data.landlord2Email] : [])]
    .filter((e: string) => e && e.includes('@'));

  await Promise.allSettled([
    sendAgreementEmail({
      to: landlordTo.length ? landlordTo : data.email,
      subject: corrected
        ? `📄 Updated copy of your ${bundle.label} agreement | House of Lettings`
        : `🖊️ Your signed ${bundle.label} agreement | House of Lettings`,
      html: landlordEmailHtml(emailData, bundle, { corrected }),
      attachments,
    }),
    sendAgreementEmail({
      to: process.env.ADMIN_EMAIL || 'admin@houseoflettings.co.uk',
      subject: corrected
        ? `📄 Updated agreement: ${data.fullName} (${bundle.label})`
        : `📄 Signed agreement: ${data.fullName} (${bundle.label})`,
      html: adminEmailHtml(emailData, bundle, { corrected }),
      attachments,
    }),
  ]);
  return { attachments, pdfBase64 };
}
