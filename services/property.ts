// services/property.ts
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  serverTimestamp,
  onSnapshot,
  Query,
  DocumentData,
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { Property, SearchFilters } from '@/lib/types';

// ── Upload Images to Firebase Storage ────────────────────────
export async function uploadPropertyImages(
  files: File[],
  propertyId: string
): Promise<string[]> {
  const urls: string[] = [];

  for (const file of files) {
    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
    const storageRef = ref(storage, `properties/${propertyId}/${fileName}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    urls.push(url);
  }

  return urls;
}

// ── Create Property ───────────────────────────────────────────
export async function createProperty(
  data: Omit<Property, 'id' | 'createdAt'>,
  imageFiles: File[]
): Promise<string> {
  // First create the doc to get an ID
  const docRef = await addDoc(collection(db, 'properties'), {
    ...data,
    images: data.images || [],
    createdAt: serverTimestamp(),
    status: 'active',
  });

  // Upload images if any
  if (imageFiles.length > 0) {
    const imageUrls = await uploadPropertyImages(imageFiles, docRef.id);
    await updateDoc(docRef, { images: imageUrls });
  }

  return docRef.id;
}

// ── Update Property ───────────────────────────────────────────
export async function updateProperty(
  id: string,
  data: Partial<Property>,
  newImageFiles?: File[]
): Promise<void> {
  const updateData: Partial<Property> = { ...data };

  if (newImageFiles && newImageFiles.length > 0) {
    const newUrls = await uploadPropertyImages(newImageFiles, id);
    updateData.images = [...(data.images || []), ...newUrls];
  }

  await updateDoc(doc(db, 'properties', id), updateData as DocumentData);
}

// ── Delete Property ───────────────────────────────────────────
export async function deleteProperty(id: string): Promise<void> {
  await deleteDoc(doc(db, 'properties', id));
}

// ── Get Single Property ───────────────────────────────────────
// Reads through the server route (Admin SDK) so it never hits client-side
// Firestore rules — see app/api/properties/route.ts.
export async function getProperty(id: string): Promise<Property | null> {
  try {
    const res = await fetch(`/api/properties?id=${encodeURIComponent(id)}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const json = await res.json().catch(() => ({}));
    return (json.property ?? null) as Property | null;
  } catch {
    return null;
  }
}

// ── Get All Active Properties (with filters) ──────────────────
export async function getProperties(filters?: SearchFilters): Promise<Property[]> {
  // Read active listings from the server route (bypasses client Firestore
  // rules); sorting and filtering stay client-side.
  const res = await fetch('/api/properties', { cache: 'no-store' });
  const json = await res.json().catch(() => ({ properties: [] }));
  let properties = (json.properties || []) as Property[];

  // Sort by createdAt descending client-side (avoids composite index)
  properties.sort((a: any, b: any) => {
    const aTime = a.createdAt?.seconds ?? 0;
    const bTime = b.createdAt?.seconds ?? 0;
    return bTime - aTime;
  });

  // Apply filters client-side
  if (filters?.minPrice !== '' && filters?.minPrice !== undefined) {
    properties = properties.filter(p => p.price >= Number(filters.minPrice));
  }
  if (filters?.maxPrice !== '' && filters?.maxPrice !== undefined) {
    properties = properties.filter(p => p.price <= Number(filters.maxPrice));
  }
  if (filters?.bedrooms !== '' && filters?.bedrooms !== undefined) {
    properties = properties.filter(p => p.bedrooms >= Number(filters.bedrooms));
  }
  if (filters?.location) {
    const loc = filters.location.toLowerCase();
    properties = properties.filter(p =>
      p.location.toLowerCase().includes(loc) ||
      p.title.toLowerCase().includes(loc)
    );
  }

  return properties;
}

// ── Get Landlord's Properties ─────────────────────────────────
export async function getLandlordProperties(landlordId: string): Promise<Property[]> {
  const q = query(
    collection(db, 'properties'),
    where('landlordId', '==', landlordId)
  );
  const snap = await getDocs(q);
  const properties = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Property[];
  // Sort client-side to avoid composite index
  return properties.sort((a: any, b: any) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
}

// ── Real-time listener for property listing ───────────────────
export function subscribeToProperties(
  filters: SearchFilters,
  callback: (props: Property[]) => void
) {
  // Fetch active listings from the server route (Admin SDK) instead of a client
  // Firestore listener, so browsing works regardless of client-side rules. The
  // signature (returns an unsubscribe) is preserved for callers.
  let cancelled = false;
  fetch('/api/properties', { cache: 'no-store' })
    .then(r => (r.ok ? r.json() : { properties: [] }))
    .then((json: any) => {
      if (cancelled) return;
      let properties = (json.properties || []) as Property[];
      // Sort client-side to avoid composite index
      properties.sort((a: any, b: any) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));

    // Synchronous client-side filters. (The radius filter is applied in the
    // listings page after geocoding, since it needs async coordinate lookups.)
    if (filters.minPrice !== '') {
      properties = properties.filter(p => p.price >= Number(filters.minPrice));
    }
    if (filters.maxPrice !== '') {
      properties = properties.filter(p => p.price <= Number(filters.maxPrice));
    }
    if (filters.bedrooms !== '') {
      // Exact match, except 6 acts as "6 or more" (Leeds HMOs run to 6-8 beds).
      const b = Number(filters.bedrooms);
      properties = properties.filter(p => (b >= 6 ? p.bedrooms >= 6 : p.bedrooms === b));
    }
    if (filters.bathrooms !== '' && filters.bathrooms !== undefined) {
      const b = Number(filters.bathrooms);
      properties = properties.filter(p => (b >= 6 ? (p.bathrooms ?? 0) >= 6 : (p.bathrooms ?? 0) === b));
    }
    if (filters.propertyType) {
      // Older listings without an explicit type are treated as "whole".
      properties = properties.filter(p => (p.propertyType ?? 'whole') === filters.propertyType);
    }
    if (filters.furnished) {
      properties = properties.filter(p => p.furnished === filters.furnished);
    }

    // Text location match only when NOT doing a radius search (a radius search
    // is geographic, so a property near the point shouldn't be excluded just
    // because its location string doesn't contain the typed area name).
    const usingRadius =
      filters.radiusMiles !== '' && filters.radiusMiles !== undefined &&
      filters.lat != null && filters.lng != null;
    if (filters.location && !usingRadius) {
      const loc = filters.location.toLowerCase();
      properties = properties.filter(p =>
        p.location.toLowerCase().includes(loc) ||
        p.title.toLowerCase().includes(loc)
      );
    }

      callback(properties);
    })
    .catch(() => { if (!cancelled) callback([]); });
  return () => { cancelled = true; };
}

// ── Toggle property status (Admin) ───────────────────────────
export async function setPropertyStatus(
  id: string,
  status: 'active' | 'inactive'
): Promise<void> {
  await updateDoc(doc(db, 'properties', id), { status });
}
