// app/api/agreement-template/route.ts
// Public read of the admin-editable agreement wording overrides. The sign form
// and the admin editor both fetch this to render the current clause text. Only
// legal wording is returned; the defaults live in code (lib/agreementContent).
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { rateLimit } from '@/lib/rateLimit';
import { loadAgreementTemplate } from '@/lib/agreementTemplateStore';

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

export async function GET(request: Request) {
  const limited = rateLimit(request, 'agreement-template', 60, 10 * 60 * 1000);
  if (limited) return limited;
  try {
    const template = await loadAgreementTemplate(db());
    return Response.json({ template }, { status: 200 });
  } catch (e) {
    console.error('agreement-template GET error:', e);
    // Never block the sign form on this — fall back to the code defaults.
    return Response.json({ template: {} }, { status: 200 });
  }
}
