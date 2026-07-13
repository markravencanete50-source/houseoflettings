import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
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

interface SendEmailArgs {
  to: string;
  subject: string;
  html: string;
  reply_to?: string;
  attachments?: { filename: string; content: string }[];
}

async function sendEmail({ to, subject, html, reply_to, attachments }: SendEmailArgs) {
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
      ...(attachments && attachments.length ? { attachments } : {}),
    }),
  });
  if (!res.ok) console.error("Email failed:", await res.json().catch(() => ({})));
}

// ─── Types ──────────────────────────────────────────────────────────────────
interface ValuationLeadData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  valuationType: "rent" | "sale";
  postcode: string;
  area: string;
  subArea: string;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  balcony: boolean;
  garden: string;
  parking: string;
  low: number;
  mid: number;
  high: number;
  adjustmentPct: number;
  period: string;
}

// ─── Formatting helpers ──────────────────────────────────────────────────────
function fmtGBP(n: number): string {
  return `£${n.toLocaleString("en-GB")}`;
}

function labelPropertyType(t: string): string {
  const map: Record<string, string> = {
    flat: "Flat / Apartment",
    terraced: "Terraced House",
    semi: "Semi-Detached",
    detached: "Detached House",
  };
  return map[t] || t;
}

function labelGarden(g: string): string {
  const map: Record<string, string> = {
    private: "Private garden",
    shared: "Shared / communal garden",
    patio: "Patio / courtyard",
    none: "No garden",
  };
  return map[g] || g;
}

function labelParking(p: string): string {
  const map: Record<string, string> = {
    garage: "Garage",
    driveway: "Driveway (off-street)",
    allocated: "Allocated space",
    permit: "Permit parking",
    on_street: "On-street",
    none: "No parking",
  };
  return map[p] || p;
}

// ─── PDF generation ──────────────────────────────────────────────────────────
async function generateValuationPdf(data: ValuationLeadData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4
  const { width, height } = page.getSize();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const navy = rgb(15 / 255, 31 / 255, 61 / 255);
  const blue = rgb(37 / 255, 99 / 255, 235 / 255);
  const grey = rgb(107 / 255, 114 / 255, 128 / 255);
  const lightGrey = rgb(0.94, 0.95, 0.97);

  let y = height - 60;

  // Header band
  page.drawRectangle({ x: 0, y: height - 110, width, height: 110, color: navy });
  page.drawText("House of Lettings", {
    x: 50, y: height - 50, size: 20, font: fontBold, color: rgb(1, 1, 1),
  });
  page.drawText(
    data.valuationType === "rent" ? "Instant Rental Valuation Report" : "Instant Sale Valuation Report",
    { x: 50, y: height - 78, size: 12, font, color: rgb(0.85, 0.9, 1) }
  );
  page.drawText(new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }), {
    x: 50, y: height - 96, size: 9, font, color: rgb(0.7, 0.78, 0.95),
  });

  y = height - 150;

  // Recipient
  page.drawText(`Prepared for ${data.firstName} ${data.lastName}`, {
    x: 50, y, size: 13, font: fontBold, color: navy,
  });
  y -= 18;
  page.drawText(`${data.postcode.toUpperCase()}, ${data.subArea}, ${data.area}`, {
    x: 50, y, size: 11, font, color: grey,
  });
  y -= 40;

  // Estimate box
  page.drawRectangle({ x: 50, y: y - 80, width: width - 100, height: 90, color: lightGrey, borderColor: blue, borderWidth: 1 });
  const estimateLabel = data.valuationType === "rent" ? "Estimated Monthly Rent" : "Estimated Sale Price";
  page.drawText(estimateLabel, { x: 70, y: y - 22, size: 10, font, color: grey });
  page.drawText(`${fmtGBP(data.mid)}${data.period}`, { x: 70, y: y - 48, size: 26, font: fontBold, color: blue });
  page.drawText(`Range: ${fmtGBP(data.low)}${data.period} to ${fmtGBP(data.high)}${data.period}`, {
    x: 70, y: y - 68, size: 10, font, color: grey,
  });
  y -= 110;

  // Section: Property details
  page.drawText("Property Details", { x: 50, y, size: 13, font: fontBold, color: navy });
  y -= 8;
  page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1, color: lightGrey });
  y -= 24;

  const rows: [string, string][] = [
    ["Property type", labelPropertyType(data.propertyType)],
    ["Bedrooms", data.bedrooms === 0 ? "Studio" : String(data.bedrooms)],
    ["Bathrooms", String(data.bathrooms)],
    ["Balcony", data.balcony ? "Yes" : "No"],
    ["Garden", labelGarden(data.garden)],
    ["Parking", labelParking(data.parking)],
  ];

  for (const [label, value] of rows) {
    page.drawText(label, { x: 50, y, size: 10, font, color: grey });
    page.drawText(value, { x: 250, y, size: 10, font: fontBold, color: navy });
    y -= 22;
  }

  y -= 14;

  // Section: Adjustment
  if (data.adjustmentPct > 0) {
    page.drawText("Feature Uplift", { x: 50, y, size: 13, font: fontBold, color: navy });
    y -= 8;
    page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1, color: lightGrey });
    y -= 24;
    page.drawText(
      `This estimate includes a +${(data.adjustmentPct * 100).toFixed(1)}% adjustment based on the`,
      { x: 50, y, size: 10, font, color: grey }
    );
    y -= 14;
    page.drawText(
      `property's bathrooms, balcony, garden, and parking, relative to the local baseline.`,
      { x: 50, y, size: 10, font, color: grey }
    );
    y -= 30;
  }

  // Disclaimer
  page.drawText("Important Information", { x: 50, y, size: 13, font: fontBold, color: navy });
  y -= 8;
  page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1, color: lightGrey });
  y -= 22;
  const disclaimerLines = [
    "This is an automated, indicative estimate based on 2026 regional market data for the",
    `${data.subArea} area. It is not a formal valuation and does not constitute property advice.`,
    "Actual market value depends on property condition, internal fixtures, exact location,",
    "and prevailing market conditions at the time of letting or sale.",
    "",
    "For a precise, professional valuation carried out by a local expert, book a free",
    "valuation appointment with House of Lettings.",
  ];
  for (const line of disclaimerLines) {
    page.drawText(line, { x: 50, y, size: 9, font, color: grey });
    y -= 14;
  }

  // Footer
  page.drawLine({ start: { x: 50, y: 70 }, end: { x: width - 50, y: 70 }, thickness: 1, color: lightGrey });
  page.drawText("House of Lettings Ltd  ·  info@houseoflettings.co.uk  ·  houseoflettings.uk", {
    x: 50, y: 50, size: 8, font, color: grey,
  });

  const bytes = await pdfDoc.save();
  return bytes;
}

// ─── Email templates ─────────────────────────────────────────────────────────
function confirmationEmailHtml(data: ValuationLeadData): string {
  const estimateLabel = data.valuationType === "rent" ? "Estimated Monthly Rent" : "Estimated Sale Price";
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>body{font-family:Arial,sans-serif;background:#f4f6f9;margin:0;padding:0;}.wrap{max-width:600px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);}.header{background:linear-gradient(135deg,#1a3c5e,#2563a8);padding:36px 40px;color:#fff;}.header h1{margin:0 0 6px;font-size:24px;font-weight:700;}.body{padding:36px 40px;}.body p{font-size:15px;line-height:1.65;color:#374151;margin:0 0 16px;}.estimate-box{background:#f0f4ff;border:1px solid #dbeafe;border-radius:12px;padding:24px;margin:24px 0;text-align:center;}.estimate-label{font-size:13px;color:#6b7280;margin:0 0 6px;}.estimate-value{font-size:32px;font-weight:800;color:#2563a8;margin:0 0 6px;}.estimate-range{font-size:13px;color:#6b7280;margin:0;}.detail-box{background:#f8f9ff;border-radius:12px;padding:20px 24px;margin:24px 0;}.detail-row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eef0f5;font-size:14px;}.detail-row:last-child{border-bottom:none;}.detail-label{color:#6b7280;font-weight:500;}.detail-value{color:#111827;font-weight:600;}.footer{background:#f8f9ff;padding:20px 40px;text-align:center;font-size:12px;color:#9ca3af;}</style></head><body><div class="wrap"><div class="header"><h1>📊 Your Instant Valuation</h1><p>House of Lettings, ${data.valuationType === "rent" ? "Rental" : "Sale"} Estimate</p></div><div class="body"><p>Dear <strong>${data.firstName} ${data.lastName}</strong>,</p><p>Thank you for using our Instant Valuation tool. Here's a summary of your estimate for <strong>${data.postcode.toUpperCase()}</strong>, ${data.subArea}.</p><div class="estimate-box"><p class="estimate-label">${estimateLabel}</p><p class="estimate-value">${fmtGBP(data.mid)}${data.period}</p><p class="estimate-range">Range: ${fmtGBP(data.low)}${data.period} to ${fmtGBP(data.high)}${data.period}</p></div><div class="detail-box"><div class="detail-row"><span class="detail-label">Property type</span><span class="detail-value">${labelPropertyType(data.propertyType)}</span></div><div class="detail-row"><span class="detail-label">Bedrooms</span><span class="detail-value">${data.bedrooms === 0 ? "Studio" : data.bedrooms}</span></div><div class="detail-row"><span class="detail-label">Bathrooms</span><span class="detail-value">${data.bathrooms}</span></div><div class="detail-row"><span class="detail-label">Garden</span><span class="detail-value">${labelGarden(data.garden)}</span></div><div class="detail-row"><span class="detail-label">Parking</span><span class="detail-value">${labelParking(data.parking)}</span></div></div><p>Your full report is attached as a PDF. This estimate is indicative only. For a precise, professional valuation from a local expert, simply reply to this email or visit our website to book a free valuation.</p></div><div class="footer">© ${new Date().getFullYear()} House of Lettings Ltd. All rights reserved.</div></div></body></html>`;
}

function adminNotificationHtml(data: ValuationLeadData): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>body{font-family:Arial,sans-serif;background:#f4f6f9;margin:0;padding:0;}.wrap{max-width:600px;margin:32px auto;background:#fff;border-radius:14px;overflow:hidden;}.header{background:#1a3c5e;padding:24px 32px;color:#fff;}.header h2{margin:0;font-size:20px;}.body{padding:28px 32px;}table{width:100%;border-collapse:collapse;font-size:14px;}td{padding:10px 12px;border-bottom:1px solid #eef0f5;}td:first-child{font-weight:600;color:#6b7280;width:38%;}td:last-child{color:#111;}</style></head><body><div class="wrap"><div class="header"><h2>📊 New Instant Valuation Lead</h2><p style="margin:4px 0 0;opacity:.8;font-size:13px;">${new Date().toLocaleString("en-GB")}</p></div><div class="body"><table><tr><td>Name</td><td>${data.firstName} ${data.lastName}</td></tr><tr><td>Email</td><td>${data.email}</td></tr><tr><td>Phone</td><td>${data.phone}</td></tr><tr><td>Postcode</td><td>${data.postcode.toUpperCase()}</td></tr><tr><td>Area</td><td>${data.subArea}, ${data.area}</td></tr><tr><td>Valuation type</td><td>${data.valuationType === "rent" ? "Rental" : "Sale"}</td></tr><tr><td>Property type</td><td>${labelPropertyType(data.propertyType)}</td></tr><tr><td>Bedrooms</td><td>${data.bedrooms === 0 ? "Studio" : data.bedrooms}</td></tr><tr><td>Bathrooms</td><td>${data.bathrooms}</td></tr><tr><td>Balcony</td><td>${data.balcony ? "Yes" : "No"}</td></tr><tr><td>Garden</td><td>${labelGarden(data.garden)}</td></tr><tr><td>Parking</td><td>${labelParking(data.parking)}</td></tr><tr><td>Estimate</td><td>${fmtGBP(data.mid)}${data.period} (range ${fmtGBP(data.low)} to ${fmtGBP(data.high)}${data.period})</td></tr></table></div></div></body></html>`;
}

// ─── Route handler ───────────────────────────────────────────────────────────
export async function POST(request: Request) {
  const limited = rateLimit(request, "instant-valuation", 10, 10 * 60 * 1000);
  if (limited) return limited;
  try {
    const data = (await request.json()) as ValuationLeadData;

    const required = ["firstName", "lastName", "email", "phone", "postcode", "valuationType"];
    for (const field of required) {
      const value = (data as any)[field];
      if (!value?.toString().trim()) {
        return Response.json({ message: `${field} is required` }, { status: 400 });
      }
    }

    const db = getFirestoreClient();
    const docRef = await db.collection("instantValuationLeads").add({
      ...data,
      status: "pending",
      source: "instant-valuation",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    const pdfBytes = await generateValuationPdf(data);
    const pdfBase64 = Buffer.from(pdfBytes).toString("base64");
    const pdfFilename = `Instant-Valuation-${data.postcode.toUpperCase().replace(/\s+/g, "")}.pdf`;

    await Promise.allSettled([
      sendEmail({
        to: data.email,
        subject: "📊 Your Instant Valuation Report | House of Lettings",
        html: confirmationEmailHtml(data),
        attachments: [{ filename: pdfFilename, content: pdfBase64 }],
      }),
      sendEmail({
        to: process.env.ADMIN_EMAIL || "info@houseoflettings.co.uk",
        subject: `📊 New Instant Valuation Lead: ${data.firstName} ${data.lastName}`,
        html: adminNotificationHtml(data),
        reply_to: data.email,
      }),
    ]);

    return Response.json({ success: true, id: docRef.id }, { status: 201 });
  } catch (error) {
    console.error("instant-valuation error:", error);
    return Response.json({ message: "Internal server error. Please try again." }, { status: 500 });
  }
}
