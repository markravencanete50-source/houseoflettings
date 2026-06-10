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
export async function getProperty(id: string): Promise<Property | null> {
  const snap = await getDoc(doc(db, 'properties', id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Property;
}

// ── Get All Active Properties (with filters) ──────────────────
export async function getProperties(filters?: SearchFilters): Promise<Property[]> {
  // Use simple query to avoid composite index requirement
  // Sorting and extra filtering done client-side
  let q: Query = query(
    collection(db, 'properties'),
    where('status', '==', 'active')
  );

  const snap = await getDocs(q);
  let properties = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Property[];

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
  let q: Query = query(
    collection(db, 'properties'),
    where('status', '==', 'active'),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snap) => {
    let properties = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Property[];

    // Client-side filters
    if (filters.minPrice !== '') {
      properties = properties.filter(p => p.price >= Number(filters.minPrice));
    }
    if (filters.maxPrice !== '') {
      properties = properties.filter(p => p.price <= Number(filters.maxPrice));
    }
    if (filters.bedrooms !== '') {
      properties = properties.filter(p => p.bedrooms >= Number(filters.bedrooms));
    }
    if (filters.location) {
      const loc = filters.location.toLowerCase();
      properties = properties.filter(p =>
        p.location.toLowerCase().includes(loc) ||
        p.title.toLowerCase().includes(loc)
      );
    }

    callback(properties);
  });
}

// ── Toggle property status (Admin) ───────────────────────────
export async function setPropertyStatus(
  id: string,
  status: 'active' | 'inactive'
): Promise<void> {
  await updateDoc(doc(db, 'properties', id), { status });
}
