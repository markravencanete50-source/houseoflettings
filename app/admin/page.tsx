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
import { collection, getDocs, orderBy, query, doc, updateDoc } from 'firebase/firestore';

type Tab = 'analytics' | 'users' | 'properties' | 'post' | 'edit' | 'valuations';

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

export default function AdminDashboard() {
  const router = useRouter();
  const { profile, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<Tab>('analytics');
  const [users, setUsers] = useState<AppUser[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [valuations, setValuations] = useState<Valuation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchUser, setSearchUser] = useState('');
  const [searchProp, setSearchProp] = useState('');
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);

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
    ]).then(([u, p, a, valSnap]) => {
      setUsers(u);
      setProperties(p);
      setAnalytics(a);
      setValuations(valSnap.docs.map(d => ({ id: d.id, ...d.data() } as Valuation)));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [profile]);

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

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchUser.toLowerCase()) ||
    u.email.toLowerCase().includes(searchUser.toLowerCase())
  );

  const filteredProps = properties.filter(p =>
    p.title.toLowerCase().includes(searchProp.toLowerCase()) ||
    p.location.toLowerCase().includes(searchProp.toLowerCase())
  );

  if (authLoading || loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '120px 0' }}>
      <div className="spinner" />
    </div>
  );

  // Only show 'edit' in nav when actively editing
  const navItems: Array<{ id: Tab; icon: string; label: string }> = [
    { id: 'analytics',   icon: '📊', label: 'Analytics' },
    { id: 'users',       icon: '👥', label: `Users (${users.length})` },
    { id: 'properties',  icon: '🏠', label: `Properties (${properties.length})` },
    { id: 'valuations',  icon: '📋', label: `Valuations (${valuations.length})` },
    { id: 'post',        icon: '➕', label: 'Post Property' },
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
                  { label: 'Total Users',      value: analytics.totalUsers,       icon: '👥', color: '#1565C0' },
                  { label: 'Landlords',        value: analytics.landlords,        icon: '🏠', color: '#2E7D32' },
                  { label: 'Tenants',          value: analytics.tenants,          icon: '🔑', color: '#E65100' },
                  { label: 'Total Listings',   value: analytics.totalProperties,  icon: '📋', color: '#6A1B9A' },
                  { label: 'Active Listings',  value: analytics.activeProperties, icon: '✅', color: '#00695C' },
                  { label: 'Total Chats',      value: analytics.totalChats,       icon: '💬', color: '#AD1457' },
                  { label: 'Valuations',       value: valuations.length,          icon: '📅', color: '#1a3c5e' },
                  { label: 'Pending Valuations', value: valuations.filter(v => v.status === 'pending').length, icon: '⏳', color: '#f57f17' },
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
                                border: '1px solid #1565c0',
                                color: '#1565c0',
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
                        <th>Customer</th>
                        <th>Property</th>
                        <th>Type / Beds</th>
                        <th>Preferred Date</th>
                        <th>Status</th>
                        <th>Actions</th>
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
