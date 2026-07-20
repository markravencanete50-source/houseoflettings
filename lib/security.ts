// lib/security.ts
// Shared input-hardening helpers used by the public /api form routes and the
// admin/staff dashboards. Two concerns live here:
//
//  1. Links. Public forms submit arrays of upload URLs (photos, ID documents,
//     payslips …) that are later stored, emailed to the office as clickable
//     <a href> links, and rendered in the admin dashboard. Without validation
//     that is a stored link-injection channel: anyone can POST a javascript:
//     URL or a phishing link and a staff member will receive it from a fully
//     trusted internal email address. Every upload URL must therefore be
//     https and point at one of the hosts our own upload flows actually use.
//
//  2. HTML escaping. The form routes build email HTML with template literals.
//     Escaping user text before interpolation stops HTML/link injection into
//     those emails without changing what gets stored in Firestore.
//
// These are pure functions with no server-only imports, so client components
// (dashboards) can use safeLinkHref too.

/** Hosts our own upload flows write to. Direct-to-Cloudinary uploads and the
 *  /api/upload route both end at res.cloudinary.com; legacy records may point
 *  at Firebase Storage. Nothing else is a legitimate uploaded file. */
const ALLOWED_UPLOAD_HOSTS = new Set([
  'res.cloudinary.com',
  'firebasestorage.googleapis.com',
]);

const MAX_URL_LENGTH = 2048;
const MAX_URLS_PER_FIELD = 30;

/** Escape a value for interpolation into HTML text or attribute context. */
export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Recursively escape every string in a JSON-ish payload. The form routes pass
 * the escaped copy to their email builders and keep the raw copy for Firestore,
 * so one call covers every interpolation in the template without touching the
 * stored data.
 */
export function htmlEscapeDeep<T>(value: T): T {
  if (typeof value === 'string') return escapeHtml(value) as unknown as T;
  if (Array.isArray(value)) return value.map(htmlEscapeDeep) as unknown as T;
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = htmlEscapeDeep(v);
    }
    return out as T;
  }
  return value;
}

/** True for a well-formed http(s) URL with no embedded credentials. */
export function isSafeHttpUrl(raw: unknown): boolean {
  if (typeof raw !== 'string' || !raw || raw.length > MAX_URL_LENGTH) return false;
  try {
    const u = new URL(raw);
    return (u.protocol === 'https:' || u.protocol === 'http:') && !u.username && !u.password;
  } catch {
    return false;
  }
}

/** True only for https URLs on the upload-host allowlist. */
export function isAllowedUploadUrl(raw: unknown): boolean {
  if (typeof raw !== 'string' || !raw || raw.length > MAX_URL_LENGTH) return false;
  try {
    const u = new URL(raw);
    return u.protocol === 'https:' && !u.username && !u.password && ALLOWED_UPLOAD_HOSTS.has(u.hostname);
  } catch {
    return false;
  }
}

/** Keep only allowlisted upload URLs, capped so a hostile payload can't stuff
 *  thousands of entries into an email or Firestore doc. */
export function sanitizeUploadUrls(value: unknown, maxCount = MAX_URLS_PER_FIELD): string[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, maxCount).filter(isAllowedUploadUrl) as string[];
}

/**
 * Walk a form payload and sanitize every URL-shaped field in place:
 * keys ending in "Urls" (arrays) and keys ending in "Url"/named "url"
 * (single strings). Disallowed entries are dropped (arrays) or blanked
 * (strings) rather than rejected, so one bad link never voids a whole
 * application — the legitimate files still go through.
 */
export function sanitizeUploadUrlFieldsDeep<T>(value: T): T {
  if (Array.isArray(value)) return value.map(sanitizeUploadUrlFieldsDeep) as unknown as T;
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (/urls$/i.test(k) && Array.isArray(v)) {
        out[k] = sanitizeUploadUrls(v);
      } else if (/url$/i.test(k) && typeof v === 'string') {
        out[k] = isAllowedUploadUrl(v) ? v : '';
      } else {
        out[k] = sanitizeUploadUrlFieldsDeep(v);
      }
    }
    return out as T;
  }
  return value;
}

/** Href guard for rendering stored, user-supplied links in the dashboards:
 *  anything that isn't plain http(s) collapses to '#'. Defense in depth on
 *  top of the API-side sanitizers, for records written before them. */
export function safeLinkHref(raw: unknown): string {
  return isSafeHttpUrl(raw) ? (raw as string) : '#';
}
