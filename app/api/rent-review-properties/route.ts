// app/api/rent-review-properties/route.ts
// Public list of managed properties for the rent-review form's picker. Reads the
// Firestore-managed catalogue with the Admin SDK (so no client rule is needed)
// and merges it over the code defaults, so the form always has the full list
// even before anything is added in the dashboard.
import { rateLimit } from '@/lib/rateLimit';
import { getAdminDb } from '@/lib/staffApiAuth';
import { mergeRentReviewProperties, defaultRentReviewProperties, type RentReviewProperty } from '@/lib/rentReviewProperties';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const limited = rateLimit(request, 'rent-review-properties', 120, 10 * 60 * 1000);
  if (limited) return limited;

  try {
    const snap = await getAdminDb().collection('rentReviewProperties').get();
    const firestore: RentReviewProperty[] = snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        address: data.address || '',
        postcode: data.postcode || '',
        currentRent: data.currentRent || '',
        proposedRent: data.proposedRent || '',
        effectiveDate: data.effectiveDate || '',
        active: data.active !== false,
      };
    });
    return Response.json({ properties: mergeRentReviewProperties(firestore) });
  } catch (e) {
    // Never leave the form without a list — fall back to the code defaults.
    console.error('rent-review-properties error:', e);
    return Response.json({ properties: defaultRentReviewProperties() });
  }
}
