'use client';
// app/dashboard/staff/page.tsx
// Staff dashboard — mirrors the admin dark-sidebar layout (shared global
// .dash-* classes) but limited to Properties, Applications, Maintenance and
// Post Property. All data is read through the Admin-SDK /api/staff/* routes
// (which enforce the staff/admin role), so it works without any Firestore
// client-read rules.
import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import PropertyForm from '@/components/property/PropertyForm';
import { useAuth } from '@/hooks/useAuth';
import { Property } from '@/lib/types';

type Tab = 'properties' | 'applications' | 'maintenance' | 'post';

interface TenantApplication {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  propertyAddress: string;
  status: string;
  submittedAt: string | null;
}

interface MaintenanceRequest {
  id: string;
  fullName: string;
  email: string;
  contactNumber: string;
  propertyAddress: string;
  issueDescription: string;
  status: string;
  photoUrls?: string[];
  submittedAt: string | null;
}

const badge = (status: string): { bg: string; color: string } => {
  const map: Record<string, { bg: string; color: string }> = {
    pending:   { bg: '#fff8e1', color: '#f57f17' },
    open:      { bg: '#fff8e1', color: '#f57f17' },
    reviewing: { bg: '#e3f2fd', color: '#1565c0' },
    approved:  { bg: '#e8f5e9', color: '#2e7d32' },
    resolved:  { bg: '#e8f5e9', color: '#2e7d32' },
    rejected:  { bg: '#fce4ec', color: '#c62828' },
    active:    { bg: '#e8f5e9', color: '#2e7d32' },
    inactive:  { bg: '#fce4ec', color: '#c62828' },
  };
  return map[status] || { bg: '#f1f5f9', color: '#374151' };
};

function StatusBadge({ status }: { status: string }) {
  const c = badge(status);
  return (
    <span style={{
      display: 'inline-block', padding: '4px 10px', borderRadius: 20, fontSize: 11,
      fontWeight: 700, textTransform: 'uppercase', background: c.bg, color: c.color,
    }}>
      {status || '-'}
    </span>
  );
}

function fmtDate(iso: string | null): string {
  if (!iso) return '-';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function StaffDashboardInner() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<Tab>('properties');
  const [properties, setProperties] = useState<Property[]>([]);
  const [applications, setApplications] = useState<TenantApplication[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceRequest[]>([]);
  const [loaded, setLoaded] = useState({ properties: false, applications: false, maintenance: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [searchProp, setSearchProp] = useState('');

  // Auth guard — staff only.
  useEffect(() => {
    if (!authLoading && (!profile || profile.role !== 'staff')) {
      router.push('/admin-login');
    }
  }, [profile, authLoading, router]);

  // Fetch a staff API endpoint with the Firebase ID token attached. Surfaces the
  // real HTTP status/message so a failure is visible instead of spinning forever.
  useEffect(() => {
    if (!profile || !user) return;
    const load = async (path: string, key: 'properties' | 'applications' | 'maintenance', apply: (j: any) => void) => {
      try {
        const token = await user.getIdToken();
        const res = await fetch(path, { headers: { Authorization: `Bearer ${token}` } });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.message ? `${res.status} · ${json.message}` : `HTTP ${res.status}`);
        apply(json);
        setErrors(e => ({ ...e, [key]: '' }));
      } catch (err: any) {
        console.error(`${path} failed:`, err);
        setErrors(e => ({ ...e, [key]: err.message || 'Request failed' }));
      } finally {
        setLoaded(l => ({ ...l, [key]: true }));
      }
    };
    if (tab === 'properties' && !loaded.properties) load('/api/staff/properties', 'properties', j => setProperties(j.properties || []));
    if (tab === 'applications' && !loaded.applications) load('/api/staff/applications', 'applications', j => setApplications(j.applications || []));
    if (tab === 'maintenance' && !loaded.maintenance) load('/api/staff/maintenance', 'maintenance', j => setMaintenance(j.requests || []));
  }, [tab, profile, user]); // eslint-disable-line react-hooks/exhaustive-deps

  const reloadProperties = () => {
    setLoaded(l => ({ ...l, properties: false }));
    setTab('properties');
  };

  if (authLoading || !profile) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '120px 0' }}>
        <div className="spinner" />
      </div>
    );
  }

  const filteredProps = properties.filter(p =>
    p.title?.toLowerCase().includes(searchProp.toLowerCase()) ||
    p.location?.toLowerCase().includes(searchProp.toLowerCase())
  );

  const navItems: Array<{ id: Tab; icon: string; label: string }> = [
    { id: 'properties',   icon: '🏠', label: `Properties (${properties.length})` },
    { id: 'applications', icon: '📝', label: `Applications (${applications.length})` },
    { id: 'maintenance',  icon: '🔧', label: `Maintenance (${maintenance.length})` },
    { id: 'post',         icon: '➕', label: 'Post Property' },
  ];

  return (
    <>
      <Navbar />
      <div className="dash-layout">

        {/* ── Sidebar ── */}
        <aside className="dash-sidebar">
          <div style={{ padding: '0 28px 28px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 12 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(37,99,235,0.2)', border: '1px solid rgba(37,99,235,0.4)',
              color: '#93c5fd', borderRadius: 4, padding: '4px 10px', fontSize: 11,
              fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14,
            }}>
              👤 Staff
            </div>
            <div style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>{profile.name}</div>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 2 }}>{profile.email}</div>
          </div>

          {navItems.map(item => (
            <button
              key={item.id}
              className={`dash-nav-item ${tab === item.id ? 'active' : ''}`}
              onClick={() => setTab(item.id)}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </aside>

        {/* ── Main Content ── */}
        <main className="dash-content">

          {errors[tab] && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 13.5, fontWeight: 600 }}>
              ⚠️ Couldn&rsquo;t load {tab}: {errors[tab]}
            </div>
          )}

          {/* ── Properties ── */}
          {tab === 'properties' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, gap: 12, flexWrap: 'wrap' }}>
                <h1 className="dash-section-title">Properties</h1>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <input
                    className="form-input"
                    style={{ width: 240 }}
                    placeholder="Search by title or location…"
                    value={searchProp}
                    onChange={e => setSearchProp(e.target.value)}
                  />
                  <button
                    onClick={() => setTab('post')}
                    style={{ padding: '10px 18px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    ➕ Post Property
                  </button>
                </div>
              </div>
              <div className="dash-card" style={{ padding: 0, overflow: 'hidden' }}>
                <table className="data-table">
                  <thead>
                    <tr><th>Property</th><th>Location</th><th>Rent</th><th>Status</th><th>Beds</th></tr>
                  </thead>
                  <tbody>
                    {filteredProps.map(p => (
                      <tr key={p.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {p.images?.[0] && <img src={p.images[0]} alt="" style={{ width: 44, height: 32, objectFit: 'cover', borderRadius: 4 }} />}
                            <div style={{ fontWeight: 600, fontSize: 14 }}>{p.title}</div>
                          </div>
                        </td>
                        <td style={{ fontSize: 13, color: 'var(--gray-600)' }}>{p.location}</td>
                        <td style={{ fontWeight: 700, color: 'var(--red)' }}>£{p.price?.toLocaleString()}</td>
                        <td><StatusBadge status={p.status} /></td>
                        <td style={{ fontSize: 13 }}>{p.bedrooms === 0 ? 'Studio' : p.bedrooms}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!loaded.properties ? (
                  <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>Loading properties…</div>
                ) : filteredProps.length === 0 ? (
                  <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>No properties found.</div>
                ) : null}
              </div>
            </div>
          )}

          {/* ── Applications ── */}
          {tab === 'applications' && (
            <div>
              <h1 className="dash-section-title">Tenancy Applications</h1>
              <p style={{ color: 'var(--gray-600)', marginBottom: 24, fontSize: 15 }}>All tenancy applications submitted via the website.</p>
              <div className="dash-card" style={{ padding: 0, overflow: 'hidden' }}>
                <table className="data-table">
                  <thead>
                    <tr><th>Applicant</th><th>Property</th><th>Email</th><th>Phone</th><th>Status</th><th>Submitted</th></tr>
                  </thead>
                  <tbody>
                    {applications.map(a => (
                      <tr key={a.id}>
                        <td style={{ fontWeight: 600, fontSize: 14 }}>{a.fullName}</td>
                        <td style={{ fontSize: 13, color: 'var(--gray-600)', maxWidth: 220 }}>{a.propertyAddress}</td>
                        <td style={{ fontSize: 13, color: 'var(--gray-600)' }}>{a.email}</td>
                        <td style={{ fontSize: 13, color: 'var(--gray-600)' }}>{a.phone}</td>
                        <td><StatusBadge status={a.status} /></td>
                        <td style={{ fontSize: 13, color: 'var(--gray-400)' }}>{fmtDate(a.submittedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!loaded.applications ? (
                  <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>Loading applications…</div>
                ) : applications.length === 0 ? (
                  <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>No applications yet.</div>
                ) : null}
              </div>
            </div>
          )}

          {/* ── Maintenance ── */}
          {tab === 'maintenance' && (
            <div>
              <h1 className="dash-section-title">Maintenance Requests</h1>
              <p style={{ color: 'var(--gray-600)', marginBottom: 24, fontSize: 15 }}>Repair and maintenance issues reported through the website form.</p>
              <div className="dash-card" style={{ padding: 0, overflow: 'hidden' }}>
                <table className="data-table">
                  <thead>
                    <tr><th>Reported by</th><th>Property</th><th>Issue</th><th>Contact</th><th>Photos</th><th>Status</th><th>Submitted</th></tr>
                  </thead>
                  <tbody>
                    {maintenance.map(m => (
                      <tr key={m.id}>
                        <td style={{ fontWeight: 600, fontSize: 14 }}>{m.fullName}</td>
                        <td style={{ fontSize: 13, color: 'var(--gray-600)', maxWidth: 200 }}>{m.propertyAddress}</td>
                        <td style={{ fontSize: 13, color: 'var(--gray-600)', maxWidth: 260 }}>{m.issueDescription}</td>
                        <td style={{ fontSize: 12, color: 'var(--gray-400)' }}>
                          <div>{m.email}</div>
                          <div>{m.contactNumber}</div>
                        </td>
                        <td style={{ fontSize: 13 }}>
                          {m.photoUrls?.length
                            ? <a href={m.photoUrls[0]} target="_blank" rel="noreferrer" style={{ color: '#2563eb', fontWeight: 600 }}>{m.photoUrls.length} photo{m.photoUrls.length > 1 ? 's' : ''}</a>
                            : <span style={{ color: 'var(--gray-400)' }}>-</span>}
                        </td>
                        <td><StatusBadge status={m.status} /></td>
                        <td style={{ fontSize: 13, color: 'var(--gray-400)' }}>{fmtDate(m.submittedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!loaded.maintenance ? (
                  <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>Loading maintenance requests…</div>
                ) : maintenance.length === 0 ? (
                  <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>No maintenance requests yet.</div>
                ) : null}
              </div>
            </div>
          )}

          {/* ── Post Property ── */}
          {tab === 'post' && (
            <div>
              <h1 className="dash-section-title">Post a Property</h1>
              <p style={{ color: 'var(--gray-600)', marginBottom: 24, fontSize: 15 }}>Add a new property listing to the website.</p>
              <div className="dash-card">
                <PropertyForm
                  landlordId={profile.uid}
                  landlordName={profile.name}
                  onSuccess={reloadProperties}
                  onCancel={() => setTab('properties')}
                />
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}

export default function StaffDashboardPage() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading…</div>}>
      <StaffDashboardInner />
    </Suspense>
  );
}
