'use client';
// components/property/PropertyCard.tsx
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Property } from '@/lib/types';
import { optimizedImage } from '@/lib/imageUrl';
import { formatMiles } from '@/lib/geo';
import LetAgreedRibbon from '@/components/property/LetAgreedRibbon';

interface PropertyCardProps {
  property: Property;
  /** Distance from the searched location, in miles (shown when radius search is active). */
  distanceMiles?: number;
}

export default function PropertyCard({ property, distanceMiles }: PropertyCardProps) {
  const router = useRouter();
  const [hovered, setHovered] = useState(false);
  const [btnHovered, setBtnHovered] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  const bedsLabel = property.bedrooms === 0 ? 'Studio' :
    `${property.bedrooms} Bed${property.bedrooms > 1 ? 's' : ''}`;

  return (
    <div
      onClick={() => router.push(`/listings/${property.id}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#ffffff',
        borderRadius: 8,
        overflow: 'hidden',
        boxShadow: hovered
          ? '0 8px 32px rgba(15,31,61,0.18)'
          : '0 2px 12px rgba(15,31,61,0.10)',
        cursor: 'pointer',
        transition: 'box-shadow 0.2s, transform 0.2s',
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      {/* Image */}
      <div style={{ position: 'relative', width: '100%', height: 200, flexShrink: 0 }}>
        {property.images?.[0] && !imgFailed ? (
          <img
            src={optimizedImage(property.images[0], 640)}
            alt={property.title}
            loading="lazy"
            decoding="async"
            onError={() => setImgFailed(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%', background: '#e8edf3',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#8a99b3', fontSize: 14, fontFamily: "'Poppins', sans-serif",
          }}>
            No Image Available
          </div>
        )}
        {property.badge && (
          <span style={{
            position: 'absolute', top: 12, left: 12,
            background: '#0f1f3d', color: '#fff',
            fontSize: 11, fontWeight: 700, fontFamily: "'Poppins', sans-serif",
            padding: '4px 10px', borderRadius: 3,
            textTransform: 'uppercase', letterSpacing: '0.6px',
          }}>
            {property.badge}
          </span>
        )}
        {property.letAgreed && <LetAgreedRibbon fontSize={16} />}
      </div>

      {/* Body */}
      <div style={{
        padding: '18px 20px 20px',
        display: 'flex', flexDirection: 'column', gap: 6, flex: 1,
      }}>
        {/* Price */}
        <div style={{
          fontSize: 22, fontWeight: 700, color: '#0f1f3d',
          fontFamily: "'Poppins', sans-serif",
        }}>
          £{property.price.toLocaleString()}
          <span style={{ fontSize: 13, fontWeight: 400, color: '#5a6a80' }}> / month</span>
        </div>

        {/* Title */}
        <div style={{
          fontSize: 15, fontWeight: 600, color: '#1a2e4a',
          fontFamily: "'Poppins', sans-serif", lineHeight: 1.4,
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {property.title}
        </div>

        {/* Location */}
        <div style={{ fontSize: 13, color: '#5a6a80', fontFamily: "'Poppins', sans-serif", display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span>📍 {property.location}</span>
          {distanceMiles != null && (
            <span style={{
              fontSize: 11.5, fontWeight: 700, color: '#0f1f3d', background: '#e8f0fb',
              borderRadius: 999, padding: '2px 9px', whiteSpace: 'nowrap',
            }}>
              {formatMiles(distanceMiles)} away
            </span>
          )}
        </div>

        {/* Features */}
        <div style={{
          display: 'flex', gap: 12, flexWrap: 'wrap',
          fontSize: 13, color: '#3a4f6a', marginTop: 4,
          fontFamily: "'Poppins', sans-serif",
        }}>
          <span>🛏 {bedsLabel}</span>
          <span>🚿 {property.bathrooms} Bath</span>
          {property.sqft && <span>📐 {property.sqft} sqft</span>}
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Button */}
        <button
          onClick={e => { e.stopPropagation(); router.push(`/listings/${property.id}`); }}
          onMouseEnter={() => setBtnHovered(true)}
          onMouseLeave={() => setBtnHovered(false)}
          style={{
            marginTop: 14,
            width: '100%',
            padding: '12px 16px',
            minHeight: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: btnHovered ? '#c0392b' : '#0f1f3d',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            fontSize: 13,
            fontWeight: 600,
            fontFamily: "'Poppins', sans-serif",
            textAlign: 'center',
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
        >
          View Details →
        </button>
      </div>
    </div>
  );
}
