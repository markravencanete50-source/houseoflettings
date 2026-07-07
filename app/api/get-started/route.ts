import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

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

async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: process.env.FROM_EMAIL || "onboarding@resend.dev",
      to, subject, html,
    }),
  });
  if (!res.ok) console.error("Email failed:", await res.json().catch(() => ({})));
}

function confirmationEmailHtml(data: any) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>
    body{font-family:Arial,sans-serif;background:#f4f6f9;margin:0;padding:0;}
    .wrap{max-width:600px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);}
    .header{background:linear-gradient(135deg,#1a3c5e,#2563a8);padding:36px 40px;color:#fff;}
    .header h1{margin:0 0 6px;font-size:24px;font-weight:700;}
    .package-badge{display:inline-block;background:rgba(255,255,255,0.2);border:1px solid rgba(255,255,255,0.4);border-radius:20px;padding:6px 18px;font-size:13px;font-weight:700;margin-top:10px;letter-spacing:1px;}
    .body{padding:36px 40px;}
    .body p{font-size:15px;line-height:1.65;color:#374151;margin:0 0 16px;}
    .detail-box{background:#f8f9ff;border-radius:12px;padding:20px 24px;margin:24px 0;}
    .detail-row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eef0f5;font-size:14px;}
    .detail-row:last-child{border-bottom:none;}
    .detail-label{color:#6b7280;font-weight:500;}
    .detail-value{color:#111827;font-weight:600;}
    .footer{background:#f8f9ff;padding:20px 40px;text-align:center;font-size:12px;color:#9ca3af;}
  </style></head><body><div class="wrap">
    <div class="header">
      <h1>🎉 Registration Received</h1>
      <p>House of Lettings, Landlord Registration</p>
      <div class="package-badge">${data.selectedPackage}</div>
    </div>
    <div class="body">
      <p>Dear <strong>${data.firstName} ${data.lastName}</strong>,</p>
      <p>Thank you for registering with House of Lettings. We've received your details and a member of our team will be in touch within <strong>24-48 hours</strong> to get you set up.</p>
      <div class="detail-box">
        <div class="detail-row"><span class="detail-label">Selected Package</span><span class="detail-value">${data.selectedPackage}</span></div>
        <div class="detail-row"><span class="detail-label">Property Address</span><span class="detail-value">${data.propertyAddress}</span></div>
        <div class="detail-row"><span class="detail-label">Number of Properties</span><span class="detail-value">${data.numberOfProperties}</span></div>
        <div class="detail-row"><span class="detail-label">Start Date</span><span class="detail-value">${data.startDate}</span></div>
        <div class="detail-row"><span class="detail-label">Contact Number</span><span class="detail-value">${data.phone}</span></div>
      </div>
      <p>If you have any questions in the meantime, feel free to reply to this email.</p>
    </div>
    <div class="footer">© ${new Date().getFullYear()} House of Lettings Ltd. All rights reserved.</div>
  </div></body></html>`;
}

function adminNotificationHtml(data: any) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>
    body{font-family:Arial,sans-serif;background:#f4f6f9;margin:0;padding:0;}
    .wrap{max-width:600px;margin:32px auto;background:#fff;border-radius:14px;overflow:hidden;}
    .header{background:#1a3c5e;padding:24px 32px;color:#fff;}
    .header h2{margin:0;font-size:20px;}
    .body{padding:28px 32px;}
    table{width:100%;border-collapse:collapse;font-size:14px;}
    td{padding:10px 12px;border-bottom:1px solid #eef0f5;}
    td:first-child{font-weight:600;color:#6b7280;width:38%;}
    td:last-child{color:#111;}
    .pkg{display:inline-block;background:#2563eb;color:#fff;border-radius:12px;padding:3px 14px;font-size:12px;font-weight:700;}
  </style></head><body><div class="wrap">
    <div class="header">
      <h2>🔔 New Landlord Registration</h2>
      <p style="margin:4px 0 0;opacity:.8;font-size:13px;">${new Date().toLocaleString("en-GB")}</p>
    </div>
    <div class="body"><table>
      <tr><td>Package</td><td><span class="pkg">${data.selectedPackage}</span></td></tr>
      <tr><td>First Name</td><td>${data.firstName}</td></tr>
      <tr><td>Last Name</td><td>${data.lastName}</td></tr>
      <tr><td>Email</td><td>${data.email}</td></tr>
      <tr><td>Phone</td><td>${data.phone}</td></tr>
      <tr><td>Property Address</td><td>${data.propertyAddress}</td></tr>
      <tr><td>No. of Properties</td><td>${data.numberOfProperties}</td></tr>
      <tr><td>Start Date</td><td>${data.startDate}</td></tr>
    </table></div>
  </div></body></html>`;
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const required = ["firstName", "lastName", "email", "phone", "propertyAddress", "numberOfProperties", "startDate"];
    for (const field of required) {
      if (!data[field]?.toString().trim()) {
        return Response.json({ message: `${field} is required` }, { status: 400 });
      }
    }

    const db = getFirestoreClient();
    const docRef = await db.collection("getStartedRequests").add({
      ...data,
      status: "pending",
      source: "pricing-modal",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    await Promise.allSettled([
      sendEmail({
        to: data.email,
        subject: "🎉 Registration Received | House of Lettings",
        html: confirmationEmailHtml(data),
      }),
      sendEmail({
        to: process.env.ADMIN_EMAIL || "admin@houseoflettings.co.uk",
        subject: `🔔 New Landlord Registration: ${data.firstName} ${data.lastName} (${data.selectedPackage})`,
        html: adminNotificationHtml(data),
      }),
    ]);

    return Response.json({ success: true, id: docRef.id }, { status: 201 });
  } catch (error) {
    console.error("get-started error:", error);
    return Response.json({ message: "Internal server error. Please try again." }, { status: 500 });
  }
}
