'use client';
// components/GoogleReviews.tsx
import { useState, useEffect, useRef } from 'react';

interface Review {
  author_name: string;
  rating: number;
  text: string;
  time: number;
  profile_photo_url: string;
  relative_time_description: string;
}

interface LocationData {
  name: string;
  rating: number;
  total: number;
  reviews: Review[];
}

const LEEDS_PLACE_ID = 'ChIJV8vk8HZceUgR1V7PC7_gtO8';
const MANCHESTER_PLACE_ID = 'ChIJiQgM0sOxe0gRrCOLwmNS7gs';

function StarRating({ rating }: { rating: number }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill={i <= rating ? '#F59E0B' : '#e5e7eb'}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const [expanded, setExpanded] = useState(false);
  const MAX = 160;
  const isLong = review.text.length > MAX;
  const initials = review.author_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div style={{
      background: '#fff',
      borderRadius: 12,
      padding: '28px 24px',
      boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
      border: '1px solid #f0f0f0',
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
      flex: '0 0 320px',
      scrollSnapAlign: 'start',
      transition: 'box-shadow 0.2s ease, transform 0.2s ease',
    }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(37,99,235,0.12)';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 16px rgba(0,0,0,0.06)';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
      }}
    >
      {/* Quote mark */}
      <div style={{ color: '#2563eb', fontSize: 36, lineHeight: 1, fontFamily: 'Georgia, serif', marginBottom: -8 }}>&ldquo;</div>

      {/* Review text */}
      <p style={{
        fontFamily: "'Poppins', sans-serif",
        fontSize: 14, color: '#374151', lineHeight: 1.7,
        margin: 0, flex: 1,
      }}>
        {isLong && !expanded ? review.text.slice(0, MAX) + '…' : review.text}
        {isLong && (
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#2563eb', fontSize: 13, fontWeight: 600,
              padding: '0 0 0 4px', fontFamily: "'Poppins', sans-serif",
            }}
          >
            {expanded ? 'show less' : 'read more'}
          </button>
        )}
      </p>

      {/* Divider */}
      <div style={{ height: 1, background: '#f3f4f6' }} />

      {/* Author row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {review.profile_photo_url ? (
          <img
            src={review.profile_photo_url}
            alt={review.author_name}
            style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
          />
        ) : (
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'linear-gradient(135deg, #2563eb, #4a90d9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 13, fontWeight: 700, flexShrink: 0,
            fontFamily: "'Poppins', sans-serif",
          }}>
            {initials}
          </div>
        )}
        <div>
          <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 13, fontWeight: 700, color: '#0f1f3d' }}>
            {review.author_name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
            <StarRating rating={review.rating} />
            <span style={{ fontSize: 11, color: '#9ca3af', fontFamily: "'Poppins', sans-serif" }}>
              {review.relative_time_description}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GoogleReviews() {
  const [activeTab, setActiveTab] = useState<'leeds' | 'manchester'>('leeds');
  const [data, setData] = useState<{ leeds: LocationData | null; manchester: LocationData | null }>({
    leeds: null,
    manchester: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
    if (!apiKey) { setError(true); setLoading(false); return; }

    const fetchPlace = async (placeId: string): Promise<LocationData | null> => {
      try {
        const fields = 'name,rating,user_ratings_total,reviews';
        const url = `/api/google-reviews?placeId=${placeId}&fields=${fields}`;
        const res = await fetch(url);
        if (!res.ok) return null;
        const json = await res.json();
        const result = json.result;
        const filtered = (result.reviews || []).filter((r: Review) => r.rating >= 4);
        return {
          name: result.name,
          rating: result.rating,
          total: result.user_ratings_total,
          reviews: filtered,
        };
      } catch {
        return null;
      }
    };

    Promise.all([
      fetchPlace(LEEDS_PLACE_ID),
      fetchPlace(MANCHESTER_PLACE_ID),
    ]).then(([leeds, manchester]) => {
      setData({ leeds, manchester });
      setLoading(false);
    }).catch(() => {
      setError(true);
      setLoading(false);
    });
  }, []);

  const onMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    startX.current = e.pageX - (trackRef.current?.offsetLeft ?? 0);
    scrollLeft.current = trackRef.current?.scrollLeft ?? 0;
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !trackRef.current) return;
    e.preventDefault();
    const x = e.pageX - (trackRef.current.offsetLeft ?? 0);
    trackRef.current.scrollLeft = scrollLeft.current - (x - startX.current);
  };
  const onMouseUp = () => { isDragging.current = false; };

  const current = activeTab === 'leeds' ? data.leeds : data.manchester;

  return (
    <section style={{
      padding: 'clamp(60px, 8vw, 100px) 0',
      background: 'linear-gradient(160deg, #f7f8fa 0%, #eef1f8 100%)',
      borderTop: '1px solid rgba(37,99,235,0.08)',
      overflow: 'hidden',
    }}>
      <style>{`
        .reviews-track::-webkit-scrollbar { display: none; }
        .reviews-track { -ms-overflow-style: none; scrollbar-width: none; }
        .reviews-tab {
          padding: 10px 24px;
          border-radius: 6px;
          font-family: 'Poppins', sans-serif;
          font-size: 13px; font-weight: 700;
          letter-spacing: 0.5px;
          cursor: pointer;
          border: 2px solid transparent;
          transition: all 0.2s ease;
        }
        .reviews-tab.active {
          background: #2563eb;
          color: #fff;
          border-color: #2563eb;
        }
        .reviews-tab.inactive {
          background: #fff;
          color: #0f1f3d;
          border-color: #e5e7eb;
        }
        .reviews-tab.inactive:hover {
          border-color: #2563eb;
          color: #2563eb;
        }
        @keyframes reviews-shimmer {
          0% { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        .review-skeleton {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 800px 100%;
          animation: reviews-shimmer 1.4s ease infinite;
          border-radius: 8px;
        }
        @media (max-width: 480px) {
          .reviews-track > * { flex: 0 0 85vw !important; }
        }
      `}</style>

      {/* Header */}
      <div style={{ padding: '0 clamp(20px, 5%, 5%)', marginBottom: 40 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: '#2563eb', marginBottom: 14 }}>
          Customer Reviews
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <h2 style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: 'clamp(28px,4vw,44px)',
              fontWeight: 700, color: '#0f1f3d',
              margin: '0 0 8px', lineHeight: 1.1,
            }}>
              What Our Clients Say
            </h2>
            {current && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <StarRating rating={Math.round(current.rating)} />
                <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: 14, color: '#6b7280' }}>
                  <strong style={{ color: '#0f1f3d' }}>{current.rating?.toFixed(1)}</strong> out of 5 · {current.total?.toLocaleString()} reviews on Google
                </span>
              </div>
            )}
          </div>

          {/* Location tabs */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className={`reviews-tab ${activeTab === 'leeds' ? 'active' : 'inactive'}`}
              onClick={() => setActiveTab('leeds')}
            >
              📍 Leeds
            </button>
            <button
              className={`reviews-tab ${activeTab === 'manchester' ? 'active' : 'inactive'}`}
              onClick={() => setActiveTab('manchester')}
            >
              📍 Manchester
            </button>
          </div>
        </div>
      </div>

      {/* Reviews track */}
      {loading ? (
        <div style={{ display: 'flex', gap: 20, padding: '0 clamp(20px,5%,5%)' }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="review-skeleton" style={{ flex: '0 0 320px', height: 220 }} />
          ))}
        </div>
      ) : error || !current || current.reviews.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '40px 20px',
          fontFamily: "'Poppins', sans-serif", color: '#9ca3af', fontSize: 15,
        }}>
          {error ? 'Reviews unavailable at the moment.' : 'No reviews found for this location yet.'}
        </div>
      ) : (
        <div
          ref={trackRef}
          className="reviews-track"
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          style={{
            display: 'flex',
            gap: 20,
            padding: '8px clamp(20px,5%,5%) 24px',
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch' as React.CSSProperties['WebkitOverflowScrolling'],
            cursor: 'grab',
            userSelect: 'none',
          }}
        >
          {current.reviews.map((review, i) => (
            <ReviewCard key={i} review={review} />
          ))}
        </div>
      )}

      {/* Google badge */}
      <div style={{ padding: '16px clamp(20px,5%,5%) 0', display: 'flex', alignItems: 'center', gap: 8 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: 12, color: '#9ca3af' }}>
          Powered by Google Reviews · Only 4★ and 5★ reviews shown
        </span>
      </div>
    </section>
  );
}
