// app/api/staff/landlords/route.ts
// Landlord portal accounts for the staff/admin dashboard: how many landlords
// have a login, and a row per landlord with their property/registration counts.
// GET is read-only (gated by the 'landlords' feature). DELETE removes a landlord
// and everything of theirs, and is ADMIN-ONLY (Kasra / Mark).
import { getAuth } from 'firebase-admin/auth';
import { requireStaff, getAdminDb } from '@/lib/staffApiAuth';
import { logAction } from '@/lib/activityLog';

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

// Delete a landlord and everything of theirs. ADMIN-ONLY. Removes: the Firebase
// Auth login, the users doc, their registrations (landlordAgreements they own),
// their property listings, and any login-lockout record. Registrations where
// they are only the SECOND landlord are left intact (they belong to someone else).
export async function DELETE(request: Request) {
  try {
    const auth = await requireStaff(request, 'landlords');
    if (auth instanceof Response) return auth;
    if (auth.role !== 'admin') {
      return Response.json({ message: 'Only an administrator can delete a landlord.' }, { status: 403 });
    }

    const uid = new URL(request.url).searchParams.get('uid')?.trim();
    if (!uid) return Response.json({ message: 'A landlord id is required.' }, { status: 400 });

    const db = getAdminDb();
    const userRef = db.collection('users').doc(uid);
    const userSnap = await userRef.get();
    const user = userSnap.data();
    if (!userSnap.exists || !user) return Response.json({ message: 'Landlord not found.' }, { status: 404 });
    // Safety: this endpoint only ever deletes landlord accounts, never staff/admin.
    if (user.role !== 'landlord') {
      return Response.json({ message: 'This account is not a landlord and cannot be deleted here.' }, { status: 400 });
    }
    const email = String(user.email || '').trim().toLowerCase();

    const deleted = { agreements: 0, properties: 0 };

    // Registrations this landlord owns (by uid, plus legacy email match).
    const agreementRefs = new Map<string, any>();
    const [byUid, byEmail] = await Promise.all([
      db.collection('landlordAgreements').where('landlordUid', '==', uid).get(),
      email ? db.collection('landlordAgreements').where('email', '==', email).get() : Promise.resolve({ docs: [] as any[] }),
    ]);
    for (const d of [...byUid.docs, ...(byEmail.docs as any[])]) agreementRefs.set(d.id, d.ref);

    // Their property listings.
    const props = await db.collection('properties').where('landlordId', '==', uid).get();

    // Batch all the Firestore deletes (well under the 500-op limit for one landlord).
    const batch = db.batch();
    agreementRefs.forEach(ref => { batch.delete(ref); deleted.agreements++; });
    props.docs.forEach(d => { batch.delete(d.ref); deleted.properties++; });
    if (email) batch.delete(db.collection('landlordLoginLockouts').doc(email));
    batch.delete(userRef);
    await batch.commit();

    // Remove the Firebase Auth login last (non-fatal if it was already gone).
    try { await getAuth().deleteUser(uid); } catch (e: any) {
      if (e?.code !== 'auth/user-not-found') console.error('deleteUser failed:', e);
    }

    await logAction(auth, 'DELETE', '/api/staff/landlords', { id: uid });
    return Response.json({ ok: true, deleted }, { status: 200 });
  } catch (e) {
    console.error('staff/landlords DELETE error:', e);
    return Response.json({ message: 'Could not delete the landlord. Please try again.' }, { status: 500 });
  }
}
