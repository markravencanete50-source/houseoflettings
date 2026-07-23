// app/api/landlord/agreement-pdf/route.ts
// Serves the landlord their signed Residential Lettings & Management Agreement
// as a PDF, regenerated on demand from the stored agreement record (the same
// builder the registration flow uses). Cookie/Bearer authenticated and scoped:
// the agreement must belong to the caller. Used by the "View agreement" link on
// the property Compliance tab.
import { requireLandlord } from '@/lib/landlordAuth';
import { getAdminDb } from '@/lib/staffApiAuth';
import { agreementPdfBase64 } from '@/lib/agreementDocuments';
import { findBundle } from '@/lib/agreementContent';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const auth = await requireLandlord(request);
  if (auth instanceof Response) return auth;
  const agreementId = new URL(request.url).searchParams.get('agreementId') || '';
  if (!agreementId) return Response.json({ message: 'Missing agreement.' }, { status: 400 });
  try {
    const snap = await getAdminDb().collection('landlordAgreements').doc(agreementId).get();
    if (!snap.exists) return Response.json({ message: 'Agreement not found.' }, { status: 404 });
    const data = snap.data() || {};

    // Scope: the agreement must belong to this landlord.
    const owns =
      auth.agreementIds.includes(agreementId) ||
      data.landlordUid === auth.uid ||
      data.secondLandlordUid === auth.uid ||
      (data.email && auth.email && String(data.email).toLowerCase() === auth.email.toLowerCase());
    if (!owns) return Response.json({ message: 'Not authorised.' }, { status: 403 });

    const bundle = findBundle(data.selectedPackageId || data.selectedPackage || '');
    if (!bundle) return Response.json({ message: 'Agreement package not found.' }, { status: 500 });

    const base64 = agreementPdfBase64(data, bundle, agreementId, null);
    const bytes = new Uint8Array(Buffer.from(base64, 'base64'));
    return new Response(bytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="management-agreement.pdf"',
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (e) {
    console.error('agreement-pdf error:', e);
    return Response.json({ message: 'Could not generate the agreement.' }, { status: 500 });
  }
}
