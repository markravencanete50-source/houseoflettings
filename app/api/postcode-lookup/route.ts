import { NextRequest, NextResponse } from 'next/server';

// Server-side proxy to getAddress.io so the API key never reaches the browser.
// Given a full UK postcode, returns every registered address at that postcode
// so the user can pick the correct first line instead of typing it by hand.
export async function GET(request: NextRequest) {
  const postcode = request.nextUrl.searchParams.get('postcode')?.trim();
  if (!postcode) {
    return NextResponse.json({ error: 'Postcode is required.' }, { status: 400 });
  }

  const apiKey = process.env.GETADDRESS_API_KEY;
  if (!apiKey) {
    console.error('postcode-lookup: GETADDRESS_API_KEY is not set');
    return NextResponse.json({ error: 'Address lookup is not configured.' }, { status: 500 });
  }

  const url = `https://api.getaddress.io/find/${encodeURIComponent(postcode)}?api-key=${apiKey}&expand=true`;

  let res: Response;
  try {
    res = await fetch(url);
  } catch (error) {
    console.error('postcode-lookup: fetch failed', error);
    return NextResponse.json({ error: 'Address lookup failed. Please try again.' }, { status: 502 });
  }

  if (res.status === 404) {
    // getAddress.io returns 404 for a well-formed postcode with no addresses on file.
    return NextResponse.json({ addresses: [] });
  }
  if (res.status === 400) {
    return NextResponse.json({ error: 'That does not look like a valid UK postcode.' }, { status: 400 });
  }
  if (!res.ok) {
    console.error('postcode-lookup: getAddress.io returned', res.status, await res.text().catch(() => ''));
    return NextResponse.json({ error: 'Address lookup failed. Please try again.' }, { status: 502 });
  }

  const data = await res.json();
  const addresses = (data.addresses || []).map((a: any) => ({
    line1: a.line_1 || '',
    line2: a.line_2 || '',
    townOrCity: a.town_or_city || '',
    county: a.county || '',
    postcode: data.postcode || postcode,
  }));

  return NextResponse.json({ addresses });
}
