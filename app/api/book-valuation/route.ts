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
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>body{font-family:Arial,sans-serif;background:#f4f6f9;margin:0;padding:0;}.wrap{max-width:600px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);}.header{background:linear-gradient(135deg,#1a3c5e,#2563a8);padding:36px 40px;color:#fff;}.header h1{margin:0 0 6px;font-size:24px;font-weight:700;}.body{padding:36px 40px;}.body p{font-size:15px;line-height:1.65;color:#374151;margin:0 0 16px;}.detail-box{background:#f8f9ff;border-radius:12px;padding:20px 24px;margin:24px 0;}.detail-row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eef0f5;font-size:14px;}.detail-row:last-child{border-bottom:none;}.detail-label{color:#6b7280;font-weight:500;}.detail-value{color:#111827;font-weight:600;}.footer{background:#f8f9ff;padding:20px 40px;text-align:center;font-size:12px;color:#9ca3af;}</style></head><body><div class="wrap"><div class="header"><h1>✅ Valuation Request Confirmed</h1><p>House of Lettings, Free Property Valuation</p></div><div class="body"><p>Dear <strong>${data.fullName}</strong>,</p><p>Thank you for booking a free property valuation. Our local expert will be in touch within <strong>24-48 hours</strong> to confirm your appointment.</p><div class="detail-box"><div class="detail-row"><span class="detail-label">Property Address</span><span class="detail-value">${data.address}</span></div><div class="detail-row"><span class="detail-label">Property Type</span><span class="detail-value">${data.propertyType}</span></div><div class="detail-row"><span class="detail-label">Bedrooms</span><span class="detail-value">${data.bedrooms}</span></div><div class="detail-row"><span class="detail-label">Preferred Date & Time</span><span class="detail-value">${new Date(data.preferredDateTime).toLocaleString("en-GB", { dateStyle: "full", timeStyle: "short" })}</span></div><div class="detail-row"><span class="detail-label">Contact Number</span><span class="detail-value">${data.phone}</span></div></div><p>If you need to make any changes, please reply to this email.</p></div><div class="footer">© ${new Date().getFullYear()} House of Lettings Ltd. All rights reserved.</div></div></body></html>`;
}

function adminNotificationHtml(data: any) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>body{font-family:Arial,sans-serif;background:#f4f6f9;margin:0;padding:0;}.wrap{max-width:600px;margin:32px auto;background:#fff;border-radius:14px;overflow:hidden;}.header{background:#1a3c5e;padding:24px 32px;color:#fff;}.header h2{margin:0;font-size:20px;}.body{padding:28px 32px;}table{width:100%;border-collapse:collapse;font-size:14px;}td{padding:10px 12px;border-bottom:1px solid #eef0f5;}td:first-child{font-weight:600;color:#6b7280;width:38%;}td:last-child{color:#111;}</style></head><body><div class="wrap"><div class="header"><h2>🔔 New Valuation Request</h2><p style="margin:4px 0 0;opacity:.8;font-size:13px;">${new Date().toLocaleString("en-GB")}</p></div><div class="body"><table><tr><td>Full Name</td><td>${data.fullName}</td></tr><tr><td>Email</td><td>${data.email}</td></tr><tr><td>Phone</td><td>${data.phone}</td></tr><tr><td>Property Address</td><td>${data.address}</td></tr>${data.postcode ? `<tr><td>Postcode</td><td>${data.postcode}</td></tr>` : ""}${data.city ? `<tr><td>City</td><td>${data.city}</td></tr>` : ""}<tr><td>Property Type</td><td>${data.propertyType}</td></tr><tr><td>Bedrooms</td><td>${data.bedrooms}</td></tr><tr><td>Preferred Date/Time</td><td>${new Date(data.preferredDateTime).toLocaleString("en-GB", { dateStyle: "full", timeStyle: "short" })}</td></tr>${data.notes ? `<tr><td>Notes</td><td>${data.notes}</td></tr>` : ""}</table></div></div></body></html>`;
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const required = ["fullName", "email", "phone", "address", "propertyType", "bedrooms", "preferredDateTime"];
    for (const field of required) {
      if (!data[field]?.toString().trim()) {
        return Response.json({ message: `${field} is required` }, { status: 400 });
      }
    }
    const db = getFirestoreClient();
    const docRef = await db.collection("valuationRequests").add({
      ...data,
      status: "pending",
      source: "website-modal",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    await Promise.allSettled([
      sendEmail({
        to: data.email,
        subject: "✅ Your Valuation Request | House of Lettings",
        html: confirmationEmailHtml(data),
      }),
      sendEmail({
        to: process.env.ADMIN_EMAIL || "admin@houseoflettings.co.uk",
        subject: `🔔 New Valuation Request: ${data.fullName}`,
        html: adminNotificationHtml(data),
      }),
    ]);
    return Response.json({ success: true, id: docRef.id }, { status: 201 });
  } catch (error) {
    console.error("book-valuation error:", error);
    return Response.json({ message: "Internal server error. Please try again." }, { status: 500 });
  }
}