// services/admin.ts
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  query,
  orderBy,
  getCountFromServer,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AppUser, Property } from '@/lib/types';

// ── Get all users ─────────────────────────────────────────────
export async function getAllUsers(): Promise<AppUser[]> {
  const snap = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc')));
  return snap.docs.map(d => {
    const data = d.data();
    return {
      uid: d.id,
      name: data.name,
      email: data.email,
      role: data.role,
      phone: data.phone,
      createdAt: data.createdAt?.toDate() || new Date(),
    } as AppUser;
  });
}

// ── Get all properties ────────────────────────────────────────
export async function getAllProperties(): Promise<Property[]> {
  const snap = await getDocs(query(collection(db, 'properties'), orderBy('createdAt', 'desc')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() })) as Property[];
}

// ── Delete user record (Firestore only — Auth deletion requires Admin SDK) ──
export async function deleteUserRecord(uid: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid));
}

// ── Delete property ───────────────────────────────────────────
export async function adminDeleteProperty(id: string): Promise<void> {
  await deleteDoc(doc(db, 'properties', id));
}

// ── Toggle property status ────────────────────────────────────
export async function adminSetPropertyStatus(
  id: string,
  status: 'active' | 'inactive'
): Promise<void> {
  await updateDoc(doc(db, 'properties', id), { status });
}

// ── Toggle "Let Agreed" ───────────────────────────────────────
export async function adminSetPropertyLetAgreed(
  id: string,
  letAgreed: boolean
): Promise<void> {
  await updateDoc(doc(db, 'properties', id), { letAgreed });
}

// ── Analytics ────────────────────────────────────────────────
export async function getAnalytics() {
  const safeCount = async (col: string) => {
    try {
      const snap = await getCountFromServer(collection(db, col));
      return snap.data().count;
    } catch {
      return 0;
    }
  };

  const [totalUsers, totalProperties, totalChats] = await Promise.all([
    safeCount('users'),
    safeCount('properties'),
    safeCount('chats'),
  ]);

  // Active properties + role breakdown
  const allPropsSnap = await getDocs(collection(db, 'properties'));
  const active = allPropsSnap.docs.filter(d => d.data().status === 'active').length;

  const usersSnap = await getDocs(collection(db, 'users'));
  const landlordCount = usersSnap.docs.filter(d => d.data().role === 'landlord').length;
  const tenantCount = usersSnap.docs.filter(d => d.data().role === 'tenant').length;

  return {
    totalUsers,
    totalProperties,
    totalChats,
    activeProperties: active,
    landlords: landlordCount,
    tenants: tenantCount,
  };
}
