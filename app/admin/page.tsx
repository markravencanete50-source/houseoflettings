'use client';
// app/admin/page.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import PropertyForm from '@/components/property/PropertyForm';
import { useAuth } from '@/hooks/useAuth';
import {
  getAllUsers,
  getAllProperties,
  deleteUserRecord,
  adminDeleteProperty,
  adminSetPropertyStatus,
  getAnalytics,
} from '@/services/admin';
import { AppUser, Property } from '@/lib/types';
import { format } from 'date-fns';
import { db } from '@/lib/firebase';
import {
  collection, getDocs, orderBy, query, doc,
  updateDoc, addDoc, deleteDoc, serverTimestamp, Timestamp,
} from 'firebase/firestore';

type Tab = 'analytics' | 'users' | 'properties' | 'post' | 'edit' | 'valuations' | 'reviews' | 'applications';

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
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdAt: any;
}

interface GoogleReview {
  id: string;
  author_name: string;
  rating: number;
  text: string;
  relative_time_description: string;
  profile_photo_url: string;
  location: 'leeds' | 'manchester';
  createdAt: any;
}

interface TenantApplication {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  dob: string;
  nationality: string;
  niNumber: string;
  billingAddress: string;
  rightToRent: string;
  shareCode?: string;
  govIdUrls: string[];
  proofOfAddressUrls: string[];
  rightToRentDocUrls: string[];
  employmentStatus: string;
  employerPhone: string;
  employerEmail: string;
  annualIncome: string;
  additionalIncome: string;
  hasCCJ: string;
  wasBankrupt: string;
  payslipUrls: string[];
  bankStatementUrls: string[];
  landlordName: string;
  landlordEmail: string;
  landlordPhone: string;
  currentAddress: string;
  tenancyStart: string;
  tenancyEnd: string;
  reasonLeaving: string;
  leaseTerm: string;
  moveInDate: string;
  pets: string;
  guarantor: string;
  consentContact: boolean;
  consentDeclare: boolean;
  submissionDate: string;
  propertyAddress: string;
  rent: string;
  deposit: string;
  holdingDeposit: string;
  status: 'pending' | 'reviewing' | 'approved' | 'rejected';
  createdAt: any;
}

const EMPTY_REVIEW = {
  author_name: '',
  rating: 5,
  text: '',
  relative_time_description: '',
  profile_photo_url: '',
  location: 'leeds' as 'leeds' | 'manchester',
};

export default function AdminDashboard() {
  const router = useRouter();
  const { profile, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<Tab>('analytics');
  const [users, setUsers] = useState<AppUser[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [valuations, setValuations] = useState<Valuation[]>([]);
  const [reviews, setReviews] = useState<GoogleReview[]>([]);
  const [reviewForm, setReviewForm] = useState(EMPTY_REVIEW);
  const [reviewSaving, setReviewSaving] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [reviewFilter, setReviewFilter] = useState<'all' | 'leeds' | 'manchester'>('all');
  const [loading, setLoading] = useState(true);
  const [searchUser, setSearchUser] = useState('');
  const [searchProp, setSearchProp] = useState('');
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [applications, setApplications] = useState<TenantApplication[]>([]);
  const [appFilter, setAppFilter] = useState<'all' | 'pending' | 'reviewing' | 'approved' | 'rejected'>('all');
  const [expandedApp, setExpandedApp] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!profile || profile.role !== 'admin')) {
      router.push('/admin-login');
    }
  }, [profile, authLoading, router]);

  useEffect(() => {
    if (!profile || profile.role !== 'admin') return;
    Promise.all([
      getAllUsers(),
      getAllProperties(),
      getAnalytics(),
      getDocs(query(collection(db, 'valuationRequests'), orderBy('createdAt', 'desc'))),
      getDocs(query(collection(db, 'google_reviews'), orderBy('createdAt', 'desc'))),
      getDocs(query(collection(db, 'tenantApplications'), orderBy('createdAt', 'desc'))),
    ]).then(([u, p, a, valSnap, revSnap, appSnap]) => {
      setUsers(u);
      setProperties(p);
      setAnalytics(a);
      setValuations(valSnap.docs.map(d => ({ id: d.id, ...d.data() } as Valuation)));
      setReviews(revSnap.docs.map(d => ({ id: d.id, ...d.data() } as GoogleReview)));
      setApplications(appSnap.docs.map(d => ({ id: d.id, ...d.data() } as TenantApplication)));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [profile]);

  // ── Review handlers ──────────────────────────────────────────────────────────
  const handleReviewSubmit = async () => {
    setReviewError('');
    setReviewSuccess('');
    if (!reviewForm.author_name.trim()) { setReviewError('Reviewer name is required.'); return; }
    if (!reviewForm.text.trim()) { setReviewError('Review text is required.'); return; }
    if (reviewForm.rating < 4) { setReviewError('Only 4★ and 5★ reviews can be added.'); return; }
    setReviewSaving(true);
    try {
      const docRef = await addDoc(collection(db, 'google_reviews'), {
        ...reviewForm,
        createdAt: serverTimestamp(),
      });
      const newReview: GoogleReview = {
        id: docRef.id,
        ...reviewForm,
        createdAt: new Date(),
      };
      setReviews(prev => [newReview, ...prev]);
      setReviewForm(EMPTY_REVIEW);
      setReviewSuccess('Review added successfully!');
      setTimeout(() => setReviewSuccess(''), 3000);
    } catch {
      setReviewError('Failed to save review. Please try again.');
    }
    setReviewSaving(false);
  };

  const handleDeleteReview = async (id: string) => {
    if (!confirm('Delete this review?')) return;
    await deleteDoc(doc(db, 'google_reviews', id));
    setReviews(prev => prev.filter(r => r.id !== id));
  };

  // ── Property handlers ────────────────────────────────────────────────────────
  const handleDeleteUser = async (uid: string, name: string) => {
    if (!confirm(`Delete user "${name}"? This removes their Firestore record.`)) return;
    await deleteUserRecord(uid);
    setUsers(prev => prev.filter(u => u.uid !== uid));
  };

  const handleDeleteProperty = async (id: string) => {
    if (!confirm('Delete this property listing?')) return;
    await adminDeleteProperty(id);
    setProperties(prev => prev.filter(p => p.id !== id));
  };

  const handleToggleProperty = async (prop: Property) => {
    const newStatus = prop.status === 'active' ? 'inactive' : 'active';
    await adminSetPropertyStatus(prop.id!, newStatus);
    setProperties(prev =>
      prev.map(p => p.id === prop.id ? { ...p, status: newStatus } : p)
    );
  };

  const handleEditProperty = (prop: Property) => {
    setEditingProperty(prop);
    setTab('edit');
  };

  const handlePostSuccess = () => {
    getAllProperties().then(p => setProperties(p));
    setTab('properties');
  };

  const handleEditSuccess = () => {
    getAllProperties().then(p => setProperties(p));
    setEditingProperty(null);
    setTab('properties');
  };

  const handleEditCancel = () => {
    setEditingProperty(null);
    setTab('properties');
  };

  const handleValuationStatus = async (id: string, status: Valuation['status']) => {
    await updateDoc(doc(db, 'valuationRequests', id), { status });
    setValuations(prev => prev.map(v => v.id === id ? { ...v, status } : v));
  };

  const handleApplicationStatus = async (id: string, status: TenantApplication['status']) => {
    await updateDoc(doc(db, 'tenantApplications', id), { status, updatedAt: serverTimestamp() });
    setApplications(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchUser.toLowerCase()) ||
    u.email.toLowerCase().includes(searchUser.toLowerCase())
  );

  const filteredProps = properties.filter(p =>
    p.title.toLowerCase().includes(searchProp.toLowerCase()) ||
    p.location.toLowerCase().includes(searchProp.toLowerCase())
  );

  const filteredReviews = reviews.filter(r =>
    reviewFilter === 'all' ? true : r.location === reviewFilter
  );

  if (authLoading || loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '120px 0' }}>
      <div className="spinner" />
    </div>
  );

  const navItems: Array<{ id: Tab; icon: string; label: string }> = [
    { id: 'analytics',  icon: '📊', label: 'Analytics' },
    { id: 'users',      icon: '👥', label: `Users (${users.length})` },
    { id: 'properties', icon: '🏠', label: `Properties (${properties.length})` },
    { id: 'valuations', icon: '📋', label: `Valuations (${valuations.length})` },
    { id: 'reviews',    icon: '⭐', label: `Reviews (${reviews.length})` },
    { id: 'applications', icon: '📝', label: `Applications (${applications.length})` },
    { id: 'post',       icon: '➕', label: 'Post Property' },
    ...(editingProperty ? [{ id: 'edit' as Tab, icon: '✏️', label: 'Edit Property' }] : []),
  ];

  const statusColor: Record<Valuation['status'], { bg: string; color: string }> = {
    pending:   { bg: '#fff8e1', color: '#f57f17' },
    confirmed: { bg: '#e3f2fd', color: '#1565c0' },
    completed: { bg: '#e8f5e9', color: '#2e7d32' },
    cancelled: { bg: '#fce4ec', color: '#c62828' },
  };

  return (
    <>
      <Navbar />
      <div className="dash-layout">

        {/* ── Sidebar ── */}
        <aside className="dash-sidebar">
          <div style={{
            padding: '0 28px 28px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            marginBottom: 12,
          }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(192,57,43,0.2)', border: '1px solid rgba(192,57,43,0.4)',
              color: '#ff9090', borderRadius: 4, padding: '4px 10px', fontSize: 11,
              fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14,
            }}>
              🔒 Admin
            </div>
            <div style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>{profile?.name}</div>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 2 }}>{profile?.email}</div>
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

          <button
            className="dash-nav-item"
            onClick={() => router.push('/admin/guarantor-link')}
          >
            <span>🔗</span>
            Guarantor Link
          </button>
        </aside>

        {/* ── Main Content ── */}
        <main className="dash-content">

          {/* ── Analytics ── */}
          {tab === 'analytics' && analytics && (
            <div>
              <h1 className="dash-section-title">Platform Analytics</h1>
              <p style={{ color: 'var(--gray-600)', marginBottom: 32, fontSize: 15 }}>
                Overview of all platform activity.
              </p>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))',
                gap: 20, marginBottom: 36,
              }}>
                {[
                  { label: 'Total Users',        value: analytics.totalUsers,       icon: '👥', color: '#1565C0' },
                  { label: 'Landlords',           value: analytics.landlords,        icon: '🏠', color: '#2E7D32' },
                  { label: 'Tenants',             value: analytics.tenants,          icon: '🔑', color: '#E65100' },
                  { label: 'Total Listings',      value: analytics.totalProperties,  icon: '📋', color: '#6A1B9A' },
                  { label: 'Active Listings',     value: analytics.activeProperties, icon: '✅', color: '#00695C' },
                  { label: 'Total Chats',         value: analytics.totalChats,       icon: '💬', color: '#AD1457' },
                  { label: 'Valuations',          value: valuations.length,          icon: '📅', color: '#1a3c5e' },
                  { label: 'Pending Valuations',  value: valuations.filter(v => v.status === 'pending').length, icon: '⏳', color: '#f57f17' },
                  { label: 'Google Reviews',      value: reviews.length,             icon: '⭐', color: '#F59E0B' },
                  { label: 'Applications',         value: applications.length,                                    icon: '📝', color: '#0369a1' },
                  { label: 'Pending Applications', value: applications.filter(a => a.status === 'pending').length, icon: '⏳', color: '#b45309' },
                ].map(s => (
                  <div key={s.label} className="dash-card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{
                      width: 44, height: 44, background: `${s.color}15`, borderRadius: 8,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                    }}>
                      {s.icon}
                    </div>
                    <div>
                      <div style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 700, color: s.color }}>
                        {s.value}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 2 }}>{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <div className="dash-card">
                  <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Recent Users</h3>
                  {users.slice(0, 5).map(u => (
                    <div key={u.uid} style={{
                      display: 'flex', justifyContent: 'space-between',
                      padding: '8px 0', borderBottom: '1px solid var(--gray-100)',
                    }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>{u.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{u.email}</div>
                      </div>
                      <span className={`status-badge ${u.role === 'landlord' ? 'active' : u.role === 'admin' ? 'pending' : 'inactive'}`}>
                        {u.role}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="dash-card">
                  <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Recent Valuations</h3>
                  {valuations.slice(0, 5).map(v => (
                    <div key={v.id} style={{
                      display: 'flex', justifyContent: 'space-between',
                      padding: '8px 0', borderBottom: '1px solid var(--gray-100)',
                    }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>{v.fullName}</div>
                        <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{v.address}</div>
                      </div>
                      <span style={{
                        display: 'inline-block', padding: '3px 8px', borderRadius: 20,
                        fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                        background: statusColor[v.status]?.bg,
                        color: statusColor[v.status]?.color,
                      }}>
                        {v.status}
                      </span>
                    </div>
                  ))}
                  {valuations.length === 0 && (
                    <p style={{ color: 'var(--gray-400)', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>
                      No valuations yet.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Users ── */}
          {tab === 'users' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h1 className="dash-section-title">All Users</h1>
                <input
                  className="form-input"
                  style={{ width: 260 }}
                  placeholder="Search by name or email…"
                  value={searchUser}
                  onChange={e => setSearchUser(e.target.value)}
                />
              </div>
              <div className="dash-card" style={{ padding: 0, overflow: 'hidden' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th><th>Email</th><th>Role</th>
                      <th>Phone</th><th>Joined</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(u => (
                      <tr key={u.uid}>
                        <td style={{ fontWeight: 600, fontSize: 14 }}>{u.name}</td>
                        <td style={{ color: 'var(--gray-600)', fontSize: 13 }}>{u.email}</td>
                        <td>
                          <span className={`status-badge ${u.role === 'landlord' ? 'active' : u.role === 'admin' ? 'pending' : 'inactive'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td style={{ fontSize: 13, color: 'var(--gray-400)' }}>{u.phone || '—'}</td>
                        <td style={{ fontSize: 13, color: 'var(--gray-400)' }}>
                          {u.createdAt instanceof Date ? format(u.createdAt, 'd MMM yyyy') : '—'}
                        </td>
                        <td>
                          {u.role !== 'admin' && (
                            <button className="btn-danger" onClick={() => handleDeleteUser(u.uid, u.name)}>
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredUsers.length === 0 && (
                  <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>No users found.</div>
                )}
              </div>
            </div>
          )}

          {/* ── Properties ── */}
          {tab === 'properties' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h1 className="dash-section-title">All Properties</h1>
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
                    style={{
                      padding: '10px 18px', background: 'var(--red)', color: '#fff',
                      border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600,
                      cursor: 'pointer', whiteSpace: 'nowrap',
                    }}
                  >
                    ➕ Post Property
                  </button>
                </div>
              </div>
              <div className="dash-card" style={{ padding: 0, overflow: 'hidden' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Property</th><th>Location</th><th>Rent</th>
                      <th>Status</th><th>Beds</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProps.map(p => (
                      <tr key={p.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {p.images?.[0] && (
                              <img src={p.images[0]} alt=""
                                style={{ width: 44, height: 32, objectFit: 'cover', borderRadius: 4 }} />
                            )}
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 14 }}>
                                {p.title}
                                {p.featured && (
                                  <span style={{
                                    marginLeft: 8, fontSize: 10, fontWeight: 700,
                                    background: 'rgba(192,57,43,0.1)', color: 'var(--red)',
                                    border: '1px solid rgba(192,57,43,0.3)',
                                    borderRadius: 3, padding: '1px 6px',
                                    textTransform: 'uppercase' as const,
                                  }}>
                                    Featured
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>
                                {p.id?.slice(0, 8).toUpperCase()}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ fontSize: 13, color: 'var(--gray-600)' }}>{p.location}</td>
                        <td style={{ fontWeight: 700, color: 'var(--red)' }}>£{p.price.toLocaleString()}</td>
                        <td><span className={`status-badge ${p.status}`}>{p.status}</span></td>
                        <td style={{ fontSize: 13 }}>{p.bedrooms === 0 ? 'Studio' : `${p.bedrooms}`}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              onClick={() => handleEditProperty(p)}
                              style={{
                                padding: '5px 10px', background: 'transparent',
                                border: '1px solid #1565c0', color: '#1565c0',
                                borderRadius: 4, fontSize: 11, cursor: 'pointer',
                              }}
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => handleToggleProperty(p)}
                              style={{
                                padding: '5px 10px', background: 'transparent',
                                border: `1px solid ${p.status === 'active' ? '#f57f17' : '#2e7d32'}`,
                                color: p.status === 'active' ? '#f57f17' : '#2e7d32',
                                borderRadius: 4, fontSize: 11, cursor: 'pointer',
                              }}
                            >
                              {p.status === 'active' ? 'Deactivate' : 'Approve'}
                            </button>
                            <button className="btn-danger" onClick={() => handleDeleteProperty(p.id!)}>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredProps.length === 0 && (
                  <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>
                    No properties found.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Valuations ── */}
          {tab === 'valuations' && (
            <div>
              <h1 className="dash-section-title">Valuation Requests</h1>
              <p style={{ color: 'var(--gray-600)', marginBottom: 24, fontSize: 15 }}>
                All property valuation bookings from the website.
              </p>
              {valuations.length === 0 ? (
                <div className="dash-card" style={{ textAlign: 'center', padding: 60 }}>
                  <div style={{ fontSize: 52, marginBottom: 16 }}>📋</div>
                  <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, marginBottom: 12 }}>No valuations yet</h3>
                  <p style={{ color: 'var(--gray-400)', fontSize: 15 }}>
                    Valuation requests will appear here when customers book through the website.
                  </p>
                </div>
              ) : (
                <div className="dash-card" style={{ padding: 0, overflow: 'hidden' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Customer</th><th>Property</th><th>Type / Beds</th>
                        <th>Preferred Date</th><th>Status</th><th>Actions</th>
                      </tr>
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
                              : '—'}
                          </td>
                          <td>
                            <span style={{
                              display: 'inline-block', padding: '4px 10px', borderRadius: 20,
                              fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                              background: statusColor[v.status]?.bg,
                              color: statusColor[v.status]?.color,
                            }}>
                              {v.status}
                            </span>
                          </td>
                          <td>
                            <select
                              value={v.status}
                              onChange={e => handleValuationStatus(v.id, e.target.value as Valuation['status'])}
                              style={{
                                padding: '5px 8px', border: '1px solid var(--gray-200)',
                                borderRadius: 4, fontSize: 12, cursor: 'pointer', outline: 'none',
                              }}
                            >
                              <option value="pending">Pending</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="completed">Completed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── Reviews ── */}
          {tab === 'reviews' && (
            <div>
              <h1 className="dash-section-title">Google Reviews</h1>
              <p style={{ color: 'var(--gray-600)', marginBottom: 32, fontSize: 15 }}>
                Add and manage reviews shown on the website. Only 4★ and 5★ reviews are displayed publicly.
              </p>

              {/* Add Review Form */}
              <div className="dash-card" style={{ marginBottom: 32 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: 'var(--gray-800)' }}>
                  ➕ Add New Review
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--gray-600)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
                      Reviewer Name *
                    </label>
                    <input
                      className="form-input"
                      placeholder="e.g. James Thornton"
                      value={reviewForm.author_name}
                      onChange={e => setReviewForm(f => ({ ...f, author_name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--gray-600)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
                      Location *
                    </label>
                    <select
                      className="form-input"
                      value={reviewForm.location}
                      onChange={e => setReviewForm(f => ({ ...f, location: e.target.value as 'leeds' | 'manchester' }))}
                    >
                      <option value="leeds">📍 Leeds</option>
                      <option value="manchester">📍 Manchester</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--gray-600)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
                      Star Rating *
                    </label>
                    <select
                      className="form-input"
                      value={reviewForm.rating}
                      onChange={e => setReviewForm(f => ({ ...f, rating: Number(e.target.value) }))}
                    >
                      <option value={5}>⭐⭐⭐⭐⭐ 5 Stars</option>
                      <option value={4}>⭐⭐⭐⭐ 4 Stars</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--gray-600)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
                      Time Label
                    </label>
                    <input
                      className="form-input"
                      placeholder="e.g. 2 weeks ago"
                      value={reviewForm.relative_time_description}
                      onChange={e => setReviewForm(f => ({ ...f, relative_time_description: e.target.value }))}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--gray-600)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
                    Review Text *
                  </label>
                  <textarea
                    className="form-input"
                    rows={4}
                    placeholder="Paste the review text from Google…"
                    value={reviewForm.text}
                    onChange={e => setReviewForm(f => ({ ...f, text: e.target.value }))}
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--gray-600)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
                    Profile Photo URL <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional — falls back to initials)</span>
                  </label>
                  <input
                    className="form-input"
                    placeholder="https://…"
                    value={reviewForm.profile_photo_url}
                    onChange={e => setReviewForm(f => ({ ...f, profile_photo_url: e.target.value }))}
                  />
                </div>

                {reviewError && (
                  <div style={{ background: '#fce4ec', color: '#c62828', padding: '10px 14px', borderRadius: 6, fontSize: 13, marginBottom: 14 }}>
                    {reviewError}
                  </div>
                )}
                {reviewSuccess && (
                  <div style={{ background: '#e8f5e9', color: '#2e7d32', padding: '10px 14px', borderRadius: 6, fontSize: 13, marginBottom: 14 }}>
                    {reviewSuccess}
                  </div>
                )}

                <button
                  onClick={handleReviewSubmit}
                  disabled={reviewSaving}
                  style={{
                    padding: '12px 28px', background: '#2563eb', color: '#fff',
                    border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 700,
                    cursor: reviewSaving ? 'not-allowed' : 'pointer',
                    opacity: reviewSaving ? 0.7 : 1,
                    fontFamily: "'Poppins', sans-serif",
                  }}
                >
                  {reviewSaving ? 'Saving…' : '✓ Add Review'}
                </button>
              </div>

              {/* Filter tabs */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                {(['all', 'leeds', 'manchester'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setReviewFilter(f)}
                    style={{
                      padding: '8px 18px', borderRadius: 6, fontSize: 13, fontWeight: 600,
                      cursor: 'pointer', border: '1px solid',
                      background: reviewFilter === f ? '#2563eb' : '#fff',
                      color: reviewFilter === f ? '#fff' : '#374151',
                      borderColor: reviewFilter === f ? '#2563eb' : '#e5e7eb',
                      textTransform: 'capitalize',
                    }}
                  >
                    {f === 'all' ? `All (${reviews.length})` : f === 'leeds' ? `📍 Leeds (${reviews.filter(r => r.location === 'leeds').length})` : `📍 Manchester (${reviews.filter(r => r.location === 'manchester').length})`}
                  </button>
                ))}
              </div>

              {/* Reviews list */}
              {filteredReviews.length === 0 ? (
                <div className="dash-card" style={{ textAlign: 'center', padding: 48 }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>⭐</div>
                  <p style={{ color: 'var(--gray-400)', fontSize: 15 }}>No reviews yet. Add one above.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {filteredReviews.map(r => (
                    <div key={r.id} className="dash-card" style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                      {/* Avatar */}
                      <div style={{
                        width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                        background: r.profile_photo_url ? 'transparent' : 'linear-gradient(135deg, #2563eb, #4a90d9)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontSize: 14, fontWeight: 700, overflow: 'hidden',
                      }}>
                        {r.profile_photo_url
                          ? <img src={r.profile_photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : r.author_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                        }
                      </div>

                      {/* Content */}
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
                          <div style={{ display: 'flex', gap: 2 }}>
                            {[1,2,3,4,5].map(i => (
                              <svg key={i} width="13" height="13" viewBox="0 0 24 24" fill={i <= r.rating ? '#F59E0B' : '#e5e7eb'}>
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                              </svg>
                            ))}
                          </div>
                          {r.relative_time_description && (
                            <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>{r.relative_time_description}</span>
                          )}
                        </div>
                        <p style={{ fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.6, margin: 0 }}>{r.text}</p>
                      </div>

                      {/* Delete */}
                      <button
                        className="btn-danger"
                        onClick={() => handleDeleteReview(r.id)}
                        style={{ flexShrink: 0 }}
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Applications ── */}
          {tab === 'applications' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <h1 className="dash-section-title">Tenancy Applications</h1>
              </div>
              <p style={{ color: 'var(--gray-600)', marginBottom: 24, fontSize: 15 }}>
                All tenancy applications submitted via the website.
              </p>

              {/* Filter tabs */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
                {(['all', 'pending', 'reviewing', 'approved', 'rejected'] as const).map(f => {
                  const count = f === 'all' ? applications.length : applications.filter(a => a.status === f).length;
                  const colors: Record<string, { bg: string; color: string }> = {
                    all:       { bg: '#f1f5f9', color: '#374151' },
                    pending:   { bg: '#fff8e1', color: '#f57f17' },
                    reviewing: { bg: '#e3f2fd', color: '#1565c0' },
                    approved:  { bg: '#e8f5e9', color: '#2e7d32' },
                    rejected:  { bg: '#fce4ec', color: '#c62828' },
                  };
                  const isActive = appFilter === f;
                  return (
                    <button
                      key={f}
                      onClick={() => setAppFilter(f)}
                      style={{
                        padding: '8px 18px', borderRadius: 6, fontSize: 13, fontWeight: 600,
                        cursor: 'pointer', border: '1px solid',
                        background: isActive ? colors[f].color : '#fff',
                        color: isActive ? '#fff' : colors[f].color,
                        borderColor: colors[f].color,
                        textTransform: 'capitalize',
                      }}
                    >
                      {f} ({count})
                    </button>
                  );
                })}
              </div>

              {applications.filter(a => appFilter === 'all' || a.status === appFilter).length === 0 ? (
                <div className="dash-card" style={{ textAlign: 'center', padding: 60 }}>
                  <div style={{ fontSize: 52, marginBottom: 16 }}>📝</div>
                  <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, marginBottom: 12 }}>No applications yet</h3>
                  <p style={{ color: 'var(--gray-400)', fontSize: 15 }}>
                    Tenancy applications will appear here when submitted via the website.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {applications
                    .filter(a => appFilter === 'all' || a.status === appFilter)
                    .map(a => {
                      const isExpanded = expandedApp === a.id;
                      const statusColors: Record<string, { bg: string; color: string }> = {
                        pending:   { bg: '#fff8e1', color: '#f57f17' },
                        reviewing: { bg: '#e3f2fd', color: '#1565c0' },
                        approved:  { bg: '#e8f5e9', color: '#2e7d32' },
                        rejected:  { bg: '#fce4ec', color: '#c62828' },
                      };
                      const sc = statusColors[a.status] || statusColors.pending;

                      return (
                        <div key={a.id} className="dash-card" style={{ padding: 0, overflow: 'hidden' }}>
                          {/* Header row */}
                          <div
                            style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '20px 24px', cursor: 'pointer' }}
                            onClick={() => setExpandedApp(isExpanded ? null : a.id)}
                          >
                            {/* Avatar */}
                            <div style={{
                              width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                              background: 'linear-gradient(135deg, #0a1628, #2563eb)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: '#fff', fontSize: 14, fontWeight: 700,
                            }}>
                              {a.fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                            </div>

                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                                <span style={{ fontWeight: 700, fontSize: 15 }}>{a.fullName}</span>
                                <span style={{
                                  padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                                  textTransform: 'uppercase', background: sc.bg, color: sc.color,
                                }}>
                                  {a.status}
                                </span>
                              </div>
                              <div style={{ fontSize: 13, color: 'var(--gray-400)', marginTop: 2 }}>
                                {a.email} · {a.phone} · Move-in: {a.moveInDate ? new Date(a.moveInDate).toLocaleDateString('en-GB') : '—'}
                              </div>
                            </div>

                            {/* Status selector */}
                            <select
                              value={a.status}
                              onClick={e => e.stopPropagation()}
                              onChange={e => handleApplicationStatus(a.id, e.target.value as TenantApplication['status'])}
                              style={{
                                padding: '7px 10px', border: '1px solid var(--gray-200)',
                                borderRadius: 6, fontSize: 12, cursor: 'pointer', outline: 'none',
                                background: '#fff', flexShrink: 0,
                              }}
                            >
                              <option value="pending">Pending</option>
                              <option value="reviewing">Reviewing</option>
                              <option value="approved">Approved</option>
                              <option value="rejected">Rejected</option>
                            </select>

                            <span style={{ fontSize: 18, color: 'var(--gray-400)', flexShrink: 0 }}>
                              {isExpanded ? '▲' : '▼'}
                            </span>
                          </div>

                          {/* Expanded detail */}
                          {isExpanded && (
                            <div style={{ borderTop: '1px solid var(--gray-100)', padding: '24px', background: '#fafafa' }}>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>

                                {/* Personal */}
                                <div>
                                  <h4 style={{ fontSize: 12, fontWeight: 800, color: '#2563eb', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>Personal Details</h4>
                                  {[
                                    ['Full Name', a.fullName],
                                    ['Date of Birth', a.dob],
                                    ['Nationality', a.nationality],
                                    ['NI Number', a.niNumber],
                                    ['Email', a.email],
                                    ['Phone', a.phone],
                                    ['Right to Rent', a.rightToRent],
                                    ['Share Code', a.shareCode || '—'],
                                  ].map(([label, value]) => (
                                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}>
                                      <span style={{ color: '#6b7280', fontWeight: 500 }}>{label}</span>
                                      <span style={{ color: '#111827', fontWeight: 600, textAlign: 'right', maxWidth: '55%' }}>{value}</span>
                                    </div>
                                  ))}
                                  <div style={{ marginTop: 10 }}>
                                    <p style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 6 }}>Billing Address</p>
                                    <p style={{ fontSize: 13, color: '#111827', lineHeight: 1.5 }}>{a.billingAddress}</p>
                                  </div>
                                </div>

                                {/* Employment */}
                                <div>
                                  <h4 style={{ fontSize: 12, fontWeight: 800, color: '#2563eb', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>Employment & Finance</h4>
                                  {[
                                    ['Employment Status', a.employmentStatus],
                                    ['Employer Phone', a.employerPhone],
                                    ['Employer Email', a.employerEmail],
                                    ['Annual Income', a.annualIncome],
                                    ['Additional Income', a.additionalIncome],
                                    ['CCJs', a.hasCCJ],
                                    ['Bankruptcy', a.wasBankrupt],
                                  ].map(([label, value]) => (
                                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}>
                                      <span style={{ color: '#6b7280', fontWeight: 500 }}>{label}</span>
                                      <span style={{ color: '#111827', fontWeight: 600, textAlign: 'right', maxWidth: '55%' }}>{value}</span>
                                    </div>
                                  ))}
                                </div>

                                {/* Landlord */}
                                <div>
                                  <h4 style={{ fontSize: 12, fontWeight: 800, color: '#2563eb', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>Landlord & Tenancy</h4>
                                  {[
                                    ["Landlord's Name", a.landlordName],
                                    ["Landlord's Email", a.landlordEmail],
                                    ["Landlord's Phone", a.landlordPhone],
                                    ['Current Address', a.currentAddress],
                                    ['Tenancy Start', a.tenancyStart],
                                    ['Tenancy End', a.tenancyEnd],
                                    ['Lease Term', a.leaseTerm],
                                    ['Move-In Date', a.moveInDate ? new Date(a.moveInDate).toLocaleDateString('en-GB') : '—'],
                                    ['Pets', a.pets],
                                    ['Guarantor', a.guarantor],
                                  ].map(([label, value]) => (
                                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}>
                                      <span style={{ color: '#6b7280', fontWeight: 500 }}>{label}</span>
                                      <span style={{ color: '#111827', fontWeight: 600, textAlign: 'right', maxWidth: '55%' }}>{value}</span>
                                    </div>
                                  ))}
                                  <div style={{ marginTop: 10 }}>
                                    <p style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 4 }}>Reason for Leaving</p>
                                    <p style={{ fontSize: 13, color: '#111827', lineHeight: 1.5 }}>{a.reasonLeaving}</p>
                                  </div>
                                </div>

                                {/* Documents */}
                                <div>
                                  <h4 style={{ fontSize: 12, fontWeight: 800, color: '#2563eb', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>Uploaded Documents</h4>
                                  {[
                                    { label: 'Government ID / Passport', urls: a.govIdUrls },
                                    { label: 'Proof of Address', urls: a.proofOfAddressUrls },
                                    { label: 'Right to Rent Doc', urls: a.rightToRentDocUrls },
                                    { label: 'Payslips', urls: a.payslipUrls },
                                    { label: 'Bank Statements', urls: a.bankStatementUrls },
                                  ].map(({ label, urls }) => (
                                    <div key={label} style={{ marginBottom: 12 }}>
                                      <p style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 4 }}>{label}</p>
                                      {urls && urls.length > 0 ? (
                                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                          {urls.map((url: string, i: number) => (
                                            <a
                                              key={i}
                                              href={url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              style={{
                                                padding: '4px 10px', background: '#eff6ff',
                                                color: '#2563eb', borderRadius: 4, fontSize: 12,
                                                fontWeight: 600, textDecoration: 'none',
                                                border: '1px solid #bfdbfe',
                                              }}
                                            >
                                              📄 File {i + 1}
                                            </a>
                                          ))}
                                        </div>
                                      ) : (
                                        <span style={{ fontSize: 12, color: '#9ca3af' }}>No files</span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Submission date */}
                              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#9ca3af' }}>
                                <span>Submitted: {a.submissionDate ? new Date(a.submissionDate).toLocaleDateString('en-GB') : '—'}</span>
                                <span>Application ID: {a.id.slice(0, 8).toUpperCase()}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* ── Post Property ── */}
          {tab === 'post' && profile && (
            <div>
              <h1 className="dash-section-title">Post a Property</h1>
              <p style={{ color: 'var(--gray-600)', marginBottom: 8, fontSize: 15 }}>
                Post a listing as admin. It will appear publicly and automatically marked as{' '}
                <strong style={{ color: 'var(--red)' }}>Featured</strong>.
              </p>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: 'rgba(192,57,43,0.08)',
                border: '1px solid rgba(192,57,43,0.2)',
                borderRadius: 8, padding: '12px 16px', marginBottom: 28,
              }}>
                <span style={{ fontSize: 18 }}>⭐</span>
                <p style={{ fontSize: 13, color: 'var(--gray-600)', margin: 0 }}>
                  This listing will be saved under your admin account and pinned as{' '}
                  <strong>Featured</strong> at the top of search results.
                </p>
              </div>
              <div className="dash-card">
                <PropertyForm
                  landlordId={profile.uid}
                  landlordName={profile.name}
                  adminOverride={{ featured: true }}
                  onSuccess={handlePostSuccess}
                  onCancel={() => setTab('properties')}
                />
              </div>
            </div>
          )}

          {/* ── Edit Property ── */}
          {tab === 'edit' && profile && editingProperty && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <button
                  onClick={handleEditCancel}
                  style={{
                    padding: '6px 12px', background: 'transparent',
                    border: '1px solid var(--gray-200)', borderRadius: 4,
                    fontSize: 12, cursor: 'pointer', color: 'var(--gray-600)',
                  }}
                >
                  ← Back to Properties
                </button>
              </div>
              <h1 className="dash-section-title">Edit Property</h1>
              <p style={{ color: 'var(--gray-600)', marginBottom: 8, fontSize: 15 }}>
                Editing: <strong>{editingProperty.title}</strong>
              </p>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: 'rgba(21,101,192,0.08)',
                border: '1px solid rgba(21,101,192,0.2)',
                borderRadius: 8, padding: '12px 16px', marginBottom: 28,
              }}>
                <span style={{ fontSize: 18 }}>✏️</span>
                <p style={{ fontSize: 13, color: 'var(--gray-600)', margin: 0 }}>
                  Changes will update the live listing immediately after saving.
                </p>
              </div>
              <div className="dash-card">
                <PropertyForm
                  landlordId={editingProperty.landlordId || profile.uid}
                  landlordName={editingProperty.landlordName || profile.name}
                  existing={editingProperty}
                  adminOverride={{ featured: editingProperty.featured }}
                  onSuccess={handleEditSuccess}
                  onCancel={handleEditCancel}
                />
              </div>
            </div>
          )}

        </main>
      </div>
    </>
  );
}
