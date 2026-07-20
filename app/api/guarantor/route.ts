// app/api/guarantor/route.ts
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { rateLimit } from '@/lib/rateLimit';
import { htmlEscapeDeep, sanitizeUploadUrlFieldsDeep } from '@/lib/security';
import { backupToDrive, namedFiles } from '@/lib/googleDrive';

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

async function sendEmail({
  to, subject, html, attachments,
}: { to: string; subject: string; html: string; attachments?: Attachment[] }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: process.env.FROM_EMAIL || 'onboarding@resend.dev',
      to, subject, html,
      ...(attachments && attachments.length > 0 ? { attachments } : {}),
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error(`Guarantor email to ${to} failed:`, err);
    // Throw so the caller's Promise.allSettled records which recipient failed.
    throw new Error(`Resend send to ${to} failed`);
  }
}

function confirmationHtml(d: any) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>
    body{font-family:Arial,sans-serif;background:#f4f6f9;margin:0;padding:0;}
    .wrap{max-width:620px;margin:36px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);}
    .header{background:linear-gradient(135deg,#0a1628,#1e3a5f);padding:36px 40px;color:#fff;}
    .header h1{margin:0 0 6px;font-size:22px;font-weight:700;}
    .header p{margin:0;opacity:.75;font-size:13px;}
    .body{padding:32px 40px;}
    .body p{font-size:15px;line-height:1.65;color:#374151;margin:0 0 16px;}
    .detail-box{background:#f8f9ff;border-radius:12px;padding:20px 24px;margin:20px 0;}
    .detail-row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eef0f5;font-size:14px;}
    .detail-row:last-child{border-bottom:none;}
    .detail-label{color:#6b7280;font-weight:500;}
    .detail-value{color:#111827;font-weight:600;text-align:right;max-width:60%;}
    .notice{background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:14px 18px;font-size:13px;color:#92400e;line-height:1.6;margin-top:20px;}
    .footer{background:#f8f9ff;padding:20px 40px;text-align:center;font-size:12px;color:#9ca3af;}
  </style></head><body><div class="wrap">
    <div class="header">
      <h1>✅ Guarantor Form Received</h1>
      <p>House of Lettings, ${d.propertyAddress}</p>
    </div>
    <div class="body">
      <p>Dear <strong>${d.guarantorFullName}</strong>,</p>
      <p>Thank you for agreeing to act as a guarantor and for completing the guarantor form. Our team will review it as part of the tenancy application. A PDF copy of your completed form is attached for your records.</p>
      <div class="detail-box">
        <div class="detail-row"><span class="detail-label">Property</span><span class="detail-value">${d.propertyAddress}</span></div>
        <div class="detail-row"><span class="detail-label">Rent</span><span class="detail-value">${d.rent}</span></div>
        <div class="detail-row"><span class="detail-label">Deposit</span><span class="detail-value">${d.deposit}</span></div>
      </div>
      <div class="notice">⚠️ Providing false, misleading, or unverifiable information may result in the application being declined. Failure to meet the guarantor criteria may affect the tenancy application.</div>
      <p style="margin-top:20px;">If you have any questions, please reply to this email.</p>
    </div>
    <div class="footer">© ${new Date().getFullYear()} House of Lettings Ltd. All rights reserved.</div>
  </div></body></html>`;
}

function adminNotificationHtml(d: any) {
  const row = (label: string, value: string) =>
    `<tr><td style="font-weight:600;color:#6b7280;width:40%;padding:9px 12px;border-bottom:1px solid #eef0f5;">${label}</td><td style="color:#111;padding:9px 12px;border-bottom:1px solid #eef0f5;">${value || '-'}</td></tr>`;

  const fileLinks = (urls: string[], label: string) => {
    if (!urls || urls.length === 0) return row(label, 'None provided');
    const links = urls.map((u: string, i: number) => `<a href="${u}" style="color:#2563eb;">File ${i + 1}</a>`).join(' · ');
    return row(label, links);
  };

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>
    body{font-family:Arial,sans-serif;background:#f4f6f9;margin:0;padding:0;}
    .wrap{max-width:680px;margin:32px auto;background:#fff;border-radius:14px;overflow:hidden;}
    .header{background:#0a1628;padding:24px 32px;color:#fff;}
    .header h2{margin:0;font-size:20px;}
    .header p{margin:4px 0 0;opacity:.7;font-size:13px;}
    .section{padding:20px 32px 0;}
    .section-title{font-size:13px;font-weight:800;color:#2563eb;letter-spacing:.08em;text-transform:uppercase;margin:0 0 8px;}
    table{width:100%;border-collapse:collapse;font-size:14px;margin-bottom:24px;}
  </style></head><body><div class="wrap">
    <div class="header">
      <h2>🛡️ New Guarantor Form</h2>
      <p>${new Date().toLocaleString('en-GB')} · ${d.propertyAddress}</p>
    </div>

    <div class="section"><p class="section-title">Proposed Let</p><table>
      ${row('Property Address', d.propertyAddress)}
      ${row('Rent', d.rent)}
      ${row('Deposit', d.deposit)}
    </table></div>

    <div class="section"><p class="section-title">Guarantor Details</p><table>
      ${row('Title', d.guarantorTitle)}
      ${row('Full Name', d.guarantorFullName)}
      ${row('Date of Birth', d.guarantorDob)}
      ${row('Address', d.guarantorAddress)}
      ${row('Postcode', d.guarantorPostcode)}
      ${row('CCJ?', d.hasCCJ)}
      ${row('Mobile', d.guarantorMobile)}
      ${row('Email', d.guarantorEmail)}
      ${row('Time at Address', d.timeAtAddress)}
      ${row('Previous Address', d.previousAddress)}
    </table></div>

    <div class="section"><p class="section-title">Current Landlord / Letting Agent</p><table>
      ${row('Title', d.landlordTitle)}
      ${row('Full Name', d.landlordName)}
      ${row('Address', d.landlordAddress)}
      ${row('Postcode', d.landlordPostcode)}
      ${row('Mobile', d.landlordMobile)}
      ${row('Email', d.landlordEmail)}
    </table></div>

    <div class="section"><p class="section-title">Employer</p><table>
      ${row('Company', d.employerCompany)}
      ${row('Contact Name', d.employerContactName)}
      ${row('Address', d.employerAddress)}
      ${row('Postcode', d.employerPostcode)}
      ${row('Annual Gross Salary', d.annualSalary)}
      ${row('Position', d.jobPosition)}
      ${row('Contract Type', d.contractType)}
    </table></div>

    <div class="section"><p class="section-title">Documents</p><table>
      ${fileLinks(d.idDocUrls, 'Identity Document')}
      ${fileLinks(d.payslipUrls, 'Payslips (x3)')}
      ${fileLinks(d.proofOfAddressUrls, 'Proof of Address')}
      ${fileLinks(d.bankStatementUrls, 'Bank Statements (x3)')}
      ${fileLinks(d.studentDocUrls, 'Student Enrolment (if applicable)')}
    </table></div>

    <div class="section"><p class="section-title">Consent</p><table>
      ${row('Communications Consent', d.consentComms)}
      ${row('Declaration Agreed', d.consentDeclare)}
      ${row('Submission Date', d.submissionDate)}
    </table></div>
  </div></body></html>`;
}

export async function POST(request: Request) {
  const limited = rateLimit(request, "guarantor", 10, 10 * 60 * 1000);
  if (limited) return limited;
  try {
    const body = await request.json();
    const { pdfBase64, ...rawData } = body;
    // A forged PDF payload must stay a string and within the email-attachment
    // budget; anything else is dropped rather than forwarded.
    if (pdfBase64 !== undefined && (typeof pdfBase64 !== 'string' || pdfBase64.length > 10_000_000)) {
      return Response.json({ message: 'Invalid attachment' }, { status: 400 });
    }
    // Strip any upload URL that isn't https on our own upload hosts — those
    // links are stored, emailed to staff as clickable links, and rendered in
    // the dashboard, so this is the choke point against link injection.
    const data = sanitizeUploadUrlFieldsDeep(rawData);
    // User text is interpolated into email HTML below — escape a copy for the
    // templates while the raw values go to Firestore untouched.
    const emailData = htmlEscapeDeep(data);

    const required = ['guarantorFullName', 'guarantorEmail', 'guarantorMobile', 'guarantorAddress', 'propertyAddress', 'consentComms', 'consentDeclare'];
    for (const field of required) {
      if (!data[field]?.toString().trim()) {
        return Response.json({ message: `${field} is required` }, { status: 400 });
      }
    }

    const db = getFirestoreClient();
    const docRef = await db.collection('guarantorForms').add({
      ...data,
      status: 'pending',
      source: 'website-form',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    const safeName = (data.guarantorFullName || 'Guarantor').toString().trim().replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '-');
    const pdfAttachment: Attachment[] | undefined = pdfBase64
      ? [{ filename: `Guarantor-Form-${safeName}.pdf`, content: pdfBase64 }]
      : undefined;

    // Await the sends so Vercel can't freeze the function before Resend is called.
    // The Drive backup rides along for the same reason, and never throws, so it
    // cannot turn a Google outage into a failed submission.
    const [guarantorSend, adminSend] = await Promise.allSettled([
      sendEmail({
        to: data.guarantorEmail,
        subject: '✅ Your Guarantor Form | House of Lettings',
        html: confirmationHtml(emailData),
        attachments: pdfAttachment,
      }),
      sendEmail({
        // Tenant-side notifications go to the Leeds office inbox.
        to: process.env.TENANT_ADMIN_EMAIL || 'houseoflettingsleeds@gmail.com',
        subject: `🛡️ New Guarantor Form: ${data.guarantorFullName} (${data.propertyAddress})`,
        html: adminNotificationHtml(emailData),
        attachments: pdfAttachment,
      }),
      backupToDrive({
        formType: 'guarantor',
        label: data.guarantorFullName,
        address: data.propertyAddress,
        files: [
          ...namedFiles(data.idDocUrls, 'ID Document'),
          ...namedFiles(data.proofOfAddressUrls, 'Proof of Address'),
          ...namedFiles(data.payslipUrls, 'Payslip'),
          ...namedFiles(data.bankStatementUrls, 'Bank Statement'),
          ...namedFiles(data.studentDocUrls, 'Student Document'),
          ...(pdfBase64 ? [{ base64: pdfBase64, name: `Guarantor Form ${safeName}` }] : []),
        ],
      }),
    ]);

    if (guarantorSend.status === 'rejected')
      console.error('Guarantor confirmation email NOT delivered:', guarantorSend.reason);
    if (adminSend.status === 'rejected')
      console.error('Admin notification email NOT delivered:', adminSend.reason);

    return Response.json({
      success: true,
      id: docRef.id,
      guarantorEmailed: guarantorSend.status === 'fulfilled',
      adminEmailed: adminSend.status === 'fulfilled',
    }, { status: 201 });
  } catch (error) {
    console.error('guarantor error:', error);
    return Response.json({ message: 'Internal server error. Please try again.' }, { status: 500 });
  }
}
