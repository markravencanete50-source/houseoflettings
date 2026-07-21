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
    let docId = agreementId;

    // Keep the base64 signature out of Firestore (kept lean); the Cloudinary URL
    // is the durable record. The raw image is only needed to build the PDF.
    const { signatureImage, agreementId: _a, reissueToken: _t, ...toStore } = data;

    if (agreementId) {
      const ref = db.collection('landlordAgreements').doc(agreementId);
      const snap = await ref.get();
      const existing = snap.data();
      if (!snap.exists || !existing) return Response.json({ message: 'Agreement not found' }, { status: 404 });
      const valid = existing.reissueToken && existing.reissueToken === reissueToken
        && (!existing.reissueExpires || existing.reissueExpires > Date.now());
      if (!valid) return Response.json({ message: 'This signing link is invalid or has expired.' }, { status: 403 });
      await ref.update({
        ...toStore,
        status: 'signed',
        reissueToken: FieldValue.delete(),
        reissueExpires: FieldValue.delete(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    } else {
      const ref = await db.collection('landlordAgreements').add({
        ...toStore,
        status: 'signed',
        source: 'website-landlord-agreement',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      docId = ref.id;
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
