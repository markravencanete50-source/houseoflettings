// app/api/staff/demo/route.ts
// Demo/test harness (admin-only). Seeds a real landlord account with sample data
// across every feature — properties (+ tenancy details), applications (with
// stages), maintenance (billed), and account/ledger entries — so the whole
// landlord portal can be exercised end to end. Everything is tagged { demo:true }
// so it can be cleared and re-run. Targets a landlord by email (default: the
// owner's own account).
//   GET    → counts of current demo data + resolved landlord
//   POST { action:'seed', email? }  → create the demo data
//   POST { action:'clear' }         → delete all demo-tagged docs
import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue } from 'firebase-admin/firestore';
import { requireStaff, getAdminDb } from '@/lib/staffApiAuth';
import { logAction } from '@/lib/activityLog';

export const dynamic = 'force-dynamic';

const DEMO_COLLECTIONS = ['properties', 'tenantApplications', 'maintenanceRequests', 'ledgerEntries'];
const DEFAULT_DEMO_EMAIL = 'markravencanete50@gmail.com';

async function countDemo(db: ReturnType<typeof getAdminDb>) {
  const out: Record<string, number> = {};
  for (const c of DEMO_COLLECTIONS) {
    const s = await db.collection(c).where('demo', '==', true).count().get().catch(() => null);
    out[c] = s ? s.data().count : (await db.collection(c).where('demo', '==', true).get()).size;
  }
  return out;
}

export async function GET(request: Request) {
  const auth = await requireStaff(request, 'properties');
  if (auth instanceof Response) return auth;
  if (auth.role !== 'admin') return NextResponse.json({ message: 'Admin only.' }, { status: 403 });
  return NextResponse.json({ counts: await countDemo(getAdminDb()), defaultEmail: DEFAULT_DEMO_EMAIL }, { status: 200 });
}

export async function POST(request: Request) {
  const auth = await requireStaff(request, 'properties');
  if (auth instanceof Response) return auth;
  if (auth.role !== 'admin') return NextResponse.json({ message: 'Admin only.' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const action = String(body.action || '');
  const db = getAdminDb();

  // ── Clear ──
  if (action === 'clear') {
    let deleted = 0;
    for (const c of DEMO_COLLECTIONS) {
      const snap = await db.collection(c).where('demo', '==', true).get();
      let batch = db.batch(); let ops = 0;
      for (const d of snap.docs) { batch.delete(d.ref); deleted++; if (++ops >= 400) { await batch.commit(); batch = db.batch(); ops = 0; } }
      if (ops) await batch.commit();
    }
    await logAction(auth, 'POST', '/api/staff/demo', { action: 'clear', deleted });
    return NextResponse.json({ ok: true, deleted }, { status: 200 });
  }

  // ── Seed ──
  if (action === 'seed') {
    const email = String(body.email || DEFAULT_DEMO_EMAIL).trim().toLowerCase();
    let uid = '', name = 'Demo Landlord';
    try {
      const u = await getAuth().getUserByEmail(email);
      uid = u.uid; name = u.displayName || 'Demo Landlord';
    } catch {
      return NextResponse.json({ message: `No account found for ${email}. Sign in to the landlord portal with it once, then seed.` }, { status: 404 });
    }

    // Mark the account as a demo landlord.
    await db.collection('users').doc(uid).set({ role: 'landlord', name, demo: true, updatedAt: FieldValue.serverTimestamp() }, { merge: true });

    const now = new Date();
    const y = now.getFullYear();
    const day = (mo: number, d: number) => `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const base = { demo: true, landlordId: uid, landlordName: name, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() };

    // 1) Two properties, the first with full tenancy/deposit/guarantor details.
    const prop1Ref = db.collection('properties').doc();
    const prop2Ref = db.collection('properties').doc();
    const prop1Loc = '12 Demo Gardens, Leeds, LS1 1AA';
    const prop2Loc = '5 Sample Street, Manchester, M1 1AA';
    await prop1Ref.set({
      ...base, title: 'DEMO — 2 bed flat', location: prop1Loc, price: 1100, bedrooms: 2, bathrooms: 1,
      furnished: 'furnished', propertyType: 'whole', status: 'active', availability: 'let-agreed',
      tenancyType: 'Managed', uniquePaymentReference: 'DEMO-389', tenantName: 'Aasia Majeed', otherTenants: '',
      guarantorName: 'Ali Raza', guarantorAddress: '5 The Hawthorns, Ferriby High Road, HU14 3LQ',
      guarantorContact: '+44 7479 550655', guarantorEmail: 'ali.raza@example.com',
      managementFeePct: '10', managementFeeVat: false, automaticStatement: false, emailStatementTo: email,
      contractStart: day(7, 24), contractEnd: `${y + 5}-07-23`, dateToVacate: `${y + 5}-07-23`,
      renewalStatus: '', contractEndAction: 'Statutory periodic',
      depositProtectionRef: '51717868 (DPS)', depositAmount: '1000', depositHeldBy: 'Agent',
      depositDueToBeReturned: 'N/A', depositPaidDirectly: false,
      rentFrequency: '1 month', rentDueOn: day(8, 24), rentOutstanding: '0', floatBalance: '0',
      propertyManager: 'Kasra', branch: 'Leeds', tenancyCreatedBy: 'Demo seed',
    });
    await prop2Ref.set({
      ...base, title: 'DEMO — 3 bed terraced', location: prop2Loc, price: 1350, bedrooms: 3, bathrooms: 1,
      furnished: 'unfurnished', propertyType: 'whole', status: 'active', availability: 'available',
      tenancyType: 'Let only', managementFeePct: '', rentFrequency: '1 month',
    });

    // 2) Applications with a spread of pipeline stages.
    const apps = [
      { fullName: 'Aasia Majeed', propertyId: prop1Ref.id, propertyAddress: prop1Loc, rent: '£1,100', leaseTerm: '12 months', status: 'approved', stage: 'tenancy' },
      { fullName: 'Jane Sample', propertyId: prop1Ref.id, propertyAddress: prop1Loc, rent: '£1,100', leaseTerm: '12 months', status: 'reviewing', stage: 'viewing' },
      { fullName: 'John Tester', propertyId: prop2Ref.id, propertyAddress: prop2Loc, rent: '£1,350', leaseTerm: '6 months', status: 'reviewing', stage: 'referencing' },
    ];
    for (const a of apps) await db.collection('tenantApplications').add({ ...base, ...a, email: 'applicant@example.com', phone: '07000 000000' });

    // 3) Maintenance — two billed+completed (→ ledger deductions) and one open.
    const maint = [
      { title: 'Annual boiler service', issueDescription: 'Yearly gas safety + boiler service', category: 'Gas / boiler', contractor: 'Platinum Gas Care', cost: 90, billToLandlord: true, status: 'resolved' },
      { title: 'Leaking kitchen tap', issueDescription: 'Replaced washer and re-sealed', category: 'Plumbing', cost: 45, billToLandlord: true, status: 'resolved' },
      { title: 'Broken window latch', issueDescription: 'Reported by tenant, awaiting contractor', category: 'General', status: 'open' },
    ];
    for (const m of maint) {
      const ref = db.collection('maintenanceRequests').doc();
      await ref.set({ ...base, source: 'staff-ticket', propertyId: prop1Ref.id, propertyAddress: prop1Loc, fullName: '', ...m });
      // Billed + completed → its own maintenance ledger entry (as auto-post would).
      if ((m as any).billToLandlord && m.status === 'resolved' && (m as any).cost) {
        await db.collection('ledgerEntries').add({
          ...base, source: 'maintenance', linkId: ref.id, propertyId: prop1Ref.id, propertyLabel: prop1Loc,
          type: 'maintenance', direction: 'out', amount: (m as any).cost, date: day(7, 12), description: m.title,
        });
      }
    }

    // 4) Account/ledger — rent in, management fee, payment to landlord across the
    //    year so the statement shows a full picture (prop1 has no bank-sheet rows).
    const ledger: { date: string; type: string; direction: 'in' | 'out'; amount: number; description: string }[] = [];
    for (let mo = 1; mo <= Math.min(now.getMonth() + 1, 12); mo++) {
      ledger.push({ date: day(mo, 3), type: 'rent_in', direction: 'in', amount: 1100, description: 'Rent received — A. Majeed' });
      ledger.push({ date: day(mo, 4), type: 'management_fee', direction: 'out', amount: 110, description: 'Management fee 10%' });
      ledger.push({ date: day(mo, 5), type: 'payment_to_landlord', direction: 'out', amount: 990, description: 'Payment to landlord' });
    }
    let batch = db.batch(); let ops = 0;
    for (const l of ledger) {
      const ref = db.collection('ledgerEntries').doc();
      batch.set(ref, { ...base, source: 'manual', propertyId: prop1Ref.id, propertyLabel: prop1Loc, reference: 'DEMO', ...l });
      if (++ops >= 400) { await batch.commit(); batch = db.batch(); ops = 0; }
    }
    if (ops) await batch.commit();

    await logAction(auth, 'POST', '/api/staff/demo', { action: 'seed', email, uid });
    return NextResponse.json({ ok: true, email, counts: await countDemo(db) }, { status: 200 });
  }

  return NextResponse.json({ message: 'Unknown action.' }, { status: 400 });
}
