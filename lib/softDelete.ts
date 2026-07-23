// lib/softDelete.ts
// A recycle bin for deletions. Instead of hard-deleting a document, we snapshot
// it into the `deletedItems` collection and remove the original. Admins can
// restore it within a 24h window; after that it is permanently purged (by the
// daily cron /api/cron/purge-deleted, and lazily whenever the admin Deleted tab
// is opened). This is the safety net for "a delete slipped through" — including
// the case where a staff account somehow bypassed the admin-only delete guards.
//
// Everything here runs with the Admin SDK (server-side only). The bin is never
// touched from a browser — deletedItems is denied to all clients in
// firestore.rules; the /api/admin/deleted routes are the only way in.
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getAdminDb } from './staffApiAuth';

export const TRASH_COLLECTION = 'deletedItems';
export const RETENTION_MS = 24 * 60 * 60 * 1000; // 24 hours

type Actor = { uid: string; name?: string; role?: string };

// A human label for the bin list, from whatever identifying field the doc has.
function buildLabel(data: Record<string, any>, fallbackId: string): string {
  const v = data.title || data.address || data.author_name || data.name || data.location || fallbackId;
  return String(v).slice(0, 140);
}

// Move one document into the recycle bin, then delete the original. Returns
// { ok:false, reason:'not-found' } if the document no longer exists.
export async function softDeleteDoc(opts: {
  collection: string;
  docId: string;
  actor: Actor;
  typeLabel: string; // e.g. 'Property', 'Review', 'Rent-review property'
}): Promise<{ ok: boolean; reason?: string; trashId?: string }> {
  const db = getAdminDb();
  const ref = db.collection(opts.collection).doc(opts.docId);
  const snap = await ref.get();
  if (!snap.exists) return { ok: false, reason: 'not-found' };

  const data = snap.data() || {};
  // Write the bin entry FIRST — if this throws we never delete the original.
  const trashRef = await db.collection(TRASH_COLLECTION).add({
    sourceCollection: opts.collection,
    originalId: opts.docId,
    typeLabel: opts.typeLabel,
    label: buildLabel(data, opts.docId),
    data,
    deletedByUid: opts.actor.uid,
    deletedByName: opts.actor.name || '',
    deletedByRole: opts.actor.role || '',
    deletedAt: FieldValue.serverTimestamp(),
    expiresAt: Timestamp.fromMillis(Date.now() + RETENTION_MS),
  });
  await ref.delete();
  return { ok: true, trashId: trashRef.id };
}

// Permanently remove every bin entry whose 24h window has passed. Called by the
// cron and lazily on the admin Deleted read. Returns how many were purged.
export async function purgeExpiredTrash(): Promise<number> {
  const db = getAdminDb();
  const now = Timestamp.fromMillis(Date.now());
  const snap = await db.collection(TRASH_COLLECTION).where('expiresAt', '<=', now).limit(400).get();
  if (snap.empty) return 0;
  const batch = db.batch();
  snap.docs.forEach(d => batch.delete(d.ref));
  await batch.commit();
  return snap.size;
}

// Restore a binned document back to its original collection and id, then remove
// the bin entry. Refuses (and purges) if the 24h window has already passed.
export async function restoreTrashItem(trashId: string): Promise<{ ok: boolean; reason?: string }> {
  const db = getAdminDb();
  const ref = db.collection(TRASH_COLLECTION).doc(trashId);
  const snap = await ref.get();
  if (!snap.exists) return { ok: false, reason: 'not-found' };

  const t = snap.data() as Record<string, any>;
  const expMs = t.expiresAt?.toMillis?.() ?? 0;
  if (expMs && expMs <= Date.now()) {
    await ref.delete();
    return { ok: false, reason: 'expired' };
  }
  if (!t.sourceCollection || !t.originalId) {
    return { ok: false, reason: 'corrupt' };
  }
  // Put it back exactly where it was (same id, same data).
  await db.collection(t.sourceCollection).doc(t.originalId).set(t.data || {});
  await ref.delete();
  return { ok: true };
}

// Permanently delete a single bin entry now (the "Delete forever" button).
export async function purgeTrashItem(trashId: string): Promise<{ ok: boolean; reason?: string }> {
  const db = getAdminDb();
  const ref = db.collection(TRASH_COLLECTION).doc(trashId);
  const snap = await ref.get();
  if (!snap.exists) return { ok: false, reason: 'not-found' };
  await ref.delete();
  return { ok: true };
}

// List the current bin contents (newest first), already free of expired items.
export async function listTrash(): Promise<any[]> {
  await purgeExpiredTrash();
  const db = getAdminDb();
  const snap = await db.collection(TRASH_COLLECTION).orderBy('deletedAt', 'desc').limit(300).get();
  return snap.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      sourceCollection: data.sourceCollection || '',
      originalId: data.originalId || '',
      typeLabel: data.typeLabel || 'Item',
      label: data.label || data.originalId || '',
      deletedByUid: data.deletedByUid || '',
      deletedByName: data.deletedByName || '',
      deletedByRole: data.deletedByRole || '',
      deletedAt: data.deletedAt?.toDate?.()?.toISOString?.() || null,
      expiresAt: data.expiresAt?.toDate?.()?.toISOString?.() || null,
    };
  });
}
