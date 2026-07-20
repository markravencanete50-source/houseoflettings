// app/api/rent-review/route.ts
// Receives an existing tenant's ~12-month rent review: their rent decision,
// updated personal/employment details, financial declarations, documents,
// and any maintenance issue. Stored in Firestore, emailed to the tenant (a
// confirmation) and the office (a full notification), and backed up to Drive.
// Rate limited, URL fields allow-listed, and every user string escaped before
// it reaches the email HTML — same hardening as the other public forms.
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { rateLimit } from '@/lib/rateLimit';
import { htmlEscapeDeep, sanitizeUploadUrlFieldsDeep } from '@/lib/security';
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

async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: process.env.FROM_EMAIL || 'onboarding@resend.dev',
      to, subject, html,
    }),
  });
  if (!res.ok) console.error('Email failed:', await res.json().catch(() => ({})));
}

const yn = (v: any) => (v === 'yes' ? 'Yes' : v === 'no' ? 'No' : '-');
const rentDecisionText = (v: any) =>
  v === 'accept' ? 'Accepts the proposed rent' : v === 'discuss' ? 'Would like to discuss the rent' : '-';

function confirmationHtml(d: any) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>
    body{font-family:Arial,sans-serif;background:#f4f6f9;margin:0;padding:0;}
    .wrap{max-width:620px;margin:36px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);}
    .header{background:linear-gradient(135deg,#1a3c5e,#2563a8);padding:36px 40px;color:#fff;}
    .header h1{margin:0 0 6px;font-size:22px;font-weight:700;}
    .header p{margin:0;opacity:.8;font-size:13px;}
    .body{padding:32px 40px;}
    .body p{font-size:15px;line-height:1.65;color:#374151;margin:0 0 16px;}
    .detail-box{background:#f8f9ff;border-radius:12px;padding:20px 24px;margin:20px 0;}
    .detail-row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eef0f5;font-size:14px;gap:16px;}
    .detail-row:last-child{border-bottom:none;}
    .detail-label{color:#6b7280;font-weight:500;flex-shrink:0;}
    .detail-value{color:#111827;font-weight:600;text-align:right;}
    .notice{background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:14px 18px;font-size:13px;color:#1e40af;line-height:1.6;margin-top:20px;}
    .footer{background:#f8f9ff;padding:20px 40px;text-align:center;font-size:12px;color:#9ca3af;}
  </style></head><body><div class="wrap">
    <div class="header">
      <h1>✅ Rent Review Received</h1>
      <p>House of Lettings${d.propertyAddress ? `, ${d.propertyAddress}` : ''}</p>
    </div>
    <div class="body">
      <p>Dear <strong>${d.fullName || 'Tenant'}</strong>,</p>
      <p>Thank you. Your rent review has been submitted successfully. Our team will review your information and contact you if any further details are required.</p>
      <div class="detail-box">
        <div class="detail-row"><span class="detail-label">Property</span><span class="detail-value">${d.propertyAddress || '-'}</span></div>
        <div class="detail-row"><span class="detail-label">Current Rent</span><span class="detail-value">${d.currentRent || '-'}</span></div>
        <div class="detail-row"><span class="detail-label">Proposed Rent</span><span class="detail-value">${d.proposedRent || '-'}</span></div>
        <div class="detail-row"><span class="detail-label">Your Decision</span><span class="detail-value">${rentDecisionText(d.rentDecision)}</span></div>
      </div>
      <div class="notice">ℹ️ This submission forms part of your tenancy renewal and rent review. If anything changes, please reply to this email and let us know.</div>
    </div>
    <div class="footer">© ${new Date().getFullYear()} House of Lettings Ltd. All rights reserved.</div>
  </div></body></html>`;
}

function adminNotificationHtml(d: any) {
  const row = (label: string, value: string) =>
    `<tr><td style="font-weight:600;color:#6b7280;width:40%;padding:9px 12px;border-bottom:1px solid #eef0f5;">${label}</td><td style="color:#111;padding:9px 12px;border-bottom:1px solid #eef0f5;">${value || '-'}</td></tr>`;
  const fileLinks = (urls: string[], label: string) => {
    if (!Array.isArray(urls) || urls.length === 0) return row(label, 'None provided');
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
      <h2>🔁 New Rent Review</h2>
      <p>${new Date().toLocaleString('en-GB')}${d.propertyAddress ? ` · ${d.propertyAddress}` : ''}</p>
    </div>

    <div class="section"><p class="section-title">Property &amp; Rent</p><table>
      ${row('Property Address', d.propertyAddress)}
      ${row('Postcode', d.postcode)}
      ${row('Current Rent', d.currentRent)}
      ${row('Proposed New Rent', d.proposedRent)}
      ${row('Tenant Decision', rentDecisionText(d.rentDecision))}
      ${d.rentDecision === 'discuss' ? row('Rent Proposed by Tenant', d.tenantProposedRent) : ''}
      ${d.rentDecision === 'discuss' ? row('Reason', d.rentDiscussReason) : ''}
    </table></div>

    <div class="section"><p class="section-title">Personal &amp; Employment</p><table>
      ${row('Full Name', d.fullName)}
      ${row('Email', d.email)}
      ${row('Phone', d.phone)}
      ${row('Employer', d.employer)}
      ${row('Job Title', d.jobTitle)}
      ${row('Employment Status', d.employmentStatus)}
      ${row('Employment Changed?', yn(d.employmentChanged))}
      ${d.employmentChanged === 'yes' ? row('What changed', d.employmentChangeDetails) : ''}
    </table></div>

    <div class="section"><p class="section-title">Financial Declaration</p><table>
      ${row('Financial situation changed?', yn(d.financeChanged))}
      ${d.financeChanged === 'yes' ? row('Details', d.financeChangedDetails) : ''}
      ${row('Any CCJs since moving in?', yn(d.hasCCJ))}
      ${d.hasCCJ === 'yes' ? row('CCJ details', d.ccjDetails) : ''}
      ${row('Any court proceedings?', yn(d.courtProceedings))}
      ${d.courtProceedings === 'yes' ? row('Court details', d.courtDetails) : ''}
      ${row('IVA or bankruptcy?', yn(d.ivaBankruptcy))}
      ${d.ivaBankruptcy === 'yes' ? row('IVA/bankruptcy details', d.ivaDetails) : ''}
      ${row('Anyone moved in/out?', yn(d.occupancyChanged))}
      ${d.occupancyChanged === 'yes' ? row('Occupancy details', d.occupancyDetails) : ''}
    </table></div>

    <div class="section"><p class="section-title">Documents</p><table>
      ${fileLinks(d.bankStatementUrls, 'Bank Statements (3 months)')}
      ${fileLinks(d.payslipUrls, 'Payslips (3 months)')}
      ${fileLinks(d.photoIdUrls, 'Photo ID')}
      ${fileLinks(d.visaUrls, 'Visa')}
      ${row('Right to Rent Share Code', d.shareCode)}
    </table></div>

    <div class="section"><p class="section-title">Maintenance</p><table>
      ${row('Issue to report?', yn(d.hasMaintenance))}
      ${d.hasMaintenance === 'yes' ? row('Category', d.maintenanceCategory) : ''}
      ${d.hasMaintenance === 'yes' ? row('Description', d.maintenanceDescription) : ''}
      ${d.hasMaintenance === 'yes' ? fileLinks(d.maintenancePhotoUrls, 'Photos') : ''}
    </table></div>
  </div></body></html>`;
}

export async function POST(request: Request) {
  const limited = rateLimit(request, 'rent-review', 10, 10 * 60 * 1000);
  if (limited) return limited;
  try {
    // Strip any upload URL that isn't https on our own upload hosts before it
    // is stored, emailed as a link, or backed up.
    const data = sanitizeUploadUrlFieldsDeep(await request.json());

    const required = ['propertyAddress', 'fullName', 'email', 'phone', 'rentDecision'];
    for (const field of required) {
      if (!data[field]?.toString().trim()) {
        return Response.json({ message: `${field} is required` }, { status: 400 });
      }
    }
    if (data.rentDecision !== 'accept' && data.rentDecision !== 'discuss') {
      return Response.json({ message: 'A valid rent decision is required' }, { status: 400 });
    }
    if (!data.declarationAccepted) {
      return Response.json({ message: 'The declaration must be confirmed' }, { status: 400 });
    }

    const db = getFirestoreClient();
    const docRef = await db.collection('rentReviews').add({
      ...data,
      status: 'pending',
      source: 'website-rent-review',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Escape a copy for the email templates; Firestore keeps the raw values.
    const emailData = htmlEscapeDeep(data);

    const driveFiles: BackupFile[] = [
      ...namedFiles(data.bankStatementUrls, 'Bank Statement'),
      ...namedFiles(data.payslipUrls, 'Payslip'),
      ...namedFiles(data.photoIdUrls, 'Photo ID'),
      ...namedFiles(data.visaUrls, 'Visa'),
      ...namedFiles(data.maintenancePhotoUrls, 'Maintenance Photo'),
    ];

    await Promise.allSettled([
      sendEmail({
        to: data.email,
        subject: '🔁 Your Rent Review | House of Lettings',
        html: confirmationHtml(emailData),
      }),
      sendEmail({
        to: process.env.TENANT_ADMIN_EMAIL || process.env.ADMIN_EMAIL || 'admin@houseoflettings.co.uk',
        subject: `🔁 New Rent Review: ${data.fullName} (${data.propertyAddress})`,
        html: adminNotificationHtml(emailData),
      }),
      // Backup only, and never throws: a Drive outage must not lose a review.
      backupToDrive({
        formType: 'rent-review',
        label: data.fullName,
        address: data.propertyAddress,
        files: driveFiles,
      }),
    ]);

    return Response.json({ success: true, id: docRef.id }, { status: 201 });
  } catch (error) {
    console.error('rent-review error:', error);
    return Response.json({ message: 'Internal server error. Please try again.' }, { status: 500 });
  }
}
