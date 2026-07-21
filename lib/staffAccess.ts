// lib/staffAccess.ts
// The registry of staff-dashboard features and per-user permission resolution.
// Shared by the staff dashboard (sidebar), the admin Users tab (access editor)
// and the /api/staff/* routes (server-side enforcement). Safe for the client —
// no firebase-admin imports here.
//
// A staff user's Firestore doc may carry `permissions: string[]`. When the
// field is absent they get DEFAULT_STAFF_PERMISSIONS. Admins always have every
// feature. Toggling a feature for one staff member is a data change made from
// the admin dashboard — no code deploy needed.

export const STAFF_FEATURES = [
  { id: 'properties',    label: 'Properties',    icon: '🏠' },
  { id: 'applications',  label: 'Applications',  icon: '📝' },
  { id: 'agreements',    label: 'Agreements',    icon: '📄' },
  { id: 'rent-reviews',  label: 'Rent Reviews',  icon: '🔁' },
  { id: 'maintenance',   label: 'Maintenance',   icon: '🔧' },
  { id: 'orders',        label: 'Orders',        icon: '🛒' },
  { id: 'valuations',    label: 'Valuations',    icon: '📋' },
  { id: 'reviews',       label: 'Reviews',       icon: '⭐' },
  { id: 'post',          label: 'Post Property', icon: '➕' },
] as const;

export type StaffFeature = (typeof STAFF_FEATURES)[number]['id'];

export const STAFF_FEATURE_IDS: StaffFeature[] = STAFF_FEATURES.map(f => f.id);

// What a staff member sees when no explicit permissions have been set.
export const DEFAULT_STAFF_PERMISSIONS: StaffFeature[] = [
  'properties', 'applications', 'agreements', 'rent-reviews', 'maintenance', 'orders', 'valuations', 'post',
];

// Resolve the feature list for a profile (admin = everything; staff = their
// permissions array or the default; anyone else = nothing).
export function staffPermissions(
  profile: { role?: string; permissions?: string[] } | null | undefined,
): StaffFeature[] {
  if (!profile) return [];
  if (profile.role === 'admin') return [...STAFF_FEATURE_IDS];
  if (profile.role !== 'staff') return [];
  const perms = Array.isArray(profile.permissions) ? profile.permissions : null;
  if (!perms) return [...DEFAULT_STAFF_PERMISSIONS];
  return STAFF_FEATURE_IDS.filter(id => perms.includes(id));
}
