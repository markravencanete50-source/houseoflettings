// lib/rateLimit.ts
// Lightweight per-IP fixed-window rate limiter for public API routes.
// In-memory, so on Vercel it is per-lambda-instance — best-effort protection
// against casual abuse/spam floods, not a hard distributed guarantee. If abuse
// becomes real, swap the store for Upstash Ratelimit without changing callers.

type Window = { count: number; resetAt: number };

const buckets = new Map<string, Window>();
const MAX_BUCKETS = 10_000; // memory safety valve

function clientIp(request: Request): string {
  const fwd = request.headers.get('x-forwarded-for');
  return fwd ? fwd.split(',')[0].trim() : 'unknown';
}

/**
 * Returns null when the request is allowed, or a ready-to-return 429 Response
 * when the caller has exceeded `limit` requests per `windowMs` for `name`.
 */
export function rateLimit(
  request: Request,
  name: string,
  limit: number,
  windowMs: number,
): Response | null {
  const now = Date.now();
  const key = `${name}:${clientIp(request)}`;

  const win = buckets.get(key);
  if (!win || now >= win.resetAt) {
    if (buckets.size >= MAX_BUCKETS) {
      // Drop expired windows before giving up on tracking.
      buckets.forEach((w, k) => { if (now >= w.resetAt) buckets.delete(k); });
    }
    if (buckets.size < MAX_BUCKETS) buckets.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }

  win.count += 1;
  if (win.count > limit) {
    const retryAfter = Math.max(1, Math.ceil((win.resetAt - now) / 1000));
    return Response.json(
      { message: 'Too many requests. Please try again shortly.' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } },
    );
  }
  return null;
}
