'use client';
// components/dashboard/CoSignersDetails.tsx
// Surfaces the company co-signers (directors/officers other than the managing
// director) on a landlord registration: each one's accept/decline/sign status
// and, once completed, their submitted documents and signature. Shared by the
// admin + staff "Landlord Registration" detail views. Reads the `coSigners`
// array the /api/staff/agreements GET returns (tokens stripped server-side).
import { safeLinkHref } from '@/lib/security';

const NAVY = '#0a162f';

const STATUS_META: Record<string, { label: string; bg: string; color: string; icon: string }> = {
  pending: { label: 'Awaiting their response', bg: '#fff3e0', color: '#ef6c00', icon: '⏳' },
  completed: { label: 'Accepted & signed', bg: '#e8f5e9', color: '#2e7d32', icon: '✅' },
  declined: { label: 'Declined — voided', bg: '#fdecea', color: '#c62828', icon: '🚫' },
};

function DocLinks({ label, urls, names }: { label: string; urls?: string[]; names?: string[] }) {
  const list = Array.isArray(urls) ? urls.filter(Boolean) : [];
  return (
    <div style={{ marginBottom: 4 }}>
      <strong style={{ color: NAVY }}>{label}:</strong>{' '}
      {list.length === 0 ? <span style={{ color: '#9aa4b2' }}>—</span> : list.map((u, i) => (
        <a key={u} href={safeLinkHref(u)} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', marginRight: 10 }}>
          {(names && names[i]) || `file ${i + 1}`}
        </a>
      ))}
    </div>
  );
}

export default function CoSignersDetails({ a }: { a: Record<string, any> }) {
  const coSigners: any[] = Array.isArray(a.coSigners) ? a.coSigners : [];
  if (!coSigners.length) return null;

  const done = coSigners.filter(c => c.status === 'completed').length;

  return (
    <div style={{ marginTop: 16, border: '1px solid #e4e9f2', borderRadius: 10, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', padding: '10px 14px', background: '#f6f8fc', borderBottom: '1px solid #e9edf5' }}>
        <span style={{ fontSize: 12.5, fontWeight: 800, color: NAVY, textTransform: 'uppercase', letterSpacing: '.04em' }}>✍️ Company Directors (co-signers)</span>
        <span style={{ fontSize: 11.5, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: '#eef2f7', color: '#475569' }}>
          {done}/{coSigners.length} signed
        </span>
      </div>

      <div style={{ padding: '4px 14px 12px', fontSize: 13, color: 'var(--gray-600)' }}>
        {coSigners.map((c, i) => {
          const meta = STATUS_META[c.status] || STATUS_META.pending;
          const completed = c.status === 'completed';
          return (
            <div key={c.id || i} style={{ padding: '12px 0', borderBottom: i < coSigners.length - 1 ? '1px solid #f0f2f7' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: completed ? 10 : 0 }}>
                <strong style={{ color: NAVY }}>{c.fullName || c.name || 'Director'}</strong>
                {c.role && <span style={{ fontSize: 12, color: '#8a94a3' }}>{c.role}</span>}
                <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 20, background: meta.bg, color: meta.color }}>{meta.icon} {meta.label}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '4px 24px' }}>
                <div><strong style={{ color: NAVY }}>Email:</strong> {c.email || '—'}</div>
                {completed && <div><strong style={{ color: NAVY }}>Phone:</strong> {c.phone || '—'}</div>}
                {completed && <div><strong style={{ color: NAVY }}>Residency:</strong> {c.residency === 'non-resident' ? 'Non-resident (NRL)' : c.residency ? 'UK-resident' : '—'}</div>}
                {completed && <div><strong style={{ color: NAVY }}>Signed by:</strong> {c.signatureName || c.fullName || '—'} {c.signatureDate ? `on ${c.signatureDate}` : ''}</div>}
              </div>
              {completed && (
                <div style={{ marginTop: 8 }}>
                  <DocLinks label="ID (front & back)" urls={c.landlordIdUrls} names={c.landlordIdFileNames} />
                  <DocLinks label="Billing address proof" urls={c.billingProofUrls} names={c.billingProofFileNames} />
                  <DocLinks label="Proof of ownership" urls={c.ownershipProofUrls} names={c.ownershipProofFileNames} />
                  {c.signatureUrl && (
                    <div style={{ marginTop: 8 }}>
                      <a href={safeLinkHref(c.signatureUrl)} target="_blank" rel="noopener noreferrer">
                        <img src={safeLinkHref(c.signatureUrl)} alt="Director signature" style={{ maxHeight: 70, border: '1px solid var(--gray-200)', borderRadius: 6, background: '#fff', padding: 4 }} />
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
