'use client';
// components/dashboard/SecondLandlordDetails.tsx
// Surfaces the joint (second) landlord's accept/decline status and, once they've
// completed, their submitted details, documents and signature. Shared by the
// admin and staff "Landlord Registration" detail views. Reads the fields the
// /api/staff/agreements GET already returns on each agreement doc.
import { safeLinkHref } from '@/lib/security';

const NAVY = '#0a162f';

const STATUS_META: Record<string, { label: string; bg: string; color: string; icon: string }> = {
  pending:   { label: 'Awaiting their response', bg: '#fff3e0', color: '#ef6c00', icon: '⏳' },
  completed: { label: 'Accepted & signed',       bg: '#e8f5e9', color: '#2e7d32', icon: '✅' },
  declined:  { label: 'Declined — voided',        bg: '#fdecea', color: '#c62828', icon: '🚫' },
};

function DocLinks({ label, urls, names }: { label: string; urls?: string[]; names?: string[] }) {
  const list = Array.isArray(urls) ? urls.filter(Boolean) : [];
  return (
    <div style={{ marginBottom: 6 }}>
      <strong style={{ color: NAVY }}>{label}:</strong>{' '}
      {list.length === 0 ? <span style={{ color: '#9aa4b2' }}>—</span> : list.map((u, i) => (
        <a key={u} href={safeLinkHref(u)} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', marginRight: 10 }}>
          {(names && names[i]) || `file ${i + 1}`}
        </a>
      ))}
    </div>
  );
}

export default function SecondLandlordDetails({ a }: { a: Record<string, any> }) {
  const status: string | undefined = a.secondLandlordStatus;
  // Only render for registrations that went through the new joint-invite flow.
  if (!status && !a.secondLandlord) return null;

  const meta = STATUS_META[status || 'pending'] || STATUS_META.pending;
  const s = a.secondLandlord || {};

  return (
    <div style={{ marginTop: 16, border: '1px solid #e4e9f2', borderRadius: 10, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', padding: '10px 14px', background: '#f6f8fc', borderBottom: '1px solid #e9edf5' }}>
        <span style={{ fontSize: 12.5, fontWeight: 800, color: NAVY, textTransform: 'uppercase', letterSpacing: '.04em' }}>👥 Second (Joint) Landlord</span>
        <span style={{ fontSize: 11.5, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: meta.bg, color: meta.color }}>
          {meta.icon} {meta.label}
        </span>
      </div>

      <div style={{ padding: '12px 14px', fontSize: 13, color: 'var(--gray-600)' }}>
        {/* Who was invited (always known from the first landlord's entry) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '6px 24px', marginBottom: status === 'completed' ? 12 : 0 }}>
          <div><strong style={{ color: NAVY }}>Name:</strong> {s.fullName || a.landlord2Name || '—'}</div>
          <div><strong style={{ color: NAVY }}>Email:</strong> {s.email || a.landlord2Email || '—'}</div>
          <div><strong style={{ color: NAVY }}>Phone:</strong> {s.phone || a.landlord2Phone || '—'}</div>
          {status === 'completed' && <div><strong style={{ color: NAVY }}>Billing address:</strong> {s.contactAddress || '—'}</div>}
          {status === 'completed' && <div><strong style={{ color: NAVY }}>Residency:</strong> {s.residency === 'non-resident' ? 'Non-resident (NRL)' : s.residency ? 'UK-resident' : '—'}</div>}
          {status === 'completed' && <div><strong style={{ color: NAVY }}>Signed by:</strong> {s.signatureName || s.fullName || '—'} {s.signatureDate ? `on ${s.signatureDate}` : ''}</div>}
        </div>

        {status === 'pending' && (
          <p style={{ margin: '8px 0 0', color: '#8a6d3b' }}>An invite link has been emailed. They haven't accepted or declined yet.</p>
        )}
        {status === 'declined' && (
          <p style={{ margin: '8px 0 0', color: '#c62828' }}>They declined the registration, so it was voided. No agreement is in effect.</p>
        )}

        {status === 'completed' && (
          <>
            <DocLinks label="ID (front & back)" urls={s.landlordIdUrls} names={s.landlordIdFileNames} />
            <DocLinks label="Billing address proof" urls={s.billingProofUrls} names={s.billingProofFileNames} />
            <DocLinks label="Proof of ownership" urls={s.ownershipProofUrls} names={s.ownershipProofFileNames} />
            {s.signatureUrl && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: NAVY, marginBottom: 6 }}>Signature — {s.signatureName || s.fullName}</div>
                <a href={safeLinkHref(s.signatureUrl)} target="_blank" rel="noopener noreferrer">
                  <img src={safeLinkHref(s.signatureUrl)} alt="Second landlord signature" style={{ maxHeight: 80, border: '1px solid var(--gray-200)', borderRadius: 6, background: '#fff', padding: 4 }} />
                </a>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
