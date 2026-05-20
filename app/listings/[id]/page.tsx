'use client';
// app/listings/[id]/page.tsx
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import { getProperty } from '@/services/property';
import { getOrCreateChat } from '@/services/chat';
import { getUserProfile } from '@/services/auth';
import { useAuth } from '@/hooks/useAuth';
import { Property } from '@/lib/types';

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { profile, loading: authLoading } = useAuth();
  const [property, setProperty] = useState<Property | null>(null);
  const [landlordName, setLandlordName] = useState('');
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const [contacting, setContacting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        const prop = await getProperty(id);
        if (cancelled) return;

        if (!prop) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        setProperty(prop);

        if (prop.landlordId) {
          try {
            const landlord = await getUserProfile(prop.landlordId);
            if (!cancelled) setLandlordName(landlord?.name || 'Landlord');
          } catch {
            if (!cancelled) setLandlordName('Landlord');
          }
        }
      } catch (err) {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
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
    setError('');
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

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading || authLoading) return (
    <>
      <Navbar />
      <div style={{ paddingTop: 68, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="spinner" />
      </div>
    </>
  );

  // ── Not found ─────────────────────────────────────────────────────────────
  if (notFound || !property) return (
    <>
      <Navbar />
      <div style={{ paddingTop: 68, textAlign: 'center', padding: '120px 5%' }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🏚</div>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 32, marginBottom: 12 }}>Property not found</h2>
        <p style={{ color: 'var(--gray-400)', fontSize: 15, marginBottom: 24 }}>
          This listing may have been removed or the link is incorrect.
        </p>
        <Link href="/listings" style={{
          display: 'inline-block', padding: '12px 28px',
          background: 'var(--red)', color: '#fff', borderRadius: 4,
          fontWeight: 600, fontSize: 14, textDecoration: 'none',
        }}>
          ← Browse all listings
        </Link>
      </div>
    </>
  );

  const bedsLabel = property.bedrooms === 0
    ? 'Studio'
    : `${property.bedrooms} Bedroom${property.bedrooms > 1 ? 's' : ''}`;

  // ── Helper to render a feature pill if the value exists ───────────────────
  const prop = property as any;

  const PARKING_LABELS: Record<string, string> = {
    'none': 'No parking', 'off-street': 'Off street', 'residents': "Resident's parking",
    'street-no-permit': 'Street (no permit)', 'street-permit': 'Street (permit)',
    'driveway-private': 'Private driveway', 'driveway-shared': 'Shared driveway',
    'single-garage': 'Single garage', 'double-garage': 'Double garage',
    'garage': 'Garage', 'gated': 'Gated parking', 'underground-allocated': 'Underground (allocated)',
    'underground-no-allocated': 'Underground (no allocated)', 'communal-no-allocated': 'Communal car park',
    'ev-private': 'EV charging (private)', 'ev-shared': 'EV charging (shared)',
    'disabled-available': 'Disabled parking', 'other': 'Other parking',
  };

  const GARDEN_LABELS: Record<string, string> = {
    'none': '', 'private': '🌿 Private garden', 'shared': '🌳 Shared garden', 'communal': '🏞️ Communal grounds',
  };

  const features = [
    prop.propertyType === 'room' ? '🛏 Room in shared house' : '🏡 Whole property',
    prop.parking && prop.parking !== 'none' ? `🅿️ ${PARKING_LABELS[prop.parking] || prop.parking}` : null,
    prop.garden && prop.garden !== 'none' ? GARDEN_LABELS[prop.garden] : null,
    prop.balcony ? '🏙️ Balcony / terrace' : null,
    prop.billsIncluded ? '💡 Bills included' : '💡 Bills excluded',
    prop.videoTourUrl ? '🎥 Video tour available' : null,
  ].filter(Boolean) as string[];

  return (
    <>
      <Navbar />
      <div style={{ paddingTop: 68, minHeight: '100vh', background: 'var(--gray-100)' }}>

        {/* Breadcrumb */}
        <div style={{ background: '#fff', borderBottom: '1px solid var(--gray-200)', padding: '14px 5%' }}>
          <span style={{ fontSize: 13, color: 'var(--gray-400)' }}>
            <Link href="/" style={{ color: 'var(--gray-400)' }}>Home</Link>
            {' → '}
            <Link href="/listings" style={{ color: 'var(--gray-400)' }}>Listings</Link>
            {' → '}
            <span style={{ color: 'var(--black)', fontWeight: 500 }}>{property.title}</span>
          </span>
        </div>

        <div style={{ padding: '40px 5%', maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 40, alignItems: 'start' }}>

            {/* ── Left Column ── */}
            <div>
              {/* Image Gallery */}
              <div style={{ borderRadius: 10, overflow: 'hidden', marginBottom: 8, background: 'var(--gray-200)', height: 420 }}>
                {property.images?.[activeImg] ? (
                  <img src={property.images[activeImg]} alt={property.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-400)', fontSize: 14 }}>
                    No Image Available
                  </div>
                )}
              </div>

              {property.images?.length > 1 && (
                <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                  {property.images.map((img, i) => (
                    <div key={i} onClick={() => setActiveImg(i)} style={{
                      width: 80, height: 60, flexShrink: 0, borderRadius: 6, overflow: 'hidden',
                      cursor: 'pointer', border: `2px solid ${i === activeImg ? 'var(--red)' : 'transparent'}`,
                      transition: 'border .2s',
                    }}>
                      <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>
              )}

              {/* Video tour */}
              {prop.videoTourUrl && (
                <div style={{ marginTop: 12 }}>
                  <a href={prop.videoTourUrl} target="_blank" rel="noopener noreferrer" style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '10px 18px', background: 'var(--black)', color: '#fff',
                    borderRadius: 4, fontSize: 13, fontWeight: 600, textDecoration: 'none',
                  }}>
                    🎥 Watch Video Tour
                  </a>
                </div>
              )}

              {/* Details */}
              <div style={{ background: '#fff', border: '1px solid var(--gray-200)', borderRadius: 8, padding: 32, marginTop: 24 }}>
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
                    <p style={{ color: 'var(--gray-400)', fontSize: 15, marginTop: 6 }}>📍 {property.location}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--font-serif)', fontSize: 36, fontWeight: 700, color: 'var(--red)' }}>
                      £{property.price.toLocaleString()}
                    </div>
                    <div style={{ fontSize: 14, color: 'var(--gray-400)' }}>per month</div>
                    {prop.depositAmount && (
                      <div style={{ fontSize: 13, color: 'var(--gray-600)', marginTop: 4 }}>
                        Deposit: £{Number(prop.depositAmount).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Key Features Grid */}
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
                    <div key={f.label} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 24, marginBottom: 6 }}>{f.icon}</div>
                      <div style={{ fontSize: 13, color: 'var(--gray-400)', marginBottom: 2 }}>{f.label}</div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--black)' }}>{f.value}</div>
                    </div>
                  ))}
                </div>

                {/* Description */}
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>About this property</h3>
                <p style={{ fontSize: 15, color: 'var(--gray-600)', lineHeight: 1.75, whiteSpace: 'pre-line' }}>
                  {property.description}
                </p>

                {/* Features & Amenities */}
                {features.length > 0 && (
                  <div style={{ marginTop: 28 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Features & Amenities</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                      {features.map(f => (
                        <span key={f} style={{
                          padding: '7px 14px', borderRadius: 20,
                          background: 'var(--gray-100)', border: '1px solid var(--gray-200)',
                          fontSize: 13, color: 'var(--gray-600)', fontWeight: 500,
                        }}>
                          {f}
                        </span>
                      ))}
                    </div>
                    {prop.billsIncluded && prop.billsNote && (
                      <p style={{ fontSize: 13, color: 'var(--gray-400)', marginTop: 10 }}>
                        ℹ️ {prop.billsNote}
                      </p>
                    )}
                  </div>
                )}

                {property.availableFrom && (
                  <div style={{ marginTop: 24, padding: '14px 18px', background: 'var(--gray-100)', borderRadius: 6, fontSize: 14 }}>
                    📅 <strong>Available from:</strong>{' '}
                    {new Date(property.availableFrom).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                )}
              </div>
            </div>

            {/* ── Right Column — Contact Card ── */}
            <div style={{ position: 'sticky', top: 88 }}>
              <div style={{ background: '#fff', border: '1px solid var(--gray-200)', borderRadius: 8, padding: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
                  <div style={{
                    width: 48, height: 48, background: 'var(--black)', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 700,
                  }}>
                    {landlordName.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--black)' }}>{landlordName}</div>
                    <div style={{ fontSize: 13, color: 'var(--gray-400)' }}>Property Owner</div>
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
                  style={{
                    width: '100%', padding: 14, background: 'var(--red)', color: '#fff',
                    border: 'none', borderRadius: 4, fontSize: 14, fontWeight: 600,
                    letterSpacing: '0.5px', textTransform: 'uppercase', cursor: contacting ? 'not-allowed' : 'pointer',
                    opacity: contacting ? 0.7 : 1, marginBottom: 12,
                  }}
                >
                  {contacting ? 'Opening Chat…' : '💬 Message Landlord'}
                </button>

                {!profile && (
                  <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--gray-400)' }}>
                    <Link href="/login" style={{ color: 'var(--red)', fontWeight: 600 }}>Sign in</Link> to message the landlord
                  </p>
                )}

                <div style={{ borderTop: '1px solid var(--gray-200)', marginTop: 20, paddingTop: 20 }}>
                  {[
                    { label: 'Property ID', value: property.id?.slice(0, 8).toUpperCase() },
                    { label: 'Type', value: prop.propertyType === 'room' ? 'Room in shared house' : 'Whole property' },
                    { label: 'Status', value: property.status.charAt(0).toUpperCase() + property.status.slice(1) },
                    { label: 'Listed', value: property.createdAt ? new Date((property.createdAt as any).seconds * 1000).toLocaleDateString('en-GB') : 'Recent' },
                  ].map(r => (
                    <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 13 }}>
                      <span style={{ color: 'var(--gray-400)' }}>{r.label}</span>
                      <span style={{ fontWeight: 500 }}>{r.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Link href="/listings" style={{
                display: 'block', textAlign: 'center', marginTop: 14,
                color: 'var(--gray-400)', fontSize: 13,
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
