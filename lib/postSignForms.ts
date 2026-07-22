// lib/postSignForms.ts
// The two follow-up forms each landlord signs AFTER the management agreement:
//   1. Authorised Property Management Representative Form
//   2. Landlord Bank Details & AML Verification Form
// This module holds the legal wording, the signed-PDF builders, the invite email
// (with both links), and the per-form confirmation/office emails. Imported only
// by /api routes. Each landlord (first and second) signs their OWN copy.
import { jsPDF } from 'jspdf';
import { randomBytes } from 'node:crypto';
import { AGENT_DETAILS } from '@/lib/agreementContent';
import { sendAgreementEmail, type Attachment } from '@/lib/agreementDocuments';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.houseoflettings.uk';
export const POST_SIGN_FORMS_TTL_MS = 30 * 24 * 60 * 60 * 1000; // links valid 30 days
const AGENT_SIGNATORY = 'Mr Kasra Belyani';

export type FormDoc = 'authorised-rep' | 'bank-aml';
export const FORM_LABELS: Record<FormDoc, string> = {
  'authorised-rep': 'Authorised Property Management Representative Form',
  'bank-aml': 'Landlord Bank Details & AML Verification Form',
};

export function generateFormsToken(): string {
  return randomBytes(24).toString('hex');
}

export function formsLink(id: string, token: string, party: 'first' | 'second', doc: FormDoc): string {
  return `${SITE_URL}/landlord-registration/forms?id=${id}&token=${token}&party=${party}&doc=${doc}`;
}

// ── Masking for the bank details we persist (full details live only in the PDF) ──
export function maskSortCode(raw: string): string {
  const d = String(raw || '').replace(/\D/g, '');
  return d.length >= 6 ? `**-**-${d.slice(-2)}` : '';
}
export function accountLast4(raw: string): string {
  const d = String(raw || '').replace(/\D/g, '');
  return d.length >= 4 ? d.slice(-4) : '';
}

// ── Shared PDF scaffolding ──────────────────────────────────────────────────
type FormCtx = {
  ref: string; propertyAddress: string;
  landlordName: string; landlordEmail: string; landlordPhone: string; landlordAddress: string;
  landlord2Name?: string;
};

function newDoc(title: string, ref: string) {
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const left = 14;
  const state = { y: 0 };
  doc.setFillColor(10, 22, 47);
  doc.rect(0, 0, pageW, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(14);
  doc.text(title, left, 13);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  doc.text(`House of Lettings  ·  ${new Date().toLocaleString('en-GB')}  ·  Ref: ${ref}`, left, 22);
  state.y = 40;

  const ensure = (n: number) => { if (state.y + n > pageH - 16) { doc.addPage(); state.y = 20; } };
  const heading = (t: string) => { ensure(12); state.y += 3; doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(10, 22, 47); doc.text(t, left, state.y); doc.setDrawColor(210, 220, 235); doc.line(left, state.y + 2, pageW - left, state.y + 2); state.y += 8; };
  const para = (text: string, size = 9.5) => {
    const wrapped: string[] = doc.splitTextToSize(text, pageW - left * 2);
    ensure(wrapped.length * (size * 0.5) + 3);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(size); doc.setTextColor(55, 65, 81);
    doc.text(wrapped, left, state.y); state.y += wrapped.length * (size * 0.5) + 3;
  };
  const bullets = (items: string[]) => {
    items.forEach(it => {
      const w: string[] = doc.splitTextToSize(`•  ${it}`, pageW - left * 2 - 4);
      ensure(w.length * 4.6 + 1);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(55, 65, 81);
      doc.text(w, left + 4, state.y); state.y += w.length * 4.6 + 1;
    });
    state.y += 2;
  };
  const kv = (label: string, value: string) => {
    const wrapped: string[] = doc.splitTextToSize(value || '-', pageW - left * 2 - 52);
    ensure(wrapped.length * 5 + 1);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(110, 118, 130); doc.text(label, left, state.y);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(20, 26, 40); doc.text(wrapped, left + 52, state.y);
    state.y += Math.max(6, wrapped.length * 5 + 1);
  };
  const signature = (rows: { label: string; name: string; date: string; image?: string | null }[]) => {
    heading('Signatures');
    rows.forEach(r => {
      ensure(40);
      const top = state.y + 2;
      if (typeof r.image === 'string' && r.image.startsWith('data:image')) {
        try { doc.addImage(r.image, 'PNG', left, top, 58, 22); } catch { /* skip */ }
      }
      doc.setDrawColor(150, 160, 175); doc.line(left, top + 24, left + 70, top + 24);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(20, 26, 40);
      doc.text(`${r.label}: ${r.name || ''}`, left, top + 29);
      doc.setFont('helvetica', 'normal'); doc.setTextColor(110, 118, 130);
      doc.text(`Date: ${r.date || new Date().toLocaleDateString('en-GB')}`, left, top + 34);
      state.y = top + 40;
    });
  };
  const out = () => Buffer.from(doc.output('arraybuffer')).toString('base64');
  return { heading, para, bullets, kv, signature, out };
}

// ── 1. Authorised Property Management Representative Form ────────────────────
export function authorisedRepPdfBase64(ctx: FormCtx, data: any): string {
  const d = newDoc('Authorised Property Management Representative Form', ctx.ref);
  d.para('This Authorisation Agreement is made between the Landlord(s) and House of Lettings ("the Agent"). Its purpose is to authorise a nominated individual ("Authorised Representative") to communicate with House of Lettings and make day-to-day property management decisions on behalf of the Landlord(s) in relation to the Property below.');

  d.heading('1. Property Details');
  d.kv('Property Address', ctx.propertyAddress);

  d.heading('2. Landlord Details');
  d.kv('Full Name', ctx.landlordName);
  d.kv('Email Address', ctx.landlordEmail);
  d.kv('Telephone', ctx.landlordPhone);

  d.heading('3. Authorised Representative');
  if (data.hasRepresentative) {
    d.kv('Full Name', data.repName);
    d.kv('Email Address', data.repEmail);
    d.kv('Telephone', data.repPhone);
  } else {
    d.para('The Landlord confirms they will manage the Property themselves and have NOT nominated a separate Authorised Representative at this time.');
  }

  d.heading('4. Authority Granted');
  d.para('The Landlord(s) authorise the Authorised Representative to communicate with House of Lettings and provide instructions regarding:');
  d.bullets(['Tenancy management and renewals', 'Maintenance, repairs and contractor instructions', 'Property inspections and visits', 'Rent negotiations and tenancy matters', 'Compliance-related matters', 'Deposit matters and disputes', 'Marketing, advertising and viewings', 'Notices and tenancy-related correspondence', 'Approval of invoices and property expenses', 'General day-to-day management of the Property']);

  d.heading('5. Limitation of Authority');
  d.para('The Authorised Representative is authorised for day-to-day property management only and may NOT sign or execute tenancy agreements, legal or statutory notices, contracts or court documents on behalf of the Landlord(s), nor transfer ownership of the Property. Where legally binding approval is required, House of Lettings may request direct confirmation from the Landlord(s).');

  d.heading('6. Revocation, Data & Governing Law');
  d.para('This authority remains valid until withdrawn in writing by the Landlord(s). Personal data is handled in accordance with the UK GDPR and the Data Protection Act 2018. This Agreement is governed by the laws of England and Wales.');

  d.heading('7. Agent Details');
  d.kv('Company', `${AGENT_DETAILS.companyName} (Co. No. ${AGENT_DETAILS.companyNumber})`);
  d.kv('Registered Office', AGENT_DETAILS.address);
  d.kv('Ombudsman', AGENT_DETAILS.ombudsman);

  d.heading('8. Declaration');
  d.para('By signing below, the Landlord confirms they have read and understood this Agreement, authorise any named individual above to act as their representative for day-to-day matters, and authorise the Agent to act accordingly with immediate effect.');

  const rows = [
    { label: 'Landlord', name: data.signatureName || ctx.landlordName, date: data.signatureDate, image: data.signatureImage },
    { label: 'For the Agent', name: AGENT_SIGNATORY, date: data.signatureDate },
  ];
  if (data.hasRepresentative && data.repName) rows.splice(1, 0, { label: 'Authorised Representative', name: data.repName, date: data.signatureDate });
  d.signature(rows);
  return d.out();
}

// ── 2. Landlord Bank Details & AML Verification Form ────────────────────────
export function bankAmlPdfBase64(ctx: FormCtx, data: any): string {
  const d = newDoc('Landlord Bank Details & AML Verification Form', ctx.ref);
  d.para('Issued by House of Lettings ("the Agent") in connection with the lettings / property management services provided to the Landlord(s). Its purpose is to obtain and verify the Landlord\'s bank account details for rental income and to assist the Agent with Anti-Money Laundering ("AML"), financial compliance and data protection obligations.');

  d.heading('1. Property Details');
  d.kv('Property Address', ctx.propertyAddress);

  d.heading('2. Landlord Details');
  d.kv('Full Name', ctx.landlordName);
  d.kv('Contact Address', ctx.landlordAddress);
  d.kv('Email Address', ctx.landlordEmail);
  d.kv('Telephone', ctx.landlordPhone);
  if (ctx.landlord2Name) d.kv('Joint Landlord', ctx.landlord2Name);

  d.heading('2.1 Joint Ownership Declaration');
  d.para(data.jointDeclaration
    ? 'Where the Property is owned by more than one Landlord, all parties confirm they are jointly entitled to receive rental income, and that (unless otherwise agreed in writing by all legal owners) rental payments shall be made to the account below.'
    : 'The Landlord confirms they are entitled to receive the rental income for the Property, to be paid to the account below.');

  d.heading('3. Bank Account Details');
  d.kv('Account Holder Name', data.accountHolder);
  d.kv('Bank Name', data.bankName);
  d.kv('Sort Code', data.sortCode);
  d.kv('Account Number', data.accountNumber);

  d.heading('4. Authority Declaration');
  d.para('The Landlord(s) confirm the bank account above belongs to them or is under their lawful control, that they have full legal authority to receive rental income for the Property, and that the information provided is true, complete and accurate. The Agent may rely on these details until revised written instructions are received and verified.');

  d.heading('5. AML Compliance & 6. Payment Disclaimer');
  d.para('To comply with legislation and internal procedures the Agent may request proof of identity, address, ownership, bank-account ownership and source of funds, and may carry out electronic verification via third-party providers. Failure to provide requested documentation may delay payments or services. The Agent is not liable for loss or delay arising from incorrect, incomplete, fraudulent or outdated bank details. Changes must be submitted in writing and may be subject to verification.');

  d.heading('7. Data Protection');
  d.para('All personal and financial information is processed in accordance with the UK GDPR and the Data Protection Act 2018, and used only for property management, financial administration, compliance, legal obligations and related professional purposes.');

  d.signature([{ label: 'Landlord', name: data.signatureName || ctx.landlordName, date: data.signatureDate, image: data.signatureImage }]);
  return d.out();
}

export function buildFormPdf(doc: FormDoc, ctx: FormCtx, data: any): string {
  return doc === 'authorised-rep' ? authorisedRepPdfBase64(ctx, data) : bankAmlPdfBase64(ctx, data);
}

// ── Emails ──────────────────────────────────────────────────────────────────
function shell(headline: string, inner: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
  <body style="margin:0;background:#eef1f6;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 10px 40px rgba(10,22,47,.12);">
      <div style="background:linear-gradient(135deg,#0a162f,#14294f 55%,#2563eb 170%);padding:34px 40px;color:#fff;">
        <div style="font-size:12px;letter-spacing:.22em;text-transform:uppercase;opacity:.7;">House of Lettings</div>
        <div style="font-size:22px;font-weight:800;margin-top:6px;">${headline}</div>
      </div>
      <div style="padding:32px 40px;color:#26303f;font-size:15px;line-height:1.7;">${inner}</div>
      <div style="background:#f6f8fc;padding:20px 40px;text-align:center;font-size:12px;color:#9aa4b2;">© ${new Date().getFullYear()} House of Lettings Ltd · Leeds &amp; Manchester</div>
    </div>
  </body></html>`;
}

function btn(href: string, label: string, bg = '#2563eb'): string {
  return `<a href="${href}" style="display:block;text-align:center;background:${bg};color:#fff;text-decoration:none;font-weight:700;padding:14px 24px;border-radius:10px;margin:10px 0;">${label} →</a>`;
}

// Emailed after the agreement is signed — two links, one per form.
export function postSignFormsInviteHtml(opts: { name: string; propertyAddress: string; linkRep: string; linkBank: string }): string {
  const first = (opts.name || 'there').split(' ')[0];
  return shell('Two quick forms to finish setting up', `
    <p style="margin:0 0 16px;">Hi <strong>${first}</strong>,</p>
    <p style="margin:0 0 16px;">Thank you for signing your management agreement${opts.propertyAddress ? ` for <strong>${opts.propertyAddress}</strong>` : ''}. To finish setting up your account, please complete and sign these two short forms:</p>
    ${btn(opts.linkRep, '1 · Authorised Representative Form')}
    ${btn(opts.linkBank, '2 · Bank Details & AML Verification', '#0a162f')}
    <p style="margin:16px 0 0;color:#6b7280;font-size:13px;">Each takes a minute — your property and details are already filled in; you just add the specifics and sign. Signed copies are emailed to you and to our office.</p>
    <p style="margin:12px 0 0;color:#9aa4b2;font-size:13px;">These secure links expire in 30 days.</p>
  `);
}

export function formConfirmHtml(opts: { name: string; formLabel: string }): string {
  const first = (opts.name || 'there').split(' ')[0];
  return shell('Form received', `
    <p style="margin:0 0 16px;">Hi <strong>${first}</strong>,</p>
    <p style="margin:0 0 16px;">Thank you — we've received your signed <strong>${opts.formLabel}</strong>. A PDF copy is attached for your records. Our team has been notified.</p>
    <p style="margin:0;color:#9aa4b2;font-size:13px;">If you have any questions, just reply to this email.</p>
  `);
}

export function formOfficeHtml(opts: { landlordName: string; formLabel: string; propertyAddress: string; summary: string }): string {
  return shell('Signed form received', `
    <p style="margin:0 0 14px;font-size:14px;"><strong>${opts.landlordName}</strong> has signed the <strong>${opts.formLabel}</strong>${opts.propertyAddress ? ` for ${opts.propertyAddress}` : ''}.</p>
    <div style="background:#f6f8fc;border:1px solid #e4e9f2;border-radius:10px;padding:14px 16px;font-size:13.5px;color:#374151;line-height:1.7;">${opts.summary}</div>
    <p style="font-size:12px;color:#9ca3af;margin:14px 0 0;">The signed PDF is attached.</p>
  `);
}

// Mint a token, build both links and email them to a landlord after they sign
// the agreement. Best-effort — the caller wraps it in Promise.allSettled.
export async function sendPostSignFormsInvite(opts: {
  id: string; token: string; party: 'first' | 'second';
  name: string; email: string; propertyAddress: string;
}) {
  if (!opts.email || !opts.email.includes('@')) return;
  await sendAgreementEmail({
    to: opts.email,
    subject: '📝 Two quick forms to finish your House of Lettings setup',
    html: postSignFormsInviteHtml({
      name: opts.name,
      propertyAddress: opts.propertyAddress,
      linkRep: formsLink(opts.id, opts.token, opts.party, 'authorised-rep'),
      linkBank: formsLink(opts.id, opts.token, opts.party, 'bank-aml'),
    }),
  });
}

export type { Attachment };
