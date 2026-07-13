// middleware.ts
// Per-request nonce-based Content-Security-Policy. A static CSP would need
// 'unsafe-inline' in script-src (Next.js injects inline bootstrap scripts),
// which caps the securityheaders.com grade at A and weakens XSS protection.
// Instead we mint a nonce per request; Next.js reads it from the request's
// content-security-policy header and stamps it onto its own inline scripts.
// 'strict-dynamic' then lets those trusted scripts load further scripts
// (e.g. Google Maps via createElement). The 'unsafe-inline' + https: entries
// are fallbacks for old browsers that ignore nonces/strict-dynamic — modern
// browsers ignore them when a nonce is present.
//
// The other security headers (HSTS, X-Frame-Options, …) live in next.config.js.
// NOTE: nonce-based CSP requires dynamic rendering — see the force-dynamic
// export in app/layout.tsx. Remove both together or not at all.
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const isDev = process.env.NODE_ENV === 'development';

  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ''} 'unsafe-inline' https:`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob: https://res.cloudinary.com https://images.unsplash.com https://*.googleapis.com https://*.gstatic.com https://*.ggpht.com https://*.googleusercontent.com",
    "media-src 'self' blob: https://res.cloudinary.com",
    `connect-src 'self' https://*.googleapis.com https://api.cloudinary.com https://res.cloudinary.com${isDev ? ' ws:' : ''}`,
    'frame-src https://www.google.com https://landlord-matching.vercel.app',
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    'upgrade-insecure-requests',
  ].join('; ');

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('content-security-policy', csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('content-security-policy', csp);
  return response;
}

export const config = {
  matcher: [
    // Everything except static assets — those can't run scripts, and skipping
    // them keeps middleware invocations (and cost) down.
    {
      source: '/((?!_next/static|_next/image|favicon.ico|images/|.*\\.(?:png|jpg|jpeg|webp|avif|gif|svg|ico|txt|xml|woff2?)$).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
