import { NextRequest, NextResponse } from 'next/server';

// Homedata "Address by Postcode" integration.
// Docs: https://homedata.co.uk/docs/endpoints
// Keeps the API key server-side and safe from exposure.

const HOMEDATA_API_KEY = process.env.HOMEDATA_API_KEY;
// Call the backend host directly. The documented homedata.co.uk/api/v1 host
// 301-redirects here, and fetch() strips the Authorization header across the
// cross-subdomain redirect — so we target the final URL to keep auth intact.
const HOMEDATA_BASE_URL = 'https://api.homedata.co.uk/api';

export type AddressResult = {
  street: string;   // first line of the address (sub-building / name / number + street)
  city: string;
  county: string;
  postcode: string;
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get('postcode');

  if (!raw || raw.trim().length < 3) {
    return NextResponse.json(
      { error: 'Postcode is required and must be at least 3 characters.' },
      { status: 400 }
    );
  }

  if (!HOMEDATA_API_KEY) {
    return NextResponse.json(
      { error: 'Address lookup is not configured.' },
      { status: 500 }
    );
  }

  // Postcode goes in the path; spaces removed (e.g. "LS1 1AA" -> "LS11AA").
  const postcodePath = encodeURIComponent(raw.toUpperCase().replace(/\s+/g, ''));

  try {
    const response = await fetch(
      `${HOMEDATA_BASE_URL}/address/postcode/${postcodePath}`,
      {
        headers: {
          Authorization: `Api-Key ${HOMEDATA_API_KEY}`,
          Accept: 'application/json',
          'User-Agent': 'HouseOfLettings/1.0',
        },
      }
    );

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      console.error(`Homedata API ${response.status}: ${body}`);
      if (response.status === 404) {
        return NextResponse.json({ addresses: [] });
      }
      return NextResponse.json(
        { error: 'Could not look up addresses right now. Please enter it manually.' },
        { status: 502 }
      );
    }

    const data = (await response.json()) as {
      postcode?: string;
      count?: number;
      addresses?: Array<{
        address?: string;
        building_name?: string;
        building_number?: string;
        sub_building?: string;
        street?: string;
        town?: string;
      }>;
    };

    const topPostcode = data.postcode || raw.toUpperCase();
    const addresses = data.addresses || [];

    const results: AddressResult[] = addresses.map((a) => {
      const numberStreet = [a.building_number, a.street].filter(Boolean).join(' ');
      const firstLine =
        [a.sub_building, a.building_name, numberStreet].filter(Boolean).join(', ') ||
        a.address ||
        '';
      return {
        street: firstLine,
        city: a.town || '',
        county: '',
        postcode: topPostcode,
      };
    });

    return NextResponse.json({ addresses: results });
  } catch (error) {
    console.error('Address lookup error:', error);
    return NextResponse.json(
      { error: 'Could not look up addresses right now. Please enter it manually.' },
      { status: 502 }
    );
  }
}
