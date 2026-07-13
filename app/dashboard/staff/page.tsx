'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { Property } from '@/lib/types';

type Tab = 'applications' | 'properties' | 'post-property';

interface TenantApplication {
  id: string;
  propertyId: string;
  propertyAddress: string;
  fullName: string;
  email: string;
  phone: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Date;
}

function StaffDashboardInner() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<Tab>('applications');
  const [applications, setApplications] = useState<TenantApplication[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [appLoading, setAppLoading] = useState(false);
  const [propLoading, setPropLoading] = useState(false);

  // Auth guard
  useEffect(() => {
    if (!authLoading && (!profile || profile.role !== 'staff')) {
      router.push('/login');
    }
  }, [profile, authLoading, router]);

  // Load applications
  useEffect(() => {
    if (tab === 'applications' && profile && user) {
      setAppLoading(true);
      user.getIdToken()
        .then(token => fetch('/api/staff/applications', { headers: { Authorization: `Bearer ${token}` } }))
        .then(r => r.json())
        .then(data => setApplications(data.applications || []))
        .catch(e => console.error('Failed to load applications:', e))
        .finally(() => setAppLoading(false));
    }
  }, [tab, profile, user]);

  // Load properties
  useEffect(() => {
    if ((tab === 'properties' || tab === 'post-property') && profile && user) {
      setPropLoading(true);
      user.getIdToken()
        .then(token => fetch('/api/staff/properties', { headers: { Authorization: `Bearer ${token}` } }))
        .then(r => r.json())
        .then(data => setProperties(data.properties || []))
        .catch(e => console.error('Failed to load properties:', e))
        .finally(() => setPropLoading(false));
    }
  }, [tab, profile, user]);

  if (authLoading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;

  return (
    <main style={{ background: '#f3f4f6', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ paddingTop: 96, paddingBottom: 60, padding: '96px 5% 60px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Staff Dashboard</h1>
          <p style={{ fontSize: 15, color: '#475569', marginBottom: 32 }}>
            Welcome, {profile?.name}. You can view applications, manage properties, and post new listings.
          </p>

          {/* Tab navigation */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 32, borderBottom: '1px solid #e5e7eb', paddingBottom: 16 }}>
            {(['applications', 'properties', 'post-property'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: '8px 16px',
                  fontSize: 14,
                  fontWeight: tab === t ? 700 : 500,
                  color: tab === t ? '#2563eb' : '#6b7280',
                  background: 'none',
                  border: 'none',
                  borderBottom: tab === t ? '2px solid #2563eb' : 'none',
                  cursor: 'pointer',
                  marginBottom: -17,
                }}
              >
                {t === 'applications' && 'Applications'}
                {t === 'properties' && 'Properties'}
                {t === 'post-property' && 'Post Property'}
              </button>
            ))}
          </div>

          {/* Applications tab */}
          {tab === 'applications' && (
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', padding: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>Tenant Applications</h2>
              {appLoading ? (
                <p style={{ color: '#6b7280' }}>Loading applications...</p>
              ) : applications.length === 0 ? (
                <p style={{ color: '#6b7280' }}>No applications at this time.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                        <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 700, color: '#374151' }}>Applicant</th>
                        <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 700, color: '#374151' }}>Property</th>
                        <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 700, color: '#374151' }}>Email</th>
                        <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 700, color: '#374151' }}>Phone</th>
                        <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 700, color: '#374151' }}>Status</th>
                        <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 700, color: '#374151' }}>Submitted</th>
                      </tr>
                    </thead>
                    <tbody>
                      {applications.map(app => (
                        <tr key={app.id} style={{ borderBottom: '1px solid #eef0f5' }}>
                          <td style={{ padding: '12px 8px', color: '#111827' }}>{app.fullName}</td>
                          <td style={{ padding: '12px 8px', color: '#111827' }}>{app.propertyAddress}</td>
                          <td style={{ padding: '12px 8px', color: '#111827' }}>{app.email}</td>
                          <td style={{ padding: '12px 8px', color: '#111827' }}>{app.phone}</td>
                          <td style={{ padding: '12px 8px' }}>
                            <span style={{
                              padding: '4px 12px',
                              borderRadius: 6,
                              fontSize: 12,
                              fontWeight: 600,
                              background: app.status === 'pending' ? '#fef3c7' : app.status === 'approved' ? '#d1fae5' : '#fee2e2',
                              color: app.status === 'pending' ? '#92400e' : app.status === 'approved' ? '#065f46' : '#991b1b',
                            }}>
                              {app.status}
                            </span>
                          </td>
                          <td style={{ padding: '12px 8px', color: '#6b7280', fontSize: 13 }}>
                            {new Date(app.submittedAt).toLocaleDateString('en-GB')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Properties tab */}
          {tab === 'properties' && (
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', padding: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>All Properties</h2>
              {propLoading ? (
                <p style={{ color: '#6b7280' }}>Loading properties...</p>
              ) : properties.length === 0 ? (
                <p style={{ color: '#6b7280' }}>No properties available.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                  {properties.map(prop => (
                    <div key={prop.id} style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: 12,
                      overflow: 'hidden',
                      background: '#f9fafb',
                    }}>
                      {prop.images?.[0] && (
                        <img src={prop.images[0]} alt={prop.title} style={{ width: '100%', height: 180, objectFit: 'cover' }} />
                      )}
                      <div style={{ padding: 12 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>{prop.title}</h3>
                        <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 8px' }}>{prop.location}</p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>£{prop.price}/mo</span>
                          <span style={{
                            fontSize: 11,
                            fontWeight: 600,
                            padding: '4px 8px',
                            borderRadius: 4,
                            background: prop.status === 'active' ? '#d1fae5' : '#fee2e2',
                            color: prop.status === 'active' ? '#065f46' : '#991b1b',
                          }}>
                            {prop.status}
                          </span>
                        </div>
                        <p style={{ fontSize: 12, color: '#6b7280', margin: '8px 0 0' }}>
                          {prop.bedrooms === 0 ? 'Studio' : `${prop.bedrooms} bed`} · {prop.bathrooms} bath
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Post Property tab */}
          {tab === 'post-property' && (
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', padding: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Post a New Property</h2>
              <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 24 }}>
                Use this form to add a new property listing to the platform.
              </p>
              <div style={{ background: '#f3f4f6', border: '2px dashed #d1d5db', borderRadius: 10, padding: 40, textAlign: 'center' }}>
                <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>
                  Property posting interface coming soon. Contact admin for access to the full property management system.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default function StaffDashboardPage() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>}>
      <StaffDashboardInner />
    </Suspense>
  );
}
