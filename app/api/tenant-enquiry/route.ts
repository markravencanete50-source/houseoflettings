import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { rateLimit } from '@/lib/rateLimit';
import { htmlEscapeDeep } from '@/lib/security';

function getFirestoreClient() {
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
  }
  return getFirestore();
}

async function sendEmail({ to, subject, html, reply_to }: { to: string; subject: string; html: string; reply_to?: string }) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: process.env.FROM_EMAIL || "onboarding@resend.dev",
      to, subject, html,
      reply_to,
    }),
  });
  if (!res.ok) console.error("Email failed:", await res.json().catch(() => ({})));
}

function confirmationEmailHtml(data: any) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>body{font-family:Arial,sans-serif;background:#f4f6f9;margin:0;padding:0;}.wrap{max-width:600px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);}.header{background:linear-gradient(135deg,#1a3c5e,#2563a8);padding:36px 40px;color:#fff;}.header h1{margin:0 0 6px;font-size:24px;font-weight:700;}.body{padding:36px 40px;}.body p{font-size:15px;line-height:1.65;color:#374151;margin:0 0 16px;}.detail-box{background:#f8f9ff;border-radius:12px;padding:20px 24px;margin:24px 0;}.detail-row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eef0f5;font-size:14px;}.detail-row:last-child{border-bottom:none;}.detail-label{color:#6b7280;font-weight:500;}.detail-value{color:#111827;font-weight:600;}.footer{background:#f8f9ff;padding:20px 40px;text-align:center;font-size:12px;color:#9ca3af;}</style></head><body><div class="wrap"><div class="header"><h1>✅ Viewing Request Confirmed</h1><p>House of Lettings, Tenant Enquiry</p></div><div class="body"><p>Dear <strong>${data.firstName} ${data.lastName}</strong>,</p><p>Thank you for your viewing request${data.propertyTitle ? ` for <strong>${data.propertyTitle}</strong>` : ''}. Our team will be in touch within <strong>24 hours</strong> to confirm your appointment.</p><div class="detail-box"><div class="detail-row"><span class="detail-label">Move-in timeline</span><span class="detail-value">${data.moveBy || '-'}</span></div><div class="detail-row"><span class="detail-label">Planned stay</span><span class="detail-value">${data.stayDuration || '-'}</span></div><div class="detail-row"><span class="detail-label">Moving with</span><span class="detail-value">${data.whoMovingIn || '-'}</span></div><div class="detail-row"><span class="detail-label">Contact number</span><span class="detail-value">${data.phone}</span></div></div><p>If you need to make any changes, please reply to this email.</p></div><div class="footer">© ${new Date().getFullYear()} House of Lettings Ltd. All rights reserved.</div></div></body></html>`;
}

function buildChildrenText(data: any): string {
  if (!data.numberOfChildren || data.numberOfChildren === "No") return "No";
  const ages = [data.child1Age, data.child2Age, data.child3Age].filter(Boolean);
  if (ages.length === 0) return data.numberOfChildren;
  return data.numberOfChildren + " (ages: " + ages.join(", ") + ")";
}

function buildAvailabilityText(data: any): string {
  if (!data.viewingAvailability) return "-";
  if (data.viewingAvailability === "Other" && data.viewingAvailabilityOther) {
    return "Other: " + data.viewingAvailabilityOther;
  }
  return data.viewingAvailability;
}

function adminNotificationHtml(data: any) {
  const propertyRow = data.propertyTitle ? `<tr><td>Property</td><td>${data.propertyTitle}</td></tr>` : "";
  const postcodeRow = data.postcode ? `<tr><td>Postcode</td><td>${data.postcode}</td></tr>` : "";
  const messageRow = data.message ? `<tr><td>Message</td><td>${data.message}</td></tr>` : "";

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>body{font-family:Arial,sans-serif;background:#f4f6f9;margin:0;padding:0;}.wrap{max-width:600px;margin:32px auto;background:#fff;border-radius:14px;overflow:hidden;}.header{background:#1a3c5e;padding:24px 32px;color:#fff;}.header h2{margin:0;font-size:20px;}.body{padding:28px 32px;}table{width:100%;border-collapse:collapse;font-size:14px;}td{padding:10px 12px;border-bottom:1px solid #eef0f5;}td:first-child{font-weight:600;color:#6b7280;width:38%;}td:last-child{color:#111;}</style></head><body><div class="wrap"><div class="header"><h2>🏠 New Viewing Request</h2><p style="margin:4px 0 0;opacity:.8;font-size:13px;">${new Date().toLocaleString("en-GB")}</p></div><div class="body"><table>${propertyRow}<tr><td>Name</td><td>${data.firstName} ${data.lastName}</td></tr><tr><td>Email</td><td>${data.email}</td></tr><tr><td>Phone</td><td>${data.phone}</td></tr>${postcodeRow}<tr><td>Move by</td><td>${data.moveBy || "-"}</td></tr><tr><td>Stay duration</td><td>${data.stayDuration || "-"}</td></tr><tr><td>Who's moving in</td><td>${data.whoMovingIn || "-"}</td></tr><tr><td>First time renting</td><td>${data.firstTimeRenting || "-"}</td></tr><tr><td>Employment</td><td>${data.employmentStatus || "-"}</td></tr><tr><td>Pets</td><td>${data.hasPets || "-"}</td></tr><tr><td>Smokers</td><td>${data.hasSmokers || "-"}</td></tr><tr><td>Annual income</td><td>${data.totalAnnualIncome || "-"}</td></tr><tr><td>Children</td><td>${buildChildrenText(data)}</td></tr><tr><td>Viewing availability</td><td>${buildAvailabilityText(data)}</td></tr><tr><td>Adverse credit</td><td>${data.adverseCredit || "-"}</td></tr>${messageRow}</table></div></div></body></html>`;
}

export async function POST(request: Request) {
  const limited = rateLimit(request, "tenant-enquiry", 10, 10 * 60 * 1000);
  if (limited) return limited;
  try {
    const data = await request.json();

    // employmentStatus is only asked by the modal, not the /book-viewing page —
    // the modal enforces it client-side, so it isn't required here.
    const required = ["firstName", "lastName", "email", "phone", "moveBy"];
    for (const field of required) {
      if (!data[field]?.toString().trim()) {
        return Response.json({ message: `${field} is required` }, { status: 400 });
      }
    }

    const db = getFirestoreClient();
    const docRef = await db.collection("tenantEnquiries").add({
      ...data,
      status: "pending",
      source: data.source || "website-modal",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    await Promise.allSettled([
      sendEmail({
        to: data.email,
        subject: "✅ Your Viewing Request | House of Lettings",
        html: confirmationEmailHtml(htmlEscapeDeep(data)),
      }),
      sendEmail({
        // Tenant-side notifications go to the Leeds office inbox.
        to: process.env.TENANT_ADMIN_EMAIL || "houseoflettingsleeds@gmail.com",
        subject: `🏠 New Viewing Request: ${data.firstName} ${data.lastName}`,
        html: adminNotificationHtml(htmlEscapeDeep(data)),
        reply_to: data.email,
      }),
    ]);

    return Response.json({ success: true, id: docRef.id }, { status: 201 });
  } catch (error) {
    console.error("tenant-enquiry error:", error);
    return Response.json({ message: "Internal server error. Please try again." }, { status: 500 });
  }
}
