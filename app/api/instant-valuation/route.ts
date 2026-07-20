// app/api/instant-valuation/route.ts
// Final step of the instant valuation flow: the visitor has already SEEN their
// report on the page and opted in to receive it by email. This route stores
// the lead, renders a structured PDF of the full report (figures + AI market
// analysis) and emails it to the visitor, with a lead notification to admin.

import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { rateLimit } from '@/lib/rateLimit';
import { htmlEscapeDeep } from '@/lib/security';
import {
  PROPERTY_TYPE_LABEL, CONDITION_LABEL, EPC_LABEL, GARDEN_LABEL, PARKING_LABEL,
  bedroomsLabel, fmtGBP,
  type FullValuationInput, type FullValuationResult, type ValuationType, type ModeValuation,
} from '@/lib/valuation/fullEngine';
import type { AiAnalysis } from '@/lib/ai/groqValuation';

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

// ─── Payload types ───────────────────────────────────────────────────────────
interface Contact {
  firstName: string;
  lastName:  string;
  email:     string;
  phone:     string;
}

interface ValuationReport {
  property: FullValuationInput;
  type: ValuationType;
  result: FullValuationResult;
  ai: AiAnalysis;
  generatedAt: string;
}

function typeLabel(t: ValuationType): string {
  return t === 'let' ? 'Rental' : t === 'sale' ? 'Sale' : 'Rental & Sale';
}

function fullAddress(p: FullValuationInput): string {
  return [p.addressLine1, p.postcode.toUpperCase()].filter(Boolean).join(', ');
}

// ─── PDF generation ──────────────────────────────────────────────────────────
const A4: [number, number] = [595, 842];
const MARGIN = 50;

class PdfWriter {
  doc!: PDFDocument;
  page!: PDFPage;
  font!: PDFFont;
  fontBold!: PDFFont;
  y = 0;
  width = A4[0];

  readonly navy  = rgb(15 / 255, 31 / 255, 61 / 255);
  readonly blue  = rgb(37 / 255, 99 / 255, 235 / 255);
  readonly grey  = rgb(107 / 255, 114 / 255, 128 / 255);
  readonly light = rgb(0.94, 0.95, 0.97);

  static async create(): Promise<PdfWriter> {
    const w = new PdfWriter();
    w.doc = await PDFDocument.create();
    w.font = await w.doc.embedFont(StandardFonts.Helvetica);
    w.fontBold = await w.doc.embedFont(StandardFonts.HelveticaBold);
    w.addPage();
    return w;
  }

  addPage() {
    this.page = this.doc.addPage(A4);
    this.y = A4[1] - MARGIN;
  }

  ensure(space: number) {
    if (this.y - space < 80) this.addPage();
  }

  wrap(text: string, size: number, font: PDFFont, maxWidth: number): string[] {
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let line = '';
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(test, size) > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  paragraph(text: string, opts?: { size?: number; bold?: boolean; color?: ReturnType<typeof rgb>; indent?: number; gap?: number }) {
    const size = opts?.size ?? 10;
    const font = opts?.bold ? this.fontBold : this.font;
    const color = opts?.color ?? this.grey;
    const indent = opts?.indent ?? 0;
    const maxW = this.width - MARGIN * 2 - indent;
    const lines = this.wrap(text, size, font, maxW);
    for (const line of lines) {
      this.ensure(size + 6);
      this.page.drawText(line, { x: MARGIN + indent, y: this.y, size, font, color });
      this.y -= size + 5;
    }
    this.y -= opts?.gap ?? 6;
  }

  sectionTitle(title: string) {
    this.ensure(46);
    this.y -= 8;
    this.page.drawText(title, { x: MARGIN, y: this.y, size: 13, font: this.fontBold, color: this.navy });
    this.y -= 8;
    this.page.drawLine({
      start: { x: MARGIN, y: this.y }, end: { x: this.width - MARGIN, y: this.y },
      thickness: 1, color: this.light,
    });
    this.y -= 20;
  }

  keyValueRow(label: string, value: string) {
    this.ensure(22);
    this.page.drawText(label, { x: MARGIN, y: this.y, size: 10, font: this.font, color: this.grey });
    this.page.drawText(value, { x: 250, y: this.y, size: 10, font: this.fontBold, color: this.navy });
    this.y -= 20;
  }

  bullet(text: string) {
    this.ensure(20);
    this.page.drawText('•', { x: MARGIN + 4, y: this.y, size: 10, font: this.fontBold, color: this.blue });
    const maxW = this.width - MARGIN * 2 - 18;
    const lines = this.wrap(text, 10, this.font, maxW);
    for (let i = 0; i < lines.length; i++) {
      if (i > 0) this.ensure(15);
      this.page.drawText(lines[i], { x: MARGIN + 18, y: this.y, size: 10, font: this.font, color: this.grey });
      this.y -= 15;
    }
    this.y -= 2;
  }
}

function estimateBox(w: PdfWriter, mode: ModeValuation, title: string, suffix: string) {
  const boxH = 96;
  w.ensure(boxH + 16);
  const top = w.y;
  w.page.drawRectangle({
    x: MARGIN, y: top - boxH, width: w.width - MARGIN * 2, height: boxH,
    color: w.light, borderColor: w.blue, borderWidth: 1,
  });
  w.page.drawText(title, { x: MARGIN + 20, y: top - 24, size: 11, font: w.fontBold, color: w.navy });

  const colW = (w.width - MARGIN * 2 - 40) / 3;
  const cols: [string, number, boolean][] = [
    ['CONSERVATIVE', mode.conservative, false],
    ['MARKET VALUE', mode.market, true],
    ['OPTIMISTIC', mode.optimistic, false],
  ];
  cols.forEach(([label, value, isMid], i) => {
    const x = MARGIN + 20 + colW * i;
    w.page.drawText(label as string, { x, y: top - 46, size: 8, font: w.font, color: w.grey });
    w.page.drawText(`${fmtGBP(value as number)}${suffix}`, {
      x, y: top - 68, size: isMid ? 17 : 14,
      font: isMid ? w.fontBold : w.font,
      color: isMid ? w.blue : w.navy,
    });
  });
  w.y = top - boxH - 16;
}

async function generateReportPdf(contact: Contact, report: ValuationReport): Promise<Uint8Array> {
  const w = await PdfWriter.create();
  const { property, result, ai } = report;
  const height = A4[1];

  // Header band
  w.page.drawRectangle({ x: 0, y: height - 110, width: w.width, height: 110, color: w.navy });
  w.page.drawText('House of Lettings', { x: MARGIN, y: height - 50, size: 20, font: w.fontBold, color: rgb(1, 1, 1) });
  w.page.drawText(`Instant ${typeLabel(report.type)} Valuation Report`, {
    x: MARGIN, y: height - 76, size: 12, font: w.font, color: rgb(0.85, 0.9, 1),
  });
  w.page.drawText(
    new Date(report.generatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
    { x: MARGIN, y: height - 94, size: 9, font: w.font, color: rgb(0.7, 0.78, 0.95) },
  );
  w.y = height - 140;

  // Recipient
  w.page.drawText(`Prepared for ${contact.firstName} ${contact.lastName}`, {
    x: MARGIN, y: w.y, size: 13, font: w.fontBold, color: w.navy,
  });
  w.y -= 18;
  w.page.drawText(`${fullAddress(property)}  |  ${result.areaLabel}`, {
    x: MARGIN, y: w.y, size: 11, font: w.font, color: w.grey,
  });
  w.y -= 28;

  // Estimates
  if (result.rent) estimateBox(w, result.rent, 'Estimated Monthly Rent', '/month');
  if (result.sale) estimateBox(w, result.sale, 'Estimated Sale Price', '');

  // AI summary
  w.sectionTitle('Valuation Summary');
  w.paragraph(ai.summary);

  // Property details
  w.sectionTitle('Property Details');
  w.keyValueRow('Address', fullAddress(property));
  w.keyValueRow('Property type', PROPERTY_TYPE_LABEL[property.propertyType]);
  w.keyValueRow('Bedrooms', bedroomsLabel(property.bedrooms));
  w.keyValueRow('Bathrooms', String(property.bathrooms));
  w.keyValueRow('Condition', CONDITION_LABEL[property.condition]);
  w.keyValueRow('Energy rating', EPC_LABEL[property.epc]);
  w.keyValueRow('Garden', GARDEN_LABEL[property.garden]);
  w.keyValueRow('Balcony', property.balcony ? 'Yes' : 'No');
  w.keyValueRow('Parking', PARKING_LABEL[property.parking]);

  // Key drivers
  if (ai.keyDrivers.length) {
    w.sectionTitle('What Drives This Valuation');
    for (const d of ai.keyDrivers) w.bullet(d);
  }

  // Positioning advice
  if (ai.rentCommentary || ai.saleCommentary) {
    w.sectionTitle('Pricing Guidance');
    if (ai.rentCommentary) w.paragraph(ai.rentCommentary);
    if (ai.saleCommentary) w.paragraph(ai.saleCommentary);
  }

  // Market outlook
  w.sectionTitle('Local Market Outlook');
  w.paragraph(ai.marketOutlook);
  const growthBits: string[] = [];
  if (result.rent) growthBits.push(`average rents in ${result.regionLabel} are moving ${result.rent.annualGrowthPct >= 0 ? '+' : ''}${result.rent.annualGrowthPct}% year on year`);
  if (result.sale) growthBits.push(`sale prices are moving ${result.sale.annualGrowthPct >= 0 ? '+' : ''}${result.sale.annualGrowthPct}% year on year`);
  w.paragraph(
    `Supporting data: baseline figures come from ${result.dataYear} ONS UK House Price Index and private-rent statistics${result.isOperatingArea ? `, refined to district level for ${result.areaLabel}` : ` for the ${result.regionLabel} region`}; ${growthBits.join(' and ')}. Figures were last refreshed ${result.dataUpdated}.`,
  );

  // Feature adjustments
  const adj = result.rent?.adjustments?.length ? result.rent : result.sale;
  if (adj?.adjustments?.length) {
    w.sectionTitle('Feature Adjustments Applied');
    for (const line of adj.adjustments) {
      w.bullet(`${line.label}: ${line.pct >= 0 ? '+' : ''}${(line.pct * 100).toFixed(1)}% against the local baseline`);
    }
  }

  // Recommendation & next steps
  w.sectionTitle('Recommended Next Step');
  w.paragraph(ai.recommendation);
  w.paragraph(
    'A free, no-obligation professional valuation with one of our local experts will confirm a precise figure for your property. Book at houseoflettings.uk/book-valuation or simply reply to the email this report arrived with.',
    { color: w.navy },
  );

  // Disclaimer
  w.sectionTitle('Important Information');
  w.paragraph(
    'This report is an automated, indicative estimate produced from regional and district market data combined with the details you provided. It is not a formal valuation, a survey, or property advice, and it should not be relied upon for lending, legal or tax purposes. Actual achievable rent or sale value depends on the property’s exact location, internal specification, presentation and prevailing market conditions.',
    { size: 9 },
  );

  // Footer on every page
  for (const page of w.doc.getPages()) {
    page.drawLine({ start: { x: MARGIN, y: 60 }, end: { x: w.width - MARGIN, y: 60 }, thickness: 1, color: w.light });
    page.drawText('House of Lettings Ltd  ·  info@houseoflettings.co.uk  ·  houseoflettings.uk', {
      x: MARGIN, y: 44, size: 8, font: w.font, color: w.grey,
    });
  }

  return w.doc.save();
}

// ─── Email templates ─────────────────────────────────────────────────────────
const EMAIL_CSS = `body{font-family:Arial,Helvetica,sans-serif;background:#f4f6f9;margin:0;padding:0;}
.wrap{max-width:620px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);}
.header{background:linear-gradient(135deg,#0f1f3d,#2563a8);padding:34px 40px;color:#fff;}
.header h1{margin:0 0 6px;font-size:23px;font-weight:700;}
.header p{margin:0;font-size:13px;color:#cfe0f5;}
.body{padding:32px 40px;}
.body p{font-size:14.5px;line-height:1.7;color:#374151;margin:0 0 16px;}
.band{border:1px solid #dbeafe;border-radius:12px;overflow:hidden;margin:20px 0;}
.band-title{background:#eff5ff;padding:12px 20px;font-size:13px;font-weight:700;color:#0f1f3d;}
.band-cols{display:table;width:100%;table-layout:fixed;}
.band-col{display:table-cell;padding:16px 12px;text-align:center;border-left:1px solid #eef1f5;}
.band-col:first-child{border-left:none;}
.band-label{font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#6b7280;margin:0 0 6px;}
.band-value{font-size:18px;font-weight:800;color:#0f1f3d;margin:0;}
.band-col--mid .band-value{color:#2563a8;font-size:21px;}
.section-h{font-size:15px;font-weight:700;color:#0f1f3d;margin:26px 0 10px;}
.details{background:#f8f9ff;border-radius:12px;padding:6px 20px;margin:0 0 8px;}
.detail-row{display:table;width:100%;padding:9px 0;border-bottom:1px solid #eef0f5;font-size:13.5px;}
.detail-row:last-child{border-bottom:none;}
.detail-label{display:table-cell;color:#6b7280;}
.detail-value{display:table-cell;text-align:right;color:#111827;font-weight:600;}
.drivers{margin:0;padding:0 0 0 18px;}
.drivers li{font-size:13.5px;color:#374151;line-height:1.7;margin-bottom:6px;}
.cta{display:inline-block;background:#2563a8;color:#fff !important;text-decoration:none;font-size:14px;font-weight:700;padding:13px 26px;border-radius:10px;margin:6px 0 2px;}
.note{font-size:12px;color:#9ca3af;line-height:1.6;}
.footer{background:#f8f9ff;padding:18px 40px;text-align:center;font-size:11.5px;color:#9ca3af;}`;

function bandHtml(mode: ModeValuation, title: string, suffix: string): string {
  return `<div class="band"><div class="band-title">${title}</div><div class="band-cols">
<div class="band-col"><p class="band-label">Conservative</p><p class="band-value">${fmtGBP(mode.conservative)}${suffix}</p></div>
<div class="band-col band-col--mid"><p class="band-label">Market value</p><p class="band-value">${fmtGBP(mode.market)}${suffix}</p></div>
<div class="band-col"><p class="band-label">Optimistic</p><p class="band-value">${fmtGBP(mode.optimistic)}${suffix}</p></div>
</div></div>`;
}

function customerEmailHtml(contact: Contact, report: ValuationReport, bookUrl: string): string {
  const { property, result, ai } = report;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>${EMAIL_CSS}</style></head><body><div class="wrap">
<div class="header"><h1>Your Property Valuation Report</h1><p>${fullAddress(property)} · ${result.areaLabel}</p></div>
<div class="body">
<p>Dear ${contact.firstName},</p>
<p>Thank you for using the House of Lettings instant valuation service. Your full report is attached as a PDF, and the headline figures are below.</p>
${result.rent ? bandHtml(result.rent, 'Estimated Monthly Rent', '/mo') : ''}
${result.sale ? bandHtml(result.sale, 'Estimated Sale Price', '') : ''}
<p>${ai.summary}</p>
<p class="section-h">Your property</p>
<div class="details">
<div class="detail-row"><span class="detail-label">Property type</span><span class="detail-value">${PROPERTY_TYPE_LABEL[property.propertyType]}</span></div>
<div class="detail-row"><span class="detail-label">Bedrooms</span><span class="detail-value">${bedroomsLabel(property.bedrooms)}</span></div>
<div class="detail-row"><span class="detail-label">Bathrooms</span><span class="detail-value">${property.bathrooms}</span></div>
<div class="detail-row"><span class="detail-label">Condition</span><span class="detail-value">${CONDITION_LABEL[property.condition].split(' (')[0]}</span></div>
<div class="detail-row"><span class="detail-label">Energy rating</span><span class="detail-value">${EPC_LABEL[property.epc]}</span></div>
<div class="detail-row"><span class="detail-label">Garden</span><span class="detail-value">${GARDEN_LABEL[property.garden]}</span></div>
<div class="detail-row"><span class="detail-label">Balcony</span><span class="detail-value">${property.balcony ? 'Yes' : 'No'}</span></div>
<div class="detail-row"><span class="detail-label">Parking</span><span class="detail-value">${PARKING_LABEL[property.parking]}</span></div>
</div>
<p class="section-h">What drives this valuation</p>
<ul class="drivers">${ai.keyDrivers.map(d => `<li>${d}</li>`).join('')}</ul>
<p class="section-h">Next step: confirm the figure in person</p>
<p>${ai.recommendation}</p>
<p style="text-align:center;"><a class="cta" href="${bookUrl}">Book a Free Professional Valuation</a></p>
<p class="note">This is an automated, indicative estimate, not a formal valuation. The attached PDF includes the full methodology, market outlook and feature adjustments behind these figures.</p>
</div>
<div class="footer">© ${new Date().getFullYear()} House of Lettings Ltd · info@houseoflettings.co.uk · houseoflettings.uk</div>
</div></body></html>`;
}

function adminEmailHtml(contact: Contact, report: ValuationReport): string {
  const { property, result } = report;
  const rows: [string, string][] = [
    ['Name', `${contact.firstName} ${contact.lastName}`],
    ['Email', contact.email],
    ['Phone', contact.phone],
    ['Address', fullAddress(property)],
    ['Area', result.areaLabel],
    ['Valuation type', typeLabel(report.type)],
    ['Property', `${bedroomsLabel(property.bedrooms)} ${PROPERTY_TYPE_LABEL[property.propertyType]}, ${property.bathrooms} bath`],
    ['Condition / EPC', `${CONDITION_LABEL[property.condition].split(' (')[0]} / ${EPC_LABEL[property.epc]}`],
    ['Features', [GARDEN_LABEL[property.garden], property.balcony ? 'Balcony' : null, PARKING_LABEL[property.parking]].filter(Boolean).join(' · ')],
    ...(result.rent ? [['Rent estimate', `${fmtGBP(result.rent.market)}/mo (range ${fmtGBP(result.rent.conservative)}–${fmtGBP(result.rent.optimistic)})`] as [string, string]] : []),
    ...(result.sale ? [['Sale estimate', `${fmtGBP(result.sale.market)} (range ${fmtGBP(result.sale.conservative)}–${fmtGBP(result.sale.optimistic)})`] as [string, string]] : []),
  ];
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>body{font-family:Arial,sans-serif;background:#f4f6f9;margin:0;padding:0;}.wrap{max-width:600px;margin:32px auto;background:#fff;border-radius:14px;overflow:hidden;}.header{background:#0f1f3d;padding:24px 32px;color:#fff;}.header h2{margin:0;font-size:19px;}.body{padding:26px 32px;}table{width:100%;border-collapse:collapse;font-size:14px;}td{padding:10px 12px;border-bottom:1px solid #eef0f5;}td:first-child{font-weight:600;color:#6b7280;width:36%;}td:last-child{color:#111;}</style></head><body><div class="wrap"><div class="header"><h2>📊 New Instant Valuation Lead</h2><p style="margin:4px 0 0;opacity:.8;font-size:13px;">${new Date().toLocaleString('en-GB')}</p></div><div class="body"><table>${rows.map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('')}</table></div></div></body></html>`;
}

// ─── Validation ──────────────────────────────────────────────────────────────
function isValidEmail(e: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim()); }

function badRequest(message: string) { return Response.json({ message }, { status: 400 }); }

// ─── Route handler ───────────────────────────────────────────────────────────
export async function POST(request: Request) {
  const limited = rateLimit(request, "instant-valuation", 10, 10 * 60 * 1000);
  if (limited) return limited;
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') return badRequest('Invalid request body');

    const contact = body.contact as Contact | undefined;
    const report = body.report as ValuationReport | undefined;

    if (!contact?.firstName?.trim()) return badRequest('First name is required');
    if (!contact?.lastName?.trim())  return badRequest('Last name is required');
    if (!contact?.email?.trim() || !isValidEmail(contact.email)) return badRequest('A valid email address is required');
    if (!contact?.phone?.trim()) return badRequest('Phone number is required');
    if (!report?.property?.postcode || !report?.result || !report?.ai || !report?.type) {
      return badRequest('A generated valuation report is required');
    }
    if (!report.result.rent && !report.result.sale) return badRequest('The report contains no valuation figures');

    const db = getFirestoreClient();
    const docRef = await db.collection("instantValuationLeads").add({
      firstName: contact.firstName.trim(),
      lastName:  contact.lastName.trim(),
      email:     contact.email.trim(),
      phone:     contact.phone.trim(),
      valuationType: report.type,
      postcode:  report.property.postcode.toUpperCase(),
      addressLine1: report.property.addressLine1 || '',
      area:      report.result.areaLabel,
      property:  report.property,
      rent:      report.result.rent || null,
      sale:      report.result.sale || null,
      aiSource:  report.ai.source,
      status: "pending",
      source: "instant-valuation",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    const pdfBytes = await generateReportPdf(contact, report);
    const pdfBase64 = Buffer.from(pdfBytes).toString("base64");
    const pdfFilename = `Valuation-Report-${report.property.postcode.toUpperCase().replace(/\s+/g, "")}.pdf`;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://houseoflettings.uk';
    const bookUrl = `${siteUrl}/book-valuation?street=${encodeURIComponent(report.property.addressLine1 || '')}&postcode=${encodeURIComponent(report.property.postcode)}&name=${encodeURIComponent(`${contact.firstName} ${contact.lastName}`)}&email=${encodeURIComponent(contact.email)}&phone=${encodeURIComponent(contact.phone)}`;

    // Escaped copies feed the HTML email builders only — the PDF and Firestore
    // keep the raw values (escaping would print literal &amp; entities there).
    const safeContact = htmlEscapeDeep(contact);
    const safeReport = htmlEscapeDeep(report);

    await Promise.allSettled([
      sendEmail({
        to: contact.email,
        subject: "Your Property Valuation Report | House of Lettings",
        html: customerEmailHtml(safeContact, safeReport, bookUrl),
        attachments: [{ filename: pdfFilename, content: pdfBase64 }],
      }),
      sendEmail({
        to: process.env.ADMIN_EMAIL || "info@houseoflettings.co.uk",
        subject: `📊 Instant Valuation Lead: ${contact.firstName} ${contact.lastName} (${report.property.postcode.toUpperCase()})`,
        html: adminEmailHtml(safeContact, safeReport),
        reply_to: contact.email,
      }),
    ]);

    return Response.json({ success: true, id: docRef.id }, { status: 201 });
  } catch (error) {
    console.error("instant-valuation error:", error);
    return Response.json({ message: "Internal server error. Please try again." }, { status: 500 });
  }
}
