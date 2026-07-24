'use client';
// components/dashboard/ManagePortalPanel.tsx
// One place to manage everything a landlord sees for a single property — the
// Gnomen-style "manage portal" view. Composes the existing editors into tabbed
// sections: Property & tenancy, Account (ledger), Maintenance, and Applications.
// Launched from the admin Properties list.
import { useEffect, useState, useCallback } from 'react';
import type { Property } from '@/lib/types';
import LedgerManager from '@/components/dashboard/LedgerManager';
import MaintenanceTicketForm from '@/components/dashboard/MaintenanceTicketForm';
import ApplicationAssign from '@/components/dashboard/ApplicationAssign';
import TenancyDetailsForm from '@/components/dashboard/TenancyDetailsForm';
import LandlordAssignForm from '@/components/dashboard/LandlordAssignForm';
import { stageLabel } from '@/lib/applicationStages';

type Section = 'landlord' | 'tenancy' | 'account' | 'maintenance' | 'applications';
const SECTIONS: { key: Section; label: string; icon: string }[] = [
  { key: 'landlord', label: 'Landlord', icon: '👤' },
  { key: 'tenancy', label: 'Tenancy details', icon: '📋' },
  { key: 'account', label: 'Account', icon: '💷' },
  { key: 'maintenance', label: 'Maintenance', icon: '🔧' },
  { key: 'applications', label: 'Applications', icon: '👥' },
];

const MAINT_META: Record<string, { bg: string; color: string; label: string }> = {
  open: { bg: '#fff3e0', color: '#ef6c00', label: 'Open' },
  'in-progress': { bg: '#e3f2fd', color: '#1565c0', label: 'In progress' },
  resolved: { bg: '#e8f5e9', color: '#2e7d32', label: 'Resolved' },
  cancelled: { bg: '#f3f4f6', color: '#6b7280', label: 'Cancelled' },
};

export default function ManagePortalPanel({
  property, authedFetch, onBack, onSaved,
}: {
  property: Property;
  authedFetch: (path: string, init?: RequestInit) => Promise<Response>;
  onBack: () => void;
  onSaved?: () => void;
}) {
  const [section, setSection] = useState<Section>('landlord');
  const [maint, setMaint] = useState<any[]>([]);
  const [apps, setApps] = useState<any[]>([]);
  const [ticketForm, setTicketForm] = useState<null | 'new' | any>(null);
  const label = property.location || property.title || 'Property';

  const loadMaint = useCallback(async () => {
    try { const r = await authedFetch('/api/staff/maintenance'); const j = await r.json().catch(() => ({})); setMaint((j.requests || []).filter((m: any) => m.propertyId === property.id)); } catch { /* ignore */ }
  }, [authedFetch, property.id]);
  const loadApps = useCallback(async () => {
    try { const r = await authedFetch('/api/staff/applications'); const j = await r.json().catch(() => ({})); setApps((j.applications || []).filter((a: any) => a.propertyId === property.id)); } catch { /* ignore */ }
  }, [authedFetch, property.id]);

  useEffect(() => { if (section === 'maintenance') loadMaint(); if (section === 'applications') loadApps(); }, [section, loadMaint, loadApps]);

  const setMaintStatus = async (id: string, status: string) => {
    setMaint(ms => ms.map(m => m.id === id ? { ...m, status } : m));
    try { await authedFetch('/api/staff/maintenance', { method: 'PATCH', body: JSON.stringify({ id, status }) }); } catch { loadMaint(); }
  };

  const money = (v: any) => `£${(Number(v) || 0).toLocaleString('en-GB')}`;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
        <button onClick={onBack} style={{ padding: '6px 12px', background: 'transparent', border: '1px solid var(--gray-200)', borderRadius: 6, fontSize: 12, cursor: 'pointer', color: 'var(--gray-600)' }}>← Back to Properties</button>
      </div>
      <h1 className="dash-section-title" style={{ margin: '0 0 2px' }}>Manage portal</h1>
      <p style={{ color: 'var(--gray-600)', margin: '0 0 18px', fontSize: 14 }}>
        <strong>{label}</strong>{property.landlordName ? ` · ${property.landlordName}` : ''} — everything below is what this landlord sees in their portal.
      </p>

      {/* Section tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {SECTIONS.map(s => (
          <button key={s.key} onClick={() => setSection(s.key)} style={{
            padding: '9px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer',
            border: `1px solid ${section === s.key ? '#2563eb' : 'var(--gray-200)'}`,
            background: section === s.key ? '#2563eb' : '#fff', color: section === s.key ? '#fff' : 'var(--gray-600)',
          }}>{s.icon} {s.label}</button>
        ))}
      </div>

      {/* Landlord assignment (its own feature — not the public advert) */}
      {section === 'landlord' && (
        <LandlordAssignForm property={property} authedFetch={authedFetch} onSaved={onSaved} />
      )}

      {/* Tenancy details (its own feature) */}
      {section === 'tenancy' && (
        <TenancyDetailsForm property={property} authedFetch={authedFetch} onSaved={onSaved} />
      )}

      {/* Account */}
      {section === 'account' && (
        <div className="dash-card">
          <LedgerManager embedded authedFetch={authedFetch} property={{ id: property.id!, label, landlordId: property.landlordId }} onClose={() => {}} />
        </div>
      )}

      {/* Maintenance */}
      {section === 'maintenance' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button onClick={() => setTicketForm('new')} style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>+ New ticket</button>
          </div>
          {ticketForm && (
            <MaintenanceTicketForm
              authedFetch={authedFetch}
              existing={ticketForm === 'new' ? { propertyId: property.id, propertyLabel: label } : ticketForm}
              onSaved={() => { setTicketForm(null); loadMaint(); }}
              onCancel={() => setTicketForm(null)}
            />
          )}
          <div className="dash-card" style={{ padding: 0, overflow: 'hidden' }}>
            {maint.length === 0 ? <div style={{ padding: 30, textAlign: 'center', color: 'var(--gray-400)' }}>No maintenance for this property.</div> : (
              <table className="data-table">
                <thead><tr><th>Job</th><th>Category</th><th>Cost</th><th>Status</th><th></th></tr></thead>
                <tbody>
                  {maint.map(m => {
                    const meta = MAINT_META[m.status] || MAINT_META.open;
                    return (
                      <tr key={m.id}>
                        <td style={{ fontWeight: 600, fontSize: 14 }}>{m.title || m.issueDescription}</td>
                        <td style={{ fontSize: 13, color: 'var(--gray-600)' }}>{m.category || '—'}</td>
                        <td style={{ fontSize: 13, whiteSpace: 'nowrap' }}>{(m.cost || 0) > 0 ? <span style={{ fontWeight: 700, color: m.billToLandlord ? '#c62828' : 'var(--gray-600)' }}>{money(m.cost)}{m.billToLandlord ? ' · billed' : ''}</span> : '—'}</td>
                        <td>
                          <select value={m.status} onChange={e => setMaintStatus(m.id, e.target.value)} style={{ padding: '6px 8px', borderRadius: 6, fontSize: 12, border: `1px solid ${meta.color}`, color: meta.color, background: meta.bg, fontWeight: 700 }}>
                            {['open', 'in-progress', 'resolved', 'cancelled'].map(s => <option key={s} value={s}>{s.replace('-', ' ')}</option>)}
                          </select>
                        </td>
                        <td><button onClick={() => setTicketForm(m)} style={{ border: '1px solid var(--gray-200)', background: '#fff', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', color: '#2563eb', fontSize: 12.5, fontWeight: 600 }}>Cost / edit</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Applications */}
      {section === 'applications' && (
        <div className="dash-card" style={{ padding: 0, overflow: 'hidden' }}>
          {apps.length === 0 ? <div style={{ padding: 30, textAlign: 'center', color: 'var(--gray-400)' }}>No applications assigned to this property.</div> : (
            <table className="data-table">
              <thead><tr><th>Applicant</th><th>Contact</th><th>Stage</th><th>Assign / stage</th></tr></thead>
              <tbody>
                {apps.map(a => (
                  <tr key={a.id}>
                    <td style={{ fontWeight: 600, fontSize: 14 }}>{a.fullName}</td>
                    <td style={{ fontSize: 12, color: 'var(--gray-400)' }}><div>{a.email}</div><div>{a.phone}</div></td>
                    <td style={{ fontSize: 13, fontWeight: 700, color: '#2563eb' }}>{stageLabel(a.stage)}</td>
                    <td><ApplicationAssign authedFetch={authedFetch} application={a} onUpdated={f => setApps(prev => prev.map(x => x.id === a.id ? { ...x, ...f } : x))} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p style={{ fontSize: 12, color: 'var(--gray-400)', padding: '10px 14px', margin: 0 }}>Applications submitted for other postcodes won&rsquo;t appear here until assigned to this property (Applications tab).</p>
        </div>
      )}
    </div>
  );
}
