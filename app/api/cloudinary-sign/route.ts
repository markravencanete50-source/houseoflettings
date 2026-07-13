// app/api/cloudinary-sign/route.ts
// Returns a short-lived signature so the browser can upload files (images and
// videos, any size) DIRECTLY to Cloudinary — bypassing Vercel's ~4.5MB request
// body limit that would otherwise break photo/video uploads.
import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { rateLimit } from '@/lib/rateLimit';

// Only the folders our own upload forms actually use — a signature for an
// arbitrary attacker-chosen folder is never issued.
const ALLOWED_FOLDERS = new Set([
  'houseoflettings/maintenance',
  'houseoflettings/guarantor',
  'houseoflettings/landlord-docs',
]);

export async function POST(req: NextRequest) {
  // Uploads are multi-file, so allow bursts — but cap runaway abuse.
  const limited = rateLimit(req, 'cloudinary-sign', 30, 10 * 60 * 1000);
  if (limited) return limited;
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json({ error: 'Cloudinary is not configured' }, { status: 500 });
    }

    const { folder = 'houseoflettings/maintenance' } = await req.json().catch(() => ({}));
    if (!ALLOWED_FOLDERS.has(folder)) {
      return NextResponse.json({ error: 'Invalid upload folder' }, { status: 400 });
    }
    const timestamp = Math.round(Date.now() / 1000);

    // Sign exactly the params the browser will send (besides file/api_key/resource_type).
    const signature = cloudinary.utils.api_sign_request({ timestamp, folder }, apiSecret);

    return NextResponse.json({ cloudName, apiKey, timestamp, folder, signature });
  } catch (err: any) {
    console.error('cloudinary-sign error:', err);
    return NextResponse.json({ error: err.message || 'Failed to sign upload' }, { status: 500 });
  }
}
