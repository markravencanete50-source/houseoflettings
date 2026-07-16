'use client';
// app/listings/[id]/PropertyDetailClient.tsx
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { getProperty } from '@/services/property';
import { getOrCreateChat } from '@/services/chat';
import { getUserProfile } from '@/services/auth';
import { useAuth } from '@/hooks/useAuth';
import { Property, propertyAvailability } from '@/lib/types';
import TenantEnquiryModal from '@/components/property/TenantEnquiryModal';
import LetAgreedRibbon from '@/components/property/LetAgreedRibbon';
import { cityFromText } from '@/lib/viewingSlots';

// Listings store the postcode at the end of the free-text location string
// (e.g. "12 Oak Street, Headingley, Leeds, LS6 3AA"). Pull out a full UK
// postcode, or failing that a trailing outcode like "LS6".
function extractPostcode(location?: string): string {
  if (!location) return '';
  const full = location.match(/\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b/i);
  if (full) return full[0].toUpperCase();
  const outcode = location.match(/\b[A-Z]{1,2}\d[A-Z\d]?\s*$/i);
  return outcode ? outcode[0].trim().toUpperCase() : '';
}

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
  const [copiedTitle, setCopiedTitle] = useState(false);

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

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
            // If posted by an admin, always show brand name
            const isAdmin = landlord?.role === 'admin';
            setLandlordName(isAdmin ? 'House of Lettings' : (landlord?.name || 'Landlord'));
          } catch {
            setLandlordName('House of Lettings');
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

  // Lightbox keyboard nav
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!lightboxOpen || !property?.images) return;
    if (e.key === 'ArrowRight') setLightboxIndex(i => (i + 1) % property.images.length);
    if (e.key === 'ArrowLeft') setLightboxIndex(i => (i - 1 + property.images.length) % property.images.length);
    if (e.key === 'Escape') setLightboxOpen(false);
  }, [lightboxOpen, property]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

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

  const switchImage = (i: number) => {
    if (i === activeImg) return;
    setImgFading(true);
    setTimeout(() => { setActiveImg(i); setImgFading(false); }, 180);
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
  // Detect the property's city once and reuse it for both the contact phone and
  // the viewing modal. Falls back to the old Leeds-or-Manchester heuristic for
  // the phone (which must always pick one) while the modal handles null itself.
  const detectedCity = cityFromText(property.location);
  const isLeeds = detectedCity === 'Leeds' || /leeds|LS\d/i.test(property.location || '');
  const contactPhone = isLeeds ? '+44 113 868 9212' : '+44 161 768 1758';
  const contactPhoneHref = isLeeds ? 'tel:+441138689212' : 'tel:+441617681758';
  const images = property.images || [];

  return (
    <>
      <Navbar />

      <style>{`
        @keyframes hol-fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes hol-lightboxIn {
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

        /* ── Full-width gallery strip (above the layout grid) ── */
        .hol-gallery-main {
          position: relative;
          width: 100%;
          height: 480px;
          background: #111;
          overflow: hidden;
          cursor: zoom-in;
        }
        .hol-gallery-main img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: opacity 0.18s ease;
        }
        .hol-gallery-counter {
          position: absolute;
          bottom: 12px;
          right: 16px;
          background: rgba(0,0,0,0.55);
          color: #fff;
          font-size: 13px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 20px;
          pointer-events: none;
        }
        .hol-gallery-arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(0,0,0,0.45);
          color: #fff;
          border: none;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          font-size: 20px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
          z-index: 2;
        }
        .hol-gallery-arrow:hover { background: rgba(0,0,0,0.75); }
        .hol-gallery-arrow.prev { left: 12px; }
        .hol-gallery-arrow.next { right: 12px; }

        /* ── Thumbstrip ── */
        .hol-thumbstrip {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding: 8px 16px;
          background: #fff;
          scrollbar-width: none;
        }
        .hol-thumbstrip::-webkit-scrollbar { display: none; }

        /* ── Layout grid ── */
        .hol-detail-grid {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 40px;
          align-items: start;
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

        /* ── Fixed bottom CTA bar (mobile only) ── */
        .hol-bottom-cta {
          display: none;
        }

        /* ── Lightbox overlay ── */
        .hol-lightbox {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.94);
          z-index: 9999;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          animation: hol-lightboxIn 0.2s ease;
        }
        .hol-lightbox-img {
          max-width: 95vw;
          max-height: 80vh;
          object-fit: contain;
          border-radius: 4px;
          user-select: none;
        }
        .hol-lightbox-close {
          position: absolute;
          top: 16px;
          right: 20px;
          background: rgba(255,255,255,0.12);
          border: none;
          color: #fff;
          font-size: 28px;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
          transition: background 0.2s;
        }
        .hol-lightbox-close:hover { background: rgba(255,255,255,0.25); }
        .hol-lightbox-nav {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(255,255,255,0.12);
          border: none;
          color: #fff;
          font-size: 28px;
          width: 52px;
          height: 52px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }
        .hol-lightbox-nav:hover { background: rgba(255,255,255,0.28); }
        .hol-lightbox-nav.prev { left: 20px; }
        .hol-lightbox-nav.next { right: 20px; }
        .hol-lightbox-counter {
          position: absolute;
          bottom: 24px;
          color: rgba(255,255,255,0.7);
          font-size: 14px;
          font-weight: 500;
          letter-spacing: 0.5px;
        }
        .hol-lightbox-dots {
          position: absolute;
          bottom: 52px;
          display: flex;
          gap: 6px;
        }
        .hol-lightbox-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: rgba(255,255,255,0.35);
          transition: background 0.2s;
        }
        .hol-lightbox-dot.active {
          background: #fff;
        }

        /* Hide mobile extras on desktop */
        .hol-mobile-extras {
          display: none;
        }

        /* ── MOBILE ── */
        @media (max-width: 768px) {
          .hol-gallery-main {
            height: 260px;
            border-radius: 0;
          }

          .hol-detail-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }

          /* Show mobile extras */
          .hol-mobile-extras {
            display: block;
          }

          /* Hide desktop contact card on mobile */
          .hol-right-col {
            display: none;
          }

          .hol-contact-sticky {
            position: static;
            top: unset;
          }

          .hol-key-features {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }

          .hol-price {
            font-size: 26px;
          }

          .hol-title-price-row {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 8px !important;
          }

          .hol-price-block {
            text-align: left !important;
          }

          /* Show fixed bottom CTA */
          .hol-bottom-cta {
            display: flex;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            z-index: 100;
            background: #fff;
            border-top: 1px solid #e0e0e0;
            padding: 10px 14px;
            gap: 10px;
            box-shadow: 0 -4px 20px rgba(0,0,0,0.12);
          }

          /* Bottom padding so content doesn't hide behind fixed bar */
          .hol-page-content {
            padding-bottom: 90px !important;
          }
        }

        @media (max-width: 480px) {
          .hol-gallery-main {
            height: 220px;
          }
          .hol-key-features {
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
          }
        }
      `}</style>

      {/* ── LIGHTBOX ── */}
      {lightboxOpen && images.length > 0 && (
        <div className="hol-lightbox" onClick={() => setLightboxOpen(false)}>
          <button
            className="hol-lightbox-close"
            onClick={() => setLightboxOpen(false)}
          >×</button>

          <img
            className="hol-lightbox-img"
            src={images[lightboxIndex]}
            alt={`Photo ${lightboxIndex + 1}`}
            onClick={e => e.stopPropagation()}
            draggable={false}
          />

          {images.length > 1 && (
            <>
              <button
                className="hol-lightbox-nav prev"
                onClick={e => { e.stopPropagation(); setLightboxIndex(i => (i - 1 + images.length) % images.length); }}
              >‹</button>
              <button
                className="hol-lightbox-nav next"
                onClick={e => { e.stopPropagation(); setLightboxIndex(i => (i + 1) % images.length); }}
              >›</button>
              <div className="hol-lightbox-dots">
                {images.map((_, i) => (
                  <div
                    key={i}
                    className={`hol-lightbox-dot${i === lightboxIndex ? ' active' : ''}`}
                    onClick={e => { e.stopPropagation(); setLightboxIndex(i); }}
                  />
                ))}
              </div>
              <div className="hol-lightbox-counter">{lightboxIndex + 1} / {images.length}</div>
            </>
          )}
        </div>
      )}

      {/* ── FIXED MOBILE BOTTOM CTA ── */}
      <div className="hol-bottom-cta">
        <button
          onClick={() => setEnquiryOpen(true)}
          style={{
            flex: 1, padding: '13px 8px',
            background: 'linear-gradient(135deg,#1a3c5e,#2563a8)',
            color: '#fff', border: 'none', borderRadius: 8,
            fontSize: 14, fontWeight: 700, letterSpacing: '0.3px',
            cursor: 'pointer', fontFamily: "'Poppins', sans-serif",
          }}
        >
          BOOK A VIEWING
        </button>
      </div>

      <div style={{ minHeight: '100vh', background: 'var(--gray-100)' }}>

        {/* ── FULL-WIDTH GALLERY (above everything) ── */}
        <div style={{ background: '#111' }}>
          {/* Main image */}
          <div
            className="hol-gallery-main"
            onClick={() => openLightbox(activeImg)}
            title="Click to enlarge"
          >
            {images[activeImg] ? (
              <img
                src={images[activeImg]}
                alt={property.title}
                style={{ opacity: imgFading ? 0 : 1 }}
              />
            ) : (
              <div style={{
                width: '100%', height: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'rgba(255,255,255,0.4)', fontSize: 14,
              }}>
                No Image Available
              </div>
            )}

            {propertyAvailability(property) === 'let-agreed' && <LetAgreedRibbon fontSize={28} />}
            {propertyAvailability(property) === 'pending' && <LetAgreedRibbon fontSize={28} label="Pending" color="#ef6c00" />}

            {images.length > 0 && (
              <div className="hol-gallery-counter">
                📷 {activeImg + 1} / {images.length}
              </div>
            )}

            {images.length > 1 && (
              <>
                <button
                  className="hol-gallery-arrow prev"
                  onClick={e => { e.stopPropagation(); switchImage((activeImg - 1 + images.length) % images.length); }}
                >‹</button>
                <button
                  className="hol-gallery-arrow next"
                  onClick={e => { e.stopPropagation(); switchImage((activeImg + 1) % images.length); }}
                >›</button>
              </>
            )}
          </div>

          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div className="hol-thumbstrip">
              {images.map((img, i) => (
                <div
                  key={i}
                  onClick={() => switchImage(i)}
                  className="hol-thumb"
                  style={{
                    width: 80, height: 56, flexShrink: 0,
                    borderRadius: 6, overflow: 'hidden', cursor: 'pointer',
                    border: `2px solid ${i === activeImg ? 'var(--red)' : 'transparent'}`,
                    opacity: i === activeImg ? 1 : 0.65,
                    transition: 'opacity 0.2s, border 0.2s, transform 0.2s',
                  }}
                >
                  <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          )}
        </div>

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

        <div className="hol-page-content" style={{ padding: '24px 16px' }}>
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
                {/* Details Panel */}
                <div
                  className="hol-panel"
                  style={{
                    background: '#fff', border: '1px solid var(--gray-200)',
                    borderRadius: 8, padding: 'clamp(16px, 4%, 32px)',
                    animation: mounted ? 'hol-fadeUp 0.5s ease 0.1s both' : 'none',
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

                {/* ── MOBILE ONLY: Pricing Details + Features ── */}
                <div className="hol-mobile-extras">
                  <div style={{
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

                  <div style={{
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

                  <div style={{
                    background: '#fff', border: '1px solid var(--gray-200)',
                    borderRadius: 8, padding: '16px 20px', marginTop: 12,
                  }}>
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

              </div>

              {/* ── RIGHT COLUMN (desktop only) ── */}
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


                    {error && (
                      <div style={{
                        background: '#fce4ec', color: '#c62828', padding: '10px 14px',
                        borderRadius: 4, fontSize: 13, marginBottom: 16,
                      }}>
                        {error}
                      </div>
                    )}

                    <div style={{
                      textAlign: 'center', fontSize: 15, fontWeight: 700,
                      color: '#0f1f3d', marginBottom: 16,
                      fontFamily: "'Poppins', sans-serif",
                    }}>
                      House of Lettings
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
                      BOOK A VIEWING
                    </button>

                    {/* Agent-only: exact calendar event title to open viewing
                        availability for this property (matched by first line + postcode). */}
                    {profile?.role === 'admin' && property.location && (
                      <div style={{
                        marginTop: 12, marginBottom: 4, padding: '12px 14px',
                        background: '#f0f4ff', border: '1px dashed #93b4e6',
                        borderRadius: 8, fontFamily: "'Poppins', sans-serif",
                      }}>
                        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#1a3c5e', marginBottom: 6 }}>
                          Agent · calendar event title
                        </div>
                        <div style={{ fontSize: 13, color: '#0f1f3d', fontWeight: 600, wordBreak: 'break-word', marginBottom: 8 }}>
                          {property.location}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard?.writeText(property.location || '').then(() => {
                              setCopiedTitle(true);
                              setTimeout(() => setCopiedTitle(false), 2000);
                            });
                          }}
                          style={{
                            width: '100%', padding: '8px 10px', fontSize: 12, fontWeight: 600,
                            border: '1px solid #2563a8', borderRadius: 6, cursor: 'pointer',
                            background: copiedTitle ? '#2563a8' : '#fff', color: copiedTitle ? '#fff' : '#2563a8',
                            fontFamily: "'Poppins', sans-serif", transition: 'all 0.15s',
                          }}
                        >
                          {copiedTitle ? '✓ Copied' : 'Copy title'}
                        </button>
                        <p style={{ fontSize: 11, color: '#5b6b82', margin: '8px 0 0', lineHeight: 1.5 }}>
                          Create a Google Calendar event with this title and set its time to the viewing window. Times sync to this listing within ~1 min.
                        </p>
                      </div>
                    )}

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
        propertyPostcode={extractPostcode(property.location)}
        propertyCity={detectedCity}
        propertyAddress={property.location}
      />
      <Footer />
    </>
  );
}
