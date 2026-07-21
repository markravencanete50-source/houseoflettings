// app/api/landlord-agreement/route.ts
// Receives a signed Residential Lettings & Management Agreement and either
// creates a new record or, when a valid re-issue token is supplied, re-signs an
// existing one. Builds a signed PDF (with the signature embedded), emails a
// confirmation to the landlord and a notification to the office (both with the
// PDF attached), and backs the whole thing up to Drive.
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { rateLimit } from '@/lib/rateLimit';
import { htmlEscapeDeep, sanitizeUploadUrlFieldsDeep } from '@/lib/security';
import { backupToDrive, type BackupFile } from '@/lib/googleDrive';
import { findBundle } from '@/lib/agreementContent';
import { issueAgreementDocuments, propertyLine } from '@/lib/agreementDocuments';
import { loadAgreementTemplate } from '@/lib/agreementTemplateStore';

function getFirestoreClient() {
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  }
  return getFirestore();
}

function driveBackupFiles(data: any, pdfBase64?: string): BackupFile[] {
  const files: BackupFile[] = [];
  if (data.signatureUrl) files.push({ url: data.signatureUrl, name: 'Landlord Signature' });
  if (data.signature2Url) files.push({ url: data.signature2Url, name: 'Second Landlord Signature' });
  if (pdfBase64) files.push({ base64: pdfBase64, name: 'Signed Agreement' });
  return files;
}

export async function POST(request: Request) {
  const limited = rateLimit(request, 'landlord-agreement', 10, 10 * 60 * 1000);
  if (limited) return limited;
  try {
    const data = sanitizeUploadUrlFieldsDeep(await request.json());

    const required = ['fullName', 'email', 'phone', 'selectedPackage', 'signatureName'];
    for (const field of required) {
      if (!data[field]?.toString().trim()) {
        return Response.json({ message: `${field} is required` }, { status: 400 });
      }
    }
    if (!data.termsAccepted) return Response.json({ message: 'The terms must be accepted' }, { status: 400 });
    if (typeof data.signatureImage !== 'string' || !data.signatureImage.startsWith('data:image')) {
      return Response.json({ message: 'A signature is required' }, { status: 400 });
    }

    const bundle = findBundle(data.selectedPackageId) || findBundle(data.selectedPackage);
    if (!bundle) return Response.json({ message: 'A valid service package is required' }, { status: 400 });

    const db = getFirestoreClient();

    // Re-sign path: a landlord returning via a re-issue link. Validate the token
    // against the existing record before updating it in place.
    const agreementId = (data.agreementId || '').toString().trim();
    const reissueToken = (data.reissueToken || '').toString().trim();

    // Keep the base64 signature out of Firestore (kept lean); the Cloudinary URL
    // is the durable record. The raw image is only needed to build the PDF.
    // Coupon fields are stripped and re-added from the coupon document — the
    // client-claimed discount is never trusted.
    const { signatureImage, signature2Image, agreementId: _a, reissueToken: _t, couponCode: _c, couponDiscount: _d, ...toStore } = data;

    const couponCode = (data.couponCode || '').toString().trim().toUpperCase();
    const agreementRef = agreementId
      ? db.collection('landlordAgreements').doc(agreementId)
      : db.collection('landlordAgreements').doc();
    const docId = agreementRef.id;

    // One transaction covers the re-issue token check, the coupon redemption
    // and the agreement write, so a coupon can only ever be redeemed once and
    // never without the agreement actually being recorded.
    let clientError: { message: string; status: number } | null = null;
    let redeemedDiscount = 0;
    await db.runTransaction(async tx => {
      // ── All reads first (Firestore transaction rule) ──
      const couponRef = couponCode ? db.collection('agreementCoupons').doc(couponCode) : null;
      const cSnap = couponRef ? await tx.get(couponRef) : null;
      const aSnap = agreementId ? await tx.get(agreementRef) : null;

      let couponFields: Record<string, unknown> = {};
      if (couponRef && cSnap) {
        const c = cSnap.data();
        if (!cSnap.exists || !c) { clientError = { message: 'That coupon code was not found.', status: 400 }; return; }
        if (c.status !== 'active') { clientError = { message: 'This coupon has already been used or is no longer active.', status: 400 }; return; }
        if (c.bundleId !== bundle.id) { clientError = { message: `This coupon is for the ${c.bundleLabel} package.`, status: 400 }; return; }
        couponFields = { couponCode, couponDiscount: c.discount };
        redeemedDiscount = c.discount;
      }
      if (agreementId) {
        const existing = aSnap?.data();
        if (!aSnap?.exists || !existing) { clientError = { message: 'Agreement not found', status: 404 }; return; }
        const valid = existing.reissueToken && existing.reissueToken === reissueToken
          && (!existing.reissueExpires || existing.reissueExpires > Date.now());
        if (!valid) { clientError = { message: 'This signing link is invalid or has expired.', status: 403 }; return; }
      }

      // ── Writes ──
      if (couponRef) {
        tx.update(couponRef, {
          status: 'used',
          usedAt: FieldValue.serverTimestamp(),
          usedBy: { name: data.fullName, email: data.email },
          agreementId: docId,
        });
      }
      if (agreementId) {
        tx.update(agreementRef, {
          ...toStore,
          ...couponFields,
          status: 'signed',
          reissueToken: FieldValue.delete(),
          reissueExpires: FieldValue.delete(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      } else {
        tx.set(agreementRef, {
          ...toStore,
          ...couponFields,
          status: 'signed',
          source: 'website-landlord-agreement',
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

    const template = await loadAgreementTemplate(db);
    const emailData = htmlEscapeDeep(data);
    const { pdfBase64 } = await issueAgreementDocuments({ data, bundle, ref: docId, template, emailData });

    // Backup only, never throws: a Drive outage must not lose an agreement.
    await backupToDrive({
      formType: 'landlord-agreement',
      label: data.fullName,
      address: propertyLine(data),
      files: driveBackupFiles(data, pdfBase64),
    }).catch(() => { /* ignore */ });

    return Response.json({ success: true, id: docId }, { status: 201 });
  } catch (error) {
    console.error('landlord-agreement error:', error);
    return Response.json({ message: 'Internal server error. Please try again.' }, { status: 500 });
  }
}
