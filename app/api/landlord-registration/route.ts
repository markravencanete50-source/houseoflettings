import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { jsPDF } from "jspdf";
import { rateLimit } from '@/lib/rateLimit';

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

type Attachment = { filename: string; content: string };

async function sendEmail({ to, subject, html, attachments }: { to: string; subject: string; html: string; attachments?: Attachment[] }) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: process.env.FROM_EMAIL || "onboarding@resend.dev",
      to, subject, html,
      ...(attachments?.length ? { attachments } : {}),
    }),
  });
  if (!res.ok) console.error("Email failed:", await res.json().catch(() => ({})));
}

// Every field we collect per property, in display order. Kept as one list so
// the email tables and the PDF can never drift out of sync with each other.
function propertyFields(p: any): [string, string][] {
  return [
    ["Postcode", p.postcode],
    ["1st Line of Address", p.street],
    ["City", p.city],
    ["County", p.county],
    ["Flat / Unit No.", p.flatNumber],
    ["Property Type", p.propertyType],
    ["Bedrooms", p.bedrooms],
    ["Bathrooms", p.bathrooms],
    ["Receptions", p.receptions],
    ["Furnishing", p.furnishing],
    ["Parking", p.parking],
    ["Condition", p.condition],
    ["Occupancy", p.occupancy],
    ["Current Rent", p.currentRent ? `£${p.currentRent}/month` : ""],
    ["Tenancy Start", p.tenancyStart],
    ["Tenancy End", p.tenancyEnd],
    ["Available From", p.availableFrom],
    ["Security / Access Note", p.securityNote],
  ].map(([label, value]) => [label, (value ?? "").toString().trim()]);
}

// Optional per-property uploads (photos, floor plan), same multi-file shape as
// the identity documents. Absent on registrations submitted before we asked.
function propertyFiles(p: any, base: "photo" | "floorPlan"): { url: string; name: string }[] {
  const urls = p?.[`${base}Urls`];
  const names = p?.[`${base}Names`];
  if (!Array.isArray(urls)) return [];
  return urls
    .filter((u: string) => !!u)
    .map((url: string, i: number) => ({ url, name: (Array.isArray(names) && names[i]) || `file ${i + 1}` }));
}

const PROPERTY_FILE_LABELS: [("photo" | "floorPlan"), string][] = [
  ["photo", "Property Photos"],
  ["floorPlan", "Floor Plan"],
];

const DOC_LABELS: [string, string][] = [
  ["epc", "EPC"],
  ["electrical", "Electrical Safety (EICR)"],
  ["gas", "Gas Safety (CP12)"],
];

function docStatusText(d: any): string {
  const status = d?.status;
  if (status === "yes") return d.url ? "Yes, document uploaded" : "Yes (will provide later)";
  if (status === "nogas") return "No gas supply at this property";
  if (status === "no") return "Not held / to arrange";
  return "-";
}

// One fully-labelled block per property — every field on its own row so
// nothing the landlord entered is dropped or crammed into a footnote.
function propertyRows(data: any) {
  const props = Array.isArray(data.properties) ? data.properties : [];
  if (!props.length) return `<tr><td>Property Address</td><td>${data.address || ""}</td></tr>`;
  return props.map((p: any, i: number) => {
    const heading = `<tr><td colspan="2" style="background:#f0f4fb;font-weight:700;color:#1a3c5e;padding:12px;">${props.length > 1 ? `Property ${i + 1}` : "Property"}</td></tr>`;
    const rows = propertyFields(p)
      .map(([label, value]) => `<tr><td style="padding-left:24px;">${label}</td><td>${value || "-"}</td></tr>`)
      .join("");
    const fileRows = PROPERTY_FILE_LABELS.map(([base, label]) => {
      const files = propertyFiles(p, base);
      const value = files.length
        ? files.map((f, n) => `<a href="${f.url}">${f.name || `file ${n + 1}`}</a>`).join(", ")
        : "-";
      return `<tr><td style="padding-left:24px;">${label}</td><td>${value}</td></tr>`;
    }).join("");
    return heading + rows + fileRows;
  }).join("");
}

function docRows(data: any) {
  const docs = data.documents || {};
  return DOC_LABELS.map(([key, label]) => {
    const d = docs[key];
    let value = docStatusText(d);
    if (d?.status === "yes" && d.url) value = `Yes: <a href="${d.url}">view document</a>`;
    return `<tr><td>${label}</td><td>${value}</td></tr>`;
  }).join("");
}

// An identity/ownership field may arrive as multiple files (*Urls / *FileNames
// arrays) with a single-file fallback (*Url / *FileName) for older submissions.
function idDocFiles(data: any, base: string): { url: string; name: string }[] {
  const urls = data[`${base}Urls`];
  const names = data[`${base}FileNames`];
  if (Array.isArray(urls) && urls.length) {
    return urls
      .filter((u: string) => !!u)
      .map((url: string, i: number) => ({ url, name: (Array.isArray(names) && names[i]) || `document ${i + 1}` }));
  }
  if (data[`${base}Url`]) return [{ url: data[`${base}Url`], name: data[`${base}FileName`] || "document" }];
  return [];
}

// Full registration as a PDF (attached to both emails) so the office has a
// printable record even if the email formatting is mangled by a client.
function registrationPdfBase64(data: any, ref: string): string {
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const left = 14, labelW = 58;
  let y = 0;

  doc.setFillColor(26, 60, 94);
  doc.rect(0, 0, pageW, 30, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold"); doc.setFontSize(16);
  doc.text("Landlord Registration", left, 13);
  doc.setFont("helvetica", "normal"); doc.setFontSize(9);
  doc.text(`House of Lettings  ·  ${new Date().toLocaleString("en-GB")}  ·  Ref: ${ref}`, left, 22);
  y = 42;

  const ensureRoom = (needed: number) => {
    if (y + needed > pageH - 16) { doc.addPage(); y = 20; }
  };
  const section = (title: string) => {
    ensureRoom(16);
    y += 3;
    doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(26, 60, 94);
    doc.text(title.toUpperCase(), left, y);
    doc.setDrawColor(210, 220, 235);
    doc.line(left, y + 2, pageW - left, y + 2);
    y += 9;
  };
  const line = (label: string, value: string) => {
    const text = (value || "-").toString();
    const wrapped: string[] = doc.splitTextToSize(text, pageW - left * 2 - labelW);
    ensureRoom(wrapped.length * 5 + 2);
    doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(110, 118, 130);
    doc.text(label, left, y);
    doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(20, 26, 40);
    doc.text(wrapped, left + labelW, y);
    y += Math.max(6, wrapped.length * 5 + 1);
  };

  const isCompany = data.ownerType === "company";
  section(isCompany ? "Company Details" : "Landlord Details");
  line("Owner Type", isCompany ? "Company / Ltd" : "Individual owner");
  if (isCompany) {
    line("Company Name", data.companyName);
    line("Company Number", data.companyNumber);
    line("Registered Office", data.registeredAddress);
    const people = Array.isArray(data.companyPeople) ? data.companyPeople : [];
    people.forEach((p: any, i: number) => {
      const desc = [p.name, p.role, p.share ? `${p.share}% share` : ""].filter(Boolean).join(", ");
      line(i === 0 ? "Person 1 (contact)" : `Person ${i + 1}`, desc);
    });
    if (!people.length) line("Contact Person", data.fullName);
  } else {
    line("Full Name", data.fullName);
  }
  line("Email", data.email);
  line("Telephone", data.phone);
  line("Contact Address", data.contactAddress);
  const idFiles = idDocFiles(data, "landlordId");
  line(isCompany ? "Director's ID" : "Landlord ID", idFiles.length ? `${idFiles.length} file(s) uploaded` : "-");
  idFiles.forEach(f => line("", `${f.name}: ${f.url}`));
  const billFiles = idDocFiles(data, "billingProof");
  line("Billing Address Doc", billFiles.length ? `${billFiles.length} file(s) uploaded` : "-");
  billFiles.forEach(f => line("", `${f.name}: ${f.url}`));
  const ownFiles = idDocFiles(data, "ownershipProof");
  line("Proof of Ownership", ownFiles.length ? `${ownFiles.length} file(s) uploaded` : "-");
  ownFiles.forEach(f => line("", `${f.name}: ${f.url}`));
  line("Properties Owned", data.propertyCount);

  const props = Array.isArray(data.properties) ? data.properties : [];
  props.forEach((p: any, i: number) => {
    section(props.length > 1 ? `Property ${i + 1}` : "Property");
    propertyFields(p).forEach(([label, value]) => line(label, value));
    PROPERTY_FILE_LABELS.forEach(([base, label]) => {
      const files = propertyFiles(p, base);
      line(label, files.length ? `${files.length} file(s) uploaded` : "-");
      files.forEach(f => line("", `${f.name}: ${f.url}`));
    });
  });
  if (!props.length && data.address) {
    section("Property");
    line("Address", data.address);
  }

  section("Service");
  line("Package Selected", data.selectedPackage);

  section("Compliance Documents");
  const docs = data.documents || {};
  DOC_LABELS.forEach(([key, label]) => {
    const d = docs[key];
    line(label, docStatusText(d));
    if (d?.status === "yes" && d.url) line("", d.url);
  });

  section("Declaration");
  if (data.notes) line("Additional Notes", data.notes);
  line("Terms & Conditions", "Agreed by submitting this registration");
  line("Submitted", new Date().toLocaleString("en-GB"));

  return Buffer.from(doc.output("arraybuffer")).toString("base64");
}

function confirmationEmailHtml(data: any) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>body{font-family:Arial,sans-serif;background:#f4f6f9;margin:0;padding:0;}.wrap{max-width:600px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);}.header{background:linear-gradient(135deg,#1a3c5e,#2563a8);padding:36px 40px;color:#fff;}.header h1{margin:0 0 6px;font-size:24px;font-weight:700;}.body{padding:36px 40px;}.body p{font-size:15px;line-height:1.65;color:#374151;margin:0 0 16px;}.detail-box{background:#f8f9ff;border-radius:12px;padding:20px 24px;margin:24px 0;}.detail-row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eef0f5;font-size:14px;gap:16px;}.detail-row:last-child{border-bottom:none;}.detail-label{color:#6b7280;font-weight:500;flex-shrink:0;}.detail-value{color:#111827;font-weight:600;text-align:right;}.footer{background:#f8f9ff;padding:20px 40px;text-align:center;font-size:12px;color:#9ca3af;}</style></head><body><div class="wrap"><div class="header"><h1>🏠 Landlord Registration Received</h1><p>House of Lettings, Property Management</p></div><div class="body"><p>Dear <strong>${data.fullName}</strong>,</p><p>Thank you for registering as a landlord with House of Lettings. Our lettings team will review your details and be in touch within <strong>24-48 hours</strong> to discuss how we can manage your property.</p><div class="detail-box"><div class="detail-row"><span class="detail-label">${Array.isArray(data.properties) && data.properties.length > 1 ? `Properties (${data.properties.length})` : "Property Address"}</span><span class="detail-value">${data.address}</span></div><div class="detail-row"><span class="detail-label">Properties Owned</span><span class="detail-value">${data.propertyCount}</span></div><div class="detail-row"><span class="detail-label">Package Selected</span><span class="detail-value">${data.selectedPackage}</span></div></div><p>A PDF copy of everything you submitted is attached to this email for your records.</p><p>If you need to make any changes, please reply to this email.</p></div><div class="footer">© ${new Date().getFullYear()} House of Lettings Ltd. All rights reserved.</div></div></body></html>`;
}

function adminNotificationHtml(data: any) {
  const isCompany = data.ownerType === "company";
  const people = isCompany && Array.isArray(data.companyPeople) ? data.companyPeople : [];
  const peopleRows = people
    .map((p: any, i: number) => `<tr><td>${i === 0 ? "Person 1 (contact)" : `Person ${i + 1}`}</td><td>${[p.name, p.role, p.share ? `${p.share}% share` : ""].filter(Boolean).join(", ")}</td></tr>`)
    .join("");
  const companyRows = isCompany
    ? `<tr><td>Company Name</td><td>${data.companyName || "-"}</td></tr><tr><td>Company Number</td><td>${data.companyNumber || "-"}</td></tr><tr><td>Registered Office</td><td>${data.registeredAddress || "-"}</td></tr>${peopleRows}`
    : "";
  const docLinks = (base: string) => {
    const files = idDocFiles(data, base);
    return files.length ? files.map((f, i) => `<a href="${f.url}">${f.name || `document ${i + 1}`}</a>`).join("<br/>") : "-";
  };
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>body{font-family:Arial,sans-serif;background:#f4f6f9;margin:0;padding:0;}.wrap{max-width:600px;margin:32px auto;background:#fff;border-radius:14px;overflow:hidden;}.header{background:#1a3c5e;padding:24px 32px;color:#fff;}.header h2{margin:0;font-size:20px;}.body{padding:28px 32px;}table{width:100%;border-collapse:collapse;font-size:14px;}td{padding:10px 12px;border-bottom:1px solid #eef0f5;vertical-align:top;}td:first-child{font-weight:600;color:#6b7280;width:38%;}td:last-child{color:#111;}</style></head><body><div class="wrap"><div class="header"><h2>🔔 New Landlord Registration</h2><p style="margin:4px 0 0;opacity:.8;font-size:13px;">${new Date().toLocaleString("en-GB")}</p></div><div class="body"><table><tr><td>Owner Type</td><td>${isCompany ? "Company / Ltd" : "Individual owner"}</td></tr>${companyRows}${isCompany && people.length ? "" : `<tr><td>${isCompany ? "Contact Person" : "Full Name"}</td><td>${data.fullName}</td></tr>`}<tr><td>Email</td><td>${data.email}</td></tr><tr><td>Telephone</td><td>${data.phone}</td></tr><tr><td>Contact Address</td><td>${data.contactAddress || "-"}</td></tr><tr><td>${isCompany ? "Director's ID" : "Landlord ID"}</td><td>${docLinks("landlordId")}</td></tr><tr><td>Billing Address Document</td><td>${docLinks("billingProof")}</td></tr><tr><td>Proof of Ownership</td><td>${docLinks("ownershipProof")}</td></tr><tr><td>Properties Owned</td><td>${data.propertyCount}</td></tr>${propertyRows(data)}<tr><td>Package Selected</td><td>${data.selectedPackage}</td></tr>${docRows(data)}<tr><td>Notes</td><td>${data.notes || "-"}</td></tr><tr><td>Terms &amp; Conditions</td><td>Agreed by submitting the registration</td></tr></table><p style="font-size:12px;color:#9ca3af;margin:16px 0 0;">A PDF copy of the full registration is attached.</p></div></div></body></html>`;
}

export async function POST(request: Request) {
  const limited = rateLimit(request, "landlord-registration", 10, 10 * 60 * 1000);
  if (limited) return limited;
  try {
    const data = await request.json();
    const required = ["fullName", "email", "phone", "propertyCount", "address", "selectedPackage"];
    for (const field of required) {
      if (!data[field]?.toString().trim()) {
        return Response.json({ message: `${field} is required` }, { status: 400 });
      }
    }
    // No terms checkbox any more — submitting the form is the agreement.
    const db = getFirestoreClient();
    const docRef = await db.collection("landlordRegistrations").add({
      ...data,
      status: "pending",
      source: "website-landlord-registration",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // PDF failure must never block the registration or the emails.
    let attachments: Attachment[] | undefined;
    try {
      attachments = [{
        filename: `landlord-registration-${docRef.id}.pdf`,
        content: registrationPdfBase64(data, docRef.id),
      }];
    } catch (pdfErr) {
      console.error("landlord-registration PDF generation failed:", pdfErr);
    }

    await Promise.allSettled([
      sendEmail({
        to: data.email,
        subject: "🏠 Your Landlord Registration | House of Lettings",
        html: confirmationEmailHtml(data),
        attachments,
      }),
      sendEmail({
        to: process.env.ADMIN_EMAIL || "admin@houseoflettings.co.uk",
        subject: `🔔 New Landlord Registration: ${data.fullName}`,
        html: adminNotificationHtml(data),
        attachments,
      }),
    ]);
    return Response.json({ success: true, id: docRef.id }, { status: 201 });
  } catch (error) {
    console.error("landlord-registration error:", error);
    return Response.json({ message: "Internal server error. Please try again." }, { status: 500 });
  }
}
