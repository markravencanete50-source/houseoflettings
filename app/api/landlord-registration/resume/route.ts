// app/api/landlord-registration/resume/route.ts
// Public, token-guarded read used by the registration form when a landlord
// returns via a re-issue link (?id=&token=). Returns just the fields needed to
// pre-fill the form so they can review the corrected agreement and re-sign.
// No signature or token is ever returned.
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { rateLimit } from '@/lib/rateLimit';

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

// The form fields we hand back for pre-fill (never signature / token / status).
const RESUME_FIELDS = [
  'ownerType', 'companyName', 'companyNumber', 'registeredAddress', 'contactRole', 'companyPeople',
  'fullName', 'email', 'phone', 'contactAddress', 'propertyCount', 'notes',
  'jointLandlord', 'landlord2Name', 'landlord2Email', 'residency',
  'postcode', 'street', 'city', 'county', 'flatNumber',
  'propertyType', 'bedrooms', 'bathrooms', 'receptions',
  'furnishing', 'parking', 'availableFrom', 'currentRent', 'securityNote',
  'properties', 'selectedPackageId', 'selectedPackage',
] as const;

export async function GET(request: Request) {
  const limited = rateLimit(request, 'landlord-registration-resume', 30, 10 * 60 * 1000);
  if (limited) return limited;
  try {
    const url = new URL(request.url);
    const id = (url.searchParams.get('id') || '').trim();
    const token = (url.searchParams.get('token') || '').trim();
    if (!id || !token) return Response.json({ message: 'Missing link parameters.' }, { status: 400 });

    const snap = await db().collection('landlordAgreements').doc(id).get();
    const data = snap.data();
    if (!snap.exists || !data) return Response.json({ message: 'Registration not found.' }, { status: 404 });

    const valid = data.reissueToken && data.reissueToken === token
      && (!data.reissueExpires || data.reissueExpires > Date.now());
    if (!valid) return Response.json({ message: 'This signing link is invalid or has expired.' }, { status: 403 });

    const fields: Record<string, unknown> = {};
    for (const k of RESUME_FIELDS) if (data[k] !== undefined) fields[k] = data[k];

    return Response.json({ id, fields }, { status: 200 });
  } catch (e) {
    console.error('landlord-registration resume error:', e);
    return Response.json({ message: 'Internal server error.' }, { status: 500 });
  }
}
