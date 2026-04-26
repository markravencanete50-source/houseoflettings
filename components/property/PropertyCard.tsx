'use client';
// components/property/PropertyCard.tsx
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Property } from '@/lib/types';

interface PropertyCardProps {
  property: Property;
}

export default function PropertyCard({ property }: PropertyCardProps) {
  const router = useRouter();
  const bedsLabel = property.bedrooms === 0 ? 'Studio' :
    `${property.bedrooms} Bed${property.bedrooms > 1 ? 's' : ''}`;

  return (
    <div
      className="prop-card"
      onClick={() => router.push(`/listings/${property.id}`)}
    >
      <div className="prop-img">
        {property.images?.[0] ? (
          <img
            src={property.images[0]}
            alt={property.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%', background: 'var(--gray-200)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--gray-400)', fontSize: 14,
          }}>
            No Image
          </div>
        )}
        {property.badge && (
          <span className="prop-badge">{property.badge}</span>
        )}
      </div>

      <div className="prop-body">
        <div className="prop-price">
          £{property.price.toLocaleString()}
          <span> / month</span>
        </div>
        <div className="prop-title">{property.title}</div>
        <div className="prop-loc">📍 {property.location}</div>
        <div className="prop-features">
          <span>🛏 {bedsLabel}</span>
          <span>🚿 {property.bathrooms} Bath</span>
          {property.sqft && <span>📐 {property.sqft} sqft</span>}
        </div>
        <button
          className="btn-view"
          style={{
            display: 'block', width: '100%', marginTop: 14,
            padding: 11, background: 'var(--black)', color: '#fff',
            border: 'none', borderRadius: 4, fontSize: 13, fontWeight: 600,
            textAlign: 'center', letterSpacing: '0.5px', textTransform: 'uppercase',
            cursor: 'pointer', transition: 'background .2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--red)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--black)')}
        >
          View Details →
        </button>
      </div>
    </div>
  );
}
