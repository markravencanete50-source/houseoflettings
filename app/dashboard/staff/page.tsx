'use client';
// app/dashboard/staff/page.tsx
// Staff dashboard — mirrors the admin dark-sidebar layout (shared global
// .dash-* classes). The sidebar is built from the user's enabled features
// (lib/staffAccess.ts): admins grant/revoke features per staff member from the
// admin Users tab, no code change needed. All data goes through the Admin-SDK
// /api/staff/* routes, which enforce the role AND the feature server-side.
import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import PropertyForm from '@/components/property/PropertyForm';
import { useAuth } from '@/hooks/useAuth';
import { Property } from '@/lib/types';
import { STAFF_FEATURES, staffPermissions, type StaffFeature } from '@/lib/staffAccess';

type Tab = StaffFeature;

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

interface ServiceOrderLine {
  name: string; categoryTitle: string; variantLabel?: string | null;
  addOns: { id: string; label: string; count?: number; amount: number }[];
  quantity: number; total: number; from?: boolean;
}
interface ServiceOrder {
  id: string;
  ref: string;
  customer: { fullName: string; email: string; phone: string; postcode?: string; address?: string; notes?: string };
  lines: ServiceOrderLine[];
  total: number;
  hasFrom?: boolean;
  status: string;
  proofOfPaymentUrls?: string[];
  createdAt: string | null;
}

interface Valuation {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  propertyType: string;
  bedrooms: string;
  preferredDateTime: string;
  notes?: string;
  status: string;
  createdAt: string | null;
}

interface GoogleReview {
  id: string;
  author_name: string;
  rating: number;
  text: string;
  relative_time_description: string;
  profile_photo_url: string;
  location: 'leeds' | 'manchester';
  createdAt: string | null;
}

const MAINT_STATUSES = ['open', 'in-progress', 'resolved', 'cancelled'] as const;
type MaintFilter = 'all' | (typeof MAINT_STATUSES)[number];

const badge = (status: string): { bg: string; color: string } => {
  const map: Record<string, { bg: string; color: string }> = {
    pending:       { bg: '#fff8e1', color: '#f57f17' },
    open:          { bg: '#fff8e1', color: '#f57f17' },
    reviewing:     { bg: '#e3f2fd', color: '#1565c0' },
    'in-progress': { bg: '#e3f2fd', color: '#1565c0' },
    contacted:     { bg: '#e3f2fd', color: '#1565c0' },
    confirmed:     { bg: '#e3f2fd', color: '#1565c0' },
    approved:      { bg: '#e8f5e9', color: '#2e7d32' },
    resolved:      { bg: '#e8f5e9', color: '#2e7d32' },
    paid:          { bg: '#e8f5e9', color: '#2e7d32' },
    completed:     { bg: '#ede7f6', color: '#6a1b9a' },
    rejected:      { bg: '#fce4ec', color: '#c62828' },
    cancelled:     { bg: '#fce4ec', color: '#c62828' },
    active:        { bg: '#e8f5e9', color: '#2e7d32' },
    inactive:      { bg: '#fce4ec', color: '#c62828' },
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

const EMPTY_REVIEW_FORM = {
  author_name: '', rating: 5, text: '', relative_time_description: '',
  location: 'leeds' as 'leeds' | 'manchester',
};

function StaffDashboardInner() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const perms = staffPermissions(profile);

  const [tab, setTab] = useState<Tab>('properties');
  const [properties, setProperties] = useState<Property[]>([]);
  const [applications, setApplications] = useState<TenantApplication[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceRequest[]>([]);
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [valuations, setValuations] = useState<Valuation[]>([]);
  const [reviews, setReviews] = useState<GoogleReview[]>([]);
  const [loaded, setLoaded] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [searchProp, setSearchProp] = useState('');
  const [maintFilter, setMaintFilter] = useState<MaintFilter>('all');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [reviewForm, setReviewForm] = useState(EMPTY_REVIEW_FORM);
  const [reviewSaving, setReviewSaving] = useState(false);
  const [reviewMsg, setReviewMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  // Auth guard — staff only.
  useEffect(() => {
    if (!authLoading && (!profile || profile.role !== 'staff')) {
      router.push('/admin-login');
    }
  }, [profile, authLoading, router]);

  // Keep the active tab within the permitted set.
  useEffect(() => {
    if (perms.length > 0 && !perms.includes(tab)) setTab(perms[0]);
  }, [perms, tab]);

  const authedFetch = async (path: string, init?: RequestInit) => {
    if (!user) throw new Error('Not signed in');
    const token = await user.getIdToken();
    return fetch(path, {
      ...init,
      headers: { ...(init?.headers || {}), Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
  };

  useEffect(() => {
    if (!profile || !user || !perms.includes(tab)) return;
    const load = async (path: string, key: string, apply: (j: any) => void) => {
      try {
        const res = await authedFetch(path);
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
    if (tab === 'orders' && !loaded.orders) load('/api/staff/orders', 'orders', j => setOrders(j.orders || []));
    if (tab === 'valuations' && !loaded.valuations) load('/api/staff/valuations', 'valuations', j => setValuations(j.valuations || []));
    if (tab === 'reviews' && !loaded.reviews) load('/api/staff/reviews', 'reviews', j => setReviews(j.reviews || []));
  }, [tab, profile, user]); // eslint-disable-line react-hooks/exhaustive-deps

  const reloadProperties = () => {
    setLoaded(l => ({ ...l, properties: false }));
    setTab('properties');
  };

  const updateMaintStatus = async (id: string, status: string) => {
    const prev = maintenance;
    setMaintenance(ms => ms.map(m => m.id === id ? { ...m, status } : m));
    try {
      const res = await authedFetch('/api/staff/maintenance', { method: 'PATCH', body: JSON.stringify({ id, status }) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (e) {
      console.error('maintenance status update failed:', e);
      setMaintenance(prev); // roll back
      alert('Could not update the status. Please try again.');
    }
  };

  const submitReview = async () => {
    setReviewMsg(null);
    if (!reviewForm.author_name.trim()) { setReviewMsg({ kind: 'err', text: 'Reviewer name is required.' }); return; }
    if (!reviewForm.text.trim()) { setReviewMsg({ kind: 'err', text: 'Review text is required.' }); return; }
    setReviewSaving(true);
    try {
      const res = await authedFetch('/api/staff/reviews', { method: 'POST', body: JSON.stringify(reviewForm) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || `HTTP ${res.status}`);
      setReviews(prev => [json.review, ...prev]);
      setReviewForm(EMPTY_REVIEW_FORM);
      setReviewMsg({ kind: 'ok', text: 'Review added.' });
      setTimeout(() => setReviewMsg(null), 3000);
    } catch (e: any) {
      setReviewMsg({ kind: 'err', text: e.message || 'Failed to save review.' });
    }
    setReviewSaving(false);
  };

  const deleteReview = async (id: string) => {
    if (!confirm('Delete this review?')) return;
    try {
      const res = await authedFetch(`/api/staff/reviews?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setReviews(prev => prev.filter(r => r.id !== id));
    } catch (e) {
      console.error('review delete failed:', e);
      alert('Could not delete the review. Please try again.');
    }
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

  const counts: Record<StaffFeature, number | null> = {
    properties: properties.length,
    applications: applications.length,
    maintenance: maintenance.length,
    orders: orders.length,
    valuations: valuations.length,
    reviews: reviews.length,
    post: null,
  };

  const navItems = STAFF_FEATURES.filter(f => perms.includes(f.id)).map(f => ({
    id: f.id as Tab,
    icon: f.icon,
    label: counts[f.id] === null ? f.label : `${f.label} (${counts[f.id]})`,
  }));

  const maintCounts: Record<MaintFilter, number> = {
    all: maintenance.length,
    open: maintenance.filter(m => m.status === 'open').length,
    'in-progress': maintenance.filter(m => m.status === 'in-progress').length,
    resolved: maintenance.filter(m => m.status === 'resolved').length,
    cancelled: maintenance.filter(m => m.status === 'cancelled').length,
  };
  const filteredMaint = maintenance.filter(m => maintFilter === 'all' || m.status === maintFilter);

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

          {perms.length === 0 && (
            <div className="dash-card" style={{ textAlign: 'center', padding: 60 }}>
              <div style={{ fontSize: 52, marginBottom: 16 }}>🔒</div>
              <h3 style={{ fontSize: 22, marginBottom: 10 }}>No sections enabled</h3>
              <p style={{ color: 'var(--gray-400)', fontSize: 15 }}>Ask an admin to enable dashboard features for your account.</p>
            </div>
          )}

          {errors[tab] && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 13.5, fontWeight: 600 }}>
              ⚠️ Couldn&rsquo;t load {tab}: {errors[tab]}
            </div>
          )}

          {/* ── Properties ── */}
          {tab === 'properties' && perms.includes('properties') && (
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
                  {perms.includes('post') && (
                    <button
                      onClick={() => setTab('post')}
                      style={{ padding: '10px 18px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      ➕ Post Property
                    </button>
                  )}
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
          {tab === 'applications' && perms.includes('applications') && (
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
          {tab === 'maintenance' && perms.includes('maintenance') && (
            <div>
              <h1 className="dash-section-title">Maintenance Requests</h1>
              <p style={{ color: 'var(--gray-600)', marginBottom: 20, fontSize: 15 }}>
                Repair and maintenance issues reported through the website form. Use the status dropdown on each row to keep the team up to date.
              </p>

              {/* Status filter chips */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
                {(['all', ...MAINT_STATUSES] as MaintFilter[]).map(f => {
                  const colors: Record<string, string> = {
                    all: '#374151', open: '#f57f17', 'in-progress': '#1565c0', resolved: '#2e7d32', cancelled: '#c62828',
                  };
                  const isActive = maintFilter === f;
                  return (
                    <button
                      key={f}
                      onClick={() => setMaintFilter(f)}
                      style={{
                        padding: '8px 18px', borderRadius: 6, fontSize: 13, fontWeight: 600,
                        cursor: 'pointer', border: `1px solid ${colors[f]}`,
                        background: isActive ? colors[f] : '#fff',
                        color: isActive ? '#fff' : colors[f],
                        textTransform: 'capitalize',
                      }}
                    >
                      {f === 'all' ? 'All' : f.replace('-', ' ')} ({maintCounts[f]})
                    </button>
                  );
                })}
              </div>

              <div className="dash-card" style={{ padding: 0, overflow: 'hidden' }}>
                <table className="data-table">
                  <thead>
                    <tr><th>Reported by</th><th>Property</th><th>Issue</th><th>Contact</th><th>Photos</th><th>Submitted</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {filteredMaint.map(m => (
                      <tr key={m.id}>
                        <td style={{ fontWeight: 600, fontSize: 14 }}>{m.fullName}</td>
                        <td style={{ fontSize: 13, color: 'var(--gray-600)', maxWidth: 180 }}>{m.propertyAddress}</td>
                        <td style={{ fontSize: 13, color: 'var(--gray-600)', maxWidth: 240 }}>{m.issueDescription}</td>
                        <td style={{ fontSize: 12, color: 'var(--gray-400)' }}>
                          <div>{m.email}</div>
                          <div>{m.contactNumber}</div>
                        </td>
                        <td style={{ fontSize: 13 }}>
                          {m.photoUrls?.length
                            ? <a href={m.photoUrls[0]} target="_blank" rel="noreferrer" style={{ color: '#2563eb', fontWeight: 600 }}>{m.photoUrls.length} photo{m.photoUrls.length > 1 ? 's' : ''}</a>
                            : <span style={{ color: 'var(--gray-400)' }}>-</span>}
                        </td>
                        <td style={{ fontSize: 13, color: 'var(--gray-400)' }}>{fmtDate(m.submittedAt)}</td>
                        <td>
                          <select
                            value={m.status}
                            onChange={e => updateMaintStatus(m.id, e.target.value)}
                            style={{
                              padding: '6px 8px', borderRadius: 6, fontSize: 12, cursor: 'pointer', outline: 'none',
                              border: `1px solid ${badge(m.status).color}`, color: badge(m.status).color,
                              background: badge(m.status).bg, fontWeight: 700,
                            }}
                          >
                            {MAINT_STATUSES.map(s => <option key={s} value={s}>{s.replace('-', ' ')}</option>)}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!loaded.maintenance ? (
                  <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>Loading maintenance requests…</div>
                ) : filteredMaint.length === 0 ? (
                  <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>
                    {maintFilter === 'all' ? 'No maintenance requests yet.' : `No ${maintFilter.replace('-', ' ')} requests.`}
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {/* ── Orders ── */}
          {tab === 'orders' && perms.includes('orders') && (
            <div>
              <h1 className="dash-section-title">Service Orders</h1>
              <p style={{ color: 'var(--gray-600)', marginBottom: 24, fontSize: 15 }}>
                Orders placed through Additional Services. Payment proof links open in a new tab.
              </p>
              {!loaded.orders ? (
                <div className="dash-card" style={{ textAlign: 'center', color: 'var(--gray-400)', padding: 40 }}>Loading orders…</div>
              ) : orders.length === 0 ? (
                <div className="dash-card" style={{ textAlign: 'center', color: 'var(--gray-400)', fontSize: 15, padding: '56px 24px' }}>
                  No orders yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {orders.map(o => {
                    const isOpen = expandedOrder === o.id;
                    return (
                      <div key={o.id} className="dash-card" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', flexWrap: 'wrap' }}>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                              <strong style={{ fontSize: 15, color: 'var(--navy)' }}>{o.customer?.fullName || '—'}</strong>
                              <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--gray-400)' }}>{o.ref}</span>
                              <StatusBadge status={o.status} />
                            </div>
                            <div style={{ fontSize: 12.5, color: 'var(--gray-400)', marginTop: 3 }}>
                              {o.customer?.email} · {o.customer?.phone} · {o.lines?.length || 0} item{(o.lines?.length || 0) !== 1 ? 's' : ''} · {fmtDate(o.createdAt)}
                            </div>
                          </div>
                          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--navy)' }}>
                            {o.hasFrom ? <span style={{ fontSize: 12, color: 'var(--gray-400)', fontWeight: 700 }}>from </span> : null}£{o.total}
                          </div>
                          <button onClick={() => setExpandedOrder(isOpen ? null : o.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-600)', fontSize: 13, fontWeight: 600 }}>
                            {isOpen ? 'Hide ▲' : 'Details ▼'}
                          </button>
                        </div>
                        {isOpen && (
                          <div style={{ borderTop: '1px solid var(--gray-100)', padding: '16px 20px', background: '#fafbfc' }}>
                            {o.lines?.map((l, li) => (
                              <div key={li} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--gray-100)' }}>
                                <div>
                                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--navy)' }}>{l.name}{l.quantity > 1 ? ` ×${l.quantity}` : ''}</div>
                                  <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{l.categoryTitle}</div>
                                  {l.variantLabel && <div style={{ fontSize: 12, color: 'var(--gray-600)' }}>{l.variantLabel}</div>}
                                  {l.addOns?.map((a, ai) => <div key={ai} style={{ fontSize: 12, color: 'var(--gray-600)' }}>+ {a.label}{a.count ? ` ×${a.count}` : ''} — £{a.amount}</div>)}
                                </div>
                                <div style={{ fontWeight: 700, color: 'var(--navy)', whiteSpace: 'nowrap' }}>{l.from ? 'from ' : ''}£{l.total}</div>
                              </div>
                            ))}
                            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginTop: 14, fontSize: 13, color: 'var(--gray-600)' }}>
                              <div><strong style={{ color: 'var(--navy)' }}>Postcode:</strong> {o.customer?.postcode || '—'}</div>
                              <div><strong style={{ color: 'var(--navy)' }}>Address:</strong> {o.customer?.address || '—'}</div>
                            </div>
                            {o.customer?.notes && <div style={{ marginTop: 8, fontSize: 13, color: 'var(--gray-600)' }}><strong style={{ color: 'var(--navy)' }}>Notes:</strong> {o.customer.notes}</div>}
                            {(o.proofOfPaymentUrls?.length || 0) > 0 && (
                              <div style={{ marginTop: 12 }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: '#15803d', marginBottom: 6 }}>Proof of payment</div>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                  {o.proofOfPaymentUrls!.map((url, i) => (
                                    <a key={i} href={url} target="_blank" rel="noopener noreferrer" style={{ padding: '4px 10px', background: '#f0fdf4', color: '#15803d', borderRadius: 4, fontSize: 12, fontWeight: 600, textDecoration: 'none', border: '1px solid #bbf7d0' }}>📄 Proof {i + 1}</a>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Valuations ── */}
          {tab === 'valuations' && perms.includes('valuations') && (
            <div>
              <h1 className="dash-section-title">Valuation Requests</h1>
              <p style={{ color: 'var(--gray-600)', marginBottom: 24, fontSize: 15 }}>All property valuation bookings from the website.</p>
              <div className="dash-card" style={{ padding: 0, overflow: 'hidden' }}>
                <table className="data-table">
                  <thead>
                    <tr><th>Customer</th><th>Property</th><th>Type / Beds</th><th>Preferred Date</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {valuations.map(v => (
                      <tr key={v.id}>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{v.fullName}</div>
                          <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{v.email}</div>
                          <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{v.phone}</div>
                        </td>
                        <td style={{ fontSize: 13, color: 'var(--gray-600)', maxWidth: 200 }}>{v.address}</td>
                        <td style={{ fontSize: 13 }}>
                          <div>{v.propertyType}</div>
                          <div style={{ color: 'var(--gray-400)' }}>{v.bedrooms}</div>
                        </td>
                        <td style={{ fontSize: 13, color: 'var(--gray-600)' }}>
                          {v.preferredDateTime
                            ? new Date(v.preferredDateTime).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
                            : '-'}
                        </td>
                        <td><StatusBadge status={v.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!loaded.valuations ? (
                  <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>Loading valuations…</div>
                ) : valuations.length === 0 ? (
                  <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>No valuation requests yet.</div>
                ) : null}
              </div>
            </div>
          )}

          {/* ── Reviews ── */}
          {tab === 'reviews' && perms.includes('reviews') && (
            <div>
              <h1 className="dash-section-title">Google Reviews</h1>
              <p style={{ color: 'var(--gray-600)', marginBottom: 24, fontSize: 15 }}>
                Add and manage reviews shown on the website. Only 4★ and 5★ reviews are displayed publicly.
              </p>

              <div className="dash-card" style={{ marginBottom: 28 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 18 }}>➕ Add New Review</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                  <input className="form-input" placeholder="Reviewer name *" value={reviewForm.author_name} onChange={e => setReviewForm(f => ({ ...f, author_name: e.target.value }))} />
                  <select className="form-input" value={reviewForm.location} onChange={e => setReviewForm(f => ({ ...f, location: e.target.value as 'leeds' | 'manchester' }))}>
                    <option value="leeds">📍 Leeds</option>
                    <option value="manchester">📍 Manchester</option>
                  </select>
                  <select className="form-input" value={reviewForm.rating} onChange={e => setReviewForm(f => ({ ...f, rating: Number(e.target.value) }))}>
                    <option value={5}>⭐⭐⭐⭐⭐ 5 Stars</option>
                    <option value={4}>⭐⭐⭐⭐ 4 Stars</option>
                  </select>
                  <input className="form-input" placeholder="Time label (e.g. 2 weeks ago)" value={reviewForm.relative_time_description} onChange={e => setReviewForm(f => ({ ...f, relative_time_description: e.target.value }))} />
                </div>
                <textarea className="form-input" rows={4} placeholder="Paste the review text from Google… *" value={reviewForm.text} onChange={e => setReviewForm(f => ({ ...f, text: e.target.value }))} style={{ resize: 'vertical', marginBottom: 14 }} />
                {reviewMsg && (
                  <div style={{
                    background: reviewMsg.kind === 'ok' ? '#e8f5e9' : '#fce4ec',
                    color: reviewMsg.kind === 'ok' ? '#2e7d32' : '#c62828',
                    padding: '10px 14px', borderRadius: 6, fontSize: 13, marginBottom: 14,
                  }}>
                    {reviewMsg.text}
                  </div>
                )}
                <button
                  onClick={submitReview}
                  disabled={reviewSaving}
                  style={{ padding: '12px 26px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 700, cursor: reviewSaving ? 'not-allowed' : 'pointer', opacity: reviewSaving ? 0.7 : 1 }}
                >
                  {reviewSaving ? 'Saving…' : '✓ Add Review'}
                </button>
              </div>

              {!loaded.reviews ? (
                <div className="dash-card" style={{ textAlign: 'center', color: 'var(--gray-400)', padding: 40 }}>Loading reviews…</div>
              ) : reviews.length === 0 ? (
                <div className="dash-card" style={{ textAlign: 'center', padding: 44 }}>
                  <div style={{ fontSize: 38, marginBottom: 10 }}>⭐</div>
                  <p style={{ color: 'var(--gray-400)', fontSize: 15 }}>No reviews yet. Add one above.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {reviews.map(r => (
                    <div key={r.id} className="dash-card" style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                        background: 'linear-gradient(135deg, #2563eb, #4a90d9)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontSize: 14, fontWeight: 700, overflow: 'hidden',
                      }}>
                        {r.profile_photo_url
                          ? <img src={r.profile_photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : (r.author_name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 700, fontSize: 14 }}>{r.author_name}</span>
                          <span style={{
                            padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                            background: r.location === 'leeds' ? '#eff6ff' : '#f0fdf4',
                            color: r.location === 'leeds' ? '#1d4ed8' : '#15803d',
                          }}>
                            📍 {r.location === 'leeds' ? 'Leeds' : 'Manchester'}
                          </span>
                          <span style={{ fontSize: 12, color: '#F59E0B', letterSpacing: 1 }}>{'★'.repeat(r.rating)}</span>
                          {r.relative_time_description && <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>{r.relative_time_description}</span>}
                        </div>
                        <p style={{ fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.6, margin: 0 }}>{r.text}</p>
                      </div>
                      <button className="btn-danger" onClick={() => deleteReview(r.id)} style={{ flexShrink: 0 }}>Delete</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Post Property ── */}
          {tab === 'post' && perms.includes('post') && (
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
