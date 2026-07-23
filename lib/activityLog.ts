// lib/activityLog.ts
// Staff activity logging: a single, tamper-resistant audit trail of what staff
// members (Andrea, Adila, …) click and update in the dashboard, surfaced to
// admins (Mark / Kasra) under Activity Logs.
//
// Design notes:
// - WHO is always derived server-side from the verified session — never from the
//   client — so a log entry can't be forged to blame someone else.
// - WHAT is captured for writes (POST/PATCH/DELETE = "updating") and explicit
//   section clicks ("clicking"). Plain GET reads are NOT logged: the brief is to
//   record only what staff click or change, not every page view.
// - Entries live in the `staffActivityLogs` collection, written and read ONLY via
//   Admin-SDK routes, so no Firestore client rules are involved.
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb, type StaffAuth } from './staffApiAuth';

export const ACTIVITY_COLLECTION = 'staffActivityLogs';

// Map an /api/staff/* path to the dashboard feature it belongs to, so admins can
// filter the log by area. Keep in sync with STAFF_FEATURES in lib/staffAccess.ts.
export function featureFromPath(path: string): string {
  const p = (path || '').split('?')[0];
  if (p.includes('/staff/rent-review-properties')) return 'rent-reviews';
  if (p.includes('/staff/rent-reviews')) return 'rent-reviews';
  if (p.includes('/staff/properties')) return 'properties';
  if (p.includes('/staff/applications')) return 'applications';
  if (p.includes('/staff/agreements')) return 'agreements';
  if (p.includes('/staff/coupons')) return 'coupons';
  if (p.includes('/staff/maintenance')) return 'maintenance';
  if (p.includes('/staff/orders')) return 'orders';
  if (p.includes('/staff/valuations')) return 'valuations';
  if (p.includes('/staff/reviews')) return 'reviews';
  if (p.includes('/staff/landlords')) return 'landlords';
  return 'other';
}

const FEATURE_NOUN: Record<string, string> = {
  'properties': 'property',
  'applications': 'application',
  'agreements': 'landlord registration',
  'coupons': 'discount coupon',
  'rent-reviews': 'rent review',
  'maintenance': 'maintenance request',
  'orders': 'order',
  'valuations': 'valuation',
  'reviews': 'review',
  'landlords': 'landlord',
  'other': 'record',
};

const AVAILABILITY_LABEL: Record<string, string> = {
  'available': 'Available',
  'pending': 'Pending',
  'let-agreed': 'Let Agreed',
};

// Only these body fields are ever forwarded from the client and stored — a
// deliberate whitelist so we never quietly log applicant PII or free-text notes.
const META_WHITELIST = [
  'id', 'status', 'availability', 'letAgreed', 'action', 'mode',
  'title', 'location', 'address', 'author_name', 'rating', 'active',
] as const;

export function sanitizeMeta(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== 'object') return {};
  const src = input as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const k of META_WHITELIST) {
    if (!(k in src)) continue;
    const v = src[k];
    if (typeof v === 'string') out[k] = v.slice(0, 120);
    else if (typeof v === 'number' || typeof v === 'boolean') out[k] = v;
  }
  return out;
}

// Turn method + feature + a little meta into a human sentence an admin can scan,
// e.g. "Set property availability to Let Agreed" or "Deleted a review".
export function describeAction(
  type: string,
  method: string,
  feature: string,
  meta: Record<string, unknown>,
  section?: string,
): { action: string; summary: string } {
  const noun = FEATURE_NOUN[feature] || 'record';

  if (type === 'view') {
    const label = (section || feature || 'section').toString();
    return { action: 'Opened section', summary: `Opened ${label}` };
  }
  if (type === 'login') {
    return { action: 'Signed in', summary: 'Signed in to the staff dashboard' };
  }

  const m = (method || '').toUpperCase();

  if (m === 'DELETE') {
    return { action: 'Deleted', summary: `Deleted a ${noun}` };
  }
  if (m === 'POST') {
    return { action: 'Created', summary: `Created a ${noun}` };
  }
  // PATCH / everything else = an update; try to say exactly what changed.
  if ('availability' in meta) {
    const label = AVAILABILITY_LABEL[String(meta.availability)] || String(meta.availability);
    return { action: 'Changed status', summary: `Set ${noun} availability to ${label}` };
  }
  if ('status' in meta) {
    return { action: 'Changed status', summary: `Set ${noun} status to "${meta.status}"` };
  }
  if (meta.action === 'edit' || meta.action === 'reissue') {
    return { action: 'Edited', summary: `Edited a ${noun}` };
  }
  if ('active' in meta) {
    return { action: 'Changed status', summary: `${meta.active ? 'Activated' : 'Deactivated'} a ${noun}` };
  }
  return { action: 'Updated', summary: `Updated a ${noun}` };
}

// Convenience for the /api/staff/* write handlers: log one write action from
// the server, where the actor is already verified. Awaited by callers so the
// entry is committed before the serverless response returns (a fire-and-forget
// write can be frozen by Vercel after the response). Never throws.
export async function logAction(
  actor: StaffAuth,
  method: 'POST' | 'PATCH' | 'DELETE',
  path: string,
  meta?: Record<string, unknown>,
): Promise<void> {
  await recordActivity(actor, { type: 'action', method, path, meta });
}

export type ActivityInput = {
  type?: string;            // 'action' | 'view' | 'login'
  method?: string;          // POST | PATCH | DELETE
  path?: string;            // the /api/staff/* path acted on
  section?: string;         // for 'view' clicks: which dashboard section
  status?: number;          // HTTP status the write returned (success/failure)
  meta?: unknown;           // whitelisted body fields (see sanitizeMeta)
  userAgent?: string | null;
};

// Persist one activity entry. Never throws to the caller — logging must not be
// able to break the action it is recording.
export async function recordActivity(actor: StaffAuth, input: ActivityInput): Promise<void> {
  try {
    const type = input.type || 'action';
    const feature = featureFromPath(input.path || '');
    const meta = sanitizeMeta(input.meta);
    const { action, summary } = describeAction(type, input.method || '', feature, meta, input.section);

    await getAdminDb().collection(ACTIVITY_COLLECTION).add({
      actorUid: actor.uid,
      actorName: actor.name || '',
      actorEmail: actor.email || '',
      actorRole: actor.role,
      type,
      method: (input.method || '').toUpperCase() || null,
      path: (input.path || '').split('?')[0].slice(0, 200) || null,
      feature,
      section: input.section ? String(input.section).slice(0, 60) : null,
      action,
      summary,
      targetId: typeof meta.id === 'string' ? meta.id : null,
      httpStatus: Number.isFinite(input.status) ? input.status : null,
      ok: typeof input.status === 'number' ? input.status >= 200 && input.status < 300 : null,
      meta,
      userAgent: input.userAgent ? String(input.userAgent).slice(0, 300) : null,
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch (e) {
    console.error('recordActivity failed:', e);
  }
}
