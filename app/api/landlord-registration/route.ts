// app/api/landlord-registration/route.ts
// Receives a completed landlord registration — which now includes the signed
// Residential Lettings & Management Agreement (merged in from the old
// /api/landlord-agreement route). Creates a new record (or, when a valid
// re-issue token is supplied, re-signs an existing one) in the
// landlordAgreements collection the dashboards read, redeems any one-time
// discount coupon atomically, builds the signed agreement PDF and a full
// registration-summary PDF, emails the landlord and the office (both PDFs
// attached), and backs everything up to Drive.
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { jsPDF } from "jspdf";
import { rateLimit } from '@/lib/rateLimit';
import { htmlEscapeDeep, sanitizeUploadUrlFieldsDeep } from '@/lib/security';
import { backupToDrive, type BackupFile } from '@/lib/googleDrive';
import { findBundle } from '@/lib/agreementContent';
import { agreementPdfBase64, landlordEmailHtml, feeLine, couponFromData, type Attachment } from '@/lib/agreementDocuments';
import { loadAgreementTemplate } from '@/lib/agreementTemplateStore';
import { provisionLandlordForAgreement } from '@/lib/landlordProvision';
import { generateSecondLandlordToken, secondLandlordInviteHtml, sendEmail as sendSecondEmail, SECOND_LANDLORD_TTL_MS } from '@/lib/secondLandlord';
import { generateFormsToken, sendPostSignFormsInvite, POST_SIGN_FORMS_TTL_MS } from '@/lib/postSignForms';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.houseoflettings.uk';

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

async function sendEmail({ to, subject, html, attachments }: { to: string | string[]; subject: string; html: string; attachments?: Attachment[] }) {
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

// A registration has no single "propertyAddress" field like the other forms —
// it carries an array of properties, each split into street/postcode/flat. The
// first one names the Drive folder, with a count when there are more, so the
// office sees which registration it is without opening it.
function primaryAddress(data: any): string {
  const props = Array.isArray(data.properties) ? data.properties : [];
  const p = props[0];
  const composed = p ? [p.flatNumber, p.street, p.postcode].filter(Boolean).join(" ") : "";
  const base = composed || data.address || "";
  return props.length > 1 ? `${base} +${props.length - 1} more` : base;
}

// Every document on a registration, labelled for the Drive backup. Reuses the
// same extractors the email uses, so a field that reaches the office also
// reaches the backup. The landlord's own file names are dropped in favour of
// what the document IS, since "scan001.pdf" tells the office nothing.
function driveBackupFiles(data: any, registrationPdf?: string, agreementPdf?: string): BackupFile[] {
  const files: BackupFile[] = [];
  const add = (list: { url: string }[], label: string) =>
    list.forEach((f, i) =>
      files.push({ url: f.url, name: list.length > 1 ? `${label} ${i + 1}` : label })
    );

  add(idDocFiles(data, "landlordId"), "Landlord ID");
  add(idDocFiles(data, "billingProof"), "Billing Address Proof");
  add(idDocFiles(data, "ownershipProof"), "Proof of Ownership");

  const props = Array.isArray(data.properties) ? data.properties : [];
  props.forEach((p: any, i: number) => {
    const prefix = props.length > 1 ? `Property ${i + 1} ` : "";
    add(propertyFiles(p, "photo"), `${prefix}Photo`);
    add(propertyFiles(p, "floorPlan"), `${prefix}Floor Plan`);
  });

  // EPC / EICR / gas are only attached when the landlord actually holds them.
  const docs = data.documents || {};
  DOC_LABELS.forEach(([key, label]) => {
    const d = docs[key];
    if (d?.status === "yes" && d.url) files.push({ url: d.url, name: label });
  });

  if (data.signatureUrl) files.push({ url: data.signatureUrl, name: "Landlord Signature" });
  if (data.signature2Url) files.push({ url: data.signature2Url, name: "Second Landlord Signature" });
  if (agreementPdf) files.push({ base64: agreementPdf, name: "Signed Agreement" });
  if (registrationPdf) files.push({ base64: registrationPdf, name: "Registration Summary" });
  return files;
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

// Full registration as a PDF (attached to both emails alongside the signed
// agreement) so the office has a printable record even if the email formatting
// is mangled by a client.
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
    if (data.jointLandlord && data.landlord2Name) line("Joint Landlord", data.landlord2Name);
  }
  line("Email", data.email);
  line("Telephone", data.phone);
  line("Contact Address", data.contactAddress);
  line("Residency", data.residency === "non-resident" ? "Non-resident landlord (NRL Scheme applies)" : "UK-resident landlord");
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
  const coupon = couponFromData(data);
  if (coupon) line("Coupon Redeemed", `${coupon.code} — £${coupon.discount} off the setup fee`);

  section("Compliance Documents");
  const docs = data.documents || {};
  DOC_LABELS.forEach(([key, label]) => {
    const d = docs[key];
    line(label, docStatusText(d));
    if (d?.status === "yes" && d.url) line("", d.url);
  });

  section("Declaration & Signature");
  if (data.notes) line("Additional Notes", data.notes);
  line("Terms & Conditions", "Accepted — the signed management agreement is attached separately");
  line("Signed By", data.signatureName || data.fullName);
  if (data.jointLandlord && (data.signature2Name || data.landlord2Name)) {
    line("Second Signatory", data.signature2Name || data.landlord2Name);
  }
  line("Signature Date", data.signatureDate || new Date().toLocaleDateString("en-GB"));
  line("Submitted", new Date().toLocaleString("en-GB"));

  return Buffer.from(doc.output("arraybuffer")).toString("base64");
}

function adminNotificationHtml(data: any, bundle: any) {
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
  const coupon = couponFromData(data);
  const sigLink = data.signatureUrl ? `<a href="${data.signatureUrl}">view signature image</a>` : "embedded in the signed PDF";
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>body{font-family:Arial,sans-serif;background:#f4f6f9;margin:0;padding:0;}.wrap{max-width:600px;margin:32px auto;background:#fff;border-radius:14px;overflow:hidden;}.header{background:#1a3c5e;padding:24px 32px;color:#fff;}.header h2{margin:0;font-size:20px;}.body{padding:28px 32px;}table{width:100%;border-collapse:collapse;font-size:14px;}td{padding:10px 12px;border-bottom:1px solid #eef0f5;vertical-align:top;}td:first-child{font-weight:600;color:#6b7280;width:38%;}td:last-child{color:#111;}</style></head><body><div class="wrap"><div class="header"><h2>🔔 New Landlord Registration (Agreement Signed)</h2><p style="margin:4px 0 0;opacity:.8;font-size:13px;">${new Date().toLocaleString("en-GB")}</p></div><div class="body"><table><tr><td>Owner Type</td><td>${isCompany ? "Company / Ltd" : "Individual owner"}</td></tr>${companyRows}${isCompany && people.length ? "" : `<tr><td>${isCompany ? "Contact Person" : "Full Name"}</td><td>${data.fullName}</td></tr>`}${!isCompany && data.jointLandlord && data.landlord2Name ? `<tr><td>Joint Landlord</td><td>${data.landlord2Name}</td></tr>` : ""}<tr><td>Email</td><td>${data.email}</td></tr><tr><td>Telephone</td><td>${data.phone}</td></tr><tr><td>Contact Address</td><td>${data.contactAddress || "-"}</td></tr><tr><td>Residency</td><td>${data.residency === "non-resident" ? "Non-resident (NRL)" : "UK-resident"}</td></tr><tr><td>${isCompany ? "Director's ID" : "Landlord ID"}</td><td>${docLinks("landlordId")}</td></tr><tr><td>Billing Address Document</td><td>${docLinks("billingProof")}</td></tr><tr><td>Proof of Ownership</td><td>${docLinks("ownershipProof")}</td></tr><tr><td>Properties Owned</td><td>${data.propertyCount || "-"}</td></tr>${propertyRows(data)}<tr><td>Package Selected</td><td><strong>${bundle.label}</strong> (${feeLine(bundle, coupon)})</td></tr>${coupon ? `<tr><td>Coupon Redeemed</td><td><strong>${coupon.code}</strong> — £${coupon.discount} off the setup fee</td></tr>` : ""}${docRows(data)}<tr><td>Notes</td><td>${data.notes || "-"}</td></tr><tr><td>Signed By</td><td>${data.signatureName || data.fullName}${data.jointLandlord && (data.signature2Name || data.landlord2Name) ? ` &amp; ${data.signature2Name || data.landlord2Name}` : ""} on ${data.signatureDate || new Date().toLocaleDateString("en-GB")}</td></tr><tr><td>Signature</td><td>${sigLink}</td></tr></table><p style="font-size:12px;color:#9ca3af;margin:16px 0 0;">The signed management agreement PDF and the full registration summary PDF are attached.</p></div></div></body></html>`;
}

export async function POST(request: Request) {
  const limited = rateLimit(request, "landlord-registration", 10, 10 * 60 * 1000);
  if (limited) return limited;
  try {
    // Strip any upload URL that isn't https on our own upload hosts — those
    // links are stored, emailed to staff as clickable links, and backed up to
    // Drive, so this is the choke point against link injection.
    const data = sanitizeUploadUrlFieldsDeep(await request.json());
    const required = ["fullName", "email", "phone", "selectedPackage", "signatureName"];
    for (const field of required) {
      if (!data[field]?.toString().trim()) {
        return Response.json({ message: `${field} is required` }, { status: 400 });
      }
    }
    if (!data.termsAccepted) return Response.json({ message: "The terms must be accepted" }, { status: 400 });
    if (typeof data.signatureImage !== "string" || !data.signatureImage.startsWith("data:image")) {
      return Response.json({ message: "A signature is required" }, { status: 400 });
    }

    const bundle = findBundle(data.selectedPackageId) || findBundle(data.selectedPackage);
    if (!bundle) return Response.json({ message: "A valid service package is required" }, { status: 400 });

    const db = getFirestoreClient();

    // Re-sign path: a landlord returning via a re-issue link. Validate the token
    // against the existing record before updating it in place.
    const agreementId = (data.agreementId || "").toString().trim();
    const reissueToken = (data.reissueToken || "").toString().trim();

    // Keep the base64 signature out of Firestore (kept lean); the Cloudinary URL
    // is the durable record. The raw image is only needed to build the PDF.
    // Coupon fields are stripped and re-added from the coupon document — the
    // client-claimed discount is never trusted.
    const { signatureImage, signature2Image, agreementId: _a, reissueToken: _t, couponCode: _c, couponDiscount: _d, ...toStore } = data;

    const couponCode = (data.couponCode || "").toString().trim().toUpperCase();
    const registrationRef = agreementId
      ? db.collection("landlordAgreements").doc(agreementId)
      : db.collection("landlordAgreements").doc();
    const docId = registrationRef.id;

    // Joint (second) landlord: when a valid second email is given we mint a
    // one-time token and (after the write) email them a link to add their own
    // ID/documents/signature. The token is issued on a new registration, and
    // re-issued on a re-sign UNLESS the second landlord has already completed.
    const jointEmail = (data.jointLandlord && data.landlord2Email && String(data.landlord2Email).includes("@"))
      ? String(data.landlord2Email).trim() : "";
    const secondToken = jointEmail ? generateSecondLandlordToken() : "";
    const secondFieldsNew = {
      secondLandlordToken: secondToken,
      secondLandlordExpires: Date.now() + SECOND_LANDLORD_TTL_MS,
      secondLandlordStatus: "pending",
    };
    let issuedSecondInvite = false;

    // Post-agreement forms (Authorised Rep + Bank/AML). On a NEW registration we
    // mint the first landlord's token so we can email them the two form links.
    const firstFormsToken = generateFormsToken();
    const firstFormsFields = {
      firstFormsToken,
      firstFormsExpires: Date.now() + POST_SIGN_FORMS_TTL_MS,
    };

    // One transaction covers the re-issue token check, the coupon redemption
    // and the registration write, so a coupon can only ever be redeemed once
    // and never without the registration actually being recorded.
    let clientError: { message: string; status: number } | null = null;
    let redeemedDiscount = 0;
    await db.runTransaction(async tx => {
      // ── All reads first (Firestore transaction rule) ──
      const couponRef = couponCode ? db.collection("agreementCoupons").doc(couponCode) : null;
      const cSnap = couponRef ? await tx.get(couponRef) : null;
      const aSnap = agreementId ? await tx.get(registrationRef) : null;

      let couponFields: Record<string, unknown> = {};
      if (couponRef && cSnap) {
        const c = cSnap.data();
        if (!cSnap.exists || !c) { clientError = { message: "That coupon code was not found.", status: 400 }; return; }
        if (c.status !== "active") { clientError = { message: "This coupon has already been used or is no longer active.", status: 400 }; return; }
        if (c.bundleId !== bundle.id) { clientError = { message: `This coupon is for the ${c.bundleLabel} package.`, status: 400 }; return; }
        couponFields = { couponCode, couponDiscount: c.discount };
        redeemedDiscount = c.discount;
      }
      if (agreementId) {
        const existing = aSnap?.data();
        if (!aSnap?.exists || !existing) { clientError = { message: "Registration not found", status: 404 }; return; }
        const valid = existing.reissueToken && existing.reissueToken === reissueToken
          && (!existing.reissueExpires || existing.reissueExpires > Date.now());
        if (!valid) { clientError = { message: "This signing link is invalid or has expired.", status: 403 }; return; }
      }

      // ── Writes ──
      if (couponRef) {
        tx.update(couponRef, {
          status: "used",
          usedAt: FieldValue.serverTimestamp(),
          usedBy: { name: data.fullName, email: data.email },
          agreementId: docId,
        });
      }
      if (agreementId) {
        const existing = aSnap?.data() || {};
        const reissueSecond = !!jointEmail && existing.secondLandlordStatus !== "completed";
        if (reissueSecond) issuedSecondInvite = true;
        tx.update(registrationRef, {
          ...toStore,
          ...couponFields,
          ...(reissueSecond ? secondFieldsNew : {}),
          status: "signed",
          reissueToken: FieldValue.delete(),
          reissueExpires: FieldValue.delete(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      } else {
        if (jointEmail) issuedSecondInvite = true;
        tx.set(registrationRef, {
          ...toStore,
          ...couponFields,
          ...(jointEmail ? secondFieldsNew : {}),
          ...firstFormsFields,
          status: "signed",
          source: "website-landlord-registration",
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    });
    if (clientError) {
      const { message, status } = clientError;
      return Response.json({ message }, { status });
    }

    // The documents must show the SERVER-verified discount.
    if (couponCode && redeemedDiscount > 0) {
      data.couponCode = couponCode;
      data.couponDiscount = redeemedDiscount;
    } else {
      delete data.couponCode;
      delete data.couponDiscount;
    }

    // Two PDFs: the signed management agreement, and the full registration
    // summary. Either failing must never block the registration or the emails.
    const template = await loadAgreementTemplate(db);
    let agreementPdf: string | undefined;
    try {
      agreementPdf = agreementPdfBase64(data, bundle, docId, template);
    } catch (e) {
      console.error("landlord-registration agreement PDF generation failed:", e);
    }
    let registrationPdf: string | undefined;
    try {
      registrationPdf = registrationPdfBase64(data, docId);
    } catch (e) {
      console.error("landlord-registration summary PDF generation failed:", e);
    }
    const attachments: Attachment[] = [
      ...(agreementPdf ? [{ filename: `management-agreement-${docId}.pdf`, content: agreementPdf }] : []),
      ...(registrationPdf ? [{ filename: `landlord-registration-${docId}.pdf`, content: registrationPdf }] : []),
    ];

    // User text is interpolated into email HTML below — escape a copy for the
    // templates while the raw values go to Firestore and the PDFs untouched.
    const emailData = htmlEscapeDeep(data);

    // Send the landlord copy to both landlords when it is a joint registration.
    const landlordTo = [data.email, ...(data.jointLandlord && data.landlord2Email ? [data.landlord2Email] : [])]
      .filter((e: string) => e && e.includes("@"));

    await Promise.allSettled([
      sendEmail({
        to: landlordTo.length ? landlordTo : data.email,
        subject: `🏠 Your Landlord Registration & signed ${bundle.label} agreement | House of Lettings`,
        html: landlordEmailHtml(emailData, bundle),
        attachments: attachments.length ? attachments : undefined,
      }),
      sendEmail({
        to: process.env.ADMIN_EMAIL || "admin@houseoflettings.co.uk",
        subject: `🔔 New Landlord Registration: ${data.fullName} (${bundle.label})`,
        html: adminNotificationHtml(emailData, bundle),
        attachments: attachments.length ? attachments : undefined,
      }),
      // Backup only, and never throws: a Drive outage must not lose a landlord.
      // A company registration is filed under the company, an individual under
      // their own name, matching how the office refers to them.
      backupToDrive({
        formType: "landlord-registration",
        label: data.companyName || data.fullName,
        address: primaryAddress(data),
        files: driveBackupFiles(data, registrationPdf, agreementPdf),
      }),
      // Provision (or link) the landlord's portal login and email the credentials.
      // Best-effort and self-contained: it swallows its own errors so a failure
      // here can never roll back or block the registration itself.
      provisionLandlordForAgreement(db, docId, data, { isNewRegistration: !agreementId }),
      // Invite the second (joint) landlord to complete their own details.
      ...(issuedSecondInvite && jointEmail ? [
        sendSecondEmail({
          to: jointEmail,
          subject: `👥 Complete your joint landlord details | House of Lettings`,
          html: secondLandlordInviteHtml({
            secondName: data.landlord2Name || "",
            firstName: data.fullName || "the primary landlord",
            packageLabel: bundle.label,
            propertyAddress: primaryAddress(data),
            link: `${SITE_URL}/landlord-registration/joint?id=${docId}&token=${secondToken}`,
          }),
        }),
      ] : []),
      // Email the first landlord the two post-agreement form links (new regs only).
      ...(!agreementId ? [
        sendPostSignFormsInvite({
          id: docId, token: firstFormsToken, party: "first",
          name: data.fullName || "", email: data.email || "", propertyAddress: primaryAddress(data),
        }),
      ] : []),
    ]);
    return Response.json({ success: true, id: docId }, { status: 201 });
  } catch (error) {
    console.error("landlord-registration error:", error);
    return Response.json({ message: "Internal server error. Please try again." }, { status: 500 });
  }
}
