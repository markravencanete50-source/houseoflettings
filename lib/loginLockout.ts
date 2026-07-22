// lib/loginLockout.ts
// Persistent (Firestore-backed) account lockout for the landlord portal: three
// consecutive failed sign-ins locks the account for 24 hours. Persistent — not
// the in-memory rate limiter — so the lock survives across Vercel lambda
// instances and restarts. Resetting the password (activation or change) clears
// it, which is the documented way back in before the 24h elapses.
//
// Keyed by the lowercased email. Trade-off: this lets someone lock a known
// landlord's account by spamming wrong passwords, but that is exactly the
// behaviour requested, and the reset-password path is the escape hatch.
import { FieldValue, type Firestore } from 'firebase-admin/firestore';

const COLLECTION = 'landlordLoginLockouts';
export const MAX_FAILS = 3;
export const LOCK_MS = 24 * 60 * 60 * 1000;

const docId = (email: string) => email.trim().toLowerCase().slice(0, 200);

export type LockState = { locked: boolean; until: number; hoursLeft: number };

export async function getLockState(db: Firestore, email: string): Promise<LockState> {
  const snap = await db.collection(COLLECTION).doc(docId(email)).get();
  const d = snap.data();
  const until = Number(d?.lockedUntil || 0);
  const locked = until > Date.now();
  return { locked, until, hoursLeft: locked ? Math.ceil((until - Date.now()) / (60 * 60 * 1000)) : 0 };
}

// Record a failed attempt. Returns whether the account is now locked and how
// many attempts remain before it would be.
export async function registerFailure(db: Firestore, email: string): Promise<{ locked: boolean; remaining: number }> {
  const ref = db.collection(COLLECTION).doc(docId(email));
  const snap = await ref.get();
  const prev = snap.exists ? Number(snap.data()?.fails || 0) : 0;
  const fails = prev + 1;
  const lock = fails >= MAX_FAILS;
  await ref.set({
    fails,
    lockedUntil: lock ? Date.now() + LOCK_MS : 0,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
  return { locked: lock, remaining: Math.max(0, MAX_FAILS - fails) };
}

// Clear the counter — on a successful login, or when the password is reset.
export async function clearLockout(db: Firestore, email: string): Promise<void> {
  try { await db.collection(COLLECTION).doc(docId(email)).delete(); } catch { /* nothing to clear */ }
}
