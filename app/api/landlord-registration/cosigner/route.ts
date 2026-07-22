// app/api/landlord-registration/cosigner/route.ts
// A company co-signer (a director/officer other than the managing director)
// reviews and signs the agreement from their emailed link
// (/landlord-registration/joint?...&kind=director). Same journey as the joint
// landlord, but the signer lives in the `coSigners` array on the registration.
//   GET  — validate the token; return company/property/service + prefill.
//   POST { decline:true } — void the registration, notify the managing director.
//   POST (complete) — save their details/documents/signature to their coSigner
//          entry, email them the signed agreement + the office.
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { rateLimit } from "@/lib/rateLimit";
import { escapeHtml, htmlEscapeDeep, sanitizeUploadUrlFieldsDeep } from "@/lib/security";
import { backupToDrive, namedFiles } from "@/lib/googleDrive";
import { findBundle } from "@/lib/agreementContent";
import { loadAgreementTemplate } from "@/lib/agreementTemplateStore";
import { agreementPdfBase64, landlordEmailHtml, adminEmailHtml, sendAgreementEmail } from "@/lib/agreementDocuments";
import { coSignerDeclinedHtml } from "@/lib/companyCoSigners";
import { generateFormsToken, formsLink, POST_SIGN_FORMS_TTL_MS } from "@/lib/postSignForms";

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

// Find a pending, unexpired co-signer by token. Returns { index, signer } or null.
function findCoSigner(d: any, token: string): { index: number; signer: any } | null {
  if (!token || !Array.isArray(d?.coSigners)) return null;
  if (d.coSignersExpires && d.coSignersExpires < Date.now()) return null;
  const index = d.coSigners.findIndex((c: any) => c?.token === token);
  if (index < 0) return null;
  return { index, signer: d.coSigners[index] };
}

export async function GET(request: Request) {
  const limited = rateLimit(request, "landlord-cosigner-check", 40, 15 * 60 * 1000);
  if (limited) return limited;
  try {
    const url = new URL(request.url);
    const id = (url.searchParams.get("id") || "").trim();
    const token = (url.searchParams.get("token") || "").trim();
    if (!id || !token) return Response.json({ valid: false }, { status: 200 });

    const snap = await db().collection("landlordAgreements").doc(id).get();
    const d = snap.data();
    if (!snap.exists || !d) return Response.json({ valid: false }, { status: 200 });
    const found = findCoSigner(d, token);
    if (!found) return Response.json({ valid: false }, { status: 200 });
    if (found.signer.status === "completed") return Response.json({ valid: false, completed: true }, { status: 200 });
    if (found.signer.status === "declined") return Response.json({ valid: false, declined: true }, { status: 200 });

    const props = Array.isArray(d.properties) && d.properties.length ? d.properties : [{
      postcode: d.postcode, street: d.street, city: d.city, county: d.county, flatNumber: d.flatNumber,
      propertyType: d.propertyType, bedrooms: d.bedrooms, bathrooms: d.bathrooms, furnishing: d.furnishing, currentRent: d.currentRent,
    }];

    return Response.json({
      valid: true,
      signerKind: "director",
      companyName: d.companyName || "",
      firstName: d.fullName || "the managing director", // inviter context (managing director)
      packageLabel: d.selectedPackage || "",
      packageId: d.selectedPackageId || "",
      propertyAddress: propertyAddress(d),
      properties: props,
      // Prefill (reuses the joint page's landlord2* fields).
      landlord2Name: found.signer.name || "",
      landlord2Email: found.signer.email || "",
      landlord2Phone: "",
    }, { status: 200 });
  } catch (e) {
    console.error("landlord cosigner GET error:", e);
    return Response.json({ valid: false }, { status: 200 });
  }
}

export async function POST(request: Request) {
  const limited = rateLimit(request, "landlord-cosigner", 12, 15 * 60 * 1000);
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
    const found = findCoSigner(doc, token);
    if (!found) return Response.json({ message: "This link is invalid or has expired." }, { status: 403 });
    if (found.signer.status === "completed") return Response.json({ message: "This has already been completed." }, { status: 409 });
    if (found.signer.status === "declined") return Response.json({ message: "This registration was declined." }, { status: 409 });

    const ctx = { companyName: doc.companyName || "", managingDirector: doc.fullName || "", packageLabel: doc.selectedPackage || "", propertyAddress: propertyAddress(doc) };

    // Helper to write one co-signer element back inside a transaction.
    const updateSigner = (patch: Record<string, any>) => database.runTransaction(async tx => {
      const s = await tx.get(ref);
      const arr = (s.data()?.coSigners || []).slice();
      const idx = arr.findIndex((c: any) => c?.token === token);
      if (idx < 0) return;
      arr[idx] = { ...arr[idx], ...patch };
      tx.update(ref, { coSigners: arr, updatedAt: FieldValue.serverTimestamp() });
    });

    // ── Decline: void the registration, notify the managing director + office ──
    if (raw.decline === true) {
      await updateSigner({ status: "declined", declinedAt: Date.now() });
      await ref.set({ status: "void", voidReason: "director-declined" }, { merge: true });
      const signerName = escapeHtml(found.signer.name || "a director");
      const company = escapeHtml(ctx.companyName);
      const md = escapeHtml(ctx.managingDirector);
      const addr = escapeHtml(ctx.propertyAddress);
      const pkg = escapeHtml(ctx.packageLabel);
      await Promise.allSettled([
        ...(doc.email ? [sendAgreementEmail({
          to: doc.email,
          subject: "⚠️ A director declined — registration voided | House of Lettings",
          html: coSignerDeclinedHtml({ toDirector: md, signerName, companyName: company, packageLabel: pkg, propertyAddress: addr }),
        })] : []),
        sendAgreementEmail({
          to: ADMIN_EMAIL,
          subject: `⚠️ Director declined: ${found.signer.name || "director"} (${ctx.companyName})`,
          html: coSignerDeclinedHtml({ toDirector: md, signerName, companyName: company, packageLabel: pkg, propertyAddress: addr, toOffice: true }),
        }),
      ]);
      return Response.json({ success: true, declined: true }, { status: 200 });
    }

    // ── Accept + complete ──
    const { signatureImage, ...restRaw } = raw;
    const data = sanitizeUploadUrlFieldsDeep(restRaw);

    for (const f of ["fullName", "email", "phone", "contactAddress", "residency", "signatureName"]) {
      if (!data[f]?.toString().trim()) return Response.json({ message: `${f} is required` }, { status: 400 });
    }
    if (!data.termsAccepted) return Response.json({ message: "Please accept the agreement terms." }, { status: 400 });
    for (const [key, label] of [["landlordIdUrls", "ID (front and back)"], ["billingProofUrls", "billing address document"], ["ownershipProofUrls", "proof of ownership"]] as [string, string][]) {
      if (!Array.isArray(data[key]) || data[key].length === 0) return Response.json({ message: `Please upload your ${label}` }, { status: 400 });
    }
    if (typeof signatureImage === "string" && signatureImage.length > 3_000_000) {
      return Response.json({ message: "Signature image is too large." }, { status: 400 });
    }

    const signed = {
      fullName: data.fullName, email: data.email, phone: data.phone,
      contactAddress: data.contactAddress, residency: data.residency,
      landlordIdUrls: data.landlordIdUrls || [], landlordIdFileNames: data.landlordIdFileNames || [],
      billingProofUrls: data.billingProofUrls || [], billingProofFileNames: data.billingProofFileNames || [],
      ownershipProofUrls: data.ownershipProofUrls || [], ownershipProofFileNames: data.ownershipProofFileNames || [],
      signatureUrl: data.signatureUrl || "",
      signatureName: data.signatureName,
      signatureDate: data.signatureDate || new Date().toLocaleDateString("en-GB"),
    };
    // Mint this director's own post-agreement forms token so they get the SAME
    // two follow-up forms (Authorised Rep + Bank/AML) as the primary and joint
    // landlords. Stored on their co-signer entry; the forms route looks it up by
    // the co-signer id used as the link's `party`.
    const formsToken = generateFormsToken();
    await updateSigner({
      ...signed, status: "completed", signedAt: Date.now(),
      formsToken, formsExpires: Date.now() + POST_SIGN_FORMS_TTL_MS,
    });
    const directorFormLinks = {
      rep: formsLink(id, formsToken, found.signer.id, "authorised-rep"),
      bank: formsLink(id, formsToken, found.signer.id, "bank-aml"),
    };

    // Agreement PDF signed by this director (parties list the company + MD).
    const bundle = findBundle(doc.selectedPackageId) || findBundle(doc.selectedPackage);
    let pdf: string | undefined;
    let emailData: any = null;
    if (bundle) {
      const agreementData = {
        ...doc,
        fullName: signed.fullName, email: signed.email, phone: signed.phone,
        contactAddress: signed.contactAddress, residency: signed.residency,
        jointLandlord: true, landlord2Name: doc.fullName || ctx.companyName || "",
        signatureName: signed.signatureName, signatureUrl: signed.signatureUrl, signatureDate: signed.signatureDate,
        signatureImage,
      };
      try {
        const template = await loadAgreementTemplate(database);
        pdf = agreementPdfBase64(agreementData, bundle, id, template);
      } catch (e) { console.error("cosigner agreement PDF failed:", e); }
      const { signatureImage: _s, ...forEmail } = agreementData;
      emailData = htmlEscapeDeep(forEmail);
    }
    const attachments = pdf ? [{ filename: `management-agreement-${id}.pdf`, content: pdf }] : undefined;

    await Promise.allSettled([
      bundle && emailData ? sendAgreementEmail({
        to: signed.email,
        subject: `🖊️ Your signed ${bundle.label} agreement | House of Lettings`,
        html: landlordEmailHtml(emailData, bundle, { formLinks: directorFormLinks }),
        attachments,
      }) : Promise.resolve(),
      bundle && emailData ? sendAgreementEmail({
        to: ADMIN_EMAIL,
        subject: `📄 Director signed: ${signed.fullName} (${ctx.companyName || bundle.label})`,
        html: adminEmailHtml(emailData, bundle),
        attachments,
      }) : Promise.resolve(),
      backupToDrive({
        formType: "landlord-registration",
        label: `${ctx.companyName || ctx.managingDirector} — director ${signed.fullName}`,
        address: ctx.propertyAddress,
        files: [
          ...namedFiles(signed.landlordIdUrls, "Director ID"),
          ...namedFiles(signed.billingProofUrls, "Director Billing Proof"),
          ...namedFiles(signed.ownershipProofUrls, "Director Ownership Proof"),
          ...(pdf ? [{ base64: pdf, name: `Director Agreement ${signed.fullName}` }] : []),
        ],
      }),
    ]);

    return Response.json({ success: true }, { status: 200 });
  } catch (e) {
    console.error("landlord cosigner POST error:", e);
    return Response.json({ message: "Internal server error. Please try again." }, { status: 500 });
  }
}
