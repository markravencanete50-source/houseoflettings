// lib/imageUrl.ts
// Cloudinary delivery optimisation. Listing photos are uploaded at full size
// (often multi-MB PNGs); serving them raw makes cards slow to paint and prone
// to timing out on mobile connections. Cloudinary rewrites happen at the URL
// level — inserting `f_auto,q_auto,w_<n>,c_limit` after `/image/upload/` makes
// it transcode to WebP/AVIF, auto-compress and cap the width, typically a
// 10-20x byte saving. Non-Cloudinary URLs (Firebase Storage, local /images)
// are returned untouched.
const UPLOAD_MARKER = '/image/upload/';

export function optimizedImage(url: string, width = 800): string {
  if (!url) return url;
  const idx = url.indexOf(UPLOAD_MARKER);
  // Not Cloudinary, or already carries a transformation — leave alone.
  if (idx === -1 || /\/upload\/[^/]*(f_auto|q_auto|w_\d)/.test(url)) return url;
  return (
    url.slice(0, idx + UPLOAD_MARKER.length) +
    `f_auto,q_auto,w_${width},c_limit/` +
    url.slice(idx + UPLOAD_MARKER.length)
  );
}
