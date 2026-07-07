'use client';
// app/dashboard/tenant/page.tsx
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import ChatWindow from '@/components/chat/ChatWindow';
import { useAuth } from '@/hooks/useAuth';
import { subscribeToChats, getChat } from '@/services/chat';
import { getProperties } from '@/services/property';
import { Chat, Property } from '@/lib/types';

type Tab = 'overview' | 'messages' | 'browse';

function TenantDashboardInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<Tab>((searchParams.get('tab') as Tab) || 'overview');
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(searchParams.get('chatId'));
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [recentProps, setRecentProps] = useState<Property[]>([]);

  useEffect(() => {
    if (!authLoading && (!profile || profile.role !== 'tenant')) {
      router.push('/login');
    }
  }, [profile, authLoading, router]);

  useEffect(() => {
    if (!profile) return;
    const unsub = subscribeToChats(profile.uid, 'tenant', setChats);
    return () => unsub();
  }, [profile]);

  useEffect(() => {
    if (activeChatId) {
      getChat(activeChatId).then(c => {
        setActiveChat(c);
        if (c) setTab('messages');
      });
    }
  }, [activeChatId]);

  useEffect(() => {
    getProperties().then(p => setRecentProps(p.slice(0, 4)));
  }, []);

  if (authLoading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '120px 0' }}>
      <div className="spinner" />
    </div>
  );

  const navItems: Array<{ id: Tab; icon: string; label: string }> = [
    { id: 'overview', icon: '🏡', label: 'Overview' },
    { id: 'messages', icon: '💬', label: `Messages${chats.length > 0 ? ` (${chats.length})` : ''}` },
    { id: 'browse', icon: '🔍', label: 'Browse' },
  ];

  return (
    <>
      <Navbar />
      <div className="dash-layout">
        <aside className="dash-sidebar">
          <div style={{ padding: '0 28px 28px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 12 }}>
            <div style={{ width: 44, height: 44, background: 'var(--red)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 700, marginBottom: 10 }}>
              {profile?.name?.charAt(0).toUpperCase()}
            </div>
            <div style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>{profile?.name}</div>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 2 }}>Tenant Account</div>
          </div>

          {navItems.map(item => (
            <button key={item.id} className={`dash-nav-item ${tab === item.id ? 'active' : ''}`}
              onClick={() => setTab(item.id)}>
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}

          <div style={{ padding: '28px 28px 0', marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <Link href="/listings" style={{
              display: 'block', padding: '12px 16px', background: 'var(--red)', color: '#fff',
              borderRadius: 4, fontSize: 13, fontWeight: 600, textAlign: 'center',
              textTransform: 'uppercase', letterSpacing: '0.5px',
            }}>
              Browse All Properties
            </Link>
          </div>
        </aside>

        <main className="dash-content">
          {/* ── Overview ── */}
          {tab === 'overview' && (
            <div>
              <h1 className="dash-section-title">Welcome, {profile?.name?.split(' ')[0]} 👋</h1>
              <p style={{ color: 'var(--gray-600)', marginBottom: 32, fontSize: 15 }}>
                Find your perfect home, with no agency fees, direct from landlords.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 20, marginBottom: 36 }}>
                {[
                  { label: 'Active Chats', value: chats.length, icon: '💬' },
                  { label: 'Properties Viewed', value: 0, icon: '👁' },
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

              {/* Recent messages */}
              <div className="dash-card" style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Your Conversations</h3>
                {chats.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--gray-400)' }}>
                    <p style={{ fontSize: 15, marginBottom: 12 }}>No conversations yet.</p>
                    <p style={{ fontSize: 14, marginBottom: 20 }}>Browse properties and message landlords directly.</p>
                    <Link href="/listings" style={{
                      padding: '10px 20px', background: 'var(--red)', color: '#fff',
                      borderRadius: 4, fontSize: 13, fontWeight: 600,
                    }}>
                      Browse Listings →
                    </Link>
                  </div>
                ) : (
                  chats.map(c => (
                    <div key={c.id}
                      onClick={() => { setActiveChatId(c.id!); setActiveChat(c); setTab('messages'); }}
                      style={{
                        padding: '12px 0', borderBottom: '1px solid var(--gray-100)',
                        cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{c.propertyTitle}</div>
                        <div style={{ fontSize: 13, color: 'var(--gray-400)', marginTop: 2 }}>
                          With {c.landlordName}
                        </div>
                        {c.lastMessage && (
                          <div style={{ fontSize: 13, color: 'var(--gray-600)', marginTop: 4 }}>
                            {c.lastMessage}
                          </div>
                        )}
                      </div>
                      <span style={{ fontSize: 18, opacity: 0.4 }}>→</span>
                    </div>
                  ))
                )}
              </div>

              {/* Recent properties */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700 }}>New Listings</h3>
                  <Link href="/listings" style={{ fontSize: 13, color: 'var(--red)', fontWeight: 600 }}>
                    View all →
                  </Link>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 16 }}>
                  {recentProps.map(p => (
                    <div key={p.id} onClick={() => router.push(`/listings/${p.id}`)}
                      style={{ background: '#fff', border: '1px solid var(--gray-200)', borderRadius: 8, overflow: 'hidden', cursor: 'pointer' }}>
                      {p.images?.[0] && (
                        <img src={p.images[0]} alt={p.title} style={{ width: '100%', height: 140, objectFit: 'cover' }} />
                      )}
                      <div style={{ padding: 14 }}>
                        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 700, color: 'var(--red)' }}>
                          £{p.price.toLocaleString()}<span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--gray-400)', fontWeight: 400 }}>/mo</span>
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>{p.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 2 }}>📍 {p.location}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Messages ── */}
          {tab === 'messages' && (
            <div>
              <h1 className="dash-section-title" style={{ marginBottom: 24 }}>Messages</h1>
              <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20, height: 600 }}>
                <div className="dash-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--gray-200)', fontWeight: 600, fontSize: 14 }}>
                    Your Chats ({chats.length})
                  </div>
                  <div style={{ overflowY: 'auto', flex: 1 }}>
                    {chats.length === 0 && (
                      <div style={{ padding: 24, textAlign: 'center', color: 'var(--gray-400)', fontSize: 14 }}>
                        No conversations yet.{' '}
                        <Link href="/listings" style={{ color: 'var(--red)', fontWeight: 600 }}>Browse properties →</Link>
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
                        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{c.propertyTitle}</div>
                        <div style={{ fontSize: 12, color: 'var(--gray-400)', marginBottom: 4 }}>
                          {c.landlordName}
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
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Browse ── */}
          {tab === 'browse' && (
            <div>
              <h1 className="dash-section-title" style={{ marginBottom: 8 }}>Browse Properties</h1>
              <p style={{ color: 'var(--gray-600)', marginBottom: 24 }}>
                Find your next home from verified landlords.
              </p>
              <Link href="/listings" style={{
                display: 'inline-block', padding: '14px 32px', background: 'var(--red)', color: '#fff',
                borderRadius: 4, fontSize: 14, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase',
              }}>
                View All Listings →
              </Link>
            </div>
          )}
        </main>
      </div>
    </>
  );
}

export default function TenantDashboard() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', justifyContent: 'center', padding: '120px 0' }}>
        <div className="spinner" />
      </div>
    }>
      <TenantDashboardInner />
    </Suspense>
  );
}
