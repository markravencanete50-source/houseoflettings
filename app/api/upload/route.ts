// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { rateLimit } from '@/lib/rateLimit';

// The forms that post here only send images and PDFs.
const ALLOWED_TYPES = /^(image\/(jpeg|png|webp|gif|heic|heif|avif)|application\/pdf)$/;
const MAX_BYTES = 8 * 1024 * 1024; // Vercel body limit is ~4.5MB anyway

// Fallback layer: the Content-Type above is client-declared, so also check the
// file's magic bytes actually match a type we accept. Cheap, and it stops a
// renamed executable/HTML file riding in under an image MIME type.
function matchesSignature(buf: Buffer, mime: string): boolean {
  if (buf.length < 12) return false;
  if (mime === 'application/pdf') return buf.subarray(0, 5).toString('latin1') === '%PDF-';
  if (mime === 'image/jpeg') return buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  if (mime === 'image/png') return buf[0] === 0x89 && buf.subarray(1, 4).toString('latin1') === 'PNG';
  if (mime === 'image/gif') return buf.subarray(0, 3).toString('latin1') === 'GIF';
  if (mime === 'image/webp')
    return buf.subarray(0, 4).toString('latin1') === 'RIFF' && buf.subarray(8, 12).toString('latin1') === 'WEBP';
  // HEIC/HEIF/AVIF are ISO-BMFF: a size box then 'ftyp'.
  if (/^image\/(heic|heif|avif)$/.test(mime)) return buf.subarray(4, 8).toString('latin1') === 'ftyp';
  return false;
}

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, 'upload', 30, 10 * 60 * 1000);
  if (limited) return limited;
  try {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file || file.size === 0) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'File is too large (8MB max)' }, { status: 413 });
    }
    if (!ALLOWED_TYPES.test(file.type || '')) {
      return NextResponse.json({ error: 'Only images and PDF files are accepted' }, { status: 415 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    if (!matchesSignature(buffer, file.type || '')) {
      return NextResponse.json({ error: 'File content does not match its declared type' }, { status: 415 });
    }
    const base64 = buffer.toString('base64');
    const dataUri = `data:${file.type || 'image/jpeg'};base64,${base64}`;

    const result = await cloudinary.uploader.upload(dataUri, {
      folder: 'houseoflettings/properties',
    });

    return NextResponse.json({ url: result.secure_url });
  } catch (err: any) {
    console.error('Cloudinary upload error:', err);
    return NextResponse.json({ error: err.message || 'Upload failed' }, { status: 500 });
  }
}