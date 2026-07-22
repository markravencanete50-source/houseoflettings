// app/api/landlord-registration/second/route.ts
// The joint (second) landlord flow, reached from the invite email
// (/landlord-registration/joint?id=&token=).
//   GET  — validate the token; return the property + service (auto-fill) and a
//          little context. Never returns the first landlord's documents/token.
//   POST { decline:true } — the second landlord declines: the registration is
//          voided and the first landlord + office are emailed.
//   POST (complete) — save the second landlord's details/documents/signature,
//          email them the signed agreement (same format as the first landlord)
//          plus the office, and provision their own portal login.
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { rateLimit } from "@/lib/rateLimit";
import { escapeHtml, htmlEscapeDeep, sanitizeUploadUrlFieldsDeep } from "@/lib/security";
import { backupToDrive, namedFiles } from "@/lib/googleDrive";
import { findBundle } from "@/lib/agreementContent";
import { loadAgreementTemplate } from "@/lib/agreementTemplateStore";
import { agreementPdfBase64, landlordEmailHtml, adminEmailHtml, sendAgreementEmail } from "@/lib/agreementDocuments";
import { secondLandlordDeclinedHtml, sendEmail } from "@/lib/secondLandlord";
import { provisionSecondLandlordLogin, postcodesFromAgreement } from "@/lib/landlordProvision";

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

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@houseoflettings.co.uk";

function propertyAddress(d: any): string {
  const p = Array.isArray(d?.properties) && d.properties[0] ? d.properties[0] : d;
  return [p?.flatNumber, p?.street, p?.city, p?.postcode].filter(Boolean).join(", ") || (d?.address || "");
}

// Valid when the token matches, hasn't expired, and the second landlord hasn't
// already completed or declined.
function tokenValid(d: any, token: string): boolean {
  return !!token && d?.secondLandlordToken === token
    && (!d?.secondLandlordExpires || d.secondLandlordExpires > Date.now())
    && d?.secondLandlordStatus === "pending";
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
    if (d.secondLandlordStatus === "declined") return Response.json({ valid: false, declined: true }, { status: 200 });
    if (!tokenValid(d, token)) return Response.json({ valid: false }, { status: 200 });

    const props = Array.isArray(d.properties) && d.properties.length ? d.properties : [{
      postcode: d.postcode, street: d.street, city: d.city, county: d.county, flatNumber: d.flatNumber,
      propertyType: d.propertyType, bedrooms: d.bedrooms, bathrooms: d.bathrooms, furnishing: d.furnishing,
      parking: d.parking, currentRent: d.currentRent, availableFrom: d.availableFrom,
    }];

    return Response.json({
      valid: true,
      firstName: d.fullName || "",
      packageLabel: d.selectedPackage || "",
      packageId: d.selectedPackageId || "",
      propertyAddress: propertyAddress(d),
      properties: props,
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
  const limited = rateLimit(request, "landlord-second", 12, 15 * 60 * 1000);
  if (limited) return limited;
  try {
    const raw = await request.json();
    const id = (raw.id || "").toString().trim();
    const token = (raw.token || "").toString().trim();
    if (!id || !token) return Response.json({ message: "Missing link parameters." }, { status: 400 });

    const database = db();
    const ref = database.collection("landlordAgreements").doc(id);
    const snap = await ref.get();
    const doc = snap.data();
    if (!snap.exists || !doc) return Response.json({ message: "Registration not found." }, { status: 404 });
    if (doc.secondLandlordStatus === "completed") return Response.json({ message: "This has already been completed." }, { status: 409 });
    if (doc.secondLandlordStatus === "declined") return Response.json({ message: "This registration was declined." }, { status: 409 });
    if (!tokenValid(doc, token)) {
      return Response.json({ message: "This link is invalid or has expired. Please ask the primary landlord to re-send it." }, { status: 403 });
    }

    const ctx = {
      firstName: doc.fullName || "",
      packageLabel: doc.selectedPackage || "",
      propertyAddress: propertyAddress(doc),
    };

    // ── Decline: void the registration, notify the first landlord + office ──
    if (raw.decline === true) {
      await ref.set({
        secondLandlordStatus: "declined",
        secondLandlordDeclinedAt: FieldValue.serverTimestamp(),
        status: "void",
        voidReason: "second-landlord-declined",
        secondLandlordToken: FieldValue.delete(),
        secondLandlordExpires: FieldValue.delete(),
      }, { merge: true });

      const secondName = escapeHtml(doc.landlord2Name || "the joint landlord");
      const first = escapeHtml(ctx.firstName);
      const addr = escapeHtml(ctx.propertyAddress);
      const pkg = escapeHtml(ctx.packageLabel);
      await Promise.allSettled([
        ...(doc.email ? [sendEmail({
          to: doc.email,
          subject: "⚠️ Your joint landlord declined — registration voided | House of Lettings",
          html: secondLandlordDeclinedHtml({ firstName: first, secondName, propertyAddress: addr, packageLabel: pkg }),
        })] : []),
        sendEmail({
          to: ADMIN_EMAIL,
          subject: `⚠️ Joint landlord declined: ${doc.landlord2Name || "second landlord"} (${ctx.firstName})`,
          html: secondLandlordDeclinedHtml({ firstName: first, secondName, propertyAddress: addr, packageLabel: pkg, toOffice: true }),
        }),
      ]);
      return Response.json({ success: true, declined: true }, { status: 200 });
    }

    // ── Accept + complete ──
    const { signatureImage, id: _i, token: _t, ...restRaw } = raw;
    const data = sanitizeUploadUrlFieldsDeep(restRaw);

    const requiredFields = ["fullName", "email", "phone", "contactAddress", "residency", "signatureName"];
    for (const f of requiredFields) {
      if (!data[f]?.toString().trim()) return Response.json({ message: `${f} is required` }, { status: 400 });
    }
    if (!data.termsAccepted) return Response.json({ message: "Please accept the agreement terms." }, { status: 400 });
    const need: [string, string][] = [
      ["landlordIdUrls", "ID (front and back)"],
      ["billingProofUrls", "billing address document"],
      ["ownershipProofUrls", "proof of ownership"],
    ];
    for (const [key, label] of need) {
      if (!Array.isArray(data[key]) || data[key].length === 0) return Response.json({ message: `Please upload your ${label}` }, { status: 400 });
    }
    if (typeof signatureImage === "string" && signatureImage.length > 3_000_000) {
      return Response.json({ message: "Signature image is too large." }, { status: 400 });
    }

    const second = {
      fullName: data.fullName, email: data.email, phone: data.phone,
      contactAddress: data.contactAddress, residency: data.residency,
      landlordIdUrls: data.landlordIdUrls || [], landlordIdFileNames: data.landlordIdFileNames || [],
      billingProofUrls: data.billingProofUrls || [], billingProofFileNames: data.billingProofFileNames || [],
      ownershipProofUrls: data.ownershipProofUrls || [], ownershipProofFileNames: data.ownershipProofFileNames || [],
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

    // Build the SAME agreement document the first landlord received, but signed
    // by the second landlord. Parties list both; the signature block is theirs.
    const bundle = findBundle(doc.selectedPackageId) || findBundle(doc.selectedPackage);
    let pdf: string | undefined;
    let emailData: any = null;
    if (bundle) {
      const agreementData = {
        ...doc,
        fullName: second.fullName,
        email: second.email,
        phone: second.phone,
        contactAddress: second.contactAddress,
        residency: second.residency,
        jointLandlord: true,
        landlord2Name: doc.fullName || "",
        signatureName: second.signatureName,
        signatureUrl: second.signatureUrl,
        signatureDate: second.signatureDate,
        signatureImage,
      };
      try {
        const template = await loadAgreementTemplate(database);
        pdf = agreementPdfBase64(agreementData, bundle, id, template);
      } catch (e) { console.error("second landlord agreement PDF failed:", e); }
      const { signatureImage: _s, ...forEmail } = agreementData;
      emailData = htmlEscapeDeep(forEmail);
    }
    const attachments = pdf ? [{ filename: `management-agreement-${id}.pdf`, content: pdf }] : undefined;

    await Promise.allSettled([
      bundle && emailData ? sendAgreementEmail({
        to: second.email,
        subject: `🖊️ Your signed ${bundle.label} agreement | House of Lettings`,
        html: landlordEmailHtml(emailData, bundle),
        attachments,
      }) : Promise.resolve(),
      bundle && emailData ? sendAgreementEmail({
        to: ADMIN_EMAIL,
        subject: `📄 Joint landlord signed: ${second.fullName} (${bundle.label})`,
        html: adminEmailHtml(emailData, bundle),
        attachments,
      }) : Promise.resolve(),
      // Give the second landlord their own portal login (links via secondLandlordUid).
      provisionSecondLandlordLogin(database, id, {
        email: second.email, name: second.fullName, phone: second.phone, postcodes: postcodesFromAgreement(doc),
      }),
      backupToDrive({
        formType: "landlord-registration",
        label: `${ctx.firstName} — joint landlord ${second.fullName}`,
        address: ctx.propertyAddress,
        files: [
          ...namedFiles(second.landlordIdUrls, "Joint Landlord ID"),
          ...namedFiles(second.billingProofUrls, "Joint Billing Proof"),
          ...namedFiles(second.ownershipProofUrls, "Joint Ownership Proof"),
          ...(pdf ? [{ base64: pdf, name: `Joint Landlord Agreement ${second.fullName}` }] : []),
        ],
      }),
    ]);

    return Response.json({ success: true }, { status: 200 });
  } catch (e) {
    console.error("landlord second POST error:", e);
    return Response.json({ message: "Internal server error. Please try again." }, { status: 500 });
  }
}
