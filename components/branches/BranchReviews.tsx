'use client';
// components/branches/BranchReviews.tsx
// Per-city Google reviews for a branch page (Hunters/Leaders-style social
// proof on every office page). Primary source: live Google Places reviews via
// /api/google-reviews (same route the homepage uses), filtered to 4★+.
// Fallback: the admin-curated `google_reviews` Firestore collection tagged
// with this city. Renders nothing at all if neither source has reviews.
import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { City } from '@/lib/branches';

const PLACE_IDS: Record<City, string> = {
  Leeds: 'ChIJV8vk8HZceUgR1V7PC7_gtO8',
  Manchester: 'ChIJiQgM0sOxe0gRrCOLwmNS7gs',
};

interface Review {
  author_name: string;
  rating: number;
  text: string;
  relative_time_description?: string;
  profile_photo_url?: string;
}

function Stars({ rating }: { rating: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: 2, verticalAlign: 'middle' }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width="15" height="15" viewBox="0 0 24 24" fill={i <= rating ? '#F59E0B' : '#e5e7eb'}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </span>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const [expanded, setExpanded] = useState(false);
  const MAX = 150;
  const isLong = review.text.length > MAX;
  const initials = review.author_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid var(--gray-200)',
        borderRadius: 12,
        padding: '24px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        flex: '0 0 300px',
        scrollSnapAlign: 'start',
        boxShadow: '0 2px 12px rgba(15,31,61,0.06)',
      }}
    >
      <Stars rating={review.rating} />
      <p style={{ fontSize: 14, color: 'var(--gray-800)', lineHeight: 1.65, margin: 0, flex: 1 }}>
        {isLong && !expanded ? review.text.slice(0, MAX) + '…' : review.text}
        {isLong && (
          <button
            onClick={() => setExpanded((e) => !e)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--teal-dark)', fontSize: 13, fontWeight: 600, paddingLeft: 4 }}
          >
            {expanded ? 'show less' : 'read more'}
          </button>
        )}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderTop: '1px solid var(--gray-100)', paddingTop: 12 }}>
        <span
          style={{
            width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, var(--navy), #2563eb)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 12, fontWeight: 700,
          }}
        >
          {initials}
        </span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>{review.author_name}</div>
          {review.relative_time_description && (
            <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{review.relative_time_description}</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BranchReviews({ city }: { city: City }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<{ rating: number; total: number } | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // 1) Live Google Places reviews (same API route as the homepage widget)
      try {
        const res = await fetch(
          `/api/google-reviews?placeId=${PLACE_IDS[city]}&fields=name,rating,user_ratings_total,reviews`
        );
        if (res.ok) {
          const json = await res.json();
          const result = json.result || {};
          const live: Review[] = (result.reviews || []).filter((r: Review) => r.rating >= 4);
          if (!cancelled && live.length > 0) {
            setReviews(live.slice(0, 6));
            if (result.rating) setSummary({ rating: result.rating, total: result.user_ratings_total || 0 });
            setLoaded(true);
            return;
          }
        }
      } catch {
        /* fall through to Firestore */
      }

      // 2) Admin-curated reviews tagged with this city
      try {
        const snap = await getDocs(
          query(collection(db, 'google_reviews'), where('location', '==', city.toLowerCase()))
        );
        const curated: Review[] = snap.docs
          .map((d) => d.data() as Review)
          .filter((r) => r.author_name && r.text && r.rating >= 4);
        if (!cancelled) setReviews(curated.slice(0, 6));
      } catch {
        /* permission-denied or offline — section will simply not render */
      }
      if (!cancelled) setLoaded(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [city]);

  if (!loaded || reviews.length === 0) return null;

  const mapsHref = `https://www.google.com/maps/place/?q=place_id:${PLACE_IDS[city]}`;

  return (
    <section style={{ background: '#fff', padding: 'clamp(40px,5vw,64px) 0', borderTop: '1px solid var(--gray-200)' }}>
      <style>{`
        .hol-branch-reviews::-webkit-scrollbar { display: none; }
        .hol-branch-reviews { -ms-overflow-style: none; scrollbar-width: none; }
        @media (max-width: 480px) {
          .hol-branch-reviews > * { flex: 0 0 82vw !important; }
        }
      `}</style>
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '0 5%' }}>
        <h2 style={{ fontFamily: "'Poppins',sans-serif", fontSize: 'clamp(22px,3vw,30px)', fontWeight: 800, color: 'var(--navy)', marginBottom: 6, letterSpacing: '-0.5px' }}>
          What our {city} clients say
        </h2>
        <p style={{ fontSize: 14, color: 'var(--gray-600)', marginBottom: 26 }}>
          {summary ? (
            <>
              <Stars rating={Math.round(summary.rating)} />{' '}
              <strong style={{ color: 'var(--navy)' }}>{summary.rating.toFixed(1)}</strong> out of 5 ·{' '}
              {summary.total.toLocaleString()} reviews on{' '}
            </>
          ) : (
            <>Genuine reviews from our {city} landlords and tenants on </>
          )}
          <a href={mapsHref} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--teal-dark)', fontWeight: 600 }}>
            Google
          </a>
        </p>
      </div>
      <div
        className="hol-branch-reviews"
        style={{
          display: 'flex',
          gap: 18,
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch' as React.CSSProperties['WebkitOverflowScrolling'],
          padding: '4px 5% 12px',
        }}
      >
        {reviews.map((r, i) => (
          <ReviewCard key={i} review={r} />
        ))}
      </div>
    </section>
  );
}
