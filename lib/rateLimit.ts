// lib/rateLimit.ts
// Lightweight per-IP fixed-window rate limiter for public API routes.
// In-memory, so on Vercel it is per-lambda-instance — best-effort protection
// against casual abuse/spam floods, not a hard distributed guarantee. If abuse
// becomes real, swap the store for Upstash Ratelimit without changing callers.

type Window = { count: number; resetAt: number };

const buckets = new Map<string, Window>();
const MAX_BUCKETS = 10_000; // memory safety valve

// Client-IP header fallback chain. Vercel always sets x-forwarded-for, but if
// it's ever absent (different host, misconfigured proxy) we fall back through
// the other common proxy headers rather than letting every request share one
// bucket only when genuinely unattributable.
const IP_HEADERS = ['x-forwarded-for', 'x-real-ip', 'x-vercel-forwarded-for', 'cf-connecting-ip'];

function clientIp(request: Request): string {
  for (const header of IP_HEADERS) {
    const value = request.headers.get(header);
    if (value) {
      const ip = value.split(',')[0].trim();
      if (ip) return ip;
    }
  }
  return 'unknown';
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
  return rateLimitByKey(name, clientIp(request), limit, windowMs);
}

/**
 * Same fixed-window limiter, keyed by an arbitrary caller-chosen string
 * instead of the client IP. Use as a second layer where IP alone is too
 * coarse — e.g. per-email login throttling that a botnet's rotating IPs
 * can't sidestep.
 */
export function rateLimitByKey(
  name: string,
  rawKey: string,
  limit: number,
  windowMs: number,
): Response | null {
  const now = Date.now();
  // Bound the key so an attacker can't balloon the map with megabyte keys.
  const key = `${name}:${rawKey.slice(0, 200)}`;

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
