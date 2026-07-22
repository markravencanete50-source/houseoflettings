// app/api/staff/landlords/route.ts
// Landlord portal accounts for the staff/admin dashboard: how many landlords
// have a login, and a row per landlord with their property/registration counts.
// Read-only, gated by the 'landlords' feature (admins always pass).
import { requireStaff, getAdminDb } from '@/lib/staffApiAuth';

const iso = (v: any) => v?.toDate?.()?.toISOString?.() || null;

export async function GET(request: Request) {
  try {
    const auth = await requireStaff(request, 'landlords');
    if (auth instanceof Response) return auth;

    const db = getAdminDb();
    const snap = await db.collection('users').where('role', '==', 'landlord').limit(500).get();

    const landlords = snap.docs.map(doc => {
      const d = doc.data() || {};
      const postcodes: string[] = Array.isArray(d.landlordPostcodes) ? d.landlordPostcodes : [];
      const agreementIds: string[] = Array.isArray(d.landlordAgreementIds) ? d.landlordAgreementIds : [];
      return {
        uid: doc.id,
        name: d.name || '',
        email: d.email || '',
        phone: d.phone || '',
        properties: postcodes.length,
        registrations: agreementIds.length,
        activated: d.mustResetPassword === false, // they've set their own password
        createdAt: iso(d.accountProvisionedAt) || iso(d.createdAt),
      };
    }).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

    return Response.json({
      landlords,
      count: landlords.length,
      totalProperties: landlords.reduce((s, l) => s + l.properties, 0),
      activatedCount: landlords.filter(l => l.activated).length,
    }, { status: 200 });
  } catch (e) {
    console.error('staff/landlords error:', e);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
