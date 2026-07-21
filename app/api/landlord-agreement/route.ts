// app/api/landlord-agreement/route.ts
// Receives a signed Residential Lettings & Management Agreement, stores it,
// builds a signed PDF (with the landlord's signature image embedded), emails a
// confirmation to the landlord and a notification to the office (both with the
// PDF attached), and backs the whole thing up to Drive. Mirrors the landlord
// registration route so the two share the same hardening and email/PDF shape.
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { jsPDF } from 'jspdf';
import { rateLimit } from '@/lib/rateLimit';
import { htmlEscapeDeep, sanitizeUploadUrlFieldsDeep } from '@/lib/security';
import { backupToDrive, type BackupFile } from '@/lib/googleDrive';
import { AGENT_DETAILS, AGREEMENT_INTRO, buildAgreementSections, findBundle } from '@/lib/agreementContent';
import type { Bundle } from '@/lib/bundles';

function getFirestoreClient() {
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  }
  return getFirestore();
}

type Attachment = { filename: string; content: string };

async function sendEmail({ to, subject, html, attachments }: { to: string; subject: string; html: string; attachments?: Attachment[] }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
    body: JSON.stringify({
      from: process.env.FROM_EMAIL || 'onboarding@resend.dev',
      to, subject, html,
      ...(attachments?.length ? { attachments } : {}),
    }),
  });
  if (!res.ok) console.error('Email failed:', await res.json().catch(() => ({})));
}

function propertyLine(data: any): string {
  return [data.flatNumber, data.street, data.city, data.postcode].filter(Boolean).join(', ');
}

function propertyMeta(data: any): string {
  return [data.propertyType, data.bedrooms && `${data.bedrooms} bed`, data.bathrooms && `${data.bathrooms} bath`, data.furnishing, data.parking && `${data.parking} parking`]
    .filter(Boolean).join(' · ');
}

function feeLine(b: Bundle): string {
  return b.mgmtFee
    ? `${b.setupFee} set up, then ${b.mgmtFee} management fee of the monthly rent`
    : `${b.setupFee} one time, no ongoing management fee`;
}

// ── Signed PDF ──────────────────────────────────────────────────────────────
function agreementPdfBase64(data: any, bundle: Bundle, ref: string): string {
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

  para(AGREEMENT_INTRO, 9, [75, 85, 99]);

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
  if (data.availableFrom) kv('Available From', data.availableFrom);

  heading('Service Selected');
  kv('Package', bundle.label);
  kv('Fees', feeLine(bundle));

  // Full clauses (Service schedule is a bundle-driven bullet list).
  buildAgreementSections(bundle).forEach(sec => {
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
  // Landlord signature image (if present and decodable).
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
  doc.text('For the Agent: Mr Kasra Belyani', rx, sigTop + 31);
  doc.setFont('helvetica', 'normal'); doc.setTextColor(110, 118, 130);
  doc.text('House of Lettings Limited', rx, sigTop + 36);

  return Buffer.from(doc.output('arraybuffer')).toString('base64');
}

// ── Emails ──────────────────────────────────────────────────────────────────
function serviceBundleHtml(bundle: Bundle): string {
  return bundle.groups.map(g =>
    `<div style="margin:0 0 14px;"><div style="font-size:13px;font-weight:700;color:#16a34a;margin-bottom:6px;">${g.heading}</div><ul style="margin:0;padding-left:18px;">${g.items.map(it => `<li style="font-size:13px;color:#374151;line-height:1.55;margin-bottom:3px;">${it}</li>`).join('')}</ul></div>`
  ).join('');
}

// The landlord email carries BOTH parts the client asked for: (1) the bundle of
// services acquired, and (2) the tenancy/management agreement summary, with the
// full signed PDF attached.
function landlordEmailHtml(data: any, bundle: Bundle): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/></head>
<body style="font-family:Arial,sans-serif;background:#f4f6f9;margin:0;padding:0;">
<div style="max-width:640px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">
  <div style="background:linear-gradient(135deg,#0a162f,#2563eb);padding:34px 40px;color:#fff;">
    <h1 style="margin:0 0 6px;font-size:23px;font-weight:800;">🖊️ Your agreement is signed</h1>
    <p style="margin:0;opacity:.85;font-size:14px;">Residential Lettings &amp; Management Agreement</p>
  </div>
  <div style="padding:34px 40px;">
    <p style="font-size:15px;line-height:1.6;color:#374151;">Dear <strong>${data.fullName}</strong>,</p>
    <p style="font-size:15px;line-height:1.6;color:#374151;">Thank you for signing your <strong>${bundle.label}</strong> agreement with House of Lettings. Your signed PDF is attached to this email for your records. Below is a summary of what you are getting and the key terms.</p>

    <h2 style="font-size:16px;color:#0a162f;margin:26px 0 6px;border-bottom:2px solid #eef2f7;padding-bottom:6px;">1. Your bundle of services</h2>
    <p style="font-size:13px;color:#6b7280;margin:0 0 14px;">Everything included in your <strong>${bundle.label}</strong> package:</p>
    ${serviceBundleHtml(bundle)}

    <h2 style="font-size:16px;color:#0a162f;margin:26px 0 10px;border-bottom:2px solid #eef2f7;padding-bottom:6px;">2. Your tenancy management agreement</h2>
    <div style="background:#f8f9ff;border-radius:12px;padding:18px 22px;">
      <div style="font-size:14px;color:#111827;padding:6px 0;border-bottom:1px solid #eef0f5;"><span style="color:#6b7280;">Property:</span> <strong>${propertyLine(data) || '-'}</strong></div>
      <div style="font-size:14px;color:#111827;padding:6px 0;border-bottom:1px solid #eef0f5;"><span style="color:#6b7280;">Service:</span> <strong>${bundle.label}</strong></div>
      <div style="font-size:14px;color:#111827;padding:6px 0;border-bottom:1px solid #eef0f5;"><span style="color:#6b7280;">Fees:</span> <strong>${feeLine(bundle)}</strong></div>
      <div style="font-size:14px;color:#111827;padding:6px 0;"><span style="color:#6b7280;">Signed by:</span> <strong>${data.signatureName || data.fullName}</strong> on ${data.signatureDate}</div>
    </div>
    <p style="font-size:13px;line-height:1.6;color:#6b7280;margin:16px 0 0;">The full agreement, including all terms and conditions and your signature, is in the attached PDF. Our team has been notified and will be in touch shortly to begin.</p>
    <p style="font-size:13px;line-height:1.6;color:#6b7280;margin:12px 0 0;">If anything above is not right, simply reply to this email.</p>
  </div>
  <div style="background:#f8f9ff;padding:18px 40px;text-align:center;font-size:12px;color:#9ca3af;">© ${new Date().getFullYear()} House of Lettings Ltd. ${AGENT_DETAILS.address}</div>
</div></body></html>`;
}

function adminEmailHtml(data: any, bundle: Bundle): string {
  const sigLink = data.signatureUrl ? `<a href="${data.signatureUrl}">view signature image</a>` : 'embedded in PDF';
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/></head>
<body style="font-family:Arial,sans-serif;background:#f4f6f9;margin:0;padding:0;">
<div style="max-width:620px;margin:32px auto;background:#fff;border-radius:14px;overflow:hidden;">
  <div style="background:#0a162f;padding:22px 30px;color:#fff;"><h2 style="margin:0;font-size:19px;">📄 New Signed Landlord Agreement</h2><p style="margin:4px 0 0;opacity:.8;font-size:13px;">${new Date().toLocaleString('en-GB')}</p></div>
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
      <tr><td style="padding:9px 10px;border-bottom:1px solid #eef0f5;font-weight:600;color:#6b7280;">Package</td><td style="padding:9px 10px;border-bottom:1px solid #eef0f5;"><strong>${bundle.label}</strong> (${feeLine(bundle)})</td></tr>
      <tr><td style="padding:9px 10px;border-bottom:1px solid #eef0f5;font-weight:600;color:#6b7280;">Signed by</td><td style="padding:9px 10px;border-bottom:1px solid #eef0f5;">${data.signatureName || data.fullName} on ${data.signatureDate}</td></tr>
      <tr><td style="padding:9px 10px;font-weight:600;color:#6b7280;">Signature</td><td style="padding:9px 10px;">${sigLink}</td></tr>
    </table>
    <p style="font-size:12px;color:#9ca3af;margin:16px 0 0;">The full signed agreement PDF is attached.</p>
  </div>
</div></body></html>`;
}

function driveBackupFiles(data: any, pdfBase64?: string): BackupFile[] {
  const files: BackupFile[] = [];
  if (data.signatureUrl) files.push({ url: data.signatureUrl, name: 'Landlord Signature' });
  if (pdfBase64) files.push({ base64: pdfBase64, name: 'Signed Agreement' });
  return files;
}

export async function POST(request: Request) {
  const limited = rateLimit(request, 'landlord-agreement', 10, 10 * 60 * 1000);
  if (limited) return limited;
  try {
    const data = sanitizeUploadUrlFieldsDeep(await request.json());

    const required = ['fullName', 'email', 'phone', 'selectedPackage', 'signatureName'];
    for (const field of required) {
      if (!data[field]?.toString().trim()) {
        return Response.json({ message: `${field} is required` }, { status: 400 });
      }
    }
    if (!data.termsAccepted) return Response.json({ message: 'The terms must be accepted' }, { status: 400 });
    if (typeof data.signatureImage !== 'string' || !data.signatureImage.startsWith('data:image')) {
      return Response.json({ message: 'A signature is required' }, { status: 400 });
    }

    const bundle = findBundle(data.selectedPackageId) || findBundle(data.selectedPackage);
    if (!bundle) return Response.json({ message: 'A valid service package is required' }, { status: 400 });

    // Keep the base64 signature out of Firestore (kept lean); the Cloudinary URL
    // is the durable record. The raw image is only needed to build the PDF.
    const { signatureImage, ...toStore } = data;
    const db = getFirestoreClient();
    const docRef = await db.collection('landlordAgreements').add({
      ...toStore,
      status: 'signed',
      source: 'website-landlord-agreement',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // PDF failure must never block the agreement or the emails.
    let attachments: Attachment[] | undefined;
    try {
      attachments = [{ filename: `management-agreement-${docRef.id}.pdf`, content: agreementPdfBase64(data, bundle, docRef.id) }];
    } catch (pdfErr) {
      console.error('landlord-agreement PDF generation failed:', pdfErr);
    }

    const emailData = htmlEscapeDeep(data);

    await Promise.allSettled([
      sendEmail({
        to: data.email,
        subject: `🖊️ Your signed ${bundle.label} agreement | House of Lettings`,
        html: landlordEmailHtml(emailData, bundle),
        attachments,
      }),
      sendEmail({
        to: process.env.ADMIN_EMAIL || 'admin@houseoflettings.co.uk',
        subject: `📄 Signed agreement: ${data.fullName} (${bundle.label})`,
        html: adminEmailHtml(emailData, bundle),
        attachments,
      }),
      backupToDrive({
        formType: 'landlord-agreement',
        label: data.fullName,
        address: propertyLine(data),
        files: driveBackupFiles(data, attachments?.[0]?.content),
      }),
    ]);

    return Response.json({ success: true, id: docRef.id }, { status: 201 });
  } catch (error) {
    console.error('landlord-agreement error:', error);
    return Response.json({ message: 'Internal server error. Please try again.' }, { status: 500 });
  }
}
