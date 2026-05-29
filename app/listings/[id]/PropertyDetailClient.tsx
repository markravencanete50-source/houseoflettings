'use client';
// app/listings/[id]/PropertyDetailClient.tsx
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import { getProperty } from '@/services/property';
import { getOrCreateChat } from '@/services/chat';
import { getUserProfile } from '@/services/auth';
import { useAuth } from '@/hooks/useAuth';
import { Property } from '@/lib/types';

export default function PropertyDetailClient() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { profile } = useAuth();
  const [property, setProperty] = useState<Property | null>(null);
  const [landlordName, setLandlordName] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [contacting, setContacting] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  const [btnHovered, setBtnHovered] = useState(false);
  const [imgFading, setImgFading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    getProperty(id).then(async (prop) => {
      setProperty(prop);
      if (prop?.landlordId) {
        const landlord = await getUserProfile(prop.landlordId);
        setLandlordName(landlord?.name || 'Landlord');
      }
      setLoading(false);
    }).catch(() => {
  setLoading(false);
});
  }, [id]);

  const handleContact = async () => {
    if (!profile) {
      router.push('/login');
      return;
    }
    if (profile.role === 'landlord') {
      setError('Switch to a tenant account to contact landlords.');
      return;
    }
    if (!property) return;

    setContacting(true);
    try {
      const chatId = await getOrCreateChat(
        property.id!,
        property.title,
        property.landlordId,
        profile.uid,
        profile.name,
        landlordName
      );
      router.push(`/dashboard/tenant?tab=messages&chatId=${chatId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to start conversation.');
    } finally {
      setContacting(false);
    }
  };

  if (loading) return (
    <>
      <Navbar />
      <div style={{ paddingTop: 68, display: 'flex', justifyContent: 'center', padding: '120px 0' }}>
        <div className="spinner" />
      </div>
    </>
  );

  if (!property) return (
    <>
      <Navbar />
      <div style={{ paddingTop: 68, textAlign: 'center', padding: '120px 5%' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 32 }}>Property not found</h2>
        <Link href="/listings" style={{ color: 'var(--red)', fontWeight: 600, marginTop: 16, display: 'inline-block' }}>
          ← Back to listings
        </Link>
      </div>
    </>
  );

  const bedsLabel = property.bedrooms === 0 ? 'Studio' : `${property.bedrooms} Bedroom${property.bedrooms > 1 ? 's' : ''}`;

  const switchImage = (i: number) => {
    if (i === activeImg) return;
    setImgFading(true);
    setTimeout(() => {
      setActiveImg(i);
      setImgFading(false);
    }, 180);
  };

  return (
    <>
      <Navbar />
      <style>{`
        @keyframes hol-fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes hol-fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .hol-panel {
          transition: box-shadow 0.25s, transform 0.25s;
        }
        .hol-panel:hover {
          box-shadow: 0 6px 24px rgba(15,31,61,0.13) !important;
          transform: translateY(-2px);
        }
        .hol-thumb {
          transition: border 0.2s, opacity 0.2s, transform 0.2s;
        }
        .hol-thumb:hover {
          opacity: 0.85;
          transform: scale(1.05);
        }
        .hol-feature-item {
          transition: background 0.2s, transform 0.2s;
          border-radius: 8px;
          padding: 8px 4px;
        }
        .hol-feature-item:hover {
          background: rgba(15,31,61,0.04);
          transform: translateY(-2px);
        }
      `}</style>
      <div style={{ paddingTop: 68, minHeight: '100vh', background: 'var(--gray-100)' }}>
        {/* Breadcrumb */}
        <div style={{ background: '#fff', borderBottom: '1px solid var(--gray-200)', padding: '14px 5%' }}>
          <span style={{ fontSize: 15, color: '#0f1f3d', fontFamily: 'Georgia, "Times New Roman", serif' }}>
            <Link href="/" style={{ color: '#0f1f3d', fontWeight: 600 }}>Home</Link>
            {' → '}
            <Link href="/listings" style={{ color: '#0f1f3d', fontWeight: 600 }}>Listings</Link>
          </span>
        </div>

        <div style={{ padding: '40px 5%', maxWidth: 1100, margin: '0 auto' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 340px', gap: 40, alignItems: 'start',
            opacity: mounted ? 1 : 0,
            animation: mounted ? 'hol-fadeUp 0.5s ease both' : 'none',
          }}>
            {/* Left Column */}
            <div>
              {/* Image Gallery */}
              <div style={{ borderRadius: 10, overflow: 'hidden', marginBottom: 8, background: 'var(--gray-200)', height: 420 }}>
                {property.images?.[activeImg] ? (
                  <img src={property.images[activeImg]} alt={property.title}
                    style={{
                      width: '100%', height: '100%', objectFit: 'cover',
                      opacity: imgFading ? 0 : 1,
                      transition: 'opacity 0.18s ease',
                    }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-400)', fontSize: 14 }}>
                    No Image Available
                  </div>
                )}
              </div>

              {property.images?.length > 1 && (
                <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                  {property.images.map((img, i) => (
                    <div key={i} onClick={() => switchImage(i)} className="hol-thumb" style={{
                      width: 80, height: 60, flexShrink: 0, borderRadius: 6, overflow: 'hidden',
                      cursor: 'pointer', border: `2px solid ${i === activeImg ? 'var(--red)' : 'transparent'}`,
                    }}>
                      <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>
              )}

              {/* ── Price & Bills / Availability / Features — TOP OF LISTING ── */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 24 }}>
                {/* Price & Bills */}
                <div className="hol-panel" style={{
                  background: '#fff', border: '1px solid var(--gray-200)', borderRadius: 8, padding: '16px 20px',
                  animation: mounted ? 'hol-fadeUp 0.5s ease 0.1s both' : 'none',
                }}>
                  <h4 style={{ fontSize: 13, fontWeight: 700, color: '#222', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Price &amp; Bills</h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
                    <span style={{ color: '#444' }}>Rent PCM</span>
                    <span style={{ fontWeight: 600, color: '#222' }}>£{property.price.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
                    <span style={{ color: '#444' }}>Deposit</span>
                    <span style={{ fontWeight: 600, color: '#222' }}>£{property.depositAmount ? property.depositAmount.toLocaleString() : 'N/A'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                    <span style={{ color: '#444' }}>Bills Included</span>
                    <span style={{ color: property.billsIncluded ? '#166534' : '#c62828', fontWeight: 600 }}>
                      {property.billsIncluded ? '✓' : '✗'}
                    </span>
                  </div>
                </div>

                {/* Availability */}
                <div className="hol-panel" style={{
                  background: '#fff', border: '1px solid var(--gray-200)', borderRadius: 8, padding: '16px 20px',
                  animation: mounted ? 'hol-fadeUp 0.5s ease 0.2s both' : 'none',
                }}>
                  <h4 style={{ fontSize: 13, fontWeight: 700, color: '#222', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Availability</h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
                    <span style={{ color: '#444' }}>Available From</span>
                    <span style={{ fontWeight: 600, color: '#222' }}>
                      {property.availableFrom
                        ? new Date(property.availableFrom).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                        : 'Now'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                    <span style={{ color: '#444' }}>Listing Type</span>
                    <span style={{ fontWeight: 600, color: '#222' }}>
                      {property.propertyType ? property.propertyType.charAt(0).toUpperCase() + property.propertyType.slice(1) : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="hol-panel" style={{
                background: '#fff', border: '1px solid var(--gray-200)', borderRadius: 8, padding: '16px 20px', marginTop: 16,
                animation: mounted ? 'hol-fadeUp 0.5s ease 0.3s both' : 'none',
              }}>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: '#222', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Features</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px 24px' }}>
                  {[
                    { label: 'Garden', value: property.garden && property.garden !== 'none', isText: false },
                    { label: 'Parking', value: property.parking && property.parking !== 'none', isText: false },
                    { label: 'Balcony / Terrace', value: property.balcony, isText: false },
                    { label: 'Furnishing', value: property.furnished ? property.furnished.charAt(0).toUpperCase() + property.furnished.slice(1) : null, isText: true },
                  ].map(feat => (
                    <div key={feat.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                      <span style={{ color: '#444' }}>{feat.label}</span>
                      {feat.isText
                        ? <span style={{ fontWeight: 600, color: '#222' }}>{feat.value || 'N/A'}</span>
                        : <span style={{ color: feat.value ? '#166534' : '#c62828', fontWeight: 600 }}>{feat.value ? '✓' : '✗'}</span>
                      }
                    </div>
                  ))}
                </div>
              </div>

              {/* Details */}
              <div className="hol-panel" style={{
                background: '#fff', border: '1px solid var(--gray-200)', borderRadius: 8, padding: 32, marginTop: 16,
                animation: mounted ? 'hol-fadeUp 0.5s ease 0.4s both' : 'none',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    {property.badge && (
                      <span style={{
                        display: 'inline-block', background: 'var(--red)', color: '#fff',
                        fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase',
                        padding: '4px 10px', borderRadius: 2, marginBottom: 10,
                      }}>
                        {property.badge}
                      </span>
                    )}
                    <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 32, fontWeight: 700, lineHeight: 1.2 }}>
                      {property.title}
                    </h1>
                    <p style={{ color: '#444444', fontSize: 15, marginTop: 6, fontWeight: 500 }}>📍 {property.location}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--font-serif)', fontSize: 36, fontWeight: 700, color: 'var(--red)' }}>
                      £{property.price.toLocaleString()}
                    </div>
                    <div style={{ fontSize: 14, color: '#555555' }}>per month</div>
                  </div>
                </div>

                {/* Key Features */}
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16,
                  padding: '20px 0', borderTop: '1px solid var(--gray-200)', borderBottom: '1px solid var(--gray-200)',
                  marginBottom: 28,
                }}>
                  {[
                    { icon: '🛏', label: 'Bedrooms', value: bedsLabel },
                    { icon: '🚿', label: 'Bathrooms', value: `${property.bathrooms}` },
                    { icon: '📐', label: 'Size', value: property.sqft ? `${property.sqft} sqft` : 'N/A' },
                    { icon: '🪑', label: 'Furnished', value: property.furnished ? property.furnished.charAt(0).toUpperCase() + property.furnished.slice(1) : 'N/A' },
                  ].map(f => (
                    <div key={f.label} className="hol-feature-item" style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 24, marginBottom: 6 }}>{f.icon}</div>
                      <div style={{ fontSize: 13, color: '#555555', marginBottom: 2 }}>{f.label}</div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--black)' }}>{f.value}</div>
                    </div>
                  ))}
                </div>

                {/* Description */}
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>About this property</h3>
                <div style={{ fontSize: 15, color: '#333333', lineHeight: 1.75 }}>
                  {property.description.split('\n').map((line, i) => {
                    const isBullet = line.trim().startsWith('•');
                    const isHeading = line.trim().endsWith(':') && line.trim().length < 40;
                    if (!line.trim()) return <div key={i} style={{ height: 10 }} />;
                    if (isHeading) return (
                      <div key={i} style={{ fontWeight: 700, color: '#1a2e4a', marginTop: 16, marginBottom: 4, fontSize: 14, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        {line.trim()}
                      </div>
                    );
                    if (isBullet) return (
                      <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 4 }}>
                        <span style={{ color: '#0f1f3d', fontWeight: 700, marginTop: 2, flexShrink: 0 }}>•</span>
                        <span>{line.trim().replace(/^•\s*/, '')}</span>
                      </div>
                    );
                    return <p key={i} style={{ marginBottom: 8 }}>{line}</p>;
                  })}
                </div>

              </div>
            </div>

            {/* Right Column — Contact Card */}
            <div style={{ position: 'sticky', top: 88 }}>
              <div className="hol-panel" style={{
                background: '#fff', border: '1px solid var(--gray-200)', borderRadius: 8, padding: 28,
                animation: mounted ? 'hol-fadeUp 0.5s ease 0.2s both' : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
                  <div style={{
                    width: 48, height: 48, background: 'var(--black)', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 700,
                  }}>
                    {landlordName ? landlordName.charAt(0).toUpperCase() : '🏠'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--black)' }}>{landlordName || 'Property Owner'}</div>
                    <div style={{ fontSize: 13, color: '#555555' }}>Property Owner</div>
                  </div>
                </div>

                {error && (
                  <div style={{
                    background: '#fce4ec', color: '#c62828', padding: '10px 14px',
                    borderRadius: 4, fontSize: 13, marginBottom: 16,
                  }}>
                    {error}
                  </div>
                )}

                <div style={{
                  background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6,
                  padding: '10px 14px', fontSize: 13, color: '#166534', marginBottom: 20,
                }}>
                  ✓ No agency fees — contact landlord directly
                </div>

                <button
                  onClick={handleContact}
                  disabled={contacting}
                  onMouseEnter={() => setBtnHovered(true)}
                  onMouseLeave={() => setBtnHovered(false)}
                  style={{
                    width: '100%', padding: 14, background: 'var(--red)', color: '#fff',
                    border: 'none', borderRadius: 4, fontSize: 14, fontWeight: 600,
                    letterSpacing: '0.5px', textTransform: 'uppercase', cursor: 'pointer',
                    opacity: contacting ? 0.7 : 1, marginBottom: 12,
                    transform: btnHovered && !contacting ? 'scale(1.02)' : 'scale(1)',
                    boxShadow: btnHovered && !contacting ? '0 4px 16px rgba(198,40,40,0.35)' : 'none',
                    transition: 'transform 0.2s, box-shadow 0.2s, opacity 0.2s',
                  }}
                >
                  {contacting ? 'Opening Chat…' : '💬 Message Landlord'}
                </button>

                {!profile && (
                  <p style={{ textAlign: 'center', fontSize: 13, color: '#555555' }}>
                    <Link href="/login" style={{ color: 'var(--red)', fontWeight: 600 }}>Sign in</Link> to message the landlord
                  </p>
                )}

                <div style={{ borderTop: '1px solid var(--gray-200)', marginTop: 20, paddingTop: 20 }}>
                  {[
                    { label: 'Property ID', value: property.id?.slice(0, 8).toUpperCase() },
                    { label: 'Status', value: property.status.charAt(0).toUpperCase() + property.status.slice(1) },
                    { label: 'Listed', value: property.createdAt ? new Date((property.createdAt as any).seconds * 1000).toLocaleDateString('en-GB') : 'Recent' },
                  ].map(r => (
                    <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 13 }}>
                      <span style={{ color: '#555555' }}>{r.label}</span>
                      <span style={{ fontWeight: 500 }}>{r.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Link href="/listings" style={{
                display: 'block', textAlign: 'center', marginTop: 14,
                color: '#555555', fontSize: 13,
              }}>
                ← Back to listings
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
