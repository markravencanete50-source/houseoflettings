// app/api/landlord-registration/second/route.ts
// The joint (second) landlord's completion flow, reached from the secure link in
// the invite email (/landlord-registration/joint?id=&token=).
//   GET  — validate the token and return just enough context to greet them and
//          prefill their name/email/phone. Never returns the first landlord's
//          documents, signature or token.
//   POST — save the second landlord's own details, documents and signature onto
//          the SAME registration record, mark them complete, and email both the
//          second landlord and the office. The token is one-time.
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { rateLimit } from "@/lib/rateLimit";
import { escapeHtml, htmlEscapeDeep, sanitizeUploadUrlFieldsDeep } from "@/lib/security";
import { backupToDrive, namedFiles } from "@/lib/googleDrive";
import {
  secondLandlordPdfBase64,
  secondLandlordConfirmHtml,
  secondLandlordOfficeHtml,
  sendEmail,
} from "@/lib/secondLandlord";
import type { Attachment } from "@/lib/agreementDocuments";

function db() {
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

function propertyAddress(d: any): string {
  const p = Array.isArray(d?.properties) && d.properties[0] ? d.properties[0] : d;
  return [p?.flatNumber, p?.street, p?.city, p?.postcode].filter(Boolean).join(", ") || (d?.address || "");
}

// A record's token is valid when it matches, hasn't expired, and the second
// landlord hasn't already completed.
function tokenValid(d: any, token: string): boolean {
  return !!token && d?.secondLandlordToken === token
    && (!d?.secondLandlordExpires || d.secondLandlordExpires > Date.now())
    && d?.secondLandlordStatus !== "completed";
}

export async function GET(request: Request) {
  const limited = rateLimit(request, "landlord-second-check", 30, 15 * 60 * 1000);
  if (limited) return limited;
  try {
    const url = new URL(request.url);
    const id = (url.searchParams.get("id") || "").trim();
    const token = (url.searchParams.get("token") || "").trim();
    if (!id || !token) return Response.json({ valid: false }, { status: 200 });

    const snap = await db().collection("landlordAgreements").doc(id).get();
    const d = snap.data();
    if (!snap.exists || !d) return Response.json({ valid: false }, { status: 200 });
    if (d.secondLandlordStatus === "completed") return Response.json({ valid: false, completed: true }, { status: 200 });
    if (!tokenValid(d, token)) return Response.json({ valid: false }, { status: 200 });

    return Response.json({
      valid: true,
      firstName: d.fullName || "",
      packageLabel: d.selectedPackage || "",
      propertyAddress: propertyAddress(d),
      landlord2Name: d.landlord2Name || "",
      landlord2Email: d.landlord2Email || "",
      landlord2Phone: d.landlord2Phone || "",
    }, { status: 200 });
  } catch (e) {
    console.error("landlord second GET error:", e);
    return Response.json({ valid: false }, { status: 200 });
  }
}

export async function POST(request: Request) {
  const limited = rateLimit(request, "landlord-second", 10, 15 * 60 * 1000);
  if (limited) return limited;
  try {
    const raw = await request.json();
    const id = (raw.id || "").toString().trim();
    const token = (raw.token || "").toString().trim();
    if (!id || !token) return Response.json({ message: "Missing link parameters." }, { status: 400 });

    // Signature image (data URL) is used to build the PDF; keep it out of the
    // sanitiser (it's not an upload URL) and out of Firestore.
    const { signatureImage, id: _i, token: _t, ...rest } = raw;
    const data = sanitizeUploadUrlFieldsDeep(rest);

    const database = db();
    const ref = database.collection("landlordAgreements").doc(id);
    const snap = await ref.get();
    const doc = snap.data();
    if (!snap.exists || !doc) return Response.json({ message: "Registration not found." }, { status: 404 });
    if (doc.secondLandlordStatus === "completed") {
      return Response.json({ message: "This joint landlord section has already been completed." }, { status: 409 });
    }
    if (!tokenValid(doc, token)) {
      return Response.json({ message: "This link is invalid or has expired. Please ask the primary landlord to re-send it." }, { status: 403 });
    }

    // Required personal fields + at least one file per document type.
    const required = ["fullName", "email", "phone", "contactAddress", "residency", "signatureName"];
    for (const f of required) {
      if (!data[f]?.toString().trim()) return Response.json({ message: `${f} is required` }, { status: 400 });
    }
    const need: [string, string][] = [
      ["landlordIdUrls", "Landlord ID"],
      ["billingProofUrls", "billing address proof"],
      ["ownershipProofUrls", "proof of ownership"],
    ];
    for (const [key, label] of need) {
      if (!Array.isArray(data[key]) || data[key].length === 0) {
        return Response.json({ message: `Please upload your ${label}` }, { status: 400 });
      }
    }
    if (typeof signatureImage === "string" && signatureImage.length > 3_000_000) {
      return Response.json({ message: "Signature image is too large." }, { status: 400 });
    }

    const second = {
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      contactAddress: data.contactAddress,
      residency: data.residency,
      landlordIdUrls: data.landlordIdUrls || [],
      landlordIdFileNames: data.landlordIdFileNames || [],
      billingProofUrls: data.billingProofUrls || [],
      billingProofFileNames: data.billingProofFileNames || [],
      ownershipProofUrls: data.ownershipProofUrls || [],
      ownershipProofFileNames: data.ownershipProofFileNames || [],
      signatureUrl: data.signatureUrl || "",
      signatureName: data.signatureName,
      signatureDate: data.signatureDate || new Date().toLocaleDateString("en-GB"),
    };

    await ref.set({
      secondLandlord: { ...second, signedAt: FieldValue.serverTimestamp() },
      secondLandlordStatus: "completed",
      secondLandlordCompletedAt: FieldValue.serverTimestamp(),
      secondLandlordToken: FieldValue.delete(),
      secondLandlordExpires: FieldValue.delete(),
    }, { merge: true });

    const ctx = {
      ref: id,
      firstName: doc.fullName || "",
      packageLabel: doc.selectedPackage || "",
      propertyAddress: propertyAddress(doc),
    };

    let pdf: string | undefined;
    try { pdf = secondLandlordPdfBase64({ ...ctx, second, signatureImage }); }
    catch (e) { console.error("second landlord PDF failed:", e); }
    const attachments: Attachment[] | undefined = pdf ? [{ filename: `joint-landlord-${id}.pdf`, content: pdf }] : undefined;

    const emailSecond = htmlEscapeDeep(second);

    await Promise.allSettled([
      sendEmail({
        to: second.email,
        subject: "✅ Your joint landlord details are received | House of Lettings",
        html: secondLandlordConfirmHtml({ secondName: emailSecond.fullName, firstName: escapeHtml(ctx.firstName), propertyAddress: escapeHtml(ctx.propertyAddress) }),
        attachments,
      }),
      sendEmail({
        to: process.env.ADMIN_EMAIL || "admin@houseoflettings.co.uk",
        subject: `👥 Joint landlord completed: ${second.fullName} (for ${ctx.firstName})`,
        html: secondLandlordOfficeHtml({
          secondName: emailSecond.fullName,
          firstName: escapeHtml(ctx.firstName),
          propertyAddress: escapeHtml(ctx.propertyAddress),
          packageLabel: escapeHtml(ctx.packageLabel),
          second: emailSecond,
        }),
        attachments,
      }),
      // Backup only, never throws.
      backupToDrive({
        formType: "landlord-registration",
        label: `${ctx.firstName} — joint landlord ${second.fullName}`,
        address: ctx.propertyAddress,
        files: [
          ...namedFiles(second.landlordIdUrls, "Joint Landlord ID"),
          ...namedFiles(second.billingProofUrls, "Joint Billing Proof"),
          ...namedFiles(second.ownershipProofUrls, "Joint Ownership Proof"),
          ...(pdf ? [{ base64: pdf, name: `Joint Landlord ${second.fullName}` }] : []),
        ],
      }),
    ]);

    return Response.json({ success: true }, { status: 200 });
  } catch (e) {
    console.error("landlord second POST error:", e);
    return Response.json({ message: "Internal server error. Please try again." }, { status: 500 });
  }
}
