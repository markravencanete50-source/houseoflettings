// app/api/landlord-registration/forms/route.ts
// The two post-agreement forms each landlord signs (their own copy):
//   ?doc=authorised-rep — Authorised Property Management Representative Form
//   ?doc=bank-aml       — Landlord Bank Details & AML Verification Form
//   GET  — validate the party token; return property + that landlord's details
//          (auto-fill) and which forms they've already signed.
//   POST — save + build the signed PDF + email the landlord and the office.
// Bank details are stored MASKED (full details live only in the emailed PDF).
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { rateLimit } from '@/lib/rateLimit';
import { escapeHtml, sanitizeUploadUrlFieldsDeep } from '@/lib/security';
import { sendAgreementEmail } from '@/lib/agreementDocuments';
import {
  buildFormPdf, FORM_LABELS, type FormDoc,
  formConfirmHtml, formOfficeHtml,
  maskSortCode, accountLast4,
} from '@/lib/postSignForms';

function db() {
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

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@houseoflettings.co.uk';
const DOC_KEYS: Record<FormDoc, string> = { 'authorised-rep': 'authorisedRep', 'bank-aml': 'bankAml' };

function propertyAddress(d: any): string {
  const p = Array.isArray(d?.properties) && d.properties[0] ? d.properties[0] : d;
  return [p?.flatNumber, p?.street, p?.city, p?.postcode].filter(Boolean).join(', ') || (d?.address || '');
}

// Valid parties: the first landlord, the joint second landlord, or a company
// director co-signer whose id is "cs0", "cs1", … The regex also guards the
// Firestore field path used to store `postSignForms.${party}`.
const PARTY_RE = /^(first|second|cs\d+)$/;

// A company director's co-signer entry (they sign their own copy of the forms).
function coSignerByParty(d: any, party: string): any | null {
  if (party === 'first' || party === 'second' || !Array.isArray(d?.coSigners)) return null;
  return d.coSigners.find((c: any) => c?.id === party) || null;
}

function partyTokenValid(d: any, party: string, token: string): boolean {
  if (!token) return false;
  if (party === 'first' || party === 'second') {
    const tf = party === 'second' ? 'secondFormsToken' : 'firstFormsToken';
    const ef = party === 'second' ? 'secondFormsExpires' : 'firstFormsExpires';
    return d?.[tf] === token && (!d?.[ef] || d[ef] > Date.now());
  }
  // Company director: the forms token lives on their co-signer entry.
  const cs = coSignerByParty(d, party);
  return !!cs && cs.formsToken === token && (!cs.formsExpires || cs.formsExpires > Date.now());
}

// Resolve the signing landlord's own details + the other landlord's name.
function partyLandlord(d: any, party: string) {
  if (party === 'second') {
    const s = d.secondLandlord || {};
    return {
      landlordName: s.fullName || d.landlord2Name || '',
      landlordEmail: s.email || d.landlord2Email || '',
      landlordPhone: s.phone || d.landlord2Phone || '',
      landlordAddress: s.contactAddress || '',
      landlord2Name: d.fullName || '',
    };
  }
  const cs = coSignerByParty(d, party);
  if (cs) {
    // Company director co-signer: their own signed details; the "other" name is
    // the company (with the managing director as the fallback).
    return {
      landlordName: cs.fullName || cs.name || '',
      landlordEmail: cs.email || '',
      landlordPhone: cs.phone || '',
      landlordAddress: cs.contactAddress || '',
      landlord2Name: d.companyName || d.fullName || '',
    };
  }
  return {
    landlordName: d.fullName || '',
    landlordEmail: d.email || '',
    landlordPhone: d.phone || '',
    landlordAddress: d.contactAddress || '',
    landlord2Name: d.jointLandlord ? (d.landlord2Name || '') : '',
  };
}

export async function GET(request: Request) {
  const limited = rateLimit(request, 'landlord-forms-check', 40, 15 * 60 * 1000);
  if (limited) return limited;
  try {
    const url = new URL(request.url);
    const id = (url.searchParams.get('id') || '').trim();
    const token = (url.searchParams.get('token') || '').trim();
    const party = (url.searchParams.get('party') || '').trim();
    if (!id || !token || !PARTY_RE.test(party)) return Response.json({ valid: false }, { status: 200 });

    const snap = await db().collection('landlordAgreements').doc(id).get();
    const d = snap.data();
    if (!snap.exists || !d) return Response.json({ valid: false }, { status: 200 });
    if (!partyTokenValid(d, party, token)) return Response.json({ valid: false }, { status: 200 });

    const done = (d.postSignForms && d.postSignForms[party]) || {};
    return Response.json({
      valid: true,
      propertyAddress: propertyAddress(d),
      packageLabel: d.selectedPackage || '',
      ...partyLandlord(d, party),
      completed: { 'authorised-rep': !!done.authorisedRep, 'bank-aml': !!done.bankAml },
    }, { status: 200 });
  } catch (e) {
    console.error('landlord-forms GET error:', e);
    return Response.json({ valid: false }, { status: 200 });
  }
}

export async function POST(request: Request) {
  const limited = rateLimit(request, 'landlord-forms', 15, 15 * 60 * 1000);
  if (limited) return limited;
  try {
    const raw = await request.json();
    const id = (raw.id || '').toString().trim();
    const token = (raw.token || '').toString().trim();
    const party = (raw.party || '').toString().trim();
    const doc = (raw.doc || '').toString().trim() as FormDoc;
    if (!id || !token || !PARTY_RE.test(party)) return Response.json({ message: 'Missing link parameters.' }, { status: 400 });
    if (doc !== 'authorised-rep' && doc !== 'bank-aml') return Response.json({ message: 'Unknown form.' }, { status: 400 });

    const { signatureImage, ...restRaw } = raw;
    const data = sanitizeUploadUrlFieldsDeep(restRaw);

    const database = db();
    const ref = database.collection('landlordAgreements').doc(id);
    const snap = await ref.get();
    const dref = snap.data();
    if (!snap.exists || !dref) return Response.json({ message: 'Registration not found.' }, { status: 404 });
    if (!partyTokenValid(dref, party, token)) return Response.json({ message: 'This link is invalid or has expired.' }, { status: 403 });

    if (!data.termsAccepted) return Response.json({ message: 'The terms and conditions must be accepted.' }, { status: 400 });
    if (!data.signatureName?.toString().trim()) return Response.json({ message: 'A signature name is required.' }, { status: 400 });
    if (typeof signatureImage !== 'string' || !signatureImage.startsWith('data:image')) {
      return Response.json({ message: 'A signature is required.' }, { status: 400 });
    }
    if (signatureImage.length > 3_000_000) return Response.json({ message: 'Signature image is too large.' }, { status: 400 });

    const who = partyLandlord(dref, party);
    const ctx = { ref: id, propertyAddress: propertyAddress(dref), ...who };

    // Per-form field handling.
    let pdfData: any;
    let stored: any;
    let summary: string;
    if (doc === 'authorised-rep') {
      const hasRep = !!data.hasRepresentative;
      if (hasRep && (!data.repName?.trim() || !data.repEmail?.trim())) {
        return Response.json({ message: "Please give the representative's name and email, or choose 'I'll manage it myself'." }, { status: 400 });
      }
      pdfData = {
        hasRepresentative: hasRep, repName: data.repName || '', repEmail: data.repEmail || '', repPhone: data.repPhone || '',
        signatureName: data.signatureName, signatureDate: data.signatureDate || new Date().toLocaleDateString('en-GB'), signatureImage,
      };
      stored = {
        hasRepresentative: hasRep, repName: hasRep ? (data.repName || '') : '', repEmail: hasRep ? (data.repEmail || '') : '', repPhone: hasRep ? (data.repPhone || '') : '',
        signatureName: data.signatureName, signatureDate: pdfData.signatureDate, signatureUrl: data.signatureUrl || '', signedAt: FieldValue.serverTimestamp(),
      };
      summary = hasRep
        ? `Representative: <strong>${escapeHtml(data.repName)}</strong> (${escapeHtml(data.repEmail)}${data.repPhone ? `, ${escapeHtml(data.repPhone)}` : ''})`
        : 'No separate representative — landlord manages the property themselves.';
    } else {
      for (const f of ['accountHolder', 'bankName', 'sortCode', 'accountNumber']) {
        if (!data[f]?.toString().trim()) return Response.json({ message: `${f} is required` }, { status: 400 });
      }
      pdfData = {
        accountHolder: data.accountHolder, bankName: data.bankName, sortCode: data.sortCode, accountNumber: data.accountNumber,
        jointDeclaration: !!data.jointDeclaration,
        signatureName: data.signatureName, signatureDate: data.signatureDate || new Date().toLocaleDateString('en-GB'), signatureImage,
      };
      // MASKED persistence — full sort code / account number live only in the PDF.
      stored = {
        accountHolder: data.accountHolder, bankName: data.bankName,
        sortCodeMasked: maskSortCode(data.sortCode), accountLast4: accountLast4(data.accountNumber),
        jointDeclaration: !!data.jointDeclaration,
        signatureName: data.signatureName, signatureDate: pdfData.signatureDate, signatureUrl: data.signatureUrl || '', signedAt: FieldValue.serverTimestamp(),
      };
      summary = `Account holder: <strong>${escapeHtml(data.accountHolder)}</strong> · ${escapeHtml(data.bankName)} · sort ${escapeHtml(maskSortCode(data.sortCode))} · a/c ****${escapeHtml(accountLast4(data.accountNumber))}`;
    }

    await ref.update({ [`postSignForms.${party}.${DOC_KEYS[doc]}`]: stored, updatedAt: FieldValue.serverTimestamp() });

    let pdf: string | undefined;
    try { pdf = buildFormPdf(doc, ctx, pdfData); } catch (e) { console.error('form PDF failed:', e); }
    const attachments = pdf ? [{ filename: `${doc}-${id}.pdf`, content: pdf }] : undefined;
    const label = FORM_LABELS[doc];

    await Promise.allSettled([
      who.landlordEmail ? sendAgreementEmail({
        to: who.landlordEmail,
        subject: `✅ Your signed ${label} | House of Lettings`,
        html: formConfirmHtml({ name: who.landlordName, formLabel: label }),
        attachments,
      }) : Promise.resolve(),
      sendAgreementEmail({
        to: ADMIN_EMAIL,
        subject: `📄 ${label} signed: ${who.landlordName}`,
        html: formOfficeHtml({ landlordName: who.landlordName, formLabel: label, propertyAddress: ctx.propertyAddress, summary }),
        attachments,
      }),
    ]);

    return Response.json({ success: true }, { status: 200 });
  } catch (e) {
    console.error('landlord-forms POST error:', e);
    return Response.json({ message: 'Internal server error. Please try again.' }, { status: 500 });
  }
}
