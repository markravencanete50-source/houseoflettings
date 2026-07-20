# Security audit & hardening — July 2026

A white-hat style pass over the whole site: every public API route, the auth
paths, the Firestore rules, the email pipelines, and every place a
user-supplied link is stored or rendered. This file records what was found,
what was fixed, and where the remaining operational duties live.

## What was already in place (kept as-is)

- Per-request **nonce-based CSP** with `strict-dynamic` (middleware.ts) plus
  HSTS, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy
  (next.config.js).
- **Firestore rules** with role checks, no client write path to the
  form collections, and admin-gated user listing (firestore.rules — applied
  via the Firebase console; the repo file is the record).
- Per-IP **rate limiting** on all form-submission routes and team login
  (lib/rateLimit.ts).
- Server-side staff/admin gate on `/api/staff/*` via Firebase session
  cookie / ID token (lib/staffApiAuth.ts).
- Portal lookup protected by a constant-time shared-secret check that fails
  closed when unconfigured.

## Findings fixed in this pass

### 1. Link injection through public forms (high)
Every public form route accepted arbitrary strings in its upload-URL fields
(`photoUrls`, `govIdUrls`, `proofOfPaymentUrls`, …). Those URLs are stored in
Firestore, emailed to the office as clickable `<a href>` links from a trusted
internal address, and rendered as buttons in the admin/staff dashboards — so
anyone could plant `javascript:` or phishing links in front of staff.

**Fix (layered):**
- `lib/security.ts` — new shared module. Upload URLs must be `https` on an
  allowlisted upload host (`res.cloudinary.com`, `firebasestorage.googleapis.com`),
  bounded in count and length. Applied at the API boundary in
  maintenance, guarantor, tenant-application, landlord-registration and
  service-order, so store, email and Drive backup all get clean values.
- Dashboards wrap stored hrefs in `safeLinkHref()` (collapses anything that
  isn't plain http(s) to `#`) — defence in depth for records written before
  this change. All such links carry `rel="noopener noreferrer"`.

### 2. HTML injection into email (high)
The same routes interpolated raw user text into email HTML templates. All
nine email-sending routes now build their HTML from an `htmlEscapeDeep()`
copy of the payload; Firestore keeps the raw values.

### 3. Analytics exposure (medium)
`GET /api/track` returned the full analytics summary (views by country, page,
day) to anyone. Now requires a staff/admin session (`requireStaff`).

### 4. Third-party API proxying (medium)
- `/api/google-reviews` forwarded a client-chosen `fields` parameter to the
  Places API on our key — effectively an open Places proxy. Fields are now
  fixed server-side, `placeId` is validated, and the route is rate limited.
- `/api/address-lookup` (metered Homedata API) had no throttle or input
  validation. Now rate limited with a strict postcode pattern.

### 5. Login throttling fallback (medium)
Team login was limited per-IP only, which rotating IPs sidestep. Added a
second, per-email fixed window (5 attempts / 15 min) via `rateLimitByKey` on
top of the per-IP limit and Firebase's own TOO_MANY_ATTEMPTS.

### 6. Weak credential generation (medium)
`/api/admin/staff-users` created accounts with a `Math.random()` temp
password. Now `crypto.randomBytes(24)`, plus email format validation and a
rate limit.

### 7. Upload content sniffing (low/medium)
`/api/upload` trusted the client-declared MIME type. Files are now also
checked against their magic bytes (JPEG/PNG/GIF/WebP/HEIC/AVIF/PDF) before
being forwarded to Cloudinary. A `pdfBase64` attachment field on the form
routes must be a bounded string.

### 8. Coverage gaps in rate limiting (low)
Added per-IP limits to the remaining public endpoints:
viewing-availability, viewing-schedule, property-availability,
inspection-availability, `/api/me`, team-logout. The limiter itself gained a
client-IP fallback header chain (`x-forwarded-for` → `x-real-ip` →
`x-vercel-forwarded-for` → `cf-connecting-ip`) so requests are still bucketed
when the primary header is absent.

### 9. Headers & rules records (low)
- Added `Cross-Origin-Opener-Policy: same-origin-allow-popups` and
  `X-Permitted-Cross-Domain-Policies: none`.
- firestore.rules now names `guarantorForms`, `landlordRegistrations` and
  `analytics` explicitly (server-written, admin-read/no client access) instead
  of relying silently on default deny. **Remember: paste the updated rules
  into the Firebase console — the repo file is a record, not deployed.**

## Operational notes

- The in-memory rate limiter is per-lambda-instance — honest best-effort. If
  abuse becomes real, swap the store in `lib/rateLimit.ts` for Upstash
  Ratelimit; callers won't change.
- `NEXT_PUBLIC_FIREBASE_API_KEY` and `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY` are
  public-by-design keys; restrict them by HTTP referrer / API in the Google
  Cloud console as the second layer.
- Secrets (`FIREBASE_PRIVATE_KEY`, `CLOUDINARY_API_SECRET`,
  `PORTAL_LOOKUP_SECRET`, `RESEND_API_KEY`, `HOMEDATA_API_KEY`) live only in
  Vercel env vars — keep it that way; nothing in the repo embeds them.
