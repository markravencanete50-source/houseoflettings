import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { rateLimit } from '@/lib/rateLimit';
import { backupToDrive, namedFiles, type BackupFile } from '@/lib/googleDrive';

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
  to,
  subject,
  html,
  attachments,
}: {
  to: string;
  subject: string;
  html: string;
  attachments?: Attachment[];
}) {
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
  if (!res.ok) console.error('Email failed:', await res.json().catch(() => ({})));
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
      <h1>✅ Tenancy Application Received</h1>
      <p>House of Lettings, ${d.propertyAddress}</p>
    </div>
    <div class="body">
      <p>Dear <strong>${d.fullName}</strong>,</p>
      <p>Thank you for submitting your tenancy application. Our team will review it and be in touch within <strong>24-48 hours</strong>. A PDF copy of your full application is attached to this email for your records.</p>
      <div class="detail-box">
        <div class="detail-row"><span class="detail-label">Property</span><span class="detail-value">${d.propertyAddress}</span></div>
        <div class="detail-row"><span class="detail-label">Rent</span><span class="detail-value">${d.rent} pcm</span></div>
        <div class="detail-row"><span class="detail-label">Deposit</span><span class="detail-value">${d.deposit}</span></div>
        <div class="detail-row"><span class="detail-label">Holding Deposit</span><span class="detail-value">${d.holdingDeposit}</span></div>
        <div class="detail-row"><span class="detail-label">Desired Move-In</span><span class="detail-value">${d.moveInDate ? new Date(d.moveInDate).toLocaleDateString('en-GB', { dateStyle: 'long' }) : '-'}</span></div>
        <div class="detail-row"><span class="detail-label">Lease Term</span><span class="detail-value">${d.leaseTerm}</span></div>
        <div class="detail-row"><span class="detail-label">Guarantor</span><span class="detail-value">${d.guarantor}</span></div>
      </div>
      <div class="notice">⚠️ Please note: any falsified or incomplete information may result in your application being declined and your holding deposit becoming non-refundable.</div>
      <p style="margin-top:20px;">If you have any questions, please reply to this email.</p>
    </div>
    <div class="footer">© ${new Date().getFullYear()} House of Lettings Ltd. All rights reserved.</div>
  </div></body></html>`;
}

function adminNotificationHtml(d: any) {
  const row = (label: string, value: string) =>
    `<tr><td style="font-weight:600;color:#6b7280;width:38%;padding:9px 12px;border-bottom:1px solid #eef0f5;">${label}</td><td style="color:#111;padding:9px 12px;border-bottom:1px solid #eef0f5;">${value || '-'}</td></tr>`;

  const fileLinks = (urls: string[], label: string) => {
    if (!urls || urls.length === 0) return row(label, 'No files uploaded');
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
      <h2>📋 New Tenancy Application</h2>
      <p>${new Date().toLocaleString('en-GB')} · ${d.propertyAddress}</p>
    </div>

    <div class="section"><p class="section-title">Personal Details</p><table>
      ${row('Full Name', d.fullName)}
      ${row('Email', d.email)}
      ${row('Phone', d.phone)}
      ${row('Date of Birth', d.dob)}
      ${row('Nationality', d.nationality)}
      ${row('NI Number', d.niNumber)}
      ${row('Billing Address', d.billingAddress)}
      ${row('Right to Rent', d.rightToRent)}
      ${d.shareCode ? row('Share Code', d.shareCode) : ''}
      ${fileLinks(d.govIdUrls, 'Government ID')}
      ${fileLinks(d.proofOfAddressUrls, 'Proof of Address')}
      ${fileLinks(d.rightToRentDocUrls, 'Right to Rent Doc')}
    </table></div>

    <div class="section"><p class="section-title">Employment & Finance</p><table>
      ${row('Employment Status', d.employmentStatus)}
      ${row('Employer Phone', d.employerPhone)}
      ${row('Employer Email', d.employerEmail)}
      ${row('Annual Income', d.annualIncome)}
      ${row('Additional Income', d.additionalIncome)}
      ${row('CCJs', d.hasCCJ)}
      ${row('Bankrupt', d.wasBankrupt)}
      ${fileLinks(d.payslipUrls, 'Payslips')}
      ${fileLinks(d.bankStatementUrls, 'Bank Statements')}
    </table></div>

    <div class="section"><p class="section-title">Landlord's Details</p><table>
      ${row("Landlord's Name", d.landlordName)}
      ${row("Landlord's Email", d.landlordEmail)}
      ${row("Landlord's Phone", d.landlordPhone)}
      ${row('Current Address', d.currentAddress)}
      ${row('Tenancy Start', d.tenancyStart)}
      ${row('Tenancy End', d.tenancyEnd)}
      ${row('Reason for Leaving', d.reasonLeaving)}
      ${row('Desired Move-In', d.moveInDate ? new Date(d.moveInDate).toLocaleDateString('en-GB') : '-')}
      ${row('Lease Term', d.leaseTerm)}
      ${row('Pets', d.pets)}
      ${row('Guarantor', d.guarantor)}
    </table></div>

    <div class="section"><p class="section-title">Property</p><table>
      ${row('Address', d.propertyAddress)}
      ${row('Rent', d.rent)}
      ${row('Deposit', d.deposit)}
      ${row('Holding Deposit', d.holdingDeposit)}
      ${row('Submission Date', d.submissionDate)}
    </table></div>
  </div></body></html>`;
}

export async function POST(request: Request) {
  const limited = rateLimit(request, "tenant-application", 10, 10 * 60 * 1000);
  if (limited) return limited;
  try {
    const body = await request.json();
    const { pdfBase64, ...data } = body;

    const required = ['fullName', 'email', 'phone', 'dob', 'nationality', 'niNumber', 'billingAddress', 'rightToRent', 'employmentStatus', 'annualIncome', 'moveInDate'];
    for (const field of required) {
      if (!data[field]?.toString().trim()) {
        return Response.json({ message: `${field} is required` }, { status: 400 });
      }
    }

    const db = getFirestoreClient();
    const docRef = await db.collection('tenantApplications').add({
      ...data,
      status: 'pending',
      source: 'website-form',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Build a safe filename from the applicant's name, e.g. "Tenancy-Application-John-Smith.pdf"
    const safeName = (data.fullName || 'Applicant').toString().trim().replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '-');
    const pdfAttachment: Attachment[] | undefined = pdfBase64
      ? [{ filename: `Tenancy-Application-${safeName}.pdf`, content: pdfBase64 }]
      : undefined;

    // Every uploaded document, labelled so the Drive copy is readable without
    // opening each file. Runs alongside the emails rather than after them, so
    // the applicant isn't kept waiting on Drive.
    const driveFiles: BackupFile[] = [
      ...namedFiles(data.govIdUrls, 'Government ID'),
      ...namedFiles(data.proofOfAddressUrls, 'Proof of Address'),
      ...namedFiles(data.rightToRentDocUrls, 'Right to Rent'),
      ...namedFiles(data.payslipUrls, 'Payslip'),
      ...namedFiles(data.bankStatementUrls, 'Bank Statement'),
      ...(pdfBase64 ? [{ base64: pdfBase64, name: `Tenancy Application ${safeName}` }] : []),
    ];

    await Promise.allSettled([
      sendEmail({
        to: data.email,
        subject: '✅ Your Tenancy Application | House of Lettings',
        html: confirmationHtml(data),
        attachments: pdfAttachment,
      }),
      sendEmail({
        // Tenant-side notifications go to the Leeds office inbox.
        to: process.env.TENANT_ADMIN_EMAIL || 'houseoflettingsleeds@gmail.com',
        subject: `📋 New Tenancy Application: ${data.fullName}`,
        html: adminNotificationHtml(data),
        attachments: pdfAttachment,
      }),
      // Backup only. backupToDrive never throws, so a Drive outage can't fail
      // an application. It is awaited because Vercel freezes the function once
      // the response is returned, which would drop an un-awaited upload.
      backupToDrive({
        formType: 'tenant-application',
        label: data.fullName,
        files: driveFiles,
      }),
    ]);

    return Response.json({ success: true, id: docRef.id }, { status: 201 });
  } catch (error) {
    console.error('tenant-application error:', error);
    return Response.json({ message: 'Internal server error. Please try again.' }, { status: 500 });
  }
}
