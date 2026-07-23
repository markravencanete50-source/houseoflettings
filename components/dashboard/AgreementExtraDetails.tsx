'use client';
// components/dashboard/AgreementExtraDetails.tsx
// Renders the parts of a landlord registration that the basic detail grid leaves
// out, so the admin/staff "Landlord Registration" view shows EVERYTHING the
// landlord filled in: company details + directors (with ownership %), the primary
// landlord's uploaded documents, compliance certificates (EPC/EICR/gas), every
// property (not just the first) with its photos/floor plans, and notes/coupon.
// Shared by app/admin/page.tsx and app/dashboard/staff/page.tsx. All fields are
// already present on the agreement object returned by /api/staff/agreements.
import { safeLinkHref } from '@/lib/security';

const NAVY = '#0a162f';

function Row({ label, value }: { label: string; value: any }) {
  if (value === undefined || value === null || value === '' ) return null;
  return (
    <div><strong style={{ color: NAVY }}>{label}:</strong> {String(value)}</div>
  );
}

function DocLinks({ label, urls, names, single }: { label: string; urls?: string[]; names?: string[]; single?: string }) {
  const list = (Array.isArray(urls) ? urls.filter(Boolean) : []);
  if (!list.length && single) list.push(single);
  if (!list.length) return null;
  return (
    <div style={{ marginBottom: 4 }}>
      <strong style={{ color: NAVY }}>{label}:</strong>{' '}
      {list.map((u, i) => (
        <a key={u} href={safeLinkHref(u)} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', marginRight: 10 }}>
          {(names && names[i]) || `file ${i + 1}`}
        </a>
      ))}
    </div>
  );
}

const grid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '6px 24px' };
const panel: React.CSSProperties = { marginTop: 16, border: '1px solid #e4e9f2', borderRadius: 10, overflow: 'hidden' };
const head: React.CSSProperties = { padding: '10px 14px', background: '#f6f8fc', borderBottom: '1px solid #e9edf5', fontSize: 12.5, fontWeight: 800, color: NAVY, textTransform: 'uppercase', letterSpacing: '.04em' };
const bodyStyle: React.CSSProperties = { padding: '12px 14px', fontSize: 13, color: 'var(--gray-600)' };

function money(v: any) { return v === undefined || v === null || v === '' ? '' : `£${v}`; }
function certLabel(c: any): string {
  if (!c) return '';
  if (typeof c === 'string') return c;
  return [c.status, c.url ? '' : ''].filter(Boolean).join(' ');
}

export default function AgreementExtraDetails({ a }: { a: Record<string, any> }) {
  const isCompany = a.ownerType === 'company' || !!a.companyName || (Array.isArray(a.companyPeople) && a.companyPeople.length > 0);
  const people: any[] = Array.isArray(a.companyPeople) ? a.companyPeople : [];
  const properties: any[] = Array.isArray(a.properties) ? a.properties : [];
  const docs = a.documents || {};
  const certRows: Array<[string, any]> = [
    ['EPC', docs.epc],
    ['Electrical (EICR)', docs.electrical],
    ['Gas safety', docs.gas],
  ].filter(([, c]) => c && (c.status || c.url)) as Array<[string, any]>;

  return (
    <>
      {/* ── Company ── */}
      {isCompany && (
        <div style={panel}>
          <div style={head}>🏢 Company details</div>
          <div style={bodyStyle}>
            <div style={{ ...grid, marginBottom: people.length ? 12 : 0 }}>
              <Row label="Owner type" value="Company / Ltd" />
              <Row label="Company name" value={a.companyName} />
              <Row label="Company number" value={a.companyNumber} />
              <Row label="Registered address" value={a.registeredAddress} />
              <Row label="Main contact role" value={a.contactRole} />
              <Row label="Number of properties" value={a.propertyCount} />
            </div>
            {people.length > 0 && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: NAVY, margin: '4px 0 6px' }}>Owners &amp; officers</div>
                {people.map((p, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '2px 18px', padding: '6px 0', borderTop: i ? '1px solid #f0f2f7' : 'none' }}>
                    <div><strong style={{ color: NAVY }}>{p.name || `Person ${i + 1}`}</strong></div>
                    <Row label="Role" value={p.role} />
                    <Row label="Ownership" value={p.share !== undefined && p.share !== '' ? `${p.share}%` : ''} />
                    <Row label="Email" value={p.email} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Primary landlord documents ── */}
      {(a.landlordIdUrl || a.landlordIdUrls?.length || a.billingProofUrl || a.billingProofUrls?.length || a.ownershipProofUrl || a.ownershipProofUrls?.length) && (
        <div style={panel}>
          <div style={head}>📎 Landlord documents</div>
          <div style={bodyStyle}>
            <DocLinks label="Photo ID (front & back)" urls={a.landlordIdUrls} names={a.landlordIdFileNames} single={a.landlordIdUrl} />
            <DocLinks label="Billing address proof" urls={a.billingProofUrls} names={a.billingProofFileNames} single={a.billingProofUrl} />
            <DocLinks label="Proof of ownership" urls={a.ownershipProofUrls} names={a.ownershipProofFileNames} single={a.ownershipProofUrl} />
          </div>
        </div>
      )}

      {/* ── Compliance certificates ── */}
      {certRows.length > 0 && (
        <div style={panel}>
          <div style={head}>📄 Compliance certificates</div>
          <div style={bodyStyle}>
            {certRows.map(([label, c]) => (
              <div key={label} style={{ marginBottom: 4 }}>
                <strong style={{ color: NAVY }}>{label}:</strong>{' '}
                {c.status ? <span style={{ textTransform: 'capitalize' }}>{c.status}</span> : null}
                {c.url ? <a href={safeLinkHref(c.url)} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', marginLeft: 8 }}>view certificate</a> : null}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── All properties (full detail) ── */}
      {properties.length > 0 ? (
        <div style={panel}>
          <div style={head}>🏠 {properties.length > 1 ? `Properties (${properties.length})` : 'Property details'}</div>
          <div style={bodyStyle}>
            {properties.map((p, i) => {
              const addr = [p.flatNumber, p.street, p.city, p.county, p.postcode].filter(Boolean).join(', ');
              return (
                <div key={i} style={{ padding: '10px 0', borderTop: i ? '1px solid #f0f2f7' : 'none' }}>
                  <div style={{ fontWeight: 700, color: NAVY, marginBottom: 6 }}>{properties.length > 1 ? `Property ${i + 1}: ` : ''}{addr || '—'}</div>
                  <div style={grid}>
                    <Row label="Type" value={p.propertyType} />
                    <Row label="Bedrooms" value={p.bedrooms} />
                    <Row label="Bathrooms" value={p.bathrooms} />
                    <Row label="Receptions" value={p.receptions} />
                    <Row label="Furnishing" value={p.furnishing} />
                    <Row label="Parking" value={p.parking} />
                    <Row label="Condition" value={p.condition} />
                    <Row label="Occupancy" value={p.occupancy} />
                    <Row label="Current rent" value={money(p.currentRent)} />
                    <Row label="Available from" value={p.availableFrom} />
                    <Row label="Tenancy start" value={p.tenancyStart} />
                    <Row label="Tenancy end" value={p.tenancyEnd} />
                  </div>
                  {p.securityNote ? <div style={{ marginTop: 6 }}><strong style={{ color: NAVY }}>Notes:</strong> {p.securityNote}</div> : null}
                  <div style={{ marginTop: 6 }}>
                    <DocLinks label="Photos" urls={p.photoUrls} names={p.photoNames} />
                    <DocLinks label="Floor plan" urls={p.floorPlanUrls} names={p.floorPlanNames} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        // Older single-property records store fields flat — surface the ones the
        // basic grid doesn't already show.
        (a.county || a.bathrooms || a.receptions || a.parking || a.condition || a.occupancy || a.tenancyStart || a.tenancyEnd || a.securityNote) && (
          <div style={panel}>
            <div style={head}>🏠 More property details</div>
            <div style={bodyStyle}>
              <div style={grid}>
                <Row label="County" value={a.county} />
                <Row label="Bathrooms" value={a.bathrooms} />
                <Row label="Receptions" value={a.receptions} />
                <Row label="Parking" value={a.parking} />
                <Row label="Condition" value={a.condition} />
                <Row label="Occupancy" value={a.occupancy} />
                <Row label="Tenancy start" value={a.tenancyStart} />
                <Row label="Tenancy end" value={a.tenancyEnd} />
              </div>
              {a.securityNote ? <div style={{ marginTop: 6 }}><strong style={{ color: NAVY }}>Notes:</strong> {a.securityNote}</div> : null}
            </div>
          </div>
        )
      )}

      {/* ── Notes & coupon ── */}
      {(a.notes || a.couponCode) && (
        <div style={panel}>
          <div style={head}>📝 Other</div>
          <div style={bodyStyle}>
            {a.notes ? <div style={{ marginBottom: 4 }}><strong style={{ color: NAVY }}>Landlord notes:</strong> {a.notes}</div> : null}
            {a.couponCode ? <div><strong style={{ color: NAVY }}>Coupon:</strong> {a.couponCode}{a.couponDiscount ? ` (${a.couponDiscount}% off)` : ''}</div> : null}
          </div>
        </div>
      )}
    </>
  );
}
