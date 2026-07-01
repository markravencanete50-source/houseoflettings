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

// One table row per property, with a details line under the address.
function propertyRows(data: any) {
  const props = Array.isArray(data.properties) ? data.properties : [];
  if (props.length) {
    return props.map((p: any, i: number) => {
      const addr = [p.flatNumber, p.street, p.city, p.county, p.postcode].filter(Boolean).join(", ");
      const details = [
        p.propertyType,
        p.bedrooms && `${p.bedrooms} bed`,
        p.bathrooms && `${p.bathrooms} bath`,
        p.receptions && `${p.receptions} recep`,
        p.furnishing,
        p.parking && p.parking !== "None" && `Parking: ${p.parking}`,
        p.availableFrom && `Available ${p.availableFrom}`,
        p.securityNote && `Access: ${p.securityNote}`,
      ].filter(Boolean).join(" · ");
      const detailLine = details ? `<div style="color:#6b7280;font-size:12px;margin-top:3px;">${details}</div>` : "";
      return `<tr><td>${props.length > 1 ? `Property ${i + 1}` : "Property"}</td><td>${addr}${detailLine}</td></tr>`;
    }).join("");
  }
  return `<tr><td>Property Address</td><td>${data.address || ""}</td></tr>`;
}

// Human-readable summary of the compliance documents for the emails.
function docRows(data: any) {
  const docs = data.documents || {};
  const items = [
    ["EPC", docs.epc],
    ["Electrical Safety (EICR)", docs.electrical],
    ["Gas Safety (CP12)", docs.gas],
    ["Land Registry Title", docs.landReg],
  ] as const;
  return items.map(([label, d]: any) => {
    const status = d?.status;
    let value: string;
    if (status === "yes") {
      value = d.url ? `Yes — <a href="${d.url}">view document</a>` : "Yes (will provide later)";
    } else if (status === "nogas") {
      value = "No gas supply at this property";
    } else if (status === "no") {
      value = "Not held / to arrange";
    } else {
      value = "—";
    }
    return `<tr><td>${label}</td><td>${value}</td></tr>`;
  }).join("");
}

function confirmationEmailHtml(data: any) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>body{font-family:Arial,sans-serif;background:#f4f6f9;margin:0;padding:0;}.wrap{max-width:600px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);}.header{background:linear-gradient(135deg,#1a3c5e,#2563a8);padding:36px 40px;color:#fff;}.header h1{margin:0 0 6px;font-size:24px;font-weight:700;}.body{padding:36px 40px;}.body p{font-size:15px;line-height:1.65;color:#374151;margin:0 0 16px;}.detail-box{background:#f8f9ff;border-radius:12px;padding:20px 24px;margin:24px 0;}.detail-row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eef0f5;font-size:14px;gap:16px;}.detail-row:last-child{border-bottom:none;}.detail-label{color:#6b7280;font-weight:500;flex-shrink:0;}.detail-value{color:#111827;font-weight:600;text-align:right;}.footer{background:#f8f9ff;padding:20px 40px;text-align:center;font-size:12px;color:#9ca3af;}</style></head><body><div class="wrap"><div class="header"><h1>🏠 Landlord Registration Received</h1><p>House of Lettings — Property Management</p></div><div class="body"><p>Dear <strong>${data.fullName}</strong>,</p><p>Thank you for registering as a landlord with House of Lettings. Our lettings team will review your details and be in touch within <strong>24–48 hours</strong> to discuss how we can manage your property.</p><div class="detail-box"><div class="detail-row"><span class="detail-label">${Array.isArray(data.properties) && data.properties.length > 1 ? `Properties (${data.properties.length})` : "Property Address"}</span><span class="detail-value">${data.address}</span></div><div class="detail-row"><span class="detail-label">Properties Owned</span><span class="detail-value">${data.propertyCount}</span></div><div class="detail-row"><span class="detail-label">Package Selected</span><span class="detail-value">${data.selectedPackage}</span></div></div><p>If you need to make any changes, please reply to this email.</p></div><div class="footer">© ${new Date().getFullYear()} House of Lettings Ltd. All rights reserved.</div></div></body></html>`;
}

function adminNotificationHtml(data: any) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>body{font-family:Arial,sans-serif;background:#f4f6f9;margin:0;padding:0;}.wrap{max-width:600px;margin:32px auto;background:#fff;border-radius:14px;overflow:hidden;}.header{background:#1a3c5e;padding:24px 32px;color:#fff;}.header h2{margin:0;font-size:20px;}.body{padding:28px 32px;}table{width:100%;border-collapse:collapse;font-size:14px;}td{padding:10px 12px;border-bottom:1px solid #eef0f5;vertical-align:top;}td:first-child{font-weight:600;color:#6b7280;width:38%;}td:last-child{color:#111;}</style></head><body><div class="wrap"><div class="header"><h2>🔔 New Landlord Registration</h2><p style="margin:4px 0 0;opacity:.8;font-size:13px;">${new Date().toLocaleString("en-GB")}</p></div><div class="body"><table><tr><td>Full Name</td><td>${data.fullName}</td></tr><tr><td>Email</td><td>${data.email}</td></tr><tr><td>Telephone</td><td>${data.phone}</td></tr>${data.contactAddress ? `<tr><td>Contact Address</td><td>${data.contactAddress}</td></tr>` : ""}<tr><td>Properties Owned</td><td>${data.propertyCount}</td></tr>${propertyRows(data)}<tr><td>Package Selected</td><td>${data.selectedPackage}</td></tr>${docRows(data)}${data.notes ? `<tr><td>Notes</td><td>${data.notes}</td></tr>` : ""}<tr><td>Terms Accepted</td><td>${data.termsAccepted ? "Yes" : "No"}</td></tr></table></div></div></body></html>`;
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const required = ["fullName", "email", "phone", "propertyCount", "address", "selectedPackage"];
    for (const field of required) {
      if (!data[field]?.toString().trim()) {
        return Response.json({ message: `${field} is required` }, { status: 400 });
      }
    }
    if (!data.termsAccepted) {
      return Response.json({ message: "Please accept the terms and conditions" }, { status: 400 });
    }
    const db = getFirestoreClient();
    const docRef = await db.collection("landlordRegistrations").add({
      ...data,
      status: "pending",
      source: "website-landlord-registration",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    await Promise.allSettled([
      sendEmail({
        to: data.email,
        subject: "🏠 Your Landlord Registration — House of Lettings",
        html: confirmationEmailHtml(data),
      }),
      sendEmail({
        to: process.env.ADMIN_EMAIL || "admin@houseoflettings.co.uk",
        subject: `🔔 New Landlord Registration — ${data.fullName}`,
        html: adminNotificationHtml(data),
      }),
    ]);
    return Response.json({ success: true, id: docRef.id }, { status: 201 });
  } catch (error) {
    console.error("landlord-registration error:", error);
    return Response.json({ message: "Internal server error. Please try again." }, { status: 500 });
  }
}
