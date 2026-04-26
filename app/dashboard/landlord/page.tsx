'use client';
// app/dashboard/landlord/page.tsx
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import PropertyForm from '@/components/property/PropertyForm';
import ChatWindow from '@/components/chat/ChatWindow';
import { useAuth } from '@/hooks/useAuth';
import { getLandlordProperties, deleteProperty, setPropertyStatus } from '@/services/property';
import { subscribeToChats, getChat } from '@/services/chat';
import { Property, Chat } from '@/lib/types';

type Tab = 'overview' | 'listings' | 'add' | 'inbox';

export default function LandlordDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<Tab>((searchParams.get('tab') as Tab) || 'overview');
  const [properties, setProperties] = useState<Property[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(searchParams.get('chatId'));
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [editProperty, setEditProperty] = useState<Property | null>(null);
  const [propLoading, setPropLoading] = useState(true);

  // Auth guard
  useEffect(() => {
    if (!authLoading && (!profile || profile.role !== 'landlord')) {
      router.push('/login');
    }
  }, [profile, authLoading, router]);

  // Load properties
  useEffect(() => {
    if (!profile) return;
    getLandlordProperties(profile.uid).then(p => {
      setProperties(p);
      setPropLoading(false);
    });
  }, [profile]);

  // Subscribe to chats
  useEffect(() => {
    if (!profile) return;
    const unsub = subscribeToChats(profile.uid, 'landlord', setChats);
    return () => unsub();
  }, [profile]);

  // Load active chat
  useEffect(() => {
    if (activeChatId) {
      getChat(activeChatId).then(setActiveChat);
    }
  }, [activeChatId]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this listing? This cannot be undone.')) return;
    await deleteProperty(id);
    setProperties(prev => prev.filter(p => p.id !== id));
  };

  const handleToggleStatus = async (prop: Property) => {
    const newStatus = prop.status === 'active' ? 'inactive' : 'active';
    await setPropertyStatus(prop.id!, newStatus);
    setProperties(prev => prev.map(p => p.id === prop.id ? { ...p, status: newStatus } : p));
  };

  if (authLoading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '120px 0' }}>
      <div className="spinner" />
    </div>
  );

  const activeProps = properties.filter(p => p.status === 'active').length;
  const totalViews = properties.length * 34; // placeholder

  const navItems: Array<{ id: Tab; icon: string; label: string }> = [
    { id: 'overview', icon: '📊', label: 'Overview' },
    { id: 'listings', icon: '🏠', label: 'My Listings' },
    { id: 'add', icon: '➕', label: 'Add Property' },
    { id: 'inbox', icon: '💬', label: `Inbox${chats.length > 0 ? ` (${chats.length})` : ''}` },
  ];

  return (
    <>
      <Navbar />
      <div className="dash-layout">
        {/* Sidebar */}
        <aside className="dash-sidebar">
          <div style={{ padding: '0 28px 28px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 12 }}>
            <div style={{ width: 44, height: 44, background: 'var(--red)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 700, marginBottom: 10 }}>
              {profile?.name?.charAt(0).toUpperCase()}
            </div>
            <div style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>{profile?.name}</div>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 2 }}>Landlord Account</div>
          </div>

          {navItems.map(item => (
            <button key={item.id} className={`dash-nav-item ${tab === item.id ? 'active' : ''}`}
              onClick={() => setTab(item.id)}>
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </aside>

        {/* Main Content */}
        <main className="dash-content">
          {/* ── Overview ── */}
          {tab === 'overview' && (
            <div>
              <h1 className="dash-section-title">Welcome back, {profile?.name?.split(' ')[0]} 👋</h1>
              <p style={{ color: 'var(--gray-600)', marginBottom: 32, fontSize: 15 }}>
                Here's a summary of your rental portfolio.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 20, marginBottom: 36 }}>
                {[
                  { label: 'Total Listings', value: properties.length, icon: '🏠' },
                  { label: 'Active Listings', value: activeProps, icon: '✅' },
                  { label: 'Conversations', value: chats.length, icon: '💬' },
                  { label: 'Total Views', value: totalViews, icon: '👁' },
                ].map(s => (
                  <div key={s.label} className="dash-card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ fontSize: 32 }}>{s.icon}</div>
                    <div>
                      <div style={{ fontFamily: 'var(--font-serif)', fontSize: 30, fontWeight: 700 }}>{s.value}</div>
                      <div style={{ fontSize: 13, color: 'var(--gray-400)', marginTop: 2 }}>{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <div className="dash-card">
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Recent Listings</h3>
                  {properties.slice(0, 3).map(p => (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--gray-100)' }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{p.title}</div>
                        <div style={{ fontSize: 13, color: 'var(--gray-400)' }}>{p.location}</div>
                      </div>
                      <span className={`status-badge ${p.status}`}>{p.status}</span>
                    </div>
                  ))}
                  {properties.length === 0 && (
                    <p style={{ color: 'var(--gray-400)', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>
                      No listings yet.{' '}
                      <button onClick={() => setTab('add')} style={{ color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                        Add your first →
                      </button>
                    </p>
                  )}
                </div>

                <div className="dash-card">
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Recent Messages</h3>
                  {chats.slice(0, 3).map(c => (
                    <div key={c.id} onClick={() => { setActiveChatId(c.id!); setActiveChat(c); setTab('inbox'); }}
                      style={{ padding: '10px 0', borderBottom: '1px solid var(--gray-100)', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 14, fontWeight: 600 }}>{c.tenantName}</span>
                        <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>
                          {c.lastMessageAt instanceof Date ? c.lastMessageAt.toLocaleDateString('en-GB') : ''}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--gray-400)', marginTop: 2 }}>
                        Re: {c.propertyTitle}
                      </div>
                      {c.lastMessage && (
                        <div style={{ fontSize: 13, color: 'var(--gray-600)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {c.lastMessage}
                        </div>
                      )}
                    </div>
                  ))}
                  {chats.length === 0 && (
                    <p style={{ color: 'var(--gray-400)', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>No messages yet.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── My Listings ── */}
          {tab === 'listings' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
                <h1 className="dash-section-title">My Listings</h1>
                <button onClick={() => setTab('add')} style={{
                  padding: '10px 22px', background: 'var(--red)', color: '#fff',
                  border: 'none', borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}>
                  + Add Property
                </button>
              </div>

              {propLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
              ) : properties.length === 0 ? (
                <div className="dash-card" style={{ textAlign: 'center', padding: 60 }}>
                  <div style={{ fontSize: 52, marginBottom: 16 }}>🏠</div>
                  <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, marginBottom: 12 }}>No listings yet</h3>
                  <p style={{ color: 'var(--gray-400)', fontSize: 15, marginBottom: 24 }}>
                    Publish your first property to start receiving enquiries.
                  </p>
                  <button onClick={() => setTab('add')} style={{
                    padding: '12px 28px', background: 'var(--red)', color: '#fff',
                    border: 'none', borderRadius: 4, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  }}>
                    Add Your First Property →
                  </button>
                </div>
              ) : (
                <div className="dash-card" style={{ padding: 0, overflow: 'hidden' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Property</th>
                        <th>Location</th>
                        <th>Rent/mo</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {properties.map(p => (
                        <tr key={p.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              {p.images?.[0] && (
                                <img src={p.images[0]} alt="" style={{ width: 48, height: 36, objectFit: 'cover', borderRadius: 4 }} />
                              )}
                              <div>
                                <div style={{ fontWeight: 600, fontSize: 14 }}>{p.title}</div>
                                <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>
                                  {p.bedrooms === 0 ? 'Studio' : `${p.bedrooms} bed`} · {p.bathrooms} bath
                                </div>
                              </div>
                            </div>
                          </td>
                          <td style={{ color: 'var(--gray-600)', fontSize: 13 }}>{p.location}</td>
                          <td style={{ fontWeight: 700, color: 'var(--red)' }}>£{p.price.toLocaleString()}</td>
                          <td>
                            <span className={`status-badge ${p.status}`}>{p.status}</span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button onClick={() => { setEditProperty(p); setTab('add'); }}
                                style={{ padding: '6px 12px', background: 'transparent', border: '1px solid var(--gray-200)', borderRadius: 4, fontSize: 12, cursor: 'pointer' }}>
                                Edit
                              </button>
                              <button onClick={() => handleToggleStatus(p)}
                                style={{ padding: '6px 12px', background: 'transparent', border: `1px solid ${p.status === 'active' ? '#f57f17' : '#2e7d32'}`, color: p.status === 'active' ? '#f57f17' : '#2e7d32', borderRadius: 4, fontSize: 12, cursor: 'pointer' }}>
                                {p.status === 'active' ? 'Deactivate' : 'Activate'}
                              </button>
                              <button onClick={() => handleDelete(p.id!)} className="btn-danger">
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── Add / Edit Property ── */}
          {tab === 'add' && profile && (
            <div>
              <h1 className="dash-section-title">{editProperty ? 'Edit Property' : 'Add New Property'}</h1>
              <p style={{ color: 'var(--gray-600)', marginBottom: 32, fontSize: 15 }}>
                {editProperty ? 'Update your listing details.' : 'Your listing will go live immediately after publishing.'}
              </p>
              <div className="dash-card">
                <PropertyForm
                  landlordId={profile.uid}
                  landlordName={profile.name}
                  existing={editProperty || undefined}
                  onSuccess={() => {
                    setEditProperty(null);
                    getLandlordProperties(profile.uid).then(setProperties);
                    setTab('listings');
                  }}
                  onCancel={() => { setEditProperty(null); setTab('listings'); }}
                />
              </div>
            </div>
          )}

          {/* ── Inbox ── */}
          {tab === 'inbox' && (
            <div>
              <h1 className="dash-section-title" style={{ marginBottom: 24 }}>Inbox</h1>
              <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20, height: 600 }}>
                {/* Chat list */}
                <div className="dash-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--gray-200)', fontWeight: 600, fontSize: 14 }}>
                    Conversations ({chats.length})
                  </div>
                  <div style={{ overflowY: 'auto', flex: 1 }}>
                    {chats.length === 0 && (
                      <div style={{ padding: 24, textAlign: 'center', color: 'var(--gray-400)', fontSize: 14 }}>
                        No conversations yet.
                      </div>
                    )}
                    {chats.map(c => (
                      <div key={c.id}
                        onClick={() => { setActiveChatId(c.id!); setActiveChat(c); }}
                        style={{
                          padding: '14px 20px', cursor: 'pointer', borderBottom: '1px solid var(--gray-100)',
                          background: activeChatId === c.id ? '#fff5f5' : '#fff',
                          borderLeft: activeChatId === c.id ? '3px solid var(--red)' : '3px solid transparent',
                          transition: 'all .15s',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontWeight: 600, fontSize: 14 }}>{c.tenantName}</span>
                          <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>
                            {c.lastMessageAt instanceof Date ? c.lastMessageAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--gray-400)', marginBottom: 2 }}>
                          {c.propertyTitle}
                        </div>
                        {c.lastMessage && (
                          <div style={{ fontSize: 12, color: 'var(--gray-600)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {c.lastMessage}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Active chat */}
                <div style={{ height: '100%' }}>
                  {activeChatId && activeChat ? (
                    <ChatWindow chat={activeChat} chatId={activeChatId} />
                  ) : (
                    <div style={{
                      height: '100%', background: '#fff', border: '1px solid var(--gray-200)',
                      borderRadius: 8, display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center', color: 'var(--gray-400)',
                    }}>
                      <div style={{ fontSize: 48, marginBottom: 16 }}>💬</div>
                      <p style={{ fontSize: 15, fontWeight: 500 }}>Select a conversation</p>
                      <p style={{ fontSize: 13, marginTop: 6 }}>Choose from the list on the left</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
