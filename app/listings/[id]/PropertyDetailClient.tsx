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
import TenantEnquiryModal from '@/components/property/TenantEnquiryModal';

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
  const [viewingHovered, setViewingHovered] = useState(false);
  const [imgFading, setImgFading] = useState(false);
  const [enquiryOpen, setEnquiryOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    (async () => {
      try {
        const prop = await getProperty(id);
        setProperty(prop);
        if (prop?.landlordId) {
          try {
            const landlord = await getUserProfile(prop.landlordId);
            setLandlordName(landlord?.name || 'Landlord');
          } catch {
            setLandlordName('Landlord');
          }
        }
      } catch (err) {
        console.error('Failed to load property:', err);
        setProperty(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleContact = async () => {
    if (!profile) { router.push('/login'); return; }
    if (profile.role === 'landlord') {
      setError('Switch to a tenant account to contact landlords.');
      return;
    }
    if (!property) return;
    setContacting(true);
    try {
      const chatId = await getOrCreateChat(
        property.id!, property.title, property.landlordId,
        profile.uid, profile.name, landlordName
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
      <div style={{ display: 'flex', justifyContent: 'center', padding: '120px 0' }}>
        <div className="spinner" />
      </div>
    </>
  );

  if (!property) return (
    <>
      <Navbar />
      <div style={{ textAlign: 'center', padding: '120px 5%' }}>
        <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 32 }}>Property not found</h2>
        <Link href="/listings" style={{ color: 'var(--red)', fontWeight: 600, marginTop: 16, display: 'inline-block' }}>
          ← Back to listings
        </Link>
      </div>
    </>
  );

  const bedsLabel = property.bedrooms === 0 ? 'Studio' : `${property.bedrooms} Bedroom${property.bedrooms > 1 ? 's' : ''}`;
  const isLeeds = /leeds|LS\d/i.test(property.location || '');
  const contactPhone = isLeeds ? '+44 113 868 9212' : '+44 161 768 1758';
  const contactPhoneHref = isLeeds ? 'tel:+441138689212' : 'tel:+441617681758';

  const switchImage = (i: number) => {
    if (i === activeImg) return;
    setImgFading(true);
    setTimeout(() => { setActiveImg(i); setImgFading(false); }, 180);
  };

  return (
    <>
      <Navbar />
      <style>{`
        @keyframes hol-fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
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

        /* ── Layout grid ── */
        .hol-detail-grid {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 40px;
          align-items: start;
        }

        /* ── Main image ── */
        .hol-main-image {
          height: 420px;
        }

        /* ── Key features row ── */
        .hol-key-features {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }

        /* ── Contact card stickiness ── */
        .hol-contact-sticky {
          position: sticky;
          top: 88px;
        }

        /* ── Price header ── */
        .hol-price {
          font-size: 36px;
        }

        /* ── MOBILE ── */
        @media (max-width: 768px) {
          .hol-detail-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }

          /* Contact card comes FIRST on mobile (order trick) */
          .hol-right-col {
            order: -1;
          }

          .hol-contact-sticky {
            position: static;
            top: unset;
          }

          .hol-main-image {
            height: 240px;
          }

          .hol-key-features {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }

          .hol-price {
            font-size: 26px;
          }

          /* Keep title + price from overflowing side-by-side */
          .hol-title-price-row {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 8px !important;
          }

          .hol-price-block {
            text-align: left !important;
          }
        }

        @media (max-width: 480px) {
          .hol-main-image {
            height: 200px;
          }
          .hol-key-features {
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
          }
        }
      `}</style>

      <div style={{ minHeight: '100vh', background: 'var(--gray-100)' }}>

        {/* Breadcrumb */}
        <div style={{ background: '#fff', borderBottom: '1px solid var(--gray-200)', padding: '12px 20px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Link href="/" style={{
              color: '#fff', fontWeight: 700, fontSize: 15,
              background: '#0f1f3d', borderRadius: 5,
              padding: '6px 16px', textDecoration: 'none', letterSpacing: 0.3,
            }}>Home</Link>
            <span style={{ color: '#aaa', fontSize: 14 }}>→</span>
            <Link href="/listings" style={{
              color: '#fff', fontWeight: 700, fontSize: 15,
              background: '#0f1f3d', borderRadius: 5,
              padding: '6px 16px', textDecoration: 'none', letterSpacing: 0.3,
            }}>Listings</Link>
          </div>
        </div>

        <div style={{ padding: '24px 16px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%' }}>
            <div
              className="hol-detail-grid"
              style={{
                opacity: mounted ? 1 : 0,
                animation: mounted ? 'hol-fadeUp 0.5s ease both' : 'none',
              }}
            >
              {/* ── LEFT COLUMN ── */}
              <div>

                {/* Image Gallery */}
                <div
                  className="hol-main-image"
                  style={{ borderRadius: 10, overflow: 'hidden', marginBottom: 8, background: 'var(--gray-200)' }}
                >
                  {property.images?.[activeImg] ? (
                    <img
                      src={property.images[activeImg]}
                      alt={property.title}
                      style={{
                        width: '100%', height: '100%', objectFit: 'cover',
                        opacity: imgFading ? 0 : 1,
                        transition: 'opacity 0.18s ease',
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '100%', height: '100%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--gray-400)', fontSize: 14,
                    }}>
                      No Image Available
                    </div>
                  )}
                </div>

                {property.images?.length > 1 && (
                  <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                    {property.images.map((img, i) => (
                      <div
                        key={i}
                        onClick={() => switchImage(i)}
                        className="hol-thumb"
                        style={{
                          width: 72, height: 54, flexShrink: 0,
                          borderRadius: 6, overflow: 'hidden', cursor: 'pointer',
                          border: `2px solid ${i === activeImg ? 'var(--red)' : 'transparent'}`,
                        }}
                      >
                        <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ))}
                  </div>
                )}

                {/* Details Panel */}
                <div
                  className="hol-panel"
                  style={{
                    background: '#fff', border: '1px solid var(--gray-200)',
                    borderRadius: 8, padding: 'clamp(16px, 4%, 32px)', marginTop: 20,
                    animation: mounted ? 'hol-fadeUp 0.5s ease 0.4s both' : 'none',
                  }}
                >
                  {/* Title + Price */}
                  <div
                    className="hol-title-price-row"
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {property.badge && (
                        <span style={{
                          display: 'inline-block', background: 'var(--red)', color: '#fff',
                          fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase',
                          padding: '4px 10px', borderRadius: 2, marginBottom: 10,
                        }}>
                          {property.badge}
                        </span>
                      )}
                      <h1 style={{
                        fontFamily: "'Poppins', sans-serif",
                        fontSize: 'clamp(18px, 5vw, 30px)',
                        fontWeight: 700, lineHeight: 1.2,
                        wordBreak: 'break-word', margin: 0,
                      }}>
                        {property.title}
                      </h1>
                      <p style={{ color: '#000', fontSize: 16, marginTop: 8, fontWeight: 600 }}>
                        📍 {property.location}
                      </p>
                    </div>
                    <div className="hol-price-block" style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div className="hol-price" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, color: 'var(--red)' }}>
                        £{property.price.toLocaleString()}
                      </div>
                      <div style={{ fontSize: 13, color: '#555' }}>per month</div>
                    </div>
                  </div>

                  {/* Key Features */}
                  <div
                    className="hol-key-features"
                    style={{
                      padding: '16px 0',
                      borderTop: '1px solid var(--gray-200)',
                      borderBottom: '1px solid var(--gray-200)',
                      marginBottom: 24,
                    }}
                  >
                    {[
                      { icon: '🛏', label: 'Bedrooms', value: bedsLabel },
                      { icon: '🚿', label: 'Bathrooms', value: `${property.bathrooms}` },
                      { icon: '📐', label: 'Size', value: property.sqft ? `${property.sqft} sqft` : 'N/A' },
                      { icon: '🪑', label: 'Furnished', value: property.furnished ? property.furnished.charAt(0).toUpperCase() + property.furnished.slice(1) : 'N/A' },
                    ].map(f => (
                      <div key={f.label} className="hol-feature-item" style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 22, marginBottom: 4 }}>{f.icon}</div>
                        <div style={{ fontSize: 12, color: '#555', marginBottom: 2 }}>{f.label}</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--black)' }}>{f.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Description */}
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>About this property</h3>
                  <div style={{ fontSize: 15, color: '#333', lineHeight: 1.75, overflowWrap: 'break-word', wordBreak: 'break-word' }}>
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

              {/* ── RIGHT COLUMN ── */}
              <div className="hol-right-col">
                <div className="hol-contact-sticky">

                  {/* Contact Card */}
                  <div
                    className="hol-panel"
                    style={{
                      background: '#fff', border: '1px solid var(--gray-200)',
                      borderRadius: 8, padding: 24,
                      animation: mounted ? 'hol-fadeUp 0.5s ease 0.2s both' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                      <div style={{
                        width: 44, height: 44, background: 'var(--black)', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontFamily: "'Poppins', sans-serif", fontSize: 17, fontWeight: 700,
                        flexShrink: 0,
                      }}>
                        {landlordName ? landlordName.charAt(0).toUpperCase() : '🏠'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--black)' }}>{landlordName || 'Property Owner'}</div>
                        <div style={{ fontSize: 13, color: '#555' }}>Property Owner</div>
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
                      padding: '10px 14px', fontSize: 13, color: '#166534', marginBottom: 16,
                    }}>
                      ✓ No agency fees — contact landlord directly
                    </div>

                    {/* Book a Viewing */}
                    <button
                      onClick={() => setEnquiryOpen(true)}
                      onMouseEnter={() => setViewingHovered(true)}
                      onMouseLeave={() => setViewingHovered(false)}
                      style={{
                        width: '100%', padding: '13px 14px',
                        background: viewingHovered
                          ? 'linear-gradient(135deg,#142f4a,#1a56a0)'
                          : 'linear-gradient(135deg,#1a3c5e,#2563a8)',
                        color: '#fff', border: 'none', borderRadius: 6,
                        fontSize: 14, fontWeight: 600, letterSpacing: '0.5px',
                        textTransform: 'uppercase', cursor: 'pointer', marginBottom: 10,
                        transform: viewingHovered ? 'scale(1.02)' : 'scale(1)',
                        boxShadow: viewingHovered ? '0 4px 16px rgba(37,99,168,0.4)' : '0 2px 8px rgba(37,99,168,0.25)',
                        transition: 'all 0.2s',
                        fontFamily: "'Poppins', sans-serif",
                      }}
                    >
                      🏠 Book a Viewing
                    </button>

                    {/* Phone */}
                    <a
                      href={contactPhoneHref}
                      onMouseEnter={() => setBtnHovered(true)}
                      onMouseLeave={() => setBtnHovered(false)}
                      style={{
                        display: 'block', width: '100%', padding: '13px 14px',
                        background: btnHovered ? '#b71c1c' : 'var(--red)',
                        color: '#fff', textDecoration: 'none',
                        borderRadius: 4, fontSize: 14, fontWeight: 600,
                        letterSpacing: '0.5px', textTransform: 'uppercase',
                        cursor: 'pointer', marginBottom: 12, textAlign: 'center',
                        transform: btnHovered ? 'scale(1.02)' : 'scale(1)',
                        boxShadow: btnHovered ? '0 4px 16px rgba(198,40,40,0.35)' : 'none',
                        transition: 'transform 0.2s, box-shadow 0.2s, background 0.2s',
                        fontFamily: "'Poppins', sans-serif",
                        boxSizing: 'border-box',
                      }}
                    >
                      📞 Contact Us — {contactPhone}
                    </a>

                    <div style={{ borderTop: '1px solid var(--gray-200)', marginTop: 16, paddingTop: 16 }}>
                      {[
                        { label: 'Property ID', value: property.id?.slice(0, 8).toUpperCase() },
                        { label: 'Status', value: property.status.charAt(0).toUpperCase() + property.status.slice(1) },
                        { label: 'Listed', value: property.createdAt ? new Date((property.createdAt as any).seconds * 1000).toLocaleDateString('en-GB') : 'Recent' },
                      ].map(r => (
                        <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 13 }}>
                          <span style={{ color: '#555' }}>{r.label}</span>
                          <span style={{ fontWeight: 500 }}>{r.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Link href="/listings" style={{
                    display: 'block', textAlign: 'center', marginTop: 12,
                    color: '#555', fontSize: 13,
                  }}>
                    ← Back to listings
                  </Link>

                  {/* Pricing Details */}
                  <div className="hol-panel" style={{
                    background: '#fff', border: '1px solid var(--gray-200)',
                    borderRadius: 8, padding: '16px 20px', marginTop: 16,
                  }}>
                    <h4 style={{ fontSize: 13, fontWeight: 700, color: '#222', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Pricing Details
                    </h4>
                    {[
                      { label: 'Rent PCM', value: `£${property.price.toLocaleString()}` },
                      { label: 'Deposit', value: property.depositAmount ? `£${property.depositAmount.toLocaleString()}` : 'N/A' },
                      { label: 'Bills Included', value: property.billsIncluded ? '✓ Yes' : '✗ No', color: property.billsIncluded ? '#166534' : '#c62828' },
                      {
                        label: 'Available From',
                        value: property.availableFrom
                          ? new Date(property.availableFrom).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                          : 'Now',
                      },
                    ].map(r => (
                      <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
                        <span style={{ color: '#444' }}>{r.label}</span>
                        <span style={{ fontWeight: 600, color: (r as any).color || '#222' }}>{r.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Features & Amenities */}
                  <div className="hol-panel" style={{
                    background: '#fff', border: '1px solid var(--gray-200)',
                    borderRadius: 8, padding: '16px 20px', marginTop: 12,
                  }}>
                    <h4 style={{ fontSize: 13, fontWeight: 700, color: '#222', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Features &amp; Amenities
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px 16px' }}>
                      {[
                        { label: 'Garden', value: property.garden && property.garden !== 'none', isText: false },
                        { label: 'Parking', value: property.parking && property.parking !== 'none', isText: false },
                        { label: 'Balcony', value: property.balcony, isText: false },
                        { label: 'Furnishing', value: property.furnished ? property.furnished.charAt(0).toUpperCase() + property.furnished.slice(1) : null, isText: true },
                      ].map(feat => (
                        <div key={feat.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                          <span style={{ color: '#444' }}>{feat.label}</span>
                          {feat.isText
                            ? <span style={{ fontWeight: 600, color: '#222' }}>{feat.value as string || 'N/A'}</span>
                            : <span style={{ color: feat.value ? '#166534' : '#c62828', fontWeight: 600 }}>{feat.value ? '✓' : '✗'}</span>
                          }
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <TenantEnquiryModal
        isOpen={enquiryOpen}
        onClose={() => setEnquiryOpen(false)}
        propertyTitle={property.title}
        propertyPrice={property.price}
      />
    </>
  );
}
