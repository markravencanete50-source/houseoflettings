// services/auth.ts
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { AppUser, UserRole } from '@/lib/types';

// ── Sign Up ──────────────────────────────────────────────────
export async function signUp(
  email: string,
  password: string,
  name: string,
  role: UserRole,
  phone?: string
): Promise<AppUser> {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const uid = credential.user.uid;

  const userData: Omit<AppUser, 'uid'> = {
    name,
    email,
    role,
    phone: phone || '',
    createdAt: new Date(),
  };

  await setDoc(doc(db, 'users', uid), {
    ...userData,
    createdAt: serverTimestamp(),
  });

  return { uid, ...userData };
}

// ── Sign In ──────────────────────────────────────────────────
export async function signIn(email: string, password: string): Promise<AppUser> {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const userDoc = await getDoc(doc(db, 'users', credential.user.uid));

  if (!userDoc.exists()) {
    throw new Error('User profile not found. Please contact support.');
  }

  const data = userDoc.data();
  return {
    uid: credential.user.uid,
    name: data.name,
    email: data.email,
    role: data.role,
    phone: data.phone,
    createdAt: data.createdAt?.toDate() || new Date(),
  };
}

// ── Sign Out ─────────────────────────────────────────────────
export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

// ── Get User Profile ─────────────────────────────────────────
export async function getUserProfile(uid: string): Promise<AppUser | null> {
  const userDoc = await getDoc(doc(db, 'users', uid));
  if (!userDoc.exists()) return null;

  const data = userDoc.data();
  return {
    uid,
    name: data.name,
    email: data.email,
    role: data.role,
    phone: data.phone,
    createdAt: data.createdAt?.toDate() || new Date(),
  };
}

// ── Auth State Observer ───────────────────────────────────────
export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// ── Redirect after login based on role ───────────────────────
export function getDashboardPath(role: UserRole): string {
  switch (role) {
    case 'landlord': return '/dashboard/landlord';
    case 'tenant':   return '/dashboard/tenant';
    case 'admin':    return '/admin';
    default:         return '/';
  }
}
