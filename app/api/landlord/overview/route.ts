// app/api/landlord/overview/route.ts
// The landlord portal's single data endpoint. Everything is scoped SERVER-SIDE
// to the caller: their registered properties come from the agreements linked to
// their account, and their tenant applications + maintenance requests are the
// ones whose property postcode matches a postcode on their registration(s).
//
// The freetext address forms (maintenance/application) predate any structured
// landlord link, so postcode matching is what ties an inbound form to the right
// landlord without a backfill. Docs are fetched recent-first (bounded) and
// filtered in memory — Firestore can't query on a postcode we derive at runtime.
import { NextResponse } from 'next/server';
import { requireLandlord } from '@/lib/landlordAuth';
import { getAdminDb } from '@/lib/staffApiAuth';
import { normalisePostcode, resolveAvailability } from '@/lib/portalMatch';
import { pluckTenancy } from '@/lib/tenancyFields';
import { rateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

const iso = (v: any) => v?.toDate?.()?.toISOString?.() || null;
const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

export async function GET(request: Request) {
  const limited = rateLimit(request, 'landlord-overview', 60, 10 * 60 * 1000);
  if (limited) return limited;

  const auth = await requireLandlord(request);
  if (auth instanceof Response) return auth;

  try {
    const db = getAdminDb();
    const mine = new Set(auth.postcodes.map(p => p.toUpperCase()));
    const belongs = (address: string | undefined) => {
      const pc = normalisePostcode(String(address || ''));
      return pc ? mine.has(pc) : false;
    };

    // ── Registered properties: from the agreements linked to this account ──
    const agreementSnaps = auth.agreementIds.length
      ? await Promise.all(auth.agreementIds.map(id => db.collection('landlordAgreements').doc(id).get()))
      : [];
    // Fallback for any legacy account not yet carrying agreement ids: match by email.
    let agreementDocs = agreementSnaps.filter(s => s.exists);
    if (!agreementDocs.length && auth.email) {
      const byEmail = await db.collection('landlordAgreements').where('email', '==', auth.email).limit(25).get();
      agreementDocs = byEmail.docs;
    }

    type Prop = {
      id: string; agreementId: string; label: string; postcode: string;
      city?: string; type?: string; bedrooms?: string; bathrooms?: string; furnishing?: string; rent?: string;
      tenancyStart?: string; tenancyEnd?: string; availableFrom?: string; occupancy?: string;
      packageId?: string; packageLabel?: string; tenancy?: Record<string, any>;
    };
    const properties: Prop[] = [];
    for (const s of agreementDocs) {
      const d = s.data() || {};
      const list = Array.isArray(d.properties) ? d.properties : [];
      const rows = list.length ? list : [{
        postcode: d.postcode, street: d.street, city: d.city, flatNumber: d.flatNumber,
        propertyType: d.propertyType, bedrooms: d.bedrooms, currentRent: d.currentRent,
      }];
      rows.forEach((p: any, i: number) => {
        const label = [p.flatNumber, p.street, p.city, p.postcode].filter(Boolean).join(', ') || d.address || 'Registered property';
        properties.push({
          id: `${s.id}-${i}`,
          agreementId: s.id,
          label,
          postcode: normalisePostcode(String(p.postcode || label)) || '',
          city: p.city, type: p.propertyType, bedrooms: p.bedrooms, bathrooms: p.bathrooms, furnishing: p.furnishing, rent: p.currentRent,
          tenancyStart: p.tenancyStart, tenancyEnd: p.tenancyEnd, availableFrom: p.availableFrom, occupancy: p.occupancy,
          packageId: d.selectedPackageId || '', packageLabel: d.selectedPackage || '',
          tenancy: pluckTenancy(p),
        });
      });
    }

    // ── Properties posted FOR this landlord (properties collection, landlordId
    //    === this account) are the landlord's real properties, so promote them
    //    into "My Properties" (full property page + Account tab), not just a
    //    read-only listing. Deduped by postcode against any registered ones. ──
    const listingSnap = await db.collection('properties').orderBy('createdAt', 'desc').limit(200).get();
    const allListings = listingSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
    const seenPostcodes = new Set(properties.map(p => p.postcode).filter(Boolean));
    const promotedIds = new Set<string>();
    for (const p of allListings) {
      if (p.landlordId !== auth.uid) continue;
      const pc = normalisePostcode(String(p.location || '')) || '';
      if (pc && seenPostcodes.has(pc)) continue; // already shown as a registered property
      promotedIds.add(p.id);
      if (pc) seenPostcodes.add(pc);
      const avail = resolveAvailability(p);
      const occ = avail === 'let-agreed' ? 'Let' : avail === 'available' ? 'Available' : avail === 'pending' ? 'Pending' : undefined;
      properties.push({
        id: p.id,
        agreementId: '',
        label: p.location || p.title || 'Property',
        postcode: pc,
        type: p.propertyType === 'room' ? 'Room' : undefined,
        bedrooms: p.bedrooms != null ? String(p.bedrooms) : undefined,
        bathrooms: p.bathrooms != null ? String(p.bathrooms) : undefined,
        furnishing: p.furnished,
        rent: p.price != null ? String(p.price) : undefined,
        occupancy: occ,
        packageId: '', packageLabel: '',
        // Staff-entered tenancy/deposit/accounts details (Gnomen-style) for the portal.
        tenancy: pluckTenancy(p),
        tenancyStart: p.contractStart || undefined,
        tenancyEnd: p.contractEnd || undefined,
      });
    }

    // ── Live listings: matched listings NOT already promoted to a property ──
    const listings = allListings
      .filter(p => (p.landlordId === auth.uid || belongs(p.location)) && !promotedIds.has(p.id))
      .map(p => ({
        id: p.id,
        title: p.title || 'Listing',
        location: p.location || '',
        price: Number(p.price) || 0,
        status: p.status || 'active',
        availability: resolveAvailability(p),
        images: Array.isArray(p.images) ? p.images.slice(0, 1) : [],
      }));

    // ── Tenant applications scoped by postcode ──
    const appSnap = await db.collection('tenantApplications').orderBy('createdAt', 'desc').limit(200).get();
    const applications = appSnap.docs
      .map(doc => ({ id: doc.id, ...(doc.data() as any) }))
      .filter(a => belongs(a.propertyAddress))
      .map(a => ({
        id: a.id,
        fullName: a.fullName || '',
        propertyAddress: a.propertyAddress || '',
        postcode: normalisePostcode(String(a.propertyAddress || '')) || '',
        rent: a.rent || '',
        moveInDate: a.moveInDate || '',
        leaseTerm: a.leaseTerm || '',
        status: a.status || 'new',
        submittedAt: iso(a.createdAt),
      }));

    // ── Maintenance requests scoped by postcode ──
    const maintSnap = await db.collection('maintenanceRequests').orderBy('createdAt', 'desc').limit(200).get();
    const maintenance = maintSnap.docs
      .map(doc => ({ id: doc.id, ...(doc.data() as any) }))
      // Tenant-reported requests match by postcode; staff tickets also match by
      // the landlordId/propertyId the office assigned.
      .filter(m => belongs(m.propertyAddress || m.propertyLabel) || m.landlordId === auth.uid)
      .map(m => ({
        id: m.id,
        fullName: m.fullName || '',
        propertyAddress: m.propertyAddress || m.propertyLabel || '',
        postcode: normalisePostcode(String(m.propertyAddress || m.propertyLabel || '')) || '',
        propertyId: m.propertyId || '',
        title: m.title || '',
        category: m.category || '',
        issueDescription: m.issueDescription || '',
        status: m.status || 'open',
        cost: typeof m.cost === 'number' ? m.cost : (m.cost ? Number(m.cost) || 0 : 0),
        billToLandlord: !!m.billToLandlord,
        breakdown: Array.isArray(m.breakdown) ? m.breakdown : [],
        submittedAt: iso(m.createdAt),
      }));

    // ── Derived stats + chart series ──
    const monthlyRent = properties.reduce((sum, p) => sum + (parseFloat(String(p.rent || '').replace(/[^\d.]/g, '')) || 0), 0);
    const maintByStatus = maintenance.reduce((acc: Record<string, number>, m) => {
      acc[m.status] = (acc[m.status] || 0) + 1; return acc;
    }, {});

    // Applications per month for the last 6 months (oldest → newest).
    const now = new Date();
    const months: { key: string; label: string; applications: number; maintenance: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ key: monthKey(d), label: d.toLocaleDateString('en-GB', { month: 'short' }), applications: 0, maintenance: 0 });
    }
    const bucket = new Map(months.map(m => [m.key, m]));
    for (const a of applications) if (a.submittedAt) { const m = bucket.get(monthKey(new Date(a.submittedAt))); if (m) m.applications++; }
    for (const m2 of maintenance) if (m2.submittedAt) { const m = bucket.get(monthKey(new Date(m2.submittedAt))); if (m) m.maintenance++; }

    return NextResponse.json({
      properties,
      listings,
      applications,
      maintenance,
      stats: {
        registeredProperties: properties.length,
        liveListings: listings.length,
        totalApplications: applications.length,
        openMaintenance: maintenance.filter(m => m.status === 'open' || m.status === 'in-progress').length,
        resolvedMaintenance: maintenance.filter(m => m.status === 'resolved').length,
        estMonthlyRent: Math.round(monthlyRent),
        estAnnualRent: Math.round(monthlyRent * 12),
      },
      charts: { months, maintByStatus },
    }, { status: 200 });
  } catch (e) {
    console.error('landlord-overview error:', e);
    return NextResponse.json({ message: 'Could not load your portal data.' }, { status: 500 });
  }
}
