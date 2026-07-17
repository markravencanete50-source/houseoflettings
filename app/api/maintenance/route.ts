// app/api/maintenance/route.ts
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { rateLimit } from '@/lib/rateLimit';
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
    .notice{background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:14px 18px;font-size:13px;color:#1e40af;line-height:1.6;margin-top:20px;}
    .footer{background:#f8f9ff;padding:20px 40px;text-align:center;font-size:12px;color:#9ca3af;}
  </style></head><body><div class="wrap">
    <div class="header">
      <h1>🔧 Maintenance Request Received</h1>
      <p>House of Lettings, ${d.propertyAddress}</p>
    </div>
    <div class="body">
      <p>Dear <strong>${d.fullName}</strong>,</p>
      <p>Thank you for reporting this maintenance issue. Our property team will review it and arrange next steps as soon as possible. A PDF copy of your full report is attached for your records.</p>
      <div class="detail-box">
        <div class="detail-row"><span class="detail-label">Property</span><span class="detail-value">${d.propertyAddress}</span></div>
        <div class="detail-row"><span class="detail-label">Reported Issue</span><span class="detail-value">${d.issueDescription}</span></div>
        <div class="detail-row"><span class="detail-label">When It Happened</span><span class="detail-value">${d.whenHappened || '-'}</span></div>
        <div class="detail-row"><span class="detail-label">Best Contact Number</span><span class="detail-value">${d.contactNumber}</span></div>
        <div class="detail-row"><span class="detail-label">Your Availability</span><span class="detail-value">${d.availability || '-'}</span></div>
      </div>
      <div class="notice">ℹ️ If this is an emergency (gas leak, flooding, no heating in winter, electrical danger), please also call us directly so we can prioritise it.</div>
      <p style="margin-top:20px;">If you have any questions, please reply to this email.</p>
    </div>
    <div class="footer">© ${new Date().getFullYear()} House of Lettings Ltd. All rights reserved.</div>
  </div></body></html>`;
}

function adminNotificationHtml(d: any) {
  const row = (label: string, value: string) =>
    `<tr><td style="font-weight:600;color:#6b7280;width:38%;padding:9px 12px;border-bottom:1px solid #eef0f5;">${label}</td><td style="color:#111;padding:9px 12px;border-bottom:1px solid #eef0f5;">${value || '-'}</td></tr>`;

  const fileLinks = (urls: string[], label: string) => {
    if (!urls || urls.length === 0) return row(label, 'None provided');
    const links = urls.map((u: string, i: number) => `<a href="${u}" style="color:#2563eb;">${label.replace(/s$/, '')} ${i + 1}</a>`).join(' · ');
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
      <h2>🔧 New Maintenance Request</h2>
      <p>${new Date().toLocaleString('en-GB')} · ${d.propertyAddress}</p>
    </div>

    <div class="section"><p class="section-title">Tenant & Property</p><table>
      ${row('Full Name', d.fullName)}
      ${row('Email', d.email)}
      ${row('Best Contact Number', d.contactNumber)}
      ${row('Property Address', d.propertyAddress)}
      ${row('Availability for Access', d.availability)}
    </table></div>

    <div class="section"><p class="section-title">The Issue</p><table>
      ${row('Description', d.issueDescription)}
      ${row('When It Happened', d.whenHappened)}
      ${row('Happened Before?', d.experiencedBefore)}
      ${row('Cause', d.cause)}
      ${d.causeDetail ? row('Cause Details', d.causeDetail) : ''}
    </table></div>

    <div class="section"><p class="section-title">Evidence</p><table>
      ${fileLinks(d.photoUrls, 'Photos')}
      ${fileLinks(d.videoUrls, 'Videos')}
    </table></div>
  </div></body></html>`;
}

export async function POST(request: Request) {
  const limited = rateLimit(request, "maintenance", 10, 10 * 60 * 1000);
  if (limited) return limited;
  try {
    const body = await request.json();
    const { pdfBase64, ...data } = body;

    const required = ['fullName', 'email', 'contactNumber', 'propertyAddress', 'issueDescription', 'whenHappened', 'availability', 'experiencedBefore', 'cause'];
    for (const field of required) {
      if (!data[field]?.toString().trim()) {
        return Response.json({ message: `${field} is required` }, { status: 400 });
      }
    }
    if (!Array.isArray(data.photoUrls) || data.photoUrls.length < 3) {
      return Response.json({ message: 'At least 3 photos are required' }, { status: 400 });
    }

    const db = getFirestoreClient();
    const docRef = await db.collection('maintenanceRequests').add({
      ...data,
      status: 'open',
      source: 'website-form',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    const safeName = (data.fullName || 'Tenant').toString().trim().replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '-');
    const pdfAttachment: Attachment[] | undefined = pdfBase64
      ? [{ filename: `Maintenance-Request-${safeName}.pdf`, content: pdfBase64 }]
      : undefined;

    // IMPORTANT: await the sends so Vercel does not freeze the function before
    // the emails reach Resend (see the tenant-application fix).
    await Promise.allSettled([
      sendEmail({
        to: data.email,
        subject: '🔧 Your Maintenance Request | House of Lettings',
        html: confirmationHtml(data),
        attachments: pdfAttachment,
      }),
      sendEmail({
        // Maintenance goes to the main admin inbox alongside the landlord forms.
        to: process.env.ADMIN_EMAIL || 'admin@houseoflettings.co.uk',
        subject: `🔧 New Maintenance Request: ${data.fullName} (${data.propertyAddress})`,
        html: adminNotificationHtml(data),
        attachments: pdfAttachment,
      }),
      // Backup only, and never throws: a Drive outage must not lose a repair report.
      backupToDrive({
        formType: 'maintenance',
        label: data.fullName,
        address: data.propertyAddress,
        files: [
          ...namedFiles(data.photoUrls, 'Photo'),
          ...namedFiles(data.videoUrls, 'Video'),
          ...(pdfBase64 ? [{ base64: pdfBase64, name: `Maintenance Request ${safeName}` }] : []),
        ],
      }),
    ]);

    return Response.json({ success: true, id: docRef.id }, { status: 201 });
  } catch (error) {
    console.error('maintenance error:', error);
    return Response.json({ message: 'Internal server error. Please try again.' }, { status: 500 });
  }
}
