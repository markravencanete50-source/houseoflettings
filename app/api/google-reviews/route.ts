// app/api/google-reviews/route.ts
// Server-side proxy for Google Places details so the key never does more than
// we intend. The requested fields are FIXED here — previously the client could
// pass any `fields` value, turning this into a general Places-API proxy on our
// quota/bill. placeId is validated and the whole route is rate limited.
import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rateLimit';

// Google place IDs are URL-safe base64-ish tokens.
const PLACE_ID_RE = /^[A-Za-z0-9_-]{10,300}$/;
const FIELDS = 'name,rating,user_ratings_total,reviews';

export async function GET(req: NextRequest) {
  const limited = rateLimit(req, 'google-reviews', 30, 10 * 60 * 1000);
  if (limited) return limited;

  const { searchParams } = new URL(req.url);
  const placeId = searchParams.get('placeId') || '';

  if (!PLACE_ID_RE.test(placeId)) {
    return NextResponse.json({ error: 'Invalid placeId' }, { status: 400 });
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=${FIELDS}&key=${apiKey}`;
    const res = await fetch(url, { next: { revalidate: 3600 } }); // cache 1 hour
    const data = await res.json();

    if (data.status !== 'OK') {
      return NextResponse.json({ error: data.status, message: data.error_message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}
